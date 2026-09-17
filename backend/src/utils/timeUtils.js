/**
 * Converts a time string "HH:mm" to total minutes from midnight (00:00)
 * @param {string} timeStr e.g. "09:30"
 * @returns {number} minutes e.g. 570
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Checks if an appointment falls within operating hours (09:00 to 20:00)
 * @param {string} startTime "HH:mm"
 * @param {string} endTime "HH:mm"
 * @param {string} opening "09:00"
 * @param {string} closing "20:00"
 * @returns {boolean}
 */
function isWithinWorkingHours(startTime, endTime, opening = '09:00', closing = '20:00') {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const openMins = timeToMinutes(opening);
  const closeMins = timeToMinutes(closing);

  if (startMins === null || endMins === null) return false;
  if (startMins >= endMins) return false; // End time must be after start time

  return startMins >= openMins && endMins <= closeMins;
}

/**
 * Checks if two time intervals overlap.
 * Interval 1: [start1, end1]
 * Interval 2: [start2, end2]
 * Overlap condition: start1 < end2 AND end1 > start2
 */
function isOverlapping(start1Str, end1Str, start2Str, end2Str) {
  const s1 = timeToMinutes(start1Str);
  const e1 = timeToMinutes(end1Str);
  const s2 = timeToMinutes(start2Str);
  const e2 = timeToMinutes(end2Str);

  if (s1 === null || e1 === null || s2 === null || e2 === null) return false;

  return s1 < e2 && e1 > s2;
}

module.exports = {
  timeToMinutes,
  isWithinWorkingHours,
  isOverlapping
};
