import * as Linking from 'expo-linking';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

// What people type, the way it is stored: no "@", no capitals, no spaces
// around it. Usernames are plain a to z, so Turkish letters are read as
// their nearest one: "Irmak", "İrmak" and "ırmak" are all "irmak". The dotted
// and dotless i go first, since lowercasing on a Turkish phone would turn
// "I" into "ı".
export function normalizeUsername(value: string) {
  return value
    .trim()
    .replace(/^@/, '')
    .replace(/[Iİı]/g, 'i')
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Lowercase letters, digits and underscores, as the database allows.
export function isValidUsername(value: string) {
  return new RegExp(`^[a-z0-9_]{${USERNAME_MIN},${USERNAME_MAX}}$`).test(value);
}

// Opens the app on the page that adds this person.
export function inviteLink(username: string) {
  return Linking.createURL(`/add/${username}`);
}
