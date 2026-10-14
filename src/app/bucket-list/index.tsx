import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '@/components/ui';
import type { BucketItem } from '@/features/bucketList/bucketListApi';
import { useBucketList } from '@/features/bucketList/BucketListProvider';
import { t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

function openItem(id?: string) {
  router.push(id ? { pathname: '/bucket-list/item', params: { id } } : '/bucket-list/item');
}

function ItemRow({ item, onToggle }: { item: BucketItem; onToggle: () => void }) {
  const tone = item.isCompleted ? 'textMuted' : 'text';
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted }}
        accessibilityLabel={t(item.isCompleted ? 'bucketList.markNotTried' : 'bucketList.markTried', {
          name: item.name,
        })}
        onPress={onToggle}
        style={styles.checkTarget}
      >
        <View style={[styles.check, item.isCompleted && styles.checked]}>
          {item.isCompleted ? <Icon name="check" size={14} color="textOnAccent" strokeWidth={2} /> : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => openItem(item.id)}
        style={({ pressed }) => [styles.rowText, pressed && styles.pressed]}
      >
        <Text variant="bodyStrong" color={tone} numberOfLines={2}>
          {item.name}
        </Text>
        {item.cafe ? (
          <Text variant="small" color={item.isCompleted ? 'textMuted' : 'textSecondary'} numberOfLines={1}>
            {item.cafe}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

export default function BucketListScreen() {
  const { items, status, reload, toggleCompleted } = useBucketList();
  const [failure, setFailure] = useState<string | null>(null);

  const toTry = items.filter((item) => !item.isCompleted);
  const tried = items.filter((item) => item.isCompleted);

  const toggle = async (item: BucketItem) => {
    setFailure(null);
    try {
      await toggleCompleted(item);
    } catch {
      setFailure(t('bucketList.updateError'));
    }
  };

  const section = (title: string, list: BucketItem[]) =>
    list.length > 0 ? (
      <View style={styles.section}>
        <SectionHeader title={title} />
        <View style={styles.rows}>
          {list.map((item) => (
            <ItemRow key={item.id} item={item} onToggle={() => toggle(item)} />
          ))}
        </View>
      </View>
    ) : null;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <PageHeader
        padded={false}
        title={t('bucketList.title')}
        trailing={
          items.length > 0 ? <IconButton icon="plus" label={t('bucketList.add')} onPress={() => openItem()} /> : null
        }
      />

      {items.length === 0 ? (
        status === 'loading' ? (
          <LoadingState />
        ) : status === 'error' ? (
          <EmptyState
            title={t('common.loadError.title')}
            body={t('common.loadError.body')}
            action={<Button variant="secondary" label={t('common.retry')} onPress={reload} />}
          />
        ) : (
          <EmptyState
            title={t('bucketList.empty.title')}
            body={t('bucketList.empty.body')}
            action={<Button label={t('bucketList.add')} onPress={() => openItem()} />}
          />
        )
      ) : (
        <>
          {failure ? (
            <Text variant="small" color="danger" accessibilityLiveRegion="polite" style={styles.failure}>
              {failure}
            </Text>
          ) : null}
          {section(t('bucketList.toTry'), toTry)}
          {section(t('bucketList.tried'), tried)}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  failure: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xxl,
  },
  rows: {
    borderTopWidth: sizes.hairline,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  checkTarget: {
    width: sizes.touch,
    height: sizes.touch,
    justifyContent: 'center',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rowText: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
