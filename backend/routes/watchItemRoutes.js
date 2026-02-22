import express from 'express';
import {
    getWatchHistory,
    addWatchItem,
    updateWatchItem,
    deleteWatchItem,
    clearWatchHistory,
} from '../controllers/watchItemController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(protect, getWatchHistory)
    .post(protect, addWatchItem)
    .delete(protect, clearWatchHistory);
router
    .route('/:id')
    .put(protect, updateWatchItem)
    .delete(protect, deleteWatchItem);

export default router;
