import assert from "node:assert/strict";
import { expandGroundedNames, retrievePassages, scopeGroundedName } from "../src/lib/retrieval.ts";

function passage(id, text) {
  return { id, documentId: "document-a", text, page: 1, startOffset: 0, endOffset: text.length };
}

const ambiguous = {
  documents: [{
    id: "document-a",
    name: "people.txt",
    passages: [
      passage("nico", "Nico Pérez es diseñador de productos digitales."),
      passage("nicolas", "Nicolás Ruiz trabajó en Senzary durante tres años."),
    ],
  }],
};
assert.deepEqual(scopeGroundedName(ambiguous, "¿Dónde trabajó Nico?").documents[0].passages.map(({ id }) => id), ["nico"]);
assert.equal(expandGroundedNames(ambiguous, "¿Dónde trabajó Nico?"), "¿Dónde trabajó Nico?");
assert.ok(!retrievePassages(ambiguous, "¿Dónde trabajó Nico?").some(({ id }) => id === "nicolas"));

const nicknameOnly = {
  documents: [{
    id: "document-a",
    name: "profile.txt",
    passages: [passage("nicolas", "Nicolás Ruiz es ingeniero de software y trabajó en Senzary.")],
  }],
};
assert.match(expandGroundedNames(nicknameOnly, "¿Quién es Nico?"), /Nicolás$/);
assert.deepEqual(retrievePassages(nicknameOnly, "¿Quién es Nico?").map(({ id }) => id), ["nicolas"]);
const linked = {
  documents: [{
    id: "document-a",
    name: "linked-profile.txt",
    passages: [
      passage("alias", "Nico es el apodo de Nicolás Ruiz."),
      passage("work", "Nicolás Ruiz trabajó en Senzary durante tres años."),
    ],
  }],
};
assert.deepEqual(scopeGroundedName(linked, "¿Dónde trabajó Nico?").documents[0].passages.map(({ id }) => id), ["alias", "work"]);
assert.ok(retrievePassages(linked, "¿Dónde trabajó Nico?").some(({ id }) => id === "work"));
const crossFileLinked = {
  documents: [
    { id: "document-a", name: "alias.txt", passages: [passage("alias", "Nico es el apodo de Nicolás Ruiz.")] },
    { id: "document-b", name: "employment.txt", passages: [{ ...passage("work", "Nicolás Ruiz trabajó en Senzary."), documentId: "document-b" }] },
  ],
};
assert.deepEqual(scopeGroundedName(crossFileLinked, "¿Dónde trabajó Nico?").documents.map(({ id }) => id), ["document-a", "document-b"]);
assert.ok(retrievePassages(crossFileLinked, "¿Dónde trabajó Nico?").some(({ id }) => id === "work"));
const parenthesizedLink = {
  documents: [
    { id: "document-a", name: "alias.txt", passages: [passage("alias", "Nicolás (Nico) Ruiz es ingeniero.")] },
    { id: "document-b", name: "employment.txt", passages: [
      { ...passage("work", "Nicolás Ruiz trabajó en Senzary."), documentId: "document-b" },
      { ...passage("other", "Nicolás Ruizman trabajó en otra empresa."), documentId: "document-b" },
    ] },
  ],
};
assert.deepEqual(scopeGroundedName(parenthesizedLink, "¿Dónde trabajó Nico?").documents[1].passages.map(({ id }) => id), ["work"]);
console.log("Semantic name verification passed: literal names take priority and explicit nickname links reach matching passages across files.");
