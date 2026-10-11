// Color schemes for the thumbnails, built from the framework brand colors:
// Angular #dd0031, React #4A7DFF (also the Kritzel primary) and Vue #42b883.
// Every scheme is a function of the framework the seed picked (and a seeded rand), never of the post itself,
// so a seed alone reproduces the image. A palette has these parts, all consumed by painting.mjs:
//   base  — the mesh gradient's background color (rgb),
//   mesh  — blob color specs for the mesh gradient: { L: [min, max], C, h }, cycled per blob,
//   paint — weighted colors for paint dabs and squeegee loads: [{ c: rgb, w }],
//   label — optional { color, shade } for the frame text and the darkening gradient behind it.
import { oklch, hexToRgb } from './lib.mjs';

// OKLCH of the brand colors (measured from the hex values).
export const FRAMEWORKS = {
  angular: { L: 0.567, C: 0.228, h: 22.2 },
  react: { L: 0.625, C: 0.201, h: 265.0 },
  vue: { L: 0.703, C: 0.132, h: 160.4 },
};

const rgb = (L, C, h) => hexToRgb(oklch(L, C, ((h % 360) + 360) % 360));

// Tints and shades that stay in a brand color's family.
function family({ L, C, h }) {
  return {
    base: rgb(L, C, h),
    deep: rgb(L * 0.62, C * 0.85, h + 6),
    light: rgb(Math.min(0.86, L + 0.18), C * 0.6, h - 6),
    pale: rgb(0.95, 0.03, h),
    dark: rgb(0.24, C * 0.3, h),
  };
}

const NAVY = rgb(0.3, 0.05, 258); // close to Vue's #35495e; a neutral dark that sits with all three
const others = (lead) => Object.keys(FRAMEWORKS).filter((k) => k !== lead);

export const SCHEMES = {
  // The original look: one hue family rotated around the framework hue, with a complementary accent.
  current(framework, rand) {
    const HUES = { react: 264, angular: 22, vue: 160 };
    const hue = HUES[framework] + (rand() - 0.5) * 16;
    const h = (d) => hue + d;
    return {
      base: rgb(0.5, 0.19, h(28)),
      mesh: [-48, -24, 0, 24, 48].map((d) => ({ L: [0.42, 0.87], C: 0.185, h: h(d) })),
      paint: [
        [rgb(0.56, 0.19, h(0)), 3],
        [rgb(0.4, 0.16, h(25)), 2],
        [rgb(0.76, 0.12, h(-15)), 2],
        [rgb(0.88, 0.17, h(190)), 1.6],
        [rgb(0.62, 0.21, h(130)), 1.2],
        [rgb(0.95, 0.02, h(0)), 1.3],
        [rgb(0.66, 0.11, h(-80)), 1],
        [rgb(0.24, 0.06, h(0)), 0.8],
      ].map(([c, w]) => ({ c, w })),
    };
  },

  // All three frameworks in every image, equally weighted, on a navy ground.
  trio() {
    const f = Object.fromEntries(Object.entries(FRAMEWORKS).map(([k, v]) => [k, family(v)]));
    const { react: r, angular: a, vue: v } = FRAMEWORKS;
    return {
      base: NAVY,
      mesh: [r, a, v, { ...r, L: r.L * 0.7 }, { ...v, L: v.L * 0.75 }].map((c) => ({ L: [c.L - 0.12, c.L + 0.08], C: c.C, h: c.h })),
      paint: [
        ...['react', 'angular', 'vue'].flatMap((k) => [
          { c: f[k].base, w: 2 },
          { c: f[k].light, w: 0.8 },
          { c: f[k].deep, w: 0.8 },
        ]),
        { c: f.react.pale, w: 1 },
        { c: NAVY, w: 0.8 },
      ],
    };
  },

  // The seed's framework leads; the other two appear as accents.
  lead(lead) {
    const L = FRAMEWORKS[lead];
    const f = family(L);
    return {
      base: f.deep,
      mesh: [L, { ...L, L: L.L * 0.65 }, { ...L, L: Math.min(0.85, L.L + 0.15), C: L.C * 0.6 }, L, { ...L, L: L.L * 0.8 }].map(
        (c) => ({ L: [c.L - 0.1, c.L + 0.08], C: c.C, h: c.h }),
      ),
      paint: [
        { c: f.base, w: 3 },
        { c: f.deep, w: 2 },
        { c: f.light, w: 2 },
        { c: f.pale, w: 1.2 },
        { c: f.dark, w: 0.8 },
        ...others(lead).map((k) => ({ c: family(FRAMEWORKS[k]).base, w: 0.9 })),
      ],
    };
  },

  // Only the seed's framework family: tints, shades, a pale and a dark.
  mono(lead) {
    const L = FRAMEWORKS[lead];
    const f = family(L);
    return {
      base: f.deep,
      mesh: [L, { ...L, L: L.L * 0.6 }, { ...L, L: Math.min(0.88, L.L + 0.2), C: L.C * 0.5 }, L, { ...L, L: L.L * 0.8 }].map(
        (c) => ({ L: [c.L - 0.1, c.L + 0.08], C: c.C, h: c.h }),
      ),
      paint: [
        { c: f.base, w: 3 },
        { c: f.deep, w: 2.2 },
        { c: f.light, w: 2 },
        { c: f.pale, w: 1.3 },
        { c: f.dark, w: 1.2 },
      ],
    };
  },

  // The trio at night: deep navy and dark shades dominate, the brand colors glow through.
  night(lead) {
    const fam = Object.fromEntries(Object.entries(FRAMEWORKS).map(([k, v]) => [k, family(v)]));
    return {
      base: rgb(0.2, 0.04, 260),
      mesh: [
        { L: [0.22, 0.32], C: 0.06, h: 260 },
        { L: [0.35, 0.5], C: FRAMEWORKS[lead].C * 0.8, h: FRAMEWORKS[lead].h },
        { L: [0.2, 0.3], C: 0.05, h: 250 },
        ...others(lead).map((k) => ({ L: [0.3, 0.42], C: FRAMEWORKS[k].C * 0.6, h: FRAMEWORKS[k].h })),
      ],
      paint: [
        { c: rgb(0.2, 0.04, 260), w: 2.5 },
        { c: NAVY, w: 2 },
        { c: fam[lead].base, w: 2 },
        ...others(lead).map((k) => ({ c: fam[k].base, w: 1.2 })),
        ...Object.values(fam).map((x) => ({ c: x.deep, w: 1 })),
        { c: fam[lead].light, w: 0.6 },
      ],
    };
  },

  // Pastel trio: light tints of all three on a pale ground, an airy editorial look.
  pastel(lead) {
    const fam = Object.fromEntries(Object.entries(FRAMEWORKS).map(([k, v]) => [k, family(v)]));
    const tint = (k, L = 0.8, k2 = 0.55) => rgb(L, FRAMEWORKS[k].C * k2, FRAMEWORKS[k].h);
    return {
      base: rgb(0.9, 0.03, FRAMEWORKS[lead].h),
      mesh: ['react', 'angular', 'vue', lead, lead].map((k) => ({ L: [0.78, 0.9], C: FRAMEWORKS[k].C * 0.45, h: FRAMEWORKS[k].h })),
      paint: [
        { c: tint(lead), w: 3 },
        ...others(lead).map((k) => ({ c: tint(k), w: 1.6 })),
        ...Object.keys(FRAMEWORKS).map((k) => ({ c: fam[k].base, w: 0.5 })),
        { c: rgb(0.97, 0.01, 260), w: 2 },
        { c: tint(lead, 0.65, 0.8), w: 1 },
      ],
      label: { color: '#1b2030', shade: 0 },
    };
  },
};

export function paletteFor(framework, rand, scheme = 'current') {
  return SCHEMES[scheme](framework, rand);
}
