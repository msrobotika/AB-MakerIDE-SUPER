// MS Robotika · Actividad IA · observability for REAL Codex / Claude CLI jobs.
// All statuses come from the existing /api/agents/poll contract; no invented progress.
const trim = (value, length = 180) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').slice(0, length);

export function summarizeSession(data) {
  if (!data?.job_id) return { label: 'Sin sesión', tone: 'idle', detail: 'Inicia o recupera una tarea.' };
  if (data.interrupted || data.outcome === 'unknown_after_restart')
    return { label: 'Estado desconocido', tone: 'warning', detail: 'Sesión interrumpida. Comprueba el hardware antes de repetir acciones.' };
  if (data.active) return { label: 'Trabajando', tone: 'running', detail: 'La CLI sigue ejecutando una tarea local.' };
  if (data.outcome === 'upload_pending')
    return { label: 'Grabación pendiente', tone: 'warning', detail: 'No consta firmware grabado y verificado.' };
  if (data.cancelled) return { label: 'Cancelado', tone: 'warning', detail: 'La tarea fue detenida.' };
  if (data.outcome === 'target_mismatch')
    return { label: 'Destino incorrecto', tone: 'warning', detail: 'Revisar la placa y los archivos generados.' };
  if (data.success === true)
    return { label: 'CLI finalizada', tone: 'complete', detail: 'Revisar el código y las evidencias; la pantalla física es independiente.' };
  if (data.imported) return { label: 'Proyecto importado', tone: 'idle', detail: 'No se ha ejecutado agente.' };
  return { label: 'Fallida o incompleta', tone: 'error', detail: trim(data.error, 160) || 'No hay éxito confirmado.' };
}

export function summarizeEvidence(data) {
  const evidence = data?.evidence || {};
  return [
    { id: 'request', label: 'Solicitud', status: data?.job_id ? 'received' : 'unknown', detail: data?.job_id ? 'Aceptada por el servidor' : 'No iniciada' },
    { id: 'execution', label: 'Herramientas', status: (data?.events?.length || data?.active) ? 'observed' : 'unknown', detail: data?.active ? 'CLI en ejecución' : (data?.events?.length ? 'Hay eventos registrados' : 'Sin actividad observada') },
    { id: 'files', label: 'Archivos', status: data?.diff || data?.changed_files?.length ? 'observed' : 'unknown', detail: data?.diff ? 'Diferencias disponibles' : (data?.changed_files?.length ? 'Archivos registrados' : 'Sin cambios comprobados') },
    { id: 'compile', label: 'Compilación', status: evidence.compiled === true ? 'verified' : 'unknown', detail: evidence.compiled === true ? 'Resumen de herramienta observado' : 'No consta' },
    { id: 'flash', label: 'Grabación', status: evidence.flash_verified === true ? 'verified' : 'unknown', detail: evidence.flash_verified === true ? 'Grabador informó verificación; falta observación física' : 'No consta' },
  ];
}

export function summarizeEvents(events, limit = 9) {
  return (Array.isArray(events) ? events : []).slice(-limit).map(e => ({
    id: Number(e.id) || 0,
    kind: e.kind === 'milestone' ? 'milestone' : 'log',
    text: trim(e.text, 240),
  }));
}

export function define(context) {
  const $ = id => context.$(id.startsWith('#') ? id : '#' + id);
  const el = (tag, className = '', value = '') => {
    const node = document.createElement(tag);
    node.className = className;
    if (value) node.textContent = value;
    return node;
  };
  context.activitySnapshot = null;
  context.activityEvents = [];
  context.activityError = '';
  context.activityHistory = [];

  context.observeAgentSnapshot = function observeAgentSnapshot(data, reset = false) {
    if (!data || !data.job_id) return;
    if (reset || context.activitySnapshot?.job_id !== data.job_id) context.activityEvents = [];
    const ids = new Set(context.activityEvents.map(e => e.id));
    for (const ev of data.events || []) if (!ids.has(ev.id)) {
      context.activityEvents.push({ id: ev.id, kind: ev.kind, text: ev.text });
      ids.add(ev.id);
    }
    context.activityEvents = context.activityEvents.slice(-60);
    context.activitySnapshot = {
      ...data, events: context.activityEvents,
      // Never keep the full generated code in the sidebar state; the original
      // agent result already owns it.
      modified_code: undefined,
    };
    context.activityError = '';
    context.updateAgentObserver();
  };
  context.observeAgentError = function observeAgentError(message) {
    context.activityError = trim(message, 240);
    context.updateAgentObserver();
  };
  context.openAgentWorkbench = function openAgentWorkbench() {
    document.body.dataset.right = 'ai';
    $('#agentWorkbench').open = true;
    $('#agentWorkbench').scrollIntoView({ behavior: 'auto', block: 'nearest' });
  };
  context.refreshAgentObserverHistory = async function refreshAgentObserverHistory() {
    const list = await context.request('/api/agents/history');
    context.activityHistory = Array.isArray(list.recent) ? list.recent.slice(0, 24) : [];
    context.updateAgentObserver();
    return context.activityHistory;
  };
  context.updateAgentObserver = function updateAgentObserver() {
    if (context.state.panel !== 'agents') return;
    const root = $('#sideBody');
    const data = context.activitySnapshot;
    const state = summarizeSession(data);
    const status = root.querySelector('#activityState');
    if (!status) return;
    status.textContent = state.label;
    status.dataset.tone = context.activityError ? 'warning' : state.tone;
    root.querySelector('#activityDetail').textContent = context.activityError
      ? 'Conexión no comprobada: ' + context.activityError : state.detail;
    root.querySelector('#activityProvider').textContent = data?.provider === 'claude_code'
      ? 'Claude Code' : data?.provider === 'codex' ? 'Codex' : 'Ninguno';
    root.querySelector('#activityAccess').textContent = data?.mode || $('#execMode').value;
    root.querySelector('#activityElapsed').textContent = data?.elapsed == null
      ? '—' : data.elapsed.toFixed(1) + ' s';
    root.querySelector('#activityTaskTitle').textContent = data?.task_summary || 'Sin tarea registrada';
    const approvalCount = (data?.pending_approvals || []).length;
    root.querySelector('#activityApprovals').textContent = approvalCount
      ? approvalCount + ' solicitud(es) de aprobación: abrir agente'
      : 'Sin solicitudes pendientes conocidas';
    root.querySelector('#activityRun').disabled = Boolean(context.state.agentWorking);
    root.querySelector('#activityStop').disabled = !context.agentRunState?.id || !context.state.agentWorking;
    root.querySelector('#activityReview').disabled = !data || Boolean(data.active);
    root.querySelector('#activityFiles').replaceChildren();
    const files = data?.changed_files || [];
    const filesRoot = root.querySelector('#activityFiles');
    if (files.length) files.slice(0, 12).forEach(name => filesRoot.append(el('li', 'activity-file', trim(name, 150))));
    else filesRoot.append(el('li', 'activity-empty', 'Ningún archivo modificado confirmado'));

    const stages = root.querySelector('#activityPhases');
    stages.replaceChildren();
    for (const phase of summarizeEvidence(data)) {
      const row = el('li', 'activity-phase');
      row.dataset.phase = phase.id;
      row.dataset.status = phase.status;
      const symbol = el('span', 'activity-symbol', phase.status === 'verified' ? '✓'
        : phase.status === 'observed' || phase.status === 'received' ? '•' : '○');
      const body = el('span', 'activity-phase-main');
      body.append(el('strong', '', phase.label), el('small', '', phase.detail));
      row.append(symbol, body);
      stages.append(row);
    }
    const events = root.querySelector('#activityTimeline');
    events.replaceChildren();
    for (const item of summarizeEvents(context.activityEvents)) {
      const row = el('li', 'activity-entry');
      row.dataset.kind = item.kind;
      row.append(el('span', 'activity-index', String(item.id)), el('span', 'activity-event-text', item.text));
      events.append(row);
    }
    if (!context.activityEvents.length)
      events.append(el('li', 'activity-empty', data?.active
        ? 'Conectado; sin mensajes nuevos registrados todavía.'
        : 'Aquí aparecerán las acciones realmente registradas.'));
    const diff = root.querySelector('#activityDiff');
    const diffDetail = root.querySelector('#activityDiffDetail');
    diff.hidden = !data?.diff;
    if (data?.diff) diffDetail.textContent = String(data.diff).slice(0, 24000);
    else diffDetail.textContent = '';
    const choose = root.querySelector('#activitySessionSelect');
    const selected = choose.value;
    choose.replaceChildren(el('option', '', 'Seleccionar sesión guardada'));
    choose.firstChild.value = '';
    context.activityHistory.forEach(h => {
      const option = el('option', '', (h.task_summary || h.provider || 'Sesión') + ' · ' + (h.active ? 'Activa' : 'Guardada'));
      option.value = h.job_id;
      choose.append(option);
    });
    if (context.activityHistory.some(h => h.job_id === selected)) choose.value = selected;
  };
  context.renderAgentObserverSidebar = function renderAgentObserverSidebar(root) {
    const heading = el('div', 'activity-brand');
    heading.append(el('div', 'activity-logo', 'MS'), el('div', 'activity-brand-text', 'CENTRO DE ACTIVIDAD IA'));
    const status = el('div', 'activity-status');
    const state = el('strong', 'activity-state', 'Sin sesión'); state.id = 'activityState';
    const detail = el('p', 'activity-description', 'Sin tareas'); detail.id = 'activityDetail';
    status.append(state, detail);
    const taskTitle = el('p', 'activity-task-title', 'Sin tarea registrada'); taskTitle.id = 'activityTaskTitle';
    const identity = el('div', 'activity-metadata');
    for (const [name,id] of [['Motor','activityProvider'],['Permisos','activityAccess'],['Tiempo','activityElapsed']]) {
      const item = el('div', 'activity-meta');
      const value = el('strong'); value.id = id;
      item.append(el('span', '', name), value);
      identity.append(item);
    }
    const label = el('label', 'formlabel', 'DESCRIBE TU TAREA');
    label.htmlFor = 'activityPrompt';
    const prompt = el('textarea', 'input activity-input'); prompt.id = 'activityPrompt';
    prompt.rows = 3; prompt.maxLength = 12000; prompt.placeholder = 'Ej.: comprueba el código, corrige el fallo y presenta las pruebas.';
    const primary = el('div', 'activity-actions');
    const start = el('button', 'action small primary', '▶ Solicitar tarea'); start.id = 'activityRun';
    const stop = el('button', 'action small danger', '■ Detener'); stop.id = 'activityStop';
    const view = el('button', 'action small ghost', '⚙ Agente y permisos'); view.id = 'activityWorkbench';
    primary.append(start, stop, view);
    const approvals = el('div', 'activity-approval', 'Sin solicitudes'); approvals.id = 'activityApprovals';
    const phasesHead = el('h3', 'activity-heading', 'ETAPAS Y EVIDENCIA');
    const phases = el('ol', 'activity-phases'); phases.id = 'activityPhases';
    const timelineHead = el('h3', 'activity-heading', 'REGISTRO EN DIRECTO');
    const timeline = el('ol', 'activity-timeline'); timeline.id = 'activityTimeline';
    const fileHead = el('h3', 'activity-heading', 'ARCHIVOS RESULTANTES');
    const files = el('ul', 'activity-files'); files.id = 'activityFiles';
    const diff = el('details', 'activity-diff'); diff.id = 'activityDiff';
    const summary = el('summary', '', 'Revisar diferencias reales');
    const diffText = el('pre', 'activity-diff-text'); diffText.id = 'activityDiffDetail';
    diff.append(summary,diffText);
    const row = el('div', 'activity-actions');
    const review = el('button', 'action small', 'Ver resultado completo'); review.id = 'activityReview';
    const recover = el('button', 'action small ghost', '↺ Última sesión'); recover.id = 'activityRecover';
    row.append(review,recover);
    const historyHead = el('h3', 'activity-heading', 'SESIONES GUARDADAS');
    const history = el('div', 'activity-history');
    const choose = el('select', 'selector'); choose.id = 'activitySessionSelect';
    const historyBtns = el('div', 'activity-actions');
    const load = el('button', 'action small ghost', 'Actualizar lista');
    const open = el('button', 'action small', 'Abrir sesión');
    historyBtns.append(load, open); history.append(choose, historyBtns);
    const footer = el('p', 'activity-caution',
      'Actividad real de la CLI. Las etapas sin evidencia no se dan por realizadas. Las pruebas de herramientas no confirman funcionamiento físico.');
    root.replaceChildren(heading,status,taskTitle,identity,label,prompt,primary,approvals,
      phasesHead,phases,timelineHead,timeline,fileHead,files,diff,row,historyHead,history,footer);
    start.onclick = () => {
      const text = prompt.value.trim();
      if (text.length < 3) return context.toast('Describe primero la tarea.');
      $('#execTask').value = text;
      context.openAgentWorkbench();
      $('#execRun').click(); // existing consent and risk checks, never bypass
    };
    stop.onclick = () => $('#execStop').click();
    view.onclick = context.openAgentWorkbench;
    review.onclick = context.openAgentWorkbench;
    recover.onclick = () => context.recoverAgentSession(false);
    load.onclick = async () => {
      try { await context.refreshAgentObserverHistory(); }
      catch (e) { context.observeAgentError(e.message); }
    };
    open.onclick = () => {
      if (!choose.value) return context.toast('Elige una sesión de la lista');
      if (context.state.agentWorking) return context.toast('La sesión actual sigue en marcha');
      context.recoverAgentSession(false, choose.value);
    };
    prompt.value = $('#execTask').value;
    context.updateAgentObserver();
  };
}
export function initialize(context) {
  // No automatic background tasks and no browser credential storage.
  // Agent events are received only from the existing authorised job poll.
  context.observeAgentError = context.observeAgentError.bind(context);
}
