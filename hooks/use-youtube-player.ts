"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
}

interface UseYouTubePlayerOptions {
  videoId: string | null;
  onEnded?: () => void;
  onStateChange?: (isPlaying: boolean) => void;
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
    if (typeof window === "undefined" || !videoId) return;

    const initPlayer = () => {
      if (!containerRef.current) return;

      playerRef.current?.destroy();

      const YT = (window as unknown as { YT: { Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
        }
      ) => YTPlayer } }).YT;

      playerRef.current = new YT.Player(containerRef.current, {
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

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId]);

  return { containerRef, ready, player: playerRef };
}
