// AB ScreenLab — pure layout model and LVGL 8.x source generator.
// No drivers, pins, uploads or hidden network actions.
export const PROFILES = Object.freeze({
  cyd: Object.freeze({ name: 'ESP32 CYD · ILI9341', width: 320, height: 240 }),
  ideaspark: Object.freeze({ name: 'IdeaSpark · ST7789', width: 240, height: 135 }),
  generic: Object.freeze({ name: 'Genérica · sin validar', width: 320, height: 240 }),
});
export const TYPES = Object.freeze(['label', 'button', 'bar', 'panel']);
const WIDGET_LIMIT = 40;
const textSafe = (s) => String(s ?? '').slice(0, 64);
const round = (n) => Math.round(n);
const colorOk = (x) => /^#[0-9a-fA-F]{6}$/.test(x);
const make = (id, type, x, y, width, height, text, color) => ({
  id,
  type,
  x,
  y,
  width,
  height,
  text,
  color,
  value: 50,
});
export function createProject(profile = 'cyd') {
  if (!PROFILES[profile]) throw Error('Perfil no disponible');
  const w = PROFILES[profile].width;
  return {
    format: 'ab-screenlab-v1',
    version: 1,
    profile,
    name: 'Mi panel Maker',
    background: '#122238',
    widgets: [
      make(1, 'label', 12, 10, Math.min(200, w - 24), 32, 'MS ROBOTIKA', '#77e0ff'),
      make(2, 'button', 12, 58, Math.min(136, w - 24), 42, 'ARRANCAR', '#138b77'),
    ],
  };
}
export function bounds(project) {
  const spec = PROFILES[project.profile];
  if (!spec) throw Error('Perfil de pantalla desconocido');
  return spec;
}
function assertNumber(n, min, max) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max)
    throw Error('Coordenadas o tamaño fuera de los límites');
}
export function validateProject(p) {
  if (!p || p.format !== 'ab-screenlab-v1' || p.version !== 1)
    throw Error('Archivo ScreenLab incompatible');
  const spec = bounds(p);
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 64)
    throw Error('Nombre de proyecto inválido');
  if (!colorOk(p.background)) throw Error('Color de fondo inválido');
  if (!Array.isArray(p.widgets) || p.widgets.length > WIDGET_LIMIT)
    throw Error('Exceso de componentes');
  const ids = new Set();
  for (const v of p.widgets) {
    if (!v || !TYPES.includes(v.type)) throw Error('Componente no admitido');
    assertNumber(v.id, 1, 1000000);
    if (ids.has(v.id)) throw Error('IDs duplicados');
    ids.add(v.id);
    assertNumber(v.x, 0, spec.width - 1);
    assertNumber(v.y, 0, spec.height - 1);
    assertNumber(v.width, 12, spec.width);
    assertNumber(v.height, 12, spec.height);
    if (v.x + v.width > spec.width || v.y + v.height > spec.height)
      throw Error('Componente fuera de la pantalla');
    if (typeof v.text !== 'string' || v.text.length > 64) throw Error('Texto demasiado largo');
    if (!colorOk(v.color)) throw Error('Color inválido');
    assertNumber(v.value, 0, 100);
  }
  return p;
}
export function moveWidget(p, id, x, y) {
  const next = structuredClone(validateProject(p));
  const v = next.widgets.find((item) => item.id === id);
  if (!v) throw Error('Componente inexistente');
  const spec = bounds(next);
  v.x = Math.min(spec.width - v.width, Math.max(0, round(x / 4) * 4));
  v.y = Math.min(spec.height - v.height, Math.max(0, round(y / 4) * 4));
  return validateProject(next);
}
export function resizeProfile(p, profile) {
  validateProject(p);
  if (!PROFILES[profile]) throw Error('Perfil desconocido');
  const next = structuredClone(p);
  next.profile = profile;
  const spec = bounds(next);
  for (const v of next.widgets) {
    v.width = Math.min(v.width, spec.width);
    v.height = Math.min(v.height, spec.height);
    v.x = Math.min(v.x, spec.width - v.width);
    v.y = Math.min(v.y, spec.height - v.height);
  }
  return validateProject(next);
}
export function addWidget(p, type) {
  validateProject(p);
  if (!TYPES.includes(type)) throw Error('Tipo no admitido');
  if (p.widgets.length >= WIDGET_LIMIT) throw Error('Límite de 40 componentes');
  const next = structuredClone(p);
  const spec = bounds(next);
  const w = Math.min(type === 'label' ? 128 : 108, spec.width - 12);
  const h = type === 'panel' ? 60 : type === 'label' ? 28 : 36;
  const x = 8;
  const y = Math.min(spec.height - h, 112 + p.widgets.length * 8);
  const id = Math.max(0, ...next.widgets.map((v) => v.id)) + 1;
  const defaults = { label: 'Nuevo texto', button: 'Botón', bar: 'Progreso', panel: 'Contenedor' };
  next.widgets.push(make(id, type, x, y, w, h, defaults[type], '#267da3'));
  validateProject(next);
  return next;
}
const cString = (s) =>
  '"' +
  s
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '')
    .replaceAll('\t', ' ') +
  '"';
export function generateLvgl(p) {
  validateProject(p);
  const spec = bounds(p);
  const out = [
    '// AB ScreenLab · MS Robotika · LVGL 8.x UI-only header',
    '// Generated from editable ScreenLab JSON. No display/touch driver included.',
    '// Do not flash before selecting a compatible BSP and validating RAM/pins.',
    '#pragma once',
    '#include <lvgl.h>',
    '#include <stdint.h>',
    '',
    'typedef void (*ab_screenlab_tap_t)(int id);',
    'static ab_screenlab_tap_t ab_screenlab_tap = nullptr;',
    'static void ab_screenlab_clicked(lv_event_t *e) {',
    '  if (lv_event_get_code(e) != LV_EVENT_CLICKED || !ab_screenlab_tap) return;',
    '  const int id = static_cast<int>(reinterpret_cast<intptr_t>(lv_event_get_user_data(e)));',
    '  ab_screenlab_tap(id);',
    '}',
    'static void ab_screenlab_set_tap_handler(ab_screenlab_tap_t handler) {',
    '  ab_screenlab_tap = handler;',
    '}',
    'static void ab_screenlab_build(lv_obj_t *parent) {',
    '  // Design canvas: ' + spec.width + ' x ' + spec.height + ' px (' + p.profile + ')',
    '  lv_obj_set_size(parent, ' + spec.width + ', ' + spec.height + ');',
    '  lv_obj_set_style_bg_color(parent, lv_color_hex(0x' + p.background.slice(1) + '), 0);',
    '  lv_obj_clear_flag(parent, LV_OBJ_FLAG_SCROLLABLE);',
  ];
  for (const v of p.widgets) {
    const node = 'sl_' + v.id;
    const ct =
      v.type === 'button'
        ? 'lv_btn_create'
        : v.type === 'bar'
          ? 'lv_bar_create'
          : v.type === 'panel'
            ? 'lv_obj_create'
            : 'lv_label_create';
    out.push('  lv_obj_t *' + node + ' = ' + ct + '(parent);');
    out.push('  lv_obj_set_pos(' + node + ', ' + v.x + ', ' + v.y + ');');
    out.push('  lv_obj_set_size(' + node + ', ' + v.width + ', ' + v.height + ');');
    if (v.type === 'label') {
      out.push('  lv_label_set_text(' + node + ', ' + cString(v.text) + ');');
      out.push(
        '  lv_obj_set_style_text_color(' + node + ', lv_color_hex(0x' + v.color.slice(1) + '), 0);',
      );
    } else {
      out.push(
        '  lv_obj_set_style_bg_color(' + node + ', lv_color_hex(0x' + v.color.slice(1) + '), 0);',
      );
      if (v.type === 'button') {
        out.push('  lv_obj_t *txt_' + v.id + ' = lv_label_create(' + node + ');');
        out.push('  lv_label_set_text(txt_' + v.id + ', ' + cString(v.text) + ');');
        out.push('  lv_obj_center(txt_' + v.id + ');');
        out.push(
          '  lv_obj_add_event_cb(' +
            node +
            ', ab_screenlab_clicked, LV_EVENT_CLICKED, reinterpret_cast<void *>(static_cast<intptr_t>(' +
            v.id +
            ')));',
        );
      }
      if (v.type === 'bar')
        out.push('  lv_bar_set_value(' + node + ', ' + v.value + ', LV_ANIM_OFF);');
    }
  }
  out.push('}', '');
  return out.join('\n');
}
