import VimeoPlayer from '@vimeo/player';
import React, { useEffect, useRef, useState } from 'react';

import { css, CssValue, t } from './common';
import { VimeoEvents } from './Events';
import { usePlayerController } from './hooks/usePlayerController';

export type VimeoProps = {
  bus: t.EventBus<any>;
  id: string;
  video: number;
  muted?: boolean;
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: CssValue;
};

/**
 * Wrapper for the Vimeo player API.
 * https://github.com/vimeo/player.js
 */
const Component: React.FC<VimeoProps> = (props) => {
  const { id, video, width, height, bus, borderRadius } = props;
  const divRef = useRef<HTMLDivElement>(null);

  const [player, setPlayer] = useState<VimeoPlayer>();

  useEffect(() => {
    const div = divRef.current as HTMLDivElement;

    const player = new VimeoPlayer(div, {
      id: video,
      width,
      height,
      controls: false,
      transparent: true,
      title: false,
      byline: false,
      portrait: false,
      loop: false,
      dnt: true, // Do Not Track (no cookies or other tracking attempts)
    });

    setPlayer(player);

    return () => {
      player?.destroy();
    };
  }, [width, height]); // eslint-disable-line

  usePlayerController({ id, video, player, bus });

  useEffect(() => {
    if (player) loadVideo(player, video);
  }, [video, player]); // eslint-disable-line

  useEffect(() => {
    if (player) player.setMuted(props.muted ?? false);
  }, [player, props.muted]);

  const styles = {
    base: css({
      lineHeight: 0, // NB: Prevents space below IFrame.
      position: 'relative',
      overflow: 'hidden',
      borderRadius,
      width,
      height,
    }),
  };

  return <div ref={divRef} {...css(styles.base, props.style)}></div>;
};

/**
 * Export extended function.
 */
(Component as any).Events = VimeoEvents;
type T = React.FC<VimeoProps> & { Events: t.VimeoEventsFactory };
export const Vimeo = Component as T;

/**
 * Helpers
 */

async function loadVideo(player: VimeoPlayer, video: number, autoPlay?: boolean) {
  if (video !== (await player.getVideoId())) {
    await player.loadVideo(video);
    if (autoPlay) await player.play();
  }
}
