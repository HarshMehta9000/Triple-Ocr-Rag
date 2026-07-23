import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText, retrieve, buildContext } from "./rag";

test("chunkText splits long text into overlapping chunks", () => {
  const long = "This is a sentence. ".repeat(200); // ~4600 chars
  const chunks = chunkText(long, 800, 150);
  assert.ok(chunks.length > 1, "should produce multiple chunks");
  for (const c of chunks) {
    assert.ok(c.text.length <= 1000, `chunk ${c.id} within size bounds`);
    assert.ok(c.text.trim().length > 0);
  }
});

test("retrieve ranks the chunk containing the answer highest", () => {
  const chunks = [
    { id: 0, text: "The interest rate on this loan is 7.25 percent per annum.", page: 1, charStart: 0 },
    { id: 1, text: "Borrower agrees to pay property taxes annually.", page: 2, charStart: 60 },
    { id: 2, text: "The property is located at 123 Main Street.", page: 3, charStart: 130 },
  ];
  const top = retrieve("What is the interest rate?", chunks, 3);
  assert.equal(top[0].id, 0, "interest-rate chunk should rank first");
  assert.ok(top[0].score > top[1].score);
});

test("buildContext formats sources", () => {
  const scored = [
    { id: 0, text: "answer text", page: 2, charStart: 0, score: 12.5 },
  ];
  const ctx = buildContext(scored);
  assert.match(ctx, /Source 1/);
  assert.match(ctx, /page 2/);
  assert.match(ctx, /bm25/);
});

test("retrieve handles empty corpus", () => {
  assert.deepEqual(retrieve("q", [], 5), []);
});
