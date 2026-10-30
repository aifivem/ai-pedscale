import {
  aiLog,
  online,
  PlayerState,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { isRecord, num, str } from "@aicore-fivem/lib/shared";
import type { CharacterInfo } from "@aicore-fivem/shared";
import {
  PLAIN,
  SCALE_META,
  SCALE_STATE,
  toScale,
  type Scale,
  type Settings,
} from "common/scale";
import type { Panel } from "./panel";

const core = resourceExport("ai-core");
const scaleState = new PlayerState(SCALE_STATE, toScale);

/** The panel's "Change a size" form. */
interface Form {
  player: string;
  height: number;
  width: number;
}

const readForm = (raw: unknown): Form => {
  const v = isRecord(raw) ? raw : {};
  return {
    player: str(v.player, "", 64),
    height: num(v.height, 1, 0.5, 1.5),
    width: num(v.width, 1, 0.5, 1.5),
  };
};

/**
 * Every loaded character's size: the player state every client draws, the character metadata, the panel's live
 * list (`players`, a memory file keyed by citizen id) and the panel's form (`edit`).
 */
export class Sizes {
  private readonly citizen = new Map<number, string>();
  /** The form's player before the last panel edit: a new pick loads that player's size instead of applying. */
  private formPlayer = "";

  constructor(
    private readonly panel: Panel,
    private readonly settings: () => Settings,
  ) {
    panel.commit("edit", undefined, { player: "", height: 1, width: 1 });
    panel.onChange("edit", () => this.formEdited());
    panel.rule("edit", (_key, next) => this.checkForm(readForm(next)));
  }

  get(source: number): Scale {
    return scaleState.get(source) ?? PLAIN;
  }

  /** A character loaded (or was loaded when the script started): its saved size shows again. */
  load(source: number, character: CharacterInfo): void {
    this.citizen.set(source, character.citizenid);
    this.show(source, toScale(core.GetMeta(source, SCALE_META)) ?? PLAIN);
  }

  unload(source: number): void {
    scaleState.set(source, undefined);
    const citizenid = this.citizen.get(source);
    this.citizen.delete(source);
    if (citizenid) this.panel.commit("players", citizenid, null);
  }

  /** Sets and saves a size; `by` is who did it (0 = console), logged with the target. */
  set(by: number, source: number, scale: Scale): void {
    this.show(source, scale);
    const plain = scale.height === 1 && scale.width === 1;
    core.SetMeta(source, SCALE_META, plain ? null : scale);
    aiLog("sizes", "changed a character size", {
      source: by > 0 ? by : undefined,
      target: source,
      metadata: { ...scale },
    });
    const form = readForm(this.panel.get("edit"));
    if (
      form.player === this.citizen.get(source) &&
      (form.height !== scale.height || form.width !== scale.width)
    )
      this.panel.commit("edit", undefined, { ...form, ...scale });
  }

  /** Shows a scale to everyone (cleared at 1 x 1) and in the panel's list. */
  private show(source: number, scale: Scale): void {
    const plain = scale.height === 1 && scale.width === 1;
    scaleState.set(source, plain ? undefined : scale);
    const citizenid = this.citizen.get(source);
    const c = online.character(source);
    if (citizenid)
      this.panel.commit("players", citizenid, {
        id: source,
        name: c
          ? `${c.firstname} ${c.lastname}`
          : GetPlayerName(String(source)),
        height: scale.height,
        width: scale.width,
      });
  }

  private sourceOf(citizenid: string): number | null {
    return citizenid ? core.GetSourceByCitizenId(citizenid) : null;
  }

  /** Refusals of a form edit: a changed number must be allowed and inside the Size tab's limits. */
  private checkForm(form: Form): string | null {
    if (!form.player || form.player !== this.formPlayer) return null;
    const source = this.sourceOf(form.player);
    if (source === null) return "ERR_OFFLINE";
    const current = this.get(source);
    const s = this.settings();
    if (form.height !== current.height) {
      if (!s.heightOn) return "ERR_HEIGHT_OFF";
      if (form.height < s.minHeight || form.height > s.maxHeight)
        return "ADMIN_ERR_LIMITS";
    }
    if (form.width !== current.width) {
      if (!s.widthOn) return "ERR_WIDTH_OFF";
      if (form.width < s.minWidth || form.width > s.maxWidth)
        return "ADMIN_ERR_LIMITS";
    }
    return null;
  }

  /** An admin changed the form: a new player loads their size, a changed number applies it. */
  private formEdited(): void {
    const admin = this.panel.editor;
    if (admin === 0) return;
    const form = readForm(this.panel.get("edit"));
    const source = this.sourceOf(form.player);
    if (form.player !== this.formPlayer) {
      this.formPlayer = form.player;
      const scale = source === null ? PLAIN : this.get(source);
      // After this change has reached the panel, or the panel would show the edit over the loaded size.
      setImmediate(() =>
        this.panel.commit("edit", undefined, { ...form, ...scale }),
      );
      return;
    }
    if (source !== null)
      this.set(admin, source, { height: form.height, width: form.width });
  }
}
