import {
  addCommand,
  aiLogChannels,
  notify,
  online,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { createLogger } from "@aicore-fivem/lib/shared";
import { ADMIN, CORE, type CharacterInfo } from "@aicore-fivem/shared";
import { Locale, ResourceName } from "common";
import { PLAIN, readSettings } from "common/scale";
import { Panel } from "./panel";
import { schema } from "./schema";
import { Sizes } from "./sizes";

const log = createLogger(ResourceName);
const core = resourceExport("ai-core");
const panel = new Panel(schema);
let settings = readSettings(panel.get("settings"));
panel.onChange(
  "settings",
  () => (settings = readSettings(panel.get("settings"))),
);
aiLogChannels({ sizes: {} });

const sizes = new Sizes(panel, () => settings);
on(CORE.playerLoadedEvent, (source: number, character: CharacterInfo) =>
  sizes.load(source, character),
);
on(CORE.playerUnloadedEvent, (source: number) => sizes.unload(source));
// Characters loaded before this script (re)started.
for (const source of online.sources()) {
  const character = core.GetCharacter(source);
  if (character) sizes.load(source, character);
}

const tell = (source: number, text: string, kind: "success" | "error") =>
  source > 0 ? notify(source, text, kind) : log.info(text);

/** Read once: `restricted` is fixed when a command is registered, so a change applies after a restart. */
const everyone = settings.commandAccess === "everyone";

/** Whose size a command changes: the given id or the caller; players who are not admins only their own. */
function targetOf(source: number, id: number | undefined): number | string {
  const target = id ?? source;
  if (target <= 0) return Locale("ERR_PLAYER_ONLY");
  if (
    everyone &&
    target !== source &&
    source > 0 &&
    !IsPlayerAceAllowed(String(source), ADMIN.ace)
  )
    return Locale("ERR_OWN_ONLY");
  if (!online.character(target)) return Locale("ERR_OFFLINE");
  return target;
}

const value = {
  name: "value",
  type: "number",
  help: Locale("COMMAND_P_VALUE"),
} as const;
const id = {
  name: "id",
  type: "playerId",
  help: Locale("COMMAND_P_ID"),
  optional: true,
} as const;

addCommand(
  "setheight",
  {
    help: Locale("COMMAND_HEIGHT"),
    params: [value, id],
    restricted: !everyone,
  },
  (source, args) => {
    const target = targetOf(source, args.id);
    if (typeof target === "string") return tell(source, target, "error");
    if (!settings.heightOn)
      return tell(source, Locale("ERR_HEIGHT_OFF"), "error");
    if (args.value < settings.minHeight || args.value > settings.maxHeight)
      return tell(
        source,
        Locale("ERR_RANGE", settings.minHeight, settings.maxHeight),
        "error",
      );
    sizes.set(source, target, { ...sizes.get(target), height: args.value });
    tell(source, Locale("NOTIFY_HEIGHT", args.value), "success");
  },
);
addCommand(
  "setwidth",
  {
    help: Locale("COMMAND_WIDTH"),
    params: [value, id],
    restricted: !everyone,
  },
  (source, args) => {
    const target = targetOf(source, args.id);
    if (typeof target === "string") return tell(source, target, "error");
    if (!settings.widthOn)
      return tell(source, Locale("ERR_WIDTH_OFF"), "error");
    if (args.value < settings.minWidth || args.value > settings.maxWidth)
      return tell(
        source,
        Locale("ERR_RANGE", settings.minWidth, settings.maxWidth),
        "error",
      );
    sizes.set(source, target, { ...sizes.get(target), width: args.value });
    tell(source, Locale("NOTIFY_WIDTH", args.value), "success");
  },
);
addCommand(
  "resetscale",
  { help: Locale("COMMAND_RESET"), params: [id], restricted: !everyone },
  (source, args) => {
    const target = targetOf(source, args.id);
    if (typeof target === "string") return tell(source, target, "error");
    sizes.set(source, target, PLAIN);
    tell(source, Locale("NOTIFY_RESET"), "success");
  },
);
