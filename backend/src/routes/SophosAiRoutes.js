import { Router } from 'express';
import { SophosAIController } from '../controllers/SophosAIController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

router.post('/chat', autenticar, SophosAIController.conversar);

export default router;