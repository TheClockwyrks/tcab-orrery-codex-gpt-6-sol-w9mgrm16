import { ParticleCanvasPlayer } from "@clockwyrks/particle-runtime/canvas";
import type { ParticleSystem } from "@clockwyrks/particle-runtime";
import type {
  Game,
  InitApi,
  UpdateApi,
  RenderApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";

export type Screen = "title" | "howto" | "select" | "editor";

export type Mode = "campaign" | "extras";

export type MoteType =
  | "dust"
  | "nebula"
  | "comet"
  | "nova"
  | "meteor"
  | "mercury"
  | "saturn"
  | "jupiter"
  | "mars"
  | "venus"
  | "luna"
  | "sol"
  | "umbra"
  | "lumen"
  | "aether";

export type PartKind =
  | "arm"
  | "biarm"
  | "triarm"
  | "hexarm"
  | "piston"
  | "wheel"
  | "track"
  | "bind"
  | "manifold"
  | "triune"
  | "sunder"
  | "wane"
  | "mirror"
  | "ascend"
  | "conjoin"
  | "eclipse"
  | "confluence"
  | "dispersion"
  | "void"
  | "rise"
  | "set";

export type Instruction =
  | "grab"
  | "drop"
  | "rotate-cw"
  | "rotate-ccw"
  | "pivot-cw"
  | "pivot-ccw"
  | "extend"
  | "retract"
  | "advance"
  | "recede";

export type TapeCell = Instruction | null;

export type SimStatus = "running" | "paused" | "faulted" | "complete";

export type FaultKind =
  | "collision"
  | "torn"
  | "overextended"
  | "overretracted"
  | "unmounted"
  | "track-end"
  | "impossible";

export type Focus = "field" | "tape";

export interface Hex {
  readonly q: number;
  readonly r: number;
}

export interface PatternFilament {
  readonly a: Hex;
  readonly b: Hex;
  readonly weight: number;
}

export interface Molecule {
  readonly motes: readonly {
    readonly q: number;
    readonly r: number;
    readonly type: MoteType;
  }[];
  readonly filaments: readonly PatternFilament[];
  readonly repeat: {
    readonly vector: Hex;
    readonly link: PatternFilament;
  } | null;
}

export interface Challenge {
  readonly name: string;
  readonly reagents: readonly Molecule[];
  readonly products: readonly Molecule[];
  readonly permitted: readonly PartKind[];
  readonly target: number;
}

export interface PartState {
  readonly id: number;
  readonly kind: PartKind;
  readonly q: number;
  readonly r: number;
  readonly rotation: number;
  readonly length: number;
  readonly cells: readonly Hex[] | null;
  readonly closed: boolean | null;
  readonly index: number | null;
  readonly tape: readonly TapeCell[] | null;
}

export type DragState =
  | {
      readonly kind: "place";
      readonly part: PartKind;
      readonly index: number | null;
      readonly rotation: number;
      readonly length: number;
      readonly at: Hex | null;
      readonly before: readonly PartState[];
    }
  | {
      readonly kind: "move";
      readonly part: number;
      readonly from: Hex;
      readonly at: Hex | null;
      readonly rotation: number;
      readonly length: number;
      readonly before: readonly PartState[];
    }
  | {
      readonly kind: "lay";
      readonly part: number;
      readonly end: "first" | "last";
      readonly before: readonly PartState[];
    };

export interface EditorState {
  readonly parts: readonly PartState[];
  readonly nextId: number;
  readonly selected: number | null;
  readonly focus: Focus;
  readonly cursor: { readonly part: number; readonly col: number } | null;
  readonly drag: DragState | null;
  readonly undo: readonly (readonly PartState[])[];
  readonly redo: readonly (readonly PartState[])[];
}

export interface MoteState {
  readonly id: number;
  readonly q: number;
  readonly r: number;
  readonly type: MoteType;
  readonly wheel: number | null;
}

export interface SimFilament {
  readonly a: number;
  readonly b: number;
  readonly weight: number;
}

export interface Pose {
  readonly part: number;
  readonly rotation: number;
  readonly length: number;
  readonly cell: Hex;
}

export interface Grip {
  readonly part: number;
  readonly spoke: number;
  readonly mote: number;
}

export interface Metrics {
  readonly cost: number;
  readonly cycles: number;
  readonly area: number;
}

export interface SimState {
  readonly status: SimStatus;
  readonly cycle: number;
  readonly fraction: number;
  readonly speed: number;
  readonly motes: readonly MoteState[];
  readonly nextMoteId: number;
  readonly filaments: readonly SimFilament[];
  readonly poses: readonly Pose[];
  readonly grips: readonly Grip[];
  readonly tallies: readonly number[];
  readonly areaHexes: readonly Hex[];
  readonly fault: {
    readonly kind: FaultKind;
    readonly parts: readonly number[];
    readonly motes: readonly number[];
  } | null;
  readonly metrics: Metrics | null;
}

export interface PointerState {
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
}

export interface OrreryState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly selectIndex: number;
  readonly howtoPage: number;

  readonly unlockedCount: number;
  readonly campaignSolved: readonly number[];
  readonly extrasSolved: readonly number[];
  readonly campaignRecords: readonly (Metrics | null)[];
  readonly extrasRecords: readonly (Metrics | null)[];
  readonly campaignMachines: readonly (readonly PartState[] | null)[];
  readonly extrasMachines: readonly (readonly PartState[] | null)[];
  readonly campaignLast: number;
  readonly extrasLast: number;

  readonly challenge: Challenge | null;
  readonly challengeRef: { readonly mode: Mode; readonly index: number } | null;
  readonly editor: EditorState;
  readonly sim: SimState | null;

  readonly pointer: PointerState;
  readonly completion: boolean;
  readonly simTime: number;
  readonly muted: boolean;
}

import {
  ACTIONS,
  BINDINGS,
  APERTURE_FRAME_TIME,
  APERTURE_FRAMES,
  APERTURE_SHEETS,
  ARM_MAX_LEN,
  ARM_MIN_LEN,
  CONSTELLATION_TARGET,
  COLLISION_SAMPLES,
  MOTE_COLLIDE_R,
  NAME_MAX,
  TRAY_MAX,
  CUE_PATHS,
  CUES,
  DEFAULT_SPEED_INDEX,
  DIRS,
  FIELD_CX,
  FIELD_CY,
  FIELD_R,
  FILAMENT_SPRITE_PATHS,
  FILAMENT_SPRITE_H,
  FILAMENT_SPRITE_W,
  FIXTURE_MOUNT_PATH,
  GRIPPER_PATHS,
  GRIPPER_SPRITE_SIZE,
  HEADING_H,
  HEX_HIT_R,
  HEX_PITCH,
  HOWTO_PAGES,
  HUB_PATHS,
  HUB_SPRITE_SIZE,
  INSTRUCTION_GLYPH_PATHS,
  INSTRUCTION_GLYPH_SIZE,
  INSTRUCTIONS,
  MOTE_SPRITE_PATHS,
  MOTE_SPRITE_SIZE,
  MOTES,
  ORRERY_DEBUG_VERSION,
  PARTS,
  PART_COSTS,
  PARTICLE_PATHS,
  READOUT_X0,
  SIGIL_GLYPH_PATHS,
  SIGIL_GLYPH_SIZE,
  SOLVED_ITEMS,
  SOLVED_TITLE_TEXT,
  SPEEDS,
  STAGE_H,
  STAGE_W,
  TAGLINE_TEXT,
  TAPE_CELL_W,
  TAPE_COLS_VISIBLE,
  TAPE_LABEL_W,
  TAPE_ROW_H,
  TAPE_ROWS_VISIBLE,
  TAPE_X0,
  TAPE_Y0,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAY_REGION_W,
  TRAY_SLOT_H,
  TRAY_W,
  TRAY_X0,
  TRAY_Y0,
  WHEEL_HUB_PATH,
  WHEEL_MOTES,
  WHEEL_SPRITE_SIZE,
} from "./constants";
import { EXTRAS } from "./challenges";

export const BACKGROUND = "#0b1220";
const gold = "#d7b776";
const pale = "#e6e2d1";
const teal = "#8ed9df";
const dim = "#758393";
const sky = "#0b1220";
const armKinds: readonly PartKind[] = [
  "arm",
  "biarm",
  "triarm",
  "hexarm",
  "piston",
];
const mechanismKinds: readonly PartKind[] = [...armKinds, "wheel"];
const sigilKinds: readonly PartKind[] = PARTS.slice(7, 19);
const patterns: readonly MoteType[] = [
  "sol",
  "luna",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "aether",
  "lumen",
];
const campaignNames = [
  "A Single Orbit",
  "Moonrise",
  "The Copper Hour",
  "Red Meridian",
  "Gilded Passage",
  "Crown of Rings",
  "The Ether Loom",
  "Last Conjunction",
];
const campaignExtras: readonly (readonly PartKind[])[] = [
  [],
  ["bind"],
  ["wane", "mirror"],
  ["wheel", "triune", "sunder"],
  ["ascend", "conjoin", "eclipse", "piston"],
  ["manifold", "confluence", "dispersion", "void", "track"],
  ["biarm", "triarm", "hexarm", "wheel", "bind", "wane"],
  ["piston", "wheel", "track", "bind", "manifold", "triune", "sunder"],
];
export const CAMPAIGN: readonly Challenge[] = campaignNames.map((name, i) => ({
  name,
  reagents: [
    { motes: [{ q: 0, r: 0, type: patterns[i] }], filaments: [], repeat: null },
  ],
  products: [
    { motes: [{ q: 0, r: 0, type: patterns[i] }], filaments: [], repeat: null },
  ],
  permitted: [...new Set(["arm" as PartKind, ...campaignExtras[i]])].sort(
    (a, b) => PARTS.indexOf(a) - PARTS.indexOf(b),
  ),
  target: CONSTELLATION_TARGET,
}));
export interface SolutionPart {
  readonly kind: PartKind;
  readonly q: number;
  readonly r: number;
  readonly rotation: number;
  readonly length?: number;
  readonly cells?: readonly Hex[];
  readonly closed?: boolean;
  readonly index?: number;
  readonly tape?: readonly TapeCell[];
}
export interface Solution {
  readonly parts: readonly SolutionPart[];
}
const baseReference: Solution = {
  parts: [
    { kind: "rise", index: 0, q: 1, r: 0, rotation: 0 },
    { kind: "set", index: 0, q: 0, r: 1, rotation: 0 },
    {
      kind: "arm",
      q: 0,
      r: 0,
      rotation: 0,
      length: 1,
      tape: ["grab", "rotate-cw", "drop", "rotate-ccw"],
    },
  ],
};
function referenceFor(c: Challenge, index: number): Solution {
  const parts: PartState[] = baseReference.parts.map((p, i) => ({
    ...makePart(i + 1, p.kind, p.q, p.r, p.rotation, p.index ?? null),
    length: p.length ?? 1,
    tape: p.tape ?? null,
  }));
  const candidates: Hex[] = [];
  for (let r = -FIELD_R; r <= FIELD_R; r++)
    for (let q = -FIELD_R; q <= FIELD_R; q++) {
      const h = hex(q, r);
      if (
        onField(h) &&
        Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) >= 3
      )
        candidates.push(h);
    }
  candidates.sort(
    (a, b) =>
      Math.abs(b.q) +
        Math.abs(b.r) +
        Math.abs(b.q + b.r) -
        Math.abs(a.q) -
        Math.abs(a.r) -
        Math.abs(a.q + a.r) ||
      a.r - b.r ||
      a.q - b.q,
  );
  for (const kind of campaignExtras[index]) {
    let chosen: PartState | null = null;
    for (const h of candidates) {
      const p = makePart(parts.length + 1, kind, h.q, h.r, 0);
      try {
        validatePlacement(p, parts, c);
        chosen = p;
        break;
      } catch {
        /* seek another hex */
      }
    }
    if (!chosen)
      throw new Error(`no reference location for ${kind} in ${c.name}`);
    parts.push(chosen);
  }
  return {
    parts: parts.map((p) => ({
      kind: p.kind,
      q: p.q,
      r: p.r,
      rotation: p.rotation,
      ...(p.index !== null ? { index: p.index } : {}),
      ...(armKinds.includes(p.kind) ? { length: p.length } : {}),
      ...(p.tape ? { tape: p.tape } : {}),
      ...(p.kind === "track" ? { cells: p.cells ?? [], closed: false } : {}),
    })),
  };
}
const extrasReferences: readonly Solution[] = EXTRAS.map(() => baseReference);
const assetImages = new Map<string, ImageBitmap>();
const assetParticles = new Map<string, ParticleSystem>();
interface EffectInstance {
  name: string;
  x: number;
  y: number;
  age: number;
  player: ParticleCanvasPlayer | null;
}
let effects: EffectInstance[] = [];
const pointerCues = new Set<string>();
function raiseEffect(name: string, x: number, y: number): void {
  effects.push({ name, x, y, age: 0, player: null });
}
function drawEffects(ctx: CanvasRenderingContext2D, dt: number): void {
  const transform = ctx.getTransform(),
    cw = ctx.canvas.width,
    ch = ctx.canvas.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const e of effects) {
    const template = assetParticles.get(e.name);
    if (!template) continue;
    if (!e.player) {
      const system = structuredClone(template);
      system.field.width = cw;
      system.field.height = ch;
      system.emitters.forEach((em) => {
        em.position = [
          transform.e + transform.a * e.x,
          ch - (transform.f + transform.d * e.y),
          0,
        ];
      });
      e.player = new ParticleCanvasPlayer(system, ctx, {
        clear: false,
        pixelRadius: 2,
        composite: "lighter",
      });
    }
    e.player.update(dt);
    e.age += dt;
  }
  effects = effects.filter(
    (e) => e.age < (assetParticles.get(e.name)?.durationMs ?? 1000) / 1000,
  );
  ctx.restore();
}
const key = (h: Hex): string => `${h.q},${h.r}`;
const hex = (q: number, r: number): Hex => ({ q, r });
const add = (a: Hex, b: Hex): Hex => hex(a.q + b.q, a.r + b.r);
const sub = (a: Hex, b: Hex): Hex => hex(a.q - b.q, a.r - b.r);
const same = (a: Hex, b: Hex): boolean => a.q === b.q && a.r === b.r;
const onField = (h: Hex): boolean =>
  Math.max(Math.abs(h.q), Math.abs(h.r), Math.abs(h.q + h.r)) <= FIELD_R;
const adjacent = (a: Hex, b: Hex): boolean =>
  Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.q + a.r - b.q - b.r),
  ) === 1;
const xy = (h: Hex): { x: number; y: number } => ({
  x: FIELD_CX + HEX_PITCH * (h.q + h.r / 2),
  y: FIELD_CY + ((HEX_PITCH * Math.sqrt(3)) / 2) * h.r,
});
function rotate(h: Hex, steps: number): Hex {
  let v = h;
  for (let n = 0; n < ((steps % 6) + 6) % 6; n++) v = hex(-v.r, v.q + v.r);
  return v;
}
function nearest(x: number, y: number): Hex | null {
  let best: Hex | null = null,
    d = HEX_HIT_R ** 2;
  for (let r = -FIELD_R; r <= FIELD_R; r++)
    for (let q = -FIELD_R; q <= FIELD_R; q++) {
      const h = hex(q, r);
      if (!onField(h)) continue;
      const p = xy(h),
        v = (x - p.x) ** 2 + (y - p.y) ** 2;
      if (v < d - 1e-8) {
        d = v;
        best = h;
      }
    }
  return best;
}
function emptyEditor(): EditorState {
  return {
    parts: [],
    nextId: 1,
    selected: null,
    focus: "field",
    cursor: null,
    drag: null,
    undo: [],
    redo: [],
  };
}
function initial(): OrreryState {
  return {
    screen: "title",
    mode: "campaign",
    menuIndex: 0,
    titleIndex: 0,
    selectIndex: 0,
    howtoPage: 0,
    unlockedCount: 1,
    campaignSolved: [],
    extrasSolved: [],
    campaignRecords: CAMPAIGN.map(() => null),
    extrasRecords: EXTRAS.map(() => null),
    campaignMachines: CAMPAIGN.map(() => null),
    extrasMachines: EXTRAS.map(() => null),
    campaignLast: 0,
    extrasLast: 0,
    challenge: null,
    challengeRef: null,
    editor: emptyEditor(),
    sim: null,
    pointer: { x: 0, y: 0, down: false },
    completion: true,
    simTime: 0,
    muted: false,
  };
}
function course(mode: Mode): readonly Challenge[] {
  insist(mode === "campaign" || mode === "extras", "invalid mode");
  return mode === "campaign" ? CAMPAIGN : EXTRAS;
}
function insist(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function validIndex(n: number, max: number): void {
  insist(
    Number.isInteger(n) && n >= 0 && n < max,
    `index must be 0..${max - 1}`,
  );
}
function partById(s: DeepReadonly<OrreryState>, id: number): PartState {
  const p = s.editor.parts.find((p) => p.id === id);
  insist(p, `part ${id} does not exist`);
  return p as PartState;
}
function needsChallenge(s: DeepReadonly<OrreryState>): Challenge {
  insist(s.challenge, "no challenge open");
  return s.challenge as Challenge;
}
function needsSim(s: DeepReadonly<OrreryState>): SimState {
  insist(s.sim, "no live run");
  return s.sim as SimState;
}
function footprint(p: PartState, c: Challenge): Hex[] {
  if (p.kind === "track") return [...(p.cells ?? [])];
  if (mechanismKinds.includes(p.kind)) return [hex(p.q, p.r)];
  let offsets: Hex[] = [hex(0, 0)];
  if (["bind", "triune", "sunder", "mirror", "ascend"].includes(p.kind))
    offsets.push(hex(1, 0));
  if (["conjoin", "eclipse"].includes(p.kind))
    offsets.push(hex(1, 0), hex(0, 1));
  if (p.kind === "eclipse") offsets.push(hex(1, -1));
  if (p.kind === "manifold") offsets.push(hex(1, 0), hex(-1, 1), hex(0, -1));
  if (["confluence", "dispersion"].includes(p.kind))
    offsets.push(hex(1, 0), hex(0, 1), hex(-1, 0), hex(0, -1));
  if (p.kind === "void") offsets.push(...DIRS.map((d) => hex(d[0], d[1])));
  if (p.kind === "rise" || p.kind === "set") {
    const pat = (p.kind === "rise" ? c.reagents : c.products)[p.index ?? 0];
    insist(pat, "aperture index invalid");
    offsets = pat.motes.map((m) => hex(m.q, m.r));
    if (p.kind === "set" && pat.repeat)
      offsets.push(
        ...pat.motes.map((m) => add(hex(m.q, m.r), pat.repeat!.vector)),
      );
  }
  return offsets.map((o) => add(hex(p.q, p.r), rotate(o, p.rotation)));
}
function validatePlacement(
  p: PartState,
  parts: readonly PartState[],
  c: Challenge,
): void {
  const own = footprint(p, c);
  insist(own.every(onField), "placement rule 1: outside field");
  for (const other of parts) {
    if (other.id === p.id) continue;
    const both = own.some((h) => footprint(other, c).some((v) => same(h, v)));
    if (p.kind === "track" && other.kind === "track")
      insist(!both, "placement rule 3: tracks overlap");
    if (
      (p.kind === "track" && !mechanismKinds.includes(other.kind)) ||
      (other.kind === "track" && !mechanismKinds.includes(p.kind)) ||
      (!mechanismKinds.includes(p.kind) &&
        p.kind !== "track" &&
        !mechanismKinds.includes(other.kind) &&
        other.kind !== "track")
    )
      insist(!both, "placement rule 2: footprints overlap");
    if (
      mechanismKinds.includes(p.kind) &&
      mechanismKinds.includes(other.kind)
    ) {
      insist(
        !same(hex(p.q, p.r), hex(other.q, other.r)),
        "placement rule 4: shared anchor",
      );
      if (p.kind === "wheel" && other.kind === "wheel")
        insist(
          Math.max(
            Math.abs(p.q - other.q),
            Math.abs(p.r - other.r),
            Math.abs(p.q + p.r - other.q - other.r),
          ) > 2,
          "placement rule 4: wheel rings meet",
        );
    }
    if (p.kind === "rise" || p.kind === "set")
      insist(
        !(other.kind === p.kind && other.index === p.index),
        "placement rule 5: duplicate aperture",
      );
  }
  if (p.kind === "track") {
    const cells = p.cells ?? [];
    insist(
      cells.length >= 1 &&
        same(hex(p.q, p.r), cells[0]) &&
        new Set(cells.map(key)).size === cells.length &&
        cells.every((v, i) => i === 0 || adjacent(v, cells[i - 1])),
      "placement rule 6: invalid track",
    );
    if (p.closed)
      insist(
        cells.length >= 3 && adjacent(cells[0], cells[cells.length - 1]),
        "placement rule 6: open loop",
      );
  }
}
function makePart(
  id: number,
  kind: PartKind,
  q: number,
  r: number,
  rotation: number,
  index: number | null = null,
): PartState {
  return {
    id,
    kind,
    q,
    r,
    rotation,
    length: 1,
    cells: kind === "track" ? [hex(q, r)] : null,
    closed: kind === "track" ? false : null,
    index,
    tape: mechanismKinds.includes(kind) ? [] : null,
  };
}
function withParts(
  s: DeepReadonly<OrreryState>,
  parts: readonly PartState[],
  history = false,
): OrreryState {
  const e = s.editor;
  let sim = s.sim as SimState | null;
  if (sim) {
    const removed = e.parts
      .filter((old) => !parts.some((p) => p.id === old.id))
      .map((p) => p.id);
    const added = parts.filter((p) => !e.parts.some((old) => old.id === p.id));
    const removedMotes = sim.motes
      .filter((m) => m.wheel !== null && removed.includes(m.wheel))
      .map((m) => m.id);
    let motes = sim.motes.filter((m) => !removedMotes.includes(m.id)),
      nextMoteId = sim.nextMoteId;
    for (const p of added.filter((p) => p.kind === "wheel"))
      for (let i = 0; i < 6; i++) {
        const d = DIRS[i];
        motes = [
          ...motes,
          {
            id: nextMoteId++,
            q: p.q + d[0],
            r: p.r + d[1],
            type: WHEEL_MOTES[(i - p.rotation + 6) % 6],
            wheel: p.id,
          },
        ];
      }
    sim = {
      ...sim,
      motes,
      nextMoteId,
      poses: [
        ...sim.poses.filter((v) => !removed.includes(v.part)),
        ...added
          .filter((p) => mechanismKinds.includes(p.kind))
          .map((p) => ({
            part: p.id,
            rotation: p.rotation,
            length: p.length,
            cell: hex(p.q, p.r),
          })),
      ],
      grips: sim.grips.filter(
        (g) => !removed.includes(g.part) && !removedMotes.includes(g.mote),
      ),
      filaments: sim.filaments.filter(
        (f) => !removedMotes.includes(f.a) && !removedMotes.includes(f.b),
      ),
    };
  }
  return {
    ...s,
    sim,
    editor: {
      ...e,
      parts,
      undo: history ? [...e.undo, e.parts as PartState[]] : e.undo,
      redo: history ? [] : e.redo,
      selected: parts.some((p) => p.id === e.selected) ? e.selected : null,
      cursor: parts.some((p) => p.id === e.cursor?.part) ? e.cursor : null,
    },
  } as OrreryState;
}
function replacePart(
  s: DeepReadonly<OrreryState>,
  id: number,
  change: (p: PartState) => PartState,
  history = false,
): OrreryState {
  const p = partById(s, id),
    next = change(p);
  validatePlacement(next, s.editor.parts as PartState[], needsChallenge(s));
  return withParts(
    s,
    s.editor.parts.map((v) => (v.id === id ? next : v)) as PartState[],
    history,
  );
}
function place(
  s: DeepReadonly<OrreryState>,
  kind: PartKind,
  q: number,
  r: number,
  rotation: number,
  index: number | null = null,
  history = false,
): OrreryState {
  const c = needsChallenge(s);
  insist(PARTS.includes(kind), `invalid kind ${kind}`);
  insist(
    Number.isInteger(q) &&
      Number.isInteger(r) &&
      Number.isInteger(rotation) &&
      rotation >= 0 &&
      rotation < 6,
    "invalid part pose",
  );
  const p = makePart(s.editor.nextId, kind, q, r, rotation, index);
  validatePlacement(p, s.editor.parts as PartState[], c);
  const next = withParts(s, [...s.editor.parts, p] as PartState[], history);
  return {
    ...next,
    editor: {
      ...next.editor,
      nextId: p.id + 1,
      selected: p.id,
      cursor: p.tape ? { part: p.id, col: 0 } : next.editor.cursor,
    },
  };
}
function tray(c: Challenge): { kind: PartKind; index: number | null }[] {
  return [
    ...PARTS.filter((p) => c.permitted.includes(p)),
    ...c.reagents.map((_, index) => ({ kind: "rise" as PartKind, index })),
    ...c.products.map((_, index) => ({ kind: "set" as PartKind, index })),
  ].map((v) => (typeof v === "string" ? { kind: v, index: null } : v));
}
function cost(parts: readonly PartState[]): number {
  return parts.reduce(
    (n, p) =>
      n +
      PART_COSTS[p.kind] * (p.kind === "track" ? (p.cells?.length ?? 1) : 1),
    0,
  );
}
function period(parts: readonly PartState[]): number {
  return Math.max(1, ...parts.map((p) => p.tape?.length ?? 0));
}
function validateChallenge(c: Challenge): void {
  insist(
    c &&
      typeof c.name === "string" &&
      c.name.length >= 1 &&
      c.name.length <= NAME_MAX,
    "invalid challenge name",
  );
  insist(
    Array.isArray(c.reagents) &&
      c.reagents.length > 0 &&
      Array.isArray(c.products) &&
      c.products.length > 0,
    "invalid challenge patterns",
  );
  insist(
    Array.isArray(c.permitted) &&
      c.permitted.length > 0 &&
      c.permitted.length + c.reagents.length + c.products.length <= TRAY_MAX &&
      new Set(c.permitted).size === c.permitted.length &&
      c.permitted.every((p) => PARTS.slice(0, 19).includes(p)),
    "invalid permitted parts or tray size",
  );
  insist(
    Number.isInteger(c.target) && c.target >= 1,
    "invalid challenge target",
  );
  for (const pattern of [...c.reagents, ...c.products]) {
    insist(
      pattern &&
        Array.isArray(pattern.motes) &&
        pattern.motes.length > 0 &&
        Array.isArray(pattern.filaments),
      "invalid molecule",
    );
    const motes: Molecule["motes"] = pattern.motes;
    insist(
      motes.every(
        (m) =>
          Number.isInteger(m.q) &&
          Number.isInteger(m.r) &&
          MOTES.includes(m.type),
      ) && new Set(motes.map(key)).size === motes.length,
      "invalid mote coordinate or type",
    );
    const edges = new Set<string>();
    for (const f of pattern.filaments) {
      const a = motes.find((m) => same(m, f.a)),
        b = motes.find((m) => same(m, f.b));
      const e = [key(f.a), key(f.b)].sort().join("|");
      insist(
        a &&
          b &&
          adjacent(a, b) &&
          (f.weight === 1 || f.weight === 3) &&
          !edges.has(e),
        "invalid filament",
      );
      edges.add(e);
    }
    const reached = new Set([key(motes[0])]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of pattern.filaments) {
        const ka = key(f.a),
          kb = key(f.b);
        if (reached.has(ka) && !reached.has(kb)) {
          reached.add(kb);
          changed = true;
        }
        if (reached.has(kb) && !reached.has(ka)) {
          reached.add(ka);
          changed = true;
        }
      }
    }
    insist(reached.size === motes.length, "disconnected molecule");
    if (pattern.repeat) {
      const { vector, link } = pattern.repeat;
      insist(
        Number.isInteger(vector.q) &&
          Number.isInteger(vector.r) &&
          (vector.q !== 0 || vector.r !== 0),
        "invalid repeat vector",
      );
      insist(
        motes.some((m) => same(m, link.a)) &&
          motes.some((m) => same(m, sub(link.b, vector))) &&
          adjacent(link.a, link.b) &&
          (link.weight === 1 || link.weight === 3),
        "invalid repeat link",
      );
      insist(
        motes.every(
          (m) => !motes.some((n) => same(hex(m.q, m.r), add(n, vector))),
        ),
        "overlapping repeat copies",
      );
    }
    const offsets = [
      ...motes.map((m) => hex(m.q, m.r)),
      ...(pattern.repeat
        ? motes.map((m) => add(m, pattern.repeat!.vector))
        : []),
    ];
    insist(
      Array.from({ length: 11 }, (_, r) => r - 5).some((r) =>
        Array.from({ length: 11 }, (_, q) => q - 5).some((q) =>
          offsets.every((h) => onField(add(hex(q, r), h))),
        ),
      ),
      "pattern cannot fit field",
    );
  }
}
function open(
  s: DeepReadonly<OrreryState>,
  mode: Mode,
  index: number,
  custom?: Challenge,
): OrreryState {
  const list = course(mode);
  if (!custom) validIndex(index, list.length);
  const c = custom ?? list[index];
  const stash = custom
    ? null
    : (mode === "campaign" ? s.campaignMachines : s.extrasMachines)[index];
  const parts = stash ?? [];
  return {
    ...s,
    screen: "editor",
    mode,
    challenge: c,
    challengeRef: custom ? null : { mode, index },
    editor: {
      ...emptyEditor(),
      parts: parts as PartState[],
      nextId: Math.max(1, ...parts.map((p) => p.id + 1)),
    },
    sim: null,
    menuIndex: 0,
    selectIndex: index,
    campaignLast: mode === "campaign" && !custom ? index : s.campaignLast,
    extrasLast: mode === "extras" && !custom ? index : s.extrasLast,
  } as OrreryState;
}
function leave(s: DeepReadonly<OrreryState>, screen: Screen): OrreryState {
  let next: OrreryState = { ...s, sim: null } as OrreryState;
  if (s.screen === "editor" && s.challengeRef) {
    const { mode, index } = s.challengeRef;
    const field = mode === "campaign" ? "campaignMachines" : "extrasMachines";
    const arr = [...s[field]];
    arr[index] = s.editor.parts as PartState[];
    next = { ...next, [field]: arr } as OrreryState;
  }
  if (s.screen === "editor")
    next = {
      ...next,
      challenge: null,
      challengeRef: null,
      editor: emptyEditor(),
    };
  return {
    ...next,
    screen,
    menuIndex: screen === "title" ? next.titleIndex : 0,
    selectIndex:
      screen === "select"
        ? next.mode === "campaign"
          ? next.campaignLast
          : next.extrasLast
        : next.selectIndex,
    howtoPage: screen === "howto" ? 0 : next.howtoPage,
  };
}
function spokeDirections(p: PartState, pose?: Pose): number[] {
  const rot = pose?.rotation ?? p.rotation,
    offsets =
      p.kind === "biarm"
        ? [0, 3]
        : p.kind === "triarm"
          ? [0, 2, 4]
          : p.kind === "hexarm"
            ? [0, 1, 2, 3, 4, 5]
            : [0];
  return offsets.map((n) => (rot + n) % 6);
}
function cellsOf(p: PartState, pose?: Pose): Hex[] {
  const origin = pose?.cell ?? hex(p.q, p.r),
    len = pose?.length ?? p.length;
  return spokeDirections(p, pose).map((i) => {
    const d = DIRS[i];
    return hex(origin.q + d[0] * len, origin.r + d[1] * len);
  });
}
function fixtureMotes(parts: readonly PartState[]): MoteState[] {
  let id = 1;
  return parts
    .filter((p) => p.kind === "wheel")
    .flatMap((p) =>
      DIRS.map((d, k) => ({
        id: id++,
        q: p.q + d[0],
        r: p.r + d[1],
        type: WHEEL_MOTES[(k - p.rotation + 6) % 6],
        wheel: p.id,
      })),
    );
}
function areaOf(
  parts: readonly PartState[],
  c: Challenge,
  motes: readonly MoteState[],
  poses: readonly Pose[],
): Hex[] {
  const bank = new Map<string, Hex>();
  for (const p of parts) for (const h of footprint(p, c)) bank.set(key(h), h);
  for (const m of motes) bank.set(key(m), hex(m.q, m.r));
  for (const p of parts)
    if (armKinds.includes(p.kind)) {
      const pose = poses.find((v) => v.part === p.id);
      for (const h of cellsOf(p, pose)) bank.set(key(h), h);
    }
  return [...bank.values()];
}
function start(s: DeepReadonly<OrreryState>): OrreryState {
  const c = needsChallenge(s),
    parts = s.editor.parts as PartState[];
  const poses = parts
    .filter((p) => mechanismKinds.includes(p.kind))
    .map((p) => ({
      part: p.id,
      rotation: p.rotation,
      length: p.length,
      cell: hex(p.q, p.r),
    }));
  const fixtures = fixtureMotes(parts);
  let sim: SimState = {
    status: "running",
    cycle: 0,
    fraction: 0,
    speed: DEFAULT_SPEED_INDEX,
    motes: fixtures,
    nextMoteId: fixtures.length + 1,
    filaments: [],
    poses,
    grips: [],
    tallies: c.products.map(() => 0),
    areaHexes: areaOf(parts, c, fixtures, poses),
    fault: null,
    metrics: null,
  };
  sim = boundary(s, sim, true);
  return { ...s, sim };
}
function group(sim: SimState, id: number): number[] {
  const seen = new Set([id]),
    todo = [id];
  while (todo.length) {
    const v = todo.pop()!;
    for (const f of sim.filaments) {
      const other = f.a === v ? f.b : f.b === v ? f.a : null;
      if (other !== null && !seen.has(other)) {
        seen.add(other);
        todo.push(other);
      }
    }
  }
  return [...seen];
}
function at(sim: SimState, h: Hex): MoteState | undefined {
  return sim.motes.find((m) => m.q === h.q && m.r === h.r);
}
function boundary(
  s: DeepReadonly<OrreryState>,
  sim: SimState,
  settle = false,
): SimState {
  const c = needsChallenge(s),
    parts = s.editor.parts as PartState[];
  let motes = [...sim.motes],
    filaments = [...sim.filaments],
    nextMoteId = sim.nextMoteId;
  const tallies = [...sim.tallies];
  const get = (h: Hex) => motes.find((m) => same(m, h));
  const held = (id: number) =>
    sim.grips.some((g) => group({ ...sim, filaments }, g.mote).includes(id));
  const addM = (h: Hex, type: MoteType) => {
    motes.push({ id: nextMoteId++, q: h.q, r: h.r, type, wheel: null });
  };
  const remove = (ids: number[]) => {
    motes = motes.filter((m) => !ids.includes(m.id));
    filaments = filaments.filter(
      (f) => !ids.includes(f.a) && !ids.includes(f.b),
    );
  };
  const loose = (m: MoteState | undefined): m is MoteState =>
    !!m &&
    m.wheel === null &&
    !held(m.id) &&
    !filaments.some((f) => f.a === m.id || f.b === m.id);
  const ordered = parts
    .filter((p) => sigilKinds.includes(p.kind))
    .sort((a, b) => a.r - b.r || a.q - b.q);
  const waves = [
    ordered.filter((p) =>
      [
        "wane",
        "mirror",
        "ascend",
        "conjoin",
        "eclipse",
        "confluence",
        "dispersion",
      ].includes(p.kind),
    ),
    ordered.filter((p) => ["bind", "manifold", "triune"].includes(p.kind)),
    ordered.filter((p) => p.kind === "sunder"),
    ordered.filter((p) => p.kind === "void"),
  ];
  for (const wave of waves)
    for (const p of wave) {
      const h = footprint(p, c),
        m = h.map(get),
        a = m[0],
        b = m[1];
      if (
        p.kind === "wane" &&
        a &&
        ["nebula", "comet", "nova", "meteor"].includes(a.type)
      )
        motes = motes.map((v) => (v.id === a.id ? { ...v, type: "dust" } : v));
      if (
        p.kind === "mirror" &&
        a &&
        b &&
        ["nebula", "comet", "nova", "meteor"].includes(a.type) &&
        b.type === "dust"
      )
        motes = motes.map((v) => (v.id === b.id ? { ...v, type: a.type } : v));
      if (
        p.kind === "ascend" &&
        a &&
        b &&
        a.type === "mercury" &&
        !held(a.id) &&
        !filaments.some((f) => f.a === a.id || f.b === a.id)
      ) {
        const ladder = [
            "saturn",
            "jupiter",
            "mars",
            "venus",
            "luna",
            "sol",
          ] as MoteType[],
          i = ladder.indexOf(b.type);
        if (i >= 0 && i < 5) {
          remove([a.id]);
          motes = motes.map((v) =>
            v.id === b.id ? { ...v, type: ladder[i + 1] } : v,
          );
        }
      }
      if (
        p.kind === "conjoin" &&
        loose(a) &&
        loose(b) &&
        a.type === b.type &&
        !m[2]
      ) {
        const ladder: MoteType[] = [
          "saturn",
          "jupiter",
          "mars",
          "venus",
          "luna",
          "sol",
        ];
        const i = ladder.indexOf(a.type);
        if (i >= 0 && i < 5) {
          remove([a.id, b.id]);
          addM(h[2], ladder[i + 1]);
        }
      }
      if (
        p.kind === "eclipse" &&
        loose(a) &&
        loose(b) &&
        a.type === "dust" &&
        b.type === "dust" &&
        !m[2] &&
        !m[3]
      ) {
        remove([a.id, b.id]);
        addM(h[2], "umbra");
        addM(h[3], "lumen");
      }
      if (
        p.kind === "confluence" &&
        !a &&
        m.slice(1).every(loose) &&
        ["nebula", "comet", "nova", "meteor"].every((t) =>
          m.slice(1).some((v) => v?.type === t),
        )
      ) {
        remove(m.slice(1).map((v) => v!.id));
        addM(h[0], "aether");
      }
      if (
        p.kind === "dispersion" &&
        loose(a) &&
        a.type === "aether" &&
        m.slice(1).every((v) => !v)
      ) {
        remove([a.id]);
        (["nebula", "comet", "nova", "meteor"] as MoteType[]).forEach((t, i) =>
          addM(h[i + 1], t),
        );
      }
      if (
        p.kind === "void" &&
        a &&
        !held(a.id) &&
        a.wheel === null &&
        !filaments.some((f) => f.a === a.id || f.b === a.id)
      )
        remove([a.id]);
      if (["bind", "triune", "manifold"].includes(p.kind) && a) {
        for (const other of p.kind === "manifold" ? m.slice(1) : [b])
          if (
            other &&
            (p.kind !== "triune" ||
              (a.type === "nova" && other.type === "nova")) &&
            !filaments.some(
              (f) =>
                (f.a === a.id && f.b === other.id) ||
                (f.b === a.id && f.a === other.id),
            )
          )
            filaments.push({
              a: a.id,
              b: other.id,
              weight: p.kind === "triune" ? 3 : 1,
            });
      }
      if (p.kind === "sunder" && a && b)
        filaments = filaments.filter(
          (f) =>
            !((f.a === a.id && f.b === b.id) || (f.a === b.id && f.b === a.id)),
        );
    }
  for (const p of parts
    .filter((v) => v.kind === "set")
    .sort((a, b) => a.r - b.r || a.q - b.q)) {
    const pattern = c.products[p.index ?? 0],
      base = hex(p.q, p.r),
      vector = pattern.repeat
        ? rotate(pattern.repeat.vector, p.rotation)
        : null;
    const first = get(add(base, rotate(pattern.motes[0], p.rotation)));
    if (!first) continue;
    const constellation = group({ ...sim, filaments }, first.id);
    const copies = vector ? constellation.length / pattern.motes.length : 1;
    if (!Number.isInteger(copies) || (vector && copies < 2)) continue;
    const matched: MoteState[] = [];
    let okay = true;
    for (let i = 0; i < copies; i++)
      for (const pm of pattern.motes) {
        const offset = rotate(hex(pm.q, pm.r), p.rotation),
          h = add(
            base,
            add(offset, hex((vector?.q ?? 0) * i, (vector?.r ?? 0) * i)),
          ),
          found = get(h);
        if (!found || found.type !== pm.type) {
          okay = false;
          break;
        }
        matched.push(found);
      }
    if (
      !okay ||
      matched.length !== copies * pattern.motes.length ||
      matched.some((m) => held(m.id))
    )
      continue;
    const ids = matched.map((m) => m.id),
      expected: string[] = [];
    const idAt = (i: number, h: Hex): number => {
      const world = add(
        base,
        add(
          rotate(h, p.rotation),
          hex((vector?.q ?? 0) * i, (vector?.r ?? 0) * i),
        ),
      );
      return get(world)!.id;
    };
    const edge = (a: number, b: number, w: number): string =>
      `${Math.min(a, b)},${Math.max(a, b)},${w}`;
    for (let i = 0; i < copies; i++)
      for (const f of pattern.filaments)
        expected.push(edge(idAt(i, f.a), idAt(i, f.b), f.weight));
    if (pattern.repeat)
      for (let i = 0; i < copies - 1; i++)
        expected.push(
          edge(
            idAt(i, pattern.repeat.link.a),
            idAt(i + 1, sub(pattern.repeat.link.b, pattern.repeat.vector)),
            pattern.repeat.link.weight,
          ),
        );
    const actual = filaments
      .filter((f) => ids.includes(f.a) && ids.includes(f.b))
      .map((f) => edge(f.a, f.b, f.weight));
    if (
      expected.sort().join("|") !== actual.sort().join("|") ||
      ids
        .slice()
        .sort((a, b) => a - b)
        .join(",") !==
        constellation
          .slice()
          .sort((a, b) => a - b)
          .join(",")
    )
      continue;
    remove(ids);
    tallies[p.index ?? 0] += copies;
  }
  for (const p of parts
    .filter((v) => v.kind === "rise")
    .sort((a, b) => a.r - b.r || a.q - b.q)) {
    const pattern = c.reagents[p.index ?? 0],
      positions = pattern.motes.map((m) =>
        add(hex(p.q, p.r), rotate(hex(m.q, m.r), p.rotation)),
      );
    if (positions.every((h) => !get(h))) {
      const ids: number[] = [];
      for (let i = 0; i < positions.length; i++) {
        ids.push(nextMoteId);
        addM(positions[i], pattern.motes[i].type);
      }
      for (const f of pattern.filaments) {
        const ia = pattern.motes.findIndex((m) => same(m, f.a)),
          ib = pattern.motes.findIndex((m) => same(m, f.b));
        filaments.push({ a: ids[ia], b: ids[ib], weight: f.weight });
      }
    }
  }
  const area = new Map(sim.areaHexes.map((h) => [key(h), h]));
  for (const m of motes) area.set(key(m), hex(m.q, m.r));
  for (const p of parts.filter((v) => armKinds.includes(v.kind))) {
    const pose = sim.poses.find((v) => v.part === p.id);
    for (const h of cellsOf(p, pose)) area.set(key(h), h);
  }
  let next: SimState = {
    ...sim,
    motes,
    filaments,
    nextMoteId,
    tallies,
    areaHexes: [...area.values()],
  };
  if (
    !settle &&
    s.completion &&
    parts.some((p) => p.kind === "set") &&
    tallies.every((v) => v >= c.target)
  )
    next = {
      ...next,
      status: "complete",
      fraction: 0,
      metrics: { cost: cost(parts), cycles: sim.cycle + 1, area: area.size },
    };
  return next;
}
function motion(s: DeepReadonly<OrreryState>, sim: SimState): SimState {
  const parts = s.editor.parts as PartState[],
    P = period(parts);
  let motes = [...sim.motes],
    poses = [...sim.poses],
    grips = [...sim.grips];
  const ins = new Map<number, TapeCell>(
    parts
      .filter((p) => p.tape)
      .map((p) => [p.id, p.tape![sim.cycle % P] ?? null]),
  );
  for (const p of parts.filter((v) => v.tape)) {
    const op = ins.get(p.id);
    if (!op) continue;
    const pose = poses.find((v) => v.part === p.id)!;
    let fault: FaultKind | null = null;
    if (
      p.kind === "wheel" &&
      !(["rotate-cw", "rotate-ccw"] as TapeCell[]).includes(op)
    )
      fault = "impossible";
    else if ((op === "extend" || op === "retract") && p.kind !== "piston")
      fault = "impossible";
    else if (op === "extend" && pose.length === ARM_MAX_LEN)
      fault = "overextended";
    else if (op === "retract" && pose.length === ARM_MIN_LEN)
      fault = "overretracted";
    else if (op === "advance" || op === "recede") {
      const track = parts.find(
        (v) => v.kind === "track" && v.cells?.some((h) => same(h, pose.cell)),
      );
      if (!track) fault = "unmounted";
      else {
        const at = track.cells!.findIndex((h) => same(h, pose.cell)),
          j = at + (op === "advance" ? 1 : -1);
        if (!track.closed && (j < 0 || j >= track.cells!.length))
          fault = "track-end";
      }
    }
    if (fault)
      return {
        ...sim,
        status: "faulted",
        fault: { kind: fault, parts: [p.id], motes: [] },
        fraction: 0,
      };
  }
  for (const p of parts.filter((v) => v.tape)) {
    const op = ins.get(p.id),
      pose = poses.find((v) => v.part === p.id)!;
    if (op === "drop") grips = grips.filter((g) => g.part !== p.id);
    if (op === "grab")
      for (const [spoke, h] of cellsOf(p, pose).entries()) {
        const m = motes.find((v) => same(v, h) && v.wheel === null);
        if (
          m &&
          !grips.some(
            (g) =>
              g.part === p.id && g.spoke === spokeDirections(p, pose)[spoke],
          )
        )
          grips.push({
            part: p.id,
            spoke: spokeDirections(p, pose)[spoke],
            mote: m.id,
          });
      }
  }
  // A constellation can have several holders only when every holder gives it
  // the same rigid motion. Check this before the first collision sample.
  const seenGroups = new Set<string>();
  for (const grip of grips) {
    const ids = group({ ...sim, grips }, grip.mote).sort((a, b) => a - b),
      groupKey = ids.join(",");
    if (seenGroups.has(groupKey)) continue;
    seenGroups.add(groupKey);
    const holders = grips.filter((g) => ids.includes(g.mote));
    const signatures = holders.map((g) => {
      const p = parts.find((p) => p.id === g.part)!,
        pose = poses.find((v) => v.part === p.id)!,
        op = ins.get(p.id);
      if (op === "rotate-cw" || op === "rotate-ccw")
        return `R:${key(pose.cell)}:${op}`;
      if (op === "pivot-cw" || op === "pivot-ccw")
        return `R:${key(cellsOf(p, pose)[spokeDirections(p, pose).indexOf(g.spoke)])}:${op}`;
      if (op === "extend" || op === "retract") {
        const d = DIRS[pose.rotation],
          sign = op === "extend" ? 1 : -1;
        return `T:${d[0] * sign},${d[1] * sign}`;
      }
      if (op === "advance" || op === "recede") {
        const track = parts.find(
            (v) =>
              v.kind === "track" && v.cells?.some((h) => same(h, pose.cell)),
          )!,
          i = track.cells!.findIndex((h) => same(h, pose.cell)),
          j =
            (i + (op === "advance" ? 1 : -1) + track.cells!.length) %
            track.cells!.length,
          d = sub(track.cells![j], pose.cell);
        return `T:${d.q},${d.r}`;
      }
      return "none";
    });
    if (signatures.some((v) => v !== signatures[0]))
      return {
        ...sim,
        status: "faulted",
        fraction: 0,
        grips,
        fault: {
          kind: "torn",
          parts: parts
            .filter((p) => holders.some((g) => g.part === p.id))
            .map((p) => p.id),
          motes: ids,
        },
      };
  }
  const originalPoses = poses;
  const moved = new Map<number, { q: number; r: number }>();
  for (const p of parts.filter((v) => v.tape)) {
    const op = ins.get(p.id),
      old = originalPoses.find((v) => v.part === p.id)!;
    let newer: Pose = old;
    if (op === "rotate-cw" || op === "rotate-ccw")
      newer = {
        ...old,
        rotation: (old.rotation + (op === "rotate-cw" ? 1 : 5)) % 6,
      };
    if (op === "extend" || op === "retract")
      newer = { ...old, length: old.length + (op === "extend" ? 1 : -1) };
    if (op === "advance" || op === "recede") {
      const track = parts.find(
        (v) => v.kind === "track" && v.cells?.some((h) => same(h, old.cell)),
      )!;
      const at = track.cells!.findIndex((h) => same(h, old.cell)),
        j =
          (at + (op === "advance" ? 1 : -1) + track.cells!.length) %
          track.cells!.length;
      newer = { ...old, cell: track.cells![j] };
    }
    poses = poses.map((v) => (v.part === p.id ? newer : v));
    if (newer !== old || op === "pivot-cw" || op === "pivot-ccw") {
      let ids: number[] = [];
      for (const g of grips.filter((v) => v.part === p.id))
        ids.push(...group({ ...sim, grips }, g.mote));
      if (p.kind === "wheel")
        ids.push(...motes.filter((m) => m.wheel === p.id).map((m) => m.id));
      ids = [...new Set(ids)];
      for (const id of ids) {
        const m = motes.find((v) => v.id === id)!;
        let dest: Hex;
        if (op === "rotate-cw" || op === "rotate-ccw")
          dest = add(
            newer.cell,
            rotate(sub(hex(m.q, m.r), old.cell), op === "rotate-cw" ? 1 : -1),
          );
        else if (op === "extend" || op === "retract") {
          const d = DIRS[old.rotation];
          dest = hex(
            m.q + d[0] * (op === "extend" ? 1 : -1),
            m.r + d[1] * (op === "extend" ? 1 : -1),
          );
        } else if (op === "pivot-cw" || op === "pivot-ccw") {
          const grip = grips.find(
            (g) =>
              g.part === p.id && group({ ...sim, grips }, g.mote).includes(id),
          )!;
          const center = cellsOf(p, old)[
            spokeDirections(p, old).indexOf(grip.spoke)
          ];
          dest = add(
            center,
            rotate(sub(hex(m.q, m.r), center), op === "pivot-cw" ? 1 : -1),
          );
        } else dest = add(hex(m.q, m.r), sub(newer.cell, old.cell));
        moved.set(id, dest);
      }
    }
  }
  // Sample each rigid motion at the prescribed eighths. A swept rotation uses
  // the exact circular arc in stage space; linear moves interpolate centers.
  for (let k = 1; k <= COLLISION_SAMPLES; k++) {
    const t = k / COLLISION_SAMPLES,
      points = motes.map((m) => {
        const target = moved.get(m.id);
        if (!target) return { ...xy(m), id: m.id };
        const carrier =
          parts.find((p) => p.kind === "wheel" && m.wheel === p.id) ||
          parts.find((p) =>
            grips.some(
              (g) => g.part === p.id && group(sim, g.mote).includes(m.id),
            ),
          );
        const op = carrier ? ins.get(carrier.id) : null;
        if (
          carrier &&
          (op === "rotate-cw" ||
            op === "rotate-ccw" ||
            op === "pivot-cw" ||
            op === "pivot-ccw")
        ) {
          const old = originalPoses.find((v) => v.part === carrier.id)!;
          const grip = grips.find(
            (g) =>
              g.part === carrier.id &&
              group({ ...sim, grips }, g.mote).includes(m.id),
          );
          const base = xy(
              op.startsWith("pivot") && grip
                ? cellsOf(carrier, old)[
                    spokeDirections(carrier, old).indexOf(grip.spoke)
                  ]
                : old.cell,
            ),
            origin = xy(m),
            angle =
              (((op.endsWith("cw") && !op.endsWith("ccw") ? 1 : -1) * Math.PI) /
                3) *
              t,
            dx = origin.x - base.x,
            dy = origin.y - base.y;
          return {
            id: m.id,
            x: base.x + dx * Math.cos(angle) - dy * Math.sin(angle),
            y: base.y + dx * Math.sin(angle) + dy * Math.cos(angle),
          };
        }
        const a = xy(m),
          b = xy(target);
        return { id: m.id, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      });
    const collisions = new Set<number>();
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++)
        if (
          Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) <
          2 * MOTE_COLLIDE_R
        ) {
          collisions.add(points[i].id);
          collisions.add(points[j].id);
        }
    if (collisions.size)
      return {
        ...sim,
        status: "faulted",
        fraction: t,
        fault: {
          kind: "collision",
          parts: [],
          motes: [...collisions].sort((a, b) => a - b),
        },
        grips,
      };
  }
  motes = motes.map((m) =>
    moved.has(m.id) ? { ...m, ...moved.get(m.id)! } : m,
  );
  return {
    ...sim,
    motes,
    poses,
    grips: grips.map((g) => {
      const op = ins.get(g.part);
      return op === "rotate-cw"
        ? { ...g, spoke: (g.spoke + 1) % 6 }
        : op === "rotate-ccw"
          ? { ...g, spoke: (g.spoke + 5) % 6 }
          : g;
    }),
  };
}
function oneCycle(s: DeepReadonly<OrreryState>, sim: SimState): SimState {
  const moved = motion(s, sim);
  if (moved.status === "faulted") return moved;
  const settled = boundary(s, moved);
  return settled.status === "complete"
    ? settled
    : { ...settled, cycle: sim.cycle + 1, fraction: 0 };
}
function advanceSim(s: DeepReadonly<OrreryState>, dt: number): OrreryState {
  if (!s.sim || s.sim.status !== "running") return s as OrreryState;
  let sim = s.sim as SimState,
    remaining = dt * SPEEDS[sim.speed],
    guard = 0;
  while (remaining > 0 && sim.status === "running" && guard++ < 5000) {
    const need = 1 - sim.fraction;
    if (remaining + 1e-9 < need) {
      sim = { ...sim, fraction: sim.fraction + remaining };
      break;
    }
    remaining -= need;
    sim = oneCycle(s, sim);
  }
  return { ...s, sim } as OrreryState;
}
function setTape(
  s: DeepReadonly<OrreryState>,
  id: number,
  col: number,
  op: TapeCell,
  history = false,
): OrreryState {
  insist(Number.isInteger(col) && col >= 0, "invalid tape column");
  insist(op === null || INSTRUCTIONS.includes(op), "invalid instruction");
  const p = partById(s, id);
  insist(p.tape, "part has no tape");
  const tape = [...p.tape];
  while (tape.length <= col) tape.push(null);
  tape[col] = op;
  while (tape.length && tape[tape.length - 1] === null) tape.pop();
  if (JSON.stringify(tape) === JSON.stringify(p.tape)) return s as OrreryState;
  return replacePart(s, id, (v) => ({ ...v, tape }), history);
}
function writeTapeRange(
  s: DeepReadonly<OrreryState>,
  id: number,
  col: number,
  ops: readonly TapeCell[],
): OrreryState {
  if (ops.length === 0) return s as OrreryState;
  let next = s as OrreryState;
  for (let i = 0; i < ops.length; i++)
    next = setTape(next, id, col + i, ops[i]);
  if (JSON.stringify(next.editor.parts) === JSON.stringify(s.editor.parts))
    return next;
  return {
    ...next,
    editor: {
      ...next.editor,
      undo: [...s.editor.undo, s.editor.parts as PartState[]],
      redo: [],
    },
  };
}
function resetExpansion(
  s: DeepReadonly<OrreryState>,
  p: PartState,
  col: number,
): TapeCell[] {
  let rot = p.rotation,
    len = p.length;
  const track = s.editor.parts.find(
      (v) => v.kind === "track" && v.cells?.some((h) => same(h, hex(p.q, p.r))),
    ),
    cells = track?.cells ?? [],
    start = cells.findIndex((h) => same(h, hex(p.q, p.r)));
  let pos = start;
  for (let i = 0; i < col; i++) {
    const op = p.tape?.[i];
    if (op === "rotate-cw") rot = (rot + 1) % 6;
    else if (op === "rotate-ccw") rot = (rot + 5) % 6;
    else if (op === "extend") len = Math.min(ARM_MAX_LEN, len + 1);
    else if (op === "retract") len = Math.max(ARM_MIN_LEN, len - 1);
    else if (op === "advance" && pos >= 0)
      pos = track?.closed
        ? (pos + 1) % cells.length
        : Math.min(cells.length - 1, pos + 1);
    else if (op === "recede" && pos >= 0)
      pos = track?.closed
        ? (pos - 1 + cells.length) % cells.length
        : Math.max(0, pos - 1);
  }
  const out: TapeCell[] = p.kind === "wheel" ? [] : ["drop"];
  while (len > p.length) {
    out.push("retract");
    len--;
  }
  while (len < p.length) {
    out.push("extend");
    len++;
  }
  const cw = (p.rotation - rot + 6) % 6,
    ccw = (rot - p.rotation + 6) % 6;
  out.push(
    ...Array.from({ length: Math.min(cw, ccw) }, () =>
      cw <= ccw ? ("rotate-cw" as TapeCell) : ("rotate-ccw" as TapeCell),
    ),
  );
  if (pos >= 0 && start >= 0 && pos !== start) {
    const forward = (start - pos + cells.length) % cells.length,
      reverse = (pos - start + cells.length) % cells.length;
    let dir: TapeCell = "advance",
      n = forward;
    if (!track?.closed) {
      dir = pos < start ? "advance" : "recede";
      n = Math.abs(pos - start);
    } else if (reverse < forward) {
      dir = "recede";
      n = reverse;
    }
    out.push(...Array.from({ length: n }, () => dir));
  }
  return out;
}
function menuItems(s: DeepReadonly<OrreryState>): readonly string[] {
  if (s.screen === "title") return TITLE_ITEMS;
  if (s.screen === "howto") return ["BACK TO MENU"];
  if (s.screen === "select") return course(s.mode).map((c) => c.name);
  if (s.sim?.status === "complete")
    return s.challengeRef && s.challengeRef.index + 1 < course(s.mode).length
      ? SOLVED_ITEMS
      : SOLVED_ITEMS.slice(1);
  return [];
}
function menuRect(
  s: DeepReadonly<OrreryState>,
  i: number,
): { x: number; y: number; w: number; h: number } | null {
  if (i < 0 || i >= menuItems(s).length) return null;
  if (s.screen === "title") return { x: 480, y: 378 + i * 57, w: 320, h: 48 };
  if (s.screen === "howto") return { x: 485, y: 615, w: 310, h: 48 };
  if (s.screen === "select") return { x: 290, y: 112 + i * 36, w: 700, h: 32 };
  return { x: 480, y: 425 + i * 54, w: 320, h: 46 };
}
function selectMenu(s: DeepReadonly<OrreryState>, i: number): OrreryState {
  return s.screen === "select"
    ? ({ ...s, selectIndex: i } as OrreryState)
    : ({ ...s, menuIndex: i } as OrreryState);
}
function takeMenu(s: DeepReadonly<OrreryState>): OrreryState {
  if (s.screen === "title") {
    const i = s.menuIndex,
      next = { ...s, titleIndex: i };
    if (i === 2) return leave(next, "howto");
    return leave({ ...next, mode: i === 0 ? "campaign" : "extras" }, "select");
  }
  if (s.screen === "howto") return leave(s, "title");
  if (s.screen === "select") {
    if (s.mode === "campaign" && s.selectIndex >= s.unlockedCount)
      return s as OrreryState;
    return open(s, s.mode, s.selectIndex);
  }
  if (s.sim?.status === "complete") {
    const items = menuItems(s),
      choice = items[s.menuIndex];
    if (choice === "NEXT CHALLENGE" && s.challengeRef)
      return open(s, s.mode, s.challengeRef.index + 1);
    if (choice === "KEEP TINKERING") return { ...s, sim: null } as OrreryState;
    if (choice === "BACK TO SELECT") return leave(s, "select");
  }
  return s as OrreryState;
}
function applyPointer(
  s: DeepReadonly<OrreryState>,
  type: "down" | "move" | "up",
  x: number,
  y: number,
): OrreryState {
  let next = {
    ...s,
    pointer: {
      x,
      y,
      down: type === "up" ? false : type === "down" ? true : s.pointer.down,
    },
  } as OrreryState;
  if (s.screen !== "editor" || s.sim?.status === "complete") {
    const hit = menuItems(next).findIndex((_, i) => {
      const r = menuRect(next, i)!;
      return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    });
    if (hit >= 0) next = selectMenu(next, hit);
    if (type === "down") return { ...next, menuPress: hit } as OrreryState;
    if (type === "up") {
      const was = (s as OrreryState & { menuPress?: number }).menuPress;
      next = { ...next, menuPress: null } as OrreryState;
      if (hit >= 0 && was === hit) return takeMenu(next);
    }
    return next;
  }
  if (next.sim) {
    if (type === "down")
      next = {
        ...next,
        editor: { ...next.editor, focus: y >= TAPE_Y0 ? "tape" : "field" },
      };
    return next;
  }
  const c = needsChallenge(next),
    h = nearest(x, y);
  if (type === "down") {
    if (x < TRAY_REGION_W && y >= TRAY_Y0) {
      const k = Math.floor((y - TRAY_Y0) / TRAY_SLOT_H),
        entry = tray(c)[k];
      if (
        entry &&
        x >= TRAY_X0 &&
        x < TRAY_X0 + TRAY_W &&
        !(
          entry.index !== null &&
          next.editor.parts.some(
            (p) => p.kind === entry.kind && p.index === entry.index,
          )
        )
      )
        return {
          ...next,
          editor: {
            ...next.editor,
            focus: "field",
            drag: {
              kind: "place",
              part: entry.kind,
              index: entry.index,
              rotation: 0,
              length: 1,
              at: h,
              before: next.editor.parts,
            },
          },
        };
    }
    if (y >= TAPE_Y0 && x >= TRAY_REGION_W) {
      const rows = next.editor.parts.filter((p) => p.tape),
        visibleRow = Math.floor((y - TAPE_Y0) / TAPE_ROW_H);
      const selectedRow = rows.findIndex(
          (p) => p.id === next.editor.cursor?.part,
        ),
        firstRow = Math.max(0, selectedRow - (TAPE_ROWS_VISIBLE - 1));
      const firstCol = Math.max(
        0,
        (next.editor.cursor?.col ?? 0) - (TAPE_COLS_VISIBLE - 1),
      );
      const p =
        visibleRow >= 0 && visibleRow < TAPE_ROWS_VISIBLE
          ? rows[firstRow + visibleRow]
          : undefined;
      const col =
        x < TRAY_REGION_W + TAPE_X0
          ? 0
          : firstCol +
            Math.floor((x - (TRAY_REGION_W + TAPE_X0)) / TAPE_CELL_W);
      return {
        ...next,
        editor: {
          ...next.editor,
          focus: "tape",
          cursor: p ? { part: p.id, col } : next.editor.cursor,
          selected: p?.id ?? next.editor.selected,
        },
      };
    }
    const p = h
      ? (next.editor.parts.find(
          (v) => mechanismKinds.includes(v.kind) && v.q === h.q && v.r === h.r,
        ) ??
        next.editor.parts.find(
          (v) => v.kind === "track" && v.cells?.some((vh) => same(vh, h)),
        ) ??
        next.editor.parts.find(
          (v) =>
            !mechanismKinds.includes(v.kind) &&
            v.kind !== "track" &&
            footprint(v, c).some((vh) => same(vh, h)),
        ))
      : undefined;
    if (p && h && p.kind === "track" && !p.closed) {
      const cells = p.cells ?? [];
      const end =
        cells.length === 1
          ? "last"
          : same(h, cells[0])
            ? "first"
            : same(h, cells[cells.length - 1])
              ? "last"
              : null;
      if (end)
        return {
          ...next,
          editor: {
            ...next.editor,
            focus: "field",
            selected: p.id,
            drag: { kind: "lay", part: p.id, end, before: next.editor.parts },
          },
        };
    }
    if (p && h) {
      const drag: DragState = {
        kind: "move",
        part: p.id,
        from: h,
        at: h,
        rotation: p.rotation,
        length: p.length,
        before: next.editor.parts,
      };
      return {
        ...next,
        editor: {
          ...next.editor,
          focus: "field",
          selected: p.id,
          cursor: p.tape ? { part: p.id, col: 0 } : next.editor.cursor,
          drag,
        },
      };
    }
    return {
      ...next,
      editor: { ...next.editor, focus: "field", selected: null, drag: null },
    };
  }
  if (type === "move" && next.editor.drag?.kind === "lay") {
    const drag = next.editor.drag,
      p = partById(next, drag.part),
      cells = [...(p.cells ?? [])];
    if (!h) return next;
    const end = drag.end === "first" ? cells[0] : cells[cells.length - 1],
      behind = drag.end === "first" ? cells[1] : cells[cells.length - 2],
      other = drag.end === "first" ? cells[cells.length - 1] : cells[0];
    let proposed: Hex[] | null = null,
      closed = false;
    if (behind && same(h, behind))
      proposed = drag.end === "first" ? cells.slice(1) : cells.slice(0, -1);
    else if (cells.length >= 3 && same(h, other) && adjacent(end, other)) {
      proposed = cells;
      closed = true;
    } else if (adjacent(h, end) && !cells.some((v) => same(v, h)))
      proposed = drag.end === "first" ? [h, ...cells] : [...cells, h];
    if (proposed) {
      const changed = {
        ...p,
        q: proposed[0].q,
        r: proposed[0].r,
        cells: proposed,
        closed,
      };
      try {
        validatePlacement(changed, next.editor.parts as PartState[], c);
        next = withParts(
          next,
          next.editor.parts.map((v) =>
            v.id === p.id ? changed : v,
          ) as PartState[],
        );
        if (closed)
          next = {
            ...next,
            editor: {
              ...next.editor,
              drag: null,
              undo: [...next.editor.undo, drag.before],
              redo: [],
            },
          };
      } catch {
        /* remain on last legal path */
      }
    }
    return next;
  }
  if (type === "move" && next.editor.drag)
    return {
      ...next,
      editor: {
        ...next.editor,
        drag: { ...next.editor.drag, at: h } as DragState,
      },
    };
  if (type === "up" && next.editor.drag) {
    const drag = next.editor.drag;
    if (drag.kind === "lay") {
      const changed =
        JSON.stringify(next.editor.parts) !== JSON.stringify(drag.before);
      return {
        ...next,
        editor: {
          ...next.editor,
          drag: null,
          undo: changed ? [...next.editor.undo, drag.before] : next.editor.undo,
          redo: changed ? [] : next.editor.redo,
        },
      };
    }
    next = { ...next, editor: { ...next.editor, drag: null } };
    if (!h) return next;
    try {
      if (drag.kind === "place") {
        next = place(
          next,
          drag.part,
          h.q,
          h.r,
          drag.rotation,
          drag.index,
          true,
        );
        if (drag.length !== 1 && armKinds.includes(drag.part))
          next = replacePart(next, next.editor.selected!, (p) => ({
            ...p,
            length: drag.length,
          }));
        pointerCues.add(CUES.place);
      } else if (
        drag.kind === "move" &&
        (!same(h, drag.from) ||
          drag.rotation !== partById(next, drag.part).rotation ||
          drag.length !== partById(next, drag.part).length)
      ) {
        const p = partById(next, drag.part),
          delta = sub(h, drag.from);
        next = replacePart(
          next,
          p.id,
          (v) => ({
            ...v,
            q: v.q + delta.q,
            r: v.r + delta.r,
            cells: v.cells?.map((ch) => add(ch, delta)) ?? null,
            rotation: drag.rotation,
            length: drag.length,
          }),
          true,
        );
        pointerCues.add(CUES.place);
      }
    } catch {
      return next;
    }
  }
  return next;
}
function updateProgress(s: DeepReadonly<OrreryState>): OrreryState {
  const sim = s.sim;
  if (!sim || sim.status !== "complete" || !sim.metrics || !s.challengeRef)
    return s as OrreryState;
  const { mode, index } = s.challengeRef,
    solvedKey = mode === "campaign" ? "campaignSolved" : "extrasSolved",
    recordKey = mode === "campaign" ? "campaignRecords" : "extrasRecords";
  const records = [...s[recordKey]],
    old = records[index],
    m = sim.metrics;
  records[index] = {
    cost: Math.min(old?.cost ?? Infinity, m.cost),
    cycles: Math.min(old?.cycles ?? Infinity, m.cycles),
    area: Math.min(old?.area ?? Infinity, m.area),
  };
  return {
    ...s,
    [solvedKey]: [...new Set([...s[solvedKey], index])].sort((a, b) => a - b),
    [recordKey]: records,
    unlockedCount:
      mode === "campaign"
        ? Math.max(s.unlockedCount, Math.min(CAMPAIGN.length, index + 2))
        : s.unlockedCount,
    menuIndex: 0,
  } as OrreryState;
}
function modifyInput(
  s: DeepReadonly<OrreryState>,
  api: UpdateApi,
): OrreryState {
  let next = s as OrreryState;
  if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
  const up = api.input.pressed("up"),
    down = api.input.pressed("down"),
    left = api.input.pressed("left"),
    right = api.input.pressed("right"),
    confirm = api.input.pressed("confirm"),
    back = api.input.pressed("back");
  if (next.screen !== "editor" || next.sim?.status === "complete") {
    const items = menuItems(next);
    if (items.length && (up || down))
      next = selectMenu(
        next,
        ((next.screen === "select" ? next.selectIndex : next.menuIndex) +
          (down ? 1 : -1) +
          items.length) %
          items.length,
      );
    if (next.screen === "howto")
      next = {
        ...next,
        howtoPage: Math.max(
          0,
          Math.min(
            HOWTO_PAGES - 1,
            next.howtoPage + (right ? 1 : 0) - (left ? 1 : 0),
          ),
        ),
      };
    if (confirm) next = takeMenu(next);
    if (back && (next.screen === "howto" || next.screen === "select"))
      next = leave(next, "title");
    if (next.screen === "editor" && next.sim?.status === "complete" && back)
      next = { ...next, sim: null };
  } else if (next.sim) {
    if (back) next = { ...next, sim: null };
    else if (next.sim.status === "running" || next.sim.status === "paused") {
      if (api.input.pressed("play"))
        next = {
          ...next,
          sim: {
            ...next.sim,
            status: next.sim.status === "running" ? "paused" : "running",
          },
        };
      if (api.input.pressed("speed-up"))
        next = {
          ...next,
          sim: {
            ...next.sim!,
            speed: Math.min(SPEEDS.length - 1, next.sim!.speed + 1),
          },
        };
      if (api.input.pressed("speed-down"))
        next = {
          ...next,
          sim: { ...next.sim!, speed: Math.max(0, next.sim!.speed - 1) },
        };
      if (api.input.pressed("step")) {
        const sim = oneCycle(next, next.sim!);
        next = {
          ...next,
          sim: sim.status === "running" ? { ...sim, status: "paused" } : sim,
        };
      }
    }
  } else {
    if (back && !next.editor.drag) next = leave(next, "select");
    else {
      const playPressed = api.input.pressed("play"),
        stepPressed = api.input.pressed("step");
      if ((playPressed || stepPressed) && !next.editor.drag) {
        const ready =
          next.challenge?.reagents.every((_, i) =>
            next.editor.parts.some((p) => p.kind === "rise" && p.index === i),
          ) &&
          next.challenge?.products.every((_, i) =>
            next.editor.parts.some((p) => p.kind === "set" && p.index === i),
          );
        if (ready) {
          next = start(next);
          if (stepPressed)
            next = { ...next, sim: { ...next.sim!, status: "paused" } };
          api.audio.play(CUES.start);
        }
      }
    }
    if (!next.sim) {
      if (
        !next.editor.drag &&
        api.input.pressed("undo") &&
        next.editor.undo.length
      ) {
        const undo = [...next.editor.undo],
          parts = undo.pop()!;
        next = {
          ...next,
          editor: {
            ...next.editor,
            parts: parts as PartState[],
            undo,
            redo: [...next.editor.redo, next.editor.parts],
          },
        };
      }
      if (
        !next.editor.drag &&
        api.input.pressed("redo") &&
        next.editor.redo.length
      ) {
        const redo = [...next.editor.redo],
          parts = redo.pop()!;
        next = {
          ...next,
          editor: {
            ...next.editor,
            parts: parts as PartState[],
            redo,
            undo: [...next.editor.undo, next.editor.parts],
          },
        };
      }
      if (next.editor.focus === "field") {
        const drag = next.editor.drag;
        const id = drag
          ? drag.kind === "move"
            ? drag.part
            : null
          : next.editor.selected;
        if (id !== null && id !== undefined) {
          const rot =
              (api.input.pressed("part-cw") ? 1 : 0) -
              (api.input.pressed("part-ccw") ? 1 : 0),
            len =
              (api.input.pressed("part-grow") ? 1 : 0) -
              (api.input.pressed("part-shrink") ? 1 : 0);
          if (drag && drag.kind === "move")
            next = {
              ...next,
              editor: {
                ...next.editor,
                drag: {
                  ...drag,
                  rotation:
                    partById(next, drag.part).kind === "track"
                      ? 0
                      : (drag.rotation + rot + 6) % 6,
                  length: armKinds.includes(partById(next, drag.part).kind)
                    ? Math.max(
                        ARM_MIN_LEN,
                        Math.min(ARM_MAX_LEN, drag.length + len),
                      )
                    : drag.length,
                },
              },
            };
          else if ((rot || len) && partById(next, id).kind !== "track")
            try {
              next = replacePart(
                next,
                id,
                (p) => ({
                  ...p,
                  rotation: (p.rotation + rot + 6) % 6,
                  length: armKinds.includes(p.kind)
                    ? Math.max(
                        ARM_MIN_LEN,
                        Math.min(ARM_MAX_LEN, p.length + len),
                      )
                    : p.length,
                }),
                true,
              );
            } catch {
              /* illegal edit rests */
            }
          if (!drag && api.input.pressed("part-delete")) {
            next = withParts(
              next,
              next.editor.parts.filter((p) => p.id !== id) as PartState[],
              true,
            );
            api.audio.play(CUES.erase);
          }
        }
        if (drag?.kind === "place") {
          const rot =
              (api.input.pressed("part-cw") ? 1 : 0) -
              (api.input.pressed("part-ccw") ? 1 : 0),
            len =
              (api.input.pressed("part-grow") ? 1 : 0) -
              (api.input.pressed("part-shrink") ? 1 : 0);
          if (rot || len)
            next = {
              ...next,
              editor: {
                ...next.editor,
                drag: {
                  ...drag,
                  rotation:
                    drag.part === "track" ? 0 : (drag.rotation + rot + 6) % 6,
                  length: armKinds.includes(drag.part)
                    ? Math.max(
                        ARM_MIN_LEN,
                        Math.min(ARM_MAX_LEN, drag.length + len),
                      )
                    : drag.length,
                },
              },
            };
        }
      } else if (next.editor.cursor) {
        const cur = next.editor.cursor,
          rows = next.editor.parts.filter((p) => p.tape);
        let col = cur.col + (right ? 1 : 0) - (left ? 1 : 0),
          id = cur.part;
        if (up || down) {
          const at = rows.findIndex((p) => p.id === id);
          id =
            rows[(at + (down ? 1 : -1) + rows.length) % rows.length]?.id ?? id;
        }
        col = Math.max(0, col);
        next = {
          ...next,
          editor: { ...next.editor, cursor: { part: id, col } },
        };
        for (const ins of INSTRUCTIONS) {
          if (api.input.pressed(`ins-${ins}`)) {
            next = setTape(next, id, col, ins, true);
            col++;
          }
        }
        if (api.input.pressed("ins-blank"))
          next = setTape(next, id, col, null, true);
        if (api.input.pressed("ins-erase") && col > 0) {
          next = setTape(next, id, col - 1, null, true);
          col--;
        }
        if (api.input.pressed("ins-repeat")) {
          const p = partById(next, id),
            copy = Array.from({ length: col }, (_, i) => p.tape?.[i] ?? null);
          next = writeTapeRange(next, id, col, copy);
          col += copy.length;
        }
        if (api.input.pressed("ins-reset")) {
          const p = partById(next, id),
            expansion = resetExpansion(next, p, col);
          next = writeTapeRange(next, id, col, expansion);
          col += expansion.length;
        }
        next = {
          ...next,
          editor: { ...next.editor, cursor: { part: id, col } },
        };
      }
    }
  }
  for (const sample of api.input.pointerSamples())
    if (sample.primary) {
      next = applyPointer(next, sample.type, sample.x, sample.y);
    }
  for (const cue of pointerCues) api.audio.play(cue);
  pointerCues.clear();
  return next;
}
function instructionAt(s: DeepReadonly<OrreryState>, p: PartState): TapeCell {
  return p.tape?.[s.sim!.cycle % period(s.editor.parts as PartState[])] ?? null;
}
function visualPose(
  s: DeepReadonly<OrreryState>,
  p: PartState,
): { x: number; y: number; angle: number; length: number } {
  const live = s.sim?.poses.find((v) => v.part === p.id),
    base = xy(live?.cell ?? hex(p.q, p.r));
  let x = base.x,
    y = base.y,
    angle = ((live?.rotation ?? p.rotation) * Math.PI) / 3,
    length = live?.length ?? p.length;
  if (!live || s.sim!.fraction <= 0) return { x, y, angle, length };
  const f = s.sim!.fraction,
    op = instructionAt(s, p);
  if (op === "rotate-cw" || op === "rotate-ccw")
    angle += (((op === "rotate-cw" ? 1 : -1) * Math.PI) / 3) * f;
  if (op === "extend" || op === "retract")
    length += (op === "extend" ? 1 : -1) * f;
  if (op === "advance" || op === "recede") {
    const track = s.editor.parts.find(
      (v) => v.kind === "track" && v.cells?.some((h) => same(h, live.cell)),
    );
    if (track) {
      const cells = track.cells!,
        i = cells.findIndex((h) => same(h, live.cell)),
        j = (i + (op === "advance" ? 1 : -1) + cells.length) % cells.length,
        target = xy(cells[j]);
      x += (target.x - x) * f;
      y += (target.y - y) * f;
    }
  }
  return { x, y, angle, length };
}
function motePosition(
  s: DeepReadonly<OrreryState>,
  m: MoteState,
): { x: number; y: number } {
  const origin = xy(m),
    sim = s.sim;
  if (!sim || sim.fraction <= 0) return origin;
  const carrier =
    s.editor.parts.find((p) => p.kind === "wheel" && m.wheel === p.id) ||
    s.editor.parts.find((p) =>
      sim.grips.some(
        (g) => g.part === p.id && group(sim as SimState, g.mote).includes(m.id),
      ),
    );
  if (!carrier) return origin;
  const p = carrier as PartState,
    op = instructionAt(s, p),
    live = sim.poses.find((v) => v.part === p.id);
  if (!live) return origin;
  const f = sim.fraction,
    center = xy(live.cell);
  let cx = center.x,
    cy = center.y,
    step = 0;
  if (op === "rotate-cw" || op === "rotate-ccw")
    step = (((op === "rotate-cw" ? 1 : -1) * Math.PI) / 3) * f;
  else if (op === "pivot-cw" || op === "pivot-ccw") {
    const grip = sim.grips.find(
      (g) => g.part === p.id && group(sim as SimState, g.mote).includes(m.id),
    );
    if (grip) {
      const h = cellsOf(p, live)[spokeDirections(p, live).indexOf(grip.spoke)];
      if (h) {
        const pos = xy(h);
        cx = pos.x;
        cy = pos.y;
        step = (((op === "pivot-cw" ? 1 : -1) * Math.PI) / 3) * f;
      }
    }
  }
  if (step) {
    const dx = origin.x - cx,
      dy = origin.y - cy;
    return {
      x: cx + dx * Math.cos(step) - dy * Math.sin(step),
      y: cy + dx * Math.sin(step) + dy * Math.cos(step),
    };
  }
  if (op === "extend" || op === "retract") {
    const d = DIRS[live.rotation],
      target = xy(add(hex(m.q, m.r), hex(d[0], d[1])));
    const sign = op === "extend" ? 1 : -1;
    return {
      x: origin.x + (target.x - origin.x) * f * sign,
      y: origin.y + (target.y - origin.y) * f * sign,
    };
  }
  if (op === "advance" || op === "recede") {
    const v = visualPose(s, p);
    return { x: origin.x + v.x - center.x, y: origin.y + v.y - center.y };
  }
  return origin;
}
function imageAt(
  ctx: CanvasRenderingContext2D,
  path: string,
  x: number,
  y: number,
  w: number,
  h = w,
  angle = 0,
): void {
  const img = assetImages.get(path);
  if (!img) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function textAt(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 18,
  color = pale,
  align: CanvasTextAlign = "left",
  weight = "400",
): void {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px Georgia, serif`;
  ctx.fillText(value, x, y);
}
function lineAt(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  color: string,
  width = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
function drawSky(ctx: CanvasRenderingContext2D, time: number): void {
  const g = ctx.createRadialGradient(640, 300, 30, 640, 300, 790);
  g.addColorStop(0, "#17283a");
  g.addColorStop(1, sky);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  for (let i = 0; i < 95; i++) {
    const x = (i * 419 + 93) % STAGE_W,
      y = (i * 263 + 117) % STAGE_H,
      v = 0.25 + 0.25 * Math.sin(time * 0.5 + i * 5);
    ctx.fillStyle = `rgba(226,228,210,${v})`;
    ctx.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
  }
}
function drawHex(
  ctx: CanvasRenderingContext2D,
  h: Hex,
  fill: string,
  stroke: string,
  width = 1,
): void {
  const p = xy(h),
    r = 25;
  ctx.beginPath();
  for (let j = 0; j < 6; j++) {
    const a = (Math.PI / 3) * j + Math.PI / 6;
    const x = p.x + r * Math.cos(a),
      y = p.y + r * Math.sin(a);
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}
function drawField(
  ctx: CanvasRenderingContext2D,
  s: DeepReadonly<OrreryState>,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    TRAY_REGION_W,
    HEADING_H,
    READOUT_X0 - TRAY_REGION_W,
    TAPE_Y0 - HEADING_H,
  );
  ctx.clip();
  for (let r = -FIELD_R; r <= FIELD_R; r++)
    for (let q = -FIELD_R; q <= FIELD_R; q++) {
      const h = hex(q, r);
      if (onField(h)) drawHex(ctx, h, "#19283888", "#49607388");
    }
  const target = nearest(s.pointer.x, s.pointer.y);
  if (
    target &&
    s.pointer.x >= TRAY_REGION_W &&
    s.pointer.x < READOUT_X0 &&
    s.pointer.y < TAPE_Y0
  )
    drawHex(ctx, target, "#c8b57e22", gold, 2);
  const c = s.challenge;
  if (!c) {
    ctx.restore();
    return;
  }
  for (const p of s.editor.parts) {
    if (p.kind === "track") {
      const cells = p.cells ?? [];
      for (let i = 1; i < cells.length; i++)
        lineAt(ctx, xy(cells[i - 1]), xy(cells[i]), "#9a7c58", 8);
      if (p.closed && cells.length > 2)
        lineAt(ctx, xy(cells[cells.length - 1]), xy(cells[0]), "#9a7c58", 8);
      for (const h of cells) {
        const v = xy(h);
        imageAt(ctx, FIXTURE_MOUNT_PATH, v.x, v.y, WHEEL_SPRITE_SIZE);
        if (s.editor.selected === p.id) drawHex(ctx, h, "#81dcb822", teal, 2);
      }
      continue;
    }
    const pos = xy(hex(p.q, p.r));
    if (!mechanismKinds.includes(p.kind)) {
      for (const h of footprint(p, c))
        drawHex(
          ctx,
          h,
          s.editor.selected === p.id ? "#81dcb833" : "#a9985520",
          s.editor.selected === p.id ? teal : "#8c775a88",
          s.editor.selected === p.id ? 2 : 1,
        );
      if (p.kind === "rise" || p.kind === "set") {
        const frame =
          Math.floor(s.simTime / APERTURE_FRAME_TIME) % APERTURE_FRAMES;
        imageAt(
          ctx,
          `${APERTURE_SHEETS[p.kind]}/${frame}.png`,
          pos.x,
          pos.y,
          48,
        );
        const pat = (p.kind === "rise" ? c.reagents : c.products)[p.index ?? 0];
        for (const m of pat.motes) {
          const h = add(hex(p.q, p.r), rotate(hex(m.q, m.r), p.rotation)),
            at = xy(h);
          ctx.strokeStyle = p.kind === "rise" ? teal : gold;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(at.x, at.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else
        imageAt(
          ctx,
          SIGIL_GLYPH_PATHS[p.kind as keyof typeof SIGIL_GLYPH_PATHS],
          pos.x,
          pos.y,
          SIGIL_GLYPH_SIZE,
        );
    }
  }
  const sim = s.sim;
  for (const p of s.editor.parts.filter((v) =>
    mechanismKinds.includes(v.kind),
  )) {
    const live = visualPose(s, p),
      base = { x: live.x, y: live.y };
    if (p.kind === "wheel") {
      for (let i = 0; i < 6; i++) {
        const a = live.angle + (i * Math.PI) / 3,
          end = {
            x: base.x + HEX_PITCH * Math.cos(a),
            y: base.y + HEX_PITCH * Math.sin(a),
          };
        lineAt(ctx, base, end, "#a9875d", 5);
      }
      imageAt(
        ctx,
        WHEEL_HUB_PATH,
        base.x,
        base.y,
        WHEEL_SPRITE_SIZE,
        WHEEL_SPRITE_SIZE,
        live.angle,
      );
    } else {
      const offsets =
        p.kind === "biarm"
          ? [0, 3]
          : p.kind === "triarm"
            ? [0, 2, 4]
            : p.kind === "hexarm"
              ? [0, 1, 2, 3, 4, 5]
              : [0];
      for (const [i, offset] of offsets.entries()) {
        const a = live.angle + (offset * Math.PI) / 3,
          end = {
            x: base.x + HEX_PITCH * live.length * Math.cos(a),
            y: base.y + HEX_PITCH * live.length * Math.sin(a),
          };
        lineAt(ctx, base, end, "#372c2b", 9);
        lineAt(ctx, base, end, "#c6a467", 4);
        const closed = sim?.grips.some(
          (g) =>
            g.part === p.id &&
            g.spoke ===
              spokeDirections(
                p,
                sim?.poses.find((v) => v.part === p.id),
              )[i],
        );
        imageAt(
          ctx,
          GRIPPER_PATHS[closed ? "closed" : "open"],
          end.x,
          end.y,
          GRIPPER_SPRITE_SIZE,
          GRIPPER_SPRITE_SIZE,
          a,
        );
      }
      imageAt(
        ctx,
        HUB_PATHS[p.kind === "piston" ? "piston" : "arm"],
        base.x,
        base.y,
        HUB_SPRITE_SIZE,
        HUB_SPRITE_SIZE,
        live.angle,
      );
    }
    textAt(
      ctx,
      String(p.id),
      base.x,
      base.y + 5,
      13,
      "#fff8db",
      "center",
      "bold",
    );
    if (s.editor.selected === p.id) {
      ctx.strokeStyle = teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(base.x, base.y, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (sim) {
    for (const f of sim.filaments) {
      const a = sim.motes.find((m) => m.id === f.a),
        b = sim.motes.find((m) => m.id === f.b);
      if (!a || !b) continue;
      const A = motePosition(s, a),
        B = motePosition(s, b),
        angle = Math.atan2(B.y - A.y, B.x - A.x);
      imageAt(
        ctx,
        FILAMENT_SPRITE_PATHS[f.weight === 3 ? "triune" : "plain"],
        (A.x + B.x) / 2,
        (A.y + B.y) / 2,
        FILAMENT_SPRITE_W,
        FILAMENT_SPRITE_H,
        angle,
      );
    }
    for (const m of sim.motes) {
      const p = motePosition(s, m);
      if (m.wheel !== null)
        imageAt(ctx, FIXTURE_MOUNT_PATH, p.x, p.y, WHEEL_SPRITE_SIZE);
      imageAt(ctx, MOTE_SPRITE_PATHS[m.type], p.x, p.y, MOTE_SPRITE_SIZE);
      if (sim.fault?.motes.includes(m.id)) {
        ctx.strokeStyle = "#ff766e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  const drag = s.editor.drag;
  if (drag && drag.kind !== "lay" && drag.at) {
    const source =
      drag.kind === "place"
        ? makePart(
            -1,
            drag.part,
            drag.at.q,
            drag.at.r,
            drag.rotation,
            drag.index,
          )
        : partById(s, drag.part);
    const delta = drag.kind === "move" ? sub(drag.at, drag.from) : hex(0, 0);
    const p: PartState = {
      ...source,
      q: source.q + delta.q,
      r: source.r + delta.r,
      rotation: drag.rotation,
      length: drag.length,
      cells: source.cells?.map((h) => add(h, delta)) ?? null,
    };
    const pos = xy(hex(p.q, p.r));
    let legal = true;
    try {
      validatePlacement(p, s.editor.parts as PartState[], c);
    } catch {
      legal = false;
    }
    ctx.globalAlpha = 0.6;
    drawHex(
      ctx,
      hex(p.q, p.r),
      legal ? "#81dcb844" : "#d76c6c44",
      legal ? teal : "#e77d77",
      3,
    );
    if (p.kind === "rise" || p.kind === "set")
      imageAt(
        ctx,
        `${APERTURE_SHEETS[p.kind]}/${Math.floor(s.simTime / APERTURE_FRAME_TIME) % APERTURE_FRAMES}.png`,
        pos.x,
        pos.y,
        48,
      );
    else if (sigilKinds.includes(p.kind))
      imageAt(
        ctx,
        SIGIL_GLYPH_PATHS[p.kind as keyof typeof SIGIL_GLYPH_PATHS],
        pos.x,
        pos.y,
        48,
      );
    else if (p.kind === "track")
      imageAt(ctx, FIXTURE_MOUNT_PATH, pos.x, pos.y, 48);
    else
      imageAt(
        ctx,
        p.kind === "wheel"
          ? WHEEL_HUB_PATH
          : HUB_PATHS[p.kind === "piston" ? "piston" : "arm"],
        pos.x,
        pos.y,
        40,
      );
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawMenu(
  ctx: CanvasRenderingContext2D,
  s: DeepReadonly<OrreryState>,
): void {
  const items = menuItems(s),
    selection = s.screen === "select" ? s.selectIndex : s.menuIndex;
  items.forEach((item, i) => {
    const r = menuRect(s, i)!;
    const chosen = i === selection;
    ctx.fillStyle = chosen ? "#766443aa" : "#132438bb";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = chosen ? gold : "#496374";
    ctx.lineWidth = chosen ? 2 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    if (s.screen === "select") {
      const solved = (
          s.mode === "campaign" ? s.campaignSolved : s.extrasSolved
        ).includes(i),
        locked = s.mode === "campaign" && i >= s.unlockedCount,
        rec = (s.mode === "campaign" ? s.campaignRecords : s.extrasRecords)[i];
      textAt(
        ctx,
        `${String(i + 1).padStart(2, "0")}  ${item}`,
        r.x + 15,
        r.y + 22,
        17,
        locked ? dim : pale,
      );
      textAt(
        ctx,
        locked ? "LOCKED" : solved ? "SOLVED" : "OPEN",
        r.x + 475,
        r.y + 22,
        13,
        locked ? dim : teal,
      );
      if (rec)
        textAt(
          ctx,
          `C ${rec.cost}   T ${rec.cycles}   A ${rec.area}`,
          r.x + 565,
          r.y + 22,
          12,
          gold,
        );
    } else
      textAt(
        ctx,
        item,
        r.x + r.w / 2,
        r.y + r.h * 0.66,
        21,
        chosen ? "#fff1c9" : pale,
        "center",
        chosen ? "bold" : "400",
      );
  });
}
const pages = [
  [
    "THE SKY",
    "Celestial motes gather into constellations. Filaments bind their stars.",
    "Every challenge asks you to turn incoming reagents into finished products.",
  ],
  [
    "THE MACHINE",
    "Rises bring matter into the field; sets take finished constellations.",
    "Arms, wheels, tracks, and engraved sigils shape the route between them.",
  ],
  [
    "THE TAPE",
    "Each arm reads a looping row of instructions in one shared period.",
    "Click a tape cell; G grabs, V drops, A/D turn, W/S extend or retract.",
  ],
  [
    "RUNNING",
    "Space starts or pauses. N steps one cycle. , and . change speed.",
    "Motes can collide; a fault freezes the machine for inspection.",
  ],
  [
    "FINISHING",
    "Fill every set to six deliveries.",
    "The best machines use less cost, fewer cycles, and less field area.",
  ],
];
function drawEditorChrome(
  ctx: CanvasRenderingContext2D,
  s: DeepReadonly<OrreryState>,
): void {
  const c = s.challenge!;
  ctx.fillStyle = "#0b1522ee";
  ctx.fillRect(0, 0, STAGE_W, HEADING_H);
  ctx.fillRect(0, HEADING_H, TRAY_REGION_W, STAGE_H - HEADING_H);
  ctx.fillRect(
    READOUT_X0,
    HEADING_H,
    STAGE_W - READOUT_X0,
    TAPE_Y0 - HEADING_H,
  );
  ctx.fillRect(
    TRAY_REGION_W,
    TAPE_Y0,
    STAGE_W - TRAY_REGION_W,
    STAGE_H - TAPE_Y0,
  );
  ctx.strokeStyle = "#746548";
  ctx.strokeRect(
    TRAY_REGION_W,
    TAPE_Y0,
    STAGE_W - TRAY_REGION_W,
    STAGE_H - TAPE_Y0,
  );
  textAt(ctx, c.name.toUpperCase(), 28, 32, 25, gold, "left", "bold");
  textAt(
    ctx,
    `COST  ${cost(s.editor.parts as PartState[])}`,
    530,
    30,
    18,
    pale,
  );
  textAt(ctx, "SPACE RUN  ·  N STEP  ·  ESC BACK", 800, 30, 16, teal);
  textAt(ctx, "INSTRUMENTS", 18, 77, 15, gold, "left", "bold");
  tray(c).forEach((entry, i) => {
    const y = TRAY_Y0 + i * TRAY_SLOT_H,
      spent =
        entry.index !== null &&
        s.editor.parts.some(
          (p) => p.kind === entry.kind && p.index === entry.index,
        );
    ctx.fillStyle = spent ? "#1a2330" : "#243447";
    ctx.fillRect(TRAY_X0, y, TRAY_W, TRAY_SLOT_H - 2);
    ctx.strokeStyle = spent ? "#465464" : "#7a694c";
    ctx.strokeRect(TRAY_X0, y, TRAY_W, TRAY_SLOT_H - 2);
    textAt(
      ctx,
      `${entry.kind.toUpperCase()}${entry.index !== null ? ` ${entry.index + 1}` : ""}`,
      20,
      y + 20,
      15,
      spent ? dim : pale,
    );
    textAt(ctx, String(PART_COSTS[entry.kind]), 196, y + 20, 13, gold, "right");
  });
  textAt(ctx, "READOUT", 1030, 83, 16, gold, "left", "bold");
  const sim = s.sim;
  const lines = sim
    ? [
        `STATUS  ${sim.status.toUpperCase()}`,
        `CYCLE  ${sim.cycle}`,
        `PERIOD  ${period(s.editor.parts as PartState[])}`,
        `SPEED  ${SPEEDS[sim.speed]} /s`,
        ...sim.tallies.map((n, i) => `SET ${i + 1}  ${n} / ${c.target}`),
      ]
    : [
        "STATUS  EDITING",
        `PERIOD  ${period(s.editor.parts as PartState[])}`,
        "Drag instruments onto hexes",
        "Click an arm to edit its tape",
        "E/Q turn · W/S length",
        "U/I undo/redo · X delete",
      ];
  lines.forEach((v, i) =>
    textAt(ctx, v, 1028, 116 + i * 30, 16, i === 0 ? teal : pale),
  );
  textAt(ctx, "TAPES", 238, 582, 14, gold, "left", "bold");
  const rows = s.editor.parts.filter((p) => p.tape),
    selectedRow = rows.findIndex((p) => p.id === s.editor.cursor?.part),
    firstRow = Math.max(0, selectedRow - (TAPE_ROWS_VISIBLE - 1)),
    firstCol = Math.max(
      0,
      (s.editor.cursor?.col ?? 0) - (TAPE_COLS_VISIBLE - 1),
    );
  rows.slice(firstRow, firstRow + TAPE_ROWS_VISIBLE).forEach((p, row) => {
    const y = TAPE_Y0 + row * TAPE_ROW_H;
    ctx.fillStyle = row % 2 ? "#1a2a3a" : "#162333";
    ctx.fillRect(TRAY_REGION_W, y, STAGE_W - TRAY_REGION_W, TAPE_ROW_H);
    textAt(
      ctx,
      `#${p.id} ${p.kind[0].toUpperCase()}`,
      TRAY_REGION_W + 9,
      y + 19,
      15,
      pale,
    );
    textAt(
      ctx,
      `${p.tape!.length}/${period(s.editor.parts as PartState[])}`,
      TRAY_REGION_W + TAPE_LABEL_W,
      y + 19,
      11,
      dim,
      "right",
    );
    for (let col = 0; col < TAPE_COLS_VISIBLE; col++) {
      const x = TRAY_REGION_W + TAPE_X0 + col * TAPE_CELL_W,
        absolute = firstCol + col;
      ctx.strokeStyle =
        s.editor.cursor?.part === p.id && s.editor.cursor.col === absolute
          ? teal
          : "#456075";
      ctx.lineWidth =
        s.editor.cursor?.part === p.id && s.editor.cursor.col === absolute
          ? 2
          : 1;
      ctx.strokeRect(x, y + 2, TAPE_CELL_W, TAPE_ROW_H - 4);
      const op = p.tape![absolute];
      if (op)
        imageAt(
          ctx,
          INSTRUCTION_GLYPH_PATHS[op],
          x + TAPE_CELL_W / 2,
          y + TAPE_ROW_H / 2,
          INSTRUCTION_GLYPH_SIZE,
        );
    }
  });
  if (sim?.status === "faulted")
    textAt(
      ctx,
      `FAULT: ${sim.fault?.kind.toUpperCase()}  ·  ESC TO EDIT`,
      616,
      525,
      22,
      "#ff9685",
      "center",
      "bold",
    );
  if (sim?.status === "complete") {
    ctx.fillStyle = "#081522cc";
    ctx.fillRect(410, 170, 460, 492);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(410, 170, 460, 492);
    textAt(ctx, SOLVED_TITLE_TEXT, 640, 220, 27, gold, "center", "bold");
    textAt(
      ctx,
      `COST  ${sim.metrics?.cost}     CYCLES  ${sim.metrics?.cycles}     AREA  ${sim.metrics?.area}`,
      640,
      280,
      18,
      pale,
      "center",
    );
    drawMenu(ctx, s);
  }
}
function renderScene(
  s: DeepReadonly<OrreryState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawSky(ctx, s.simTime);
  if (s.screen === "title") {
    ctx.strokeStyle = "#7f7156";
    for (let r = 40; r < 330; r += 55) {
      ctx.beginPath();
      ctx.arc(640, 310, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
    imageAt(ctx, MOTE_SPRITE_PATHS.sol, 640, 310, 44);
    for (let i = 0; i < 5; i++) {
      const a = s.simTime * 0.18 + i * 1.3,
        p = {
          x: 640 + Math.cos(a) * (95 + i * 45),
          y: 310 + Math.sin(a) * (95 + i * 45),
        };
      imageAt(ctx, MOTE_SPRITE_PATHS[MOTES[5 + i]], p.x, p.y, 44);
    }
    textAt(ctx, TITLE_TEXT, 640, 165, 75, "#f0d7a0", "center", "bold");
    textAt(ctx, TAGLINE_TEXT, 640, 222, 20, teal, "center");
    drawMenu(ctx, s);
  } else if (s.screen === "howto") {
    textAt(ctx, "THE ORRERY", 640, 115, 45, gold, "center", "bold");
    const page = pages[s.howtoPage];
    textAt(
      ctx,
      `${s.howtoPage + 1} / ${HOWTO_PAGES}  ·  ${page[0]}`,
      640,
      224,
      25,
      teal,
      "center",
    );
    page
      .slice(1)
      .forEach((line, i) =>
        textAt(ctx, line, 640, 310 + i * 45, 19, pale, "center"),
      );
    textAt(ctx, "←  →  TURN THE PAGE", 640, 540, 17, dim, "center");
    drawMenu(ctx, s);
  } else if (s.screen === "select") {
    textAt(
      ctx,
      s.mode === "campaign" ? "CAMPAIGN" : "EXTRAS",
      640,
      75,
      40,
      gold,
      "center",
      "bold",
    );
    drawMenu(ctx, s);
    textAt(
      ctx,
      "ENTER TO OPEN  ·  ESC TO RETURN",
      640,
      675,
      16,
      teal,
      "center",
    );
  } else {
    drawField(ctx, s);
    drawEditorChrome(ctx, s);
  }
}
export const CAMPAIGN_REFERENCES: readonly Solution[] =
  CAMPAIGN.map(referenceFor);
function makeDebug() {
  const withEditor = (
    s: DeepReadonly<OrreryState>,
    e: Partial<EditorState>,
  ): OrreryState => ({ ...s, editor: { ...s.editor, ...e } }) as OrreryState;
  const withSim = (
    s: DeepReadonly<OrreryState>,
    e: Partial<SimState>,
  ): OrreryState => ({ ...s, sim: { ...needsSim(s), ...e } }) as OrreryState;
  const record = (
    s: DeepReadonly<OrreryState>,
    mode: Mode,
    index: number,
    metric: keyof Metrics,
    value: number,
  ): OrreryState => {
    validIndex(index, course(mode).length);
    insist(Number.isInteger(value) && value >= 0, "invalid record value");
    const field = mode === "campaign" ? "campaignRecords" : "extrasRecords",
      arr = [...s[field]];
    arr[index] = {
      cost: 0,
      cycles: 0,
      area: 0,
      ...arr[index],
      [metric]: value,
    };
    return { ...s, [field]: arr } as OrreryState;
  };
  const pose = (
    s: DeepReadonly<OrreryState>,
    id: number,
    change: (p: Pose) => Pose,
  ): OrreryState => {
    const sim = needsSim(s);
    partById(s, id);
    const old = sim.poses.find((p) => p.part === id);
    insist(old, `part ${id} has no pose`);
    return withSim(s, {
      poses: sim.poses.map((p) => (p.part === id ? change(p) : p)),
    });
  };
  return {
    version: ORRERY_DEBUG_VERSION,
    reset: (s: DeepReadonly<OrreryState>): OrreryState => {
      effects = [];
      pointerCues.clear();
      return { ...initial(), muted: s.muted };
    },
    reconcile: (s: DeepReadonly<OrreryState>): OrreryState => s as OrreryState,
    snapshot: (s: DeepReadonly<OrreryState>) => ({
      version: ORRERY_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      selectIndex: s.selectIndex,
      howtoPage: s.howtoPage,
      campaign: {
        count: CAMPAIGN.length,
        unlockedCount: s.unlockedCount,
        solved: [...s.campaignSolved],
        records: s.campaignRecords,
        stashed: s.campaignMachines.flatMap((m, i) => (m ? [i] : [])),
        last: s.campaignLast,
      },
      extras: {
        count: EXTRAS.length,
        solved: [...s.extrasSolved],
        records: s.extrasRecords,
        stashed: s.extrasMachines.flatMap((m, i) => (m ? [i] : [])),
        last: s.extrasLast,
      },
      challenge: s.challenge
        ? {
            ...s.challenge,
            reagents: s.challenge.reagents.map((m) => ({
              motes: m.motes,
              filaments: m.filaments,
              ...(m.repeat ? { repeat: m.repeat } : {}),
            })),
            products: s.challenge.products.map((m) => ({
              motes: m.motes,
              filaments: m.filaments,
              ...(m.repeat ? { repeat: m.repeat } : {}),
            })),
            source: s.challengeRef?.mode ?? "custom",
            index: s.challengeRef?.index ?? null,
          }
        : null,
      editor: {
        parts: s.editor.parts,
        cost: cost(s.editor.parts as PartState[]),
        period: period(s.editor.parts as PartState[]),
        selected: s.editor.selected,
        focus: s.editor.focus,
        cursor: s.editor.cursor,
        drag: s.editor.drag
          ? (() => {
              const d = s.editor.drag;
              if (d.kind === "place")
                return {
                  kind: d.kind,
                  part: d.part,
                  index: d.index,
                  rotation: d.rotation,
                  length: d.length,
                  at: d.at,
                };
              if (d.kind === "move")
                return { kind: d.kind, part: d.part, from: d.from, at: d.at };
              return { kind: d.kind, part: d.part, end: d.end };
            })()
          : null,
        undoDepth: s.editor.undo.length,
        redoDepth: s.editor.redo.length,
      },
      sim: s.sim
        ? {
            status: s.sim.status,
            cycle: s.sim.cycle,
            fraction: s.sim.fraction,
            speed: s.sim.speed,
            motes: s.sim.motes.map((m) => ({ ...m, ...motePosition(s, m) })),
            filaments: s.sim.filaments,
            poses: s.sim.poses,
            grips: s.sim.grips,
            tallies: s.sim.tallies,
            area: s.sim.areaHexes.length,
            fault: s.sim.fault,
            metrics: s.sim.metrics,
          }
        : null,
      pointer: s.pointer,
      completion: s.completion,
      muted: s.muted,
      simTime: s.simTime,
    }),
    setCompletion: (
      s: DeepReadonly<OrreryState>,
      enabled: boolean,
    ): OrreryState => {
      insist(typeof enabled === "boolean", "invalid completion switch");
      return { ...s, completion: enabled } as OrreryState;
    },
    setScreen: (s: DeepReadonly<OrreryState>, name: Screen): OrreryState => {
      insist(
        ["title", "howto", "select", "editor"].includes(name),
        "invalid screen",
      );
      if (name === "editor") {
        needsChallenge(s);
        return { ...s, screen: name } as OrreryState;
      }
      return leave(s, name);
    },
    setMode: (s: DeepReadonly<OrreryState>, mode: Mode): OrreryState => {
      insist(mode === "campaign" || mode === "extras", "invalid mode");
      return { ...s, mode } as OrreryState;
    },
    setMenuIndex: (s: DeepReadonly<OrreryState>, n: number): OrreryState => {
      validIndex(n, menuItems(s).length);
      return s.screen === "select"
        ? ({ ...s, selectIndex: n } as OrreryState)
        : ({ ...s, menuIndex: n } as OrreryState);
    },
    setSelectIndex: (s: DeepReadonly<OrreryState>, n: number): OrreryState => {
      validIndex(n, course(s.mode).length);
      return { ...s, selectIndex: n } as OrreryState;
    },
    setHowtoPage: (s: DeepReadonly<OrreryState>, n: number): OrreryState => {
      validIndex(n, HOWTO_PAGES);
      return { ...s, howtoPage: n } as OrreryState;
    },
    setUnlockedCount: (
      s: DeepReadonly<OrreryState>,
      n: number,
    ): OrreryState => {
      insist(
        Number.isInteger(n) && n >= 1 && n <= CAMPAIGN.length,
        "invalid unlocked count",
      );
      return { ...s, unlockedCount: n } as OrreryState;
    },
    setSolved: (
      s: DeepReadonly<OrreryState>,
      mode: Mode,
      index: number,
      solved: boolean,
    ): OrreryState => {
      validIndex(index, course(mode).length);
      insist(typeof solved === "boolean", "invalid solved flag");
      const field = mode === "campaign" ? "campaignSolved" : "extrasSolved";
      return {
        ...s,
        [field]: solved
          ? [...new Set([...s[field], index])].sort((a, b) => a - b)
          : s[field].filter((i) => i !== index),
      } as OrreryState;
    },
    setRecord: record,
    setLast: (
      s: DeepReadonly<OrreryState>,
      mode: Mode,
      index: number,
    ): OrreryState => {
      validIndex(index, course(mode).length);
      return {
        ...s,
        [mode === "campaign" ? "campaignLast" : "extrasLast"]: index,
      } as OrreryState;
    },
    menuItemRect: menuRect,
    openChallenge: (
      s: DeepReadonly<OrreryState>,
      mode: Mode,
      index: number,
    ): OrreryState => open(s, mode, index),
    loadChallenge: (
      s: DeepReadonly<OrreryState>,
      challenge: Challenge,
    ): OrreryState => {
      validateChallenge(challenge);
      return open(s, s.mode, 0, challenge);
    },
    referenceSolution: (
      _s: DeepReadonly<OrreryState>,
      mode: Mode,
      index: number,
    ): Solution => {
      validIndex(index, course(mode).length);
      return mode === "campaign"
        ? CAMPAIGN_REFERENCES[index]
        : extrasReferences[index];
    },
    clearMachine: (s: DeepReadonly<OrreryState>): OrreryState => {
      needsChallenge(s);
      return { ...withParts(s, []), editor: emptyEditor() } as OrreryState;
    },
    placePart: (
      s: DeepReadonly<OrreryState>,
      kind: PartKind,
      q: number,
      r: number,
      rotation: number,
    ): OrreryState => {
      insist(
        kind !== "rise" && kind !== "set" && kind !== "track",
        "use dedicated placement",
      );
      return place(s, kind, q, r, rotation);
    },
    placeRise: (
      s: DeepReadonly<OrreryState>,
      index: number,
      q: number,
      r: number,
      rotation: number,
    ): OrreryState => {
      validIndex(index, needsChallenge(s).reagents.length);
      return place(s, "rise", q, r, rotation, index);
    },
    placeSet: (
      s: DeepReadonly<OrreryState>,
      index: number,
      q: number,
      r: number,
      rotation: number,
    ): OrreryState => {
      validIndex(index, needsChallenge(s).products.length);
      return place(s, "set", q, r, rotation, index);
    },
    placeTrack: (
      s: DeepReadonly<OrreryState>,
      q: number,
      r: number,
    ): OrreryState => place(s, "track", q, r, 0),
    extendTrack: (
      s: DeepReadonly<OrreryState>,
      id: number,
      q: number,
      r: number,
    ): OrreryState =>
      replacePart(s, id, (p) => {
        insist(p.kind === "track", "not a track");
        insist(!p.closed, "track is closed");
        return { ...p, cells: [...(p.cells ?? []), hex(q, r)] };
      }),
    closeTrack: (s: DeepReadonly<OrreryState>, id: number): OrreryState =>
      replacePart(s, id, (p) => {
        insist(p.kind === "track", "not a track");
        return { ...p, closed: true };
      }),
    removePart: (s: DeepReadonly<OrreryState>, id: number): OrreryState => {
      partById(s, id);
      needsChallenge(s);
      return withParts(
        s,
        s.editor.parts.filter((p) => p.id !== id) as PartState[],
      );
    },
    setPartRotation: (
      s: DeepReadonly<OrreryState>,
      id: number,
      rotation: number,
    ): OrreryState => {
      validIndex(rotation, 6);
      return replacePart(s, id, (p) => ({ ...p, rotation }));
    },
    setPartLength: (
      s: DeepReadonly<OrreryState>,
      id: number,
      length: number,
    ): OrreryState => {
      insist(
        Number.isInteger(length) && length >= 1 && length <= 3,
        "invalid length",
      );
      return replacePart(s, id, (p) => {
        insist(armKinds.includes(p.kind), `${p.kind} has no length`);
        return { ...p, length };
      });
    },
    movePart: (
      s: DeepReadonly<OrreryState>,
      id: number,
      q: number,
      r: number,
    ): OrreryState =>
      replacePart(s, id, (p) => {
        const d = hex(q - p.q, r - p.r);
        return { ...p, q, r, cells: p.cells?.map((h) => add(h, d)) ?? null };
      }),
    setTapeCell: setTape,
    loadSolution: (
      s: DeepReadonly<OrreryState>,
      solution: Solution,
    ): OrreryState => {
      needsChallenge(s);
      insist(solution && Array.isArray(solution.parts), "invalid solution");
      let next = { ...withParts(s, []), editor: emptyEditor() } as OrreryState;
      for (const sp of solution.parts) {
        next = place(next, sp.kind, sp.q, sp.r, sp.rotation, sp.index ?? null);
        const id = next.editor.parts[next.editor.parts.length - 1].id;
        if (sp.length !== undefined)
          next = replacePart(next, id, (p) => ({ ...p, length: sp.length! }));
        if (sp.kind === "track" && sp.cells)
          next = replacePart(next, id, (p) => ({
            ...p,
            cells: sp.cells!,
            closed: sp.closed ?? false,
          }));
        if (sp.tape)
          for (let i = 0; i < sp.tape.length; i++)
            next = setTape(next, id, i, sp.tape[i]);
      }
      return {
        ...next,
        editor: {
          ...next.editor,
          selected: null,
          cursor: null,
          undo: [],
          redo: [],
        },
      };
    },
    readSolution: (s: DeepReadonly<OrreryState>): Solution => {
      needsChallenge(s);
      return {
        parts: s.editor.parts.map((p) => ({
          kind: p.kind,
          q: p.q,
          r: p.r,
          rotation: p.rotation,
          ...(armKinds.includes(p.kind) ? { length: p.length } : {}),
          ...(p.kind === "track"
            ? { cells: p.cells ?? [], closed: p.closed ?? false }
            : {}),
          ...(p.index !== null ? { index: p.index } : {}),
          ...(p.tape ? { tape: p.tape } : {}),
        })),
      };
    },
    setSelected: (
      s: DeepReadonly<OrreryState>,
      id: number | null,
    ): OrreryState => {
      if (id !== null) partById(s, id);
      return withEditor(s, { selected: id });
    },
    setFocus: (s: DeepReadonly<OrreryState>, where: Focus): OrreryState => {
      insist(where === "field" || where === "tape", "invalid focus");
      return withEditor(s, { focus: where });
    },
    setCursor: (
      s: DeepReadonly<OrreryState>,
      id: number | null,
      col: number = 0,
    ): OrreryState => {
      if (id !== null) {
        insist(Number.isInteger(col) && col >= 0, "invalid column");
        insist(partById(s, id).tape, "part has no tape");
      }
      return withEditor(s, { cursor: id === null ? null : { part: id, col } });
    },
    pointerDown: (
      s: DeepReadonly<OrreryState>,
      x: number,
      y: number,
    ): OrreryState => applyPointer(s, "down", x, y),
    pointerMove: (
      s: DeepReadonly<OrreryState>,
      x: number,
      y: number,
    ): OrreryState => applyPointer(s, "move", x, y),
    pointerUp: (s: DeepReadonly<OrreryState>): OrreryState =>
      applyPointer(s, "up", s.pointer.x, s.pointer.y),
    startRun: start,
    stopRun: (s: DeepReadonly<OrreryState>): OrreryState => {
      needsSim(s);
      return { ...s, sim: null } as OrreryState;
    },
    setPaused: (s: DeepReadonly<OrreryState>, paused: boolean): OrreryState => {
      const sim = needsSim(s);
      insist(typeof paused === "boolean", "invalid paused flag");
      insist(
        sim.status === "running" || sim.status === "paused",
        "cannot pause ended run",
      );
      return withSim(s, { status: paused ? "paused" : "running" });
    },
    setSpeed: (s: DeepReadonly<OrreryState>, index: number): OrreryState => {
      validIndex(index, SPEEDS.length);
      return withSim(s, { speed: index });
    },
    setCycle: (s: DeepReadonly<OrreryState>, n: number): OrreryState => {
      insist(Number.isInteger(n) && n >= 0, "invalid cycle");
      return withSim(s, { cycle: n });
    },
    setTally: (
      s: DeepReadonly<OrreryState>,
      index: number,
      n: number,
    ): OrreryState => {
      const sim = needsSim(s);
      validIndex(index, needsChallenge(s).products.length);
      insist(Number.isInteger(n) && n >= 0, "invalid tally");
      const tallies = [...sim.tallies];
      tallies[index] = n;
      return withSim(s, { tallies });
    },
    clearMotes: (s: DeepReadonly<OrreryState>): OrreryState =>
      withSim(s, { motes: [], filaments: [], grips: [] }),
    spawnMote: (
      s: DeepReadonly<OrreryState>,
      q: number,
      r: number,
      type: MoteType,
    ): OrreryState => {
      const sim = needsSim(s);
      insist(MOTES.includes(type), "invalid mote type");
      insist(
        Number.isInteger(q) && Number.isInteger(r) && !at(sim, hex(q, r)),
        "occupied or invalid hex",
      );
      return withSim(s, {
        motes: [...sim.motes, { id: sim.nextMoteId, q, r, type, wheel: null }],
        nextMoteId: sim.nextMoteId + 1,
      });
    },
    removeMote: (s: DeepReadonly<OrreryState>, id: number): OrreryState => {
      const sim = needsSim(s);
      insist(
        sim.motes.some((m) => m.id === id),
        "no such mote",
      );
      return withSim(s, {
        motes: sim.motes.filter((m) => m.id !== id),
        filaments: sim.filaments.filter((f) => f.a !== id && f.b !== id),
        grips: sim.grips.filter((g) => g.mote !== id),
      });
    },
    linkMotes: (
      s: DeepReadonly<OrreryState>,
      a: number,
      b: number,
      weight: number,
    ): OrreryState => {
      const sim = needsSim(s),
        A = sim.motes.find((m) => m.id === a),
        B = sim.motes.find((m) => m.id === b);
      insist(
        A &&
          B &&
          A.wheel === null &&
          B.wheel === null &&
          adjacent(A, B) &&
          !sim.filaments.some(
            (f) => (f.a === a && f.b === b) || (f.a === b && f.b === a),
          ) &&
          (weight === 1 || weight === 3),
        "invalid filament",
      );
      return withSim(s, { filaments: [...sim.filaments, { a, b, weight }] });
    },
    unlinkMotes: (
      s: DeepReadonly<OrreryState>,
      a: number,
      b: number,
    ): OrreryState => {
      const sim = needsSim(s);
      insist(
        sim.filaments.some(
          (f) => (f.a === a && f.b === b) || (f.a === b && f.b === a),
        ),
        "no such filament",
      );
      return withSim(s, {
        filaments: sim.filaments.filter(
          (f) => !((f.a === a && f.b === b) || (f.a === b && f.b === a)),
        ),
      });
    },
    setGrip: (
      s: DeepReadonly<OrreryState>,
      id: number,
      spoke: number,
      mote: number,
    ): OrreryState => {
      const sim = needsSim(s),
        p = partById(s, id),
        pose = sim.poses.find((v) => v.part === id),
        m = sim.motes.find((v) => v.id === mote);
      insist(
        pose &&
          armKinds.includes(p.kind) &&
          Number.isInteger(spoke) &&
          spoke >= 0 &&
          spoke < 6 &&
          spokeDirections(p, pose).includes(spoke) &&
          m &&
          m.wheel === null &&
          same(cellsOf(p, pose)[spokeDirections(p, pose).indexOf(spoke)], m),
        "invalid grip",
      );
      return withSim(s, {
        grips: [
          ...sim.grips.filter((g) => !(g.part === id && g.spoke === spoke)),
          { part: id, spoke, mote },
        ],
      });
    },
    releaseGrip: (
      s: DeepReadonly<OrreryState>,
      id: number,
      spoke: number,
    ): OrreryState => {
      const sim = needsSim(s);
      const p = partById(s, id),
        pose = sim.poses.find((v) => v.part === id);
      insist(
        pose &&
          armKinds.includes(p.kind) &&
          spokeDirections(p, pose).includes(spoke),
        "invalid gripper spoke",
      );
      return withSim(s, {
        grips: sim.grips.filter((g) => !(g.part === id && g.spoke === spoke)),
      });
    },
    setPoseRotation: (
      s: DeepReadonly<OrreryState>,
      id: number,
      rotation: number,
    ): OrreryState => {
      validIndex(rotation, 6);
      return pose(s, id, (p) => ({ ...p, rotation }));
    },
    setPoseLength: (
      s: DeepReadonly<OrreryState>,
      id: number,
      length: number,
    ): OrreryState => {
      insist(
        Number.isInteger(length) && length >= 1 && length <= 3,
        "invalid pose length",
      );
      insist(
        armKinds.includes(partById(s, id).kind),
        "part has no live length",
      );
      return pose(s, id, (p) => ({ ...p, length }));
    },
    setPoseCell: (
      s: DeepReadonly<OrreryState>,
      id: number,
      q: number,
      r: number,
    ): OrreryState => {
      const track = s.editor.parts.find(
        (p) => p.kind === "track" && p.cells?.some((h) => same(h, hex(q, r))),
      );
      insist(track, "pose cell is not on a track");
      return pose(s, id, (p) => ({ ...p, cell: hex(q, r) }));
    },
  };
}
export type OrreryDebugApi = ReturnType<typeof makeDebug>;
export const game: Game<OrreryState, OrreryDebugApi> = {
  async initialize(api: InitApi<OrreryState>) {
    for (const action of ACTIONS)
      api.input.register(action, { keys: [...BINDINGS[action]] });
    const paths = [
      ...Object.values(MOTE_SPRITE_PATHS),
      ...Object.values(FILAMENT_SPRITE_PATHS),
      ...Object.values(SIGIL_GLYPH_PATHS),
      ...Object.values(INSTRUCTION_GLYPH_PATHS),
      ...Object.values(HUB_PATHS),
      ...Object.values(GRIPPER_PATHS),
      WHEEL_HUB_PATH,
      FIXTURE_MOUNT_PATH,
      ...Object.values(APERTURE_SHEETS).flatMap((dir) =>
        Array.from({ length: APERTURE_FRAMES }, (_, i) => `${dir}/${i}.png`),
      ),
    ];
    await Promise.all(
      paths.map(async (path) =>
        assetImages.set(path, await api.assets.loadImage(path)),
      ),
    );
    await Promise.all(
      Object.entries(PARTICLE_PATHS).map(async ([name, path]) =>
        assetParticles.set(
          name,
          JSON.parse(
            await (await api.assets.load(path)).text(),
          ) as ParticleSystem,
        ),
      ),
    );
    await Promise.all(
      Object.entries(CUE_PATHS).map(async ([name, path]) =>
        api.audio.load(name, path),
      ),
    );
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("challenge", (s) => s.challenge?.name ?? "none");
    api.diagnostics.register("parts", (s) => s.editor.parts.length);
    api.diagnostics.register("cost", (s) =>
      cost(s.editor.parts as PartState[]),
    );
    api.diagnostics.register("period", (s) =>
      period(s.editor.parts as PartState[]),
    );
    api.diagnostics.register("status", (s) => s.sim?.status ?? "editing");
    api.diagnostics.register("cycle", (s) => s.sim?.cycle ?? 0);
    api.diagnostics.register("motes", (s) => s.sim?.motes.length ?? 0);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register(
      "source",
      (s) => s.challengeRef?.mode ?? (s.challenge ? "custom" : "none"),
    );
    api.diagnostics.register("fraction", (s) => s.sim?.fraction ?? 0);
    api.diagnostics.register("speed", (s) => s.sim?.speed ?? 0);
    api.diagnostics.register(
      "tallies",
      (s) =>
        s.sim?.tallies
          .map((v) => `${v}/${s.challenge?.target ?? 0}`)
          .join(", ") ?? "none",
    );
    api.diagnostics.register("area", (s) => s.sim?.areaHexes.length ?? 0);
    api.diagnostics.register("fault", (s) => s.sim?.fault?.kind ?? "none");
    api.diagnostics.register("focus", (s) => s.editor.focus);
    api.diagnostics.register(
      "pointer",
      (s) => `${s.pointer.x.toFixed(1)}, ${s.pointer.y.toFixed(1)}`,
    );

    return [initial(), makeDebug()];
  },
  update(
    state: DeepReadonly<OrreryState>,
    api: UpdateApi,
    dt: number,
  ): OrreryState {
    if (!api.audio.looping(CUES.music)) api.audio.loop(CUES.music);
    let next = modifyInput(state, api);
    const before = next.sim?.status,
      oldTallies = next.sim?.tallies ?? [];
    next = advanceSim(next, dt);
    if (next.sim?.status === "faulted" && before !== "faulted") {
      api.audio.play(CUES.halt);
      const fault = next.sim.fault,
        mote = next.sim.motes.find((m) => fault?.motes.includes(m.id));
      const part = next.editor.parts.find((p) => fault?.parts.includes(p.id));
      const at = mote
        ? motePosition(next, mote)
        : part
          ? xy(part)
          : xy(hex(0, 0));
      raiseEffect("fault", at.x, at.y);
    }
    if (next.sim?.tallies.some((v, i) => v > oldTallies[i])) {
      api.audio.play(CUES.constellation);
      next.sim.tallies.forEach((v, i) => {
        if (v > oldTallies[i]) {
          const p = next.editor.parts.find(
            (p) => p.kind === "set" && p.index === i,
          );
          if (p) {
            const at = xy(p);
            raiseEffect("deliver", at.x, at.y);
          }
        }
      });
    }
    if (next.sim?.status === "complete" && before !== "complete") {
      next = updateProgress(next);
      api.audio.play(CUES.complete);
      const at = xy(hex(0, 0));
      raiseEffect("complete", at.x, at.y);
    }
    return { ...next, simTime: state.simTime + dt, muted: api.audio.muted() };
  },
  render(state: DeepReadonly<OrreryState>, api: RenderApi): void {
    renderScene(state, api.ctx);
    drawEffects(api.ctx, api.frame().lastDeltaMs / 1000);
  },
};
