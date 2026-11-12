import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/money';
import { courseThumbnail } from '@/lib/courseThumbnail';

const difficultyColors = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'destructive',
};

export default function CourseCard({ course, enrolled = false }) {
  const title = course.title;
  const description = course.description || '';
  const thumbnail = courseThumbnail(course);
  const difficulty = course.difficulty;
  const weeks = course.weeks_required || course.duration_weeks || 0;
  const duration = weeks > 0 ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'}` : course.duration;
  const instructor = course.instructor_name || 'Course instructor';
  const instructorAvatar = course.instructor_avatar || '/placeholder-user.jpg';
  const isFree = course.is_free === 1 || course.is_free === true;
  const price = course.price || 0;
  const progress = course.progress || 0;
  const rating = Number(course.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <Link
        to={`/courses/${course.id}`}
        className="relative block aspect-video shrink-0 overflow-hidden bg-muted"
        aria-label={`View ${title}`}
      >
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
        {isFree && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            Free
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-1 flex-col">
          {difficulty && (
            <div className="mb-2.5">
              <Badge variant={difficultyColors[difficulty] || 'secondary'} className="px-2 py-0.5 text-[10px] font-medium">
                {difficulty}
              </Badge>
            </div>
          )}

          <Link to={`/courses/${course.id}`} className="block">
            <h3 className="line-clamp-2 min-h-[2.8rem] text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[17px]">
              {title}
            </h3>
          </Link>

          {description && (
            <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              {description}
            </p>
          )}

          <div className="mt-4 flex min-w-0 items-center gap-2.5">
            <img
              src={instructorAvatar}
              alt=""
              loading="lazy"
              className="h-8 w-8 shrink-0 rounded-full border border-border/70 bg-muted object-cover"
            />
            <div className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Instructor
              </span>
              <span className="block truncate text-xs font-semibold text-foreground">
                {instructor}
              </span>
            </div>
          </div>

          {(duration || hasRating) && (
            <div className="mt-4 flex min-h-5 items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              {duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {duration}
                </span>
              )}
              {hasRating && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border/60 pt-3">
          {enrolled && progress > 0 && (
            <div className="mb-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-muted-foreground">Your progress</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Course progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progress === 100 ? 'bg-success' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {enrolled ? 'Your course' : 'Course price'}
            </span>
            <span className={cn('text-sm font-bold', isFree ? 'text-emerald-600' : 'text-foreground')}>
              {isFree ? 'Free' : formatPrice(price)}
            </span>
          </div>

          <Link to={`/courses/${course.id}`} className="block">
            <Button
              className="h-10 w-full text-xs font-semibold shadow-sm transition-transform active:scale-[0.98]"
              variant={enrolled ? 'outline' : 'primary'}
            >
              {enrolled
                ? progress === 100
                  ? 'Review Course'
                  : 'Continue Learning'
                : isFree
                ? 'Start Free Course'
                : 'View Course'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
