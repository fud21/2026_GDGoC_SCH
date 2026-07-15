// 레벨 곡선: 누적 필요 XP = 50 * level * (level + 1) / 2
// Lv2=100, Lv3=250, Lv5=750, Lv7=1400 (docs/PLAN.md 7장)
const MAX_LEVEL = 20;

export function levelForXp(xp) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpNeededForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function xpNeededForLevel(level) {
  return (50 * level * (level + 1)) / 2;
}
