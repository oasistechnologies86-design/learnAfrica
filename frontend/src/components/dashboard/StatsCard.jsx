import { BookOpen, Award, Trophy, Zap, Star, TrendingUp, Users, BarChart2 } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../common/Card';
import { cn } from '../../lib/utils';

const ICON_MAP = { BookOpen, Award, Trophy, Zap, Star, TrendingUp, Users, BarChart2 };

export default function StatsCard({ title, value, icon, trend, trendValue, className, compact = false }) {
  const isPositive = trend === 'up';

  // Accept either a string name ("BookOpen") or a real component
  const Icon = typeof icon === 'string' ? ICON_MAP[icon] : icon;

  return (
    <Card className={cn(compact ? 'p-4 border-border/50 shadow-sm' : 'p-6 border-border/50 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
          <p className={cn(compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground')}>{title}</p>
          <p className={cn(compact ? 'text-2xl font-medium text-foreground tracking-tight' : 'text-3xl font-semibold text-foreground tracking-tight')}>{value}</p>
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-destructive')}>
              {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
          {!trend && trendValue && (
            <p className="text-xs text-muted-foreground">{trendValue}</p>
          )}
        </div>
        <div className={cn('flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0', compact ? 'h-10 w-10' : 'h-12 w-12')}>
          {Icon ? <Icon className={cn(compact ? 'h-5 w-5' : 'h-6 w-6')} /> : null}
        </div>
      </div>
    </Card>
  );
}
