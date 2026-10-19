import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';

export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export const percentile = (values, q) => { const sorted = [...values].sort((a,b) => a-b); return sorted.length ? sorted[Math.ceil(sorted.length*q)-1] : null; };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function sourceRuntime(root) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiled = ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022} }).outputText;
    const module = {exports:{}}; cache.set(filename,module);
    const nativeRequire = createRequire(filename);
    new Function('require','module','exports',compiled)(name=>name.startsWith('@/')?load(`src/${name.slice(2)}.ts`):nativeRequire(name),module,module.exports);
    return module.exports;
  }
  const legacy = load('src/lib/chat-intent.ts');
  const sanitize = load('src/lib/sanitize.ts');
  const redact = value => sanitize.scanAndRedactPii(sanitize.sanitizeUserInput(String(value || ''))).redacted;
  function input(item, state={}) {
    const data = {current_question:redact(item.question),pendingQuestion:redact(state.pendingQuestion),clarificationCount:state.clarificationCount||0,askedTargets:state.askedTargets||[],history:(item.history||[]).slice(-6).map(m=>({role:m.role,content:redact(m.content).slice(0,900)})),summary:redact(item.summary).slice(0,900),contextTruncated:false};
    let serialized=JSON.stringify(data);
    while(serialized.length>6000&&data.history.length){data.history.shift();data.contextTruncated=true;serialized=JSON.stringify(data);}
    if(serialized.length>6000){data.summary='';data.contextTruncated=true;serialized=JSON.stringify(data);}
    if(serialized.length>6000)throw new Error('Required evidence exceeds budget');
    return serialized;
  }
  return {legacy,redact,input};
}

export function createApiRuntime(root, output, live) {
  const ledgerPath=path.join(output,'requests.json');
  const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):[];
  let key;
  if(live){process.loadEnvFile(path.join(root,'.env.local'));key=process.env.OPENAI_API_KEY?.trim();if(!key)throw new Error('Approved local OPENAI_API_KEY missing');}
  const persist=()=>fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2));
  async function call(id,kind,payload){
    if(!live)throw new Error('API requires --live');
    if(ledger.length>=130||ledger.reduce((s,r)=>s+(r.estimatedUsd||0),0)>=.1)throw new Error('Experiment budget exceeded');
    const started=performance.now();const row={id,kind,startedAt:new Date().toISOString(),estimatedUsd:null};
    try{
      const response=await fetch(`https://api.openai.com/v1/${kind==='decisions'?'decisions':'chat/completions'}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      row.status=response.status;const body=await response.json().catch(()=>({}));row.elapsedMs=performance.now()-started;
      if(!response.ok)throw new Error(`HTTP ${response.status}: ${String(body.error?.code||body.error?.type||'API_ERROR')}`);
      row.usage=body.usage;
      if(kind==='decisions'&&Number.isFinite(body.usage?.input_tokens))row.estimatedUsd=body.usage.input_tokens*.1/1e6;
      else if(Number.isFinite(body.usage?.prompt_tokens)&&Number.isFinite(body.usage?.completion_tokens)){
        const cached=body.usage.prompt_tokens_details?.cached_tokens||0,written=body.usage.prompt_tokens_details?.cache_write_tokens||0;
        row.estimatedUsd=(Math.max(0,body.usage.prompt_tokens-cached-written)*.1+cached*.01+written*.125+body.usage.completion_tokens*.5)/1e6;
      }
      if(row.estimatedUsd===null)throw new Error('USAGE_MISSING');
      ledger.push(row);persist();return {body,request:row};
    }catch(error){row.elapsedMs=performance.now()-started;row.error=String(error.message||error.name).replace(/sk-[A-Za-z0-9_-]+/g,'[redacted]').slice(0,180);if(!ledger.includes(row))ledger.push(row);persist();throw new Error(`${id}: ${row.error}`);}
  }
  return {ledger,call};
}
