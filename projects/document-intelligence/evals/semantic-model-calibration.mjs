import { pipeline } from "@huggingface/transformers";
import { readFile } from "node:fs/promises";

const model = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
  revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
});
const passages = [
  "Nicolás Ruiz es ingeniero de software. Trabajó en Senzary durante tres años y desarrolló aplicaciones web.",
  "La fotosíntesis permite que las plantas conviertan luz solar en energía química.",
  "El equipo eligió PostgreSQL para almacenar los registros de la aplicación.",
];
const cases = [
  { question: "¿En qué empresa laburó?", expected: 0 },
  { question: "Who did Nicolás work for?", expected: 0 },
  { question: "¿Qué hay en Marte?", expected: null },
  { question: "¿Cuántos goles metió Messi?", expected: null },
];

const vectors = (await model(passages, { pooling: "mean", normalize: true })).tolist();
for (const item of cases) {
  const [query] = (await model([item.question], { pooling: "mean", normalize: true })).tolist();
  const scores = vectors.map((vector) => query.reduce((sum, value, index) => sum + value * vector[index], 0));
  console.log(JSON.stringify({ question: item.question, expected: item.expected, scores: scores.map((value) => Number(value.toFixed(3))) }));
}

const corpus = JSON.parse(await readFile(new URL("./retrieval-cases.json", import.meta.url), "utf8"));
const sourcePassages = corpus.documents.flatMap((document) => document.passages);
const sourceVectors = (await model(sourcePassages.map((passage) => passage.text), { pooling: "mean", normalize: true })).tolist();
for (const item of corpus.cases) {
  const [query] = (await model([item.question], { pooling: "mean", normalize: true })).tolist();
  const ranked = sourcePassages.map((passage, position) => ({
    id: passage.id,
    score: query.reduce((sum, value, index) => sum + value * sourceVectors[position][index], 0),
  })).sort((a, b) => b.score - a.score);
  console.log(JSON.stringify({ id: item.id, expected: item.expectedPassageIds, top: ranked.slice(0, 3).map(({ id, score }) => [id, Number(score.toFixed(3))]) }));
}
