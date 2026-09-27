import React from 'react';
import { Composition, continueRender, delayRender } from 'remotion';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import { Demo, DEMO_DURATION, SCENES } from './Demo';

// Rendering must not start before the fonts are ready, or the first frames come out
// in a fallback face.
const fonts = delayRender('Loading fonts');
void document.fonts.ready.then(() => continueRender(fonts));

/** Short loops cut for READMEs and posts. Named, so reordering the film can't break them. */
const CLIPS = ['workspace', 'review'] as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DEMO_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    {CLIPS.map((id) => {
      const scene = SCENES.find((s) => s.id === id)!;
      return (
        <Composition
          key={id}
          id={`Clip-${id}`}
          component={scene.Component}
          durationInFrames={scene.duration}
          defaultProps={{ duration: scene.duration }}
          fps={30}
          width={1920}
          height={1080}
        />
      );
    })}
  </>
);
