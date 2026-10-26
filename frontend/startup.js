// startup feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.init = function init() {
    context.cleanTaskInputs();
    document.body.dataset.right = 'ai';
    context.setLang(context.state.lang);
    context.updateHardwareLabVisibility();
    context.renderSidebar();
    context.showLog(
      'console',
      'AB MakerIDE v' + context.IDE_VERSION + ' SUPER · by MS Robotika',
      'good',
    );
    context.showLog(
      'console',
      'Modo de prueba: compilación/subida reales cuando estén las herramientas y la placa.',
      'note',
    );
    context.showLog(
      'console',
      'La simulación no ejecuta firmware. Codex puede grabar con tu permiso: exige evidencia real.',
      'note',
    );
    context.refreshAll();
    context.save();
    context.scheduleAdvisor();
    if (innerWidth <= 520) {
      context.$('#sidebar').classList.add('mobileclosed');
      context
        .$$('.rail button')
        .forEach((b) =>
          b.addEventListener('click', () => context.$('#sidebar').classList.toggle('mobileclosed')),
        );
    }
  };
}
export function initialize(context) {
  context.init();
  context.initAi();
}
