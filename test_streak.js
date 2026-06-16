const allTrips = [{createdAt: new Date()}];
let newStreak = 1;
if (allTrips.length > 0) {
  const uniqueDays = new Set();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  uniqueDays.add(now.getTime());
  for (const trip of allTrips) {
    const d = new Date(trip.createdAt);
    d.setHours(0, 0, 0, 0);
    uniqueDays.add(d.getTime());
  }
  const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
  let currentStreak = 1;
  for (let i = 0; i < sortedDays.length - 1; i++) {
    const diff = sortedDays[i] - sortedDays[i + 1];
    if (diff === 86400000) {
      currentStreak++;
    } else {
      break;
    }
  }
  newStreak = currentStreak;
}
console.log("newStreak:", newStreak);
