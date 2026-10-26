// ai feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.saveAiPreferences = function saveAiPreferences() {
    try {
      localStorage.setItem(
        context.AI_PREFERENCES,
        JSON.stringify({
          provider: context.$('#aiProvider').value,
          model: context.$('#aiModel').value,
          agent: context.$('#execProvider').value,
          mode: context.$('#execMode').value,
          autoOpen: context.$('#agentAutoOpen').checked,
        }),
      );
    } catch (_e) {
      context.toast('No se pudo guardar la configuración IA en este navegador');
    }
  };
  context.cleanTaskInputs = function cleanTaskInputs() {
    for (const id of [
      'execTask',
      'chatInput',
      'wizardGoal',
      'wizardParts',
      'wizardConstraints',
      'serialText',
      'terminalCommand',
    ]) {
      const input = context.$('#' + id);
      if (input) {
        input.value = '';
        input.setAttribute('autocomplete', 'off');
      }
    }
    context.$('#chatLog').replaceChildren();
    context.$('#execAllowPC').checked = false;
    context.$('#execUseMCP').checked = false;
    context.$('#execAutoMCP').checked = false;
    context.$('#mcpConfig').value = '';
  };
  context.providerAccountNote = function providerAccountNote(provider) {
    if (provider === 'google')
      return 'Gemini online con tu propia clave de Google AI Studio. Algunos modelos ofrecen cuota gratuita limitada; depende de tu cuenta, región y facturación. En el nivel gratuito Google puede usar los datos para mejorar sus productos. Este conector propone código; no ejecuta herramientas MCP ni graba placas. Pendiente de validar con una cuenta real.';
    if (provider === 'local')
      return 'Plantillas locales sin IA: no usan una cuenta ni consumen saldo de un proveedor.';
    if (provider === 'ollama')
      return 'Ollama necesita tu instalación y recursos locales. Esta integración sigue pendiente de validación real por el autor.';
    const account =
      'Usa tu propia cuenta, sesión y cuota del proveedor. MakerIDE no incluye saldo, suscripción ni acceso gratuito a IA. ';
    return (
      account +
      (provider === 'codex'
        ? 'Codex está probado en uso real por el autor.'
        : 'Integración experimental: pendiente de validación real por el autor.')
    );
  };
  context.renderAiModels = function renderAiModels(preferred) {
    const provider = context.$('#aiProvider').value,
      select = context.$('#aiModel');
    select.replaceChildren();
    for (const model of context.AI_MODELS[provider] || []) {
      const o = document.createElement('option');
      o.value = model;
      o.textContent = model;
      select.appendChild(o);
    }
    if (preferred && [...select.options].some((o) => o.value === preferred))
      select.value = preferred;
    context.$('#aiModel').disabled = ['local', 'codex', 'claude_code'].includes(provider);
    context
      .$('#aiKeyGroup')
      .classList.toggle('hidden', ['local', 'ollama', 'codex', 'claude_code'].includes(provider));
    context.$('#aiTest').disabled = provider === 'local';
    context.$('#aiAccountNote').textContent = context.providerAccountNote(provider);
  };
  context.saveAiConfig = async function saveAiConfig() {
    const provider = context.$('#aiProvider').value,
      model = context.$('#aiModel').value,
      key = context.$('#aiKey').value;
    const result = await context.request('/api/ai/config', { provider, model, key });
    context.saveAiPreferences();
    context.$('#aiKey').value = '';
    context.$('#aiState').textContent =
      provider === 'local' ? 'PLANTILLAS' : provider.toUpperCase() + ' · CONFIGURADO';
    context.toast(
      provider === 'local'
        ? 'Plantillas locales activas'
        : 'Proveedor seleccionado. Prueba la conexión.',
    );
    return result;
  };
  context.initAi = async function initAi() {
    try {
      const r = await context.request('/api/ai/status');
      if (r.models) context.AI_MODELS = { ...context.AI_MODELS, ...r.models };
      let preferred = {};
      try {
        preferred = JSON.parse(localStorage.getItem(context.AI_PREFERENCES) || '{}') || {};
      } catch (_e) {}
      const provider = Object.hasOwn(context.AI_MODELS, preferred.provider)
        ? preferred.provider
        : r.provider && r.provider !== 'local'
          ? r.provider
          : r.configured?.codex
            ? 'codex'
            : 'local';
      context.$('#aiProvider').value = provider;
      context.renderAiModels(preferred.model || r.model);
      if (['codex', 'claude_code'].includes(preferred.agent))
        context.$('#execProvider').value = preferred.agent;
      if (['consultar', 'supervisado', 'autonomo', 'total'].includes(preferred.mode))
        context.$('#execMode').value = preferred.mode;
      if (typeof preferred.autoOpen === 'boolean')
        context.$('#agentAutoOpen').checked = preferred.autoOpen;
      context.renderAgentAccountNote();
      context.agentPermissionsView();
      context.$('#aiState').textContent =
        provider === 'local'
          ? 'PLANTILLAS'
          : provider === r.provider
            ? provider.toUpperCase() + ' · CONFIGURADO'
            : provider.toUpperCase() + ' · SELECCIONADO';
    } catch (e) {
      context.$('#aiState').textContent = 'SIN CONEXIÓN';
    }
  };
  context.sendCloudAgent = async function sendCloudAgent(prompt) {
    const button = context.$('#chatSend');
    button.disabled = true;

    const context = context.$('#aiSendCode').checked
      ? context.state.files[context.state.lang].slice(0, 24000)
      : '';
    try {
      await context.saveAiConfig();
      const result = await context.request('/api/ai/chat', {
        prompt,
        code: context,
        lang: context.state.lang,
        fqbn: context.state.fqbn,
      });
      const answer = result.text;
      const codeMatch = answer.match(/```(?:cpp|c\+\+|arduino|ino|python|py)?\s*\n([\s\S]*?)```/i);
      const explanation = answer.replace(/```[\s\S]*?```/g, '[Código propuesto debajo]').trim();
      const el = document.createElement('div');
      el.className = 'msg bot';
      const intro = document.createElement('div');
      intro.textContent =
        '◈ ' +
        result.provider +
        ' / ' +
        result.model +
        (['codex', 'claude_code'].includes(result.provider)
          ? ' · agente CLI · propuesta sin permisos de escritura'
          : ' · respuesta del proveedor');
      el.appendChild(intro);
      const body = document.createElement('div');
      body.textContent = explanation;
      body.className = 'agent-explanation';
      el.appendChild(body);
      if (codeMatch && codeMatch[1].length <= 300000) {
        const code = codeMatch[1].trim() + '\n';
        const preview = document.createElement('pre');
        preview.textContent = code;
        el.appendChild(preview);
        const langFence = (codeMatch[0].match(/^```([A-Za-z+]+)/) || [])[1]?.toLowerCase() || '';
        const matches =
          Boolean(langFence) &&
          (context.state.lang === 'cpp'
            ? ['cpp', 'c++', 'arduino', 'ino'].includes(langFence)
            : ['py', 'python'].includes(langFence));
        if (!matches) {
          const warn = document.createElement('div');
          warn.textContent =
            '⚠ Código en ' +
            langFence +
            ' distinto del archivo actual; no se ofrece aplicación automática.';
          el.appendChild(warn);
        }
        const apply = document.createElement('button');
        apply.className = 'action small';
        apply.textContent = '↳ Revisar y aplicar propuesta al archivo';
        apply.disabled = !matches;
        apply.onclick = async () => {
          if (
            !(await context.confirmAction(
              'El código de IA puede contener errores. ¿Reemplazar el archivo actual? Exporta antes si quieres conservarlo.',
            ))
          )
            return;
          // Backup local before applying any untrusted model-generated code.
          const old = context.state.files[context.state.lang];
          context.draftBackups.unshift({
            date: new Date().toISOString(),
            lang: context.state.lang,
            code: old,
          });
          context.draftBackups = context.draftBackups.slice(0, 7);
          context.state.files[context.state.lang] = code;
          context.$('#code').value = code;
          context.updateHL();
          context.scheduleSave();
          context.scheduleAdvisor();
          context.toast('Propuesta insertada; revisa, compila y valida antes de grabar.');
        };
        el.appendChild(apply);
      }
      if (result.secrets_redacted) {
        const note = document.createElement('div');
        note.textContent = `Privacidad: ${result.secrets_redacted} posible(s) secreto(s) redactado(s) antes del envío.`;
        el.prepend(note);
      }
      context.$('#chatLog').appendChild(el);
      context.$('#chatLog').scrollTop = context.$('#chatLog').scrollHeight;
      context.$('#aiState').textContent = '● IA RESPONDE';
    } catch (e) {
      context.bot('La IA no ha respondido: ' + e.message);
      context.$('#aiState').textContent = 'ERROR IA';
    } finally {
      button.disabled = false;
    }
  };
  context.restoreAiBackup = async function restoreAiBackup() {
    try {
      const a = context.draftBackups;
      const item = a.find((x) => x.lang === context.state.lang);
      if (!item) return context.toast('No hay copia anterior para este lenguaje');
      if (
        !(await context.confirmAction(
          '¿Recuperar el archivo anterior a la última propuesta IA? Se reemplazará el contenido actual.',
        ))
      )
        return;
      context.state.files[context.state.lang] = item.code;
      context.$('#code').value = item.code;
      context.updateHL();
      context.scheduleSave();
      context.scheduleAdvisor();
      context.toast('Copia local recuperada');
    } catch (e) {
      context.toast('No se puede acceder a la copia de seguridad');
    }
  };
}
export function initialize(context) {
  context.AI_MODELS = {
    local: [],
    google: ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'],
    openrouter: ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free'],
    ollama: ['gemma3:4b', 'qwen2.5-coder:7b'],
    codex: ['default'],
    claude_code: ['default'],
  };
  context.AI_PREFERENCES = 'ab-makeride-ai-preferences-v1';
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) location.reload();
    else context.cleanTaskInputs();
  });
  context.$('#aiProvider').addEventListener('change', () => context.renderAiModels());
  context.$('#aiReset').onclick = async () => {
    if (
      !(await context.confirmAction(
        '¿Borrar todas las claves API de la memoria del servidor y desactivar la IA remota?',
      ))
    )
      return;
    try {
      await context.request('/api/ai/reset', {});
      context.$('#aiProvider').value = 'local';
      context.$('#aiKey').value = '';
      context.renderAiModels();
      context.saveAiPreferences();
      context.$('#aiState').textContent = 'CLAVES BORRADAS';
      context.toast('Credenciales eliminadas de la sesión local');
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#aiSave').onclick = async () => {
    try {
      await context.saveAiConfig();
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#aiTest').onclick = async () => {
    context.$('#aiTest').disabled = true;
    try {
      await context.saveAiConfig();
      const d = await context.request('/api/ai/chat', {
        prompt: 'Responde exactamente: CONEXION OK',
        test: true,
        lang: 'cpp',
      });
      context.bot('Prueba validada: ' + d.provider + '/' + d.model + ' → CONEXION OK');
      context.$('#aiState').textContent = '● IA VALIDADA';
      context.toast('Modelo respondió exactamente al desafío');
    } catch (e) {
      context.bot('Error de conexión IA: ' + e.message);
      context.$('#aiState').textContent = 'ERROR IA';
    } finally {
      context.$('#aiTest').disabled = false;
    }
  };
  context.$('#wizardBuild').onclick = () => {
    const goal = context.$('#wizardGoal').value.trim(),
      parts = context.$('#wizardParts').value.trim(),
      constraints = context.$('#wizardConstraints').value.trim();
    if (goal.length < 12) return context.toast('Describe el objetivo con al menos 12 caracteres');
    const currentHardware =
      context.lab.connections
        .map((c) => context.LAB_KINDS[c.kind] + ' GPIO' + c.gpio + ' ' + c.voltage + 'V')
        .join(', ') || 'ninguno conectado';
    const task = `QUIERO DESARROLLAR ESTE PROYECTO MAKER:
Perfil físico declarado del proyecto: ${context.state.physicalProfile} (no deducido del conversor USB)
Cableado declarado: ${currentHardware} (no certificado)
Wi-Fi previsto: ${context.$('#hwWifi').checked ? 'sí' : 'no'}
Objetivo: ${goal}
Componentes confirmados: ${parts || 'No definidos; pregunta antes de inventar pines'}
Restricciones/Conexiones: ${constraints || 'Por confirmar'}
Placa/FQBN del IDE: ${context.state.fqbn}
Lenguaje: ${context.state.lang}

Entrega en orden: 1) resumen funcional; 2) materiales y alimentación segura; 3) tabla de conexiones con incertidumbres; 4) librerías Arduino exactas a verificar; 5) sketch completo; 6) pruebas y diagnóstico. No inventes resultados. Si el objetivo solicita compilar o cargar, completa esas fases con el agente y los permisos autorizados; una propuesta de código no acredita carga. No propongas contraseñas reales.`;
    if (['codex', 'claude_code'].includes(context.$('#aiProvider').value)) {
      context.$('#execProvider').value = context.$('#aiProvider').value;
      context.$('#agentWorkbench').open = true;
      context.$('#execTask').value = task;
      context.$('#execTask').focus();
      context.toast('Proyecto preparado para el agente. Elige permisos y pulsa Ejecutar agente.');
      return;
    }
    if (context.$('#aiProvider').value === 'local') {
      context.bot(
        'Para este proyecto configura Gemma/Ollama, o abre Ejecutar tarea real para usar Codex o Claude Code.',
      );
      context.$('#chatInput').value = task;
      return;
    }
    context.userMsg(goal);
    context.sendCloudAgent(task);
  };
}
