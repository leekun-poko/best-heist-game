// Moonlit Museum — configuration for one big, readable heist room.
// Everything the judge needs is in a single frame: the room, the thief,
// guard vision cones, sweeping cameras, the loot and the alarm meter.
export const VIEW = { width: 1280, height: 720 };
export const HUD_H = 58;
export const ROOM = { x: 26, y: 78, w: 1228, h: 616 };
export const THIEF = { radius: 15, walk: 178, sneak: 92, run: 238 };
export const GUARD = { radius: 16, patrol: 74, chase: 148, coneLen: 178, coneHalf: 0.46 };
export const CAMERA = { coneLen: 168, coneHalf: 0.38, sweep: 0.62 };
export const ALARM = { riseGuard: 46, riseCamera: 34, decay: 13, laser: 60 };
export const LOOT_MAIN = { id: 'sapphire', name: 'Star Sapphire', value: 1000 };
