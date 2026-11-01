import type { FileSpec, TabSpec } from "@aicore-fivem/shared";

/** Everyone online with their size (filled by the script, never saved). */
export const playersFile: FileSpec = {
  kind: "records",
  sync: "admin",
  memory: true,
  sections: {},
};

export const playersTab: TabSpec = {
  id: "players",
  file: "players",
  icon: "users",
  label: "ADMIN_TAB_PLAYERS",
  desc: "ADMIN_TAB_PLAYERS_DESC",
  cards: [],
  table: {
    sort: "name",
    columns: [
      { path: "id", label: "ADMIN_COL_ID", width: 0.6, mono: true },
      { path: "name", label: "ADMIN_COL_NAME", width: 2 },
      { path: "height", label: "ADMIN_COL_HEIGHT", mono: true },
      { path: "width", label: "ADMIN_COL_WIDTH", mono: true },
    ],
  },
};
