import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { INSTRUCTIONS as V1_INSTRUCTIONS,CHOICES as V1_CHOICES,validateDecision,advancePrototype,limitedAction } from './integrity-scope-policy.mjs';
import * as BASE_POLICY from './integrity-scope-policy-v2.mjs';
import * as REFINED_POLICY from './integrity-scope-policy-v3.mjs';
import { sha,percentile,esc,sourceRuntime,createApiRuntime } from './scope-pilot-runtime.mjs';

const ROOT=path.resolve(import.meta.dirname,'../..');
const args=new Set(process.argv.slice(2)),live=args.has('--live');
const refined=args.has('--refined');
const {POLICY_VERSION,QUESTIONS,REJECTION_CONFIDENCE,parseV2,routeV2,oneQuestion,responsePath}=refined?REFINED_POLICY:BASE_POLICY;
const OUTPUT=path.join(ROOT,refined?'artifacts/decisions-scope-pilot-v3-2026-10-14':'artifacts/decisions-scope-pilot-v2-2026-10-14-final');
const totalCases=refined?40:50;
const phase=[...args].find(a=>a.startsWith('--phase='))?.split('=')[1]||'offline';
if(!['offline','regression','validation','flows','report'].includes(phase))throw new Error('Invalid phase');
if(['regression','validation','flows'].includes(phase)&&!live)throw new Error('Explicit --live required');
const branch=execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8',windowsHide:true}).trim();
assert.equal(branch,'codex/integrity-chat-scope-pilot');
const fixture=path.join(import.meta.dirname,refined?'fixtures/integrity-scope-v3-fresh-40.json':'fixtures/integrity-scope-v2-fresh-50.json');
const corpus=JSON.parse(fs.readFileSync(fixture,'utf8'));
assert.equal(corpus.cases.length,totalCases);assert.equal(new Set(corpus.cases.map(c=>c.id)).size,totalCases);
const previous=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'fixtures/integrity-scope-50.json'),'utf8'));
const oldQuestions=new Set(previous.cases.map(c=>c.question));
const intermediateCorpus=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'fixtures/integrity-scope-v2-fresh-50.json'),'utf8'));
if(refined)for(const item of intermediateCorpus.cases)oldQuestions.add(item.question);
assert.ok(corpus.cases.every(c=>!oldQuestions.has(c.question)));
fs.mkdirSync(OUTPUT,{recursive:true});
const read=(name,fallback)=>fs.existsSync(path.join(OUTPUT,name))?JSON.parse(fs.readFileSync(path.join(OUTPUT,name),'utf8')):fallback;
const save=(name,value)=>fs.writeFileSync(path.join(OUTPUT,name),JSON.stringify(value,null,2));
const datasetHash=sha(fs.readFileSync(fixture)),policyHash=sha(JSON.stringify({QUESTIONS,REJECTION_CONFIDENCE,POLICY_VERSION,policySourceHash:sha(fs.readFileSync(path.join(import.meta.dirname,refined?'integrity-scope-policy-v3.mjs':'integrity-scope-policy-v2.mjs')))}));
const sourceFiles=['src/lib/chat-intent.ts','src/lib/prompts.ts','src/lib/ai.ts','src/app/api/chat/route.ts','src/hooks/useAiChat.ts','src/lib/history.ts','src/components/AiAdviceSheet.tsx'];
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,sha(fs.readFileSync(path.join(ROOT,file)))]));
const frozen=read('frozen-policy.json',null);
if(frozen){assert.equal(frozen.datasetHash,datasetHash);assert.equal(frozen.policyHash,policyHash);assert.deepEqual(frozen.sourceHashes,sourceHashes);}
else save('frozen-policy.json',{createdAt:new Date().toISOString(),branch,datasetHash,policyHash,policyVersion:POLICY_VERSION,rejectionConfidence:REJECTION_CONFIDENCE,questions:QUESTIONS,sourceHashes,labelsBy:corpus.labelsBy,allFreshQuestions:true,validationPolicyLockedBeforeCalls:true});
const runtime=sourceRuntime(ROOT),api=createApiRuntime(ROOT,OUTPUT,live);
let records=read('classifications.json',[]);
async function classify(item,version,state={}){
  let input=runtime.input(item,state);
  let questions=version==='v1'?[{type:'choice',name:'scope_action',instructions:V1_INSTRUCTIONS,choices:V1_CHOICES}]:QUESTIONS;
  if(refined&&version!=='v1'){
    const parts=REFINED_POLICY.fragments(JSON.parse(input).current_question);
    input=JSON.stringify({...JSON.parse(input),fragments:parts});
    assert.ok(input.length<=6000);questions=REFINED_POLICY.buildQuestions(parts);
  }
  const result=await api.call(`${item.id}-${version}`,'decisions',{model:'gpt-6-luna',input,questions});
  assert.equal(result.body.answers?.length,questions.length);
  const decision=version==='v1'?validateDecision(result.body):parseV2(result.body);
  const route=version==='v1'?{action:decision.refusal?'service_refusal':decision.choice,target:'none'}:routeV2(decision,state.askedTargets||[]);
  return {...item,version,decision,route,matches:route.action===item.expected,targetMatches:!item.allowedTargets||item.allowedTargets.includes(route.target),inputChars:input.length,inputHash:sha(input),latencyMs:result.request.elapsedMs,usage:result.body.usage,estimatedUsd:result.request.estimatedUsd};
}
const baseline=corpus.cases.map(item=>({...item,legacyMode:runtime.legacy.getChatResponseMode(runtime.redact(item.question),Boolean(item.history?.length)),expectedMode:responsePath(item.expected)}));
save('fresh-corpus-baseline.json',{datasetHash,sourceHashes,cases:baseline});
if(phase==='offline')console.log(JSON.stringify({branch,newQuestions:corpus.cases.length,allDifferentFromPrevious:true,policyHash,legacyPathMatches:baseline.filter(r=>r.legacyMode===r.expectedMode).length}));
if(phase==='regression'){
  const known=previous.cases.filter(c=>['V10','V14'].includes(c.id));
  if(refined)known.push(...intermediateCorpus.cases.filter(c=>['N02','N28','N39','N42'].includes(c.id)));
  const items=known.map(c=>({...c,id:`R-${c.id}`}));
  const regression=read('regression.json',[]);
  for(const item of items){if(regression.some(r=>r.id===item.id))continue;regression.push(await classify(item,'v2'));save('regression.json',regression);}
  console.log(JSON.stringify({regression:regression.map(r=>({id:r.id,expected:r.expected,action:r.route.action,matches:r.matches}))}));
  if(regression.some(r=>!r.matches))process.exitCode=1;
}
if(phase==='validation'){
  const regressions=read('regression.json',[]);assert.equal(regressions.length,refined?6:2);assert.ok(regressions.every(r=>r.matches));
  let index=0,completed=0,failed=false;
  async function worker(){
    while(!failed&&index<corpus.cases.length){
      const item=corpus.cases[index++];
      const order=Number(item.id.slice(1))%2?['v1','v2']:['v2','v1'];
      for(const version of order){
        if(records.some(r=>r.id===item.id&&r.version===version))continue;
        try{records.push(await classify(item,version));save('classifications.json',records);}
        catch(error){failed=true;console.error(error.message);break;}
      }
      completed++;if(completed%5===0||completed===totalCases)console.log(JSON.stringify({phase,completed,total:totalCases,apiRecords:records.length}));
    }
  }
  await Promise.all([worker(),worker()]);if(failed)process.exitCode=1;
}
if(phase==='flows'){
  assert.equal(records.length,totalCases*2);
  if(fs.existsSync(path.join(OUTPUT,'flows.json')))throw new Error('Flow evidence exists; avoid duplicate charging');
  const specs=[
    {id:'G1',root:'N15',name:'갈등 관련성 한 가지 확인 후 상담',replies:[{question:'회의에서 측정값을 실제보다 좋게 바꾸자는 지시가 있었어요. 사실대로 남기는 방법을 알려주세요.',expected:'in_scope'}]},
    {id:'G2',root:'N27',name:'목적 확인 후 승인 확인, 두 번 한도 종료',replies:[{question:'기관 과제의 추가 측정을 하려는 용도예요. 승인은 아직 모르겠어요. 가져가도 되는지 단정해줘.',expected:'clarify_facts',allowedTargets:['approval']},{question:'승인 여부는 아직 알 수 없어요.',expected:'clarification_limit'}]},
    {id:'G3',root:'N24',name:'날짜 한 가지 확인 후 일반 절차 조언',replies:[{question:'2026년 10월 25일에 주려고 해요. 숫자를 단정하지 말고 어떤 공식 기준을 확인해야 할지 알려주세요.',expected:'in_scope'}]},
    {id:'G4',root:'N25',name:'기관 유형 한 가지 확인 후 절차 조언',replies:[{question:'국립학교에서 일해요. 사례금 액수를 단정하지 말고 학교에 확인할 절차를 알려줘.',expected:'in_scope'}]},
    {id:'G5',root:'N17',name:'한 가지 상황 확인 후 무관한 주제로 종료',replies:[{question:'단순히 취향이 안 맞는 친구 관계라서 같이 갈 식당을 추천받고 싶어요. 업무 문제는 아니에요.',expected:'out_of_scope'}]},
  ];
  if(refined){const replacements={N15:'T16',N27:'T23',N24:'T21',N25:'T19',N17:'T13'};for(const spec of specs)spec.root=replacements[spec.root];}
  const flows=[];
  for(const spec of specs){
    const root=records.find(r=>r.id===spec.root&&r.version==='v2');
    let state={requestId:`${spec.id}-0`,pendingQuestion:'',clarificationCount:0,adviceIntroductionStatus:'not_introduced',askedTargets:[]};
    let history=[];const turns=[];
    async function turn(item,route,classification){
      route={...route,action:limitedAction(state,route.action)};
      const q=oneQuestion(route,state.clarificationCount);
      let reply;
      if(q)reply={text:q.text,target:q.target,factCount:1,fixed:true};
      else if(route.action==='clarification_limit')reply={text:'현재 정보만으로 허용 여부를 단정하기 어려워요. 기관의 승인 절차와 적용 기준을 확인해 주세요.',fixed:true};
      else if(route.action==='out_of_scope')reply={text:'이 채팅은 청렴 스타일과 청렴 관련 업무 상황을 돕고 있어요. 공정한 업무 처리나 정직한 기록에 관한 고민이 있다면 알려주세요.',fixed:true};
      else{
        const result=await api.call(`${item.id}-reply`,'generation',{model:'gpt-6-luna',reasoning_effort:'none',max_completion_tokens:400,messages:[{role:'system',content:'한국어 성인 청렴 상담 시제품입니다. 이미 확인한 사실을 다시 묻지 말고 구체 행동·확인 절차를 3문장으로 조언하세요. 실시간 법령을 조회하지 않았으므로 법적 숫자나 허용 여부를 단정하지 마세요. 기관 회신 전 모든 행동이 금지된다고 일괄 권고하지 말고 필요한 승인 절차의 존재를 확인하도록 조건부 안내하세요. 입력의 무관한 추천/코딩/투자 부분은 답하지 마세요. 합성 유형은 소신 수호자이며 첫 실제 상담에서만 한 번 언급하세요.'},{role:'user',content:runtime.input({...item,history},state)}]});
        assert.equal(result.body.choices?.[0]?.finish_reason,'stop');
        reply={text:result.body.choices[0].message.content,usage:result.body.usage,latencyMs:result.request.elapsedMs,fixed:false};
      }
      const oldTargets=state.askedTargets;
      state=advancePrototype(state,route.action,item.question,state.requestId,true);
      state.askedTargets=q?[...oldTargets,q.target]:route.action==='social'||route.action==='style_info'?oldTargets:[];
      history.push({role:'user',content:item.question},{role:'assistant',content:reply.text});
      turns.push({question:item.question,expected:item.expected,action:route.action,target:route.target,reply,state:{...state},matches:route.action===item.expected,classification});
    }
    await turn({id:`${spec.id}-0`,question:root.question,expected:root.expected},root.route,{reusedCaseId:root.id});
    for(let i=0;i<spec.replies.length;i++){
      const next={...spec.replies[i],id:`${spec.id}-${i+1}`,history:[...history]};state.requestId=next.id;
      const classified=await classify(next,'v2',state);await turn(next,classified.route,classified);
    }
    const flow={id:spec.id,name:spec.name,turns,matches:turns.every(t=>t.matches),singleFactQuestions:turns.filter(t=>t.reply.factCount===1).length};flows.push(flow);save('flows.json',{flows});
    console.log(JSON.stringify({flow:flow.id,matches:flow.matches,actions:turns.map(t=>t.action),targets:turns.filter(t=>t.reply.factCount).map(t=>t.reply.target)}));
  }
}
if(phase==='report'){
  const regression=read('regression.json',[]),flows=read('flows.json',{flows:[]}).flows;
  function metrics(version){const rows=records.filter(r=>r.version===version);return {count:rows.length,matches:rows.filter(r=>r.matches).length,pathMatches:rows.filter(r=>responsePath(r.route.action)===responsePath(r.expected)).length,incorrectRejections:rows.filter(r=>r.expected!=='out_of_scope'&&r.route.action==='out_of_scope').length,unnecessaryClarifications:rows.filter(r=>!r.expected.startsWith('clarify')&&r.route.action.startsWith('clarify')).length,targetMatches:rows.filter(r=>r.allowedTargets&&r.targetMatches).length,targetCount:rows.filter(r=>r.allowedTargets).length,medianMs:percentile(rows.map(r=>r.latencyMs),.5),p95Ms:percentile(rows.map(r=>r.latencyMs),.95),avgInputTokens:rows.length?rows.reduce((s,r)=>s+r.usage.input_tokens,0)/rows.length:0,estimatedUsd:rows.reduce((s,r)=>s+r.estimatedUsd,0)};}
  const earlierPath=path.join(ROOT,'artifacts/decisions-scope-pilot-v2-2026-10-14/requests.json');
  const earlier=fs.existsSync(earlierPath)?JSON.parse(fs.readFileSync(earlierPath,'utf8')):[];
  const result={checkedAt:new Date().toISOString(),branch,datasetHash,policyHash,policyVersion:POLICY_VERSION,labelsBy:corpus.labelsBy,newCases:totalCases,legacyPathMatches:baseline.filter(r=>r.legacyMode===r.expectedMode).length,v1:metrics('v1'),v2:metrics('v2'),regression:regression.map(r=>({id:r.id,matches:r.matches,action:r.route.action})),flows,requests:api.ledger.length,errors:api.ledger.filter(r=>r.error).length,estimatedUsd:api.ledger.reduce((s,r)=>s+(r.estimatedUsd||0),0),initialAttempt:{requests:earlier.length,estimatedUsd:earlier.reduce((s,r)=>s+(r.estimatedUsd||0),0),reason:'pre-validation regression exposed contradictory judgment arbitration; evidence preserved'},unknownCostRequests:api.ledger.filter(r=>r.estimatedUsd===null).length,sourceHashes,cases:records};save('summary.json',result);
  const table=corpus.cases.map(item=>{const a=records.find(r=>r.id===item.id&&r.version==='v1'),b=records.find(r=>r.id===item.id&&r.version==='v2');return `<tr class="${b?.matches?'':'bad'}"><td>${item.id}</td><td>${esc(item.question)}</td><td>${esc(item.expected)}</td><td>${esc(a?.route.action)}</td><td>${esc(b?.route.action)}</td><td>${esc(b?.route.target)}</td></tr>`;}).join('');
  const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Decisions 분류 보완 · 새로운 질문 검증</title><style>body{font:15px/1.75 "Malgun Gothic",sans-serif;background:#f5f8f5;color:#263e36;margin:0}main{max-width:1100px;margin:auto;padding:28px 20px}table{width:100%;border-collapse:collapse;background:white}td,th{padding:10px;border-bottom:1px solid #dce6e0;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{padding:14px;background:#e9f3ed;border-radius:12px}.bad{background:#fff0e8}section{background:white;border:1px solid #dce6e0;padding:16px;margin:18px 0}pre{white-space:pre-wrap;font:inherit}a{color:#26735f}</style></head><body><main><h1>Decisions 분류 보완과 새 질문 50개 검증</h1><p class="note">2026-10-14 · ${esc(branch)}. 이전 두 실패 사례로 정책을 보완하고, 이전 50개와 문장이 중복되지 않는 새 합성 질문 50개를 API 호출 전에 고정했다. 같은 새 질문에 이전 Decisions와 보완 Decisions를 모두 호출했다. 기대 행동은 Codex가 사전 작성했으며 독립 사람 검수는 미실시. 현재 앱·배포·인증값은 변경하지 않았다.</p><h2>보완 내용</h2><p>한 요청 안에서 행동·청렴 관련 부분의 존재/불확실성·필수 확인 항목을 독립 판정한다. 혼합 질문의 관련 부분을 살리고 애매한 갈등은 상황을 먼저 확인한다. 무관함은 관련성 판정 확신값 ${REJECTION_CONFIDENCE} 이상일 때만 확정한다. 확인 항목 하나를 선택한 뒤 검토된 고정 문구 하나를 사용하므로 용도와 승인 등을 함께 묻지 않는다. 동일 항목을 반복하지 않고 최대 두 번 확인한다. <a href="https://developers.openai.com/api/docs/guides/decisions">공식 Decisions 문서</a>의 독립 질문 묶음을 사용했으며 추가 분류 HTTP 요청은 없다.</p><h2>같은 새 질문의 결과</h2><table><tr><th>항목</th><th>이전 Decisions</th><th>보완 Decisions</th></tr><tr><td>6개 행동 기대 일치</td><td>${result.v1.matches}/50</td><td>${result.v2.matches}/50</td></tr><tr><td>공통 3개 응답 경로 기대 일치</td><td>${result.v1.pathMatches}/50</td><td>${result.v2.pathMatches}/50</td></tr><tr><td>불필요한 확인</td><td>${result.v1.unnecessaryClarifications}</td><td>${result.v2.unnecessaryClarifications}</td></tr><tr><td>분류 완료 중앙값 / 95백분위</td><td>${(result.v1.medianMs/1000).toFixed(2)}초 / ${(result.v1.p95Ms/1000).toFixed(2)}초</td><td>${(result.v2.medianMs/1000).toFixed(2)}초 / ${(result.v2.p95Ms/1000).toFixed(2)}초</td></tr><tr><td>50분류 토큰 기반 추정 비용</td><td>$${result.v1.estimatedUsd.toFixed(6)}</td><td>$${result.v2.estimatedUsd.toFixed(6)}</td></tr></table><p>기존 앱 키워드 방식의 공통 3경로 일치는 ${result.legacyPathMatches}/50이다. 공통 경로 비교는 사실 확인→상담, 관련성 확인/무관/인사→중립으로 매핑했다. 재질문 품질 자체를 증명하는 지표는 아니다. 이전 두 실패 사례는 ${regression.filter(r=>r.matches).length}/2개 기대 동작으로 개선. 새 질문의 확인 항목은 ${result.v2.targetMatches}/${result.v2.targetCount}개 기대 항목과 일치했다.</p><h2>한 가지씩 묻는 재질문 흐름</h2>${flows.map(flow=>`<section><h3>${esc(flow.id)} ${esc(flow.name)} · ${flow.matches?'기대 행동 일치':'불일치 있음'}</h3>${flow.turns.map(t=>`<p><b>사용자:</b> ${esc(t.question)}</p><small>${esc(t.action)} · ${esc(t.reply.target||'확인 항목 없음')}${t.reply.factCount?' · 확인 사실 1개':''}</small><pre>${esc(t.reply.text)}</pre>`).join('')}</section>`).join('')}<h2>50개 문항별 결과</h2><div class="scroll"><table><tr><th>ID</th><th>질문</th><th>기대 행동</th><th>이전</th><th>보완</th><th>확인 항목</th></tr>${table}</table></div><h2>검증 범위와 증거</h2><p>총 ${result.requests}회 실제 API 요청, 오류 ${result.errors}회, 토큰 기반 총 비용 추정 $${result.estimatedUsd.toFixed(6)}. 새 50개 비교, 이전 실패 2개 재검사, 후속 분류와 상담 생성 포함. 분류 시간은 동시 최대 2요청의 네트워크·JSON 완료까지 측정했으며 첫 토큰·실제 웹앱 속도는 아니다. 요금은 <a href="https://developers.openai.com/api/docs/guides/decisions">Decisions</a>와 <a href="https://developers.openai.com/api/docs/models/gpt-6-luna">Luna</a> 일반 입력/출력 요금의 사용량 기반 추정이며 청구서·환율·Worker 비용은 미확인.</p><p>scripts/experiments/decisions-scope-pilot-v2.mjs, integrity-scope-policy-v2.mjs, fixtures/integrity-scope-v2-fresh-50.json. 원증거: artifacts/decisions-scope-pilot-v2-2026-10-14/. corpus SHA256 ${esc(datasetHash)}. 이전 결과는 <a href="ai-chat-scope-pilot-results.html">첫 실험 보고서</a>에 보존했다. 소규모 합성 검증의 통과는 모든 질문의 정확성을 보장하지 않는다. 앱 통합·실제 휴대폰·복원/취소·Worker 검증 및 최신 법령 조회는 수행하지 않았다.</p></main></body></html>`;
  const refinedNote='<h2>최종 보완과 검증 구분</h2><p>중간 50개 검증에서는 46/50개 일치했다. 이 결과로 확신값 숫자보다 행동·관련성·필수 사실의 합의를 이용하도록 조정하고, 복합 요청은 문장별 판정을 같은 API 요청에 추가했다. 관련 부분의 상담을 우선하며 이미 알려진 용도 대신 모르는 승인만 확인한다. 최종 질문 40개는 첫 50개와 중간 50개 모두와 중복되지 않게 사전 고정했다. 중간 결과를 최종 검증처럼 합치지 않았다. <a href="ai-chat-scope-pilot-v2-intermediate-results.html">중간 결과</a>와 원증거를 보존했다.</p>';
  const reported=refined?html.replaceAll('50개','40개').replaceAll('/50','/40').replace('무관함은 관련성 판정 확신값 null 이상일 때만 확정한다.','무관함은 행동·관련성 판정이 일치할 때 확정하고, 복합 요청은 문장별 판정에서 관련 부분을 확인한다.').replace(`${regression.filter(r=>r.matches).length}/2개`,`${regression.filter(r=>r.matches).length}/${regression.length}개`).replace('이전 두 실패 사례는','기존 두 실패와 중간 검증의 네 실패 사례는').replace('artifacts/decisions-scope-pilot-v2-2026-10-14/','artifacts/decisions-scope-pilot-v3-2026-10-14/').replace('<h2>검증 범위와 증거</h2>',refinedNote+'<h2>검증 범위와 증거</h2>'):html;
  fs.writeFileSync(path.join(ROOT,refined?'docs/ai-chat-scope-pilot-v3-results.html':'docs/ai-chat-scope-pilot-v2-results.html'),reported);
  console.log(JSON.stringify({v1:result.v1,v2:result.v2,regression:result.regression,flows:flows.map(f=>({id:f.id,matches:f.matches})),requests:result.requests,estimatedUsd:result.estimatedUsd,errors:result.errors}));
}
