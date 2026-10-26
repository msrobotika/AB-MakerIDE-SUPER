// boards feature. Shared runtime context stays private to bootstrap.
import { reviewDisplayTarget } from './target_review.js';
export function define(context) {
  context.refreshDeviceHint = function refreshDeviceHint() {
    context.refreshSketchTargetNotice();
    const label = context.$('#deviceHint'),
      p = context.state.ports.find((x) => x.port === context.state.port);
    if (p && context.boardIdentity.result?.port === p.port) {
      label.textContent = context.boardIdentity.result.message;
      return;
    }
    if (!p) {
      label.textContent = context.state.ports.length
        ? 'Selecciona el puerto USB y el modelo de placa'
        : 'Conecta una placa y pulsa ↻';
      return;
    }
    const ch340 =
      /^(?:0x)?1a86$/i.test(String(p.vid || '')) && /^(?:0x)?7523$/i.test(String(p.pid || ''));
    const cp210 =
      /^(?:0x)?10c4$/i.test(String(p.vid || '')) && /^(?:0x)?ea60$/i.test(String(p.pid || ''));
    const detected = (p.boards || []).filter((b) =>
      context.state.choices.some((c) => c.fqbn === b.fqbn),
    );
    if (ch340 || cp210) {
      label.textContent = `${p.port}: conversor ${ch340 ? 'CH340' : 'CP210x'} · confirma el modelo manualmente`;
      return;
    }
    if (detected.length === 1) {
      label.textContent = `${p.port}: Arduino CLI sugiere ${detected[0].name} (verifica modelo)`;
      return;
    }
    label.textContent = ch340
      ? `${p.port}: conversor CH340 · confirma el modelo manualmente`
      : `${p.port}: ${String(p.name || 'Puerto USB').slice(0, 35)}`;
  };
  context.refreshSketchTargetNotice = function refreshSketchTargetNotice() {
    const onUnoWelcome =
      context.state.lang === 'cpp' &&
      context.state.fqbn !== 'arduino:avr:uno' &&
      context.$('#code').value.trim() === context.DEFAULT_CPP.trim();
    const warning =
      context.state.lang === 'cpp'
        ? reviewDisplayTarget(
            context.$('#code').value,
            context.state.fqbn,
            context.state.physicalProfile,
          )
        : '';
    const notice = context.$('#sketchTargetNotice');
    notice.textContent =
      warning ||
      'El código inicial es para Arduino Uno; revisa el sketch antes de usar otra placa.';
    notice.classList.toggle('hidden', !onUnoWelcome && !warning);
  };
  context.setPhysicalProfile = function setPhysicalProfile(profile) {
    if (![...context.$('#execHardware').options].some((p) => p.value === profile)) return;
    context.state.physicalProfile = profile;
    context.$('#execHardware').value = profile;
  };
  context.portInventoryKey = function portInventoryKey() {
    return JSON.stringify(
      context.state.ports.map((p) => [p.port, context.boardFingerprint(p)]).sort(),
    );
  };
  context.choosePortManually = function choosePortManually(port) {
    context.boardIdentity.selectionVersion++;
    context.boardIdentity.manualPorts = context.portInventoryKey();
    context.applyPortChoice(port);
  };
  context.autoIdentifyBoard = async function autoIdentifyBoard(force = false) {
    if (
      !context.boardIdentity.available ||
      context.boardIdentity.running ||
      context.state.busy ||
      context.agentRunState.active
    )
      return;
    const ports = context.state.ports;
    const present = new Set(ports.map((p) => context.boardFingerprint(p)));
    context.boardIdentity.seen = new Set(
      [...context.boardIdentity.seen].filter((key) => present.has(key)),
    );
    if (!ports.length) {
      context.boardIdentity.result = null;
      return;
    }
    if (!force && context.boardIdentity.manualPorts === context.portInventoryKey()) return;
    const port =
      ports.length === 1
        ? ports[0]
        : force
          ? ports.find((p) => p.port === context.state.port)
          : null;
    if (!port) {
      if (force) context.toast('Hay varias placas: elige el puerto que quieres identificar.');
      return;
    }
    const fingerprint = context.boardFingerprint(port),
      selectionVersion = context.boardIdentity.selectionVersion;
    if (!force && context.boardIdentity.seen.has(fingerprint)) return;
    context.boardIdentity.running = true;
    const selectedBefore = context.state.port;
    context.$('#deviceHint').textContent =
      `${port.port}: consultando chip · puede reiniciar la placa; no graba firmware`;
    try {
      const r = await context.request('/api/boards/identify', { port: port.port });
      if (
        !context.state.ports.some((p) => context.boardFingerprint(p) === fingerprint) ||
        context.state.port !== selectedBefore ||
        context.boardIdentity.selectionVersion !== selectionVersion
      )
        return;
      if (r.status === 'busy') {
        context.$('#deviceHint').textContent = r.message;
        return;
      }
      context.boardIdentity.seen.add(fingerprint);
      context.boardIdentity.result = r;
      if (r.hardware_profile) context.setPhysicalProfile(r.hardware_profile);
      context.applyPortChoice(port.port);
      if (r.fqbn) {
        if (!context.state.choices.some((b) => b.fqbn === r.fqbn))
          context.state.choices.push({ fqbn: r.fqbn, name: r.name || r.fqbn });
        context.applyBoardChoice(r.fqbn, false);
      }
      context.$('#deviceHint').textContent = r.message || 'Modelo sin confirmar';
      context.showLog(
        'console',
        '[Identificación] ' + (r.message || 'Modelo sin confirmar'),
        r.status === 'identified' ? 'note' : 'cmd',
      );
    } catch (e) {
      context.boardIdentity.seen.add(fingerprint);
      context.$('#deviceHint').textContent = 'Identificación pendiente: ' + e.message;
    } finally {
      context.boardIdentity.running = false;
    }
  };
  context.boardFingerprint = function boardFingerprint(p) {
    if (!p) return '';
    const vid = String(p.vid || '')
        .replace(/^0x/i, '')
        .toUpperCase(),
      pid = String(p.pid || '')
        .replace(/^0x/i, '')
        .toUpperCase();
    const sn = String(p.serial_number || '').trim();
    // Sin número de serie, la asociación NO se comparte entre distintos puertos COM.
    return sn && vid && pid ? `unique:${vid}:${pid}:${sn}` : `port:${p.port}:${vid}:${pid}`;
  };
  context.rememberBoard = function rememberBoard() {
    const p = context.state.ports.find((p) => p.port === context.state.port);
    if (!p || !context.state.choices.some((b) => b.fqbn === context.state.fqbn)) return;
    context.boardProfiles[context.boardFingerprint(p)] = {
      fqbn: context.state.fqbn,
      verifiedBy: 'user',
      savedAt: new Date().toISOString(),
    };
  };
  context.applyBoardChoice = function applyBoardChoice(fqbn, remember = true) {
    if (!context.state.choices.some((b) => b.fqbn === fqbn))
      return context.toast('Instala primero el núcleo de esa placa');
    if (remember) {
      context.boardIdentity.selectionVersion++;
      context.boardIdentity.manualPorts = context.portInventoryKey();
    }
    context.state.fqbn = fqbn;
    if (remember) context.rememberBoard();
    RobotActivity.invalidate('build');
    context.$('#footBoard').textContent =
      context.state.choices.find((b) => b.fqbn === fqbn)?.name || fqbn;
    context.updateHardwareLabVisibility();
    context.refreshQuickSelectors();
    context.renderSidebar();
    context.refreshDeviceHint();
    context.save();
  };
  context.applyPortChoice = function applyPortChoice(port) {
    context.state.port = port;
    context.$('#footPort').textContent = 'Puerto: ' + (context.state.port || 'sin seleccionar');
    context.refreshQuickSelectors();
    if (context.state.panel === 'boards') context.renderSidebar();
    context.refreshDeviceHint();
    context.save();
  };
  context.openCatalog = function openCatalog() {
    if (!context.catalogDialog.open) context.catalogDialog.showModal();
    context.catalogQuery.value = '';
    context.catalogRemote = null;
    context.renderCatalog();
    context.catalogQuery.focus();
    context.fetchInstalledCatalog(1);
  };
  context.refreshCatalogFromCLI = async function refreshCatalogFromCLI() {
    const btn = context.$('#catalogRefresh');
    btn.disabled = true;
    btn.textContent = 'Consultando...';
    try {
      await context.scan({ force: true });
      await context.fetchInstalledCatalog(1);
    } catch (e) {
      context.$('#catalogSource').textContent = 'Error de consulta: ' + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = '↻ Actualizar';
    }
  };
  context.fetchInstalledCatalog = async function fetchInstalledCatalog(page = 1) {
    const q = context.catalogQuery.value.trim(),
      generation = ++context.catalogSearchGeneration;
    context.catalogLocal = {
      query: q.toLocaleLowerCase('es'),
      page,
      limit: 40,
      pages: 0,
      total: 0,
      boards: [],
      loading: true,
    };
    context.renderCatalog();
    try {
      const r = await context.request(
        '/api/board-catalog/installed?query=' +
          encodeURIComponent(q) +
          '&page=' +
          page +
          '&limit=40',
      );
      if (generation !== context.catalogSearchGeneration || context.catalogQuery.value.trim() !== q)
        return;
      context.catalogLocal = {
        query: q.toLocaleLowerCase('es'),
        page: r.page || 1,
        limit: r.limit || 40,
        pages: r.pages || 0,
        total: r.total || 0,
        boards: r.boards || [],
        loading: false,
      };
      context.catalogLocal.error = r.ok ? '' : r.error || 'No se pudo consultar el catálogo';
      context.state.catalogError = context.catalogLocal.error;
      context.state.catalogOk = r.ok === true;
      context.state.catalogSource = r.source || context.state.catalogSource;
      context.renderCatalog();
    } catch (e) {
      if (generation === context.catalogSearchGeneration) {
        context.catalogLocal.loading = false;
        context.catalogLocal.error = e.message;
        context.state.catalogError = e.message;
        context.renderCatalog();
      }
    }
  };
  context.renderCatalog = function renderCatalog() {
    const q = context.catalogQuery.value.trim().toLocaleLowerCase('es');
    const active =
      context.catalogRemote && context.catalogRemote.query === q
        ? context.catalogRemote
        : context.catalogLocal;
    const results = context.$('#catalogResults');
    results.replaceChildren();
    const current =
      active.query === q
        ? active
        : { query: q, boards: [], page: 1, pages: 0, total: 0, loading: true };
    context.$('#catalogSource').textContent =
      (context.catalogRemote && context.catalogRemote.query === q
        ? 'Gestor de placas · '
        : 'Instaladas · ') +
      (context.state.catalogWarning || context.state.catalogSource || 'Arduino CLI');
    context.$('#catalogCount').textContent = current.loading
      ? 'Buscando modelos…'
      : current.error
        ? 'Error de consulta · total desconocido'
        : `${current.total} coincidencias · ${context.state.catalogCount || 0} modelos instalados en total`;
    context.$('#catalogPageLabel').textContent = current.pages
      ? `Página ${current.page} de ${current.pages}`
      : 'Página 1';
    context.$('#catalogPrev').disabled = current.loading || current.page <= 1;
    context.$('#catalogNext').disabled = current.loading || current.page >= current.pages;
    if (current.loading) {
      const n = document.createElement('div');
      n.className = 'picker-empty';
      n.textContent = 'Buscando en el catálogo local…';
      results.append(n);
      return;
    }
    if (!current.boards.length) {
      const n = document.createElement('div');
      n.className = 'picker-empty';
      n.textContent =
        current.error ||
        'No hay coincidencias. Prueba otro término o usa «Buscar también en gestor de placas».';
      results.append(n);
      return;
    }
    for (const b of current.boards) {
      const item = document.createElement('div');
      item.className = 'picker-item';
      item.setAttribute('role', 'listitem');
      const content = document.createElement('div'),
        name = document.createElement('strong'),
        desc = document.createElement('span'),
        button = document.createElement('button');
      name.textContent = b.name;
      desc.className = 'hint';
      desc.textContent = b.fqbn + (b.platform ? ' · ' + b.platform : '');
      content.append(name, desc);
      button.className = 'action small';
      button.textContent = b.installed === false ? 'Instalar núcleo' : 'Elegir';
      button.addEventListener('click', async () => {
        if (b.installed !== false) {
          if (!context.state.choices.some((x) => x.fqbn === b.fqbn)) context.state.choices.push(b);
          context.applyBoardChoice(b.fqbn);
          context.catalogDialog.close();
          context.toast('Placa seleccionada: ' + b.name);
          return;
        }
        if (!b.core) {
          context.toast('No se encontró un núcleo instalable para esta placa');
          return;
        }
        if (
          !(await context.confirmAction(
            `Instalar ${b.core} desde Arduino Boards Manager? Se descargarán archivos; esta operación modifica el entorno local.`,
          ))
        )
          return;
        button.disabled = true;
        button.textContent = 'Instalando...';
        try {
          const result = await context.request('/api/terminal/install-core', {
            core: b.core,
            confirm: true,
          });
          if (!result.ok) throw Error(result.output || 'Instalación fallida');
          await context.scan({ force: true });
          if (!context.state.choices.some((x) => x.fqbn === b.fqbn))
            context.state.choices.push({ ...b, installed: true });
          context.applyBoardChoice(b.fqbn);
          context.catalogDialog.close();
          context.toast('Núcleo instalado y placa seleccionada');
        } catch (e) {
          context.toast('Error instalando: ' + e.message);
        } finally {
          button.disabled = false;
          button.textContent = 'Instalar núcleo';
        }
      });
      item.append(content, button);
      results.append(item);
    }
  };
  context.fetchRemoteCatalog = async function fetchRemoteCatalog(page = 1) {
    const q = context.catalogQuery.value.trim();
    if (q.length < 2) return context.toast('Escribe al menos dos caracteres');
    const generation = ++context.catalogSearchGeneration;
    context.catalogRemote = {
      query: q.toLocaleLowerCase('es'),
      page,
      limit: 40,
      pages: 0,
      total: 0,
      boards: [],
      loading: true,
    };
    context.renderCatalog();
    try {
      const response = await context.request(
        '/api/board-catalog/search?query=' + encodeURIComponent(q) + '&page=' + page + '&limit=40',
      );
      if (generation !== context.catalogSearchGeneration || context.catalogQuery.value.trim() !== q)
        return;
      if (!response.ok) throw Error(response.error || 'Error consultando el índice');
      context.catalogRemote = {
        query: q.toLocaleLowerCase('es'),
        page: response.page || 1,
        limit: response.limit || 40,
        pages: response.pages || 0,
        total: response.total || 0,
        boards: response.boards || [],
        loading: false,
      };
      context.renderCatalog();
    } catch (e) {
      if (generation === context.catalogSearchGeneration) {
        context.catalogRemote = null;
        context.toast('Gestor de placas: ' + e.message);
        context.renderCatalog();
      }
    }
  };
  context.refreshQuickSelectors = function refreshQuickSelectors() {
    const board = context.$('#quickBoard'),
      port = context.$('#quickPort');
    if (!board || !port) return;
    const syncOptions = (select, items, value) => {
      const same =
        select.options.length === items.length &&
        items.every(
          ([text, val], i) => select.options[i].value === val && select.options[i].text === text,
        );
      if (!same) select.replaceChildren(...items.map(([text, val]) => new Option(text, val)));
      if (select.value !== value) select.value = value;
    };
    const curated = context.state.choices
      .filter(
        (p) =>
          p.fqbn === context.state.fqbn ||
          context.state.ports.some((d) => (d.boards || []).some((x) => x.fqbn === p.fqbn)),
      )
      .slice(0, 8);
    const boardOptions = curated.map((p) => [p.name, p.fqbn]);
    if (!curated.some((p) => p.fqbn === context.state.fqbn))
      boardOptions.push([context.state.fqbn + ' · verificar selección', context.state.fqbn]);
    boardOptions.push(['⌕ Buscar cualquier placa…', '__search__']);
    syncOptions(board, boardOptions, context.state.fqbn);
    const portOptions = [
      [
        context.state.scanOk === false
          ? 'Detección no disponible'
          : context.state.ports.length
            ? 'Seleccionar puerto COM'
            : 'Sin puertos COM detectados',
        '',
      ],
    ];
    for (const p of context.state.ports) {
      const isCH340 =
        /^(?:0x)?1a86$/i.test(String(p.vid || '')) && /^(?:0x)?7523$/i.test(String(p.pid || ''));
      const description = isCH340
        ? 'USB CH340 · modelo a elegir'
        : String(p.name || 'Dispositivo serie').slice(0, 35);
      portOptions.push([p.port + ' · ' + description, p.port]);
    }
    if (context.state.port && !context.state.ports.some((p) => p.port === context.state.port))
      portOptions.push([
        context.state.port + ' · desconectado / sin verificar',
        context.state.port,
      ]);
    syncOptions(port, portOptions, context.state.port);
  };
  context.checkSelection = function checkSelection(requirePort) {
    if (!context.state.apiReady) {
      context.toast('Servidor desconectado. Inicia server.py');
      return false;
    }
    if (requirePort && !context.state.port) {
      context.toast('Selecciona el puerto USB en la barra superior');
      context.$('#quickPort').focus();
      return false;
    }
    if (context.state.lang === 'cpp' && !context.state.fqbn) {
      context.toast('Selecciona una placa/FQBN');
      return false;
    }
    return true;
  };
}
export function initialize(context) {
  context.$('#makeBlankSketch').onclick = async () => {
    if (
      !(await context.confirmAction(
        '¿Preparar un sketch básico para la placa seleccionada? Se reemplazará el ejemplo Arduino Uno. Exporta el proyecto si quieres conservarlo.',
      ))
    )
      return;
    try {
      const before = context.$('#code').value;
      context.draftBackups.unshift({
        date: new Date().toISOString(),
        lang: context.state.lang,
        code: before,
      });
    } catch (_e) {
      context.toast(
        'No se pudo crear copia en el navegador. Exporta el proyecto antes de reemplazarlo.',
      );
      return;
    }
    const code = `// AB MakerIDE · MS Robotika\n// Sketch básico para ${context.state.fqbn}\n// No presupone pines ni periféricos.\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}\n`;
    context.state.files.cpp = code;
    context.$('#code').value = code;
    context.updateHL();
    context.updateCaret();
    context.scheduleSave();
    context.scheduleAdvisor();
    context.refreshSketchTargetNotice();
    context.toast('Sketch básico preparado. Compila antes de grabar.');
  };
  context.$('#quickHelp').onclick = () => context.$('#quickStart').showModal();
  context.$('#quickStartClose').onclick = () => context.$('#quickStart').close();
  context.$('#quickBoardFocus').onclick = () => {
    context.$('#quickStart').close();
    context.$('#quickBoard').focus();
  };
  requestAnimationFrame(() => context.resizeTerminal(context.normalTerminalHeight, false));
  context.setPhysicalProfile(context.state.physicalProfile);
  context.$('#execHardware').addEventListener('change', () => {
    context.setPhysicalProfile(context.$('#execHardware').value);
    context.save();
  });
  context.boardProfiles = {};
  context.boardIdentity = {
    running: false,
    seen: new Set(),
    result: null,
    available: false,
    manualPorts: null,
    selectionVersion: 0,
  };
  context.$('#quickScan').addEventListener('click', () => context.boardIdentity.seen.clear());
  context.catalogDialog = context.$('#boardCatalog');
  context.catalogQuery = context.$('#catalogQuery');
  context.catalogLocal = {
    query: '',
    page: 1,
    limit: 40,
    pages: 0,
    total: 0,
    boards: [],
    loading: false,
  };
  context.catalogRemote = null;
  context.searchDebounce = undefined;
  context.catalogSearchGeneration = 0;
  context.$('#catalogOpen').onclick = context.openCatalog;
  context.$('#catalogClose').onclick = () => context.catalogDialog.close();
  context.$('#catalogRefresh').onclick = context.refreshCatalogFromCLI;
  context.catalogQuery.addEventListener('input', () => {
    clearTimeout(context.searchDebounce);
    context.catalogRemote = null;
    const generation = ++context.catalogSearchGeneration;
    context.searchDebounce = setTimeout(() => {
      if (generation !== context.catalogSearchGeneration) return;
      context.fetchInstalledCatalog(1);
    }, 280);
  });
  context.$('#catalogOnline').onclick = () => context.fetchRemoteCatalog(1);
  context.$('#catalogPrev').onclick = () => {
    const a = context.catalogRemote || context.catalogLocal;
    if (a.page > 1) {
      if (context.catalogRemote) context.fetchRemoteCatalog(a.page - 1);
      else context.fetchInstalledCatalog(a.page - 1);
    }
  };
  context.$('#catalogNext').onclick = () => {
    const a = context.catalogRemote || context.catalogLocal;
    if (a.page < a.pages) {
      if (context.catalogRemote) context.fetchRemoteCatalog(a.page + 1);
      else context.fetchInstalledCatalog(a.page + 1);
    }
  };
  context.$('#quickBoard').addEventListener('change', (e) => {
    if (e.target.value === '__search__') {
      context.refreshQuickSelectors();
      context.openCatalog();
    } else context.applyBoardChoice(e.target.value);
  });
  context
    .$('#quickPort')
    .addEventListener('change', (e) => context.choosePortManually(e.target.value));
  context.$('#quickScan').addEventListener('click', async () => {
    const btn = context.$('#quickScan');
    btn.disabled = true;
    try {
      const scanned = await context.scan({ force: true });
      if (scanned.scan_ok === false) {
        context.toast('Detección incompleta: revisa el aviso');
        return;
      }
      if (!context.state.ports.length) {
        context.showLog(
          'console',
          'No hay puertos COM detectados: comprueba cable USB de DATOS, controlador CH340/ATmega16U2 y Administrador de dispositivos. El IDE no inventa puertos.',
          'bad',
        );
        context.switchPane('console');
        context.toast('Sin puertos detectados. Revisa USB/driver.');
      } else context.toast(context.state.ports.length + ' puerto(s) COM real(es) detectado(s)');
    } catch (e) {
      context.showLog('console', e.message, 'bad');
      context.toast('Error en detección: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  });
  context.openRight = (mode) => {
    document.body.dataset.right = document.body.dataset.right === mode ? 'none' : mode;
    if (document.body.dataset.right !== 'sim' && context.state.simRunning) context.pauseSim();
    if (mode === 'lab') context.$('#hardwareLab').open = true;
  };
  context.$('#showAI').onclick = () => context.openRight('ai');
  context.$('#showSim').onclick = () => {
    context.openRight('sim');
    context.$('#extraTools').open = false;
  };
  context.$('#showLab').onclick = () => {
    context.openRight('lab');
    context.$('#extraTools').open = false;
  };
  context.$('#rightClose').onclick = () => {
    if (context.state.simRunning) context.pauseSim();
    document.body.dataset.right = 'none';
  };
}
