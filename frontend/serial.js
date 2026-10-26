// serial feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.syncSerialControls = function syncSerialControls() {
    context.$('#serialSend').disabled =
      !context.state.serialConnected || context.state.busy || Boolean(context.state.agentWorking);
    const connect = context.$('#serialConnect');
    if (connect) connect.disabled = context.state.busy || Boolean(context.state.agentWorking);
    context.$('#serialSend').title = context.state.serialConnected
      ? 'Enviar al dispositivo conectado'
      : 'Conecta primero el monitor serie';
  };
  context.toggleSerial = async function toggleSerial() {
    if (context.state.busy) return context.toast('Espera a que termine la compilación o grabación');
    if (context.state.agentWorking)
      return context.toast('El agente está trabajando; espera antes de abrir el monitor');
    try {
      if (context.state.serialConnected) {
        await context.request('/api/serial/stop', {});
        context.state.serialConnected = false;
        context.state.serialError = '';
        context.showLog('serial', '[Sistema] Monitor serie desconectado', 'note');
      } else {
        if (!context.checkSelection(true)) return;
        const result = await context.request('/api/serial/start', {
          port: context.state.port,
          baud: context.state.baud,
        });
        context.state.serialConnected = result.connected;
        context.state.serialError = result.error || '';
        context.showLog(
          'serial',
          `[Sistema] Abierto ${context.state.port} (${context.state.baud} baudios)`,
          'good',
        );
        context.switchPane('serial');
      }
      context.renderSidebar();
    } catch (error) {
      context.state.serialConnected = false;
      context.state.serialError = error.message;
      context.toast(error.message);
      context.showLog('serial', error.message, 'bad');
      context.switchPane('serial');
      if (context.state.panel === 'boards') context.renderSidebar();
    } finally {
      context.syncSerialControls();
    }
  };
  context.refreshSerial = async function refreshSerial() {
    try {
      const result = await context.request('/api/serial/poll?since=' + context.state.serialId);
      const changed = context.state.serialConnected !== result.connected,
        previous = context.state.serialError || '';
      context.state.serialConnected = result.connected;
      context.state.serialError = result.error || '';
      context.state.serialId = result.last_id;
      for (const message of result.messages)
        context.showLog(
          'serial',
          message.text,
          message.text.startsWith('[Sistema] Error')
            ? 'bad'
            : message.text.startsWith('[Sistema]')
              ? 'note'
              : 'good',
        );
      if (context.state.serialError && context.state.serialError !== previous)
        context.toast(context.state.serialError);
      if (changed && context.state.panel === 'boards') context.renderSidebar();
    } catch (error) {
      const changed = context.state.serialConnected;
      context.state.serialConnected = false;
      if (changed) {
        context.state.serialError =
          'No se puede consultar el monitor serie. Estado de la conexión desconocido.';
        context.showLog('serial', context.state.serialError, 'bad');
        if (context.state.panel === 'boards') context.renderSidebar();
      }
    } finally {
      context.syncSerialControls();
    }
  };
  context.runTerminal = async function runTerminal() {
    const box = context.$('#terminalCommand'),
      raw = box.value.trim().toLowerCase();
    if (!raw) return;
    box.value = '';
    context.showLog('console', 'AB> ' + raw, 'cmd');
    if (raw === 'help') {
      context.showOutput(
        'console',
        'Comandos guiados: help, version, ports, cores, libraries, details, install esp32, install avr. No es PowerShell; no ejecuta shell arbitrario.',
      );
      return;
    }
    if (raw === 'install esp32' || raw === 'install avr') {
      const core = raw === 'install esp32' ? 'esp32:esp32' : 'arduino:avr';
      if (
        !(await context.confirmAction(
          '¿Instalar/actualizar ' + core + ' con Arduino CLI? Se descargarán paquetes.',
        ))
      )
        return;
      box.disabled = true;
      try {
        const r = await context.request('/api/terminal/install-core', { core, confirm: true });
        context.showOutput('console', r.output);
        context.toast(r.ok ? 'Núcleo instalado' : 'No se pudo instalar el núcleo');
      } catch (e) {
        context.showLog('console', e.message, 'bad');
      } finally {
        box.disabled = false;
      }
      return;
    }
    if (!context.allowedTerminal[raw]) {
      context.showLog(
        'console',
        'Comando no permitido. Escribe help para ver las opciones seguras.',
        'bad',
      );
      return;
    }
    try {
      const r = await context.request('/api/terminal/command', {
        action: context.allowedTerminal[raw],
      });
      context.showOutput('console', r.output || '[Sin salida]');
    } catch (e) {
      context.showLog('console', e.message, 'bad');
    }
  };
  context.runPython = async function runPython() {
    if (context.state.agentWorking) return context.toast('Espera a que termine el agente');
    if (context.state.lang !== 'py' || !context.checkSelection(true)) return;
    if (
      !(await context.confirmAction(
        'Ejecutar código MicroPython en RAM, sin sobrescribir main.py de la placa. ¿Continuar?',
      ))
    )
      return;
    context.switchPane('console');
    context.showLog('console', 'MicroPython · ejecución en RAM (mpremote)', 'cmd');
    context.busy(true);
    try {
      const r = await context.request('/api/micropython/run', {
        code: context.state.files.py,
        port: context.state.port,
      });
      context.showOutput('console', r.output);
      context.toast(r.ok ? 'Ejecución enviada a placa' : 'Error al ejecutar MicroPython');
    } catch (e) {
      context.showLog('console', e.message, 'bad');
    } finally {
      context.busy(false);
      context.refreshSerial();
    }
  };
}
export function initialize(context) {
  context.syncSerialControls();
  setInterval(() => {
    if (context.state.apiReady) context.refreshSerial();
  }, 1100);
  context.allowedTerminal = {
    version: 'version',
    ports: 'ports',
    boards: 'ports',
    cores: 'cores',
    libraries: 'libraries',
    details: 'esp32_details',
  };
  context.$('#terminalRun').onclick = context.runTerminal;
  context.$('#terminalCommand').onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      context.runTerminal();
    }
  };
  context.$('#serialSend').onclick = async () => {
    const el = context.$('#serialText');
    if (!el.value) return;
    try {
      await context.request('/api/serial/send', { text: el.value + '\n' });
      context.showLog('serial', 'TX > ' + el.value, 'cmd');
      el.value = '';
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#serialText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      context.$('#serialSend').click();
    }
  });
}
