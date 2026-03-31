import { Router } from 'express';
import { getTheatres, getTheatreById, createTheatre, updateTheatre, deleteTheatre, createScreen, updateScreen, deleteScreen, getCities } from './theatre.controller';
import { authenticate, requireRole } from '../../middleware/authenticate';

const router = Router();

router.get('/', getTheatres);
router.get('/cities', getCities);
router.get('/:id', getTheatreById);
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), createTheatre);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateTheatre);
router.post('/:theatreId/screens', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), createScreen);
router.put('/screens/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateScreen);
router.delete('/screens/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), deleteScreen);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), deleteTheatre);

export default router;
