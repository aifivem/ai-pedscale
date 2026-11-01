import type { FileSpec, TabSpec } from "@aicore-fivem/shared";
import { range } from "./range";

/** The "Change a size" form: picking a player loads their size, a changed number applies at once. */
export const editFile: FileSpec = {
  kind: "settings",
  sync: "admin",
  sections: {
    player: { type: "text", min: 0, max: 64, lookup: "player" },
    height: range(0.5, 1.5),
    width: range(0.5, 1.5),
  },
  defaults: { player: "", height: 1, width: 1 },
};

export const editTab: TabSpec = {
  id: "edit",
  file: "edit",
  icon: "user",
  label: "ADMIN_TAB_EDIT",
  desc: "ADMIN_TAB_EDIT_DESC",
  cards: [
    {
      icon: "user",
      title: "ADMIN_C_EDIT",
      desc: "ADMIN_C_EDIT_DESC",
      fields: [
        {
          widget: "text",
          path: "player",
          lookup: "player",
          label: "ADMIN_F_PLAYER",
          hint: "ADMIN_H_PLAYER",
          placeholder: "ADMIN_P_PLAYER",
        },
        {
          widget: "number",
          path: "height",
          label: "ADMIN_F_HEIGHT",
          hint: "ADMIN_H_HEIGHT",
          min: 0.5,
          max: 1.5,
          step: 0.01,
          unit: "x",
        },
        {
          widget: "number",
          path: "width",
          label: "ADMIN_F_WIDTH",
          hint: "ADMIN_H_WIDTH",
          min: 0.5,
          max: 1.5,
          step: 0.01,
          unit: "x",
        },
      ],
    },
  ],
};
