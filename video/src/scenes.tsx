import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, CODE, F, FILES } from './theme';
import { Caption, Caret, Mark, Pointer, Tree, Window, typeOut, useEnter } from './ui';

const TYPED_LINE = "  if (!invite) throw new NotFound('Invite');";

/**
 * Every scene sits on the same paper background and fades at its edges, so the cuts
 * feel like one continuous piece rather than six clips.
 */
export const Scene: React.FC<{ children: React.ReactNode; duration: number }> = ({
  children,
  duration,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, duration - 8, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: C.paper, opacity, fontFamily: F.sans, color: C.ink }}>
      {children}
    </AbsoluteFill>
  );
};

/** Slow push-in: the camera move that makes a static mock feel filmed. */
export const useKenBurns = (duration: number, from = 1, to = 1.06) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, duration], [from, to], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
};

interface CodeProps {
  /** How far the live-typed line has been written, or null to show it finished. */
  typedText?: string | null;
  carets?: boolean;
  diff?: 'none' | 'proposed' | 'accepted';
  width?: number;
}

const CodeLines: React.FC<CodeProps> = ({ typedText = null, carets, diff = 'none', width }) => (
  <pre
    style={{
      flex: 1,
      margin: 0,
      padding: '18px 0',
      font: `400 24px/2.05 ${F.mono}`,
      color: C.ink,
      overflow: 'hidden',
      width,
    }}
  >
    {CODE.filter(
      (l) => !(l.n === 9 && diff === 'none') && !(l.n === 8 && diff === 'accepted'),
      // Number the lines that are actually on screen, so the gutter never skips one.
    ).map((l, i) => {
      const isRemoval = l.n === 8;
      const isAddition = l.n === 9;
      const background =
        diff === 'proposed' && isRemoval
          ? `${C.rose}1f`
          : diff !== 'none' && isAddition
            ? `${C.teal}26`
            : undefined;
      return (
        <div
          key={l.n}
          style={{
            display: 'flex',
            background,
            textDecoration: diff === 'proposed' && isRemoval ? 'line-through' : undefined,
            textDecorationColor: `${C.rose}aa`,
          }}
        >
          <span
            style={{
              width: 70,
              flexShrink: 0,
              paddingRight: 22,
              textAlign: 'right',
              color: `${C.inkMuted}99`,
            }}
          >
            {i + 1}
          </span>
          <code style={{ whiteSpace: 'pre' }}>
            {l.n === 6 ? (
              <>
                {typedText ?? TYPED_LINE}
                {carets && <Caret name="maya" color={C.marigold} />}
              </>
            ) : l.n === 11 ? (
              <>
                {'  const member = await invite.project.'}
                {carets && <Caret name="dev" color={C.teal} />}
                {'addMember(user, invite.role);'}
              </>
            ) : (
              l.code
            )}
          </code>
        </div>
      );
    })}
  </pre>
);

/** 0:00 — the problem, in one line, before anything else. */
export const Hook: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const first = useEnter(6);
  const second = useEnter(46);
  const third = useEnter(92);
  const strike = interpolate(frame, [92, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 180px' }}>
        <div style={{ opacity: first, transform: `translateY(${(1 - first) * 26}px)` }}>
          <span
            style={{
              font: `700 84px/1.1 ${F.display}`,
              fontStretch: '88%',
              letterSpacing: '-0.02em',
              position: 'relative',
            }}
          >
            One person types.
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '55%',
                height: 6,
                width: `${strike * 100}%`,
                background: C.rose,
                borderRadius: 3,
              }}
            />
          </span>
        </div>
        <div
          style={{
            marginTop: 18,
            opacity: second,
            transform: `translateY(${(1 - second) * 26}px)`,
            font: `700 84px/1.1 ${F.display}`,
            fontStretch: '88%',
            letterSpacing: '-0.02em',
            color: C.inkMuted,
          }}
        >
          Everyone else watches.
        </div>
        <div
          style={{
            marginTop: 52,
            opacity: third,
            transform: `translateY(${(1 - third) * 26}px)`,
            font: `700 92px/1.1 ${F.display}`,
            fontStretch: '88%',
            letterSpacing: '-0.02em',
            color: C.cobalt,
          }}
        >
          Not here.
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

/** 0:05 — two carets in one file. */
export const CoEdit: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = useKenBurns(duration, 1.04, 1.12);
  const enter = useEnter(0, 28);

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale * (0.96 + enter * 0.04)})` }}>
          <Window>
            <div style={{ display: 'flex', height: 660 }}>
              <Tree files={FILES} />
              <CodeLines typedText={typeOut(TYPED_LINE, frame, 18, 26, fps)} carets />
            </div>
          </Window>
        </div>
      </AbsoluteFill>
      <Caption>Everyone edits the same file, live</Caption>
    </Scene>
  );
};

/** 0:14 — the team asks the AI, in the open. */
export const AskAi: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = useKenBurns(duration, 1.05, 1.11);
  const ask = typeOut('@ai make invites expire after 7 days', frame, 20, 22, fps);
  const answer = typeOut(
    'Done — invites now carry an expiry and return 410 Gone once it passes.',
    frame,
    128,
    30,
    fps,
  );

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale})` }}>
          <Window>
            <div style={{ display: 'flex', height: 660 }}>
              <Tree files={FILES} />
              <CodeLines width={700} />
              <div
                style={{
                  width: 470,
                  borderLeft: `1px solid ${C.line}`,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  font: `400 20px/1.45 ${F.sans}`,
                }}
              >
                <div style={{ font: `600 18px/1 ${F.sans}`, color: C.inkMuted }}>Chat</div>
                <div
                  style={{
                    background: C.surface2,
                    borderRadius: '14px 14px 14px 4px',
                    padding: '12px 16px',
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
                    borderRadius: '14px 14px 4px 14px',
                    padding: '12px 16px',
                    minHeight: 24,
                  }}
                >
                  {ask}
                  {ask.length > 0 && ask.length < 36 && <span style={{ opacity: 0.7 }}>|</span>}
                </div>
                {frame > 120 && (
                  <div
                    style={{
                      background: C.surface2,
                      border: `1px solid ${C.cobalt}44`,
                      borderRadius: '14px 14px 14px 4px',
                      padding: '12px 16px',
                    }}
                  >
                    {answer}
                    <span style={{ color: C.cobalt }}>▌</span>
                  </div>
                )}
              </div>
            </div>
          </Window>
        </div>
      </AbsoluteFill>
      <Caption>Ask @ai where the whole team can see the answer</Caption>
    </Scene>
  );
};

/** 0:23 — the AI proposes, a person decides. */
export const Review: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const accepted = frame > 168;
  const scale = useKenBurns(duration, 1.06, 1.12);

  // The pointer travels to Accept, presses at 150, and the change lands. Coordinates are
  // inside the window, whose own box is 1500 wide.
  const px = interpolate(frame, [40, 150], [900, 1416], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const py = interpolate(frame, [40, 150], [420, 649], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale})`, position: 'relative' }}>
          <Window>
            <div style={{ display: 'flex', height: 540 }}>
              <Tree files={FILES} />
              <CodeLines diff={accepted ? 'accepted' : 'proposed'} />
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.line}`,
                background: `${C.surface2}88`,
                padding: '18px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                font: `400 21px/1 ${F.sans}`,
              }}
            >
              <span>
                {accepted ? (
                  <span style={{ color: C.teal, fontWeight: 600 }}>Applied to 2 files</span>
                ) : (
                  <>
                    <b>AI</b> suggests throwing once an invite has expired
                  </>
                )}
              </span>
              <span style={{ display: 'flex', gap: 12, opacity: accepted ? 0 : 1 }}>
                <span
                  style={{
                    border: `1px solid ${C.line}`,
                    background: C.surface,
                    borderRadius: 10,
                    padding: '10px 18px',
                  }}
                >
                  Dismiss
                </span>
                <span
                  style={{
                    background: C.cobalt,
                    color: C.cobaltInk,
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontWeight: 600,
                  }}
                >
                  Accept
                </span>
              </span>
            </div>
          </Window>
          {!accepted && <Pointer x={px} y={py} clicking={frame > 150} />}
        </div>
      </AbsoluteFill>
      <Caption>The AI suggests. A person decides.</Caption>
    </Scene>
  );
};

/** 0:32 — it runs, right there. */
export const Run: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = useKenBurns(duration, 1.05, 1.1);
  const lines = [
    { text: '$ npm test', at: 12, color: C.ink, weight: 600 },
    { text: '✓ returns 410 once an invite has expired', at: 44, color: C.teal, weight: 400 },
    { text: '✓ 14 tests passed in 1.2s', at: 76, color: C.teal, weight: 400 },
    { text: '$ npm run dev', at: 108, color: C.ink, weight: 600 },
    { text: '➜ Local: http://localhost:5173/', at: 140, color: C.inkMuted, weight: 400 },
  ];

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${scale})` }}>
          <Window file="invites-api / terminal">
            <div style={{ display: 'flex', height: 470 }}>
              <div style={{ flex: 1, padding: '26px 34px', font: `400 23px/2 ${F.mono}` }}>
                {lines.map((l) => (
                  <div
                    key={l.text}
                    style={{
                      color: l.color,
                      fontWeight: l.weight,
                      opacity: frame > l.at ? 1 : 0,
                      transform: `translateY(${frame > l.at ? 0 : 8}px)`,
                    }}
                  >
                    {typeOut(l.text, frame, l.at, 55, fps)}
                  </div>
                ))}
              </div>
              <div
                style={{
                  width: 520,
                  borderLeft: `1px solid ${C.line}`,
                  padding: 26,
                  opacity: frame > 150 ? 1 : 0,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    border: `1px solid ${C.line}`,
                    borderRadius: 14,
                    background: C.surface,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 18px',
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 12,
                        borderRadius: 6,
                        background: `${C.cobalt}cc`,
                      }}
                    />
                    <div
                      style={{
                        marginLeft: 'auto',
                        width: 46,
                        height: 10,
                        borderRadius: 5,
                        background: C.surface2,
                      }}
                    />
                    <div
                      style={{ width: 46, height: 10, borderRadius: 5, background: C.surface2 }}
                    />
                  </div>
                  <div style={{ padding: 18 }}>
                    <div
                      style={{ height: 16, width: '70%', borderRadius: 8, background: C.surface2 }}
                    />
                    <div
                      style={{
                        marginTop: 10,
                        height: 10,
                        width: '92%',
                        borderRadius: 5,
                        background: `${C.surface2}cc`,
                      }}
                    />
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        style={{
                          marginTop: 16,
                          padding: 14,
                          border: `1px solid ${C.line}`,
                          borderRadius: 10,
                          opacity: frame > 162 + i * 10 ? 1 : 0,
                          transform: `translateY(${frame > 162 + i * 10 ? 0 : 10}px)`,
                        }}
                      >
                        <div
                          style={{
                            height: 10,
                            width: '55%',
                            borderRadius: 5,
                            background: C.surface2,
                          }}
                        />
                        <div
                          style={{
                            marginTop: 8,
                            height: 8,
                            width: '85%',
                            borderRadius: 4,
                            background: `${C.surface2}aa`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Window>
        </div>
      </AbsoluteFill>
      <Caption>Run it in the browser, no setup</Caption>
    </Scene>
  );
};

/** 0:40 — what to do next. */
export const Cta: React.FC<{ duration: number }> = ({ duration }) => {
  const mark = useEnter(4);
  const title = useEnter(16);
  const sub = useEnter(30);
  const chip = useEnter(44);

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ opacity: mark, transform: `scale(${0.8 + mark * 0.2})` }}>
          <Mark size={96} />
        </div>
        <div
          style={{
            marginTop: 30,
            opacity: title,
            transform: `translateY(${(1 - title) * 20}px)`,
            font: `700 88px/1.05 ${F.display}`,
            fontStretch: '88%',
            letterSpacing: '-0.02em',
          }}
        >
          CodeCollab
        </div>
        <div
          style={{
            marginTop: 20,
            opacity: sub,
            font: `400 38px/1.4 ${F.sans}`,
            color: C.inkMuted,
            maxWidth: 1100,
          }}
        >
          A shared editor, team chat and an AI pair-programmer — in one workspace.
        </div>
        <div
          style={{
            marginTop: 52,
            opacity: chip,
            transform: `translateY(${(1 - chip) * 16}px)`,
            // The action sits on its own line, with the reassurance under it.
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              background: C.cobalt,
              color: C.cobaltInk,
              font: `600 32px/1 ${F.sans}`,
              padding: '22px 44px',
              borderRadius: 14,
              boxShadow: `0 18px 40px -18px ${C.cobalt}`,
            }}
          >
            Start a free project
          </span>
          <span style={{ font: `400 26px/1 ${F.sans}`, color: C.inkMuted }}>
            Free for 3 projects. No card needed.
          </span>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};
