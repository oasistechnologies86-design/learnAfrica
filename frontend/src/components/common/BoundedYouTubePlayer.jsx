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
    const rawUrl = String(url || '').trim();
    if (!rawUrl) return null;
    const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) return null;
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) return parts[1] || null;
  } catch {}
  return null;
}

export default function BoundedYouTubePlayer({ url, startSeconds = 0, endSeconds = 0, title = 'YouTube video', className = 'w-full h-full', onCurrentTimeChange, enforceRange = true }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [error, setError] = useState('');
  const onCurrentTimeChangeRef = useRef(onCurrentTimeChange);
  const videoId = getYouTubeVideoId(url);
  useEffect(() => { onCurrentTimeChangeRef.current = onCurrentTimeChange; }, [onCurrentTimeChange]);
  const start = Math.max(0, Number(startSeconds) || 0);
  const end = Math.max(0, Number(endSeconds) || 0);

  useEffect(() => {
    let cancelled = false;
    const clearMonitor = () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    const publishAndEnforceRange = () => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;
      try {
        const current = player.getCurrentTime();
        const duration = typeof player.getDuration === 'function' ? player.getDuration() : 0;
        onCurrentTimeChangeRef.current?.(current, duration);
        if (!enforceRange) return;
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
          ...(enforceRange && start > 0 ? { start: Math.floor(start) } : {}),
          ...(enforceRange && end > 0 ? { end: Math.floor(end) } : {}),
        },
        events: {
          onReady: event => {
            if (enforceRange && start > 0) {
              try { event.target.seekTo(start, true); } catch {}
            }
            publishAndEnforceRange();
            clearMonitor();
            intervalRef.current = window.setInterval(publishAndEnforceRange, 200);
          },
          onStateChange: event => {
            publishAndEnforceRange();
            if (event.data === YT.PlayerState.ENDED && enforceRange && end > 0) {
              try { event.target.seekTo(end, true); } catch {}
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
  }, [videoId, start, end, enforceRange]);

  if (error) {
    const fallbackUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({ rel: '0', ...(enforceRange && start > 0 ? { start: String(Math.floor(start)) } : {}), ...(enforceRange && end > 0 ? { end: String(Math.floor(end)) } : {}) }).toString()}`
      : '';
    return fallbackUrl
      ? <iframe className={className} src={fallbackUrl} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      : <div className={className + ' flex items-center justify-center bg-slate-950 p-4 text-center text-sm text-white'}>{error}</div>;
  }
  return <div className={className} aria-label={title}><div ref={mountRef} className="h-full w-full" /></div>;
}
