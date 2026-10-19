import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS as CORE } from './integrity-scope-policy-v2.mjs';
import { CHOICES } from './integrity-scope-policy.mjs';
import { fragments,buildQuestions,parseV2,routeV2,oneQuestion } from './integrity-scope-policy-v3.mjs';
function make(name,choice,values,confidence=.6){return {type:'choice',name,choice,confidence,probabilities:values.map(value=>({value,probability:value===choice?.99:.01/(values.length-1)}))};}
function body(primary,relation,target,parts=[]){return {model:'gpt-6-luna',answers:[make('scope_action',primary,CHOICES.map(c=>c.value)),make('relevance',relation,CORE[1].choices.map(c=>c.value)),make('clarification_target',target,CORE[2].choices.map(c=>c.value)),...parts.map((choice,i)=>make(`fragment_${i}`,choice,CHOICES.map(c=>c.value)))]};}
test('A related request in a mixed input remains answerable despite whole-request rejection',()=>{
  const parsed=parseV2(body('out_of_scope','absent','none',['out_of_scope','in_scope']));
  assert.equal(routeV2(parsed).action,'in_scope');
  const pieces=fragments('개인 여행을 추천해줘. 그리고 거래처 선물을 거절할 문장을 만들어줘.');
  assert.equal(pieces.length,2);assert.equal(buildQuestions(pieces).length,5);
});
test('An explicit missing approval gets one question even when overall relevance is uncertain',()=>{
  const route=routeV2(parseV2(body('clarify_facts','ambiguous','approval')));
  assert.equal(route.action,'clarify_facts');assert.equal(oneQuestion(route).text,'기관에서 반출 승인을 받으셨나요?');
  assert.equal(routeV2(parseV2(body('clarify_facts','ambiguous','approval')),['approval']).action,'clarification_limit');
});
test('Agreed off-topic math does not demand irrelevant facts; unknown conflict is clarified',()=>{
  assert.equal(routeV2(parseV2(body('out_of_scope','absent','none'))).action,'out_of_scope');
  assert.equal(routeV2(parseV2(body('out_of_scope','ambiguous','none'))).action,'clarify_scope');
});
test('Malformed fragment answers and provider refusals cannot authorize advice',()=>{
  const duplicate=body('out_of_scope','absent','none',['in_scope','in_scope']);duplicate.answers[4].name='fragment_0';assert.throws(()=>parseV2(duplicate));
  const refused=body('out_of_scope','absent','none',['in_scope']);refused.answers[3]={name:'fragment_0',type:'refusal'};assert.equal(routeV2(parseV2(refused)).action,'service_refusal');
});
