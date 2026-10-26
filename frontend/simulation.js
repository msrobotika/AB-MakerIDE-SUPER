// simulation feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.simCurrentTime = function simCurrentTime() {
    return (
      context.simElapsed +
      (context.state.simRunning
        ? (performance.now() - context.simStarted) * Number(context.$('#simSpeed').value)
        : 0)
    );
  };
  context.simDraw = function simDraw(now = context.simElapsed) {
    window.MakerSimulator.draw(
      context.$('#simCanvas'),
      context.simModel,
      now,
      Number(context.$('#simPin').value),
    );
    context.$('#simClock').textContent = 'Tiempo virtual: ' + Math.round(now) + ' ms';
    context.$('#simLevels').replaceChildren();
    for (const pin of context.simModel?.pins || []) {
      const level = window.MakerSimulator.output(context.simModel, now, pin),
        el = document.createElement('span');
      el.dataset.pin = pin;
      el.dataset.level = level;
      el.textContent = 'D' + pin + ': ' + (level === null ? 'N/D' : level ? 'HIGH' : 'LOW');
      context.$('#simLevels').append(el);
    }
  };
  context.pauseSim = function pauseSim(message = 'Pausado · simulación lógica, sin firmware') {
    context.simElapsed = context.simCurrentTime();
    context.state.simRunning = false;
    cancelAnimationFrame(context.simFrameId);
    context.$('#simBtn').textContent = context.simModel ? '▶ Continuar' : '▶ Simular lógica';
    context.$('#simStatus').textContent = message;
    context.simDraw();
  };
  context.invalidateSim = function invalidateSim() {
    if (
      !context.simSource ||
      (context.simSource.code === context.$('#code').value &&
        context.simSource.lang === context.state.lang &&
        context.simSource.fqbn === context.state.fqbn)
    )
      return;
    context.state.simRunning = false;
    cancelAnimationFrame(context.simFrameId);
    context.simModel = null;
    context.simSource = null;
    context.simElapsed = 0;
    context.$('#simPin').replaceChildren(new Option('Sin analizar', ''));
    context.$('#simPin').disabled = true;
    context.$('#simReset').disabled = true;
    context.$('#simPeriod').textContent = 'El modelo anterior se ha descartado.';
    context.$('#simBtn').textContent = '▶ Simular lógica';
    context.$('#simStatus').textContent = 'Código o placa cambiados. Vuelve a analizar.';
    context.simDraw();
  };
  context.prepareSim = function prepareSim() {
    context.invalidateSim();
    if (context.simModel) return true;
    const model = window.MakerSimulator.analyze(context.$('#code').value, context.state.lang, {
      fqbn: context.state.fqbn,
    });
    if (!model.supported) {
      context.$('#simStatus').textContent = 'NO SOPORTADO: ' + model.reason;
      context.simDraw();
      return false;
    }
    context.simModel = model;
    context.simSource = {
      code: context.$('#code').value,
      lang: context.state.lang,
      fqbn: context.state.fqbn,
    };
    context.simElapsed = 0;
    context
      .$('#simPin')
      .replaceChildren(...model.pins.map((pin) => new Option('D' + pin, String(pin))));
    context.$('#simPin').disabled = false;
    context.$('#simReset').disabled = false;
    context.$('#simPeriod').textContent =
      model.board + ' · ' + model.pins.length + ' salida(s) · ciclo ' + model.period + ' ms';
    context.simDraw();
    return true;
  };
  context.simStep = function simStep(timestamp) {
    if (!context.state.simRunning) return;
    if (timestamp - context.simLastDraw >= 50) {
      context.simDraw(context.simCurrentTime());
      context.simLastDraw = timestamp;
    }
    context.simFrameId = requestAnimationFrame(context.simStep);
  };
}
export function initialize(context) {
  context.simModel = null;
  context.simSource = null;
  context.simStarted = 0;
  context.simElapsed = 0;
  context.simFrameId = 0;
  context.simLastDraw = 0;
  context.$('#simBtn').onclick = () => {
    if (context.state.simRunning) {
      context.pauseSim();
      return;
    }
    if (!context.prepareSim()) return;
    context.state.simRunning = true;
    context.simStarted = performance.now();
    context.$('#simBtn').textContent = 'Ⅱ Pausar';
    context.$('#simStatus').textContent = 'SIMULACIÓN LÓGICA EN CURSO · SIN ACCESO A LA PLACA';
    context.simFrameId = requestAnimationFrame(context.simStep);
  };
  context.$('#simNext').onclick = () => {
    if (!context.prepareSim()) return;
    context.pauseSim();
    context.simElapsed = window.MakerSimulator.nextTime(context.simModel, context.simElapsed);
    context.$('#simStatus').textContent = 'Paso completado · simulación lógica en pausa';
    context.simDraw();
  };
  context.$('#simReset').onclick = () => {
    context.pauseSim();
    context.simElapsed = 0;
    context.$('#simStatus').textContent = 'Reiniciado a 0 ms · en pausa';
    context.simDraw();
  };
  context.simPreviousSpeed = Number(context.$('#simSpeed').value);
  context.$('#simSpeed').onchange = () => {
    if (context.state.simRunning) {
      context.simElapsed += (performance.now() - context.simStarted) * context.simPreviousSpeed;
      context.simStarted = performance.now();
    }
    context.simPreviousSpeed = Number(context.$('#simSpeed').value);
    context.simDraw(context.simCurrentTime());
  };
  context.$('#simPin').onchange = () => context.simDraw(context.simCurrentTime());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && context.state.simRunning) context.pauseSim();
  });
  requestAnimationFrame(() => context.simDraw());
}
