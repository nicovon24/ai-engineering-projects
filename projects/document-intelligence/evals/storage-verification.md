# DI-004 local storage verification

Observed on 2026-10-31 with Node.js 24.15.0. Run `node evals/storage-verification.mjs` from the Document Intelligence directory. The runner transpiles the current storage module and its local dependencies into an isolated temporary directory, uses only synthetic text, then removes the directory. No application data, provider key, or external API is used.

The run exited 0 with 19 assertions. `npx eslint evals/storage-verification.mjs`, `npm run typecheck`, and `npm run build` also exited 0. `src/lib/storage.ts` was changed to reject an expired reservation at save time.

| Contract | Observed local result |
| --- | --- |
| Ten saved and pending question slots | 20 simultaneous `reserveQuestion` calls admitted exactly 10; the other 10 returned `question_limit`. A saved question consumed its reservation, and a further reservation was rejected while saved plus pending equaled 10. |
| Failure release | `releaseQuestion` removed a pending reservation and the next reservation succeeded. A missing passage ID caused `workspace_changed`; releasing that failed request returned the slot. |
| Stale source | Removing a document invalidated pending reservations and cleared saved history. A late `addQuestion` returned `workspace_changed`. A nonexistent cited passage also returned `workspace_changed`. |
| Reservation lifetime | A reservation backdated past two minutes could not save even before another reservation pruned it; the failed save did not add a question or renew expiry. The failed reservation could still be released. A separate next reservation pruned a stale ID, and a late save using that ID returned `workspace_changed`. |
| Session isolation | Two generated tokens differed. A token for the second workspace could not read or delete the first workspace's document; an invalid token could not read workspace metadata. |
| 24-hour access | Successful upload and saved question set expiry approximately 24 hours from the operation. Reserving, reading, downloading, and removing a document did not renew expiry. A backdated expiry denied access and deleted workspace metadata on read. |
| Manual deletion | `removeWorkspace` removed both the metadata path and the original file path. |

This is direct storage-level verification of one local process and filesystem. The question Route Handler's `finally` block calls `releaseQuestion` on failure, but provider failure and HTTP cookie behavior were not exercised here. Filesystem locks were tested with concurrent calls in one process; multi-process or cross-instance coordination remains unverified. Expiry was simulated by changing the synthetic workspace timestamp, rather than waiting 24 hours. Background deletion without access remains outside the local prototype.
