export type Locale = "es" | "en";
export type Localized = Record<Locale, string>;
export type Verdict = "supported" | "contradicted" | "insufficient";
export type Passage = { id: string; sourceId: string; locator: string; text: string };
export type Source = { id: string; title: Localized; description: Localized; passages: Passage[] };
export type Claim = {
  id: string;
  text: Localized;
  verdict: Verdict;
  rationale: Localized;
  passageIds: string[];
};

export const sources: Source[] = [
  {
    id: "PILOT-01",
    title: { es: "Observaciones del ejercicio", en: "Exercise observations" },
    description: { es: "Muestra y tiempos ficticios", en: "Fictional sample and timing" },
    passages: [
      { id: "PILOT-01:P1", sourceId: "PILOT-01", locator: "P1 · sample and eligibility", text: "Forty fictional internal help-desk requests were sampled. Twenty-four fit the two proposed routine categories. Sixteen required account-specific judgment or contained information outside the proposed scope. No draft was sent automatically." },
      { id: "PILOT-01:P2", sourceId: "PILOT-01", locator: "P2 · time measurement", text: "For the 24 eligible requests, the synthetic median handling time was 12 minutes without drafts and 9 minutes with drafts and human edits. The note does not include confidence intervals, reviewer learning effects, or a future workload estimate." },
      { id: "PILOT-01:P3", sourceId: "PILOT-01", locator: "P3 · draft usefulness", text: "Eighteen of the 24 eligible drafts were usable after human edits; six were discarded. This is an exercise result, not evidence that the same rate will hold in a six-week pilot." },
    ],
  },
  {
    id: "RISK-01",
    title: { es: "Riesgos y revisión", en: "Risk and review notes" },
    description: { es: "Errores y controles propuestos", en: "Errors and proposed controls" },
    passages: [
      { id: "RISK-01:P1", sourceId: "RISK-01", locator: "P1 · incorrect drafts", text: "Two of the 40 sampled requests produced a draft with an incorrect account-specific instruction. Reviewers rejected both drafts before sending. The exercise did not measure how often reviewers might miss such an error in routine use." },
      { id: "RISK-01:P2", sourceId: "RISK-01", locator: "P2 · sensitive information", text: "Four sampled requests included sensitive employee details. The proposed pilot excludes those requests, but the source note does not specify a validated detection control or provider retention setting." },
      { id: "RISK-01:P3", sourceId: "RISK-01", locator: "P3 · review boundary", text: "The proposed workflow requires a human to approve every outgoing response. This is a proposed control; no production approval log or enforcement result exists in this fixture." },
    ],
  },
  {
    id: "COST-01",
    title: { es: "Supuestos de costos", en: "Cost assumptions" },
    description: { es: "Estimación incompleta", en: "Incomplete estimate" },
    passages: [
      { id: "COST-01:P1", sourceId: "COST-01", locator: "P1 · provider estimate", text: "The draft provider is estimated at 0.20 fictional currency units per eligible request. The estimate excludes reviewer time, implementation work, monitoring, and data-handling controls." },
      { id: "COST-01:P2", sourceId: "COST-01", locator: "P2 · missing workload inputs", text: "The note has no measured monthly eligible-request volume or reviewer-time cost. It cannot establish total pilot spend or savings against the proposed 500-unit cap." },
    ],
  },
];

export const claims: Claim[] = [
  {
    id: "C01",
    text: { es: "24 de 40 solicitudes de la muestra encajan en las categorías propuestas.", en: "24 of 40 sampled requests fit the proposed categories." },
    verdict: "supported",
    rationale: { es: "El pasaje indica el tamaño de la muestra y las solicitudes elegibles. Son datos inventados para esta maqueta.", en: "The passage states the sample size and eligible requests. These are invented data for this prototype." },
    passageIds: ["PILOT-01:P1"],
  },
  {
    id: "C02",
    text: { es: "El piloto reducirá 25 % el tiempo futuro de atención.", en: "The pilot will reduce future handling time by 25%." },
    verdict: "insufficient",
    rationale: { es: "La diferencia de medianas del ejercicio no demuestra un efecto futuro. Faltan incertidumbre y demanda representativa.", en: "The exercise's median difference does not establish a future effect. Uncertainty and representative demand are missing." },
    passageIds: ["PILOT-01:P2"],
  },
  {
    id: "C03",
    text: { es: "La revisión humana impedirá que cualquier instrucción incorrecta llegue a una persona.", en: "Human review will prevent any incorrect instruction from reaching an employee." },
    verdict: "insufficient",
    rationale: { es: "Se detectaron dos errores, pero no se midió la tasa de errores que podrían pasar inadvertidos.", en: "Two errors were caught, but the rate of errors that reviewers might miss was not measured." },
    passageIds: ["RISK-01:P1", "RISK-01:P3"],
  },
  {
    id: "C04",
    text: { es: "El costo estimado del proveedor incluye revisión y controles.", en: "The provider estimate includes review and control costs." },
    verdict: "contradicted",
    rationale: { es: "La nota de costos excluye explícitamente el tiempo de revisión y los controles.", en: "The cost note explicitly excludes reviewer time and controls." },
    passageIds: ["COST-01:P1"],
  },
  {
    id: "C05",
    text: { es: "Ya se conoce el costo total por solicitud elegible.", en: "The total cost per eligible request is already known." },
    verdict: "insufficient",
    rationale: { es: "Faltan el costo de revisión y el volumen esperado para estimar el gasto total o el ahorro.", en: "Reviewer cost and expected volume are missing, so total spend or savings cannot be estimated." },
    passageIds: ["COST-01:P2"],
  },
];

export const passageById = new Map(sources.flatMap((source) => source.passages.map((passage) => [passage.id, passage] as const)));

export function validateFixture(): void {
  const sourceIds = new Set(sources.map((source) => source.id));
  const passageIds = new Set<string>();
  for (const source of sources) {
    for (const passage of source.passages) {
      if (passage.sourceId !== source.id || passageIds.has(passage.id)) throw new Error(`Invalid fixture passage: ${passage.id}`);
      passageIds.add(passage.id);
    }
  }
  if (sourceIds.size !== sources.length) throw new Error("Duplicate fixture source ID");
  for (const claim of claims) {
    if (claim.passageIds.some((id) => !passageIds.has(id))) throw new Error(`Unresolved fixture citation: ${claim.id}`);
  }
}

validateFixture();
