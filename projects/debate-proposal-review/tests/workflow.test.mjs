import assert from "node:assert/strict";
import test from "node:test";
import { chatTurn, advanceReview, WorkflowError } from "../src/lib/server/workflow.ts";
import { validateReviewSnapshot } from "../src/lib/review-contract.ts";

function review(overrides = {}) {
  return {
    id: "review-1", locale: "es", createdAt: "2026-11-02", updatedAt: "2026-11-02",
    consentAt: "2026-11-02", proposal: { title: "Pilot", summary: "Try a support draft pilot." },
    messages: [], sources: [{ id: "source-1", reviewId: "review-1", title: "Synthetic note", format: "text", passages: [{ id: "passage-1", sourceId: "source-1", locator: "line 1", text: "Twenty-four requests fit the pilot categories." }] }],
    stage: "draft", stageOutputs: {}, ...overrides,
  };
}

async function fails(promise, code) {
  await assert.rejects(promise, error => error instanceof WorkflowError && error.code === code);
}

test("consent and draft stage gate every model call", async () => {
  let calls = 0;
  const model = async () => { calls++; return {}; };
  const noConsent = review({ consentAt: undefined });
  await fails(chatTurn(noConsent, "Hello", model), "consent_required");
  await fails(advanceReview(noConsent, model), "consent_required");
  await fails(chatTurn(review({ stage: "claims" }), "Hello", model), "invalid_stage");
  assert.equal(calls, 0);
});

test("chat sends last 12 messages and locale, then validates proposal", async () => {
  const messages = Array.from({ length: 15 }, (_, index) => ({ id: String(index), role: "user", content: `Message ${index}` }));
  const before = review({ messages, locale: "en" });
  const after = await chatTurn(before, "New request", async input => {
    assert.equal(input.locale, "en");
    assert.equal(input.schema?.name, "chat");
    assert.equal(input.payload.messages.length, 12);
    assert.equal(input.payload.messages.at(-1).content, "New request");
    assert.match(input.systemInstruction, /untrusted/i);
    assert.match(input.systemInstruction, /message.*missing context/i);
    assert.match(input.systemInstruction, /proposal\.summary.*decision request/i);
    assert.match(input.systemInstruction, /proposal\.title.*160/i);
    assert.match(input.systemInstruction, /proposal\.summary.*12000/i);
    return { message: "Please confirm.", proposal: { title: "Updated", summary: "Edited summary." } };
  });
  assert.equal(after.messages.length, 17);
  assert.equal(after.proposal.title, "Updated");
  assert.equal(before.messages.length, 15);
  await fails(chatTurn(before, "x".repeat(6001), async () => ({})), "invalid_input");
  await fails(chatTurn(before, "Hello", async () => ({ message: "", proposal: { title: "X", summary: "Y" } })), "invalid_output");
});

test("a request to stop clarifying closes intake even if the model asks another question", async () => {
  const before = review({ messages: [
    { id: "1", role: "user", content: "Try a support pilot." },
    { id: "2", role: "assistant", content: "What is the budget?" },
  ] });
  const after = await chatTurn(before, "No necesito más preguntas por ahora; dejá los umbrales como preguntas abiertas.", async input => {
    assert.match(input.systemInstruction, /do not ask.*question/i);
    return { message: "¿Qué umbral de errores usarán?", proposal: { title: "Support pilot", summary: "Four-week pilot; error threshold undecided." } };
  });
  assert.equal(after.proposal.summary, "Four-week pilot; error threshold undecided.");
  assert.match(after.messages.at(-1).content, /Generar revisión/);
  assert.doesNotMatch(after.messages.at(-1).content, /[¿?]/);
});

test("leaving missing information as an open review question closes intake", async () => {
  const before = review({ messages: [
    { id: "1", role: "assistant", content: "¿Qué presupuesto usarán?" },
  ] });
  const message = "Esperamos 40 consultas en cuatro semanas. Si falta información, dejala como pregunta abierta en la revisión.";
  const after = await chatTurn(before, message, async input => {
    assert.match(input.systemInstruction, /do not ask another question/i);
    return { message: "¿Cuál es el costo por consulta?", proposal: { title: "Piloto de soporte", summary: "40 consultas; costo por consulta sin definir." } };
  });
  assert.match(after.messages.at(-1).content, /Generar revisión/);
  assert.equal(after.proposal.summary, "40 consultas; costo por consulta sin definir.");
});

test("after two clarification replies, intake points to review without another question", async () => {
  const before = review({ locale: "en", messages: [
    { id: "1", role: "assistant", content: "What is the budget?" },
    { id: "2", role: "user", content: "500 credits." },
    { id: "3", role: "assistant", content: "What is the threshold?" },
  ] });
  const after = await chatTurn(before, "Leave the threshold open.", async () => ({
    message: "What exact threshold?",
    proposal: { title: "Pilot", summary: "The threshold remains undecided." },
  }));
  assert.match(after.messages.at(-1).content, /Generate review/);
  assert.doesNotMatch(after.messages.at(-1).content, /[¿?]/);
});

test("one stage per call, shared source set, normalized links, evidence, synthesis, complete", async () => {
  const seen = [];
  const outputs = [
    { claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] },
    { arguments: [{ text: "The pilot covers sampled requests.", claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] }] },
    { arguments: [{ text: "Costs are unknown.", claims: [{ text: "Total costs are unknown.", kind: "factual" }] }] },
    { verdicts: [
      { claimId: "claim-1", status: "supported", supportingPassageIds: ["passage-1"], contradictingPassageIds: [], rationale: "The note states the count." },
      { claimId: "claim-2", status: "insufficient", supportingPassageIds: [], contradictingPassageIds: [], rationale: "No cost passage.", noRelevantPassage: true },
    ] },
    { summary: "The pilot has promise and cost uncertainty.", questions: [{ question: "What is total cost?", neededEvidence: "A cost analysis." }] },
  ];
  const model = async input => { seen.push(input); return outputs.shift(); };
  let state = review();
  for (const expected of ["claims", "supporting", "opposing", "evidence", "synthesis", "complete"]) {
    state = await advanceReview(state, model);
    assert.equal(state.stage, expected);
  }
  assert.equal(seen.length, 5);
  assert.deepEqual(seen.map(input => input.schema?.name), ["claims", "perspective", "perspective", "evidence", "synthesis"]);
  assert.equal(seen[3].schema.schema.properties.verdicts.items.required.includes("noRelevantPassage"), true);
  assert.match(seen[3].systemInstruction, /future.*extrapolation.*insufficient/i);
  assert.match(seen[3].systemInstruction, /absolute.*guarantee.*insufficient/i);
  assert.match(seen[3].systemInstruction, /conflicting.*mixed/i);
  assert.deepEqual(Object.keys(seen[0].payload), ["proposal"]);
  assert.match(seen[0].systemInstruction, /kind.*factual.*value_judgment/i);
  assert.match(seen[0].systemInstruction, /text.*500/i);
  assert.match(seen[1].systemInstruction, /strongest reasons in favor/i);
  assert.match(seen[2].systemInstruction, /strongest reasons against/i);
  for (const input of [seen[1], seen[2]]) {
    assert.ok(input.maxTokens >= 3000);
    assert.match(input.systemInstruction, /kind.*factual.*value_judgment/i);
    assert.match(input.systemInstruction, /exact.*JSON keys/i);
    assert.match(input.systemInstruction, /argument text.*2000/i);
    assert.match(input.systemInstruction, /claim text.*500/i);
    assert.match(input.systemInstruction, /no mandatory quota/i);
    assert.match(input.systemInstruction, /no empty.*items/i);
    assert.match(input.systemInstruction, /example JSON/i);
  }
  assert.equal(seen[1].payload.sources[0].id, seen[2].payload.sources[0].id);
  assert.ok(seen.every(input => input.locale === "es" && /untrusted/i.test(input.systemInstruction)));
  assert.deepEqual(state.snapshot.claims[0].origins, ["proposal", "supporting"]);
  assert.deepEqual(state.snapshot.claims[0].argumentIds, ["argument-1"]);
  assert.equal(state.snapshot.verdicts.length, 2);
  assert.ok(state.snapshotId);
  assert.equal(state.synthesis.questions.length, 1);
  await fails(advanceReview(state, model), "invalid_stage");
});

for (const locale of ["es", "en"]) {
  test(`source-free ${locale} review completes without evidence or synthesis model calls`, async () => {
    const initial = { claims: Array.from({ length: 8 }, (_, index) => ({ text: `Proposal assertion ${index + 1}.`, kind: "factual" })) };
    const supporting = { arguments: Array.from({ length: 3 }, (_, argument) => ({
      text: `Supporting reason ${argument + 1}.`,
      claims: Array.from({ length: 3 }, (_, claim) => ({ text: `Supporting assertion ${argument}-${claim}.`, kind: "factual" })),
    })) };
    const opposing = { arguments: [
      { text: "Opposing reason one.", claims: [
        { text: "Opposing assertion one.", kind: "factual" },
        { text: "Opposing assertion two.", kind: "factual" },
        { text: "The proposal is worthwhile.", kind: "value_judgment" },
      ] },
      { text: "Opposing reason two.", claims: [
        { text: "Opposing assertion three.", kind: "factual" },
        { text: "Opposing assertion four.", kind: "factual" },
      ] },
    ] };
    const outputs = [initial, supporting, opposing];
    let state = review({ locale, sources: [] });
    for (const expected of ["claims", "supporting", "opposing"]) {
      state = await advanceReview(state, async () => outputs.shift());
      assert.equal(state.stage, expected);
    }
    let calls = 0;
    const unexpectedModel = async () => { calls++; throw Error("No authorized sources"); };
    state = await advanceReview(state, unexpectedModel);
    assert.equal(state.stage, "evidence");
    assert.equal(state.snapshot.claims.filter(claim => claim.kind === "factual").length, 21);
    assert.equal(state.snapshot.verdicts.length, 21);
    assert.ok(state.snapshot.verdicts.every(verdict => verdict.status === "insufficient" && verdict.noRelevantPassage === true
      && verdict.supportingPassageIds.length === 0 && verdict.contradictingPassageIds.length === 0));
    assert.ok(!state.snapshot.verdicts.some(verdict => verdict.claimId === state.snapshot.claims.find(claim => claim.kind === "value_judgment").id));
    assert.deepEqual(state.stageOutputs.evidence.verdicts, state.snapshot.verdicts);
    assert.ok(state.snapshotId);
    assert.equal(validateReviewSnapshot(state.snapshot), state.snapshot);
    const snapshotId = state.snapshotId;

    // A persisted review already at evidence must resume through synthesis.
    state = await advanceReview(structuredClone(state), unexpectedModel);
    assert.equal(state.stage, "synthesis");
    assert.equal(state.snapshotId, snapshotId);
    assert.deepEqual(state.stageOutputs.synthesis, state.synthesis);
    assert.ok(state.synthesis.questions.length > 0);
    assert.ok(state.synthesis.questions.every(question => question.question && question.neededEvidence));
    if (locale === "es") {
      assert.match(state.synthesis.summary, /fuentes autorizadas/i);
      assert.match(state.synthesis.summary, /argumentos generados.*evidencia/i);
    } else {
      assert.match(state.synthesis.summary, /authorized sources/i);
      assert.match(state.synthesis.summary, /generated arguments.*evidence/i);
    }
    state = await advanceReview(state, unexpectedModel);
    assert.equal(state.stage, "complete");
    assert.equal(calls, 0);
  });
}

test("citation must be in that claim's review-scoped candidates; failed stage is retryable", async () => {
  const foreignSource = { id: "foreign", reviewId: "other", title: "Other", format: "text", passages: [{ id: "foreign-passage", sourceId: "foreign", locator: "line 1", text: "Other" }] };
  const started = await advanceReview(review(), async () => ({ claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] }));
  let state = { ...started, stage: "opposing", stageOutputs: { ...started.stageOutputs,
    claims: { claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] },
    supporting: { arguments: [] }, opposing: { arguments: [] },
  } };
  await fails(advanceReview({ ...state, sources: [...state.sources, foreignSource] }, async () => { throw Error("must not call"); }), "invalid_input");
  let calls = 0;
  await fails(advanceReview(state, async () => { calls++; return { verdicts: [{ claimId: "claim-1", status: "supported", supportingPassageIds: ["foreign-passage"], contradictingPassageIds: [], rationale: "Wrong source." }] }; }), "invalid_output");
  assert.equal(state.stage, "opposing");
  assert.equal(state.snapshot, undefined);
  state = await advanceReview(state, async input => {
    calls++;
    assert.deepEqual(input.payload.candidateIds["claim-1"], ["passage-1"]);
    assert.equal(input.payload.passages[0].id, "passage-1");
    return { verdicts: [{ claimId: "claim-1", status: "supported", supportingPassageIds: ["passage-1"], contradictingPassageIds: [], rationale: "The note states it." }] };
  });
  assert.equal(calls, 2);
  assert.equal(state.stage, "evidence");
  assert.equal(state.snapshot.sources.length, 1);
});

test("all 26 accepted claims complete with bounded, deduplicated evidence and synthesis context", async () => {
  const sources = Array.from({ length: 4 }, (_, sourceIndex) => ({
    id: `source-${sourceIndex}`, reviewId: "review-1", title: `Source ${sourceIndex}`, format: "text",
    passages: Array.from({ length: 5 }, (_, passageIndex) => ({
      id: `passage-${sourceIndex}-${passageIndex}`, sourceId: `source-${sourceIndex}`, locator: `paragraph ${passageIndex + 1}`,
      text: `A synthetic observation ${sourceIndex}-${passageIndex}. ` + "x".repeat(3900),
    })),
  }));
  const first = { claims: Array.from({ length: 8 }, (_, index) => ({ text: `Proposal claim ${index}`, kind: "factual" })) };
  const perspective = prefix => ({ arguments: Array.from({ length: 3 }, (_, arg) => ({
    text: `${prefix} argument ${arg}`,
    claims: Array.from({ length: 3 }, (_, claim) => ({ text: `${prefix} claim ${arg}-${claim}`, kind: "factual" })),
  })) });
  const outputs = [first, perspective("Support"), perspective("Oppose")];
  const calls = [];
  let state = review({ sources, proposal: { title: "Pilot", summary: "A".repeat(12000) } });
  for (let index = 0; index < 3; index++) {
    state = await advanceReview(state, async input => { calls.push(input); return outputs[index]; });
  }
  state = await advanceReview(state, async input => {
    calls.push(input);
    assert.equal(input.payload.claims.length, 26);
    assert.equal(Object.keys(input.payload.candidateIds).length, 26);
    const ids = new Set(input.payload.passages.map(passage => passage.id));
    assert.equal(ids.size, input.payload.passages.length);
    assert.ok(Object.values(input.payload.candidateIds).flat().every(id => ids.has(id)));
    assert.ok(input.payload.passages.every(passage => passage.text.length <= 500 && passage.truncated === true));
    return { verdicts: input.payload.claims.map(claim => ({ claimId: claim.id, status: "insufficient", supportingPassageIds: [], contradictingPassageIds: [], rationale: "Visible excerpts do not establish this claim.", noRelevantPassage: true })) };
  });
  assert.equal(state.snapshot.claims.length, 26);
  assert.equal(state.stage, "evidence");
  state = await advanceReview(state, async input => {
    calls.push(input);
    assert.equal(input.payload.snapshot, undefined);
    assert.equal(input.payload.verdicts.length, 26);
    return { summary: "Evidence is limited.", questions: [] };
  });
  assert.equal(state.stage, "synthesis");
  assert.ok(calls.every(input => JSON.stringify({ locale: input.locale, payload: input.payload }).length <= 90_000));
});

test("a passage in the shared pool cannot be cited for an unrelated claim", async () => {
  const passages = ["apples", "filler one", "filler two", "filler three", "filler four", "bananas", "extra one", "extra two", "extra three", "extra four", "extra five", "extra six", "extra seven", "extra eight", "extra nine", "extra ten", "extra eleven"].map((text, index) => ({
    id: `passage-${index}`, sourceId: "source-1", locator: `line ${index + 1}`, text,
  }));
  let state = review({ sources: [{ ...review().sources[0], passages }] });
  state = await advanceReview(state, async () => ({ claims: [
    { text: "apples", kind: "factual" }, { text: "bananas", kind: "factual" },
  ] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  await fails(advanceReview(state, async input => {
    assert.ok(input.payload.passages.some(passage => passage.id === "passage-5"));
    assert.ok(!input.payload.candidateIds["claim-1"].includes("passage-5"));
    return { verdicts: [
      { claimId: "claim-1", status: "supported", supportingPassageIds: ["passage-5"], contradictingPassageIds: [], rationale: "Wrong claim." },
      { claimId: "claim-2", status: "insufficient", supportingPassageIds: [], contradictingPassageIds: [], rationale: "No evidence.", noRelevantPassage: true },
    ] };
  }), "invalid_output");
});

test("small bilingual review supplies all review-owned passages to every factual claim", async () => {
  const passages = Array.from({ length: 8 }, (_, index) => ({
    id: `passage-${index}`, sourceId: "source-1", locator: `line ${index + 1}`,
    text: index === 7 ? "The provider estimate excludes reviewer time." : `Unrelated English note ${index}.`,
  }));
  let state = review({ sources: [{ ...review().sources[0], passages }] });
  state = await advanceReview(state, async () => ({ claims: [{ text: "El costo de revisión se excluye.", kind: "factual" }] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  state = await advanceReview(state, async input => {
    assert.equal(input.payload.candidateIds["claim-1"].length, 8);
    assert.ok(input.payload.candidateIds["claim-1"].includes("passage-7"));
    return { verdicts: [{ claimId: "claim-1", status: "supported", supportingPassageIds: ["passage-7"], contradictingPassageIds: [], rationale: "The note says reviewer time is excluded.", noRelevantPassage: false }] };
  });
  assert.equal(state.stage, "evidence");
});

test("evidence model sees only factual claims and returns no verdict for value judgments", async () => {
  let state = review();
  state = await advanceReview(state, async () => ({ claims: [
    { text: "The sample contained 24 eligible requests.", kind: "factual" },
    { text: "The pilot is desirable.", kind: "value_judgment" },
  ] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  state = await advanceReview(state, async () => ({ arguments: [] }));
  state = await advanceReview(state, async input => {
    assert.deepEqual(input.payload.claims.map(claim => claim.id), ["claim-1"]);
    assert.equal(input.payload.arguments, undefined);
    return { verdicts: [{ claimId: "claim-1", status: "insufficient", supportingPassageIds: [], contradictingPassageIds: [], rationale: "No direct excerpt.", noRelevantPassage: true }] };
  });
  assert.equal(state.snapshot.claims.length, 2);
  assert.equal(state.snapshot.verdicts.length, 1);
});

test("generation keeps an existing human decision untouched", async () => {
  const decision = { outcome: "defer", rationale: "Need more input", conditions: "", updatedAt: "2026-11-02", evidenceSnapshotId: "old" };
  const after = await advanceReview(review({ decision }), async () => ({ claims: [] }));
  assert.deepEqual(after.decision, decision);
});

test("proposal and sources freeze after draft", async () => {
  const started = await advanceReview(review(), async () => ({ claims: [] }));
  let calls = 0;
  const model = async () => { calls++; return { arguments: [] }; };
  await fails(advanceReview({ ...started, proposal: { ...started.proposal, summary: "Changed" } }, model), "invalid_input");
  await fails(advanceReview({ ...started, sources: [] }, model), "invalid_input");
  assert.equal(calls, 0);
});
