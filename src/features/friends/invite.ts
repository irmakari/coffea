import { Share } from 'react-native';

import { t } from '@/i18n';

import { inviteLink } from './username';

// Opens the system share sheet with a message and the link that adds this
// account. Resolves once the sheet closes, whatever the user chose.
export async function shareInvite(username: string) {
  const link = inviteLink(username);
  await Share.share({ message: t('friends.invite.message', { username, link }) });
}
