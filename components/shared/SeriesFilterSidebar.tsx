import { Search } from "lucide-react"

export interface FilterOption { id: string; label: string }
export interface SeriesFilterSidebarProps {
  types: FilterOption[]
  genres: FilterOption[]
  statuses: FilterOption[]
  selectedTypes?: string[]
  selectedGenres?: string[]
  selectedStatuses?: string[]
  onTypeChange?: (id: string) => void
  onGenreToggle?: (id: string) => void
  onStatusChange?: (id: string) => void
  onSearch?: (query: string) => void
}

function Options({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: FilterOption[]
  selected: string[]
  onToggle?: (id: string) => void
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase text-zinc-600">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => onToggle?.(option.id)}
              className={`border px-2.5 py-1.5 text-xs transition-colors ${
                active ? "border-pink-400/50 bg-pink-400/10 text-pink-200" : "border-white/10 text-zinc-500 hover:border-white/25 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SeriesFilterSidebar(props: SeriesFilterSidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-white/10 pb-8 lg:w-64 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
      <div className="sticky top-24 space-y-7">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            placeholder="Бүтээл хайх..."
            onChange={(event) => props.onSearch?.(event.target.value)}
            className="w-full border border-white/10 bg-white/[0.03] py-3 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-pink-400/40"
          />
        </label>
        <Options title="Төрөл" options={props.types} selected={props.selectedTypes || []} onToggle={props.onTypeChange} />
        <Options title="Жанр" options={props.genres} selected={props.selectedGenres || []} onToggle={props.onGenreToggle} />
        <Options title="Төлөв" options={props.statuses} selected={props.selectedStatuses || []} onToggle={props.onStatusChange} />
      </div>
    </aside>
  )
}
