import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F, ON_PRESENCE, THEME } from './theme';

/** Eases 0 → 1 as something arrives, with a touch of overshoot. */
export const useEnter = (delay = 0, duration = 22) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: { damping: 200 },
  });
};

/** Text revealed one character at a time, like someone typing it. */
export const typeOut = (
  text: string,
  frame: number,
  start: number,
  charsPerSecond = 24,
  fps = 30,
) =>
  text.slice(
    0,
    Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * charsPerSecond))),
  );

/** The CodeCollab mark, drawn rather than loaded so nothing depends on a file. */
export const Mark: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#1B2233" />
    {THEME === 'dark' && (
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke={C.line} />
    )}
    <path d="M9 7v16l4.5-4.5L17 25l2.5-1.2-3.4-6.3H22z" fill={C.marigold} />
    <path d="M19 7v10" stroke={C.teal} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Somebody else's cursor, sitting in the text with their name on it. */
export const Caret: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  // Everything is sized in em, so the caret lines up whatever size the code is set in.
  <span
    style={{
      position: 'relative',
      display: 'inline-block',
      width: 0,
      height: '1.15em',
      verticalAlign: 'text-bottom',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '-0.1em',
        bottom: '-0.1em',
        left: 0,
        width: 3,
        background: color,
      }}
    />
    <span
      style={{
        position: 'absolute',
        bottom: '1.15em',
        left: 0,
        background: color,
        color: ON_PRESENCE,
        font: `700 0.62em/1.5 ${F.sans}`,
        padding: '1px 7px',
        borderRadius: '5px 5px 5px 0',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  </span>
);

/** The mouse pointer, for the one moment the video shows a click. */
export const Pointer: React.FC<{ x: number; y: number; clicking?: boolean }> = ({
  x,
  y,
  clicking,
}) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-2px, -2px)' }}>
    {clicking && (
      <div
        style={{
          position: 'absolute',
          left: -26,
          top: -26,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `${C.cobalt}33`,
        }}
      />
    )}
    <svg width="30" height="30" viewBox="0 0 24 24">
      <path
        d="M5 2l14 8.5-6.2 1.3L16 20l-3 1.3-3.2-8L5 17z"
        fill={C.ink}
        stroke={C.paper}
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

/** The line of text that carries the story, since the video has no narration. */
export const Caption: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 6,
}) => {
  const enter = useEnter(delay);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 72,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          background: C.ink,
          color: C.paper,
          font: `600 34px/1.35 ${F.sans}`,
          padding: '14px 30px',
          borderRadius: 999,
          boxShadow: '0 20px 50px -20px rgba(27,34,51,.6)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** The app window everything happens inside. */
export const Window: React.FC<{
  children: React.ReactNode;
  file?: string;
  width?: number;
  people?: [string, string, string][];
  style?: React.CSSProperties;
}> = ({ children, file = 'invites-api / src/invites/accept.js', width = 1500, people, style }) => (
  <div
    style={{
      width,
      borderRadius: 22,
      border: `1px solid ${C.line}`,
      background: C.surface,
      overflow: 'hidden',
      boxShadow: '0 60px 120px -60px rgba(27,34,51,.55)',
      ...style,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 22px',
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ font: `400 20px/1 ${F.mono}`, color: C.inkMuted }}>{file}</span>
      <div style={{ display: 'flex' }}>
        {(
          people ?? [
            ['M', C.marigold, ON_PRESENCE],
            ['D', C.teal, '#fff'],
            ['AI', C.cobalt, '#fff'],
          ]
        ).map(([t, bg, fg], i) => (
          <span
            key={t}
            style={{
              width: 34,
              height: 34,
              marginLeft: i ? -8 : 0,
              borderRadius: '50%',
              background: bg,
              color: fg,
              font: `700 14px/34px ${F.sans}`,
              textAlign: 'center',
              boxShadow: `0 0 0 3px ${C.surface}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
    {children}
  </div>
);

/** A file tree rail, for context on the left of the editor. */
export const Tree: React.FC<{ files: string[] }> = ({ files }) => (
  <div
    style={{
      width: 210,
      borderRight: `1px solid ${C.line}`,
      background: `${C.surface2}66`,
      padding: '14px 0',
    }}
  >
    {files.map((f) => (
      <div
        key={f}
        style={{
          font: `${f === 'accept.js' ? 600 : 400} 17px/2.1 ${F.mono}`,
          color: f === 'accept.js' ? C.cobalt : C.inkMuted,
          padding: `0 16px 0 ${f === 'src' || f === 'test' || f === 'package.json' ? 16 : 30}px`,
        }}
      >
        {f}
      </div>
    ))}
  </div>
);
