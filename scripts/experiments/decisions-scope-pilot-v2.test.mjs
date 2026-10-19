import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseV2,routeV2,oneQuestion,TARGETS,SINGLE_QUESTIONS,QUESTIONS } from './integrity-scope-policy-v2.mjs';
import { sourceRuntime } from './scope-pilot-runtime.mjs';
function answer(name,choice,confidence=.95){const values=QUESTIONS.find(q=>q.name===name).choices.map(c=>c.value);return {name,type:'choice',choice,confidence,probabilities:values.map(value=>({value,probability:value===choice ? .99 : .01/(values.length-1)}))};}
function body(action='out_of_scope',relation='confirmed',target='none'){return {model:'gpt-6-luna',answers:[answer('scope_action',action),answer('relevance',relation),answer('clarification_target',target)]};}
test('Mixed integrity request survives a primary rejection; unclear conflict is clarified',()=>{
  assert.equal(routeV2(parseV2(body())).action,'in_scope');
  assert.equal(routeV2(parseV2(body('in_scope','absent'))).action,'in_scope');
  assert.equal(routeV2(parseV2(body('out_of_scope','ambiguous','scope_situation'))).action,'clarify_scope');
  assert.equal(routeV2(parseV2(body('out_of_scope','absent'))).action,'out_of_scope');
  const uncertain=parseV2(body('out_of_scope','absent'));uncertain.relevance.confidence=.4;assert.equal(routeV2(uncertain).action,'clarify_scope');
});
test('A facts clarification selects exactly one approved fact and will not repeat it',()=>{
  const result=routeV2(parseV2(body('clarify_facts','confirmed','purpose')));
  assert.equal(result.action,'clarify_facts');assert.equal(oneQuestion(result).text,SINGLE_QUESTIONS.purpose);
  assert.equal(routeV2(parseV2(body('clarify_facts','confirmed','purpose')),['purpose']).action,'clarification_limit');
  assert.equal(oneQuestion(result,2),null);
  for(const target of TARGETS.filter(t=>t!=='none')){const q=oneQuestion({action:'clarify_facts',target});assert.equal(q.factCount,1);assert.equal((q.text.match(/\?/g)||[]).length,1);}
});
test('Unknown, duplicate, missing and refused answers do not become admitted advice',()=>{
  const wrong=body();wrong.answers.pop();assert.throws(()=>parseV2(wrong));
  const duplicate=body();duplicate.answers[1]=duplicate.answers[0];assert.throws(()=>parseV2(duplicate));
  const refused=body();refused.answers[1]={name:'relevance',type:'refusal'};assert.equal(routeV2(parseV2(refused)).action,'service_refusal');
});
test('Exact project sanitizer masks every included evidence field and enforces context budget',()=>{
  const runtime=sourceRuntime(path.resolve(import.meta.dirname,'../..'));
  const pii='010-2222-3333 person@example.invalid';
  const masked=runtime.input({question:pii,history:[{role:'assistant',content:pii}],summary:pii},{pendingQuestion:pii});
  assert.ok(!masked.includes('010-2222-3333')&&!masked.includes('person@example.invalid'));
  const limited=runtime.input({question:'상황 확인',history:Array.from({length:6},()=>({role:'user',content:'가'.repeat(900)})),summary:'나'.repeat(900)});
  assert.ok(limited.length<=6000);assert.equal(JSON.parse(limited).contextTruncated,true);
});
