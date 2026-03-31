import { Router } from 'express';
import { getShowsByMovie, getShowById, createShow, updateShow, deleteShow } from './show.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';

const router = Router();

router.get('/movie/:movieId', getShowsByMovie);
router.get('/:id', getShowById);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), createShow);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateShow);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), deleteShow);

export default router;
