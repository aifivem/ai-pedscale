# ai-pedscale

Character height and width set by admins (`/setheight`, `/setwidth`, `/resetscale`) within limits from the admin panel, seen by every player. Converted from TGIANN's tgiann-ped-scale (GPL-3.0). Depends on ai-core (character metadata, admin panel, commands).

## Decisions

- The size lives in ai-core's character metadata (`pedScale`, `{ height, width }`), so no table; it is put on the player state `aiPedScale` at `playerLoaded` and cleared at 1 x 1.
- Every client draws the scaled players within the panel's draw distance on one per-frame `TickLoop` that runs only while someone is scaled: `SetEntityMatrix` with the up axis times height and the other two times width (width on top of height), the position lowered by the height difference.
- The panel states what the trick cannot do (hitboxes and collisions stay normal, animations and vehicles show the normal size for a moment, width glitches more); width starts switched off.

## Contracts

- Player state `aiPedScale` (`resource/common/scale.ts`), metadata `pedScale`. Commands `setheight`, `setwidth`, `resetscale` (admins).

## Entry points

- Server: commands, metadata, state `resource/server/index.ts`; panel `server/schema.ts`. Client: drawing `resource/client/index.ts`.
