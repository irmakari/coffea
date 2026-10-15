import 'expo-sqlite/localStorage/install';

// The diary opens on whichever view was last chosen on this phone.
const KEY = 'coffea.diaryView';

export const diaryViews = ['calendar', 'album'] as const;
export type DiaryView = (typeof diaryViews)[number];

export function readDiaryView(): DiaryView {
  return localStorage.getItem(KEY) === 'album' ? 'album' : 'calendar';
}

export function saveDiaryView(view: DiaryView) {
  localStorage.setItem(KEY, view);
}
