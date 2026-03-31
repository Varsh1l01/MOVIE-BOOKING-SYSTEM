import { Router } from 'express';
import {
  getMovies, getMovieBySlug, createMovie, updateMovie,
  deleteMovie, getGenres, movieValidators,
} from './movie.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';

const router = Router();

router.get('/', getMovies);
router.get('/genres', getGenres);
router.get('/:slug', getMovieBySlug);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), movieValidators, validate, createMovie);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateMovie);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), deleteMovie);

export default router;
