import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { C } from './theme';
import { AskAi, CoEdit, Cta, Hook, Review, Run } from './scenes';
import { Workspace } from './scene-workspace';

/**
 * The running order. Lengths follow what demo videos are built on: the problem inside
 * five seconds, four short beats of product, then what to do next.
 */
export const SCENES = [
  { id: 'hook', duration: 150, Component: Hook },
  { id: 'workspace', duration: 170, Component: Workspace },
  { id: 'co-edit', duration: 240, Component: CoEdit },
  { id: 'ask-ai', duration: 270, Component: AskAi },
  { id: 'review', duration: 270, Component: Review },
  { id: 'run', duration: 240, Component: Run },
  { id: 'cta', duration: 180, Component: Cta },
] as const;

export const DEMO_DURATION = SCENES.reduce((total, s) => total + s.duration, 0);

export const Demo: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {SCENES.map(({ id, duration, Component }) => {
        const from = at;
        at += duration;
        return (
          <Sequence key={id} from={from} durationInFrames={duration} name={id}>
            <Component duration={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
