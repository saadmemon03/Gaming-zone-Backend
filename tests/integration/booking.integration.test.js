import assert from "node:assert/strict";
import test from "node:test";
import { loginAsAdmin } from "./helpers/api.js";

test("admin can create and remove a booking", async () => {
  const { baseUrl, token } = await loginAsAdmin();
  const headers = { Authorization: `Bearer ${token}` };

  const stationsResponse = await fetch(`${baseUrl}/api/stations`);
  const stationsData = await stationsResponse.json();
  assert.equal(stationsResponse.ok, true, `Could not fetch stations (HTTP ${stationsResponse.status})`);
  assert.equal(stationsData.success, true, "Station response was not successful");

  const station = stationsData.data?.[0];
  assert.ok(station?._id, "No station is available for the booking integration test");

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  let bookingId;
  try {
    const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        station: station._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        amount: 500,
        status: "Pending",
      }),
    });
    const bookingData = await bookingResponse.json();
    bookingId = bookingData.data?._id;

    assert.equal(bookingResponse.status, 201, `Could not create booking: ${bookingData.message ?? bookingResponse.status}`);
    assert.equal(bookingData.success, true, "Booking response was not successful");
    assert.ok(bookingId, "Booking response did not include the created booking ID");
  } finally {
    if (bookingId) {
      const deleteResponse = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers,
      });
      const deleteData = await deleteResponse.json();
      assert.equal(deleteResponse.ok, true, `Could not clean up test booking: ${deleteData.message ?? deleteResponse.status}`);
    }
  }
});
