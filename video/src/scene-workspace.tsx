import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, CODE, F, ON_PRESENCE } from './theme';
import { Caption, Caret, Tree, Window, typeOut, useEnter } from './ui';
import { Scene, useKenBurns } from './scenes';

const TYPED_LINE = "  if (!invite) throw new NotFound('Invite');";

const FILES = [
  'src',
  'accept.js',
  'invite.js',
  'project.js',
  'errors.js',
  'test',
  'accept.test.js',
  'package.json',
];

/**
 * The establishing shot: the whole workspace at once — files on the left, three people in
 * the same file, chat and a live run down the right — before the close-ups take over.
 */
export const Workspace: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = useKenBurns(duration, 1, 1.04);
  const enter = useEnter(0, 26);

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale * (0.97 + enter * 0.03)})` }}>
          <Window
            width={1740}
            people={[
              ['M', C.marigold, ON_PRESENCE],
              ['D', C.teal, '#fff'],
              ['S', C.rose, '#fff'],
              ['AI', C.cobalt, '#fff'],
            ]}
          >
            <div style={{ display: 'flex', height: 620 }}>
              <Tree files={FILES} />

              <pre
                style={{
                  flex: 1,
                  margin: 0,
                  padding: '16px 0',
                  font: `400 20px/2.1 ${F.mono}`,
                  overflow: 'hidden',
                }}
              >
                {CODE.filter((l) => l.n !== 9).map((l, i) => (
                  <div key={l.n} style={{ display: 'flex' }}>
                    <span
                      style={{
                        width: 58,
                        flexShrink: 0,
                        paddingRight: 18,
                        textAlign: 'right',
                        color: `${C.inkMuted}99`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <code style={{ whiteSpace: 'pre' }}>
                      {l.n === 6 ? (
                        <>
                          {typeOut(TYPED_LINE, frame, 14, 24, fps)}
                          <Caret name="maya" color={C.marigold} />
                        </>
                      ) : l.n === 11 ? (
                        <>
                          {'  const member = await invite.project.'}
                          <Caret name="dev" color={C.teal} />
                          {'addMember(user, invite.role);'}
                        </>
                      ) : l.n === 5 ? (
                        <>
                          {'  const invite = await Invite.findByToken(token);'}
                          <Caret name="sam" color={C.rose} />
                        </>
                      ) : (
                        l.code
                      )}
                    </code>
                  </div>
                ))}
              </pre>

              {/* Chat above, the run below it: the side panel of the real workspace. */}
              <div
                style={{
                  width: 430,
                  borderLeft: `1px solid ${C.line}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    font: `400 18px/1.45 ${F.sans}`,
                  }}
                >
                  <div style={{ font: `600 16px/1 ${F.sans}`, color: C.inkMuted }}>Chat</div>
                  <div
                    style={{
                      background: C.surface2,
                      borderRadius: '12px 12px 12px 4px',
                      padding: '10px 14px',
                    }}
                  >
                    Invite links never expire. Should they?
                  </div>
                  <div
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '88%',
                      background: C.cobalt,
                      color: C.cobaltInk,
                      borderRadius: '12px 12px 4px 12px',
                      padding: '10px 14px',
                    }}
                  >
                    Pushing a fix now
                  </div>
                  {frame > 96 && (
                    <div
                      style={{
                        background: C.surface2,
                        borderRadius: '12px 12px 12px 4px',
                        padding: '10px 14px',
                        opacity: interpolate(frame, [96, 112], [0, 1], {
                          extrapolateRight: 'clamp',
                        }),
                      }}
                    >
                      Nice, I&apos;ll take the tests
                    </div>
                  )}
                </div>

                <div
                  style={{
                    height: 250,
                    borderTop: `1px solid ${C.line}`,
                    background: `${C.surface2}55`,
                    padding: '14px 18px',
                    font: `400 16px/1.9 ${F.mono}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{ width: 9, height: 9, borderRadius: '50%', background: C.teal }}
                    />
                    <span style={{ font: `600 15px/1 ${F.sans}` }}>Running</span>
                    <span style={{ marginLeft: 'auto', color: C.inkMuted, fontSize: 14 }}>
                      localhost:5173
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: C.inkMuted }}>
                    {typeOut('$ npm run dev', frame, 30, 40, fps)}
                  </div>
                  <div style={{ color: C.teal }}>
                    {typeOut('ready in 412 ms', frame, 56, 40, fps)}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      background: C.surface,
                      padding: 12,
                      opacity: frame > 80 ? 1 : 0,
                    }}
                  >
                    <div
                      style={{ height: 9, width: 90, borderRadius: 5, background: `${C.cobalt}cc` }}
                    />
                    <div
                      style={{
                        marginTop: 8,
                        height: 7,
                        width: '90%',
                        borderRadius: 4,
                        background: C.surface2,
                      }}
                    />
                    <div
                      style={{
                        marginTop: 6,
                        height: 7,
                        width: '65%',
                        borderRadius: 4,
                        background: C.surface2,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Window>
        </div>
      </AbsoluteFill>
      <Caption>One workspace: files, code, chat and a live run</Caption>
    </Scene>
  );
};
