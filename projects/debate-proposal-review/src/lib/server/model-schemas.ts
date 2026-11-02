const claim = {
  type: "object",
  properties: {
    text: { type: "string" },
    kind: { type: "string", enum: ["factual", "value_judgment"] },
  },
  required: ["text", "kind"],
  additionalProperties: false,
};

export const modelSchemas = {
  chat: {
    name: "chat",
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        proposal: {
          type: "object",
          properties: { title: { type: "string" }, summary: { type: "string" } },
          required: ["title", "summary"],
          additionalProperties: false,
        },
      },
      required: ["message", "proposal"],
      additionalProperties: false,
    },
  },
  claims: {
    name: "claims",
    schema: {
      type: "object",
      properties: { claims: { type: "array", items: claim } },
      required: ["claims"],
      additionalProperties: false,
    },
  },
  perspective: {
    name: "perspective",
    schema: {
      type: "object",
      properties: {
        arguments: {
          type: "array",
          items: {
            type: "object",
            properties: { text: { type: "string" }, claims: { type: "array", items: claim } },
            required: ["text", "claims"],
            additionalProperties: false,
          },
        },
      },
      required: ["arguments"],
      additionalProperties: false,
    },
  },
  evidence: {
    name: "evidence",
    schema: {
      type: "object",
      properties: {
        verdicts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claimId: { type: "string" },
              status: { type: "string", enum: ["supported", "contradicted", "mixed", "insufficient"] },
              supportingPassageIds: { type: "array", items: { type: "string" } },
              contradictingPassageIds: { type: "array", items: { type: "string" } },
              rationale: { type: "string" },
              noRelevantPassage: { type: "boolean" },
            },
            required: ["claimId", "status", "supportingPassageIds", "contradictingPassageIds", "rationale", "noRelevantPassage"],
            additionalProperties: false,
          },
        },
      },
      required: ["verdicts"],
      additionalProperties: false,
    },
  },
  synthesis: {
    name: "synthesis",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: { question: { type: "string" }, neededEvidence: { type: "string" } },
            required: ["question", "neededEvidence"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "questions"],
      additionalProperties: false,
    },
  },
} as const;
