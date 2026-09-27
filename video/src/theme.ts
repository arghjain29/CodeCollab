/** The app's own palette and type, so the video looks like the product, not like a template. */
export const C = {
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
