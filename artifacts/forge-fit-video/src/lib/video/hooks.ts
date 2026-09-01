import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export type VideoDurations = Record<string, number>;

type VideoPlayerOptions = {
  durations: VideoDurations;
  loop?: boolean;
  paused?: boolean;
};

/**
 * Fixed-timeline player used by the video exporter.
 * The first pass is marked for recording, then the recording is stopped once
 * before the visual timeline continues looping in preview.
 */
export function useVideoPlayer({ durations, loop = true, paused = false }: VideoPlayerOptions) {
  const keysRef = useRef(Object.keys(durations));
  const durationsRef = useRef(durations);
  const [currentScene, setCurrentScene] = useState(0);
  const stoppedRecordingRef = useRef(false);

  useEffect(() => {
    keysRef.current = Object.keys(durationsRef.current);
    window.startRecording?.();

    let timeoutId: number | undefined;
    let cancelled = false;

    const scheduleScene = (index: number) => {
      if (cancelled || paused) return;
      const key = keysRef.current[index];
      const duration = durationsRef.current[key];
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const isLastScene = index === keysRef.current.length - 1;
        if (isLastScene) {
          if (!stoppedRecordingRef.current) {
            window.stopRecording?.();
            stoppedRecordingRef.current = true;
          }
          if (loop) {
            setCurrentScene(0);
            scheduleScene(0);
          }
          return;
        }
        setCurrentScene(index + 1);
        scheduleScene(index + 1);
      }, duration);
    };

    scheduleScene(currentScene);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
    // The artifact passes a static duration map. Scene changes are advanced by
    // this timer and must not restart the recording lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durations, loop, paused]);

  return { currentScene, currentSceneKey: keysRef.current[currentScene] };
}

export function useSceneTimer(callback: () => void, delay: number, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setTimeout(() => callbackRef.current(), delay);
    return () => window.clearTimeout(timer);
  }, [delay, enabled]);
}