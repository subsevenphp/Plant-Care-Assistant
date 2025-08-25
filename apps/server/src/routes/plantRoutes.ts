import { Router } from 'express';
import { PlantController } from '../controllers/plantController';
import { authenticate } from '../middleware/authMiddleware';
import { validate, asyncHandler } from '../middleware/validation';
import { uploadSingleImage, handleUploadError } from '../middleware/uploadMiddleware';
import {
  createPlantSchema,
  updatePlantSchema,
  getPlantByIdSchema,
  deletePlantSchema,
  getPlantsSchema,
  waterPlantSchema,
} from '../utils/validation';

const router = Router();
const plantController = new PlantController();

// Apply authentication to all plant routes
router.use(authenticate);

/**
 * @route   GET /api/plants
 * @desc    Get all plants for authenticated user
 * @access  Private
 * @query   page, limit, search, species, lastWateredFrom, lastWateredTo
 */
router.get(
  '/',
  validate(getPlantsSchema),
  asyncHandler(plantController.getPlants)
);

/**
 * @route   GET /api/plants/stats
 * @desc    Get plant statistics for authenticated user
 * @access  Private
 */
router.get(
  '/stats',
  asyncHandler(plantController.getPlantStats)
);

/**
 * @route   GET /api/plants/needs-water
 * @desc    Get plants that need watering
 * @access  Private
 */
router.get(
  '/needs-water',
  asyncHandler(plantController.getPlantsNeedingWater)
);

/**
 * @route   GET /api/plants/:id
 * @desc    Get plant by ID
 * @access  Private (Must own the plant)
 */
router.get(
  '/:id',
  validate(getPlantByIdSchema),
  asyncHandler(plantController.getPlantById)
);

/**
 * @route   POST /api/plants/upload-image
 * @desc    Upload plant image (standalone endpoint)
 * @access  Private
 * @file    image (required plant image)
 */
router.post(
  '/upload-image',
  uploadSingleImage,
  handleUploadError,
  asyncHandler(plantController.uploadImage)
);

/**
 * @route   POST /api/plants
 * @desc    Create a new plant
 * @access  Private
 * @body    name, species?, notes?, wateringFrequency, lastWatered?
 * @file    image? (optional plant image)
 */
router.post(
  '/',
  uploadSingleImage,
  handleUploadError,
  validate(createPlantSchema),
  asyncHandler(plantController.createPlant)
);

/**
 * @route   PUT /api/plants/:id
 * @desc    Update plant by ID
 * @access  Private (Must own the plant)
 * @body    name?, species?, notes?, wateringFrequency?, lastWatered?
 * @file    image? (optional new plant image)
 */
router.put(
  '/:id',
  uploadSingleImage,
  handleUploadError,
  validate(updatePlantSchema),
  asyncHandler(plantController.updatePlant)
);

/**
 * @route   DELETE /api/plants/:id
 * @desc    Delete plant by ID
 * @access  Private (Must own the plant)
 */
router.delete(
  '/:id',
  validate(deletePlantSchema),
  asyncHandler(plantController.deletePlant)
);

/**
 * @route   POST /api/plants/:id/water
 * @desc    Water a plant (update lastWatered date)
 * @access  Private (Must own the plant)
 * @body    wateredAt? (optional custom watered date)
 */
router.post(
  '/:id/water',
  validate(waterPlantSchema),
  asyncHandler(plantController.waterPlant)
);

export default router;