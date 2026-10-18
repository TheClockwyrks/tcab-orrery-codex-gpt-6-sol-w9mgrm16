import { describe, expect, it } from "vitest";
import type { InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import { game, type OrreryState } from "./game";

async function fixture() {
  const api = {
    input: { register() {} },
    assets: {
      loadImage: async () => ({}) as ImageBitmap,
      load: async () => new Blob(["{}"]),
    },
    audio: { load: async () => {} },
    diagnostics: { register() {} },
  } as unknown as InitApi<OrreryState>;
  return game.initialize(api);
}
const noInput = {
  input: { pressed: () => false, value: () => 0, pointerSamples: () => [] },
  audio: {
    looping: () => true,
    loop() {},
    muted: () => false,
    setMuted() {},
    play() {},
  },
} as unknown as UpdateApi;

describe("Orrery", () => {
  it("opens and solves the campaign opener with its reference machine", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.loadSolution(
      state,
      debug.referenceSolution(state, "campaign", 0),
    );
    state = debug.startRun(state);
    for (let i = 0; i < 50 && state.sim?.status === "running"; i++) {
      state = game.update(state, noInput, 1 / 3);
    }
    expect(state.sim?.status).toBe("complete");
    expect(state.sim?.tallies[0]).toBeGreaterThanOrEqual(6);
  });
  it("runs every shipped campaign reference without fault", async () => {
    const [initial, debug] = await fixture();
    for (let index = 0; index < 8; index++) {
      let state = debug.openChallenge(initial, "campaign", index);
      state = debug.loadSolution(
        state,
        debug.referenceSolution(state, "campaign", index),
      );
      state = debug.startRun(state);
      for (let i = 0; i < 600 && state.sim?.status === "running"; i++) {
        state = game.update(state, noInput, 1 / 3);
      }
      expect(state.sim?.status, `challenge ${index + 1}`).toBe("complete");
    }
  });
  it("rejects overlapping sigils and preserves the machine", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.placeRise(state, 0, 0, 0, 0);
    expect(() => debug.placeSet(state, 0, 0, 0, 0)).toThrow(/rule 2/);
    expect(state.editor.parts).toHaveLength(1);
  });
  it("faults at the first sampled collision during a swing", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.placePart(state, "arm", 0, 0, 0);
    const arm = state.editor.parts[0].id;
    state = debug.setTapeCell(state, arm, 0, "rotate-cw");
    state = debug.startRun(state);
    state = debug.spawnMote(state, 1, 0, "dust");
    const carried = state.sim!.motes.slice(-1)[0]!.id;
    state = debug.spawnMote(state, 1, 1, "dust");
    state = debug.setGrip(state, arm, 0, carried);
    state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.fault?.kind).toBe("collision");
    expect(state.sim?.fraction).toBe(3 / 8);
  });
  it("transmutes at a boundary and preserves pointer edit history", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.placePart(state, "wane", 0, 0, 0);
    state = debug.startRun(state);
    state = debug.spawnMote(state, 0, 0, "comet");
    state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.motes.slice(-1)[0]?.type).toBe("dust");
    state = debug.stopRun(state);
    state = debug.clearMachine(state);
    state = debug.pointerDown(state, 70, 100);
    state = debug.pointerMove(state, 664, 304);
    state = debug.pointerUp(state);
    expect(state.editor.parts[0].kind).toBe("rise");
    expect(state.editor.undo).toHaveLength(1);
  });
  it("accepts a linked repeating constellation by its copy count", async () => {
    const [initial, debug] = await fixture();
    const single = {
      motes: [{ q: 0, r: 0, type: "luna" as const }],
      filaments: [],
      repeat: null,
    };
    let state = debug.loadChallenge(initial, {
      name: "Chain",
      reagents: [single],
      products: [
        {
          ...single,
          repeat: {
            vector: { q: 1, r: 0 },
            link: { a: { q: 0, r: 0 }, b: { q: 1, r: 0 }, weight: 1 },
          },
        },
      ],
      permitted: ["arm", "bind"],
      target: 6,
    });
    state = debug.placeSet(state, 0, 0, 0, 0);
    state = debug.startRun(state);
    state = debug.spawnMote(state, 0, 0, "luna");
    const a = state.sim!.motes.slice(-1)[0].id;
    state = debug.spawnMote(state, 1, 0, "luna");
    const b = state.sim!.motes.slice(-1)[0].id;
    state = debug.linkMotes(state, a, b, 1);
    state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.tallies[0]).toBe(2);
  });
  it("faults when two holders impose different motion", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.placePart(state, "arm", -1, 0, 0);
    const a = state.editor.parts.slice(-1)[0].id;
    state = debug.placePart(state, "arm", 2, 0, 3);
    const b = state.editor.parts.slice(-1)[0].id;
    state = debug.setTapeCell(state, a, 0, "rotate-cw");
    state = debug.startRun(state);
    state = debug.spawnMote(state, 0, 0, "dust");
    const first = state.sim!.motes.slice(-1)[0].id;
    state = debug.spawnMote(state, 1, 0, "dust");
    const second = state.sim!.motes.slice(-1)[0].id;
    state = debug.linkMotes(state, first, second, 1);
    state = debug.setGrip(state, a, 0, first);
    state = debug.setGrip(state, b, 3, second);
    state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.fault?.kind).toBe("torn");
    expect(state.sim?.fault?.parts).toEqual([a, b]);
  });
  it("reaches the same cycle and field across frame partitions", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "campaign", 0);
    state = debug.loadSolution(
      state,
      debug.referenceSolution(state, "campaign", 0),
    );
    state = debug.startRun(state);
    const once = game.update(state, noInput, 1);
    let sliced = state;
    for (let i = 0; i < 60; i++) sliced = game.update(sliced, noInput, 1 / 60);
    expect(sliced.sim?.cycle).toBe(once.sim?.cycle);
    expect(sliced.sim?.motes).toEqual(once.sim?.motes);
    expect(sliced.sim?.filaments).toEqual(once.sim?.filaments);
    expect(sliced.sim?.tallies).toEqual(once.sim?.tallies);
  });
  it("solves Twin Moons with two staged arms", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 1);
    state = debug.loadSolution(state, {
      parts: [
        { kind: "rise", index: 0, q: 1, r: 1, rotation: 0 },
        { kind: "bind", q: 0, r: 0, rotation: 0 },
        { kind: "set", index: 0, q: -1, r: 0, rotation: 1 },
        {
          kind: "arm",
          q: 0,
          r: 1,
          rotation: 0,
          tape: [
            "grab",
            "rotate-ccw",
            "rotate-ccw",
            "drop",
            "rotate-cw",
            "rotate-cw",
            "grab",
            "rotate-ccw",
            "drop",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: 0,
          r: -1,
          rotation: 1,
          tape: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("solves Waning Crescent through a conversion relay", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 2);
    const prod = [
      null,
      null,
      null,
      "grab",
      "rotate-ccw",
      "rotate-ccw",
      "drop",
      "rotate-cw",
      "rotate-cw",
      "grab",
      "rotate-ccw",
      "drop",
      "rotate-cw",
    ] as const;
    const trans = [
      ...Array(12).fill(null),
      "grab",
      "rotate-cw",
      "drop",
      "rotate-ccw",
    ] as const;
    state = debug.loadSolution(state, {
      parts: [
        { kind: "rise", index: 0, q: 2, r: 1, rotation: 0 },
        { kind: "wane", q: 1, r: 1, rotation: 0 },
        { kind: "bind", q: 0, r: 0, rotation: 0 },
        { kind: "set", index: 0, q: -1, r: 0, rotation: 1 },
        {
          kind: "arm",
          q: 2,
          r: 0,
          rotation: 1,
          tape: [
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        { kind: "arm", q: 0, r: 1, rotation: 0, tape: prod },
        { kind: "arm", q: 0, r: -1, rotation: 1, tape: trans },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("solves Ascendant by feeding both seats and collecting the crown", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 4);
    state = debug.loadSolution(state, {
      parts: [
        { kind: "rise", index: 0, q: 1, r: 1, rotation: 0 },
        { kind: "rise", index: 1, q: 2, r: -1, rotation: 0 },
        { kind: "ascend", q: 0, r: 0, rotation: 0 },
        { kind: "set", index: 0, q: 1, r: -1, rotation: 0 },
        {
          kind: "arm",
          q: 0,
          r: 1,
          rotation: 0,
          tape: [
            "grab",
            "rotate-ccw",
            "rotate-ccw",
            "drop",
            "rotate-cw",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: 1,
          r: -1,
          rotation: 0,
          tape: [
            null,
            null,
            null,
            null,
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        {
          kind: "arm",
          q: 2,
          r: -1,
          rotation: 2,
          tape: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("solves Great Conjunction by merging paired planets", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 5);
    state = debug.loadSolution(state, {
      parts: [
        { kind: "rise", index: 0, q: 1, r: 1, rotation: 0 },
        { kind: "conjoin", q: 0, r: 0, rotation: 0 },
        { kind: "set", index: 0, q: -1, r: 2, rotation: 0 },
        {
          kind: "arm",
          q: 0,
          r: 1,
          rotation: 0,
          tape: [
            "grab",
            "rotate-ccw",
            "rotate-ccw",
            "drop",
            "rotate-cw",
            "rotate-cw",
            "grab",
            "rotate-ccw",
            "drop",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: -1,
          r: 1,
          rotation: 0,
          tape: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("runs the authored Extras references", async () => {
    const [initial, debug] = await fixture();
    for (const index of Array.from({ length: 10 }, (_, i) => i)) {
      let state = debug.openChallenge(initial, "extras", index);
      state = debug.loadSolution(
        state,
        debug.referenceSolution(state, "extras", index),
      );
      state = debug.startRun(state);
      for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
        state = game.update(state, noInput, 1 / 3);
      expect(state.sim?.status, `Extras ${index + 1}`).toBe("complete");
    }
  });
  it("solves Aetherfall with four timed essence feeds", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 7);
    const tape = (start: number) => [
      ...Array(start).fill(null),
      "grab",
      "rotate-ccw",
      "drop",
      "rotate-cw",
    ];
    state = debug.loadSolution(state, {
      parts: [
        { kind: "confluence", q: 0, r: 0, rotation: 0 },
        { kind: "set", index: 0, q: 1, r: -2, rotation: 0 },
        { kind: "rise", index: 0, q: 2, r: 0, rotation: 0 },
        { kind: "rise", index: 1, q: -1, r: 2, rotation: 0 },
        { kind: "rise", index: 2, q: -2, r: 1, rotation: 0 },
        { kind: "rise", index: 3, q: 1, r: -1, rotation: 0 },
        { kind: "arm", q: 1, r: 1, rotation: 5, tape: tape(0) },
        { kind: "arm", q: -1, r: 1, rotation: 1, tape: tape(4) },
        { kind: "arm", q: -2, r: 0, rotation: 1, tape: tape(8) },
        {
          kind: "arm",
          q: 1,
          r: -2,
          rotation: 1,
          tape: [
            ...Array(12).fill(null),
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        {
          kind: "arm",
          q: 1,
          r: -1,
          rotation: 2,
          tape: [
            ...Array(15).fill(null),
            "grab",
            "rotate-cw",
            "rotate-cw",
            "drop",
            "rotate-ccw",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 300 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("solves Syzygy with an eclipse, relays, and a final bind", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 6);
    state = debug.loadSolution(state, {
      parts: [
        { kind: "rise", index: 0, q: 2, r: -1, rotation: 0 },
        { kind: "eclipse", q: 0, r: 0, rotation: 0 },
        { kind: "bind", q: 1, r: 1, rotation: 5 },
        { kind: "set", index: 0, q: 3, r: 0, rotation: 1 },
        {
          kind: "arm",
          q: 1,
          r: -1,
          rotation: 0,
          tape: [
            "grab",
            "rotate-cw",
            "rotate-cw",
            "drop",
            "rotate-ccw",
            "rotate-ccw",
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        {
          kind: "arm",
          q: 0,
          r: 2,
          rotation: 4,
          tape: [
            ...Array(15).fill(null),
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        {
          kind: "arm",
          q: 2,
          r: -1,
          rotation: 3,
          tape: [
            ...Array(9).fill(null),
            "grab",
            "rotate-ccw",
            "rotate-ccw",
            "drop",
            "rotate-cw",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: 2,
          r: 1,
          rotation: 3,
          tape: [
            ...Array(18).fill(null),
            "grab",
            "rotate-cw",
            "rotate-cw",
            "drop",
            "rotate-ccw",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 400 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
  it("solves Mirrorwright using the wheel's two essence fixtures", async () => {
    const [initial, debug] = await fixture();
    let state = debug.openChallenge(initial, "extras", 3);
    state = debug.loadSolution(state, {
      parts: [
        { kind: "wheel", q: 1, r: -1, rotation: 0 },
        { kind: "mirror", q: 0, r: 0, rotation: 1 },
        { kind: "mirror", q: 1, r: 0, rotation: 1 },
        { kind: "rise", index: 0, q: -1, r: 2, rotation: 0 },
        { kind: "bind", q: 0, r: 2, rotation: 0 },
        { kind: "set", index: 0, q: 1, r: 3, rotation: 2 },
        {
          kind: "arm",
          q: -1,
          r: 1,
          rotation: 1,
          tape: ["grab", "rotate-ccw", "drop", "rotate-cw"],
        },
        {
          kind: "arm",
          q: 0,
          r: 1,
          rotation: 2,
          tape: [
            null,
            null,
            null,
            null,
            "grab",
            "rotate-ccw",
            "rotate-ccw",
            "drop",
            "rotate-cw",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: -1,
          r: 2,
          rotation: 5,
          tape: [
            ...Array(12).fill(null),
            "grab",
            "rotate-cw",
            "drop",
            "rotate-ccw",
          ],
        },
        {
          kind: "arm",
          q: 2,
          r: 1,
          rotation: 3,
          tape: [
            ...Array(9).fill(null),
            "grab",
            "rotate-ccw",
            "drop",
            "rotate-cw",
          ],
        },
        {
          kind: "arm",
          q: 0,
          r: 3,
          rotation: 4,
          tape: [
            ...Array(15).fill(null),
            "grab",
            "rotate-cw",
            "rotate-cw",
            "drop",
            "rotate-ccw",
            "rotate-ccw",
          ],
        },
      ],
    });
    state = debug.startRun(state);
    for (let i = 0; i < 400 && state.sim?.status === "running"; i++)
      state = game.update(state, noInput, 1 / 3);
    expect(state.sim?.status).toBe("complete");
  });
});
