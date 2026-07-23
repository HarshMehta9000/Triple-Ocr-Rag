import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPii, scanOutput } from "./pii";

test("maskPii redacts SSN, email, DOB and labelled MRN", () => {
  const r = maskPii("Patient J. Rivera, SSN 123-45-6789, email j.r@acme.io, DOB 1979-04-12, MRN 4471-22-8890 owes $0.00");
  assert.match(r.masked, /\[SSN\]/);
  assert.match(r.masked, /\[EMAIL\]/);
  assert.match(r.masked, /\[DOB\]/);
  assert.match(r.masked, /\[MRN\]/);
  assert.equal(r.masked.includes("123-45-6789"), false, "SSN must be gone");
  assert.equal(r.masked.includes("j.r@acme.io"), false, "email must be gone");
  assert.equal(r.masked.includes("$0.00"), true, "non-PII money value preserved");
  assert.ok(r.total >= 4);
});

test("maskPii scrubs API keys / secrets", () => {
  const r = maskPii("use key sk-abcd1234567890efghijklmnop and AKIAIOSFODNN7EXAMPLE");
  assert.match(r.masked, /\[SECRET\]/);
  assert.equal(r.masked.includes("sk-abcd"), false);
  assert.equal(r.masked.includes("AKIA"), false);
});

test("scanOutput flags a leaked key in model output and cleans it", () => {
  const s = scanOutput("done. my key is gsk_abcdefghijklmnopqrstuvwxyz");
  assert.equal(s.leaked, true);
  assert.ok(s.findings.some((f) => f.category === "SECRET"));
  assert.equal(s.cleaned.includes("gsk_"), false);
});

test("scanOutput passes clean text through", () => {
  const s = scanOutput("The patient owes $0.00. CPT 99213 applied to deductible.");
  assert.equal(s.leaked, false);
  assert.equal(s.findings.length, 0);
  assert.equal(s.cleaned, "The patient owes $0.00. CPT 99213 applied to deductible.");
});
