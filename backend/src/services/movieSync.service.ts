import { MovieStatus } from '@prisma/client';
import { prisma } from '../config/database';
import * as tmdbService from './tmdb.service';
import slugify from 'slugify';

// Genre mapping from TMDB ID to string
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const mapTmdbToMovie = (tmdbMovie: tmdbService.TMDBMovie, status: MovieStatus) => {
  const releaseDate = new Date(tmdbMovie.release_date);
  const slug = slugify(tmdbMovie.title, { lower: true, strict: true }) + '-' + releaseDate.getFullYear();

  return {
    title: tmdbMovie.title,
    slug,
    description: tmdbMovie.overview,
    posterUrl: tmdbService.getImageUrl(tmdbMovie.poster_path, 'w500') || '',
    bannerUrl: tmdbService.getImageUrl(tmdbMovie.backdrop_path, 'original') || '',
    genre: tmdbMovie.genre_ids.map((id) => GENRE_MAP[id] || 'Other'),
    language: ['English'], // TMDB doesn't give a list easily, default for now
    duration: 0, // Need to fetch details for duration
    releaseDate,
    rating: tmdbMovie.vote_average,
    totalRatings: tmdbMovie.vote_count,
    status,
    certification: tmdbMovie.adult ? 'A' : 'UA',
    director: 'Unknown', // Need to fetch credits for this
    cast: [], // Need to fetch credits for this
  };
};

export const syncMovies = async () => {
  console.log('🚀 Starting TMDB Sync...');
  
  const nowPlaying = await tmdbService.getNowPlaying();
  const upcoming = await tmdbService.getUpcoming();

  const allMovies = [
    ...nowPlaying.map(m => ({ ...m, status: MovieStatus.NOW_PLAYING })),
    ...upcoming.map(m => ({ ...m, status: MovieStatus.UPCOMING })),
  ];

  let syncedCount = 0;

  for (const movieData of allMovies) {
    try {
      // Get full details for duration and credits
      const details = await tmdbService.getMovieDetails(movieData.id);
      
      const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 'Unknown';
      const cast = details.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];
      const certification = details.release_dates?.results
        ?.find((r: any) => r.iso_3166_1 === 'IN')?.release_dates?.[0]?.certification || (movieData.adult ? 'A' : 'UA');

      const movieInput = mapTmdbToMovie(movieData, movieData.status);
      
      await prisma.movie.upsert({
        where: { slug: movieInput.slug },
        update: {
          rating: movieInput.rating,
          totalRatings: movieInput.totalRatings,
          status: movieInput.status,
        },
        create: {
          ...movieInput,
          duration: details.runtime || 120,
          director,
          cast,
          certification,
          language: [details.original_language === 'hi' ? 'Hindi' : 'English'],
        },
      });
      syncedCount++;
    } catch (err) {
      console.error(`❌ Failed to sync movie: ${movieData.title}`, err);
    }
  }

  console.log(`✅ Synced ${syncedCount} movies from TMDB`);
  return syncedCount;
};
