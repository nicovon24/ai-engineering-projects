# Hybrid retrieval design

## Local flow

At upload, parsing creates the existing stable passage IDs and offsets. A pinned ONNX multilingual sentence model embeds token-safe windows for each passage. The original and a versioned vector index are stored under the same temporary workspace. An embedding failure does not discard an otherwise valid upload.

At question time, the route authorizes the workspace, embeds the question, and backfills missing or stale indexes before the two-minute question reservation begins. It then reserves a slot and ranks the current workspace's passages by maximum cosine similarity across each passage's windows. If documents changed during preparation, it uses lexical retrieval. Scores below the initial calibrated threshold are omitted. Reciprocal rank fusion combines up to 20 lexical and 20 semantic candidates into at most five passages. Optional Groq rewrites still receive only question and locale; the documentary answer receives only selected passages. The existing single-document overview path keeps representative source coverage.

`Nico` expands to `Nicolás` when the current workspace contains that name and either no passage literally uses `Nico` or a passage explicitly links the nickname to `Nicolás`. A literal `Nico` source takes precedence. With an explicit link that includes a full name, search also considers passages naming that same person, including in another uploaded file. When the nickname is only a search hint, the answer prompt requires conditional wording; code rejects claims that do not begin with a condition naming `Nicolás` or that assert `Nico` in the rest of the claim. Other nicknames are not inferred by a general-purpose alias service.

## Persistence and failures

Vector files live at `.data/workspaces/<token>/vectors/<document-id>.json`. They contain the model revision, document ID, passage IDs, and vectors. Originals and vector files are written before the workspace metadata is committed; removal deletes both. Lazy reindexing checks the current document under the workspace lock before replacing a vector file. Workspace deletion or expiry removes the entire directory. A mismatched model version or passage list triggers reindexing. If indexing or query embedding fails, the question uses lexical retrieval and records a localized fallback notice.

The current local corpus is small enough for exact in-memory similarity. This does not add a database or vector service. A public multi-instance release still needs durable metadata and original storage, scheduled deletion, and cross-instance controls.

## Model and calibration

The model is `Xenova/paraphrase-multilingual-MiniLM-L12-v2` at revision `2c4055b12046f11709e9df2c122e59ffbdc2f900` through Transformers.js. The source model is Apache 2.0 licensed. It maps text to 384-dimensional vectors and has a 128-token input limit; the implementation uses 112-token windows. The initial cosine threshold is 0.25, chosen from the narrow synthetic calibration in [review.md](review.md), not a universal relevance guarantee. Reassess it on a broader labeled corpus before public use.

Sources: [model card](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2), [ONNX model](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2), [Transformers.js](https://huggingface.co/docs/transformers.js/index).
