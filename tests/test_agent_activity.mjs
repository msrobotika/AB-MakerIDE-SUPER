import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentTrail } from '../frontend/agent_activity.js';

test('sin sesión nunca inventa pasos de IA', () => {
  const trail = createAgentTrail();
  trail.event({ kind: 'milestone', text: 'flash_verified' });
  trail.poll({ job_id: 'fake', active: false, success: true, exit_code: 0 });
  assert.equal(trail.state().run, null);
  assert.equal(trail.state().items.length, 0);
});

test('sigue eventos reales de la CLI con su estado y aprobaciones', () => {
  const trail = createAgentTrail();
  trail.start({ job_id: 'job-1', provider: 'codex', mode: 'supervisado', task: 'Revisa este sketch' });
  trail.event({ id: 1, kind: 'log', text: 'Leyendo sketch.ino' }, '2026-10-26T10:00:00Z');
  trail.poll({ job_id: 'job-1', active: true, elapsed: 2.5,
    evidence: { compiled: false, flash_verified: false },
    pending_approvals: [{ id: 'approval-1' }] });
  const result = trail.state();
  assert.equal(result.run.state, 'working');
  assert.equal(result.run.approvals, 1);
  assert.equal(result.run.evidence.compiled, false);
  assert.equal(result.items[0].kind, 'tool');
  assert.match(result.items[0].text, /Leyendo/);
});

test('un resultado de CLI no certifica placa sin evidencia', () => {
  const trail = createAgentTrail();
  trail.start({ job_id: 'job-2', provider: 'claude_code', mode: 'total', task: 'Compilar' });
  trail.poll({ job_id: 'job-2', active: false, success: true, exit_code: 0,
    evidence: {}, changed_files: ['sketch.ino'], diff: '--- a' });
  const s = trail.state();
  assert.equal(s.run.state, 'completed');
  assert.equal(s.run.evidence.flash_verified, false);
  assert.equal(s.run.diff, true);
  assert.deepEqual(s.run.changedFiles, ['sketch.ino']);
});

test('rechaza cambios de estado de otras sesiones, acota eventos y no conserva todo el texto', () => {
  const trail = createAgentTrail();
  trail.start({ job_id: 'job-3', provider: 'codex', mode: 'consultar', task: 'Inspeccionar' });
  for (let i = 0; i < 90; i++)
    trail.event({ id: i, kind: 'log', text: 'x'.repeat(1100) });
  trail.poll({ job_id: 'job-falso', active: false, success: true, exit_code: 0 });
  const s = trail.state();
  assert.equal(s.items.length, 70);
  assert.equal(s.items[0].text.length, 520);
  assert.equal(s.run.state, 'working');
  const mutable = trail.state();
  mutable.items[0].text = 'Alterado';
  assert.notEqual(trail.state().items[0].text, 'Alterado');
});

test('recuperación de conexión no convierte una tarea desconocida en éxito', () => {
  const trail = createAgentTrail();
  trail.start({ job_id: 'job-4', provider: 'codex', mode: 'autonomo', task: 'Cargar firmware' });
  trail.connectionError('Desconectado');
  assert.equal(trail.state().run.state, 'unknown');
  trail.poll({ job_id: 'job-4', active: false, interrupted: true, success: false });
  assert.equal(trail.state().run.state, 'interrupted');
});
