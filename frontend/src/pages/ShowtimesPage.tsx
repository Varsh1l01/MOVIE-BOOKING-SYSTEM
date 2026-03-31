import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { moviesApi, showsApi } from '../services/api'
import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, MapPin, Zap, ChevronRight } from 'lucide-react'

function DatePicker({ selected, onChange }: { selected: string; onChange: (d: string) => void }) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
      {dates.map(d => {
        const str = format(d, 'yyyy-MM-dd')
        const isSelected = selected === str
        return (
          <button
            key={str}
            onClick={() => onChange(str)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-200 min-w-[60px] ${
              isSelected
                ? 'bg-brand-500 border-brand-500 text-white shadow-glow'
                : 'bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-500 hover:text-white'
            }`}
          >
            <span className="text-xs font-medium uppercase">{format(d, 'EEE')}</span>
            <span className="text-lg font-bold">{format(d, 'd')}</span>
            <span className="text-xs opacity-70">{format(d, 'MMM')}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ShowtimesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: movie } = useQuery({
    queryKey: ['movie', slug],
    queryFn: () => moviesApi.getBySlug(slug!).then(r => r.data.data),
    enabled: !!slug,
  })

  const { data: showsData, isLoading } = useQuery({
    queryKey: ['shows', movie?.id, selectedDate],
    queryFn: () => showsApi.getByMovie(movie!.id, { date: selectedDate }).then(r => r.data.data),
    enabled: !!movie?.id,
  })

  const theatreGroups = showsData || []

  const formatMap: Record<string, string> = {
    TWO_D: '2D', THREE_D: '3D', IMAX: 'IMAX', FOUR_DX: '4DX', IMAX_THREE_D: 'IMAX 3D',
  }

  const priceColorMap: Record<string, string> = {
    IMAX: 'text-purple-400', THREE_D: 'text-blue-400', FOUR_DX: 'text-orange-400', TWO_D: 'text-green-400',
  }

  return (
    <div className="animate-fade-in page-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-dark-400 mb-6">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight size={14} />
        {movie && <Link to={`/movie/${slug}`} className="hover:text-white transition-colors">{movie.title}</Link>}
        <ChevronRight size={14} />
        <span className="text-dark-200">Showtimes</span>
      </nav>

      <div className="flex items-center gap-4 mb-6">
        {movie?.posterUrl && (
          <img src={movie.posterUrl} className="w-14 h-20 object-cover rounded-lg border border-dark-700" alt="" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{movie?.title}</h1>
          <p className="text-dark-400 text-sm">{movie?.duration} min • {movie?.certification}</p>
        </div>
      </div>

      {/* Date picker */}
      <div className="glass-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-dark-400 mb-3 uppercase tracking-wide">Select Date</h2>
        <DatePicker selected={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Showtimes */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : theatreGroups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold text-dark-300 mb-2">No shows available</h3>
          <p className="text-dark-500">Try selecting a different date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {theatreGroups.map((group: any) => (
            <div key={group.theatre.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-dark-100 text-lg">{group.theatre.name}</h3>
                  <p className="text-dark-400 text-sm flex items-center gap-1.5">
                    <MapPin size={12} />
                    {group.theatre.address}, {group.theatre.city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.theatre.amenities?.slice(0, 3).map((a: string) => (
                    <span key={a} className="badge badge-gray text-xs">{a}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {group.shows.map((show: any) => (
                  <Link
                    key={show.id}
                    to={`/book/${show.id}/seats`}
                    className="group relative flex flex-col items-center px-4 py-3 rounded-xl border border-dark-600 hover:border-brand-500/60 bg-dark-800 hover:bg-dark-700 transition-all duration-200"
                  >
                    <span className={`text-xs font-bold mb-1 ${priceColorMap[show.format] || 'text-green-400'}`}>
                      {formatMap[show.format]}
                    </span>
                    <span className="text-white font-semibold text-sm">
                      {format(new Date(show.startTime), 'h:mm a')}
                    </span>
                    <span className="text-dark-400 text-xs mt-0.5">{show.language}</span>
                    <span className="text-dark-400 text-xs">₹{show.priceRegular}+</span>
                    <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap size={12} className="text-brand-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
