import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { moviesApi } from '../services/api'
import { Play, Star, Clock, ChevronRight, TrendingUp, Clapperboard } from 'lucide-react'

const statusMap: Record<string, string> = {
  NOW_PLAYING: '🎬 Now Playing',
  UPCOMING: '🚀 Coming Soon',
  ENDED: 'Ended',
}

const genreColors: Record<string, string> = {
  Action: 'badge-red', Drama: 'badge-blue', Comedy: 'badge-yellow',
  Horror: 'badge-purple', Thriller: 'badge-gray', 'Sci-Fi': 'badge-blue',
  Romance: 'badge-red', Crime: 'badge-gray', Biography: 'badge-green',
}

function MovieCard({ movie }: { movie: any }) {
  return (
    <Link to={`/movie/${movie.slug}`} className="group glass-card-hover overflow-hidden block">
      <div className="relative overflow-hidden aspect-[2/3]">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {movie.status === 'NOW_PLAYING' ? (
            <span className="badge badge-green text-xs">● Now Showing</span>
          ) : (
            <span className="badge badge-blue text-xs">Coming Soon</span>
          )}
        </div>

        {/* Rating */}
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-dark-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-dark-100">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-brand-500/90 backdrop-blur-sm flex items-center justify-center shadow-glow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-dark-100 group-hover:text-white transition-colors line-clamp-1 mb-1.5">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={12} className="text-dark-400" />
          <span className="text-xs text-dark-400">{movie.duration} min</span>
          {movie.certification && (
            <>
              <span className="text-dark-600">•</span>
              <span className="text-xs text-dark-400">{movie.certification}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {movie.genre.slice(0, 2).map((g: string) => (
            <span key={g} className={`badge ${genreColors[g] || 'badge-gray'} text-xs`}>{g}</span>
          ))}
        </div>
      </div>

      {movie.status === 'NOW_PLAYING' && (
        <div className="px-4 pb-4">
          <button className="w-full btn-primary py-2 text-sm">Book Now</button>
        </div>
      )}
    </Link>
  )
}

function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-dark-800 min-h-[420px] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-dark-800 to-dark-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(229,9,20,0.15),transparent_60%)]" />
      
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" />

      <div className="relative page-container py-16 z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-red animate-pulse-slow">🔴 Live Now</span>
            <span className="text-dark-400 text-sm">+500 shows today</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            <span className="text-white">Book Your</span>
            <br />
            <span className="gradient-text">Perfect Movie</span>
            <br />
            <span className="text-white">Experience</span>
          </h1>
          <p className="text-dark-300 text-lg mb-8 leading-relaxed">
            Discover blockbusters, select your perfect seats, and enjoy seamless booking for theatres across India.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#movies" className="btn-primary text-base px-8 py-3">
              <Clapperboard size={18} />
              Browse Movies
            </a>
            <a href="#movies" className="btn-secondary text-base px-8 py-3">
              <TrendingUp size={18} />
              Trending Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterBar({ status, genre, onStatusChange, onGenreChange, genres }: any) {
  const statuses = [
    { value: '', label: 'All' },
    { value: 'NOW_PLAYING', label: 'Now Showing' },
    { value: 'UPCOMING', label: 'Coming Soon' },
  ]

  return (
    <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 flex-shrink-0">
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              status === s.value
                ? 'bg-brand-500 text-white shadow-glow'
                : 'bg-dark-800 text-dark-300 hover:text-white border border-dark-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="w-px h-6 bg-dark-700 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-shrink-0">
        {genres.slice(0, 6).map((g: string) => (
          <button
            key={g}
            onClick={() => onGenreChange(genre === g ? '' : g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              genre === g
                ? 'bg-dark-600 text-white border border-brand-500/50'
                : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const { data: moviesData, isLoading } = useQuery({
    queryKey: ['movies', { status, genre, search }],
    queryFn: () => moviesApi.getAll({ status, genre, search, limit: 24 }).then(r => r.data),
  })

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => moviesApi.getGenres().then(r => r.data.data),
  })

  const movies = moviesData?.data || []
  const genres = genresData || []

  return (
    <div>
      <HeroBanner />

      <div id="movies" className="page-container pb-12">
        <div className="flex items-center justify-between pt-8 mb-2">
          <h2 className="text-2xl font-bold text-dark-100">
            {status ? statusMap[status] : '🎬 All Movies'}
            {genre && <span className="text-brand-500 ml-2">— {genre}</span>}
          </h2>
          {movies.length > 0 && (
            <span className="text-dark-400 text-sm">{moviesData?.pagination?.total || movies.length} movies</span>
          )}
        </div>

        <FilterBar
          status={status}
          genre={genre}
          genres={genres}
          onStatusChange={(v: string) => { setStatus(v); setSearchParams(prev => { if (v) prev.set('status', v); else prev.delete('status'); return prev; }) }}
          onGenreChange={(v: string) => { setGenre(v); setSearchParams(prev => { if (v) prev.set('genre', v); else prev.delete('genre'); return prev; }) }}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="skeleton aspect-[2/3]" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-dark-300 mb-2">No movies found</h3>
            <p className="text-dark-500">Try changing your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
