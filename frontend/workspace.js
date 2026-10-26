// workspace feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.scheduleAdvisor = function scheduleAdvisor() {
    clearTimeout(context.advisorTimer);
    context.advisorTimer = setTimeout(() => context.refreshAdvisor(false), 1200);
  };
  context.refreshAdvisor = async function refreshAdvisor(openPanel = false) {
    const badge = context.$('#advisorBadge');
    if (context.state.lang !== 'cpp') {
      badge.textContent = '🧩 MicroPython: dependencias sujetas al firmware';
      badge.closest('.advisorstrip').classList.add('hidden');
      return;
    }
    if (openPanel) context.goPanel('libraries');
    const source = context.$('#code').value,
      fqbn = context.state.fqbn;
    if (!source.trim()) {
      context.advisory = null;
      badge.textContent = '🧩 Escribe o abre un sketch para revisar sus dependencias';
      badge.closest('.advisorstrip').classList.add('hidden');
      context.$('#advisorDetails')?.replaceChildren();
      return;
    }
    badge.textContent = '🧩 Analizando cabeceras...';
    try {
      const data = await context.request('/api/advisor/check', {
        code: source,
        fqbn,
        diagnostics: context.latestCompilerError,
      });
      if (
        context.state.lang !== 'cpp' ||
        context.$('#code').value !== source ||
        context.state.fqbn !== fqbn
      )
        return;
      context.advisory = data;
      const missing = data.recommendations.filter((r) => r.installed === false);
      context
        .$('#advisorBadge')
        .closest('.advisorstrip')
        .classList.toggle(
          'hidden',
          !missing.length && !data.unknown_headers.length && !data.warnings.length,
        );
      badge.textContent = missing.length
        ? `🧩 ${missing.length} librería(s) posiblemente ausentes · revisar`
        : `🧩 ${data.recommendations.length} dependencia(s) reconocidas · ${data.unknown_headers.length} por comprobar`;
      if (context.state.panel === 'libraries') context.renderAdvisorPanel();
    } catch (e) {
      badge.textContent = '🧩 Análisis no disponible: ' + e.message;
    }
  };
  context.goPanel = function goPanel(panel) {
    context.state.panel = panel;
    context.$$('.rail button').forEach((b) => b.classList.toggle('on', b.dataset.panel === panel));
    context.renderSidebar();
  };
  context.renderAdvisorPanel = function renderAdvisorPanel() {
    const el = context.$('#advisorDetails');
    if (!el || !context.advisory) return;
    el.replaceChildren();
    const notes = document.createElement('p');
    notes.textContent = context.advisory.message;
    notes.className = 'notice';
    el.appendChild(notes);
    for (const rec of context.advisory.recommendations) {
      const div = document.createElement('div');
      div.className = 'advisordetail';
      const strong = document.createElement('strong');
      strong.textContent = rec.name;
      div.appendChild(strong);
      const meta = document.createElement('div');
      meta.textContent = `${rec.header} · ${rec.installed === null ? 'No verificado' : rec.installed ? 'Instalada' : 'No detectada'} · confianza ${rec.confidence}`;
      div.appendChild(meta);
      if (rec.installed === false) {
        const btn = document.createElement('button');
        btn.className = 'action small';
        btn.textContent = 'Instalar tras confirmar';
        btn.onclick = () => {
          const fld = context.$('#libName');
          if (fld) {
            fld.value = rec.name;
            context.installLibrary();
          }
        };
        div.appendChild(btn);
      }
      el.appendChild(div);
    }
    for (const unknown of context.advisory.unknown_headers) {
      const d = document.createElement('div');
      d.className = 'advisordetail';
      d.textContent = `${unknown} · Cabecera no catalogada: búsqueda manual necesaria.`;
      el.appendChild(d);
    }
    for (const warning of context.advisory.warnings) {
      const d = document.createElement('div');
      d.className = 'advisordetail';
      d.textContent = '⚠ ' + warning;
      el.appendChild(d);
    }
    if (!context.advisory.recommendations.length && !context.advisory.unknown_headers.length) {
      const p = document.createElement('p');
      p.className = 'hint';
      p.textContent = 'Sin librerías externas identificadas en las directivas #include.';
      el.appendChild(p);
    }
  };
  context.node = function node(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (key in element) element[key] = value;
      else element.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child !== null && child !== undefined)
        element.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return element;
  };
  context.panelButton = function panelButton(id, text, className = 'action small') {
    return context.node('button', { id, className }, text);
  };
  context.panelHeading = function panelHeading(text) {
    return context.node('div', { className: 'miniheading' }, text);
  };
  context.panelSelect = function panelSelect(id, text, entries, selected) {
    const select = context.node(
      'select',
      { id, className: 'selector' },
      entries.map(([label, value]) => new Option(label, value, false, value === selected)),
    );
    return context.node(
      'div',
      { className: 'field' },
      context.node('label', { htmlFor: id, className: 'formlabel' }, text),
      select,
    );
  };
  context.renderProjectPanel = function renderProjectPanel(root, state) {
    root.replaceChildren(
      context.node('label', { htmlFor: 'projectName', className: 'formlabel' }, 'PROYECTO'),
      context.node('input', {
        id: 'projectName',
        className: 'input',
        maxLength: 60,
        value: state.name,
      }),
      context.node(
        'button',
        { className: 'treeitem ' + (state.lang === 'cpp' ? 'on' : ''), 'data-open': 'cpp' },
        context.node('span', { className: 'filetype' }, 'INO'),
        ' sketch.ino',
      ),
      context.node(
        'button',
        { className: 'treeitem ' + (state.lang === 'py' ? 'on' : ''), 'data-open': 'py' },
        context.node('span', { className: 'filetype py' }, 'PY'),
        ' main.py',
      ),
      context.panelHeading('ARCHIVO'),
      context.panelButton('newBtn', '+ Nuevo proyecto', 'action small ghost project-button'),
      context.node(
        'div',
        { className: 'fieldrow project-actions' },
        context.node(
          'button',
          { id: 'exportBtn', className: 'action small', title: 'Descargar el proyecto; Ctrl+S' },
          'Guardar proyecto',
        ),
        context.panelButton('importBtn', 'Importar'),
      ),
      context.node(
        'details',
        { className: 'recovery-controls' },
        context.node('summary', { className: 'hint clickable' }, 'Recuperación (opcional)'),
        context.panelButton(
          'restoreMigrationBackup',
          'Recuperar proyecto anterior',
          'action small ghost recover-project',
        ),
        context.panelButton(
          'restoreAiBackup',
          'Recuperar cambios anteriores a IA',
          'action small ghost full-width',
        ),
      ),
    );
  };
  context.renderBoardsPanel = function renderBoardsPanel(root, state) {
    const speeds = [115200, 230400, 460800, 921600];
    const parts = [
      context.panelButton('scanBtn', '↻ Buscar placas reales', 'action scan-boards'),
      context.panelButton(
        'openBoardSearch',
        '⌕ Buscar entre ' +
          (state.catalogOk ? state.catalogCount : 'total desconocido de') +
          ' modelos instalados',
        'action board-search',
      ),
      context.panelSelect(
        'boardSelect',
        'TIPO DE PLACA / FQBN',
        state.choices.map((p) => [p.name, p.fqbn]),
        state.fqbn,
      ),
      context.panelSelect(
        'portSelect',
        'PUERTO FÍSICO',
        [
          ['— Ningún dispositivo seleccionado —', ''],
          ...state.ports.map((p) => [p.port + ' · ' + p.name, p.port]),
        ],
        state.port,
      ),
      context.panelSelect(
        'baudSelect',
        'BAUDIOS DEL MONITOR SERIE',
        [9600, 19200, 38400, 57600, 74880, ...speeds].map((v) => [String(v), String(v)]),
        String(state.baud),
      ),
      context.panelSelect(
        'uploadSpeedSelect',
        'VELOCIDAD DE GRABACIÓN ESP32',
        speeds.map((v) => [v + ' baudios', String(v)]),
        String(state.uploadSpeed),
      ),
      context.node(
        'label',
        { className: 'settingscheck retry-setting' },
        context.node('span', {}, 'Reintento USB automático a 115200 (si falla el enlace)'),
        context.node('input', { id: 'retrySlow', type: 'checkbox', checked: state.retrySlow }),
      ),
      context.panelButton(
        'serialConnect',
        state.serialConnected ? '■ Desconectar monitor' : '↗ Conectar monitor serie',
        'action project-button',
      ),
    ];
    if (state.lang === 'py')
      parts.push(
        context.panelButton('pyRun', '▶ Ejecutar MicroPython desde RAM', 'action extra-action'),
      );
    parts.push(
      context.node(
        'div',
        { className: 'boxinfo' },
        state.ports.length
          ? 'Dispositivos detectados: ' + state.ports.length
          : 'No se detectan dispositivos. No se inventan puertos COM.',
        context.node('br'),
        context.node(
          'span',
          { className: 'hint' },
          'La selección FQBN es manual si el puerto no identifica por sí solo el modelo. Comprueba la serigrafía de tu placa.',
        ),
      ),
    );
    root.replaceChildren(...parts);
  };
  context.renderLibrariesPanel = function renderLibrariesPanel(root) {
    root.replaceChildren(
      context.node(
        'div',
        { className: 'notice' },
        'Se consultan e instalan librerías Arduino mediante Arduino CLI. Solo se mostrará éxito si la herramienta responde correctamente.',
      ),
      context.panelHeading('RECOMENDADAS PARA ESTE SKETCH'),
      context.node('div', { id: 'advisorDetails', 'aria-live': 'polite' }),
      context.panelButton(
        'advisorRefresh',
        'Analizar el código actual',
        'action small ghost advisor-refresh',
      ),
      context.panelHeading('INSTALAR LIBRERÍA'),
      context.node('input', {
        id: 'libName',
        className: 'input',
        placeholder: 'Ej.: DHT sensor library',
      }),
      context.panelButton('libInstall', 'Instalar con Arduino CLI', 'action small install-library'),
      context.panelButton(
        'libRefresh',
        '↻ Ver librerías instaladas',
        'action small ghost full-width',
      ),
      context.panelHeading('BUSCAR EN ARDUINO LIBRARY MANAGER'),
      context.node('input', {
        id: 'libSearchQuery',
        className: 'input',
        placeholder: 'Nombre a buscar en el catálogo',
      }),
      context.panelButton('libSearch', 'Buscar con Arduino CLI', 'action small ghost extra-action'),
      context.node('pre', { id: 'libSearchResult', className: 'notice library-search-result' }),
      context.node('div', { id: 'libList', className: 'library-results' }),
    );
  };
  context.renderSettingsPanel = function renderSettingsPanel(root) {
    root.replaceChildren(
      context.panelHeading('COMPORTAMIENTO'),
      ...[
        'Guardado manual · archivo descargado',
        'Grabación con confirmación',
        'Resultados de hardware reales',
      ].map((text) =>
        context.node(
          'label',
          { className: 'settingscheck' },
          context.node('span', {}, text),
          context.node('input', { type: 'checkbox', checked: true, disabled: true }),
        ),
      ),
      context.panelHeading('INTELIGENCIA ARTIFICIAL'),
      context.node(
        'div',
        { className: 'notice' },
        'Usa tu propia cuenta y cuota. Las claves de chat quedan en memoria del servidor. Las conexiones MCP se protegen mediante el sistema operativo cuando está disponible.',
      ),
      context.panelHeading('SEGURIDAD'),
      context.node(
        'div',
        { className: 'boxinfo' },
        'Servidor limitado a 127.0.0.1. Sin telemetría. IA externa solo cuando el usuario la habilita. Cada apertura empieza vacía. Guarda el código y sus auxiliares antes de cerrar si quieres conservarlos.',
      ),
      context.panelButton('diagnosticBtn', 'Actualizar diagnósticos'),
    );
  };
  context.renderSidebar = function renderSidebar() {
    const b = context.$('#sideBody'),
      panel = context.state.panel;
    context.$('#sideTitle').textContent = {
      project: 'PROYECTO',
      boards: 'PLACAS Y PUERTOS',
      libraries: 'LIBRERÍAS',
      settings: 'AJUSTES',
    }[panel];
    if (panel === 'project') {
      context.renderProjectPanel(b, context.state);
      b.querySelector('#restoreMigrationBackup').onclick = async () => {
        try {
          const raw = localStorage.getItem(context.MIGRATION_BACKUP);
          if (!raw) return context.toast('No existe una copia anterior en este navegador');
          const data = JSON.parse(raw);
          if (
            !data.files ||
            typeof data.files.cpp !== 'string' ||
            typeof data.files.py !== 'string'
          )
            throw Error('Copia inválida');
          if (
            !(await context.confirmAction(
              '¿Recuperar la copia? Exporta primero el trabajo actual.',
            ))
          )
            return;
          context.state.files = { cpp: data.files.cpp, py: data.files.py };
          context.state.name = String(data.name || 'mi-proyecto').slice(0, 60);
          context.state.fqbn = String(data.fqbn || context.state.fqbn);
          context.setLang(data.lang === 'py' ? 'py' : 'cpp', false);
          context.$('#code').value = context.state.files[context.state.lang];
          context.updateHL();
          context.save();
          context.renderSidebar();
          context.toast('Proyecto recuperado');
        } catch (e) {
          context.toast('No se pudo recuperar: ' + e.message);
        }
      };
      b.querySelector('#restoreAiBackup').onclick = context.restoreAiBackup;
      b.querySelector('#projectName').addEventListener('input', (e) => {
        context.state.name = e.target.value;
        context.scheduleSave();
      });
      b.querySelectorAll('[data-open]').forEach((x) =>
        x.addEventListener('click', () => context.setLang(x.dataset.open)),
      );
      b.querySelector('#exportBtn').onclick = context.exportProject;
      b.querySelector('#importBtn').onclick = () => context.$('#projectFile').click();
      b.querySelector('#newBtn').onclick = async () => {
        if (
          !(await context.confirmAction(
            '¿Crear proyecto nuevo? Se reemplazará el código actual. Exporta primero si deseas conservarlo.',
          ))
        )
          return;
        context.rememberAgentProject('');
        context.state.files = { cpp: '', py: '' };
        context.state.name = 'mi-proyecto';
        context.setLang('cpp', false);
        context.$('#code').value = context.state.files.cpp;
        context.updateHL();
        context.save();
        context.renderSidebar();
        context.toast('Proyecto nuevo. Selecciona la placa antes de compilar.');
      };
    } else if (panel === 'boards') {
      context.renderBoardsPanel(b, context.state);
      b.querySelector('#openBoardSearch').onclick = context.openCatalog;
      b.querySelector('#scanBtn').onclick = async () => {
        context.toast('Buscando hardware real...');
        try {
          const result = await context.scan({ force: true });
          context.toast(
            result.scan_ok === false
              ? 'Detección incompleta: revisa el aviso'
              : context.state.ports.length + ' puerto(s) detectado(s)',
          );
        } catch (e) {
          context.toast(e.message);
        }
      };
      b.querySelector('#boardSelect').onchange = (e) => context.applyBoardChoice(e.target.value);
      b.querySelector('#portSelect').onchange = (e) => context.choosePortManually(e.target.value);
      b.querySelector('#baudSelect').onchange = (e) => {
        context.state.baud = +e.target.value;
        context.save();
      };
      b.querySelector('#uploadSpeedSelect').onchange = (e) => {
        context.state.uploadSpeed = +e.target.value;
        context.save();
      };
      b.querySelector('#retrySlow').onchange = (e) => {
        context.state.retrySlow = e.target.checked;
        context.save();
      };
      b.querySelector('#serialConnect').onclick = context.toggleSerial;
      const py = b.querySelector('#pyRun');
      if (py) py.onclick = context.runPython;
    } else if (panel === 'libraries') {
      context.renderLibrariesPanel(b);
      b.querySelector('#libRefresh').onclick = context.loadLibraries;
      b.querySelector('#libInstall').onclick = context.installLibrary;
      b.querySelector('#libSearch').onclick = context.searchLibraries;
      b.querySelector('#advisorRefresh').onclick = () => context.refreshAdvisor(false);
      context.renderAdvisorPanel();
    } else {
      context.renderSettingsPanel(b);
      b.querySelector('#diagnosticBtn').onclick = context.refreshAll;
    }
  };
  context.loadLibraries = async function loadLibraries() {
    const e = context.$('#libList');
    if (!e) return;
    e.textContent = 'Consultando librerías...';
    try {
      const r = await context.request('/api/libraries');
      if (!r.ok) {
        e.textContent = r.output || 'No disponible';
        return;
      }
      if (!r.libraries.length) {
        e.textContent = 'No hay librerías de usuario instaladas.';
        return;
      }
      e.replaceChildren();
      r.libraries.slice(0, 70).forEach((lib) => {
        const data = lib.library || lib;
        const div = document.createElement('div');
        div.className = 'lib';
        const name = document.createElement('strong');
        name.textContent = data.name || 'Librería';
        const p = document.createElement('p');
        p.textContent = (data.version || '') + ' · ' + (data.location || '');
        div.append(name, p);
        e.appendChild(div);
      });
    } catch (err) {
      e.textContent = err.message;
    }
  };
  context.searchLibraries = async function searchLibraries() {
    const q = context.$('#libSearchQuery').value.trim(),
      result = context.$('#libSearchResult');
    if (!q) {
      context.toast('Introduce un término');
      return;
    }
    result.textContent = 'Consultando el índice real...';
    try {
      const r = await context.request('/api/libraries/search', { query: q });
      result.textContent = (r.output || 'No se encontraron resultados').slice(0, 11000);
    } catch (e) {
      result.textContent = 'Error: ' + e.message;
    }
  };
  context.installLibrary = async function installLibrary() {
    const name = context.$('#libName').value.trim();
    if (!name) return context.toast('Introduce una librería');
    if (!(await context.confirmAction(`¿Instalar la librería "${name}" usando Arduino CLI?`)))
      return;
    context.showLog('console', 'Instalación REAL: ' + name, 'cmd');
    context.switchPane('console');
    try {
      const r = await context.request('/api/libraries/install', { name, confirm: true });
      context.showOutput('console', r.output);
      context.toast(r.ok ? 'Librería instalada' : 'No se pudo instalar');
      if (r.ok) context.loadLibraries();
    } catch (e) {
      context.showLog('console', e.message, 'bad');
    }
  };
}
export function initialize(context) {
  context.advisory = null;
  context.advisorTimer = null;
  context.latestCompilerError = '';
  context.$('#advisorOpen').onclick = () => context.refreshAdvisor(true);
  context.$$('.rail button').forEach((x) =>
    x.addEventListener('click', () => {
      const same = context.state.panel === x.dataset.panel;
      const closed = context.$('#sidebar').classList.contains('is-collapsed');
      context.state.panel = x.dataset.panel;
      context.$$('.rail button').forEach((y) => y.classList.toggle('on', y === x));
      context.setSidebar(closed || !same);
      context.renderSidebar();
      if (context.state.panel === 'libraries') context.loadLibraries();
      if (innerWidth <= 520) {
        context.$('#sidebar').classList.remove('mobileclosed');
      }
    }),
  );
}
