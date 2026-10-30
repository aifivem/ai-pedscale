# ai-pedscale

Character height and width set by admins (panel tab "Change a size", `/setheight`, `/setwidth`, `/resetscale`) within limits from the admin panel, seen by every player. Converted from TGIANN's tgiann-ped-scale (GPL-3.0). Depends on ai-core (character metadata, admin panel, commands).

## Decisions

- The size lives in ai-core's character metadata (`pedScale`, `{ height, width }`), so no table; it is put on the player state `aiPedScale` at `playerLoaded` and cleared at 1 x 1.
- Every client draws the scaled players within the panel's draw distance on one per-frame `TickLoop` that runs only while someone is scaled: `SetEntityMatrix` with the up axis times height and the other two times width (width on top of height), the position lowered by the height difference. Looking around makes the matrix flicker, so the own scaled ped gets a 1 s `TaskLookAtEntity` at itself from the twice-a-second search (renewed before it runs out), never per frame and never on remote peds (it has no effect there).
- Panel tabs: Size (settings, `sync: "all"`, listed in `fxFiles` so clients read the file), Players (memory records file `players` keyed by citizen id: id, name, height, width, filled with `commit` at load / unload / every change), Change a size (`edit`, `sync: "admin"`): picking a player (lookup `player`) loads their size into the form one tick later (`setImmediate`, or the pick's own delta would overwrite it); a changed number applies at once. The form's rule checks only numbers that differ from the player's size now (heightOn / widthOn and the limits). The log names the editing admin from the lib's `panel.editor`.
- `commandAccess` (admins / everyone) is read at start because `addCommand`'s `restricted` is fixed at registration (the hint says it applies after the script restarts). With everyone, a player who is not `ai.admin` may only target themselves: that one ACE check is inside the handlers on purpose (a target rule, not the command permission). Params are `<value> [id]` (no id = yourself).
- Every size change is logged on channel `sizes` (who, target, size). Sizes load through lib `onCharacter`, which also replays the characters already loaded at a restart (a restart would otherwise lose the server mirror and reset width on the next height change).
- The panel states what the trick cannot do (hitboxes and collisions stay normal, animations and vehicles show the normal size for a moment, width glitches more); width starts switched off.

## Contracts

- Player state `aiPedScale` (`resource/common/scale.ts`), metadata `pedScale`. Commands `setheight <value> [id]`, `setwidth <value> [id]`, `resetscale [id]` (admins, or everyone for their own size).

## Entry points

- Server: commands `resource/server/index.ts`; sizes, panel list and form `server/sizes.ts`; panel `server/schema.ts`. Client: drawing `resource/client/index.ts`.
