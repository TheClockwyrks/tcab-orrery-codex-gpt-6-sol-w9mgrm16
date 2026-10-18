import type { Challenge } from "./game";
export const EXTRAS: readonly Challenge[] = [
  {
    name: "First Light",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "sol",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "sol",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    permitted: ["arm"],
    target: 6,
  },
  {
    name: "Twin Moons",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "luna",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "luna",
          },
          {
            q: 1,
            r: 0,
            type: "luna",
          },
        ],
        filaments: [
          {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 1,
          },
        ],
        repeat: null,
      },
    ],
    permitted: ["arm", "bind"],
    target: 6,
  },
  {
    name: "Waning Crescent",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "comet",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "dust",
          },
          {
            q: 1,
            r: 0,
            type: "dust",
          },
        ],
        filaments: [
          {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 1,
          },
        ],
        repeat: null,
      },
    ],
    permitted: ["arm", "wane", "bind"],
    target: 6,
  },
  {
    name: "Mirrorwright",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "dust",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "nova",
          },
          {
            q: 1,
            r: 0,
            type: "comet",
          },
        ],
        filaments: [
          {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 1,
          },
        ],
        repeat: null,
      },
    ],
    permitted: ["arm", "wheel", "mirror", "bind"],
    target: 6,
  },
  {
    name: "Ascendant",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "mercury",
          },
        ],
        filaments: [],
        repeat: null,
      },
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "saturn",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "jupiter",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    permitted: ["arm", "ascend"],
    target: 6,
  },
  {
    name: "Great Conjunction",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "venus",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "luna",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    permitted: ["arm", "conjoin"],
    target: 6,
  },
  {
    name: "Syzygy",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "dust",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "umbra",
          },
          {
            q: 1,
            r: 0,
            type: "lumen",
          },
        ],
        filaments: [
          {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 1,
          },
        ],
        repeat: null,
      },
    ],
    permitted: ["arm", "eclipse", "bind"],
    target: 6,
  },
  {
    name: "Aetherfall",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "nebula",
          },
        ],
        filaments: [],
        repeat: null,
      },
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "comet",
          },
        ],
        filaments: [],
        repeat: null,
      },
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "nova",
          },
        ],
        filaments: [],
        repeat: null,
      },
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "meteor",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "aether",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    permitted: ["arm", "biarm", "confluence"],
    target: 6,
  },
  {
    name: "Trine",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "nova",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "nova",
          },
          {
            q: 1,
            r: 0,
            type: "nova",
          },
        ],
        filaments: [
          {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 3,
          },
        ],
        repeat: null,
      },
    ],
    permitted: ["arm", "triune"],
    target: 6,
  },
  {
    name: "Procession",
    reagents: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "luna",
          },
        ],
        filaments: [],
        repeat: null,
      },
    ],
    products: [
      {
        motes: [
          {
            q: 0,
            r: 0,
            type: "luna",
          },
        ],
        filaments: [],
        repeat: {
          vector: {
            q: 1,
            r: 0,
          },
          link: {
            a: {
              q: 0,
              r: 0,
            },
            b: {
              q: 1,
              r: 0,
            },
            weight: 1,
          },
        },
      },
    ],
    permitted: ["arm", "piston", "track", "bind"],
    target: 6,
  },
] as const;
