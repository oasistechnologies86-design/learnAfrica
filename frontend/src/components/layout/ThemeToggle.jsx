import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme() } }}
      aria-label="Toggle theme"
      className={`group flex ${compact ? 'h-10' : 'md:h-9 h-14'} cursor-pointer items-center rounded-lg bg-card border border-input px-3 transition-colors duration-200 hover:border-primary/50 hover:bg-primary/10 active:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <div className="flex shrink-0 items-center justify-center scale-110 text-muted-foreground transition-colors duration-200 group-hover:text-primary">
        {theme === 'light' ? (
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
        ) : (
          <Moon className="h-[18px] w-[18px] rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
        )}
      </div>

      <span className="ml-2 text-xs sm:text-sm font-semibold text-foreground/80 transition-colors duration-200 group-hover:text-primary whitespace-nowrap">
        Toggle Theme
      </span>
    </div>
  )
}
