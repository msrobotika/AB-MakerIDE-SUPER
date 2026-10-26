import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeSession, summarizeEvidence, summarizeEvents } from '../frontend/agent_observer.js';

test('no invented progress or firmware claims without a real CLI snapshot', () => {
  assert.equal(summarizeSession(null).label, 'Sin sesión');
  assert.ok(summarizeEvidence(null).every(stage => stage.status === 'unknown'));
  const reading = { job_id: 'session-1', provider: 'codex', active: true, events: [], evidence: {} };
  assert.equal(summarizeSession(reading).label, 'Trabajando');
  const stages = summarizeEvidence(reading);
  assert.equal(stages.find(x => x.id === 'compile').status, 'unknown');
  assert.equal(stages.find(x => x.id === 'flash').status, 'unknown');
  assert.equal(stages.find(x => x.id === 'files').status, 'unknown');
  assert.equal(stages.find(x => x.id === 'execution').status, 'observed');
});

test('no firmware verified when only CLI execution ended', () => {
  const data = { job_id: 'session-2', active: false, success: true,
    outcome: 'agent_finished_only', evidence: { compiled: false, flash_verified: false } };
  assert.equal(summarizeSession(data).label, 'CLI finalizada');
  assert.equal(summarizeEvidence(data).find(x => x.id === 'flash').status, 'unknown');
});

test('observed compilation is distinct from upload and actual device viewing', () => {
  const data = { job_id: 'session-3', active: false, success: true, outcome: 'flash_reported_verified',
    evidence: { compiled: true, flash_verified: true }, changed_files: ['sketch.ino'],
    diff: '--- previous\n+++ new' };
  assert.equal(summarizeEvidence(data).find(x => x.id === 'files').status, 'observed');
  assert.equal(summarizeEvidence(data).find(x => x.id === 'compile').status, 'verified');
  assert.equal(summarizeEvidence(data).find(x => x.id === 'flash').status, 'verified');
  assert.match(summarizeEvidence(data).find(x => x.id === 'flash').detail, /falta observación física/);
});

test('interrupted, cancelled, missing flash, bad target fail closed', () => {
  for (const [override,label] of [
    [{ interrupted: true }, 'Estado desconocido'],
    [{ cancelled: true }, 'Cancelado'],
    [{ outcome: 'upload_pending' }, 'Grabación pendiente'],
    [{ outcome: 'target_mismatch' }, 'Destino incorrecto'],
  ]) {
    assert.equal(summarizeSession({ job_id: 'session', active: false, success: false, ...override }).label, label);
  }
});

test('timeline bounds and displays only actual id, kind and log text', () => {
  const events = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1, kind: i === 3 ? 'milestone' : 'log',
    text: 'Log ' + i + ' '.repeat(400),
  }));
  const visible = summarizeEvents(events, 9);
  assert.equal(visible.length, 9);
  assert.equal(visible[0].id, 32);
  assert.equal(visible.at(-1).id, 40);
  assert.ok(visible.every(x => x.text.length <= 240));
  assert.deepEqual(summarizeEvents(null), []);
});
