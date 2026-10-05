const session = {
  isRecurring: 1,
  daysOfWeek: [1, 3, 5],
  recurringStartTime: "09:00",
  recurringEndTime: "15:00",
  targetGroups: ["Soprano 1","Soprano 2","Alto 1","Alto 2","Tenor 1","Tenor 2","Baritone","Bass"],
  location: { lat: 1, lng: 1 }
};

const user = {
  voiceType: "Soprano 1",
  bandPosition: null
};

// simulate what the client sees
const serverTime = "2026-10-05T04:24:00.000Z";
const serverDate = new Date(serverTime);
const clientDate = new Date(); // local node time
const timeDelta = serverDate.getTime() - clientDate.getTime();

const now = new Date(Date.now() + timeDelta);
let isTimeValid = false;

if (session.isRecurring) {
  const thaiTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const currentDay = thaiTime.getUTCDay();
  const currentHour = thaiTime.getUTCHours().toString().padStart(2, '0');
  const currentMinute = thaiTime.getUTCMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  
  console.log({ currentDay, currentTime });

  const isDayMatch = session.daysOfWeek ? session.daysOfWeek.includes(currentDay) : false;
  if (isDayMatch && currentTime >= (session.recurringStartTime || '') && currentTime <= (session.recurringEndTime || '')) {
    isTimeValid = true;
  }
}

const isTargetValid = !session.targetGroups || session.targetGroups.length === 0 || session.targetGroups.includes('All') || session.targetGroups.includes(user.voiceType) || (user.bandPosition && session.targetGroups.includes(user.bandPosition));

console.log({ isTimeValid, isTargetValid, final: isTimeValid && isTargetValid && session.location });
