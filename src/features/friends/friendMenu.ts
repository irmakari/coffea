import { t } from '@/i18n';

import { confirm, showActions } from './actions';
import { personName, type Person } from './friendsApi';
import { askToReport } from './report';

type FriendMenuOptions = {
  remove: (person: Pick<Person, 'id'>) => Promise<void>;
  block: (person: Pick<Person, 'id'>) => Promise<void>;
  // Runs a change against the server, showing it is busy and why it failed.
  run: (action: () => Promise<void>) => void;
  onError: () => void;
};

// What can be done with a friend, from their row or their page: remove,
// report or block them, each asked about before it happens.
export function openFriendMenu(person: Person, { remove, block, run, onError }: FriendMenuOptions) {
  const name = personName(person);
  showActions(name, [
    {
      label: t('friends.menu.remove'),
      onPress: () =>
        confirm(t('friends.remove.title', { name }), undefined, t('friends.remove.confirm'), () =>
          run(() => remove(person)),
        ),
    },
    {
      label: t('report.person'),
      onPress: () =>
        askToReport({
          person: { id: person.id, name },
          onBlock: () => run(() => block(person)),
          onError,
        }),
    },
    {
      label: t('friends.menu.block'),
      destructive: true,
      onPress: () =>
        confirm(t('friends.block.title', { name }), t('friends.block.body'), t('friends.block.confirm'), () =>
          run(() => block(person)),
        ),
    },
  ]);
}
