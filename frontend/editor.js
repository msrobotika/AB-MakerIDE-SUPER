// editor feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.toast = function toast(msg) {
    const e = context.$('#toast');
    e.textContent = msg;
    e.classList.add('show');
    clearTimeout(context.toasts);
    context.toasts = setTimeout(() => e.classList.remove('show'), 2700);
  };
  context.draftSnapshot = function draftSnapshot() {
    return JSON.stringify({
      files: context.state.files,
      name: context.state.name,
      lang: context.state.lang,
      fqbn: context.state.fqbn,
      hardware_profile: context.state.physicalProfile,
    });
  };
  context.rememberAgentProject = function rememberAgentProject(id) {
    context.agentProjectId = id || '';
  };
  context.save = function save() {
    context.invalidateSim();
    const content = context.state.files.cpp.length || context.state.files.py.length;
    context.state.dirty = Boolean(content) && context.draftSnapshot() !== context.lastExport;
    context.$('#footSave').textContent = !content
      ? 'Sesión nueva · Guardado manual'
      : context.state.dirty
        ? '● Sin guardar · Guardar proyecto'
        : '✓ Descarga solicitada';
  };
  context.scheduleSave = function scheduleSave() {
    context.invalidateSim();
    context.state.dirty = true;
    context.$('#footSave').textContent = '● Cambios pendientes';
    clearTimeout(context.saveDelay);
    context.saveDelay = setTimeout(context.save, 550);
  };
  context.showLog = function showLog(p, t, type = 'note') {
    const panel = context.$('#pane-' + p);
    const el = document.createElement('div');
    el.className = 'logline ' + type;
    el.textContent = t;
    panel.appendChild(el);
    while (panel.childNodes.length > 1100) panel.removeChild(panel.firstChild);
    panel.scrollTop = panel.scrollHeight;
    return el;
  };
  context.showOutput = function showOutput(p, t) {
    String(t || '')
      .split(/\r?\n/)
      .forEach((x) =>
        context.showLog(
          p,
          x,
          /sin errores|no errors/i.test(x)
            ? 'good'
            : /error|failed|fallid|fatal|traceback/i.test(x)
              ? 'bad'
              : /success|correct|writing|compilaci[oó]n real|carga real|done/i.test(x)
                ? 'good'
                : 'note',
        ),
      );
  };
  context.switchPane = function switchPane(name) {
    context.state.pane = name;
    context.$$('[data-pane]').forEach((x) => x.classList.toggle('on', x.dataset.pane === name));
    ['console', 'serial', 'problems'].forEach((p) =>
      context.$('#pane-' + p).classList.toggle('hidden', p !== name),
    );
    context.$('#serialBar').classList.toggle('hidden', name !== 'serial');
    context.$('#terminalBar').classList.toggle('hidden', name !== 'console');
  };
  context.updateCaret = function updateCaret() {
    const s = context.$('#code').value.slice(0, context.$('#code').selectionStart);
    const n = s.split('\n');
    context.$('#footCaret').textContent = `Ln ${n.length}, Col ${n.at(-1).length + 1}`;
  };
  context.highlight = function highlight(code, lang) {
    const regex =
      lang === 'cpp'
        ? /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(^\s*#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/gm
        : /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/gm;
    const out = document.createDocumentFragment();
    let last = 0;
    for (const m of code.matchAll(regex)) {
      out.appendChild(document.createTextNode(code.slice(last, m.index)));
      const t = m[0];
      last = m.index + t.length;
      const key = lang === 'cpp' ? context.keywordsCPP : context.keywordsPY;
      key.lastIndex = 0;
      let cls = m[1]
        ? 'tok-com'
        : m[2]
          ? 'tok-str'
          : lang === 'cpp' && m[3]
            ? 'tok-pre'
            : (lang === 'cpp' && m[4]) || (lang === 'py' && m[3])
              ? 'tok-num'
              : null;
      if (!cls && key.test(t)) cls = 'tok-key';
      if (!cls && /^\s*\(/.test(code.slice(last))) cls = 'tok-fn';
      out.appendChild(
        cls ? context.node('span', { className: cls }, t) : document.createTextNode(t),
      );
    }
    out.appendChild(document.createTextNode(code.slice(last) + '\n'));
    return out;
  };
  context.updateHL = function updateHL() {
    context
      .$('#highlight')
      .replaceChildren(context.highlight(context.$('#code').value, context.state.lang));
    context.$('#highlight').scrollTop = context.$('#code').scrollTop;
    context.$('#highlight').scrollLeft = context.$('#code').scrollLeft;
  };
  context.setLang = function setLang(lang, savePrevious = true) {
    if (lang !== 'py' && lang !== 'cpp') return;
    RobotActivity.invalidate('build');
    if (context.state.lang !== lang) {
      if (savePrevious) context.state.files[context.state.lang] = context.$('#code').value;
      context.state.lang = lang;
    }
    context.$$('[data-lang]').forEach((x) => x.classList.toggle('on', x.dataset.lang === lang));
    context.$('#code').value = context.state.files[lang];
    context.$('#fileLabel').textContent =
      lang === 'cpp' ? 'sketch.ino · Arduino C++' : 'main.py · MicroPython';
    context.$('#footLang').textContent = lang === 'cpp' ? 'C++ · Arduino' : 'Python · MicroPython';
    context.$('#verifyBtn').textContent = lang === 'cpp' ? '⌕ Compilar' : '⌕ Verificar sintaxis';
    context.$('#uploadBtn').textContent =
      lang === 'cpp' ? '↑ Compilar y grabar' : '↑ Guardar main.py';
    context.renderSidebar();
    context.updateHL();
    context.updateCaret();
    context.scheduleSave();
    context.scheduleAdvisor();
    context.refreshSketchTargetNotice();
  };
  context.download = function download(filename, text, type = 'application/json;charset=utf-8') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  };
  context.exportProject = function exportProject() {
    if (context.agentProjectId) {
      context.saveAgentProject({ job_id: context.agentProjectId, current_draft: true });
      return;
    }
    context.state.files[context.state.lang] = context.$('#code').value;
    const obj = {
      format: 'ab-makeride-v1',
      name: context.state.name,
      hardware_profile: context.state.physicalProfile,
      lang: context.state.lang,
      fqbn: context.state.fqbn,
      files: { 'sketch.ino': context.state.files.cpp, 'main.py': context.state.files.py },
      exported_at: new Date().toISOString(),
    };
    context.download(
      (context.state.name.replace(/[^a-z0-9-]/gi, '_') || 'proyecto') + '.abmaker.json',
      JSON.stringify(obj, null, 2),
    );
    context.lastExport = context.draftSnapshot();
    context.save();
    context.toast('Descarga del proyecto solicitada');
  };
  context.importProject = async function importProject(file) {
    if (/\.zip$/i.test(file.name)) {
      try {
        if (file.size > 8100000) throw Error('El ZIP supera el límite de 8 MB de proyecto');
        if (
          !(await context.confirmAction(
            '¿Abrir este proyecto ZIP en la sesión actual? Guarda antes el borrador si quieres conservarlo.',
          ))
        )
          return;
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 32768)
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
        const project = await context.request('/api/projects/import', { archive: btoa(binary) });
        context.draftBackups.unshift({
          date: new Date().toISOString(),
          lang: context.state.lang,
          code: context.$('#code').value,
        });
        context.draftBackups = context.draftBackups.slice(0, 7);
        context.state.files = { cpp: '', py: '' };
        context.state.files[project.lang] = project.code;
        context.state.name = file.name.replace(/\.zip$/i, '');
        if (context.state.choices.some((p) => p.fqbn === project.fqbn))
          context.state.fqbn = project.fqbn;
        context.setPhysicalProfile(project.hardware_profile);
        context.rememberAgentProject(project.job_id);
        context.setLang(project.lang, false);
        context.save();
        context.toast(
          'Proyecto abierto con ' +
            project.file_count +
            ' archivos. No se ha ejecutado ni grabado.',
        );
        return;
      } catch (e) {
        context.toast('No se pudo importar: ' + e.message);
        return;
      }
    }
    file
      .text()
      .then(async (txt) => {
        if (/\.(ino|py)$/i.test(file.name)) {
          if (txt.length > 300000) throw Error('Archivo demasiado grande');
          if (context.storageConflict)
            throw Error('Exporta la copia actual antes de resolver el conflicto de guardado');
          const lang = /\.py$/i.test(file.name) ? 'py' : 'cpp';
          if (
            !(await context.confirmAction(
              '¿Abrir ' + file.name + ' en el editor? Se guardará una copia del archivo anterior.',
            ))
          )
            return;
          const list = context.draftBackups;
          if (!Array.isArray(list)) throw Error('No se pudo guardar la copia anterior');
          list.unshift({ date: new Date().toISOString(), lang, code: context.state.files[lang] });
          context.draftBackups = list.slice(0, 7);
          context.rememberAgentProject('');
          context.state.files[lang] = txt;
          context.state.name = file.name.replace(/\.(ino|py)$/i, '').slice(0, 60);
          context.setLang(lang, false);
          context.save();
          context.renderSidebar();
          context.toast('Archivo abierto · copia anterior guardada');
          return;
        }
        const obj = JSON.parse(txt);
        if (
          obj.format !== 'ab-makeride-v1' ||
          !obj.files ||
          typeof obj.files['sketch.ino'] !== 'string' ||
          typeof obj.files['main.py'] !== 'string'
        )
          throw Error('Formato de proyecto no compatible');
        if (obj.files['sketch.ino'].length > 300000 || obj.files['main.py'].length > 300000)
          throw Error('Archivos demasiado grandes');
        if (
          !(await context.confirmAction(
            '¿Reemplazar los dos archivos actuales? Exporta antes si quieres conservarlos.',
          ))
        )
          return;
        context.rememberAgentProject('');
        context.state.files.cpp = obj.files['sketch.ino'];
        context.state.files.py = obj.files['main.py'];
        context.state.name = String(obj.name || 'proyecto').slice(0, 60);
        context.state.fqbn = String(obj.fqbn || context.state.fqbn);
        if (
          ['board-unspecified', 'esp32-cyd-28', 'ideaspark-114', 'ideaspark-19'].includes(
            obj.hardware_profile,
          )
        )
          context.setPhysicalProfile(obj.hardware_profile);
        context.setLang(obj.lang === 'py' ? 'py' : 'cpp', false);
        context.$('#code').value = context.state.files[context.state.lang];
        context.updateHL();
        context.save();
        context.renderSidebar();
        context.toast('Proyecto importado');
      })
      .catch((e) => context.toast('No se pudo importar: ' + e.message));
  };
  context.sessionToken = async function sessionToken() {
    if (context.csrfSession) return context.csrfSession;
    const resp = await fetch('/api/session', { cache: 'no-store' });
    if (!resp.ok) throw Error('No se pudo establecer sesión local segura');
    const data = await resp.json();
    context.csrfSession = data.csrf;
    if (!context.csrfSession) throw Error('El servidor no devolvió token de sesión');
    return context.csrfSession;
  };
  context.request = async function request(path, payload, retry = true) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      payload === undefined
        ? /\/api\/boards/.test(path)
          ? 75000
          : /board-catalog/.test(path)
            ? 55000
            : 20000
        : 360000,
    );
    try {
      const res = await fetch(
        path,
        payload === undefined
          ? { signal: controller.signal }
          : {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-AB-Session': await context.sessionToken(),
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            },
      );
      if (res.status === 403 && payload !== undefined && retry) {
        context.csrfSession = '';
        return context.request(path, payload, false);
      }
      const d = await res.json();
      if (!res.ok) throw Error(d.error || 'Error ' + res.status);
      return d;
    } finally {
      clearTimeout(timeout);
    }
  };
  context.busy = function busy(v) {
    context.state.busy = v;
    context.$('#verifyBtn').disabled = v || Boolean(context.state.agentWorking);
    context.$('#uploadBtn').disabled = v || Boolean(context.state.agentWorking);
    context.$('#execRun').disabled = v || Boolean(context.state.agentWorking);
    context.syncSerialControls();
  };
  context.hardwareLabAvailable = function hardwareLabAvailable() {
    return context.state.fqbn === 'esp32:esp32:esp32';
  };
  context.updateHardwareLabVisibility = function updateHardwareLabVisibility() {
    context.$('#hardwareLab').classList.toggle('hidden', !context.hardwareLabAvailable());
  };
}
export function initialize(context) {
  context.DEFAULT_CPP =
    '/*\n  AB MakerIDE - MS Robotika\n  Prueba minima para Arduino Uno R3\n  Sin sensores ni librerias externas\n  LED integrado: D13 (LED_BUILTIN)\n*/\n\nconst byte LED = LED_BUILTIN;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(9600);\n  Serial.println("AB MakerIDE - Arduino Uno listo");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  Serial.println("LED encendido");\n  delay(500);\n\n  digitalWrite(LED, LOW);\n  Serial.println("LED apagado");\n  delay(500);\n}\n';
  context.SAVEKEY = 'ab-makeride-project-v2';
  context.MIGRATION_BACKUP = 'ab-makeride-before-clean-start-v1';
  try {
    const project = localStorage.getItem(context.SAVEKEY);
    if (project && !localStorage.getItem(context.MIGRATION_BACKUP))
      localStorage.setItem(context.MIGRATION_BACKUP, project);
  } catch (_e) {
    /* La exportacion JSON sigue disponible */
  }
  context.$ = (s) => document.querySelector(s);
  context.$$ = (s) => [...document.querySelectorAll(s)];
  context.IDE_VERSION = document.documentElement.dataset.ideVersion || 'unknown';
  context.recoveryStorageError = false;
  context.state = {
    physicalProfile: 'board-unspecified',
    lang: 'cpp',
    files: { cpp: '', py: '' },
    name: 'mi-proyecto',
    fqbn: 'arduino:avr:uno',
    port: '',
    baud: 9600,
    uploadSpeed: 115200,
    retrySlow: false,
    panel: 'project',
    pane: 'console',
    ports: [],
    choices: [],
    catalogOk: false,
    catalogError: '',
    catalogWarning: '',
    catalogSource: '',
    catalogCount: 0,
    tools: {},
    serialId: 0,
    serialConnected: false,
    simRunning: false,
    simTimer: null,
    apiReady: false,
    busy: false,
    dirty: false,
    sidebarOpened: true,
  };
  context.toasts = undefined;
  context.storageConflict = context.recoveryStorageError;
  context.agentProjectId = '';
  context.draftBackups = [];
  context.lastExport = '';
  window.addEventListener('pagehide', () => {
    clearTimeout(context.saveDelay);
    context.state.files[context.state.lang] = context.$('#code').value;
    context.save();
  });
  context.saveDelay = undefined;
  context.keywordsCPP =
    /\b(?:void|const|int|float|double|char|bool|long|unsigned|while|if|else|for|return|true|false|HIGH|LOW|INPUT|OUTPUT|static|class|struct|break|continue)\b/g;
  context.keywordsPY =
    /\b(?:from|import|as|def|class|while|True|False|None|if|elif|else|for|in|not|and|or|pass|return|global|break|continue|with|try|except|print)\b/g;
  context.$('#code').addEventListener('input', () => {
    RobotActivity.invalidate('build');
    context.state.files[context.state.lang] = context.$('#code').value;
    context.updateHL();
    context.updateCaret();
    context.scheduleSave();
    context.scheduleAdvisor();
    context.refreshSketchTargetNotice();
  });
  context.$('#code').addEventListener('scroll', context.updateHL);
  context.$('#code').addEventListener('click', context.updateCaret);
  context.$('#code').addEventListener('keyup', context.updateCaret);
  context.$('#code').addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.currentTarget,
        a = t.selectionStart,
        b = t.selectionEnd;
      t.setRangeText('  ', a, b, 'end');
      t.dispatchEvent(new Event('input'));
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      context.exportProject();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      context.verify();
    }
  });
  context
    .$$('[data-lang]')
    .forEach((x) => x.addEventListener('click', () => context.setLang(x.dataset.lang)));
  context
    .$$('[data-pane]')
    .forEach((x) => x.addEventListener('click', () => context.switchPane(x.dataset.pane)));
  context
    .$('#clearBtn')
    .addEventListener('click', () => context.$('#pane-' + context.state.pane).replaceChildren());
  context.$('#projectFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) context.importProject(f);
    e.target.value = '';
  });
  context.csrfSession = '';
}
