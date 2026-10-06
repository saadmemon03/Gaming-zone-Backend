export function validateBookingTimes(startTime, endTime, now = new Date()) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "A valid booking start and end time are required.";
  }

  if (start <= now) {
    return "Booking start time must be in the future.";
  }

  if (end <= start) {
    return "Booking end time must be after its start time.";
  }

  return null;
}
