import { showAlert } from '@/components/ui';
import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { showActions } from './actions';

type ReportReason = 'inappropriate' | 'spam' | 'other';

// Files a report about a person, read by hand in the dashboard.
async function reportPerson(userId: string, reason: ReportReason): Promise<void> {
  const { error } = await supabase.rpc('report_content', { target_user: userId, entry: null, reason });
  if (error) throw error;
}

type ReportOptions = {
  person: { id: string; name: string };
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
export function askToReport({ person, onBlock, onError }: ReportOptions) {
  showActions(
    t('report.titlePerson'),
    reasons.map(({ reason, label }) => ({
      label: label(),
      onPress: async () => {
        try {
          await reportPerson(person.id, reason);
        } catch {
          onError();
          return;
        }
        showAlert(t('report.thanks.title'), t('report.thanks.body'), [
          { text: t('common.done'), style: 'cancel' },
          { text: t('report.thanks.block', { name: person.name }), style: 'destructive', onPress: onBlock },
        ]);
      },
    })),
  );
}
