import assert from "node:assert/strict";
import test from "node:test";
import { validateBookingTimes } from "../src/utils/bookingValidation.js";

const now = new Date("2026-10-05T12:00:00.000Z");

test("accepts a booking that starts in the future", () => {
  assert.equal(
    validateBookingTimes("2026-10-05T13:00:00.000Z", "2026-10-05T14:00:00.000Z", now),
    null,
  );
});

test("rejects a booking that starts in the past", () => {
  assert.match(
    validateBookingTimes("2026-10-05T11:00:00.000Z", "2026-10-05T12:00:00.000Z", now),
    /future/,
  );
});

test("rejects invalid dates and end times before the start", () => {
  assert.match(validateBookingTimes("invalid", "2026-10-05T14:00:00.000Z", now), /valid/);
  assert.match(
    validateBookingTimes("2026-10-05T13:00:00.000Z", "2026-10-05T12:30:00.000Z", now),
    /after its start/,
  );
});
