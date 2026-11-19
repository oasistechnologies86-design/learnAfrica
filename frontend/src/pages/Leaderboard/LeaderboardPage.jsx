import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Loader2, BookOpen, Flame, Medal, RefreshCw, LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { cn } from '../../lib/utils';
import { API_BASE } from '@/lib/api';

const categories = [
  { id: 'Overall', label: 'Overall', icon: Trophy, field: 'points', metric: 'points', unit: 'pts', description: 'Ranked by total learning points' },
  { id: 'Courses', label: 'Courses', icon: BookOpen, field: 'courses', metric: 'courses', unit: 'courses', description: 'Ranked by courses completed' },
  { id: 'Badges', label: 'Badges', icon: Medal, field: 'badges', metric: 'badges', unit: 'badges', description: 'Ranked by achievements earned' },
  { id: 'Streak', label: 'Streak', icon: Flame, field: 'streak', metric: 'streak', unit: 'days', description: 'Ranked by consecutive learning days' },
];

const number = value => (Number(value) || 0).toLocaleString();

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [category, setCategory] = useState('Overall');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const token = sessionStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/api/leaderboard?category=${encodeURIComponent(category)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Leaderboard request failed (${res.status}).`);
        const payload = await res.json();
        if (!Array.isArray(payload?.leaderboard)) throw new Error('Unexpected leaderboard response.');
        setData(payload.leaderboard.filter(entry => entry && typeof entry === 'object'));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setData([]);
          setLoadError('We could not load the leaderboard right now. Please try again.');
          console.error('Leaderboard loading failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [category, retryCount]);

  const selected = categories.find(item => item.id === category) || categories[0];
  const myEntry = data.find(entry => entry.is_me);
  const rankedRows = useMemo(() => data.slice().sort((a, b) => a.rank - b.rank), [data]);
  const podium = useMemo(() => {
    const first = rankedRows.find(entry => entry.rank === 1);
    const second = rankedRows.find(entry => entry.rank === 2);
    const third = rankedRows.find(entry => entry.rank === 3);
    return [second, first, third].filter(Boolean);
  }, [rankedRows]);

  const formatMetric = entry => `${number(entry?.[selected.field])} ${selected.unit}`;

  if (isLoading) return (
    <div className="flex justify-center items-center py-20" role="status" aria-label="Loading leaderboard">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground mt-1">See how you rank and keep going!</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
          <LockKeyhole className="h-4 w-4" /> Learner identities are private
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-muted/70 p-1.5">
        {categories.map(item => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={cn('flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition-all',
              category === item.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-background hover:text-foreground')}>
            <Icon className="h-4 w-4" />{item.label}
          </button>;
        })}
      </div>

      <p className="text-sm text-muted-foreground">{selected.description} · All-time rankings</p>

      {myEntry && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                {(user?.name || 'Y').trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground">Your Position <span className="ml-1 text-emerald-700 dark:text-emerald-400">#{myEntry.rank}</span></p>
                <p className="text-sm text-muted-foreground">Out of {number(myEntry.total_learners || data.length)} learners</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground">Your {selected.label} score</p>
              <p className="text-2xl font-extrabold text-primary">{formatMetric(myEntry)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <p>{loadError}</p>
          <button type="button" onClick={() => setRetryCount(value => value + 1)} className="mt-2 font-semibold text-primary underline">Retry</button>
        </div>
      )}

      {podium.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {podium.map(entry => {
            const place = entry.rank;
            const winner = place === 1;
            const styles = place === 1
              ? 'border-yellow-400 bg-gradient-to-b from-yellow-100 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20'
              : place === 2
                ? 'border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900'
                : 'border-orange-300 bg-gradient-to-b from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20';
            return (
              <Card key={entry.rank} className={cn('relative text-center min-w-0', styles, winner && '-translate-y-3 shadow-lg')}>
                <CardContent className="px-2 py-5 sm:px-4 sm:py-7">
                  <div className={cn('mx-auto mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full font-bold text-lg sm:text-2xl',
                    winner ? 'bg-yellow-400 text-yellow-950' : place === 2 ? 'bg-slate-300 text-slate-800' : 'bg-orange-400 text-orange-950')}>
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-xs text-muted-foreground">{place === 1 ? '1st place' : place === 2 ? '2nd place' : '3rd place'}</p>
                  <p className="mt-1 truncate text-sm sm:text-base font-bold text-foreground">{entry.is_me ? `${user?.name || 'You'} (You)` : entry.display_name}</p>
                  <p className="mt-1 text-lg sm:text-2xl font-extrabold text-primary">{formatMetric(entry)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{selected.label} Rankings</CardTitle>
            <span className="text-xs text-muted-foreground">Top learners</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-y border-border bg-muted/60">
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Rank</th>
                  <th className="p-3 text-left text-xs sm:text-sm font-semibold text-muted-foreground">Learner</th>
                  <th className="p-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground">{selected.label}</th>
                  <th className="p-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground">Points</th>
                  <th className="p-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground">Badges</th>
                  <th className="p-3 text-right text-xs sm:text-sm font-semibold text-muted-foreground">Streak</th>
                </tr>
              </thead>
              <tbody>
                {rankedRows.map(entry => (
                  <tr key={entry.rank} className={cn('border-b border-border', entry.is_me ? 'bg-emerald-500/10' : 'hover:bg-muted/40')}>
                    <td className="p-3 text-sm font-bold text-foreground">#{entry.rank}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          entry.is_me ? 'bg-emerald-600 text-white' : 'bg-primary/10 text-primary')}>
                          {entry.is_me ? (user?.name || 'Y').trim().charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="max-w-[150px] truncate text-sm font-medium text-foreground">
                          {entry.is_me ? `${user?.name || 'You'} (You)` : entry.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm font-bold text-foreground">{formatMetric(entry)}</td>
                    <td className="p-3 text-right text-sm text-muted-foreground">{number(entry.points)}</td>
                    <td className="p-3 text-right text-sm text-muted-foreground">{number(entry.badges)}</td>
                    <td className="p-3 text-right text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{number(entry.streak)}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rankedRows.length === 0 && !loadError && (
              <div className="py-12 text-center text-muted-foreground text-sm">No leaderboard data yet. Start learning to earn your first points!</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <button type="button" onClick={() => setRetryCount(value => value + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
          <RefreshCw className="h-4 w-4" /> Refresh leaderboard
        </button>
      </div>
    </div>
  );
}
