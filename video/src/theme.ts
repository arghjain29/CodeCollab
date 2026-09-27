/**
 * The app's own palette and type, so the video looks like the product, not like a template.
 * Both themes are the ones in `frontend/src/index.css`, copied value for value.
 *
 * Which one is used comes from REMOTION_THEME, set per render, because a colour has to be a
 * plain string here: several places mix a token with an alpha suffix (`${C.teal}26`), which a
 * CSS variable can't do.
 */
const LIGHT = {
  paper: '#EEF1F5',
  surface: '#FFFFFF',
  surface2: '#E4E8EF',
  ink: '#1B2233',
  inkMuted: '#56607A',
  line: '#CDD4DF',
  cobalt: '#2F5BEA',
  cobaltInk: '#FFFFFF',
  marigold: '#F2B632',
  teal: '#1F9E8F',
  rose: '#E0527A',
} as const;

const DARK = {
  ...LIGHT,
  paper: '#141A26',
  surface: '#1C2433',
  surface2: '#252F42',
  ink: '#E6EAF2',
  inkMuted: '#9AA4BA',
  line: '#313C52',
  cobalt: '#6D8CFF',
  cobaltInk: '#0F1522',
  // Presence colours identify people, so they stay the same in both themes.
} as const;

export const THEME = process.env.REMOTION_THEME === 'dark' ? 'dark' : 'light';
export const C = THEME === 'dark' ? DARK : LIGHT;

/** Always legible on a presence colour, which is bright in either theme. */
export const ON_PRESENCE = '#1B2233';

export const F = {
  display: "'Bricolage Grotesque Variable', system-ui, sans-serif",
  sans: "'Instrument Sans Variable', system-ui, sans-serif",
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
} as const;

/** The file the whole story happens in. */
export const CODE = [
  { n: 1, code: "import { Invite } from './models';" },
  { n: 2, code: "import { Gone, NotFound } from '../errors';" },
  { n: 3, code: '' },
  { n: 4, code: 'export async function acceptInvite(token, user) {' },
  { n: 5, code: '  const invite = await Invite.findByToken(token);' },
  { n: 6, code: "  if (!invite) throw new NotFound('Invite');" },
  { n: 7, code: '' },
  { n: 8, code: '  if (invite.expiresAt < Date.now()) return null;' },
  { n: 9, code: "  if (invite.expiresAt < Date.now()) throw new Gone('Invite expired');" },
  { n: 10, code: '' },
  { n: 11, code: '  const member = await invite.project.addMember(user, invite.role);' },
  { n: 12, code: '  return member;' },
  { n: 13, code: '}' },
] as const;

export const FILES = ['src', 'accept.js', 'invite.js', 'errors.js', 'test', 'package.json'];
