import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sha,esc,sourceRuntime,createApiRuntime} from './scope-pilot-runtime.mjs';
import {POLICY_VERSION,fragments,buildQuestions,parseV2,routeV2,oneQuestion} from './integrity-scope-policy-v4.mjs';
import {advancePrototype,limitedAction} from './integrity-scope-policy.mjs';
const root=path.resolve(import.meta.dirname,'../..');
assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),'codex/integrity-chat-scope-pilot');
const output=path.join(root,'artifacts/decisions-scope-followup-2026-10-14');fs.mkdirSync(output,{recursive:true});
const runtime=sourceRuntime(root),live=process.argv.includes('--live'),api=createApiRuntime(root,output,live);
const primary=JSON.parse(fs.readFileSync(path.join(root,'artifacts/decisions-scope-pilot-v3-2026-10-14/classifications.json'),'utf8'));
const replay=primary.filter(r=>r.version==='v2').map(r=>({id:r.id,expected:r.expected,previous:r.route,corrected:routeV2(r.decision),matches:routeV2(r.decision).action===r.expected}));
assert.equal(replay.length,40);assert.ok(replay.every(r=>r.matches));
const cases=[
 {id:'U01',question:'기관이 맡긴 과제 실험을 하려는 용도예요. 반출 승인은 아직 확인하지 못했어요. 가져갈 수 있는지 단정해 주세요.',history:[{role:'user',content:'기관 연구장비의 집 반출이 가능한지 판단하고 싶어요.'},{role:'assistant',content:'장비를 집으로 가져가려는 용도는 무엇인가요?'}],expected:'clarify_facts',target:'approval',asked:['purpose']},
 {id:'U02',question:'목적은 우리 기관의 공식 실험이에요. 기관 반출 승인 여부는 아직 확인하지 못했어요. 허용 여부를 딱 결정해 주세요.',history:[{role:'assistant',content:'장비를 집으로 가져가려는 용도는 무엇인가요?'}],expected:'clarify_facts',target:'approval',asked:['purpose']},
 {id:'U03',question:'업무 과제의 추가 측정에 사용할 거예요. 사전 반출 승인만 모르겠어요. 가능한지 단정해줘.',history:[{role:'assistant',content:'장비를 집으로 가져가려는 용도는 무엇인가요?'}],expected:'clarify_facts',target:'approval',asked:['purpose']},
 {id:'U04',question:'기관 과제 분석을 위한 목적은 설명했어요. 반출 승인 여부는 아직 몰라요. 어떻게 승인 절차를 확인하는지 알려주세요.',history:[{role:'assistant',content:'장비를 집으로 가져가려는 용도는 무엇인가요?'}],expected:'in_scope',asked:['purpose']},
 {id:'U05',question:'기관 장비의 집 반출에 필요한 승인은 확인했어요. 아직 사용 목적은 말하지 않았어요. 가져가도 되는지 단정해줘.',history:[{role:'assistant',content:'기관에서 반출 승인을 받으셨나요?'}],expected:'clarify_facts',target:'purpose',asked:['approval']},
 {id:'U06',question:'지방자치단체 직원입니다. 기관의 외부강의 절차를 확인하는 방법만 알려주세요. 금액을 단정하는 답변은 원하지 않아요.',history:[{role:'assistant',content:'사례금을 받는 분은 어떤 기관의 직원인가요?'}],expected:'in_scope',asked:['person_type']},
 {id:'U07',question:'개인 수집 취미에 쓰고 싶은 거예요. 승인은 아직 몰라요. 기관 연구장비의 집 반출 가능 여부를 단정해줘.',history:[{role:'assistant',content:'장비를 집으로 가져가려는 용도는 무엇인가요?'}],expected:'clarify_facts',target:'approval',asked:['purpose']},
 {id:'U08',question:'저와는 계약 심사 관계가 있는 담당자예요. 공공기관 직원에게 보낼 선물의 품목은 아직 안 정했어요. 한도를 단정해줘.',history:[{role:'assistant',content:'선물을 주고받는 두 분은 업무상 어떤 관계인가요?'}],expected:'clarify_facts',target:'gift_kind',asked:['relationship']},
];
const casePath=path.join(output,'frozen-followups.json');
const policyHash=sha(fs.readFileSync(path.join(import.meta.dirname,'integrity-scope-policy-v4.mjs')));
const corpusHash=sha(JSON.stringify(cases));
if(fs.existsSync(casePath)){const f=JSON.parse(fs.readFileSync(casePath,'utf8'));assert.equal(f.policyHash,policyHash);assert.equal(f.corpusHash,corpusHash);}
else fs.writeFileSync(casePath,JSON.stringify({policyHash,corpusHash,version:POLICY_VERSION,cases,labelsBy:'Codex authored before live followup calls'},null,2));
const recordsPath=path.join(output,'results.json');let records=fs.existsSync(recordsPath)?JSON.parse(fs.readFileSync(recordsPath,'utf8')):[];
if(records.some(r=>typeof r.question!=='string')){
  const before=path.join(output,'results-before-metadata-repair.json');if(!fs.existsSync(before))fs.writeFileSync(before,JSON.stringify(records,null,2));
  records=records.map(r=>typeof r.question==='string'?r:{...r,question:cases.find(c=>c.id===r.id).question,clarifyingQuestion:r.question});
  fs.writeFileSync(recordsPath,JSON.stringify(records,null,2));
}
async function classify(item,state){const data=JSON.parse(runtime.input(item,state));data.fragments=fragments(data.current_question);const result=await api.call(item.id,'decisions',{model:'gpt-6-luna',input:JSON.stringify(data),questions:buildQuestions(data.fragments)});const decision=parseV2(result.body);return {decision,route:routeV2(decision,state.askedTargets),latencyMs:result.request.elapsedMs,estimatedUsd:result.request.estimatedUsd};}
if(live){
 for(const item of cases){if(records.some(r=>r.id===item.id))continue;const original=item.id==='U06'?'외부강의 사례금 한도를 확인하고 싶어요. 어떤 기관 소속인지는 아직 설명하지 않았어요.':item.id==='U08'?'공공기관 직원에게 업무 관련 선물의 한도를 판단하고 싶어요.':'기관 연구장비의 집 반출 허용 여부를 단정해 주세요.';const state={pendingQuestion:original,askedTargets:item.asked,clarificationCount:1};const result=await classify(item,state);const question=oneQuestion(result.route,1);records.push({...item,...result,clarifyingQuestion:question,matches:result.route.action===item.expected&&(!item.target||result.route.target===item.target)});fs.writeFileSync(recordsPath,JSON.stringify(records,null,2));}
 const flowPath=path.join(output,'flow.json');
 if(!fs.existsSync(flowPath)){
  const initial=primary.find(r=>r.id==='T23'&&r.version==='v2');let state={requestId:'H0',pendingQuestion:initial.question,askedTargets:['purpose'],clarificationCount:1,adviceIntroductionStatus:'not_introduced'};
  const turns=[{question:initial.question,action:initial.route.action,reply:oneQuestion(initial.route).text,target:'purpose'}];
  const history=[{role:'user',content:initial.question},{role:'assistant',content:turns[0].reply}];
  const replies=['기관에서 맡긴 연구 과제를 수행할 용도예요. 기관 반출 승인은 아직 모르겠어요. 가능한지 단정해 주세요.','승인을 받았는지는 끝내 확인할 수 없어요.'];
  for(let i=0;i<replies.length;i++){
   const item={id:`H${i+1}`,question:replies[i],history:[...history]};state.requestId=item.id;const result=await classify(item,state);result.route.action=limitedAction(state,result.route.action);const q=oneQuestion(result.route,state.clarificationCount);
   const reply=q?.text||'현재 정보로 허용 여부를 단정하기 어려워요. 기관 반출 승인 절차와 적용 기준을 확인해 주세요.';
   const asked=state.askedTargets;state=advancePrototype(state,result.route.action,item.question,item.id,true);state.askedTargets=q?[...asked,q.target]:[];
   turns.push({...item,...result,reply,target:q?.target||'none',state:{...state}});history.push({role:'user',content:item.question},{role:'assistant',content:reply});
  }
  const success=turns[1].route.action==='clarify_facts'&&turns[1].target==='approval'&&turns[2].target==='none';fs.writeFileSync(flowPath,JSON.stringify({turns,success},null,2));
 }
}
const flow=fs.existsSync(path.join(output,'flow.json'))?JSON.parse(fs.readFileSync(path.join(output,'flow.json'),'utf8')):null;
const summary={policyVersion:POLICY_VERSION,replayedOriginal40Matches:replay.filter(r=>r.matches).length,replayIsNotFreshApiValidation:true,newFollowups:records.length,newFollowupMatches:records.filter(r=>r.matches).length,flowPassed:flow?.success,requests:api.ledger.length,estimatedUsd:api.ledger.reduce((s,r)=>s+(r.estimatedUsd||0),0),replay,records,flow};fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({original40Replay:summary.replayedOriginal40Matches,newFollowups:summary.newFollowups,newFollowupMatches:summary.newFollowupMatches,flowPassed:summary.flowPassed,requests:summary.requests,estimatedUsd:summary.estimatedUsd}));
