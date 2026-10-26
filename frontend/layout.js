// layout feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.terminalMaxHeight = function terminalMaxHeight() {
    return Math.max(105, context.$('.main').clientHeight - 192);
  };
  context.resizeTerminal = function resizeTerminal(height, persist = true) {
    const maximum = context.terminalMaxHeight();
    context.terminalHeight = Math.max(105, Math.min(maximum, Math.round(height)));
    context.terminalPanel.style.height = context.terminalHeight + 'px';
    context.terminalPanel.style.flexBasis = context.terminalHeight + 'px';
    context.terminalGrip.setAttribute('aria-valuenow', String(context.terminalHeight));
    context.terminalGrip.setAttribute('aria-valuemax', String(maximum));
  };
  context.toggleTerminalMax = function toggleTerminalMax() {
    if (context.terminalMaximized) {
      context.terminalMaximized = false;
      context.resizeTerminal(context.normalTerminalHeight);
      context.$('#terminalMax').textContent = '⤢ Ampliar';
    } else {
      context.normalTerminalHeight = context.terminalHeight;
      context.terminalMaximized = true;
      context.resizeTerminal(context.terminalMaxHeight());
      context.$('#terminalMax').textContent = '↙ Restaurar';
    }
  };
  context.finishTerminalDrag = function finishTerminalDrag() {
    if (!context.terminalDragging) return;
    context.terminalDragging = false;
    context.terminalGrip.classList.remove('dragging');
    context.resizeTerminal(context.terminalHeight, true);
  };
  context.setSidebar = function setSidebar(open, persist = true) {
    context.$('#sidebar').classList.toggle('is-collapsed', !open);
  };
}
export function initialize(context) {
  context.terminalHeight = 165;
  context.normalTerminalHeight = 165;
  context.terminalMaximized = false;
  context.terminalDragging = false;
  context.terminalPanel = context.$('#terminalPanel');
  context.terminalGrip = context.$('#terminalGrip');
  context.dragY = 0;
  context.dragHeight = 0;
  context.terminalGrip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    context.terminalDragging = true;
    context.dragY = e.clientY;
    context.dragHeight = context.terminalHeight;
    context.terminalGrip.classList.add('dragging');
    context.terminalGrip.setPointerCapture(e.pointerId);
  });
  context.terminalGrip.addEventListener('pointermove', (e) => {
    if (!context.terminalDragging) return;
    context.terminalMaximized = false;
    context.$('#terminalMax').textContent = '⤢ Ampliar';
    context.resizeTerminal(context.dragHeight + context.dragY - e.clientY, false);
  });
  context.terminalGrip.addEventListener('pointerup', context.finishTerminalDrag);
  context.terminalGrip.addEventListener('pointercancel', context.finishTerminalDrag);
  context.terminalGrip.addEventListener('lostpointercapture', context.finishTerminalDrag);
  context.terminalGrip.addEventListener('dblclick', context.toggleTerminalMax);
  context.terminalGrip.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 60 : 20;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      context.terminalMaximized = false;
      context.$('#terminalMax').textContent = '⤢ Ampliar';
      context.resizeTerminal(context.terminalHeight + (e.key === 'ArrowUp' ? step : -step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      context.terminalMaximized = false;
      context.$('#terminalMax').textContent = '⤢ Ampliar';
      context.resizeTerminal(105);
    } else if (e.key === 'End') {
      e.preventDefault();
      context.terminalMaximized = true;
      context.$('#terminalMax').textContent = '↙ Restaurar';
      context.resizeTerminal(context.terminalMaxHeight());
    }
  });
  context.$('#terminalMax').addEventListener('click', context.toggleTerminalMax);
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      context.toggleTerminalMax();
    }
  });
  window.addEventListener('resize', () =>
    context.resizeTerminal(
      context.terminalMaximized ? context.terminalMaxHeight() : context.terminalHeight,
      false,
    ),
  );
}
