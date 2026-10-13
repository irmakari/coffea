import { Image } from 'expo-image';
import type { Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CupMark, Icon } from '@/components/ui';
import { typeAndCafe } from '@/features/entries/display';
import type { Entry } from '@/features/entries/types';
import { formatDate, t } from '@/i18n';
import { fonts, palette, type ColorName } from '@/theme';

export const shareTemplates = ['journal', 'espresso', 'frame'] as const;
export type ShareTemplate = (typeof shareTemplates)[number];

// Cards are drawn in a 360 x 640 space (9:16, the story format) and scaled
// to whatever width they are shown at, so the export matches the preview.
const BASE_WIDTH = 360;
export const CARD_RATIO = 9 / 16;

type Look = {
  background: string;
  panel: string;
  text: string;
  secondary: string;
  star: ColorName;
};

const looks: Record<ShareTemplate, Look> = {
  journal: {
    background: palette.warmCream,
    panel: palette.softWhite,
    text: palette.espresso,
    secondary: palette.mocha,
    star: 'text',
  },
  espresso: {
    background: palette.espresso,
    panel: palette.darkRoast,
    text: palette.softWhite,
    secondary: palette.oatTaupe,
    star: 'textOnAccent',
  },
  frame: {
    background: palette.softWhite,
    panel: palette.warmCream,
    text: palette.espresso,
    secondary: palette.mocha,
    star: 'text',
  },
};

type ShareCardProps = {
  entry: Entry;
  template: ShareTemplate;
  width: number;
  ref?: Ref<View>;
};

export function ShareCard({ entry, template, width, ref }: ShareCardProps) {
  const look = looks[template];
  const u = width / BASE_WIDTH;
  const subtitle = typeAndCafe(entry);
  const centered = template === 'frame';
  const fullBleed = template === 'espresso';

  const photo = (
    <View
      style={[
        styles.photo,
        {
          backgroundColor: look.panel,
          aspectRatio: template === 'frame' ? 1 : fullBleed ? 9 / 10 : 4 / 5,
          borderRadius: fullBleed ? 0 : 16 * u,
        },
      ]}
    >
      {entry.photoUrl ? (
        <Image
          source={entry.photoPath ? { uri: entry.photoUrl, cacheKey: entry.photoPath } : { uri: entry.photoUrl }}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <CupMark size={120 * u} />
      )}
    </View>
  );

  const words = (
    <View style={[styles.words, { gap: 6 * u }, centered && styles.centered]}>
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={[
          styles.name,
          { color: look.text, fontSize: 27 * u, lineHeight: 32 * u, letterSpacing: -0.7 * u },
          centered && styles.centeredText,
        ]}
      >
        {entry.name}
      </Text>
      {subtitle ? (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.meta, { color: look.secondary, fontSize: 14 * u, lineHeight: 20 * u }]}
        >
          {subtitle}
        </Text>
      ) : null}
      <View style={[styles.detailRow, { gap: 10 * u, marginTop: 4 * u }]}>
        <Text
          allowFontScaling={false}
          style={[styles.date, { color: look.secondary, fontSize: 10 * u, letterSpacing: 1.3 * u }]}
        >
          {formatDate(entry.consumedAt, 'short')}
        </Text>
        {entry.rating ? (
          <View style={[styles.stars, { gap: 2 * u }]}>
            {Array.from({ length: entry.rating }, (_, index) => (
              <Icon key={index} name="star" size={11 * u} filled strokeWidth={1} color={look.star} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  const wordmark = (
    <Text
      allowFontScaling={false}
      style={[
        styles.wordmark,
        { color: look.text, fontSize: 15 * u, letterSpacing: -0.3 * u },
        centered && styles.centeredText,
      ]}
    >
      {t('brand.name')}
    </Text>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { width, height: width / CARD_RATIO, backgroundColor: look.background }]}
    >
      {fullBleed ? (
        <>
          {photo}
          <View style={[styles.body, { padding: 28 * u }]}>
            {words}
            {wordmark}
          </View>
        </>
      ) : (
        <View
          style={[
            styles.body,
            { margin: template === 'frame' ? 14 * u : 0, padding: template === 'frame' ? 20 * u : 28 * u },
            template === 'frame' && { borderWidth: 1, borderColor: palette.oatTaupe },
          ]}
        >
          <View style={{ gap: 22 * u }}>
            {photo}
            {words}
          </View>
          {wordmark}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  photo: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  words: {
    alignItems: 'flex-start',
  },
  centered: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  name: {
    fontFamily: fonts.sansStrong,
  },
  meta: {
    fontFamily: fonts.sans,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontFamily: fonts.sansStrong,
    textTransform: 'uppercase',
  },
  stars: {
    flexDirection: 'row',
  },
  wordmark: {
    fontFamily: fonts.sansStrong,
  },
});
