const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const axios = require('axios');

class PhotoService {
  constructor() {
    this.bucketName = 'decision-photos';
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    this.maxDimension = 800; // Max width/height in pixels
    this.imageQuality = 85; // JPEG quality
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    if (!file) {
      throw new Error('No image file provided');
    }

    if (file.size > this.maxImageSize) {
      throw new Error(`Image size must be less than ${this.maxImageSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error('Only JPEG and PNG images are allowed');
    }

    return true;
  }

  /**
   * Process and optimize image
   */
  async processImage(buffer, originalName) {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = metadata.width;
      let height = metadata.height;
      
      if (width > this.maxDimension || height > this.maxDimension) {
        if (width > height) {
          height = Math.round((height * this.maxDimension) / width);
          width = this.maxDimension;
        } else {
          width = Math.round((width * this.maxDimension) / height);
          height = this.maxDimension;
        }
      }

      // Process image
      const processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: this.imageQuality })
        .toBuffer();

      return {
        buffer: processedBuffer,
        metadata: {
          width,
          height,
          format: 'jpeg',
          size: processedBuffer.length,
          originalName
        }
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Process image (fallback without Supabase Storage)
   */
  async uploadImage(userId, buffer, metadata, label = null) {
    try {
      const fileName = `${uuidv4()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Convert buffer to base64 for temporary use
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      return {
        id: fileName,
        path: filePath,
        url: dataUrl, // Use data URL instead of Supabase storage
        label: label || `Option ${Math.floor(Math.random() * 900) + 100}`,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(userId, files, labels = []) {
    if (!files || files.length === 0) {
      throw new Error('No images provided');
    }

    if (files.length < 2 || files.length > 3) {
      throw new Error('Please provide 2-3 images for comparison');
    }

    const uploadPromises = files.map(async (file, index) => {
      this.validateImage(file);
      
      const processed = await this.processImage(file.buffer, file.originalname);
      const label = labels[index] || `Option ${index + 1}`;
      
      return this.uploadImage(userId, processed.buffer, processed.metadata, label);
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      return uploadedImages;
    } catch (error) {
      // Clean up any successfully uploaded images if one fails
      await this.cleanupFailedUploads(userId, uploadPromises);
      throw error;
    }
  }

  /**
   * Generate image caption using AI service
   */
  async generateCaption(imageUrl) {
    // Temporarily disable external caption generation to avoid API issues
    // Return a simple descriptive caption based on the image label if available
    try {
      // For now, return a generic caption - this will be improved with working HF integration
      return 'Image uploaded for comparison - AI will analyze the actual visual content';
    } catch (error) {
      console.warn('Caption generation failed:', error.message);
      return 'Image uploaded for decision';
    }
  }

  /**
   * Generate captions for multiple images
   */
  async generateCaptions(images) {
    const captionPromises = images.map(async (image) => {
      try {
        const caption = await this.generateCaption(image.url);
        return {
          ...image,
          caption
        };
      } catch (error) {
        console.warn(`Caption generation failed for ${image.id}:`, error.message);
        return {
          ...image,
          caption: 'Image uploaded for decision'
        };
      }
    });

    return Promise.all(captionPromises);
  }

  /**
   * Clean up uploaded images (for TTL or failed uploads)
   */
  async deleteImage(userId, imagePath) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([imagePath]);

      if (error) {
        console.warn(`Failed to delete image ${imagePath}:`, error.message);
      }
    } catch (error) {
      console.warn(`Error deleting image ${imagePath}:`, error.message);
    }
  }

  /**
   * Clean up multiple images
   */
  async deleteImages(userId, imagePaths) {
    const deletePromises = imagePaths.map(path => this.deleteImage(userId, path));
    await Promise.allSettled(deletePromises);
  }

  /**
   * Clean up failed uploads
   */
  async cleanupFailedUploads(userId, uploadPromises) {
    try {
      const results = await Promise.allSettled(uploadPromises);
      const pathsToDelete = results
        .filter(result => result.status === 'fulfilled' && result.value?.path)
        .map(result => result.value.path);
      
      if (pathsToDelete.length > 0) {
        await this.deleteImages(userId, pathsToDelete);
      }
    } catch (error) {
      console.warn('Cleanup of failed uploads failed:', error.message);
    }
  }

  /**
   * Schedule cleanup job for expired images (call this periodically)
   */
  async cleanupExpiredImages() {
    try {
      // Get all images older than 24 hours from photo_decisions
      const { data: expiredDecisions, error } = await supabase
        .from('photo_decisions')
        .select('images')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.warn('Failed to fetch expired decisions:', error.message);
        return;
      }

      const pathsToDelete = [];
      expiredDecisions.forEach(decision => {
        if (decision.images && Array.isArray(decision.images)) {
          decision.images.forEach(image => {
            if (image.path) {
              pathsToDelete.push(image.path);
            }
          });
        }
      });

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.bucketName)
          .remove(pathsToDelete);

        if (deleteError) {
          console.warn('Failed to delete expired images:', deleteError.message);
        } else {
          console.log(`Cleaned up ${pathsToDelete.length} expired images`);
        }
      }
    } catch (error) {
      console.warn('Cleanup job failed:', error.message);
    }
  }
}

module.exports = new PhotoService();