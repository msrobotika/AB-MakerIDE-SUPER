// agent feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.renderAgentAccountNote = function renderAgentAccountNote() {
    context.$('#execAccountNote').textContent = context.providerAccountNote(
      context.$('#execProvider').value,
    );
  };
  context.agentPermissionsView = function agentPermissionsView() {
    const mode = context.$('#execMode').value,
      warning = context.$('#execWarning');
    warning.classList.toggle('danger-warning', mode === 'total');
    warning.textContent = {
      consultar: 'Solo análisis. No debe modificar los archivos del proyecto.',
      supervisado:
        'La CLI edita una copia del proyecto. Puedes abrir su código con respaldo; revisa el resultado antes de compilar.',
      autonomo:
        'Permite edición y herramientas de ejecución según la CLI. Podría alcanzar otros archivos o dispositivos: NO es aislamiento de sistema. Revísalo antes de activar.',
      total:
        'RIESGO ALTO: sin sandbox ni aprobaciones de la CLI. Puede leer o modificar archivos ajenos, borrar datos, usar la red e incluso intentar grabar placas mediante comandos. Recomendado SOLO en una máquina virtual. Exige consentimiento textual por tarea.',
    }[mode];
  };
  context.refreshAgentCLIs = async function refreshAgentCLIs() {
    try {
      const r = await context.request('/api/agents/status');
      context.$('#execStatus').textContent =
        `CLI Codex: ${r.installed.codex ? 'instalada' : 'no instalada'} · Claude Code: ${r.installed.claude_code ? 'instalada' : 'no instalada'}. Inicio de sesión y cuota sin comprobar. Carpeta de sesiones: ${r.workspace_base}`;
    } catch (e) {
      context.$('#execStatus').textContent = 'No disponible: ' + e.message;
    }
  };
  context.refreshMCP = async function refreshMCP() {
    try {
      const r = await context.request('/api/mcp/status');
      context.mcpNames = r.servers.map((s) => s.name);
      context.$('#mcpStatus').textContent =
        (context.mcpNames.length
          ? 'Configurados: ' +
            r.servers.map((s) => s.name + ' (' + s.transport + ')').join(', ') +
            '. Conexión aún no comprobada.'
          : 'Sin MCP configurados en MakerIDE.') +
        (r.credential_storage === 'memory-only'
          ? ' Solo memoria: no hay un llavero seguro disponible.'
          : r.persistent
            ? ' Configuración protegida por el sistema operativo.'
            : '');
    } catch (e) {
      context.mcpNames = [];
      context.$('#mcpStatus').textContent = e.message;
    }
  };
  context.renderAgentApprovals = function renderAgentApprovals(data) {
    const pending = data.pending_approvals || [],
      signature = JSON.stringify(pending.map((item) => item.id));
    if (signature === context.approvalSignature) return;
    context.approvalSignature = signature;
    const root = context.$('#agentApprovals');
    root.replaceChildren();
    for (const item of pending) {
      const box = document.createElement('div');
      box.className = 'boxinfo';
      const title = document.createElement('strong');
      title.textContent = 'Aprobación manual pendiente';
      box.appendChild(title);
      const description = document.createElement('pre');
      description.className = 'approval-description';
      description.textContent = item.description;
      box.appendChild(description);
      const answers = {},
        fields = [];
      const submit = document.createElement('button');
      submit.className = 'action small primary';
      submit.textContent = item.questions.length ? 'Enviar respuestas' : 'Autorizar esta vez';
      submit.disabled = Boolean(item.questions.length);
      for (const question of item.questions) {
        const label = document.createElement('label');
        label.textContent = question.question;
        const select = document.createElement('select');
        select.className = 'selector';
        select.appendChild(new Option('Elige una respuesta…', ''));
        for (const option of question.options) {
          const node = new Option(option.label, option.label);
          node.title = option.description;
          select.appendChild(node);
        }
        select.onchange = () => {
          answers[question.id] = select.value;
          submit.disabled = fields.some((field) => !field.value);
        };
        fields.push(select);
        label.appendChild(select);
        box.appendChild(label);
      }
      async function answer(decision) {
        submit.disabled = true;
        try {
          await context.request('/api/agents/approve', {
            job_id: data.job_id,
            approval_id: item.id,
            decision,
            answers,
          });
          box.remove();
        } catch (error) {
          context.toast(error.message);
          submit.disabled = false;
        }
      }
      submit.onclick = () => answer('allow');
      box.appendChild(submit);
      if (!item.questions.length) {
        const reject = document.createElement('button');
        reject.className = 'action small ghost';
        reject.textContent = 'Rechazar';
        reject.onclick = () => answer('deny');
        box.appendChild(reject);
      }
      root.appendChild(box);
    }
  };
  context.rememberAgent = function rememberAgent(id) {
    context.lastAgentId = id || '';
  };
  context.reportAgentOutcome = function reportAgentOutcome(r) {
    const agent =
      r.provider === 'codex' ? 'Codex' : r.provider === 'claude_code' ? 'Claude Code' : 'El agente';
    if (r.imported)
      return 'Proyecto importado por el usuario. No se ha ejecutado un agente ni grabado hardware.';
    if (r.legacy)
      return 'Archivo de una versión anterior recuperado. NO existe registro fiable de compilación ni grabación; revisa el código antes de importarlo.';
    if (r.interrupted || r.outcome === 'unknown_after_restart')
      return 'Servidor cerrado durante la tarea · ESTADO DEL HARDWARE DESCONOCIDO. No repitas grabación sin diagnosticar.';
    if (r.active)
      return 'Agente trabajando. Puedes cerrar esta pestaña; la sesión se podrá consultar al volver.';
    if (r.outcome === 'upload_pending')
      return (
        'Carga solicitada pendiente: no consta grabación verificada. La tarea sigue incompleta. ' +
        (r.error || '')
      );
    if (r.outcome === 'target_mismatch')
      return (
        'Destino incorrecto: el agente creó una ventana de PC sin autorización. El proyecto de la pantalla física sigue pendiente. ' +
        (r.error || '')
      );
    if (r.mode === 'consultar' && r.success)
      return 'Consulta completada. No se solicitó grabar firmware.';
    if (!r.success) return 'Tarea fallida o cancelada. No se confirma firmware instalado.';
    if (r.outcome === 'flash_reported_verified')
      return 'El registro declara firmware verificado. Falta comprobar en la pantalla que ejecuta el proyecto solicitado.';
    if (r.outcome === 'compiled_only')
      return (
        agent + ' terminó y hay evidencia de compilación, pero NO consta grabación verificada.'
      );
    return (
      agent +
      ' terminó; NO consta compilación o grabación verificadas. Revisa los archivos creados y continúa la tarea.'
    );
  };
  context.recoverAgentSession = async function recoverAgentSession(silent = false) {
    if (context.agentRunState.active) return;
    const stored = context.lastAgentId;
    try {
      const list = await context.request('/api/agents/history');
      const recent = list.recent || [];
      const picked =
        recent.find((x) => x.active) ||
        (!silent ? recent[0] : null) ||
        recent.find((x) => x.job_id === stored) ||
        (stored ? { job_id: stored } : null);
      if (!picked) {
        if (!silent) context.toast('No hay sesiones guardadas en este servidor');
        return;
      }
      context.agentRunState.id = picked.job_id;
      context.agentRunState.last = 0;
      context.agentRunState.lastLang = context.state.lang;
      context.agentFlowSync?.({job_id: r.job_id, provider, mode, active: true, evidence: {}});
      context.rememberAgent(picked.job_id);
      context.resetAgentStages();
      context.$('#agentWorkbench').open = true;
      document.body.dataset.right = 'ai';
      const r = await context.request(
        '/api/agents/poll?id=' + encodeURIComponent(picked.job_id) + '&since=0',
      );
      context.agentRunState.last = r.last_id;
      for (const e of r.events) context.appendAgentEvent(e);
      context.updateAgentStages(r);
      context.agentRunState.lastData = r;
      context.agentFlowSync?.(r);
      RobotActivity.report('agent', 'Agente CLI', {
        ...r,
        evidenceVerified: Boolean(r.response || r.events?.length || r.diff),
      });
      context.agentRunState.lastLang = r.file_name === 'main.py' ? 'py' : 'cpp';
      context.agentSetWorking(r.active);
      context.$('#execStatus').textContent =
        `Sesión recuperada: ${r.provider} · ${r.mode} · ${r.elapsed}s`;
      context.$('#agentResumeMessage').textContent = context.reportAgentOutcome(r);
      context.$('#agentContinue').disabled = r.active;
      if (r.active) {
        context.pollAgent();
      } else {
        context.agentRunState.id = null;
        context.showAgentResult(r);
      }
      if (!silent) context.toast('Sesión recuperada desde el servidor local');
    } catch (e) {
      if (!silent) context.toast('No se pudo recuperar la sesión: ' + e.message);
    }
  };
  context.agentSetWorking = function agentSetWorking(working) {
    context.state.agentWorking = working;
    context.busy(context.state.busy);
    context.syncSerialControls();
    context.agentRunState.active = working;
    context.agentFlowWorking?.(working);
    context.$('#execRun').disabled = working;
    context.$('#execStop').disabled = !working;
    context.$('#execProvider').disabled = working;
    context.$('#execMode').disabled = working;
    context.$('#execHardware').disabled = working;
    context.$('#execAllowPC').disabled = working;
    context.$('#execUseMCP').disabled = working;
    context.$('#mcpSave').disabled = working;
    context.$('#execAutoMCP').disabled = working;
  };
  context.resetAgentStages = function resetAgentStages() {
    context.$('#agentStages').classList.remove('hidden');
    context.$('#agentRawLog').textContent = '';
    context.agentFlowReset?.();
    context.$('#agentEventCount').textContent = '0 eventos';
    context.agentRunState.eventCount = 0;
    context.agentRunState.evidence = {};
    context.$$('[data-evidence]').forEach((el) => {
      el.classList.remove('observed');
      el.querySelector('.stage-icon').textContent = '○';
      el.querySelector('small').textContent = 'Sin evidencia todavía';
    });
  };
  context.updateAgentStages = function updateAgentStages(data) {
    context.renderAgentApprovals(data);
    context.$('#agentStageElapsed').textContent = (data.elapsed || 0).toFixed(1) + ' s';
    const evidence = data.evidence || {};
    for (const [key, yes] of Object.entries(evidence)) {
      const el = context.$('[data-evidence="' + key + '"]');
      if (!el) continue;
      el.classList.toggle('observed', yes === true);
      el.querySelector('.stage-icon').textContent = yes === true ? '✓' : '○';
      el.querySelector('small').textContent =
        yes === true ? 'Observado en registro' : data.active ? 'Esperando evidencia' : 'No consta';
    }
  };
  context.appendAgentEvent = function appendAgentEvent(ev) {
    context.agentRunState.eventCount = (context.agentRunState.eventCount || 0) + 1;
    context.agentFlowEvent?.(ev);
    context.$('#agentEventCount').textContent =
      context.agentRunState.eventCount + ' eventos vistos';
    const pre = context.$('#agentRawLog');
    // Append bounded text only. The raw log never executes HTML.
    pre.textContent = (pre.textContent + '[' + (ev.kind || 'log') + '] ' + ev.text + '\n').slice(
      -85000,
    );
    if (ev.kind === 'milestone') context.showLog('console', '[Agente] ' + ev.text, 'good');
  };
  context.openAgentCode = async function openAgentCode(data, automatic = false) {
    if (typeof data.modified_code !== 'string' || !data.diff) return false;
    const lang = data.file_name === 'main.py' ? 'py' : 'cpp';
    if (context.state.lang !== lang || context.storageConflict) return false;
    const current = context.$('#code').value;
    if (automatic) {
      if (
        !context.$('#agentAutoOpen').checked ||
        data.success !== true ||
        data.cancelled ||
        data.interrupted ||
        data.legacy ||
        context.agentProjectId === data.job_id ||
        !window.crypto?.subtle
      )
        return false;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current));
      const sha = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join(
        '',
      );
      if (
        sha !== data.before_sha256 ||
        context.$('#code').value !== current ||
        context.state.lang !== lang
      )
        return false;
    } else if (
      !(await context.confirmAction(
        '¿Abrir el código generado en el editor? Se guardará una copia del código actual; revisa las diferencias.',
      ))
    )
      return false;
    try {
      const list = context.draftBackups;
      if (!Array.isArray(list)) throw Error('Copia dañada');
      list.unshift({ date: new Date().toISOString(), lang, code: current, job_id: data.job_id });
      context.draftBackups = list.slice(0, 7);
    } catch (_e) {
      context.toast(
        'No se pudo guardar la copia anterior; exporta el proyecto antes de abrir la propuesta.',
      );
      return false;
    }
    context.state.files[lang] = data.modified_code;
    context.$('#code').value = data.modified_code;
    if (data.hardware_profile) context.setPhysicalProfile(data.hardware_profile);
    context.rememberAgentProject(data.job_id);
    RobotActivity.invalidate('build');
    context.updateHL();
    context.updateCaret();
    context.save();
    context.scheduleAdvisor();
    context.refreshSketchTargetNotice();
    context.showLog(
      'console',
      'Código del agente abierto en el editor; copia anterior guardada. Guarda el proyecto ZIP para conservar los archivos auxiliares.',
      'note',
    );
    context.toast('Código del agente abierto · copia anterior guardada');
    return true;
  };
  context.rememberCompletedProject = async function rememberCompletedProject(data) {
    if (
      data.success !== true ||
      data.active ||
      data.cancelled ||
      data.interrupted ||
      context.storageConflict ||
      !window.crypto?.subtle
    )
      return;
    if ((data.file_name === 'main.py' ? 'py' : 'cpp') !== context.state.lang) return;
    const current = context.$('#code').value;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current));
    const sha = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
    if (
      context.$('#code').value === current &&
      (sha === data.before_sha256 || current === data.modified_code)
    ) {
      if (context.agentProjectId !== data.job_id) RobotActivity.invalidate('build');
      context.rememberAgentProject(data.job_id);
    }
  };
  context.saveAgentProject = async function saveAgentProject(data) {
    try {
      const current = data.current_draft || context.agentProjectId === data.job_id;
      const response = await fetch('/api/agents/project/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AB-Session': await context.sessionToken(),
        },
        body: JSON.stringify({
          job_id: data.job_id,
          ...(current ? { code: context.$('#code').value } : {}),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw Error(error.error || 'No se pudo guardar el proyecto');
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = 'MakerIDE-' + data.job_id.slice(0, 8) + '.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (current) {
        context.state.files[context.state.lang] = context.$('#code').value;
        context.lastExport = context.draftSnapshot();
        context.save();
      }
      context.toast('Descarga del proyecto solicitada con código y auxiliares');
    } catch (e) {
      context.toast('No se pudo guardar: ' + e.message);
    }
  };
  context.showAgentResult = function showAgentResult(data) {
    context.$('#agentOpenCode').disabled = typeof data.modified_code !== 'string' || !data.diff;
    context.$('#agentSaveProject').disabled = data.active === true;
    const el = document.createElement('div');
    el.className = 'msg bot';
    const text = document.createElement('div');
    text.textContent =
      context.reportAgentOutcome(data) +
      '\n' +
      (data.error || '') +
      `\nTiempo: ${data.elapsed}s · Modo: ${data.mode}\n` +
      (data.response || '(La CLI no devolvió texto.)');
    el.appendChild(text);
    const saveProject = document.createElement('button');
    saveProject.className = 'action small';
    saveProject.textContent = 'Guardar proyecto del agente (.zip)';
    saveProject.onclick = () => context.saveAgentProject(data);
    el.appendChild(saveProject);
    if (typeof data.modified_code === 'string') {
      const saveSketch = document.createElement('button');
      saveSketch.className = 'action small ghost';
      saveSketch.textContent = 'Guardar solo sketch';
      saveSketch.onclick = () =>
        context.download(
          data.file_name || 'sketch.ino',
          data.modified_code,
          'text/plain;charset=utf-8',
        );
      el.appendChild(saveSketch);
    }
    if (data.diff) {
      const details = document.createElement('details');
      details.className = 'agent-raw';
      const head = document.createElement('summary');
      head.textContent = 'Ver diferencias con el código anterior';
      details.appendChild(head);
      const diff = document.createElement('pre');
      diff.className = 'agent-diff';
      diff.textContent = data.diff;
      details.appendChild(diff);
      el.appendChild(details);
    }
    if (data.changed_files && data.changed_files.length) {
      const more = document.createElement('div');
      more.textContent =
        'Otros archivos creados o existentes en la sesión: ' +
        data.changed_files.join(', ') +
        '. «Guardar proyecto» incluye los archivos auxiliares; las próximas tareas conservan la copia al continuar el proyecto.';
      el.appendChild(more);
    }
    if (data.modified_code !== null && typeof data.modified_code === 'string' && data.diff) {
      const btn = document.createElement('button');
      btn.className = 'action small primary';
      btn.textContent = 'Abrir código en el editor';
      btn.title = 'Guarda una copia del código actual antes de abrir la propuesta';
      btn.onclick = async () => {
        if (await context.openAgentCode(data)) btn.disabled = true;
      };
      el.appendChild(btn);
      if (data.outcome !== 'target_mismatch')
        context.openAgentCode(data, true).then((opened) => {
          if (opened) btn.textContent = 'Código abierto · copia anterior guardada';
          return context.rememberCompletedProject(data);
        });
    } else context.rememberCompletedProject(data);
    context.$('#chatLog').appendChild(el);
    context.$('#chatLog').scrollTop = context.$('#chatLog').scrollHeight;
  };
  context.pollAgent = async function pollAgent() {
    if (!context.agentRunState.id) return;
    try {
      const r = await context.request(
        '/api/agents/poll?id=' +
          encodeURIComponent(context.agentRunState.id) +
          '&since=' +
          context.agentRunState.last,
      );
      RobotActivity.report('agent', 'Agente CLI', {
        ...r,
        evidenceVerified: Boolean(r.response || r.events?.length || r.diff),
      });
      context.agentRunState.last = r.last_id;
      for (const e of r.events) context.appendAgentEvent(e);
      context.updateAgentStages(r);
      context.agentFlowSync?.(r);
      context.$('#execStatus').textContent =
        `${r.provider} · ${r.mode} · ${r.elapsed}s · ${r.active ? 'ejecutando' : 'finalizado'}`;
      if (r.active) {
        setTimeout(context.pollAgent, 900);
        return;
      }
      context.agentSetWorking(false);
      context.agentRunState.id = null;
      context.agentRunState.lastData = r;
      context.$('#agentResumeMessage').textContent = context.reportAgentOutcome(r);
      context.$('#agentContinue').disabled = false;
      context.showAgentResult(r);
      context.toast(context.reportAgentOutcome(r));
    } catch (e) {
      RobotActivity.lost('agent', 'Agente CLI', e.message);
      context.$('#execStatus').textContent = 'No se pudo consultar el agente: ' + e.message;
      // A transient connection error must not erase the job ID: allow recovery.
      context.agentSetWorking(false);
      context.agentRunState.id = null;
      context.$('#agentResumeMessage').textContent =
        'Conexión interrumpida. Recupera la sesión antes de repetir la tarea.';
    }
  };
  context.authorizeAgent = function authorizeAgent(provider, mode, task) {
    if (context.agentConsentDialog.open) return Promise.resolve(null);
    const total = mode === 'total',
      input = context.$('#agentConsentInput');
    context.$('#agentConsentSummary').textContent =
      `${provider === 'codex' ? 'Codex' : 'Claude Code'} · ${context.$('#execMode').selectedOptions[0].textContent}. ${context.$('#agentAutoOpen').checked ? 'El código generado se abrirá con respaldo si no has editado el original.' : 'Revisarás el código antes de abrirlo en el editor.'}`;
    context.$('#agentConsentTask').textContent = task;
    if (context.$('#execUseMCP').checked)
      context.$('#agentConsentSummary').textContent +=
        ' MCP adicionales: ' +
        context.mcpNames.join(', ') +
        '. ' +
        (context.$('#execAutoMCP').checked
          ? 'AUTOMATIZACIÓN autorizada para esta tarea, sin aprobación por llamada. Pueden actuar fuera del proyecto.'
          : 'Aprobación manual: las solicitudes se mostrarán en el IDE antes de ejecutarse.');
    context.$('#agentConsentGroup').classList.toggle('hidden', !total);
    context.$('#agentConsentRisk').classList.toggle('hidden', !total);
    input.value = '';
    input.required = total;
    context.$('#agentConsentApprove').disabled = total;
    context.agentConsentDialog.returnValue = 'cancel';
    return new Promise((resolve) => {
      context.agentConsentDialog.addEventListener(
        'close',
        () => {
          const consent =
            context.agentConsentDialog.returnValue === 'authorize' ? input.value : null;
          input.value = '';
          resolve(consent);
        },
        { once: true },
      );
      context.agentConsentDialog.showModal();
      (total ? input : context.$('#agentConsentCancel')).focus();
    });
  };
}
export function initialize(context) {
  context.$('#execProvider').addEventListener('change', () => {
    context.renderAgentAccountNote();
    context.saveAiPreferences();
  });
  context.$('#execMode').addEventListener('change', context.saveAiPreferences);
  context.renderAgentAccountNote();
  context.agentRunState = {
    id: null,
    last: 0,
    active: false,
    lastLang: null,
    lastData: null,
    recovering: false,
  };
  context.$('#execMode').onchange = context.agentPermissionsView;
  context.agentPermissionsView();
  context.$('#agentTaskInspect').onclick = () => {
    context.$('#execTask').value =
      `Identifica y diagnostica la placa conectada, si es posible. FQBN seleccionado: ${context.state.fqbn}. Puerto seleccionado: ${context.state.port || 'ninguno'}. Comprueba únicamente lo necesario y revisa sketch.ino. No grabes ni cambies el programa. Resume los problemas y su solución sin volcar configuraciones enteras.`;
    context.$('#execTask').focus();
  };
  context.$('#agentTaskPong').onclick = () => {
    if (context.state.lang !== 'cpp') {
      context.toast('Selecciona sketch.ino');
      return;
    }
    if (context.state.fqbn !== 'esp32:esp32:esp32') {
      context.toast(
        'Para Pong, selecciona ESP32 Dev Module arriba (no Arduino Uno) y confirma el puerto.',
      );
      context.$('#quickBoard').focus();
      return;
    }
    if (!context.state.port) {
      context.toast('Selecciona el puerto COM de tu IdeaSpark.');
      context.$('#quickPort').focus();
      return;
    }
    context.$('#execTask').value =
      `PROYECTO ESP32 IDEASPARK: Diseña un juego Pong automático para pantalla ST7789 1,9 pulgadas 170x320 (horizontal) sin sensores ni pantalla táctil. La placa del usuario que funcionó empleó MOSI=23 SCLK=18 CS=15 DC=2 RST=4 BL=32; valida primero modelo, conexiones y puerto (seleccionado: ${context.state.port || 'sin seleccionar'}; FQBN: ${context.state.fqbn}) sin inventar la detección. Genera sketch completo usando Adafruit GFX y ST7789, compila realmente, y SOLO si el usuario autorizó acceso efectivo a hardware y el puerto/modelo son compatibles graba y verifica firmware. Resume separadamente código creado, compilación, grabación y pantalla NO OBSERVADA. No declares éxito visual hasta que lo confirme el usuario. Si solo generas código, indica claramente que falta la grabación.`;
    context.$('#agentWorkbench').open = true;
    context.$('#execTask').focus();
    context.toast('Pong preparado. Revisa placa, GPIO, permisos y autorización antes de ejecutar.');
  };
  context.$('#agentTaskBlink').onclick = () => {
    if (!context.state.port) {
      context.toast('Selecciona primero el puerto USB/COM en la barra superior');
      context.$('#quickPort').focus();
      return;
    }
    if (context.state.lang !== 'cpp') {
      context.toast('Selecciona sketch.ino para la prueba Arduino');
      return;
    }
    context.$('#execTask').value =
      `PRUEBA FÍSICA SOLICITADA: En el puerto ${context.state.port} con FQBN elegido ${context.state.fqbn}, comprueba la firma real del microcontrolador y la correspondencia con el perfil antes de grabar. Guarda copia del sketch, prepara Blink del LED integrado, compila, graba con verificación del firmware y presenta un resumen corto de las evidencias, errores y pasos restantes. No afirmes haber observado visualmente el LED; no uses otros puertos, no borres archivos fuera de tu sesión, no vuelques configuraciones gigantes. Si no estás autorizado por los permisos elegidos, informa y detente.`;
    context.$('#execTask').focus();
    context.toast('Tarea Blink preparada. Revisa los permisos y autoriza la ejecución.');
  };
  context.mcpNames = [];
  context.approvalSignature = '';
  context.$('#mcpRefresh').onclick = context.refreshMCP;
  context.$('#mcpPanel').addEventListener('toggle', () => {
    if (context.$('#mcpPanel').open) context.refreshMCP();
  });
  context.$('#mcpSave').onclick = async () => {
    try {
      if (context.state.agentWorking) return context.toast('Espera a que termine el agente');
      const value = JSON.parse(context.$('#mcpConfig').value);
      await context.request('/api/mcp/config', value);
      context.$('#mcpConfig').value = '';
      await context.refreshMCP();
      context.toast('Configuración MCP guardada; no se ha conectado ningún servidor.');
    } catch (e) {
      context.toast(e instanceof SyntaxError ? 'JSON MCP no válido' : e.message);
    }
  };
  context.$('#agentWorkbench').addEventListener('toggle', () => {
    if (context.$('#agentWorkbench').open) context.refreshAgentCLIs();
  });
  context.lastAgentId = '';
  context.$('#agentTaskRadar').onclick = () => context.loadDeviceExample('radar');
  context.$('#agentTaskCYD').onclick = () => context.loadDeviceExample('cyd');
  context.$('#agentRecover').onclick = () => context.recoverAgentSession(false);
  context.$('#agentContinue').onclick = () => {
    const prev = context.agentRunState.lastData;
    if (!prev || prev.active) return;
    context.rememberAgentProject(prev.job_id);
    const gap =
      prev.outcome === 'flash_reported_verified'
        ? 'El grabador informó de verificación; no se ha comprobado visualmente la pantalla. Solicita una prueba visual al usuario y diagnostica pantalla, rotación y luz de fondo si sigue negra.'
        : 'No consta una grabación verificada en el informe o la tarea se interrumpió. Comprueba primero el estado actual del hardware y las salidas anteriores sin borrar ni grabar a ciegas.';
    context.$('#execTask').value =
      `CONTINUAR PROYECTO PREVIO. Solicitud original resumida: ${prev.task_summary || '(no disponible)'}\nResultado registrado: ${context.reportAgentOutcome(prev)}\n${gap}\nNo des por terminado un juego solo porque finalizó la CLI. Verifica primero placa, GPIO, compilación y grabación; si falta una fase, completa únicamente lo que autorice el usuario. No repitas grabación si el estado de hardware es desconocido hasta diagnosticar.`;
    context.$('#execTask').focus();
    context.toast('Continuación preparada. Revisa y autoriza de nuevo su ejecución.');
  };
  context.$('#agentAutoOpen').onchange = context.saveAiPreferences;
  context.$('#agentOpenCode').onclick = () => {
    if (context.agentRunState.lastData) context.openAgentCode(context.agentRunState.lastData);
  };
  context.$('#agentSaveProject').onclick = () => {
    if (context.agentRunState.lastData) context.saveAgentProject(context.agentRunState.lastData);
  };
  context.agentConsentDialog = context.$('#agentConsentDialog');
  context.$('#agentConsentCancel').onclick = () => context.agentConsentDialog.close('cancel');
  context.$('#agentConsentInput').addEventListener('input', () => {
    context.$('#agentConsentApprove').disabled =
      context.$('#agentConsentInput').required &&
      context.$('#agentConsentInput').value !== 'ACCESO TOTAL';
  });
  context.$('#execRun').onclick = async () => {
    if (context.$('#execRun').disabled || context.agentConsentDialog.open) return;
    if (context.state.busy) return context.toast('Espera a que termine la operación actual');
    if (context.boardIdentity.running)
      return context.toast('Espera a que termine la identificación de la placa');
    const task = context.$('#execTask').value.trim(),
      provider = context.$('#execProvider').value,
      mode = context.$('#execMode').value;
    if (task.length < 3) return context.toast('Describe primero la tarea del agente');
    if (!context.state.apiReady)
      return context.toast('Conecta el servidor local antes de iniciar el agente');
    if (context.$('#execUseMCP').checked) {
      if (!['autonomo', 'total'].includes(mode))
        return context.toast('Para usar MCP adicionales elige Autónomo o Acceso total.');
      await context.refreshMCP();
      if (!context.mcpNames.length)
        return context.toast('Configura primero los servidores MCP en su panel.');
    }
    if (
      context.state.physicalProfile === 'board-unspecified' &&
      (context.state.fqbn === 'esp32:esp32:jczn_2432s028r' ||
        /\b(?:CYD|ESP32[- ]2432S028R)\b/i.test(task))
    )
      context.setPhysicalProfile('esp32-cyd-28');
    const consent = await context.authorizeAgent(provider, mode, task);
    if (consent === null) {
      context.$('#execStatus').textContent = 'Ejecución cancelada. El agente no se ha iniciado.';
      return;
    }
    if (mode === 'total' && consent !== 'ACCESO TOTAL')
      return context.toast('Acceso total no autorizado');
    if (mode !== 'consultar' && context.state.port) {
      try {
        const monitor = await context.request('/api/serial/poll?since=' + context.state.serialId);
        if (monitor.connected && monitor.port === context.state.port) {
          await context.request('/api/serial/stop', {});
          context.state.serialConnected = false;
          context.syncSerialControls();
          context.showLog(
            'console',
            'Monitor serie del IDE pausado para liberar el puerto de la tarea.',
            'note',
          );
        }
      } catch (e) {
        context.toast('No se pudo comprobar el puerto antes de iniciar: ' + e.message);
        return;
      }
    }
    context.saveAiPreferences();
    context.state.files[context.state.lang] = context.$('#code').value;
    context.save(); // Estado visual del borrador; el código no se persiste en el navegador.
    context.agentSetWorking(true);
    context.resetAgentStages();
    context.switchPane('console');
    RobotActivity.begin('agent', 'Agente CLI');
    context.$('#execStatus').textContent = 'Preparando copia de proyecto y arrancando CLI real…';
    try {
      const r = await context.request('/api/agents/start', {
        provider,
        mode,
        prompt: task,
        code: context.state.files[context.state.lang],
        lang: context.state.lang,
        fqbn: context.state.fqbn,
        confirm: true,
        full_consent: consent,
        port: context.state.port || '',
        parent_job_id: context.agentProjectId,
        hardware_profile: context.$('#execHardware').value,
        allow_pc_ui: context.$('#execAllowPC').checked,
        use_mcp: context.$('#execUseMCP').checked,
        mcp_auto_approve: context.$('#execUseMCP').checked && context.$('#execAutoMCP').checked,
      });
      if (r.hardware_profile) context.setPhysicalProfile(r.hardware_profile);
      context.agentRunState.id = r.job_id;
      context.agentRunState.last = 0;
      context.agentRunState.lastLang = context.state.lang;
      context.rememberAgent(r.job_id);
      context.$('#agentResumeMessage').textContent =
        'Trabajo iniciado. Puedes recuperar esta sesión si cierras la pestaña.';
      context.showLog(
        'console',
        `[Agente] Iniciada sesión ${provider}; modo ${mode}; workspace ${r.workspace}`,
        'cmd',
      );
      context.pollAgent();
    } catch (e) {
      RobotActivity.lost('agent', 'Agente CLI', e.message);
      context.agentSetWorking(false);
      context.$('#execStatus').textContent = e.message;
      context.toast(e.message);
    }
  };
  context.$('#execStop').onclick = async () => {
    if (!context.agentRunState.id) return;
    try {
      await context.request('/api/agents/cancel', { job_id: context.agentRunState.id });
      context.$('#execStatus').textContent = 'Solicitando detención del proceso…';
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#execTask').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      context.$('#execRun').click();
    }
  });
}
