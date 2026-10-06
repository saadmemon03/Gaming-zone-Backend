import assert from "node:assert/strict";
import test from "node:test";
import { strongPasswordPattern } from "../src/utils/passwordValidation.js";

test("accepts passwords with all required character types and minimum length", () => {
  assert.equal(strongPasswordPattern.test("GameZone1!"), true);
});

test("rejects passwords missing a required character type or length", () => {
  for (const password of ["gamezone1!", "GAMEZONE1!", "GameZone!!", "Game1!", "GameZone1"]) {
    assert.equal(strongPasswordPattern.test(password), false, `${password} should be rejected`);
  }
});
