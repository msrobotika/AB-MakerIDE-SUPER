// MS Robotika · Activity Center
// Live read-only projection of real agent jobs; the existing permission and
// execution controls remain in agent.js. Nothing here launches a tool.
const LIMIT = 70;
const EVIDENCE = [
  ['board_signature', 'Placa identificada'],
  ['compiled', 'Compilación observada'],
  ['flash_verified', 'Grabación verificada por herramienta'],
];
const safe = (value, max = 500) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
export function createAgentTrail() {
  let run = null;
  const items = [];
  return {
    start({ job_id, provider, mode, task }) {
      if (!job_id) return;
      run = {
        id: safe(job_id, 96), provider: safe(provider, 40),
        mode: safe(mode, 40), task: safe(task, 180),
        state: 'working', elapsed: 0, changedFiles: [],
        diff: false, approvals: 0, evidence: {}, error: '',
      };
      items.length = 0;
    },
    event(entry, receivedAt = new Date().toISOString()) {
      if (!run || !entry || typeof entry.text !== 'string') return;
      const kind = entry.kind === 'milestone' ? 'evidence' : entry.kind === 'error' ? 'error' : 'tool';
      items.push({
        seq: Number.isInteger(entry.id) ? entry.id : 0,
        kind, time: safe(receivedAt, 40),
        text: safe(entry.text, 520),
      });
      if (items.length > LIMIT) items.splice(0, items.length - LIMIT);
    },
    poll(data) {
      if (!run || !data || data.job_id !== run.id) return;
      run.elapsed = Number.isFinite(data.elapsed) ? data.elapsed : run.elapsed;
      run.approvals = Array.isArray(data.pending_approvals) ? data.pending_approvals.length : 0;
      run.evidence = Object.fromEntries(EVIDENCE.map(([k]) => [k, data.evidence?.[k] === true]));
      if (data.active) run.state = 'working';
      else if (data.cancelled) run.state = 'cancelled';
      else if (data.interrupted) run.state = 'interrupted';
      else if (data.success === true && data.exit_code === 0) run.state = 'completed';
      else run.state = 'failed';
      if (!data.active) {
        run.changedFiles = Array.isArray(data.changed_files)
          ? data.changed_files.slice(0, 30).map((file) => safe(file, 180)) : [];
        run.diff = Boolean(data.diff);
      }
      run.error = safe(data.error, 230);
    },
    connectionError(message) {
      if (run) { run.state = 'unknown'; run.error = safe(message, 230); }
    },
    state() {
      return {
        run: run ? { ...run, changedFiles: [...run.changedFiles], evidence: { ...run.evidence } } : null,
        items: items.map((e) => ({ ...e })),
      };
    },
  };
}
const labels = {
  working: 'EJECUTANDO', completed: 'CLI FINALIZADA', failed: 'FALLO',
  cancelled: 'CANCELADO', interrupted: 'INTERRUMPIDO', unknown: 'CONEXIÓN PERDIDA',
};
export function define(context) {
  context.agentActivity = createAgentTrail();
  context.agentObserveStart = (data) => {
    context.agentActivity.start(data);
    context.renderAgentActivityIfOpen();
  };
  context.agentObserveEvent = (entry) => {
    context.agentActivity.event(entry);
    context.renderAgentActivityIfOpen();
  };
  context.agentObservePoll = (data) => {
    context.agentActivity.poll(data);
    context.renderAgentActivityIfOpen();
  };
  context.agentObserveError = (message) => {
    context.agentActivity.connectionError(message);
    context.renderAgentActivityIfOpen();
  };
  context.renderAgentActivityIfOpen = () => {
    if (context.state.panel === 'agent-activity') {
      const viewport = context.$('#sideBody');
      const scroll = viewport.scrollTop;
      context.renderSidebar();
      viewport.scrollTop = scroll;
    }
    const rail = context.$('[data-panel="agent-activity"]');
    if (rail) {
      const run = context.agentActivity.state().run;
      rail.dataset.status = run?.state || 'idle';
      rail.setAttribute('aria-label', 'Actividad IA · ' + (labels[run?.state] || 'sin sesión'));
    }
  };
  context.openAgentWorkbench = (selector = '#execTask') => {
    document.body.dataset.right = 'ai';
    const workbench = context.$('#agentWorkbench');
    workbench.open = true;
    context.$(selector)?.focus();
    workbench.scrollIntoView({ behavior: 'auto', block: 'start' });
  };
  context.renderAgentActivityPanel = (root) => {
    const { run, items } = context.agentActivity.state();
    const n = (tag, className, value) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (value !== undefined) el.textContent = value;
      return el;
    };
    const actions = n('div', 'ac-actions');
    const setup = n('button', 'action small primary', 'Configurar / ejecutar');
    setup.id = 'acConfigure';
    setup.onclick = () => context.openAgentWorkbench();
    actions.append(setup);
    const recover = n('button', 'action small ghost', 'Recuperar sesión');
    recover.id = 'acRecover';
    recover.onclick = () => {
      context.openAgentWorkbench('#agentRecover');
      context.$('#agentRecover').click();
    };
    actions.append(recover);
    root.append(n('p', 'ac-intro',
      'Observación de la CLI real. Los pasos aparecen solo al recibir eventos; no ejecuta comandos por sí solo.'), actions);
    if (!run) {
      root.append(n('p', 'ac-empty', 'Sin tarea activa o recuperada. Elige Codex o Claude Code y autoriza una tarea para ver su actividad aquí.'));
      return;
    }
    const header = n('section', 'ac-session');
    const indicator = n('span', 'ac-state state-' + run.state, labels[run.state]);
    indicator.setAttribute('role', 'status');
    header.append(indicator, n('strong', '', run.provider + ' · ' + run.mode));
    header.append(n('p', 'ac-task', run.task || 'Tarea recuperada'));
    header.append(n('small', '', 'Duración observada: ' + run.elapsed.toFixed(1) + ' s · sesión ' + run.id.slice(0, 8)));
    if (run.error) header.append(n('p', 'ac-error', run.error));
    root.append(header);
    if (run.approvals) {
      const auth = n('button', 'action small ac-approval', run.approvals + ' aprobación(es) pendientes · Revisar');
      auth.id = 'acApprovals';
      auth.onclick = () => context.openAgentWorkbench('#agentApprovals');
      root.append(auth);
    }
    const evidence = n('section', 'ac-evidence');
    evidence.append(n('h3', '', 'Evidencia del proceso'));
    for (const [key, title] of EVIDENCE) {
      const ok = run.evidence[key] === true;
      evidence.append(n('div', 'ac-check ' + (ok ? 'confirmed' : ''), (ok ? '✓ ' : '○ ') + title));
    }
    evidence.append(n('small', '', 'La salida del grabador no prueba por sí sola el comportamiento físico de la placa.'));
    root.append(evidence);
    const changed = n('section', 'ac-changes');
    changed.append(n('h3', '', 'Cambios y comprobación'));
    if (run.changedFiles.length) for (const file of run.changedFiles) changed.append(n('div', 'ac-file', file));
    else changed.append(n('p', 'ac-empty', run.state === 'working' ? 'Los archivos se resumen al finalizar.' : 'No se han reportado archivos auxiliares.'));
    const review = n('button', 'action small ghost', 'Revisar código / diferencias');
    review.id = 'acReview';
    review.disabled = !run.diff;
    review.onclick = () => context.openAgentWorkbench('#agentOpenCode');
    changed.append(review);
    root.append(changed);
    const h = n('h3', '', 'Actividad recibida · ' + items.length + ' últimos eventos');
    root.append(h);
    const label = n('label', 'ac-filter', 'Filtrar');
    const filter = document.createElement('select');
    filter.className = 'selector';
    filter.id = 'acFilter';
    for (const [name, value] of [['Todo', 'all'], ['Herramientas', 'tool'], ['Evidencias', 'evidence'], ['Errores', 'error']])
      filter.add(new Option(name, value));
    filter.value = context.agentActivityFilter || 'all';
    const timeline = n('ol', 'ac-timeline');
    const draw = () => {
      timeline.replaceChildren();
      const selected = items.filter(e => filter.value === 'all' || e.kind === filter.value);
      if (!selected.length) timeline.append(n('li', 'ac-empty', 'No hay eventos de esta categoría.'));
      for (const item of selected) {
        const li = n('li', 'ac-item ' + item.kind);
        const time = item.time && !Number.isNaN(Date.parse(item.time)) ? new Date(item.time).toLocaleTimeString('es-ES') : '—';
        li.append(n('small', '', time + ' · ' + (item.kind === 'evidence' ? 'Evidencia' : item.kind === 'error' ? 'Error' : 'Salida de CLI')));
        const detail = n('p', '', item.text);
        li.append(detail);
        timeline.append(li);
      }
    };
    filter.onchange = () => { context.agentActivityFilter = filter.value; draw(); };
    label.append(filter);
    root.append(label, timeline);
    draw();
    const footer = n('div', 'ac-actions');
    const consoleBtn = n('button', 'action small ghost', 'Abrir consola');
    consoleBtn.id = 'acConsole';
    consoleBtn.onclick = () => context.switchPane('console');
    footer.append(consoleBtn);
    const stopBtn = n('button', 'action small danger', 'Detener tarea');
    stopBtn.id = 'acStop';
    stopBtn.disabled = run.state !== 'working';
    stopBtn.onclick = () => {
      if (context.agentRunState?.id && !context.$('#execStop').disabled)
        context.$('#execStop').click();
    };
    footer.append(stopBtn);
    root.append(footer);
  };
}
export function initialize(context) {
  context.renderAgentActivityIfOpen();
}
