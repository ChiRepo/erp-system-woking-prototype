// Use enrollment identifiers only. Email/name guesses must never assign classes.
export function facultyScheduleId(user) {
  return String(user?.facultyId || user?.employeeId || user?.id || user?.uid || '').trim();
}

export function studentScheduleCohort(user) {
  return {
    dept: String(user?.dept || user?.department || '').trim(),
    sem: String(user?.sem || user?.semester || '').trim()
  };
}

// Clamp only the viewport. The displayed date/time still comes from the real clock.
export function liveTimelineCursor(date, startHour = 8, endHour = 20) {
  const dayIndex = (date.getDay() + 6) % 7;
  const minutesPerDay = (endHour - startHour) * 60;
  const minute = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  return {
    dayIndex,
    minute,
    position: dayIndex * minutesPerDay + Math.max(0, Math.min(minutesPerDay - 0.0001, minute - startHour * 60))
  };
}

