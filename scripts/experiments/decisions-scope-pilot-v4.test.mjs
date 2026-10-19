import test from 'node:test';
import assert from 'node:assert/strict';
import {routeV2,oneQuestion} from './integrity-scope-policy-v4.mjs';
function conflicting(){return {scope_action:{choice:'clarify_facts'},relevance:{choice:'confirmed'},clarification_target:{choice:'none',probabilities:[{value:'none',probability:.5},{value:'approval',probability:.35},{value:'purpose',probability:.1}]},fragment_actions:[]};}
test('Pending missing fact is not completed as advice when the target response contradicts it',()=>{
  const route=routeV2(conflicting(),['purpose']);assert.equal(route.action,'clarify_facts');assert.equal(route.target,'approval');assert.equal(oneQuestion(route,1).text,'기관에서 반출 승인을 받으셨나요?');
});
test('Already asked facts are not asked again when information is still unavailable',()=>{
  const route=routeV2(conflicting(),['purpose','approval']);assert.equal(route.action,'clarification_limit');assert.equal(oneQuestion(route,2),null);
});
