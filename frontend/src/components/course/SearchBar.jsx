import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/common/Input'

export function SearchBar({ value, onChange, placeholder = 'Search courses...', suggestions = [] }) {
  const [open, setOpen] = useState(false)
  const options = [...new Set((suggestions || []).filter(Boolean).map(item => String(item)))].slice(0, 6)

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search courses"
          aria-expanded={open && options.length > 0}
          className={value ? 'pl-10 pr-10' : 'pl-10'}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear course search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggestions</p>
          {options.map(option => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(option); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-primary/8"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
