import {
  AdminWorld,
  cache,
  PlayerState,
  TickLoop,
} from "@aicore-fivem/lib/client";
import { readSettings, SCALE_STATE, toScale, type Scale } from "common/scale";

const world = new AdminWorld(["settings"]);
let settings = readSettings(world.get("settings"));
world.onChange(
  "settings",
  () => (settings = readSettings(world.get("settings"))),
);

const scaled = new Map<number, Scale>();
const len = (v: number[]) => Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0) || 1;

/**
 * A scaled ped drawn on this client every frame (`SetEntityMatrix` keeps no size of its own): height on the up axis,
 * width on the other two. Skipped in vehicles (the game resets it there) and past the draw distance.
 */
function draw(ped: number, s: Scale): void {
  if (IsPedInAnyVehicle(ped, false)) return;
  const [f, r, u, p] = GetEntityMatrix(ped);
  const width = settings.widthOn ? s.height * s.width : s.height;
  const fk = width / len(f);
  const rk = width / len(r);
  const uk = s.height / len(u);
  const still = GetEntitySpeed(ped) <= 0 && GetEntityHeightAboveGround(ped) < 2;
  const dz =
    (still ? GetEntityHeightAboveGround(ped) : GetEntityUprightValue(ped)) -
    s.height;
  // Looking around makes the matrix flicker.
  TaskLookAtEntity(ped, ped, 1, 2048, 3);
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

const tick = new TickLoop(() => {
  const [x = 0, y = 0, z = 0] = GetEntityCoords(cache.ped, false);
  for (const [serverId, s] of scaled) {
    const ped = GetPlayerPed(GetPlayerFromServerId(serverId));
    if (!ped || !DoesEntityExist(ped)) continue;
    const [px = 0, py = 0, pz = 0] = GetEntityCoords(ped, false);
    if (Math.hypot(px - x, py - y, pz - z) < settings.drawDistance)
      draw(ped, s);
  }
});

new PlayerState(SCALE_STATE, toScale).onChange((serverId, scale) => {
  if (scale) scaled.set(serverId, scale);
  else scaled.delete(serverId);
  tick.set(scaled.size > 0);
});
