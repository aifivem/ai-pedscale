import type { PanelSchema } from "@aicore-fivem/shared";
import { editFile, editTab } from "./edit";
import { playersFile, playersTab } from "./players";
import { settingsFile, settingsTab } from "./settings";

/** ai-pedscale's panel: what may be scaled and how far, and what the trick cannot do. */
export const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "user",
  files: {
    settings: settingsFile,
    players: playersFile,
    edit: editFile,
  },
  tabs: [settingsTab, playersTab, editTab],
};
