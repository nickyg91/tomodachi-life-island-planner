import type { PlannerItem } from '@/types/island';

// utils/pathConnectivity.ts
export function getCornerMask(x: number, y: number, items: PlannerItem[]): number {
  let mask = 0;
  const dirs = [
    { dx: 0, dy: -1, bit: 1 }, // top
    { dx: 1, dy: 0, bit: 2 }, // right
    { dx: 0, dy: 1, bit: 4 }, // bottom
    { dx: -1, dy: 0, bit: 8 }, // left
  ];

  for (const { dx, dy, bit } of dirs) {
    const key = `${x + dx},${y + dy}`;
    if (items.some((i) => `${i.x},${i.y}` === key && i.type === 'path')) {
      mask |= bit;
    }
  }
  return mask;
}
