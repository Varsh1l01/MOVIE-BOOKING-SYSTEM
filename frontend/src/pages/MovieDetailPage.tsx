import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { moviesApi } from '../services/api'
import { Star, Clock, Calendar, Play, ChevronRight, Users, Film } from 'lucide-react'
import { format } from 'date-fns'

export default function MovieDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movie', slug],
    queryFn: () => moviesApi.getBySlug(slug!).then(r => r.data.data),
    enabled: !!slug,
  })

  const movie = data

  if (isLoading) return (
    <div className="animate-fade-in">
      <div className="h-96 skeleton" />
      <div className="page-container py-8 space-y-4">
        {[80, 60, 100, 40].map((w, i) => <div key={i} className={`skeleton h-5 w-${w} rounded`} />)}
      </div>
    </div>
  )

  if (isError || !movie) return (
    <div className="text-center py-20 page-container">
      <div className="text-6xl mb-4">🎬</div>
      <h2 className="text-2xl font-bold text-dark-100 mb-2">Movie not found</h2>
      <Link to="/" className="btn-primary mt-4 inline-flex">Back to Home</Link>
    </div>
  )

  const rating = movie.rating?.toFixed(1) || '—'

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 page-container pb-6 flex items-end gap-6">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-xl border-2 border-dark-700 shadow-glass flex-shrink-0 hidden sm:block"
          />
          <div className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              {movie.genre?.slice(0, 3).map((g: string) => (
                <span key={g} className="badge badge-gray text-xs">{g}</span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-shadow mb-2">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-300">
              {rating !== '—' && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <strong className="text-white">{rating}</strong> / 10
                </span>
              )}
              <span className="flex items-center gap-1.5"><Clock size={14} /> {movie.duration} min</span>
              {movie.certification && <span className="px-2 py-0.5 border border-dark-500 rounded text-xs">{movie.certification}</span>}
              {movie.releaseDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {format(new Date(movie.releaseDate), 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-3">About the Movie</h2>
              <p className="text-dark-300 leading-relaxed">{movie.description}</p>
            </div>

            {/* Cast */}
            {movie.cast?.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-dark-100 mb-4">
                  <Users size={18} className="inline mr-2 text-brand-500" />Cast
                </h2>
                <div className="flex flex-wrap gap-3">
                  {movie.cast.map((actor: string) => (
                    <div key={actor} className="flex items-center gap-2 bg-dark-700 rounded-full px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                        {actor[0]}
                      </div>
                      <span className="text-sm text-dark-200">{actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {movie.language?.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-dark-100 mb-3">
                  <Film size={18} className="inline mr-2 text-brand-500" />Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {movie.language.map((lang: string) => (
                    <span key={lang} className="badge badge-blue">{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Book Tickets CTA */}
            {movie.status === 'NOW_PLAYING' && (
              <div className="glass-card p-6 border border-brand-500/20">
                <h3 className="text-lg font-bold text-dark-100 mb-1">Book Tickets</h3>
                <p className="text-sm text-dark-400 mb-4">Select your preferred showtime</p>
                <Link to={`/movie/${slug}/showtimes`} className="btn-primary w-full text-center">
                  View Showtimes <ChevronRight size={16} />
                </Link>
              </div>
            )}

            {movie.status === 'UPCOMING' && (
              <div className="glass-card p-6 border border-blue-500/20 bg-blue-500/5">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-lg font-bold text-dark-100 mb-1">Coming Soon</h3>
                <p className="text-sm text-dark-400">
                  Releasing on {format(new Date(movie.releaseDate), 'dd MMMM yyyy')}
                </p>
              </div>
            )}

            {/* Movie Info */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-dark-100">Movie Details</h3>
              {[
                ['Director', movie.director],
                ['Duration', `${movie.duration} minutes`],
                ['Certification', movie.certification],
                ['Release Date', movie.releaseDate ? format(new Date(movie.releaseDate), 'dd MMM yyyy') : '-'],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-dark-400">{label}</span>
                  <span className="text-dark-200 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
