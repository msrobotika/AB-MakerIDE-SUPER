// MS Robotika · Centro de Agentes.
// This panel observes the EXISTING CLI job feed. It never starts a tool,
// grants permission, invents a plan, or claims a physical device was seen.
export function summarizeAgentEvent(event) {
  const kind = String(event?.kind || '');
  const text = String(event?.text || '');
  if (kind === 'milestone') {
    if (/firma de microcontrolador/i.test(text))
      return { type: 'evidence', label: 'Firma del microcontrolador registrada' };
    if (/compilación/i.test(text))
      return { type: 'evidence', label: 'Compilación observada en el registro' };
    if (/verificación de firmware/i.test(text))
      return { type: 'evidence', label: 'Verificación del grabador registrada' };
    return { type: 'evidence', label: 'Hito registrado por el servidor' };
  }
  if (/^Comando terminado · salida (-?\d+)/i.test(text))
    return { type: /salida 0/i.test(text) ? 'command' : 'warning',
      label: 'Comando terminado · ' + text.match(/salida (-?\d+)/i)[1] + ' (código de salida)' };
  if (/^Archivos del proyecto:/i.test(text))
    return { type: 'file', label: 'Operación sobre archivos del proyecto registrada' };
  if (/^Herramienta MCP /i.test(text))
    return { type: 'tool', label: 'Llamada a herramienta MCP registrada (ver consola)' };
  if (/esperando aprobación manual/i.test(text))
    return { type: 'approval', label: 'El agente espera una autorización del usuario' };
  if (/cancelación solicitada/i.test(text))
    return { type: 'warning', label: 'Solicitud de detención registrada' };
  if (kind === 'warning') return { type: 'warning', label: 'Aviso de la ejecución (ver consola)' };
  return { type: 'log', label: 'Actividad del agente registrada (ver consola)' };
}

export function define(context) {
  context.agentFlow = {
    events: [], run: null, active: false, selected: '', preparing: false,
  };
  const $ = (tag, cls, value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = String(value);
    return el;
  };
  const refresh = () => {
    if (context.state?.panel !== 'agentflow') return;
    const root = context.$('#sideBody');
    if (root) context.renderAgentFlowPanel(root);
  };

  context.agentFlowReset = () => {
    context.agentFlow.events = [];
    context.agentFlow.run = null;
    context.agentFlow.preparing = true;
    refresh();
  };
  context.agentFlowWorking = (working) => {
    context.agentFlow.active = Boolean(working);
    if (!working) context.agentFlow.preparing = false;
    refresh();
  };
  context.agentFlowEvent = (ev) => {
    if (!ev || !Number.isInteger(ev.id)) return;
    const items = context.agentFlow.events;
    if (items.some(x => x.id === ev.id)) return;
    items.push({ id: ev.id, ...summarizeAgentEvent(ev) });
    if (items.length > 50) items.splice(0, items.length - 50);
    refresh();
  };
  context.agentFlowSync = (run) => {
    if (!run || !run.job_id) return;
    if (context.agentFlow.selected && run.job_id !== context.agentFlow.selected)
      context.agentFlow.events = [];
    context.agentFlow.selected = run.job_id;
    context.agentFlow.run = run;
    context.agentFlow.active = Boolean(run.active);
    context.agentFlow.preparing = false;
    refresh();
  };

  const action = (title, handler, disabled = false, css = '') => {
    const btn = $('button', 'agent-flow-button ' + css, title);
    btn.type = 'button';
    btn.disabled = disabled;
    btn.addEventListener('click', handler);
    return btn;
  };
  const openWorkbench = (focus = false) => {
    context.$('#agentWorkbench').open = true;
    document.body.dataset.right = 'ai';
    if (focus) context.$('#execTask').focus();
  };
  context.renderAgentFlowPanel = (root) => {
    const state = context.agentFlow, run = state.run, events = state.events;
    const active = state.active || Boolean(run?.active);
    root.replaceChildren();
    root.append(
      $('p', 'agent-flow-intro',
        'Sesiones reales · Codex / Claude Code · permisos controlados por el usuario'),
    );
    const stateLine = $('div', 'agent-flow-status');
    const led = $('span', 'agent-flow-led' + (active ? ' is-active' : ''));
    led.setAttribute('aria-hidden', 'true');
    const text = run
      ? (active ? 'EJECUTANDO' : run.interrupted ? 'INTERRUMPIDA'
          : run.cancelled ? 'CANCELADA' : run.success ? 'FINALIZADA' : 'REVISAR RESULTADO')
      : state.preparing ? 'INICIANDO TAREA' : 'SIN SESIÓN ACTIVA';
    stateLine.append(led, $('strong', '', text));
    root.append(stateLine);

    const actions = $('div', 'agent-flow-actions');
    actions.append(
      action('+ Nueva tarea', () => openWorkbench(true), false, 'primary'),
      action('↻ Recuperar', () => {
        openWorkbench();
        context.recoverAgentSession(false);
      }),
      action('■ Detener', () => context.$('#execStop').click(), !active, 'danger'),
    );
    root.append(actions);

    const identity = $('div', 'agent-flow-card');
    identity.append($('strong', '', 'SESIÓN Y PERMISOS'));
    if (run) {
      identity.append(
        $('p', '', (run.provider === 'codex' ? 'Codex' : run.provider === 'claude_code'
          ? 'Claude Code' : 'Agente CLI') + ' · ' + (run.mode || 'sin modo')),
        $('small', '', 'Duración: ' + (Number(run.elapsed) || 0).toFixed(1) + ' s'),
        $('small', '', 'Sesión recuperable; la carpeta de trabajo pertenece al servidor local.'),
      );
    } else {
      identity.append($('p', '', 'Aún no hay una tarea ejecutada en esta vista.'));
    }
    root.append(identity);

    const steps = $('section', 'agent-flow-card');
    steps.append($('strong', '', 'PROGRESO CON EVIDENCIAS'));
    const ev = run?.evidence || {};
    const rows = [
      ['Sesión iniciada', Boolean(run?.job_id)],
      ['Firma de placa', ev.board_signature === true],
      ['Compilación', ev.compiled === true],
      ['Grabación verificada por herramienta', ev.flash_verified === true],
    ];
    for (const [label, yes] of rows) {
      const line = $('div', 'agent-flow-check');
      line.append($('span', yes ? 'agent-flow-tick yes' : 'agent-flow-tick', yes ? '✓' : '○'),
        $('span', '', label));
      steps.append(line);
    }
    steps.append($('p', 'agent-flow-note',
      'No hay porcentaje inventado. Las fases sin ✓ NO constan como verificadas. La pantalla física no se observa desde aquí.'));
    root.append(steps);

    const requests = Array.isArray(run?.pending_approvals) ? run.pending_approvals : [];
    const approval = $('section', 'agent-flow-card');
    approval.append($('strong', '', 'AUTORIZACIONES'));
    approval.append($('p', requests.length ? 'Pendientes: ' + requests.length
      : 'No hay solicitudes pendientes en esta sesión.'));
    approval.append(action('Revisar autorizaciones', () => {
      openWorkbench();
      context.$('#agentApprovals').scrollIntoView({ block: 'nearest' });
    }, requests.length === 0));
    root.append(approval);

    const files = Array.isArray(run?.changed_files) ? run.changed_files : [];
    const result = $('section', 'agent-flow-card');
    result.append($('strong', '', 'ARCHIVOS Y RESULTADO'));
    result.append($('p', '', files.length ? files.length + ' archivo(s) reportados por la CLI'
      : 'No hay cambios de archivos confirmados.'));
    for (const item of files.slice(0, 8)) {
      // Paths are displayed as text, not inserted into HTML.
      const name = typeof item === 'string' ? item : item?.path || '';
      if (name) result.append($('small', 'agent-flow-file', name.slice(0, 150)));
    }
    if (files.length > 8) result.append($('small', '', 'Más archivos en los resultados.'));
    if (run?.outcome) result.append($('p', 'agent-flow-note', context.reportAgentOutcome(run)));
    result.append(action('Ver diferencias (sin aplicar)', () => {
      openWorkbench();
      const candidates = context.$('#chatLog .agent-diff');
      const latest = candidates[candidates.length - 1];
      if (latest) latest.scrollIntoView({ block: 'nearest' });
      else context.toast('Todavía no se han cargado diferencias revisables.');
    }, !run?.diff));
    root.append(result);

    const timeline = $('section', 'agent-flow-card');
    timeline.append($('strong', '', 'ACTIVIDAD OBSERVADA'));
    timeline.append($('p', 'agent-flow-note',
      'Resumen de eventos reales. La consola técnica completa conserva el detalle.'));
    const list = $('ol', 'agent-flow-timeline');
    for (const event of events.slice(-20).reverse()) {
      const li = $('li', 'agent-flow-event');
      li.append($('span', 'agent-flow-event-id', '#' + event.id), $('span', '', event.label));
      list.append(li);
    }
    if (!events.length) list.append($('li', 'agent-flow-note', 'Aún no hay eventos registrados.'));
    timeline.append(list);
    timeline.append(action('Abrir registro técnico', () => {
      openWorkbench();
      context.$('#agentRawLog').closest('details').open = true;
      context.$('#agentRawLog').scrollIntoView({ block: 'nearest' });
    }));
    root.append(timeline);
    const footer = $('p', 'agent-flow-note',
      'No son registros simulados. Los cambios y las acciones requieren las autorizaciones existentes en MakerIDE.');
    root.append(footer);
  };
}

export function initialize(context) {
  // The feature reads the real agent state but does not initiate a job.
  context.agentFlowWorking(false);
}
