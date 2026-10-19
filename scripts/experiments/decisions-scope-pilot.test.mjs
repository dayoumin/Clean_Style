import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, validateDecision, routeDecision, advancePrototype, limitedAction, chooseThreshold } from './integrity-scope-policy.mjs';

function body(choice = 'in_scope') {
  return { model: 'gpt-6-luna', answers: [{ type: 'choice', name: 'scope_action', choice, confidence: .9, probabilities: ACTIONS.map(value => ({ value, probability: value === choice ? .9 : .02 })) }] };
}
test('Unexpected or incomplete provider decisions cannot silently route a request', () => {
  assert.equal(validateDecision(body()).choice, 'in_scope');
  assert.throws(() => validateDecision({ ...body(), model: 'other' }));
  const wrongName = body(); wrongName.answers[0].name = 'other'; assert.throws(() => validateDecision(wrongName));
  const duplicate = body(); duplicate.answers[0].probabilities[1].value = 'in_scope'; assert.throws(() => validateDecision(duplicate));
  const missing = body(); missing.answers[0].probabilities.pop(); assert.throws(() => validateDecision(missing));
  assert.equal(routeDecision(validateDecision({ model: 'gpt-6-luna', answers: [{ type: 'refusal', name: 'scope_action' }] })), 'service_refusal');
});
test('Low confidence direct admission or rejection is clarified, with a frozen threshold', () => {
  const decision = validateDecision(body('out_of_scope')); decision.confidence = .2;
  assert.equal(routeDecision(decision, .5), 'clarify_scope');
  const selected = chooseThreshold([{ decision, expected: 'clarify_scope' }]);
  assert.ok(selected.selected > .2);
});
test('Cancelled, incomplete and stale requests preserve pending state', () => {
  const state = { requestId: 'new', pendingQuestion: '', clarificationCount: 0, adviceIntroductionStatus: 'not_introduced' };
  assert.deepEqual(advancePrototype(state, 'clarify_scope', 'question', 'old', true), state);
  assert.deepEqual(advancePrototype(state, 'in_scope', 'question', 'new', false), state);
  const clarified = advancePrototype(state, 'clarify_scope', 'question', 'new', true);
  assert.equal(clarified.clarificationCount, 1);
  assert.equal(clarified.adviceIntroductionStatus, 'not_introduced');
});
test('Second clarification closes without a third question and completed advice introduces once', () => {
  const state = { requestId: 'r', pendingQuestion: 'original', clarificationCount: 2, adviceIntroductionStatus: 'not_introduced' };
  assert.equal(limitedAction(state, 'clarify_facts'), 'clarification_limit');
  const ended = advancePrototype(state, 'clarification_limit', 'reply', 'r', true);
  assert.equal(ended.pendingQuestion, ''); assert.equal(ended.clarificationCount, 0);
  const advice = advancePrototype(state, 'in_scope', 'reply', 'r', true);
  assert.equal(advice.adviceIntroductionStatus, 'introduced'); assert.equal(advice.pendingQuestion, '');
});
