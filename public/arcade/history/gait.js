export const BOSS_STRIDE_RATIO = .18;

const stanceFraction = .58;
const stanceTravel = BOSS_STRIDE_RATIO * stanceFraction;

export function footstep(phase) {
  const time = phase - Math.floor(phase);
  // In stance, the foot moves back exactly as far as the body moves forward.
  if (time <= stanceFraction) return { offset: stanceTravel / 2 - BOSS_STRIDE_RATIO * time, lift: 0 };

  const swing = (time - stanceFraction) / (1 - stanceFraction);
  const reachProgress = swing * swing * (3 - 2 * swing);
  return { offset: stanceTravel * (reachProgress - .5), lift: .04 * Math.sin(Math.PI * swing) };
}
