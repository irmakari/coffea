import type { ReactNode } from 'react';
import { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme';

// Turkish coffee as the app's icon draws it: foam to the brim in a small
// white cup, on a saucer painted in the blues, turquoise and red of İznik
// tiles. Everything is laid out around the saucer's centre in the icon's own
// units and scaled down to the cup mark's grid at the end.
const RIM = 430;

const glaze = {
  cobalt: '#1F3F9C',
  navy: '#172B6E',
  turquoise: '#2B9AA6',
  red: '#B5432F',
  teal: '#2C7C78',
  coffee: '#8A5A2E',
  coffeeLight: '#B58045',
  coffeeDark: '#5E3A1B',
  bubble: '#33200F',
} as const;

type Point = [number, number];

// One decimal is plenty at this scale and keeps the paths short.
const n = (value: number) => Math.round(value * 10) / 10;

function polar(r: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  return [r * Math.cos(angle), r * Math.sin(angle)];
}

function turn([x, y]: Point, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}

function dot(cx: number, cy: number, r: number) {
  return `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

// An ellipse whose long side (`ry`) lies along `degrees`.
function oval(cx: number, cy: number, rx: number, ry: number, degrees: number) {
  const [dx, dy] = polar(ry, degrees);
  const arc = `A${ry} ${rx} ${n(degrees)} 1 0`;
  return `M${n(cx - dx)} ${n(cy - dy)}${arc} ${n(cx + dx)} ${n(cy + dy)}${arc} ${n(cx - dx)} ${n(cy - dy)}Z`;
}

// A closed shape of curves, drawn pointing up, set down at a distance from
// the centre and turned to point away from it.
function outward(points: Point[], r: number, degrees: number) {
  const [ox, oy] = polar(r, degrees);
  const [start, ...rest] = points.map((point) => {
    const [x, y] = turn(point, degrees + 90);
    return `${n(x + ox)} ${n(y + oy)}`;
  });
  return `M${start}C${rest.join(' ')}Z`;
}

const MOTIFS = 8;
const each = <T,>(count: number, draw: (index: number) => T) => Array.from({ length: count }, (_, index) => draw(index));

// A ring of beads round the rim, in two colours.
const BEADS = 56;
const beads = (odd: boolean) =>
  each(BEADS, (index) => index)
    .filter((index) => (index % 2 === 1) === odd)
    .map((index) => dot(...polar(RIM - 37, (index * 360) / BEADS), 6.5))
    .join('');

// The stem the flowers hang on, wandering in and out as it goes round.
const stem = `M${each(120, (index) => {
  const degrees = index * 3;
  const [x, y] = polar(331 + 12 * Math.sin((degrees * 16 * Math.PI) / 180), degrees);
  return `${n(x)} ${n(y)}`;
}).join('L')}Z`;

// Eight-petalled flowers, with a tulip between each pair.
const flowers = each(MOTIFS, (index) => polar(331, index * 45));
const petals = flowers
  .map(([x, y]) => each(8, (petal) => oval(x + polar(22, petal * 45)[0], y + polar(22, petal * 45)[1], 11.5, 18, petal * 45)).join(''))
  .join('');
const eyes = (r: number) => flowers.map(([x, y]) => dot(x, y, r)).join('');

const tulipShape: Point[] = [[0, 4], [-23, -6], [-25, -32], [-19, -52], [-12, -43], [-7, -42], [0, -62], [7, -42], [12, -43], [19, -52], [25, -32], [23, -6], [0, 4]];
const tulipLight: Point[] = [[0, -8], [-6, -18], [-6, -32], [0, -46], [6, -32], [6, -18], [0, -8]];
const leaf: Point[] = ([[0, 6], [12, -8], [32, -9], [42, 4], [28, 9], [12, 12], [0, 6]] as Point[]).map((point) => turn(point, -22));
const mirrored = leaf.map(([x, y]): Point => [-x, y]);

const between = (shape: Point[]) => each(MOTIFS, (index) => outward(shape, 303, index * 45 + 22.5)).join('');
const tulips = between(tulipShape);
const tulipLights = between(tulipLight);
const leaves = between(leaf) + between(mirrored);

const WELL_DOTS = 44;
const wellDots = each(WELL_DOTS, (index) => dot(...polar(278, (index * 360) / WELL_DOTS), 4)).join('');

// Paler patches where the foam is thickest: x, y, two radii and a tilt.
const foam = [
  [-78, -31, 44, 21, 91], [41, 94, 34, 24, 143], [-11, 31, 24, 27, 125], [26, -3, 45, 24, 111],
  [42, 4, 35, 15, 34], [53, 10, 33, 21, 152], [-59, -72, 34, 25, 82], [59, -1, 46, 27, 127],
  [8, 64, 29, 15, 138], [43, -62, 31, 29, 153], [5, 19, 44, 22, 176], [68, 34, 37, 26, 49],
  [-16, 28, 45, 26, 21], [44, 32, 23, 27, 32], [-93, 32, 27, 26, 24], [82, 74, 32, 17, 49],
]
  .map(([x, y, rx, ry, tilt]) => oval(x, y, ry, rx, tilt))
  .join('');

// The bubbles gather to one side, as they do when the cup is set down.
const bubbles: [number, number, number][] = [
  [60, -4, 5], [88, 10, 4], [99, -120, 4], [77, 78, 8], [100, -20, 4], [80, -60, 6], [116, 85, 7],
  [108, -65, 8], [128, 34, 8], [49, 62, 7], [47, -59, 7], [-7, 26, 5], [67, 40, 7], [32, 12, 6],
  [49, 20, 4], [53, -38, 7], [145, -42, 7], [111, 5, 7], [38, -17, 10], [126, -74, 4], [-62, -66, 5],
  [29, 49, 13], [73, -33, 6], [11, -80, 7], [116, -19, 6], [60, -79, 10], [80, -94, 6], [-14, -31, 6],
  [69, 18, 7], [-6, 70, 10], [104, 111, 7], [87, 43, 5], [34, -118, 4], [91, -9, 4],
];
const bubbleDots = bubbles.map(([x, y, r]) => dot(x, y, r)).join('');
const bubbleLights = bubbles.map(([x, y, r]) => dot(x - r * 0.3, y - r * 0.32, n(r * 0.26))).join('');

export const turkishCoffee: ReactNode = (
  <G transform={`translate(60 60) scale(${56 / RIM})`}>
    <Defs>
      <RadialGradient id="turkish-coffee" cx="58%" cy="46%" r="62%">
        <Stop offset={0} stopColor="#9C6A35" />
        <Stop offset={0.7} stopColor={glaze.coffee} />
        <Stop offset={1} stopColor="#70451F" />
      </RadialGradient>
    </Defs>

    <Circle r={RIM} fill={palette.softWhite} />
    <Circle r={RIM - 9} fill="none" stroke={glaze.red} strokeWidth={9} />
    <Circle r={RIM - 24} fill="none" stroke={glaze.navy} strokeWidth={3} />
    <Circle r={RIM - 50} fill="none" stroke={glaze.navy} strokeWidth={3} />
    <Path d={beads(false)} fill={glaze.cobalt} />
    <Path d={beads(true)} fill={glaze.turquoise} />

    <Path d={stem} fill="none" stroke={glaze.teal} strokeWidth={5} strokeLinejoin="round" />
    <Path d={petals} fill={glaze.cobalt} />
    <Path d={eyes(13)} fill={palette.softWhite} />
    <Path d={eyes(9.5)} fill={glaze.turquoise} />
    <Path d={eyes(4)} fill={glaze.red} />
    <Path d={leaves} fill={glaze.teal} />
    <Path d={tulips} fill={glaze.red} />
    <Path d={tulipLights} fill={palette.softWhite} fillOpacity={0.5} />

    {/* The well the cup sits in. */}
    <Circle r={266} fill="none" stroke={glaze.cobalt} strokeWidth={6} />
    <Path d={wellDots} fill={glaze.navy} />

    {/* The cup, its handle towards ten o'clock, and the shadow it casts. */}
    <Circle cx={12} cy={18} r={240} fill={palette.espresso} fillOpacity={0.14} />
    <G rotation={204}>
      <Rect x={160} y={-38} width={232} height={76} rx={36} fill={palette.softWhite} stroke={palette.subtleBorder} strokeWidth={4} />
    </G>
    <Circle r={236} fill={palette.softWhite} stroke={palette.subtleBorder} strokeWidth={4} />

    <Circle r={208} fill="url(#turkish-coffee)" />
    {/* The darker, wetter edge on the side away from the light. */}
    <Path d="M-159 -134A208 208 0 0 0 -125 166A189 189 0 0 1 -159 -134Z" fill={glaze.coffeeDark} fillOpacity={0.55} />
    <Circle r={203} fill="none" stroke={glaze.coffeeLight} strokeOpacity={0.7} strokeWidth={7} />
    <Path d={foam} fill={glaze.coffeeLight} fillOpacity={0.28} />
    <Path d={bubbleDots} fill={glaze.bubble} fillOpacity={0.88} />
    <Path d={bubbleLights} fill={palette.softWhite} fillOpacity={0.7} />
  </G>
);
