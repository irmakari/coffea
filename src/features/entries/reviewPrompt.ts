import 'expo-sqlite/localStorage/install';

import * as StoreReview from 'expo-store-review';

// The App Store rating sheet is asked for once the journal shows the app is
// being used, never on the first coffees. Apple decides whether it actually
// appears, and shows it at most three times a year.
const MILESTONES = [10, 50, 150];
const KEY = 'coffea.reviewAskedAt';

export async function askForReviewAfterSaving(journalSize: number) {
  if (!MILESTONES.includes(journalSize)) return;
  if (localStorage.getItem(KEY) === String(journalSize)) return;
  try {
    if (!(await StoreReview.hasAction())) return;
    localStorage.setItem(KEY, String(journalSize));
    await StoreReview.requestReview();
  } catch {
    // A rating sheet that will not open is never worth an error.
  }
}
