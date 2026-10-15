import { Alert } from 'react-native';

import { reportContent, type ReportReason } from '@/features/feed/feedApi';
import { t } from '@/i18n';

import { showActions } from './actions';

type ReportOptions = {
  person: { id: string; name: string };
  // Reports this one coffee rather than the person.
  entryId?: string;
  // Offered once the report is in, for someone the user would rather not see.
  onBlock: () => void;
  onError: () => void;
};

const reasons: { reason: ReportReason; label: () => string }[] = [
  { reason: 'inappropriate', label: () => t('report.reasons.inappropriate') },
  { reason: 'spam', label: () => t('report.reasons.spam') },
  { reason: 'other', label: () => t('report.reasons.other') },
];

// Asks why, files the report, then offers to block. Reports are read by a
// person and acted on; nothing happens to the reported account on its own.
export function askToReport({ person, entryId, onBlock, onError }: ReportOptions) {
  showActions(
    t(entryId ? 'report.titleCoffee' : 'report.titlePerson'),
    reasons.map(({ reason, label }) => ({
      label: label(),
      onPress: async () => {
        try {
          await reportContent(person.id, reason, entryId);
        } catch {
          onError();
          return;
        }
        Alert.alert(t('report.thanks.title'), t('report.thanks.body'), [
          { text: t('common.done'), style: 'cancel' },
          { text: t('report.thanks.block', { name: person.name }), style: 'destructive', onPress: onBlock },
        ]);
      },
    })),
  );
}
