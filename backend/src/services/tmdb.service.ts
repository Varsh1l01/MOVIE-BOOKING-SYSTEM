import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
});

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
}

export const getNowPlaying = async (region = 'IN') => {
  const response = await tmdbClient.get('/movie/now_playing', {
    params: { region, page: 1 },
  });
  return response.data.results as TMDBMovie[];
};

export const getUpcoming = async (region = 'IN') => {
  const response = await tmdbClient.get('/movie/upcoming', {
    params: { region, page: 1 },
  });
  return response.data.results as TMDBMovie[];
};

export const getMovieDetails = async (tmdbId: number) => {
  const response = await tmdbClient.get(`/movie/${tmdbId}`, {
    params: { append_to_response: 'videos,credits,release_dates' },
  });
  return response.data;
};

export const getImageUrl = (path: string, size: 'w500' | 'original' = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};
