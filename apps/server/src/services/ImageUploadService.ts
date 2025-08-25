import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface ImageUploadConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  cloudFrontDomain?: string;
}

interface UploadResult {
  imageUrl: string;
  key: string;
  bucket: string;
}

export class ImageUploadService {
  private s3Client: S3Client;
  private config: ImageUploadConfig;

  constructor(config: ImageUploadConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload an image file to S3
   * @param file - The multer file object
   * @param folder - Optional folder path (e.g., 'plants', 'avatars')
   * @returns Promise<UploadResult>
   */
  async uploadImage(file: Express.Multer.File, folder: string = 'plants'): Promise<UploadResult> {
    try {
      // Validate file type
      if (!this.isValidImageType(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${uniqueFileName}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
        },
      });

      await this.s3Client.send(uploadCommand);

      // Generate public URL
      const imageUrl = this.generatePublicUrl(key);

      return {
        imageUrl,
        key,
        bucket: this.config.bucketName,
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image from S3
   * @param key - The S3 object key
   * @returns Promise<void>
   */
  async deleteImage(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      console.log(`Image deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a presigned URL for temporary access
   * @param key - The S3 object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise<string>
   */
  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Extract S3 key from image URL
   * @param imageUrl - The full image URL
   * @returns string | null
   */
  extractKeyFromUrl(imageUrl: string): string | null {
    try {
      // Handle CloudFront URLs
      if (this.config.cloudFrontDomain && imageUrl.includes(this.config.cloudFrontDomain)) {
        return imageUrl.split(this.config.cloudFrontDomain)[1].substring(1);
      }

      // Handle direct S3 URLs
      const s3UrlPattern = new RegExp(`https://${this.config.bucketName}\\.s3\\.${this.config.region}\\.amazonaws\\.com/(.+)`);
      const match = imageUrl.match(s3UrlPattern);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting key from URL:', error);
      return null;
    }
  }

  /**
   * Update an image (delete old, upload new)
   * @param file - The new multer file object
   * @param oldImageUrl - The URL of the old image to delete
   * @param folder - Optional folder path
   * @returns Promise<UploadResult>
   */
  async updateImage(
    file: Express.Multer.File,
    oldImageUrl?: string,
    folder: string = 'plants'
  ): Promise<UploadResult> {
    try {
      // Upload new image
      const uploadResult = await this.uploadImage(file, folder);

      // Delete old image if it exists
      if (oldImageUrl) {
        const oldKey = this.extractKeyFromUrl(oldImageUrl);
        if (oldKey) {
          await this.deleteImage(oldKey).catch(error => {
            // Log error but don't fail the update if deletion fails
            console.error('Failed to delete old image:', error);
          });
        }
      }

      return uploadResult;
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  }

  /**
   * Validate if the file type is a supported image format
   * @param mimetype - The file mimetype
   * @returns boolean
   */
  private isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Generate public URL for the uploaded image
   * @param key - The S3 object key
   * @returns string
   */
  private generatePublicUrl(key: string): string {
    if (this.config.cloudFrontDomain) {
      return `https://${this.config.cloudFrontDomain}/${key}`;
    }
    return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}

// Factory function to create ImageUploadService instance
export const createImageUploadService = (): ImageUploadService => {
  const config: ImageUploadConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || '',
    cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  };

  // Validate required configuration
  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error('Missing required AWS S3 configuration. Please check your environment variables.');
  }

  return new ImageUploadService(config);
};

// Singleton instance
let imageUploadServiceInstance: ImageUploadService | null = null;

export const getImageUploadService = (): ImageUploadService => {
  if (!imageUploadServiceInstance) {
    imageUploadServiceInstance = createImageUploadService();
  }
  return imageUploadServiceInstance;
};