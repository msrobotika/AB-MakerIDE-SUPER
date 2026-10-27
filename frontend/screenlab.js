// AB ScreenLab: editable visual TFT UI. Optional and isolated from sketches.
import {
  PROFILES,
  TYPES,
  addWidget,
  createProject,
  generateLvgl,
  moveWidget,
  resizeProfile,
  validateProject,
} from './screenlab-core.js';

const STORE = 'ab-makeride-screenlab-v1';
function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function template() {
  return `<div class="sl-head">
    <div><strong id="slTitle">AB ScreenLab</strong><p>Estudio de pantallas TFT · Diseño sin conectar ni grabar hardware</p></div>
    <button id="slClose" class="action small ghost" type="button" aria-label="Cerrar ScreenLab">✕ Cerrar</button>
  </div>
  <div class="sl-toolbar">
    <label>Perfil de pantalla<select id="slProfile" class="selector">
      <option value="cyd">CYD · ILI9341 · 320×240</option>
      <option value="ideaspark">IdeaSpark · ST7789 · 240×135</option>
      <option value="generic">Genérica · 320×240 (sin validar)</option>
    </select></label>
    <label>Nombre <input id="slName" maxlength="64" class="input" value="Mi panel Maker"/></label>
    <label>Fondo <input id="slBackground" type="color" value="#122238" /></label>
    <button id="slUndo" class="action small" type="button">↶ Deshacer</button>
    <button id="slReset" class="action small ghost" type="button">Nuevo diseño</button>
  </div>
  <div class="sl-editor">
    <aside class="sl-palette" aria-label="Añadir componentes">
      <strong>Componentes</strong>
      <button type="button" data-sl-add="label" class="action small">T Texto</button>
      <button type="button" data-sl-add="button" class="action small">▣ Botón táctil</button>
      <button type="button" data-sl-add="bar" class="action small">▰ Barra</button>
      <button type="button" data-sl-add="panel" class="action small">□ Contenedor</button>
      <p>Arrastra para colocar. Flechas: mover 4 px; Supr: eliminar.</p>
    </aside>
    <div class="sl-workspace">
      <div class="sl-canvas-header"><strong>Vista previa editable</strong><small id="slCanvasInfo"></small></div>
      <div class="sl-viewport"><div id="slStage" class="sl-stage">
        <div id="slCanvas" class="sl-canvas" aria-label="Pantalla simulada"></div>
      </div></div>
      <p class="sl-warning">Simulación de distribución. No confirma compatibilidad de controlador, consumo RAM ni funcionamiento táctil.</p>
    </div>
    <aside class="sl-properties">
      <strong>Propiedades</strong><p id="slPickHint">Selecciona un componente</p>
      <div id="slProps" hidden>
        <label>Texto<input id="slText" class="input" maxlength="64"/></label>
        <label>Color<input id="slColor" type="color" /></label>
        <div class="sl-coordinates">
          <label>X<input id="slX" class="input" type="number" step="1"/></label>
          <label>Y<input id="slY" class="input" type="number" step="1"/></label>
          <label>Ancho<input id="slW" class="input" type="number" min="12" step="1"/></label>
          <label>Alto<input id="slH" class="input" type="number" min="12" step="1"/></label>
        </div>
        <label id="slValueBox">Valor de barra (0–100)<input id="slValue" class="input" type="number" min="0" max="100"/></label>
        <button id="slDelete" class="action small ghost" type="button">Eliminar componente</button>
      </div>
    </aside>
  </div>
  <div class="sl-exports">
    <button id="slSaveJSON" class="action small" type="button">↓ Proyecto .json</button>
    <button id="slImport" class="action small" type="button">↑ Importar diseño</button>
    <input id="slFile" type="file" accept=".json,application/json" hidden />
    <button id="slGenerate" class="action small primary" type="button">Generar código LVGL</button>
    <button id="slSaveHeader" class="action small" type="button">↓ Código .h</button>
    <small id="slStatus" role="status" aria-live="polite"></small>
  </div>
  <details class="sl-source-panel"><summary>Ver código generado (LVGL 8.x)</summary>
    <textarea id="slCode" class="input" rows="8" readonly spellcheck="false" aria-label="Código generado"></textarea>
  </details>`;
}
export function define(context) {
  context.openScreenLab = () => {
    const dialog = document.querySelector('#screenLabDialog');
    if (!dialog.open) dialog.showModal();
  };
}
export function initialize(context) {
  const dialog = document.querySelector('#screenLabDialog');
  dialog.innerHTML = template(); // Static audited markup; never interpolate user strings.
  const el = (id) => dialog.querySelector('#' + id);
  const status = (message) => { el('slStatus').textContent = message; };
  let project;
  try {
    const stored = localStorage.getItem(STORE);
    project = stored ? validateProject(JSON.parse(stored)) : createProject();
  } catch (_error) {
    project = createProject();
    status('Se restauró un diseño nuevo: el guardado anterior no es compatible.');
  }
  let selected = null;
  let undo = [];
  let generated = '';
  let scale = 1;
  const persist = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(project));
      status('Borrador local actualizado · no se ha grabado ninguna placa.');
    } catch (_error) {
      status('Sin almacenamiento local: exporta el proyecto JSON para conservarlo.');
    }
  };
  const changes = (next, remembered = true) => {
    validateProject(next);
    if (remembered) undo = [...undo, structuredClone(project)].slice(-30);
    project = next;
    generated = '';
    render();
    persist();
  };
  const props = () => {
    const v = project.widgets.find((item) => item.id === selected);
    el('slProps').hidden = !v;
    el('slPickHint').textContent = v ? 'Componente ' + v.id + ' · ' + v.type : 'Selecciona un componente';
    if (!v) return;
    for (const [id, value] of [
      ['slText', v.text], ['slColor', v.color], ['slX', v.x],
      ['slY', v.y], ['slW', v.width], ['slH', v.height], ['slValue', v.value],
    ]) el(id).value = String(value);
    el('slValueBox').hidden = v.type !== 'bar';
  };
  function render() {
    const spec = PROFILES[project.profile];
    const canvas = el('slCanvas');
    const stage = el('slStage');
    el('slProfile').value = project.profile;
    el('slName').value = project.name;
    el('slBackground').value = project.background;
    el('slCanvasInfo').textContent = spec.width + '×' + spec.height + ' px · ' + project.widgets.length + ' componentes';
    scale = Math.min(2, (Math.max(280, el('slStage').parentElement.clientWidth - 40)) / spec.width);
    stage.style.width = spec.width * scale + 'px';
    stage.style.height = spec.height * scale + 'px';
    canvas.style.width = spec.width + 'px';
    canvas.style.height = spec.height + 'px';
    canvas.style.transform = 'scale(' + scale + ')';
    canvas.style.background = project.background;
    canvas.replaceChildren();
    for (const v of project.widgets) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'sl-widget sl-' + v.type + (v.id === selected ? ' selected' : '');
      node.dataset.widgetId = String(v.id);
      node.setAttribute('aria-label', v.type + ' ' + v.id + ' ' + v.text);
      node.style.left = v.x + 'px';
      node.style.top = v.y + 'px';
      node.style.width = v.width + 'px';
      node.style.height = v.height + 'px';
      node.style.background = v.type === 'label' ? 'transparent' : v.color;
      node.style.color = v.type === 'label' ? v.color : '#ffffff';
      if (v.type === 'bar') {
        const progress = document.createElement('span');
        progress.className = 'sl-bar-fill';
        progress.style.width = v.value + '%';
        node.appendChild(progress);
      } else if (v.type !== 'panel') {
        node.textContent = v.text;
      }
      node.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        selected = v.id;
        for (const item of canvas.children)
          item.classList.toggle('selected', Number(item.dataset.widgetId) === selected);
        props();
        const origin = { x: event.clientX, y: event.clientY, px: v.x, py: v.y };
        let lastX = v.x;
        let lastY = v.y;
        node.setPointerCapture(event.pointerId);
        const onMove = (e) => {
          const specNow = PROFILES[project.profile];
          lastX = Math.max(0, Math.min(specNow.width - v.width, Math.round((origin.px + (e.clientX - origin.x) / scale) / 4) * 4));
          lastY = Math.max(0, Math.min(specNow.height - v.height, Math.round((origin.py + (e.clientY - origin.y) / scale) / 4) * 4));
          node.style.left = lastX + 'px';
          node.style.top = lastY + 'px';
        };
        const onUp = () => {
          node.removeEventListener('pointermove', onMove);
          node.removeEventListener('pointerup', onUp);
          node.removeEventListener('pointercancel', onCancel);
          if (lastX !== v.x || lastY !== v.y) changes(moveWidget(project, v.id, lastX, lastY));
          else props();
        };
        const onCancel = () => {
          node.removeEventListener('pointermove', onMove);
          node.removeEventListener('pointerup', onUp);
          node.removeEventListener('pointercancel', onCancel);
          node.style.left = v.x + 'px';
          node.style.top = v.y + 'px';
        };
        node.addEventListener('pointermove', onMove);
        node.addEventListener('pointerup', onUp);
        node.addEventListener('pointercancel', onCancel);
      });
      node.addEventListener('keydown', (event) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault();
          const dx = event.key === 'ArrowLeft' ? -4 : event.key === 'ArrowRight' ? 4 : 0;
          const dy = event.key === 'ArrowUp' ? -4 : event.key === 'ArrowDown' ? 4 : 0;
          selected = v.id;
          changes(moveWidget(project, v.id, v.x + dx, v.y + dy));
        } else if (event.key === 'Delete') {
          event.preventDefault();
          deleteSelected();
        }
      });
      canvas.appendChild(node);
    }
    el('slUndo').disabled = undo.length === 0;
    if (!generated) el('slCode').value = '';
    props();
  }
  const edit = (field, value) => {
    const next = structuredClone(project);
    const v = next.widgets.find((item) => item.id === selected);
    if (!v) return;
    v[field] = value;
    try {
      changes(next);
    } catch (e) {
      status(e.message);
      props();
    }
  };
  const deleteSelected = () => {
    if (selected == null) return;
    const next = structuredClone(project);
    next.widgets = next.widgets.filter((v) => v.id !== selected);
    selected = null;
    changes(next);
  };
  el('slClose').onclick = () => dialog.close();
  context.$('#showScreenLab').onclick = () => {
    context.$('#extraTools').open = false;
    context.openScreenLab();
    render();
  };
  el('slName').addEventListener('change', (e) => {
    const next = structuredClone(project);
    next.name = e.target.value;
    try { changes(next); } catch (error) { status(error.message); render(); }
  });
  el('slBackground').addEventListener('change', (e) => {
    const next = structuredClone(project);
    next.background = e.target.value;
    changes(next);
  });
  el('slProfile').addEventListener('change', (e) => {
    try { changes(resizeProfile(project, e.target.value)); }
    catch (error) { status(error.message); render(); }
  });
  dialog.querySelectorAll('[data-sl-add]').forEach((button) => {
    button.onclick = () => {
      try {
        const next = addWidget(project, button.dataset.slAdd);
        selected = next.widgets.at(-1).id;
        changes(next);
      } catch (error) { status(error.message); }
    };
  });
  for (const [id, field] of [
    ['slText', 'text'], ['slColor', 'color'], ['slX', 'x'], ['slY', 'y'],
    ['slW', 'width'], ['slH', 'height'], ['slValue', 'value'],
  ]) {
    el(id).addEventListener('change', (event) => {
      const value = ['text', 'color'].includes(field) ? event.target.value : Number(event.target.value);
      edit(field, value);
    });
  }
  el('slDelete').onclick = deleteSelected;
  el('slUndo').onclick = () => {
    if (!undo.length) return;
    project = undo.pop();
    if (!project.widgets.some((v) => v.id === selected)) selected = null;
    generated = '';
    render();
    persist();
  };
  el('slReset').onclick = async () => {
    if (!(await context.confirmAction('¿Crear un diseño nuevo? Exporta primero el JSON actual si quieres conservarlo.'))) return;
    selected = null;
    changes(createProject(project.profile));
  };
  el('slSaveJSON').onclick = () => {
    downloadFile('ab-screenlab-design.json', JSON.stringify(project, null, 2) + '\n', 'application/json');
    status('Diseño JSON exportado. Puedes volver a importarlo.');
  };
  el('slImport').onclick = () => el('slFile').click();
  el('slFile').onchange = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 200000) throw Error('Archivo JSON demasiado grande');
      const next = validateProject(JSON.parse(await file.text()));
      if (!(await context.confirmAction('¿Abrir el diseño importado? Se conservará un deshacer local.'))) return;
      selected = null;
      changes(structuredClone(next));
      status('Proyecto ScreenLab importado y validado.');
    } catch (error) { status('Importación rechazada: ' + error.message); }
  };
  el('slGenerate').onclick = () => {
    try {
      generated = generateLvgl(project);
      el('slCode').value = generated;
      el('slCode').closest('details').open = true;
      status('Cabecera LVGL generada. Integra el driver y táctil antes de compilar o grabar.');
    } catch (error) { status(error.message); }
  };
  el('slSaveHeader').onclick = () => {
    try {
      const source = generateLvgl(project);
      generated = source;
      el('slCode').value = source;
      downloadFile('ab_screenlab_ui.h', source, 'text/plain');
      status('Cabecera descargada. Requiere LVGL 8.x y driver externo: NO es firmware completo.');
    } catch (error) { status(error.message); }
  };
  const viewportObserver = new ResizeObserver(() => {
    if (dialog.open) render();
  });
  viewportObserver.observe(el('slStage').parentElement);
  render();
}
