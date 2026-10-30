import {
  AdminWorld,
  cache,
  PlayerState,
  TickLoop,
} from "@aicore-fivem/lib/client";
import { readSettings, SCALE_STATE, toScale, type Scale } from "common/scale";

const world = new AdminWorld(["settings"]);
const view = world.view("settings", readSettings);

const scaled = new Map<number, Scale>();
const len = (v: number[]) => Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0) || 1;

/**
 * A scaled ped drawn on this client every frame (`SetEntityMatrix` keeps no size of its own): height on the up axis,
 * width on the other two. Skipped in vehicles (the game resets it there) and past the draw distance.
 */
function draw(ped: number, s: Scale): void {
  if (IsPedInAnyVehicle(ped, false)) return;
  const [f, r, u, p] = GetEntityMatrix(ped);
  const width = view.value.widthOn ? s.height * s.width : s.height;
  const fk = width / len(f);
  const rk = width / len(r);
  const uk = s.height / len(u);
  const still = GetEntitySpeed(ped) <= 0 && GetEntityHeightAboveGround(ped) < 2;
  const dz =
    (still ? GetEntityHeightAboveGround(ped) : GetEntityUprightValue(ped)) -
    s.height;
  SetEntityMatrix(
    ped,
    (f[0] ?? 0) * fk,
    (f[1] ?? 0) * fk,
    (f[2] ?? 0) * fk,
    (r[0] ?? 0) * rk,
    (r[1] ?? 0) * rk,
    (r[2] ?? 0) * rk,
    (u[0] ?? 0) * uk,
    (u[1] ?? 0) * uk,
    (u[2] ?? 0) * uk,
    p[0] ?? 0,
    p[1] ?? 0,
    (p[2] ?? 0) - dz,
  );
}

/** Scaled peds within the draw distance, found twice a second; the frame loop runs only while there are any. */
const near: Array<{ ped: number; scale: Scale }> = [];
const tick = new TickLoop(() => {
  for (const { ped, scale } of near) if (DoesEntityExist(ped)) draw(ped, scale);
});

/** How long one look-at task holds; renewed by every search (twice a second), so it never runs out while scaled. */
const LOOK_MS = 1000;

function findNear(): void {
  near.length = 0;
  const [x = 0, y = 0, z = 0] = GetEntityCoords(cache.ped, false);
  for (const [serverId, scale] of scaled) {
    const ped = GetPlayerPed(GetPlayerFromServerId(serverId));
    if (!ped || !DoesEntityExist(ped)) continue;
    const [px = 0, py = 0, pz = 0] = GetEntityCoords(ped, false);
    if (Math.hypot(px - x, py - y, pz - z) >= view.value.drawDistance) continue;
    near.push({ ped, scale });
    // Looking around makes the matrix flicker; only the own ped takes the task (remote peds ignore it).
    if (ped === cache.ped) TaskLookAtEntity(ped, ped, LOOK_MS, 2048, 3);
  }
  tick.set(near.length > 0);
}

let finder: ReturnType<typeof setInterval> | null = null;
new PlayerState(SCALE_STATE, toScale).onChange((serverId, scale) => {
  if (scale) scaled.set(serverId, scale);
  else scaled.delete(serverId);
  if (scaled.size && !finder) finder = setInterval(findNear, 500);
  else if (!scaled.size && finder) {
    clearInterval(finder);
    finder = null;
  }
  findNear();
});
