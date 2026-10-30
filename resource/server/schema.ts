import type { PanelSchema } from "@aicore-fivem/shared";

const range = (min: number, max: number) => ({
  type: "number" as const,
  min,
  max,
});

/** ai-pedscale's panel: what may be scaled and how far, and what the trick cannot do. */
export const schema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "user",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        heightOn: { type: "bool" },
        widthOn: { type: "bool" },
        minHeight: range(0.5, 1),
        maxHeight: range(1, 1.5),
        minWidth: range(0.5, 1),
        maxWidth: range(1, 1.5),
        drawDistance: { type: "number", min: 20, max: 300, integer: true },
        commandAccess: { type: "enum", values: ["admins", "everyone"] },
      },
      defaults: {
        commandAccess: "admins",
        heightOn: true,
        widthOn: false,
        minHeight: 0.85,
        maxHeight: 1.1,
        minWidth: 0.9,
        maxWidth: 1.15,
        drawDistance: 100,
      },
    },
    /** Everyone online with their size (filled by the script, never saved). */
    players: { kind: "records", sync: "admin", memory: true, sections: {} },
    /** The "Change a size" form: picking a player loads their size, a changed number applies at once. */
    edit: {
      kind: "settings",
      sync: "admin",
      sections: {
        player: { type: "text", min: 0, max: 64, lookup: "player" },
        height: range(0.5, 1.5),
        width: range(0.5, 1.5),
      },
      defaults: { player: "", height: 1, width: 1 },
    },
  },
  tabs: [
    {
      id: "settings",
      file: "settings",
      icon: "user",
      label: "ADMIN_TAB",
      desc: "ADMIN_TAB_DESC",
      cards: [
        {
          icon: "terminal",
          title: "ADMIN_C_COMMANDS",
          desc: "ADMIN_C_COMMANDS_DESC",
          fields: [
            {
              widget: "select",
              path: "commandAccess",
              label: "ADMIN_F_ACCESS",
              hint: "ADMIN_H_ACCESS",
              options: [
                { value: "admins", label: "ADMIN_O_ADMINS" },
                { value: "everyone", label: "ADMIN_O_EVERYONE" },
              ],
            },
          ],
        },
        {
          icon: "triangle-exclamation",
          title: "ADMIN_C_LIMITS",
          desc: "ADMIN_C_LIMITS_DESC",
          fields: [],
        },
        {
          icon: "user",
          title: "ADMIN_C_HEIGHT",
          desc: "ADMIN_C_HEIGHT_DESC",
          fields: [
            {
              widget: "switch",
              path: "heightOn",
              label: "ADMIN_F_HEIGHT_ON",
              hint: "ADMIN_H_HEIGHT_ON",
            },
            {
              widget: "number",
              path: "minHeight",
              label: "ADMIN_F_MIN",
              hint: "ADMIN_H_MIN_HEIGHT",
              min: 0.5,
              max: 1,
              step: 0.01,
              unit: "x",
            },
            {
              widget: "number",
              path: "maxHeight",
              label: "ADMIN_F_MAX",
              hint: "ADMIN_H_MAX_HEIGHT",
              min: 1,
              max: 1.5,
              step: 0.01,
              unit: "x",
            },
          ],
        },
        {
          icon: "user",
          title: "ADMIN_C_WIDTH",
          desc: "ADMIN_C_WIDTH_DESC",
          fields: [
            {
              widget: "switch",
              path: "widthOn",
              label: "ADMIN_F_WIDTH_ON",
              hint: "ADMIN_H_WIDTH_ON",
            },
            {
              widget: "number",
              path: "minWidth",
              label: "ADMIN_F_MIN",
              hint: "ADMIN_H_MIN_WIDTH",
              min: 0.5,
              max: 1,
              step: 0.01,
              unit: "x",
            },
            {
              widget: "number",
              path: "maxWidth",
              label: "ADMIN_F_MAX",
              hint: "ADMIN_H_MAX_WIDTH",
              min: 1,
              max: 1.5,
              step: 0.01,
              unit: "x",
            },
            {
              widget: "number",
              path: "drawDistance",
              label: "ADMIN_F_DISTANCE",
              hint: "ADMIN_H_DISTANCE",
              min: 20,
              max: 300,
              step: 10,
              unit: "m",
            },
          ],
        },
      ],
    },
    {
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
    },
    {
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
    },
  ],
};
