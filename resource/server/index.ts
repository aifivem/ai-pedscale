import {
  AdminPanel,
  addCommand,
  notify,
  PlayerState,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { createLogger } from "@aicore-fivem/lib/shared";
import { CORE } from "@aicore-fivem/shared";
import { Locale, ResourceName } from "common";
import {
  readSettings,
  SCALE_META,
  SCALE_STATE,
  toScale,
  type Scale,
} from "common/scale";
import { schema } from "./schema";

const log = createLogger(ResourceName);
const core = resourceExport("ai-core");
const panel = new AdminPanel(schema);
let settings = readSettings(panel.get("settings"));
panel.onChange(
  "settings",
  () => (settings = readSettings(panel.get("settings"))),
);
const scaleState = new PlayerState(SCALE_STATE, toScale);

/** Shows a scale to everyone near (cleared at 1 x 1) and keeps it in the character's metadata. */
function apply(source: number, scale: Scale, save: boolean): void {
  const plain = scale.height === 1 && scale.width === 1;
  scaleState.set(source, plain ? undefined : scale);
  if (save) core.SetMeta(source, SCALE_META, plain ? null : scale);
}

on(CORE.playerLoadedEvent, (source: number) => {
  const saved = toScale(core.GetMeta(source, SCALE_META));
  if (saved) apply(source, saved, false);
});
on(CORE.playerUnloadedEvent, (source: number) =>
  scaleState.set(source, undefined),
);

const tell = (source: number, text: string, kind: "success" | "error") =>
  source > 0 ? notify(source, text, kind) : log.info(text);
const target = {
  name: "id",
  type: "playerId",
  help: Locale("COMMAND_P_ID"),
} as const;
const value = {
  name: "value",
  type: "number",
  help: Locale("COMMAND_P_VALUE"),
} as const;

addCommand(
  "setheight",
  { help: Locale("COMMAND_HEIGHT"), params: [target, value], restricted: true },
  (source, args) => {
    if (!settings.heightOn)
      return tell(source, Locale("ERR_HEIGHT_OFF"), "error");
    if (args.value < settings.minHeight || args.value > settings.maxHeight)
      return tell(
        source,
        Locale("ERR_RANGE", settings.minHeight, settings.maxHeight),
        "error",
      );
    const current = scaleState.get(args.id) ?? { height: 1, width: 1 };
    apply(args.id, { ...current, height: args.value }, true);
    tell(source, Locale("NOTIFY_HEIGHT", args.value), "success");
  },
);
addCommand(
  "setwidth",
  { help: Locale("COMMAND_WIDTH"), params: [target, value], restricted: true },
  (source, args) => {
    if (!settings.widthOn)
      return tell(source, Locale("ERR_WIDTH_OFF"), "error");
    if (args.value < settings.minWidth || args.value > settings.maxWidth)
      return tell(
        source,
        Locale("ERR_RANGE", settings.minWidth, settings.maxWidth),
        "error",
      );
    const current = scaleState.get(args.id) ?? { height: 1, width: 1 };
    apply(args.id, { ...current, width: args.value }, true);
    tell(source, Locale("NOTIFY_WIDTH", args.value), "success");
  },
);
addCommand(
  "resetscale",
  { help: Locale("COMMAND_RESET"), params: [target], restricted: true },
  (source, args) => {
    apply(args.id, { height: 1, width: 1 }, true);
    tell(source, Locale("NOTIFY_RESET"), "success");
  },
);
