import { z } from 'zod';

// Base plant validation schemas
export const createPlantSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Plant name is required')
      .max(100, 'Plant name must be less than 100 characters')
      .trim(),
    species: z
      .string()
      .max(100, 'Species must be less than 100 characters')
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .nullable(),
    wateringFrequency: z
      .number()
      .int('Watering frequency must be a whole number')
      .min(1, 'Watering frequency must be at least 1 day')
      .max(365, 'Watering frequency must be less than 365 days'),
    lastWatered: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .nullable()
      .transform((val) => val ? new Date(val) : undefined),
  }),
});

export const updatePlantSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid plant ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Plant name is required')
      .max(100, 'Plant name must be less than 100 characters')
      .trim()
      .optional(),
    species: z
      .string()
      .max(100, 'Species must be less than 100 characters')
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .nullable(),
    wateringFrequency: z
      .number()
      .int('Watering frequency must be a whole number')
      .min(1, 'Watering frequency must be at least 1 day')
      .max(365, 'Watering frequency must be less than 365 days')
      .optional(),
    lastWatered: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .nullable()
      .transform((val) => val ? new Date(val) : undefined),
  }),
});

export const getPlantByIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid plant ID format'),
  }),
});

export const deletePlantSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid plant ID format'),
  }),
});

export const getPlantsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1)
      .refine((val) => val > 0, 'Page must be a positive number'),
    limit: z
      .string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 10)
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    search: z
      .string()
      .max(100, 'Search term must be less than 100 characters')
      .optional(),
    species: z
      .string()
      .max(100, 'Species filter must be less than 100 characters')
      .optional(),
    lastWateredFrom: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .transform((val) => val ? new Date(val) : undefined),
    lastWateredTo: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .transform((val) => val ? new Date(val) : undefined),
  }),
});

// Water plant schema
export const waterPlantSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid plant ID format'),
  }),
  body: z.object({
    wateredAt: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .transform((val) => val ? new Date(val) : new Date()),
  }).optional().default({}),
});

// Authentication user type (for type safety)
export const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

// Type exports for use in controllers
export type CreatePlantRequest = z.infer<typeof createPlantSchema>;
export type UpdatePlantRequest = z.infer<typeof updatePlantSchema>;
export type GetPlantByIdRequest = z.infer<typeof getPlantByIdSchema>;
export type DeletePlantRequest = z.infer<typeof deletePlantSchema>;
export type GetPlantsRequest = z.infer<typeof getPlantsSchema>;
export type WaterPlantRequest = z.infer<typeof waterPlantSchema>;
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;