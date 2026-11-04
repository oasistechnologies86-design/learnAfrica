/**
 * useCourseTimeTracking — shared course minimum-time tracking logic.
 *
 * Previously this logic lived only, inline, inside LessonPage.jsx, so it
 * silently didn't apply during quizzes at all, and had no visible UI or
 * engagement check-in. This hook is now the single implementation, used by
 * both LessonPage and QuizPage, so the timer is genuinely present everywhere
 * a student can be "in" a course, matching how the platform's own minimum-
 * time rule is described.
 *
 * The server remains the authority on how much time actually gets credited
 * (see backend add_course_time); this hook's local counting is only for
 * showing the student a live, responsive number, it periodically re-syncs
 * to the server's own total after every heartbeat so it can't drift far.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from './api';

const HEARTBEAT_SECS = 30;
const CHECKIN_INTERVAL_SECS = 30 * 60; // every 30 real minutes of active time

export function useCourseTimeTracking(courseId, { ready = true } = {}) {
  const [timeSpent, setTimeSpent]       = useState(0);
  const [timeRequired, setTimeRequired] = useState(0);
  const [timeEnforce, setTimeEnforce]   = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [showCheckin, setShowCheckin]   = useState(false);

  const timeTickRef      = useRef(0);
  const sinceCheckinRef  = useRef(0);
  const pageVisibleRef   = useRef(true);
  const showCheckinRef   = useRef(false);
  useEffect(() => { showCheckinRef.current = showCheckin; }, [showCheckin]);

  const authedFetch = useCallback((url, opts = {}) => {
    const token = sessionStorage.getItem('auth_token');
    return fetch(`${API_BASE}${url}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    });
  }, []);

  // Fetch current totals once when the course changes
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    // Clear the previous course's display immediately while the next policy loads.
    setTrackingEnabled(false);
    setTimeSpent(0);
    setTimeRequired(0);
    setTimeEnforce(false);
    setShowCheckin(false);
    timeTickRef.current = 0;
    sinceCheckinRef.current = 0;
    authedFetch(`/api/courses/${courseId}/time`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d) return;
        setTimeSpent(Number(d.spent_seconds || 0));
        setTimeRequired(Number(d.required_seconds || 0));
        setTimeEnforce(Boolean(d.enforce));
        setTrackingEnabled(Boolean(d.enforce) && Number(d.required_seconds || 0) > 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [courseId, authedFetch]);

  // Close the server's active window as soon as the tab is hidden. On return,
  // the next heartbeat starts a fresh window; hidden time is never credited.
  useEffect(() => {
    pageVisibleRef.current = !document.hidden;
    const onVis = () => {
      const visible = !document.hidden;
      pageVisibleRef.current = visible;
      if (!visible && trackingEnabled) {
        const delta = timeTickRef.current;
        timeTickRef.current = 0;
        sendHeartbeat(delta, false);
      } else if (visible && trackingEnabled) {
        sendHeartbeat(1, true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [trackingEnabled, sendHeartbeat]);

  const sendHeartbeat = useCallback((delta, active = true) => {
    if (!courseId || !trackingEnabled) return;
    // Close the active window when the tab is hidden; the server rejects long gaps.
    authedFetch(`/api/courses/${courseId}/time`, { method: 'POST', body: JSON.stringify({ seconds: Math.max(1, delta), active }) })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        // Re-sync to the server's real authoritative total after every
        // heartbeat, so the displayed number can't drift far from the truth.
        if (d && typeof d.total_seconds === 'number') setTimeSpent(d.total_seconds);
      })
      .catch(() => { /* will retry on next heartbeat */ });
  }, [courseId, authedFetch, trackingEnabled]);

  // Local ticker: increments the displayed time every second while visible,
  // sends a heartbeat every 30s, and pauses for an engagement check-in every
  // 30 real minutes of continuously active time.
  useEffect(() => {
    if (!courseId || !ready || !trackingEnabled) return;
    const id = setInterval(() => {
      if (!pageVisibleRef.current || showCheckinRef.current) return;
      timeTickRef.current += 1;
      sinceCheckinRef.current += 1;
      setTimeSpent(t => t + 1);

      if (sinceCheckinRef.current >= CHECKIN_INTERVAL_SECS) {
        const delta = timeTickRef.current;
        timeTickRef.current = 0;
        sinceCheckinRef.current = 0;
        sendHeartbeat(delta);
        setShowCheckin(true);
        return;
      }
      if (timeTickRef.current >= HEARTBEAT_SECS) {
        const delta = timeTickRef.current;
        timeTickRef.current = 0;
        sendHeartbeat(delta);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [courseId, ready, trackingEnabled, sendHeartbeat]);

  // Flush the last foreground interval with authenticated keepalive fetch.
  // sendBeacon cannot attach the Bearer token required by this endpoint.
  useEffect(() => {
    return () => {
      const delta = timeTickRef.current;
      if (!courseId || delta <= 0 || !trackingEnabled) return;
      try {
        const token = sessionStorage.getItem('auth_token');
        fetch(`${API_BASE}/api/courses/${courseId}/time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ seconds: delta, active: true }),
          keepalive: true,
        }).catch(() => {});
      } catch (_) {}
    };
  }, [courseId, trackingEnabled]);

  const confirmContinue = useCallback(() => setShowCheckin(false), []);

  return { timeSpent, timeRequired, timeEnforce, showCheckin, confirmContinue };
}
