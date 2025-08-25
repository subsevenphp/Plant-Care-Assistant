import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { uploadConfig } from '../config/env';

// Allowed file types for plant images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer storage configuration
const storage = multer.memoryStorage(); // Store in memory for cloud upload

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: uploadConfig.maxFileSize, // 10MB by default
    files: 1, // Only one file at a time
  },
});

/**
 * Middleware for uploading a single plant image
 */
export const uploadPlantImage = upload.single('image');

/**
 * Error handler for multer errors
 */
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${uploadConfig.maxFileSize / (1024 * 1024)}MB`,
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one image is allowed',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "image" as the field name',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
        });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

/**
 * Utility function to generate unique filename
 */
export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = path.extname(originalName);
  
  return `plants/${userId}/${timestamp}-${random}${extension}`;
};

/**
 * Mock image upload service (replace with actual cloud storage)
 */
export const uploadImageToCloud = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  // This is a mock implementation
  // In a real app, you would upload to AWS S3, Cloudinary, etc.
  
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate a mock URL
    const fileName = generateFileName(file.originalname, userId);
    const mockUrl = `https://mock-storage.com/${fileName}`;
    
    console.log(`Mock upload: ${file.originalname} -> ${mockUrl}`);
    
    return mockUrl;
  } catch (error) {
    throw new Error('Failed to upload image to cloud storage');
  }
};

/**
 * Cloudinary upload service (example implementation)
 * Uncomment and configure if using Cloudinary
 */
/*
import { v2 as cloudinary } from 'cloudinary';
import { cloudStorageConfig } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudStorageConfig.cloudinary.cloudName,
  api_key: cloudStorageConfig.cloudinary.apiKey,
  api_secret: cloudStorageConfig.cloudinary.apiSecret,
});

export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: `plant-care/users/${userId}/plants`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) throw error;
        return result?.secure_url;
      }
    );

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `plant-care/users/${userId}/plants`,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(new Error('Failed to upload to Cloudinary'));
          } else {
            resolve(result!.secure_url);
          }
        }
      );
      
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error('Failed to upload image to Cloudinary');
  }
};
*/