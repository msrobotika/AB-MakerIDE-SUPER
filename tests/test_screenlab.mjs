// Real Node tests of the isolated ScreenLab model and LVGL generator.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROFILES, createProject, addWidget, validateProject,
  moveWidget, resizeProfile, generateLvgl,
} from '../frontend/screenlab-core.js';

test('physical profiles expose known design sizes but no pins', () => {
  assert.deepEqual([PROFILES.cyd.width, PROFILES.cyd.height], [320, 240]);
  assert.deepEqual([PROFILES.ideaspark.width, PROFILES.ideaspark.height], [240, 135]);
  assert.equal(Object.hasOwn(PROFILES.cyd, 'pins'), false);
});
test('fresh project stays valid, independent of main IDE sketch', () => {
  const p = createProject();
  assert.equal(validateProject(p), p);
  assert.equal(p.widgets.length, 2);
  assert.equal(p.format, 'ab-screenlab-v1');
});
test('widgets can be added and moved with edge clipping', () => {
  const p = addWidget(createProject(), 'bar');
  const id = p.widgets.at(-1).id;
  const q = moveWidget(p, id, 900, -300);
  const item = q.widgets.find((w) => w.id === id);
  assert.equal(item.x, PROFILES.cyd.width - item.width);
  assert.equal(item.y, 0);
  assert.notDeepEqual(p.widgets.at(-1), item);
});
test('profile change fits all components in new TFT viewport', () => {
  const p = resizeProfile(createProject('cyd'), 'ideaspark');
  assert.equal(p.profile, 'ideaspark');
  assert.equal(validateProject(p), p);
  assert.ok(p.widgets.every((v) => v.x + v.width <= 240 && v.y + v.height <= 135));
});
test('safe LVGL 8.x generation, not a fabricated flashable sketch', () => {
  const p = addWidget(createProject(), 'bar');
  const code = generateLvgl(p);
  for (const token of [
    '#include <lvgl.h>', 'lv_btn_create(parent)', 'lv_bar_create(parent)',
    'lv_label_set_text(', 'lv_obj_add_event_cb(', 'ab_screenlab_set_tap_handler',
  ]) assert.ok(code.includes(token), token);
  assert.ok(code.includes('No display/touch driver included'));
  assert.ok(!code.includes('SPI.begin('));
  assert.ok(!code.includes('esptool'));
});
test('escape user-visible strings when generating C++', () => {
  const p = createProject();
  p.widgets[0].text = 'Dijo "alto" \\ prueba';
  const code = generateLvgl(p);
  assert.ok(code.includes('Dijo \\"alto\\" \\\\ prueba'));
});
test('reject malformed, oversized, overlapping IDs, out-of-bounds or code-like objects', () => {
  const base = createProject();
  const cases = [
    { ...base, format: 'other' },
    { ...base, profile: 'esp32-secret' },
    { ...base, widgets: Array(41).fill(base.widgets[0]) },
    { ...base, widgets: [...base.widgets, { ...base.widgets[0] }] },
    { ...base, widgets: [{ ...base.widgets[0], x: 400 }] },
    { ...base, widgets: [{ ...base.widgets[0], color: 'url(javascript:evil())' }] },
    { ...base, widgets: [{ ...base.widgets[0], text: 'X'.repeat(65) }] },
    { ...base, widgets: [{ ...base.widgets[0], value: 1000 }] },
  ];
  for (const [i, c] of cases.entries()) assert.throws(() => validateProject(c), Error, 'case ' + i);
  assert.throws(() => addWidget(base, 'script'));
  assert.throws(() => moveWidget(base, 10000, 1, 2));
});

test('MotionLab exports LVGL native animations, not browser CSS runtime', () => {
  for (const [preset, expected] of [
    ['fade-in', 'ab_screenlab_opacity'],
    ['slide-in', 'lv_obj_set_x'],
    ['pulse', 'lv_obj_set_width'],
  ]) {
    const design = createProject();
    design.widgets[0].motion = preset;
    design.widgets[0].durationMs = 1100;
    const code = generateLvgl(design);
    assert.ok(code.includes('lv_anim_init('));
    assert.ok(code.includes('lv_anim_set_time(&sl_motion_1, 1100);'));
    assert.ok(code.includes(expected));
    assert.ok(!code.includes('CSS') && !code.includes('requestAnimationFrame'));
  }
});
test('motion constraints reject unsafe JSON values and huge durations', () => {
  const design = createProject();
  const checks = [
    { motion: 'url(javascript:)' },
    { motion: 'rotate3d' },
    { durationMs: 8000000 },
    { durationMs: -1 },
    { durationMs: 33.33 },
    { durationMs: '1000' },
  ];
  for (const invalid of checks) {
    design.widgets[0] = { ...createProject().widgets[0], ...invalid };
    assert.throws(() => validateProject(design), Error);
  }
});
test('old ScreenLab JSON without animation fields remains compatible', () => {
  const old = createProject();
  old.widgets.forEach((v) => {
    delete v.motion;
    delete v.durationMs;
  });
  assert.equal(validateProject(old), old);
  const code = generateLvgl(old);
  assert.ok(!code.includes('lv_anim_start('));
});
