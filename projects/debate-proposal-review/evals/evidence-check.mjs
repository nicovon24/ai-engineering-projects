// Live evidence evaluation over six locally authored, synthetic labels per locale.
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { sources } from '../src/lib/fixture.ts';
import { advanceReview } from '../src/lib/server/workflow.ts';
process.loadEnvFile('.env.local');
const locale = process.argv[2] === 'en' ? 'en' : 'es';
const cases = JSON.parse(await readFile('evals/evidence-cases.json','utf8'));
const id = randomUUID(), now = new Date().toISOString();
let review = { id, locale, createdAt:now, updatedAt:now, consentAt:now, proposal:{title:'Synthetic evidence checkpoint',summary:'Check six explicitly fictional claims against the supplied fictional source notes.'},messages:[],sources:sources.map(s=>({id:s.id,reviewId:id,title:s.title[locale],format:'text',passages:s.passages})),stage:'draft',stageOutputs:{} };
for (const [sourceId,text] of [['BUDGET-A','The approved pilot budget is 500 units. El presupuesto aprobado del piloto es de 500 unidades.'],['BUDGET-B','The approved pilot budget is 700 units, not 500. El presupuesto aprobado del piloto es de 700 unidades, no 500.']]) review.sources.push({id:sourceId,reviewId:id,title:'Synthetic conflicting budget note',format:'text',passages:[{id:sourceId+':P1',sourceId,locator:'Paragraph 1',text}]});
const fixtureModel = async () => review.stage === 'draft' ? {claims:cases.map(c=>({text:c[locale],kind:'factual'}))} : {arguments:[]};
try {
  while(review.stage !== 'opposing') review=await advanceReview(review,fixtureModel);
  review=await advanceReview(review);
  const results=cases.map((item,index)=>{
    const verdict=review.snapshot.verdicts.find(v=>v.claimId===`claim-${index+1}`);
    return {id:item.id,expected:item.expected,observed:verdict.status,pass:item.expected===verdict.status,rationale:verdict.rationale,citations:[...verdict.supportingPassageIds,...verdict.contradictingPassageIds]};
  });
  await mkdir('.data/evals',{recursive:true});
  await writeFile(`.data/evals/evidence-${locale}.json`,JSON.stringify({locale,results},null,2));
  console.log(JSON.stringify({locale,cases:results.length,matchingLabels:results.filter(r=>r.pass).length,results:results.map(({id,pass,observed,expected})=>({id,pass,observed,expected}))}));
} catch(error) { console.log(JSON.stringify({locale,error:error.code||error.name})); process.exitCode=1; }
