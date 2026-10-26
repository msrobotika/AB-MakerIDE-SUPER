// hardware feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.labSave = function labSave() {
    context.lab.last = null;
    context.$('#hwResult').textContent = 'Conexiones modificadas: pulsa Auditar conexiones.';
  };
  context.labRender = function labRender() {
    const root = context.$('#hwConnections');
    root.replaceChildren();
    context.lab.connections.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'fieldrow';
      const kind = document.createElement('select');
      kind.className = 'selector';
      for (const [key, label] of Object.entries(context.LAB_KINDS)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = label;
        kind.appendChild(opt);
      }
      kind.value = entry.kind;
      const pin = document.createElement('select');
      pin.className = 'selector';
      pin.setAttribute('aria-label', 'GPIO del componente ' + (i + 1));
      for (const n of [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26,
        27, 32, 33, 34, 35, 36, 39,
      ]) {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = 'GPIO ' + n;
        pin.appendChild(opt);
      }
      pin.value = String(entry.gpio);
      const voltage = document.createElement('select');
      voltage.className = 'selector';
      voltage.setAttribute('aria-label', 'Nivel de señal ' + (i + 1));
      for (const n of [3.3, 5, 12, 0]) {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n + ' V';
        voltage.appendChild(opt);
      }
      voltage.value = String(entry.voltage);
      const del = document.createElement('button');
      del.className = 'action small danger';
      del.textContent = '✕';
      del.title = 'Quitar conexión';
      kind.onchange = () => {
        entry.kind = kind.value;
        context.labSave();
      };
      pin.onchange = () => {
        entry.gpio = Number(pin.value);
        context.labSave();
      };
      voltage.onchange = () => {
        entry.voltage = Number(voltage.value);
        context.labSave();
      };
      del.onclick = () => {
        context.lab.connections.splice(i, 1);
        context.labSave();
        context.labRender();
      };
      row.append(kind, pin, voltage, del);
      root.appendChild(row);
    });
    if (!context.lab.connections.length) {
      const d = document.createElement('div');
      d.className = 'labnote';
      d.textContent = 'Sin componentes externos. Pantalla TFT integrada registrada en el perfil.';
      root.appendChild(d);
    }
  };
  context.labProfileNote = function labProfileNote() {
    const p = context.$('#hwProfile').value;
    context.$('#hwProfileNote').textContent =
      p === 'esp32-generic'
        ? 'Perfil generico: confirma los GPIO reales del fabricante.'
        : p === 'ideaspark-19'
          ? 'Perfil probado con tu IdeaSpark de la foto. TFT: MOSI23, SCLK18, CS15, DC2, RST4, BL32.'
          : 'Perfil 1,14″ provisional: comprueba tu revisión. TFT: MOSI23, SCLK18, CS15, DC2, RST4, BL32.';
  };
  context.labShow = function labShow(result) {
    const root = context.$('#hwResult');
    root.replaceChildren();
    let summary = document.createElement('div');
    summary.className = result.errors ? 'badline' : 'goodline';
    summary.textContent = result.errors
      ? `${result.errors} errores · ${result.warnings} avisos · revisar antes de conectar`
      : `Sin conflictos bloqueantes conocidos · ${result.warnings} avisos`;
    root.appendChild(summary);
    for (const issue of result.issues) {
      const line = document.createElement('div');
      line.className =
        issue.severity === 'error' ? 'badline' : issue.severity === 'warning' ? 'warnline' : '';
      line.textContent =
        (issue.severity === 'error' ? '✕ ' : issue.severity === 'warning' ? '⚠ ' : 'ⓘ ') +
        issue.message;
      root.appendChild(line);
    }
    let note = document.createElement('div');
    note.textContent = result.disclaimer;
    root.appendChild(note);
  };
  context.labCheck = async function labCheck(display = true) {
    const r = await context.request('/api/hardware/check', {
      profile: context.$('#hwProfile').value,
      connections: context.lab.connections,
      wifi: context.$('#hwWifi').checked,
    });
    context.lab.last = r;
    if (display) context.labShow(r);
    return r;
  };
}
export function initialize(context) {
  context.LAB_KINDS = {
    led: 'LED + resistencia',
    button: 'Pulsador',
    analog: 'Sensor analogico',
    dht22: 'DHT22',
    relay: 'Modulo rele',
    servo: 'Servomotor',
  };
  context.lab = { connections: [], last: null };
  context.$('#hwAdd').onclick = () => {
    if (context.lab.connections.length >= 32) return context.toast('Limite: 32 conexiones');
    context.lab.connections.push({ kind: 'led', gpio: 13, voltage: 3.3 });
    context.labSave();
    context.labRender();
  };
  context.$('#hwProfile').onchange = () => {
    context.labProfileNote();
    context.labSave();
  };
  context.$('#hwWifi').onchange = context.labSave;
  context.$('#hwCheck').onclick = async () => {
    try {
      const r = await context.labCheck();
      context.toast(r.errors ? 'Auditoria: corrige conflictos' : 'Auditoria logica completada');
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#hwSketchCheck').onclick = async () => {
    try {
      const r = await context.request('/api/hardware/sketch', {
        profile: context.$('#hwProfile').value,
        code: context.$('#code').value,
      });
      const div = context.$('#hwResult');
      div.textContent = r.warnings.length
        ? 'Advertencias del sketch:\n' + r.warnings.join('\n')
        : 'Los macros TFT_*/LCD_* declarados coinciden con el perfil o no se han encontrado. No implica que el cableado sea correcto.';
      context.toast('Revision del codigo completada');
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#hwApplyRotation').onclick = async () => {
    if (context.state.lang !== 'cpp')
      return context.toast('La orientacion disponible es para C++ ST7789');
    const src = context.$('#code').value;
    const re = /\btft\.setRotation\s*\(\s*[0-3]\s*\)\s*;/g;
    if ([...src.matchAll(re)].length !== 1)
      return context.toast('El sketch debe contener exactamente una llamada tft.setRotation(n);');
    const next = 'tft.setRotation(' + context.$('#hwRotation').value + ');';
    if (
      !(await context.confirmAction(
        '¿Cambiar la orientacion de la pantalla a ' +
          context.$('#hwRotation').value +
          '? Conserva tu proyecto exportado antes de grabar.',
      ))
    )
      return;
    const updated = src.replace(re, next);
    context.state.files.cpp = updated;
    context.$('#code').value = updated;
    context.updateHL();
    context.scheduleSave();
    context.scheduleAdvisor();
    context.toast('Orientacion ajustada. Compila antes de grabar.');
  };
  context.labProfileNote();
  context.labRender();
  BoardTrials.mount({
    readContext: () => ({
      code: context.$('#code').value,
      lang: context.state.lang,
      fqbn: context.state.fqbn,
      port: context.state.port,
      agent_project_id: context.agentProjectId,
      ide_version: context.IDE_VERSION,
    }),
    readBuild: async () => {
      const id = context.currentJobId || localStorage.getItem('ab-makeride-last-build-v1');
      return id
        ? context.request('/api/jobs/status?id=' + encodeURIComponent(id)).catch(() => ({
            unavailable: true,
          }))
        : null;
    },
  });
}
