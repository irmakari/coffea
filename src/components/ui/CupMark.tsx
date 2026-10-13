import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

type CupMarkProps = {
  size?: number;
  // A coffee type key (see `coffeeTypes`). Unknown or missing draws the plain cup.
  drink?: string | null;
};

type Vessel = 'cup' | 'demitasse' | 'mug' | 'glass';

type Drink = {
  vessel: Vessel;
  liquid: string;
  art?: ReactNode;
};

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
  icedLatte: '#C9A27F',
  matcha: '#8DA65B',
  matchaFoam: '#DCE5BE',
} as const;

const heart = (
  <Path
    d="M60 74C45 63 47 50 55.5 50.5C58 50.7 60 53 60 55.5C60 53 62 50.7 64.5 50.5C73 50 75 63 60 74Z"
    fill={palette.softWhite}
  />
);

const ice = (
  <G fill={palette.softWhite} fillOpacity={0.35} stroke={palette.softWhite} strokeOpacity={0.75}>
    <Rect x={40} y={42} width={15} height={15} rx={3.5} rotation={-12} origin="47, 49" />
    <Rect x={60} y={44} width={14} height={14} rx={3.5} rotation={18} origin="67, 51" />
    <Rect x={47} y={62} width={13} height={13} rx={3.5} rotation={6} origin="53, 68" />
  </G>
);

const straw = <Circle cx={73} cy={69} r={4.5} fill={palette.espresso} stroke={palette.softWhite} strokeWidth={2} />;

const shine = (
  <Path d="M41 53a20.5 20.5 0 0 1 14-13" fill="none" stroke={palette.mocha} strokeWidth={2} strokeLinecap="round" />
);

const drinks: Record<string, Drink> = {
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
  coldBrew: {
    vessel: 'glass',
    liquid: '#3B2620',
    art: (
      <>
        {ice}
        {straw}
      </>
    ),
  },
  icedLatte: {
    vessel: 'glass',
    liquid: ink.icedLatte,
    art: (
      <>
        <Path
          d="M44 70C38 56 52 42 64 46C76 50 70 62 62 60C54 58 58 50 64 52"
          fill="none"
          stroke={palette.darkRoast}
          strokeOpacity={0.55}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {ice}
        {straw}
      </>
    ),
  },
  filter: { vessel: 'mug', liquid: '#4A2E22', art: shine },
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

const plain: Drink = { vessel: 'cup', liquid: palette.espresso, art: shine };

function Saucer({ r }: { r: number }) {
  return (
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
function vesselParts(vessel: Vessel): { body: ReactNode; liquidRadius: number } {
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
    case 'glass':
      return {
        liquidRadius: 38,
        body: (
          <>
            {coaster}
            <Circle
              cx={60}
              cy={60}
              r={44}
              fill={palette.softWhite}
              fillOpacity={0.6}
              stroke={palette.softWhite}
              strokeWidth={2}
            />
          </>
        ),
      };
    case 'cup':
      return {
        liquidRadius: 30.5,
        body: (
          <>
            <Saucer r={58} />
            <Handle x={86} y={51} width={28} height={18} />
            <Circle cx={60} cy={60} r={36} fill={palette.softWhite} stroke={palette.oatTaupe} />
          </>
        ),
      };
  }
}

// A cup seen from above, drawn flat in the brand palette. It stands in
// wherever a coffee photograph would be and none exists yet; given a drink,
// it draws that drink.
export function CupMark({ size = 120, drink }: CupMarkProps) {
  const { vessel, liquid, art } = (drink && drinks[drink]) || plain;
  const { body, liquidRadius } = vesselParts(vessel);

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
      {body}
      <Circle cx={60} cy={60} r={liquidRadius} fill={liquid} />
      {art}
    </Svg>
  );
}
