import { AdminPanel, aiLogChannels } from "@aifivem/lib/server";
import { readSettings } from "common/scale";
import { schema } from "./schema";
import { Sizes } from "./sizes";

const panel = new AdminPanel(schema);
export const view = panel.view("settings", readSettings);
aiLogChannels({ sizes: {} });

export const sizes = new Sizes(panel, () => view.value);
