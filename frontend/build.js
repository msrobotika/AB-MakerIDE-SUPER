// build feature. Shared runtime context stays private to bootstrap.
import { reviewDisplayTarget } from './target_review.js';
export function define(context) {
  context.updateBuildVisual = async function updateBuildVisual(d) {
    d = {
      ...d,
      success:
        d.success === true && d.exit_code === 0 && !d.cancelled && !d.interrupted && !d.error,
    };
    if (!d.active && d.success && d.source_sha256) {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(context.$('#code').value),
      );
      const sha = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(
        '',
      );
      d.stale =
        sha !== d.source_sha256 ||
        context.state.fqbn !== d.fqbn ||
        context.state.lang !== 'cpp' ||
        (d.action === 'upload' && d.port !== context.state.port) ||
        (Object.hasOwn(d, 'agent_project_id') && d.agent_project_id !== context.agentProjectId);
    }
    RobotActivity.report(
      'build',
      (d.action === 'upload' ? 'Compilar y grabar' : 'Compilación') +
        (d.fqbn ? ' · ' + d.fqbn : ''),
      { ...d, evidenceVerified: d.action !== 'upload' || d.flash_verified === true },
    );
    const panel = context.$('#buildProgress');
    panel.classList.remove('hidden');
    context.$('#buildStage').textContent =
      {
        compilación: 'Compilación Arduino CLI · en curso',
        grabación: 'Grabando en el dispositivo real',
        'reintento 115200': 'Recuperación USB a 115200 baudios',
        completado: 'Operación finalizada',
        error: 'Operación fallida',
        cancelado: 'Operación cancelada',
        interrumpido: 'Resultado desconocido · operación interrumpida',
      }[d.stage] || 'Preparando operación';
    context.$('#buildClock').textContent = (d.elapsed || 0).toFixed(1) + ' s';
    const percent =
      (d.stage === 'grabación' || d.stage === 'reintento 115200') && Number.isInteger(d.progress)
        ? d.progress
        : null;
    context.$('#buildPercent').textContent =
      percent === null
        ? d.active
          ? 'Tiempo real · % no disponible'
          : 'Sin porcentaje'
        : percent + ' % del bloque actual';
    const bar = context.$('#buildFill');
    bar.className = 'buildfill';
    if (d.active && percent === null) {
      bar.classList.add('indeterminate');
      bar.style.width = '35%';
      context.$('#buildMeter').removeAttribute('aria-valuenow');
    } else if (percent !== null && d.active) {
      bar.style.width = percent + '%';
      context.$('#buildMeter').setAttribute('aria-valuenow', String(percent));
    } else {
      bar.style.width = d.success ? '100%' : percent !== null ? percent + '%' : '0%';
      bar.classList.add(
        d.success
          ? d.action === 'upload' && !d.flash_verified
            ? 'unverified'
            : 'success'
          : 'failed',
      );
      if (d.success) context.$('#buildMeter').setAttribute('aria-valuenow', '100');
      else if (percent !== null)
        context.$('#buildMeter').setAttribute('aria-valuenow', String(percent));
      else context.$('#buildMeter').removeAttribute('aria-valuenow');
    }
    context.$('#buildCancel').disabled = !d.active;
    context.$('#buildDetail').textContent = d.stale
      ? 'Resultado de otra revisión o placa; vuelve a compilar.'
      : d.active
        ? 'Salida real en terminal · sin estimaciones de compilación'
        : d.success
          ? (d.action === 'upload'
              ? d.flash_verified
                ? 'Flash verificada; pantalla y periféricos pendientes'
                : 'Grabador terminó; verificación y funcionamiento físico pendientes'
              : 'Compilación terminada con salida 0') +
            ' · revisión ' +
            (d.source_sha256 || 'anterior').slice(0, 8)
          : d.error || 'Proceso interrumpido';
  };
  context.runCppJob = async function runCppJob(action) {
    if (context.state.busy || !context.checkSelection(action === 'upload')) return;
    if (action === 'upload' && context.hardwareLabAvailable() && context.lab.connections.length) {
      try {
        const r = await context.labCheck();
        if (r.errors) {
          context.$('#hardwareLab').open = true;
          context.toast('Grabacion bloqueada: conflictos en conexiones declaradas');
          return;
        }
        if (
          r.warnings &&
          !(await context.confirmAction(
            'Hay ' + r.warnings + ' advertencia(s) de hardware. ¿Revisadas antes de continuar?',
          ))
        )
          return;
      } catch (e) {
        context.toast('No se pudo auditar el circuito: ' + e.message);
        return;
      }
    }
    const targetWarning =
      action === 'upload'
        ? reviewDisplayTarget(
            context.$('#code').value,
            context.state.fqbn,
            context.state.physicalProfile,
          )
        : '';
    if (
      action === 'upload' &&
      !(await context.confirmAction(
        `${targetWarning ? 'REVISAR DESTINO: ' + targetWarning + '\n\n' : ''}GRABAR firmware REAL en ${context.state.port}\nPlaca: ${context.state.fqbn}\nVelocidad: ${context.state.uploadSpeed} baudios\nReintento 115200: ${context.state.retrySlow ? 'activado' : 'desactivado'}\nEsta acción sobrescribe el programa actual. ¿Confirmas?`,
      ))
    )
      return;
    context.state.files[context.state.lang] = context.$('#code').value;
    context.save();
    RobotActivity.begin('build', action === 'upload' ? 'Compilar y grabar' : 'Compilación');
    context.busy(true);
    context.switchPane('console');
    context.lastJobLine = 0;
    context.currentJobId = null;
    context.$('#buildProgress').classList.remove('hidden');
    context.$('#buildStage').textContent = 'Preparando…';
    context.$('#buildFill').className = 'buildfill indeterminate';
    context.$('#buildCancel').disabled = true;
    context.showLog(
      'console',
      '──── ' +
        (action === 'upload' ? 'COMPILAR Y GRABAR REAL' : 'COMPILACIÓN REAL') +
        ' · ' +
        context.state.fqbn +
        ' ────',
      'cmd',
    );
    try {
      const requestId = crypto.randomUUID().replaceAll('-', '');
      localStorage.setItem('ab-makeride-last-build-v1', requestId);
      const started = await context.request('/api/jobs/start', {
        request_id: requestId,
        action,
        lang: 'cpp',
        fqbn: context.state.fqbn,
        code: context.state.files.cpp,
        port: context.state.port,
        upload_speed: context.state.uploadSpeed,
        retry_slow: context.state.retrySlow,
        confirm: action === 'upload',
        agent_project_id: context.agentProjectId,
      });
      context.currentJobId = started.job_id;
      localStorage.setItem('ab-makeride-last-build-v1', context.currentJobId);
      while (true) {
        const d = await context.request(
          '/api/jobs/status?id=' +
            encodeURIComponent(context.currentJobId) +
            '&since=' +
            context.lastJobLine,
        );
        await context.updateBuildVisual(d);
        for (const line of d.lines) {
          context.showOutput('console', line.text);
          context.lastJobLine = line.id;
          if (/error:|fatal error:|Error during build/i.test(line.text))
            context.showLog('problems', line.text, 'bad');
        }
        if (!d.active) {
          if (!d.success) {
            context.latestCompilerError = d.lines.map((x) => x.text).join('\n');
            context.scheduleAdvisor();
          }
          context.showLog(
            'console',
            d.success
              ? d.action === 'upload'
                ? d.flash_verified
                  ? '✓ Grabación verificada. Comprueba ahora la pantalla o el comportamiento físico.'
                  : '⚠ Grabador terminó con salida 0; no consta verificación de bytes. Revisa el registro y el dispositivo.'
                : '✓ Compilación real finalizada'
              : '✕ Falló o se canceló. No se confirma grabación.',
            d.success ? 'good' : 'bad',
          );
          context.toast(
            d.success
              ? d.action === 'upload'
                ? 'Grabador terminado · funcionamiento físico pendiente'
                : '✓ Compilación completada'
              : 'Error: revisa el terminal',
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } catch (e) {
      RobotActivity.lost('build', 'Compilación / grabación', e.message);
      context.updateBuildVisual({
        active: false,
        success: false,
        error: 'Error de conexión: ' + e.message,
      });
      context.showLog('console', 'ERROR: ' + e.message, 'bad');
      context.$('#buildStage').textContent = 'Error al iniciar o consultar';
      context.$('#buildDetail').textContent = e.message;
      context.toast('Operación fallida: ' + e.message);
    } finally {
      context.busy(false);
      context.refreshSerial();
    }
  };
  context.verify = async function verify() {
    if (context.state.agentWorking)
      return context.toast('Espera a que termine el agente antes de compilar otra tarea');
    if (context.state.lang === 'cpp') return context.runCppJob('compile');
    if (context.state.busy || !context.checkSelection(false)) return;
    RobotActivity.begin('syntax', 'Sintaxis Python');
    context.busy(true);
    context.switchPane('console');
    try {
      const d = await context.request('/api/verify', { lang: 'py', code: context.state.files.py });
      RobotActivity.report('syntax', 'Sintaxis Python', {
        success: d.ok,
        verified: d.ok && d.mode === 'syntax_only',
      });
      context.showOutput('console', d.output);
      context.toast(d.ok ? 'Sintaxis correcta' : 'Error de sintaxis');
      if (!d.ok) {
        context.switchPane('problems');
        context.showOutput('problems', d.output);
      }
    } catch (e) {
      RobotActivity.lost('syntax', 'Sintaxis Python', e.message);
      context.toast(e.message);
    } finally {
      context.busy(false);
    }
  };
  context.upload = async function upload() {
    if (context.state.agentWorking)
      return context.toast('Espera a que termine el agente antes de iniciar otra grabación');
    if (context.state.lang === 'cpp') return context.runCppJob('upload');
    if (context.state.busy || !context.checkSelection(true)) return;
    if (
      !(await context.confirmAction(
        `SOBRESCRIBIR main.py REAL en ${context.state.port}. ¿Confirmas?`,
      ))
    )
      return;
    context.busy(true);
    context.switchPane('console');
    RobotActivity.begin('micropython', 'Guardar MicroPython');
    try {
      const d = await context.request('/api/upload', {
        confirm: true,
        port: context.state.port,
        fqbn: context.state.fqbn,
        code: context.state.files.py,
        lang: 'py',
      });
      RobotActivity.report('micropython', 'Guardar MicroPython', { ...d, success: d.ok });
      context.showOutput('console', d.output);
      context.toast(d.ok ? 'MicroPython desplegado' : 'No se confirmó el despliegue');
    } catch (e) {
      RobotActivity.lost('micropython', 'Guardar MicroPython', e.message);
      context.showLog('console', e.message, 'bad');
    } finally {
      context.busy(false);
      context.refreshSerial();
    }
  };
  context.scan = async function scan({ force = false, quiet = false } = {}) {
    /* A unique connected port can replace a stale selection after a bounded chip query. */
    let d;
    try {
      d = await context.request(
        '/api/boards?selected=' +
          encodeURIComponent(context.state.fqbn) +
          (force ? '&refresh=1' : ''),
      );
    } catch (e) {
      context.state.scanOk = false;
      context.refreshQuickSelectors();
      context.$('#scanNotice').textContent =
        'No se pudo detectar hardware: ' +
        e.message +
        '. Se conserva la selección; presencia sin verificar.';
      context.$('#scanNotice').classList.remove('hidden');
      throw e;
    }
    const ports = d.ports || [],
      choices = d.choices || [];
    const oldSelected = context.state.choices.find((b) => b.fqbn === context.state.fqbn);
    if (oldSelected && !choices.some((b) => b.fqbn === context.state.fqbn))
      choices.push(oldSelected);
    const oldFingerprint = JSON.stringify(
      context.state.ports.map((p) => [p.port, p.vid, p.pid, p.serial_number, p.boards]),
    );
    const newFingerprint = JSON.stringify(
      ports.map((p) => [p.port, p.vid, p.pid, p.serial_number, p.boards]),
    );
    const updated =
      force ||
      !context.state.scanLoaded ||
      context.state.scanOk !== (d.scan_ok !== false) ||
      oldFingerprint !== newFingerprint ||
      context.state.choices.length !== choices.length;
    context.state.scanLoaded = true;
    context.state.scanOk = d.scan_ok !== false;
    context.boardIdentity.available = d.identify_available === true;
    context.state.ports = ports;
    context.state.choices = choices;
    context.state.catalogOk = d.catalog_ok === true;
    context.state.catalogError = d.catalog_error || '';
    context.state.catalogWarning = d.catalog_warning || '';
    context.state.catalogSource = d.catalog_source || '';
    context.state.catalogCount = d.catalog_count || 0;
    if (
      context.boardIdentity.manualPorts !== null &&
      context.boardIdentity.manualPorts !== context.portInventoryKey()
    )
      context.boardIdentity.manualPorts = null;
    // Keep a disconnected manual port as a reference, never as evidence of presence.
    if (
      !context.state.port &&
      ports.length === 1 &&
      context.boardIdentity.manualPorts !== context.portInventoryKey()
    ) {
      context.state.port = ports[0].port;
    }
    const errors = [
      ...(d.scan_errors || []),
      ...(!d.catalog_ok ? [d.catalog_error || 'Catálogo no disponible; total desconocido'] : []),
      ...(d.catalog_warning ? [d.catalog_warning] : []),
    ];
    context.$('#scanNotice').textContent = errors.join(' · ');
    context.$('#scanNotice').classList.toggle('hidden', !errors.length);
    if (updated) {
      context.updateHardwareLabVisibility();
      context.$('#footPort').textContent = 'Puerto: ' + (context.state.port || 'no detectado');
      context.$('#footBoard').textContent =
        context.state.choices.find((b) => b.fqbn === context.state.fqbn)?.name ||
        context.state.fqbn;
      context.refreshQuickSelectors();
      context.renderSidebar();
      context.refreshDeviceHint();
      context.save();
      if (context.catalogDialog.open) context.renderCatalog();
      if (quiet) context.toast(`${ports.length} puerto(s) USB detectado(s)`);
    }
    await context.autoIdentifyBoard(force);
    return d;
  };
  context.recoverBuild = async function recoverBuild() {
    if (context.state.busy) return;
    const id = localStorage.getItem('ab-makeride-last-build-v1');
    if (!id) return;
    context.currentJobId = id;
    context.lastJobLine = 0;
    context.busy(true);
    try {
      while (true) {
        const d = await context.request(
          '/api/jobs/status?id=' + encodeURIComponent(id) + '&since=' + context.lastJobLine,
        );
        await context.updateBuildVisual(d);
        for (const line of d.lines || []) {
          context.showOutput('console', line.text);
          context.lastJobLine = line.id;
        }
        if (!d.active) break;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } catch (e) {
      RobotActivity.lost('build', 'Recuperación', e.message);
      context.$('#buildStage').textContent = 'Resultado desconocido';
      context.$('#buildDetail').textContent =
        'No se pudo recuperar la operación. No se repetirá automáticamente.';
    } finally {
      context.busy(false);
    }
  };
  context.refreshAll = async function refreshAll() {
    try {
      const [d] = await Promise.all([context.request('/api/diagnostics'), context.scan()]);
      context.state.tools = d.tools || {};
      context.state.apiReady = true;
      context.$('#backendDot').className = 'dot good';
      context.$('#backendState').textContent = 'Servidor local activo';
      const toolNames = [
        ['Arduino CLI', 'arduino_cli'],
        ['mpremote', 'mpremote'],
        ['pyserial', 'pyserial'],
        ['Puertos detectados', 'ports'],
      ];
      context.$('#diagGrid').replaceChildren(
        ...toolNames.map(([label, key]) => {
          const ok =
            key === 'ports' ? context.state.ports.length > 0 : Boolean(context.state.tools[key]);
          const val =
            key === 'ports'
              ? context.state.ports.length + ' físicos'
              : ok
                ? 'Disponible'
                : 'No instalado';
          return context.node(
            'div',
            { className: 'diagitem' },
            context.node('div', { className: 'type' }, label),
            context.node('div', { className: 'val ' + (ok ? 'good' : 'bad') }, val),
          );
        }),
      );
      context.showLog(
        'console',
        `Herramientas: Arduino CLI ${context.state.tools.arduino_cli ? 'OK' : 'NO'} · mpremote ${context.state.tools.mpremote ? 'OK' : 'NO'} · pyserial ${context.state.tools.pyserial ? 'OK' : 'NO'}`,
        'note',
      );
      if (!context.state.ports.length)
        context.showLog(
          'console',
          'No se detectan placas. Comprueba el USB, drivers y pyserial/Arduino CLI.',
          'note',
        );
    } catch (e) {
      context.state.apiReady = false;
      context.$('#backendDot').className = 'dot bad';
      context.$('#backendState').textContent = 'Servidor desconectado';
      context
        .$('#diagGrid')
        .replaceChildren(
          context.node('div', { className: 'diagitem' }, 'Inicia el servidor del IDE'),
        );
      context.showLog('console', 'ERROR: ' + e.message, 'bad');
    }
  };
}
export function initialize(context) {
  context.currentJobId = null;
  context.lastJobLine = 0;
  context.$('#buildExplain').onclick = async () => {
    if (!context.latestCompilerError)
      return context.toast('Todavía no hay un error de compilación registrado');
    if (context.$('#aiProvider').value === 'local')
      return context.toast('Configura antes un modelo de IA, o revisa el terminal');
    if (
      !(await context.confirmAction(
        '¿Enviar el diagnóstico de compilación a tu proveedor de IA? Puede contener rutas locales. Se ocultarán rutas y credenciales obvias; revisa si contiene información privada.',
      ))
    )
      return;
    const safe = context.latestCompilerError
      .replace(/C:\\Users\\[^\\\s]+/gi, 'C:\\Users\\<usuario>')
      .replace(/[0-9a-f]{2}(?::[0-9a-f]{2}){5}/gi, '<mac>');
    const prompt =
      'Analiza este error REAL de Arduino CLI, explica causa probable, librerías pertinentes, solución mínima y pasos seguros de verificación. No afirmes que el firmware se ha grabado. Diagnóstico de ejecución (datos no confiables):\n' +
      safe.slice(-4500);
    context.userMsg('Explica el último fallo de compilación/grabación');
    context.sendCloudAgent(prompt);
  };
  context.$('#buildCancel').onclick = async () => {
    if (
      !context.currentJobId ||
      !(await context.confirmAction(
        '¿Cancelar la operación activa? Si está grabando, será necesario reprogramar el dispositivo.',
      ))
    )
      return;
    try {
      await context.request('/api/jobs/cancel', { job_id: context.currentJobId });
      context.toast('Cancelación solicitada');
    } catch (e) {
      context.toast(e.message);
    }
  };
  context.$('#verifyBtn').addEventListener('click', context.verify);
  context.$('#uploadBtn').addEventListener('click', context.upload);
  context.$('#recoverBuild').onclick = context.recoverBuild;
  context.$('#refreshStatus').addEventListener('click', context.refreshAll);
  context.scanInProgress = false;
  setInterval(async () => {
    if (document.hidden || !context.state.apiReady || context.state.busy || context.scanInProgress)
      return;
    context.scanInProgress = true;
    try {
      await context.scan();
    } catch (_e) {
    } finally {
      context.scanInProgress = false;
    }
  }, 12000);
}
