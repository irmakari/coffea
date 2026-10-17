import type { ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme';

import { turkishCoffee } from './turkishCoffee';

type CupMarkProps = {
  size?: number;
  // A coffee type key (see `coffeeTypes`) or the name of any other coffee,
  // which borrows the nearest drawing. Unknown or missing draws the plain cup.
  drink?: string | null;
  // A tan disc under the drawing, so it stands out where it sits on white.
  tan?: boolean;
};

type Vessel = 'cup' | 'demitasse' | 'mug';

// Hot drinks are a vessel seen from above. Iced ones are a drawing of their
// own, since ice and a straw only read from the side, and so is Turkish
// coffee, which comes on a saucer no other drink has.
type Drink = { vessel: Vessel; liquid: string; art?: ReactNode } | { scene: ReactNode };

const ink = {
  crema: '#B07A4F',
  cremaEdge: '#7A4E33',
  milkCoffee: '#B88A66',
  flatWhite: '#A9784F',
  foam: '#F1E6D8',
  foamEdge: '#A87C5A',
  cocoa: '#7E5038',
  chocolate: '#6B4232',
  drizzle: '#3A2219',
  icedLatte: '#A9744C',
  icedLatteSurface: '#C89B74',
  coldBrew: '#3B2620',
  coldBrewDepth: '#5A3A2C',
  coldBrewSurface: '#4A2E22',
  matcha: '#8DA65B',
  matchaFoam: '#DCE5BE',
  tea: '#A2421C',
  teaGlow: '#C9672F',
  greenTea: '#B3A548',
  herbalTea: '#C98A3C',
} as const;

// Tea seen from above: clear amber with the light caught at its edge.
const teaShine = (
  <>
    <Circle cx={60} cy={60} r={22} fill="none" stroke={ink.teaGlow} strokeWidth={6} strokeOpacity={0.55} />
    <Path d="M49 53a13 13 0 0 1 9-8" fill="none" stroke="#F3D3A8" strokeWidth={2.5} strokeLinecap="round" />
  </>
);

const heart = (
  <Path
    d="M60 74C45 63 47 50 55.5 50.5C58 50.7 60 53 60 55.5C60 53 62 50.7 64.5 50.5C73 50 75 63 60 74Z"
    fill={palette.softWhite}
  />
);

const shine = (
  <Path d="M41 53a20.5 20.5 0 0 1 14-13" fill="none" stroke={palette.mocha} strokeWidth={2} strokeLinecap="round" />
);

// A clear takeaway cup from the side: the drink fading towards the bottom,
// ice at the top and through the side, and a straw.
function icedCup(id: string, top: string, bottom: string, surface: string, shadow: string): ReactNode {
  return (
    <>
      <Defs>
        <LinearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0.05} stopColor={top} />
          <Stop offset={0.85} stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={60} cy={111} rx={25} ry={4} fill={palette.mocha} fillOpacity={0.25} />
      <Path
        d="M27 36L37 104Q38 110 44 110H76Q82 110 83 104L93 36Z"
        fill={`url(#${id})`}
        stroke={palette.softWhite}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <G fill={shadow} fillOpacity={0.45}>
        <Path d="M41 50l7 3l-3 10l-6-4Z" />
        <Path d="M72 56l8-3l-2 12l-7 2Z" />
        <Path d="M55 66l6 2l-2 9l-5-3Z" />
      </G>
      <G fill={palette.softWhite} fillOpacity={0.28} stroke={palette.softWhite} strokeOpacity={0.5}>
        <Rect x={46} y={46} width={14} height={13} rx={3} rotation={-10} origin="53, 52" />
        <Rect x={63} y={50} width={13} height={13} rx={3} rotation={14} origin="69, 56" />
        <Rect x={38} y={62} width={12} height={12} rx={3} rotation={8} origin="44, 68" />
      </G>
      <Path
        d="M35 47L42 99"
        fill="none"
        stroke={palette.softWhite}
        strokeOpacity={0.5}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Ellipse cx={60} cy={36} rx={33} ry={8.5} fill={surface} stroke={palette.softWhite} strokeWidth={2} />
      <Path d="M77 7L65 37" fill="none" stroke={palette.mocha} strokeWidth={5} strokeLinecap="round" />
      <G fill={palette.softWhite} fillOpacity={0.8} stroke={palette.softWhite}>
        <Rect x={38} y={27} width={13} height={11} rx={3} rotation={-12} origin="44, 32" />
        <Rect x={55} y={30} width={13} height={11} rx={3} rotation={10} origin="61, 35" />
        <Rect x={70} y={27} width={12} height={10} rx={3} rotation={-6} origin="76, 32" />
      </G>
    </>
  );
}

const drinks: Record<string, Drink> = {
  // Drawn as the app's icon draws it, painted saucer and all.
  turkish: { scene: turkishCoffee },
  espresso: {
    vessel: 'demitasse',
    liquid: ink.crema,
    art: (
      <>
        <Circle cx={60} cy={60} r={18.5} fill="none" stroke={ink.cremaEdge} strokeWidth={2.5} />
        <Path d="M51 55a10 10 0 0 1 7-6" fill="none" stroke={palette.latte} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  americano: {
    vessel: 'cup',
    liquid: palette.darkRoast,
    art: (
      <>
        <Circle cx={60} cy={60} r={27} fill="none" stroke={palette.mocha} strokeWidth={1.5} strokeOpacity={0.7} />
        {shine}
      </>
    ),
  },
  latte: { vessel: 'cup', liquid: ink.milkCoffee, art: heart },
  cappuccino: {
    vessel: 'cup',
    liquid: ink.foam,
    art: (
      <>
        <Circle cx={60} cy={60} r={28.5} fill="none" stroke={ink.foamEdge} strokeWidth={4} />
        <G fill={ink.cocoa} fillOpacity={0.55}>
          <Circle cx={55} cy={55} r={1.6} />
          <Circle cx={64} cy={53} r={1.2} />
          <Circle cx={60} cy={61} r={1.8} />
          <Circle cx={67} cy={63} r={1.3} />
          <Circle cx={53} cy={65} r={1.2} />
          <Circle cx={60} cy={69} r={1} />
        </G>
      </>
    ),
  },
  flatWhite: {
    vessel: 'demitasse',
    liquid: ink.flatWhite,
    art: (
      <G fill={palette.softWhite}>
        <Circle cx={60} cy={63} r={7} />
        <Path d="M50 56a10 7 0 0 1 20 0a10 4 0 0 0 -20 0Z" />
      </G>
    ),
  },
  mocha: {
    vessel: 'cup',
    liquid: ink.chocolate,
    art: (
      <Path
        d="M60 60m-4 0a4 4 0 1 1 8 0a8 8 0 1 1 -16 0a12 12 0 1 1 24 0a16 16 0 1 1 -32 0"
        fill="none"
        stroke={ink.drizzle}
        strokeWidth={2}
        strokeLinecap="round"
      />
    ),
  },
  coldBrew: { scene: icedCup('cold-brew', ink.coldBrew, ink.coldBrewDepth, ink.coldBrewSurface, palette.espresso) },
  icedLatte: { scene: icedCup('iced-latte', ink.icedLatte, ink.foam, ink.icedLatteSurface, ink.cremaEdge) },
  filter: { vessel: 'mug', liquid: '#4A2E22', art: shine },
  tea: { vessel: 'demitasse', liquid: ink.tea, art: teaShine },
  greenTea: { vessel: 'cup', liquid: ink.greenTea, art: shine },
  herbalTea: { vessel: 'cup', liquid: ink.herbalTea, art: shine },
  matcha: {
    vessel: 'cup',
    liquid: ink.matcha,
    art: (
      <>
        <Path d="M47 52Q60 42 73 52" fill="none" stroke={ink.matchaFoam} strokeWidth={3} strokeLinecap="round" />
        <Path
          d="M60 74C46 64 48 54 55.5 54.5C58 54.7 60 57 60 59C60 57 62 54.7 64.5 54.5C72 54 74 64 60 74Z"
          fill={ink.matchaFoam}
        />
      </>
    ),
  },
};

// A coffee without a drawing of its own borrows the nearest one, going by
// the words in its name. The first match wins, so iced comes before the
// drinks that can also be served iced.
const lookalikes: [RegExp, string][] = [
  [/ice.*matcha/, 'icedLatte'],
  [/matcha/, 'matcha'],
  [/green tea|ye[sş]il [cç]ay/, 'greenTea'],
  [/herbal|bitki|chamomile|papatya|ihlamur|mint|nane/, 'herbalTea'],
  // Iced tea is drawn with the iced drinks below.
  [/^(?!.*ice).*(\btea\b|[cç]ay|earl grey)/, 'tea'],
  [/cold brew|nitro|tonic|ice[d ]+americano/, 'coldBrew'],
  [/\bice|shaken|frapp|cold/, 'icedLatte'],
  [/t[uü]rk/, 'turkish'],
  [/mocha|chocolate/, 'mocha'],
  [/cappuccino/, 'cappuccino'],
  [/latte|caramel|vanilla|chai/, 'latte'],
  [/macchiato|cortado|piccolo|flat white/, 'flatWhite'],
  [/espresso|ristretto|lungo|doppio|red eye|affogato/, 'espresso'],
  [/americano/, 'americano'],
  [/filter|filtre|pour|drip|chemex|press|moka|s[yi]phon|v60/, 'filter'],
];

function drawingFor(drink: string | null | undefined): Drink {
  if (!drink) return plain;
  const name = drink.toLowerCase();
  const match = lookalikes.find(([words]) => words.test(name));
  return drinks[drink] ?? (match && drinks[match[1]]) ?? plain;
}

const plain = { vessel: 'cup', liquid: palette.espresso, art: shine } satisfies Drink;

// Whether the drink is drawn in a clear iced cup from the side, rather than a
// cup from above.
export function isIcedDrawing(drink: string | null | undefined): boolean {
  const chosen = drawingFor(drink);
  return chosen === drinks.coldBrew || chosen === drinks.icedLatte;
}

function Saucer({ r, tan = false }: { r: number; tan?: boolean }) {
  return tan ? (
    <>
      <Circle cx={60} cy={60} r={r} fill={palette.latte} />
      <Circle cx={60} cy={60} r={r - 11} fill="none" stroke={palette.softWhite} strokeOpacity={0.6} />
    </>
  ) : (
    <>
      <Circle cx={60} cy={60} r={r} fill={palette.softWhite} stroke={palette.subtleBorder} />
      <Circle cx={60} cy={60} r={r - 11} fill="none" stroke={palette.subtleBorder} />
    </>
  );
}

// A round coaster under the vessels that come without a saucer.
const coaster = <Circle cx={60} cy={60} r={57} fill={palette.oatTaupe} fillOpacity={0.4} />;

function Handle({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <G rotation={-38} origin="60, 60">
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        fill={palette.softWhite}
        stroke={palette.oatTaupe}
      />
    </G>
  );
}

// The vessel seen from above: what it sits on, its handle, its rim.
// Returns the radius left for the drink.
function vesselParts(vessel: Vessel, tan = false): { body: ReactNode; liquidRadius: number } {
  switch (vessel) {
    case 'demitasse':
      return {
        liquidRadius: 21,
        body: (
          <>
            <Saucer r={46} />
            <Handle x={80} y={54} width={20} height={12} />
            <Circle cx={60} cy={60} r={26} fill={palette.softWhite} stroke={palette.oatTaupe} />
          </>
        ),
      };
    case 'mug':
      return {
        liquidRadius: 35,
        body: (
          <>
            {coaster}
            <Handle x={92} y={49} width={26} height={22} />
            <Circle cx={60} cy={60} r={43} fill={palette.softWhite} stroke={palette.oatTaupe} strokeWidth={1.5} />
          </>
        ),
      };
    case 'cup':
      return {
        liquidRadius: 30.5,
        body: (
          <>
            <Saucer r={58} tan={tan} />
            <Handle x={86} y={51} width={28} height={18} />
            <Circle cx={60} cy={60} r={36} fill={palette.softWhite} stroke={palette.oatTaupe} />
          </>
        ),
      };
  }
}

// A cup seen from above, drawn flat in the brand palette. It stands in
// wherever a coffee photograph would be and none exists yet; given a drink,
// it draws that drink. Iced drinks come in their own cup, from the side.
export function CupMark({ size = 120, drink, tan = false }: CupMarkProps) {
  const chosen = drawingFor(drink);

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
      {tan ? <Circle cx={60} cy={60} r={58} fill={palette.latte} /> : null}
      {'scene' in chosen ? chosen.scene : <FromAbove drink={chosen} tan={tan} />}
    </Svg>
  );
}

function FromAbove({ drink, tan }: { drink: Extract<Drink, { vessel: Vessel }>; tan: boolean }) {
  const { body, liquidRadius } = vesselParts(drink.vessel, tan);
  return (
    <>
      {body}
      <Circle cx={60} cy={60} r={liquidRadius} fill={drink.liquid} />
      {drink.art}
    </>
  );
}
