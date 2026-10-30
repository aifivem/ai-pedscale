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
      },
      defaults: {
        heightOn: true,
        widthOn: false,
        minHeight: 0.85,
        maxHeight: 1.1,
        minWidth: 0.9,
        maxWidth: 1.15,
        drawDistance: 100,
      },
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
  ],
};
