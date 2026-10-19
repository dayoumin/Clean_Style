import { routeV2 as originalRoute } from './integrity-scope-policy-v3.mjs';
export { QUESTIONS,fragments,buildQuestions,parseV2,oneQuestion,responsePath } from './integrity-scope-policy-v3.mjs';
export const POLICY_VERSION='integrity-scope-2026-10-14-v2.3';
export function routeV2(answers,askedTargets=[]){
  // Contradictory "facts needed / no fact" is not a successful advice result.
  if(askedTargets.length>0&&!answers.scope_action.refusal&&answers.scope_action.choice==='clarify_facts'&&!answers.clarification_target.refusal&&answers.clarification_target.choice==='none'){
    const candidates=answers.clarification_target.probabilities.filter(p=>!['none','scope_situation',...askedTargets].includes(p.value)).sort((a,b)=>b.probability-a.probability);
    if(candidates[0]?.probability>=.20){
      const revised={...answers,clarification_target:{...answers.clarification_target,choice:candidates[0].value}};
      return {...originalRoute(revised,askedTargets),reason:'facts_needed_target_none_resolved',targetProbability:candidates[0].probability};
    }
    return {action:'clarification_limit',target:'none',reason:'facts_needed_no_supported_new_target'};
  }
  return originalRoute(answers,askedTargets);
}
