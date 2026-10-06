import assert from "node:assert/strict";
import test from "node:test";
import { loginAsAdmin } from "./helpers/api.js";

test("admin can log in and receive an access token", async () => {
  const { token } = await loginAsAdmin();
  assert.ok(token);
});
