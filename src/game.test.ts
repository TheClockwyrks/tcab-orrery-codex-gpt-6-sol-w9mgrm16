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
});
