"use client";

import { useEffect, useRef, useState } from "react";

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  destroy: () => void;
}

interface UseYouTubePlayerOptions {
  videoId: string | null;
  onEnded?: () => void;
  onStateChange?: (isPlaying: boolean) => void;
}

function safeDestroyPlayer(player: YTPlayer | null, container: HTMLDivElement | null) {
  if (player) {
    try {
      player.destroy();
    } catch {
      // YouTube API may have already detached iframe nodes
    }
  }
  container?.replaceChildren();
}

export function useYouTubePlayer({ videoId, onEnded, onStateChange }: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);

  const onEndedRef = useRef(onEnded);
  const onStateChangeRef = useRef(onStateChange);
  onEndedRef.current = onEnded;
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!videoId) {
      safeDestroyPlayer(playerRef.current, containerRef.current);
      playerRef.current = null;
      setReady(false);
      return;
    }

    const initPlayer = () => {
      const container = containerRef.current;
      if (!container) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId, 0);
        return;
      }

      const YT = (window as unknown as { YT: { Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
        }
      ) => YTPlayer } }).YT;

      playerRef.current = new YT.Player(container, {
        videoId,
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) onEndedRef.current?.();
            onStateChangeRef.current?.(event.data === 1);
          },
        },
      });
    };

    const win = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void };

    if (win.YT?.Player) {
      initPlayer();
    } else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      win.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  useEffect(() => {
    return () => {
      safeDestroyPlayer(playerRef.current, containerRef.current);
      playerRef.current = null;
    };
  }, []);

  return { containerRef, ready, player: playerRef };
}
