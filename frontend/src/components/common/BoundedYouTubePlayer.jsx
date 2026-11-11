import { useEffect, useRef, useState } from 'react';

let youtubeApiPromise;

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube player is only available in a browser.'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      const script = existing || document.createElement('script');
      const timeout = window.setTimeout(() => reject(new Error('YouTube player took too long to load.')), 15000);
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        window.clearTimeout(timeout);
        resolve(window.YT);
      };
      if (!existing) {
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error('Could not load the YouTube player.'));
        };
        document.head.appendChild(script);
      }
    });
  }
  return youtubeApiPromise;
}

export function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\\./, '').toLowerCase();
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) return null;
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) return parts[1] || null;
  } catch {}
  return null;
}

export default function BoundedYouTubePlayer({ url, startSeconds = 0, endSeconds = 0, title = 'YouTube video', className = 'w-full h-full' }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [error, setError] = useState('');
  const videoId = getYouTubeVideoId(url);
  const start = Math.max(0, Number(startSeconds) || 0);
  const end = Math.max(0, Number(endSeconds) || 0);

  useEffect(() => {
    let cancelled = false;
    const clearMonitor = () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    const enforceRange = () => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;
      try {
        const current = player.getCurrentTime();
        if (current < start - 0.35) {
          player.seekTo(start, true);
          return;
        }
        if (end > 0 && current >= end - 0.12) {
          clearMonitor();
          player.pauseVideo();
          player.seekTo(end, true);
        }
      } catch {}
    };

    if (!videoId || !mountRef.current) {
      setError('This YouTube link could not be recognised.');
      return undefined;
    }
    setError('');
    loadYouTubeApi().then(YT => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
          start: Math.floor(start),
          ...(end > 0 ? { end: Math.floor(end) } : {}),
        },
        events: {
          onReady: event => {
            if (start > 0) {
              try { event.target.seekTo(start, true); } catch {}
            }
          },
          onStateChange: event => {
            if (event.data === YT.PlayerState.PLAYING) {
              clearMonitor();
              intervalRef.current = window.setInterval(enforceRange, 100);
            } else {
              clearMonitor();
              if (event.data === YT.PlayerState.ENDED && end > 0) {
                try { event.target.seekTo(end, true); } catch {}
              }
            }
          },
          onError: () => setError('YouTube cannot play this video here. Check that its owner allows embedding.'),
        },
      });
    }).catch(() => {
      if (!cancelled) setError('The YouTube player could not be loaded. Please check your connection and try again.');
    });

    return () => {
      cancelled = true;
      clearMonitor();
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, start, end]);

  if (error) {
    return <div className={className + ' flex items-center justify-center bg-slate-950 p-4 text-center text-sm text-white'}>{error}</div>;
  }
  return <div className={className} aria-label={title}><div ref={mountRef} className="h-full w-full" /></div>;
}
