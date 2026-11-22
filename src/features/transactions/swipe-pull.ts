// Matches the delete action's w-24
export const ACTION_WIDTH = 96;
export const OPEN_DISTANCE = 48;
const MAX_PULL = ACTION_WIDTH * 1.5;

// Past the action's width the row follows the finger less and less, never reaching MAX_PULL
export function pullOf(distance: number) {
  const reach = Math.abs(distance);
  if (reach <= ACTION_WIDTH) return distance;

  const room = MAX_PULL - ACTION_WIDTH;
  const extra = reach - ACTION_WIDTH;
  return Math.sign(distance) * (ACTION_WIDTH + room * (1 - room / (extra + room)));
}

// A right swipe edits, a left one opens delete
export function armedActionOf(offset: number) {
  if (offset >= ACTION_WIDTH) return "edit";
  if (offset <= -OPEN_DISTANCE) return "delete";
  return null;
}
