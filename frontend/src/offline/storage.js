import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

/**
 * Offline content storage manager
 * Handles storing and retrieving course content for offline use
 */
class OfflineStorageManager {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.offlineCoursesKey = 'offline-courses';
    this.offlineContentDir = 'offline-content';
    this.initialize();
  }

  /**
   * Initialize the storage system
   */
  async initialize() {
    if (this.isNative) {
      try {
        // Create directory for offline content if it doesn't exist
        await Filesystem.mkdir({
          path: this.offlineContentDir,
          directory: Directory.Data,
          recursive: true
        });
      } catch (error) {
        // Directory might already exist
        console.log('Storage initialization:', error);
      }
    }
  }

  /**
   * Get list of courses available offline
   * @returns {Promise<Array>} Array of offline course objects
   */
  async getOfflineCourses() {
    try {
      if (this.isNative) {
        const { value } = await Storage.get({ key: this.offlineCoursesKey });
        return value ? JSON.parse(value) : [];
      } else {
        // Fallback to localStorage for web
        const courses = localStorage.getItem(this.offlineCoursesKey);
        return courses ? JSON.parse(courses) : [];
      }
    } catch (error) {
      console.error('Error getting offline courses:', error);
      return [];
    }
  }

  /**
   * Save course metadata to offline storage
   * @param {Object} course Course object with metadata
   * @returns {Promise<boolean>} Success status
   */
  async saveCourseMetadata(course) {
    try {
      const courses = await this.getOfflineCourses();
      
      // Check if course already exists
      const existingIndex = courses.findIndex(c => c.id === course.id);
      if (existingIndex >= 0) {
        courses[existingIndex] = { ...courses[existingIndex], ...course };
      } else {
        courses.push({
          ...course,
          downloadedAt: new Date().toISOString(),
          progress: course.progress || 0
        });
      }

      if (this.isNative) {
        await Storage.set({
          key: this.offlineCoursesKey,
          value: JSON.stringify(courses)
        });
      } else {
        // Fallback to localStorage for web
        localStorage.setItem(this.offlineCoursesKey, JSON.stringify(courses));
      }
      return true;
    } catch (error) {
      console.error('Error saving course metadata:', error);
      return false;
    }
  }

  /**
   * Remove a course from offline storage
   * @param {string} courseId ID of the course to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeCourse(courseId) {
    try {
      const courses = await this.getOfflineCourses();
      const filteredCourses = courses.filter(course => course.id !== courseId);
      
      if (this.isNative) {
        await Storage.set({
          key: this.offlineCoursesKey,
          value: JSON.stringify(filteredCourses)
        });
        
        // Remove course content directory
        await Filesystem.rmdir({
          path: `${this.offlineContentDir}/${courseId}`,
          directory: Directory.Data,
          recursive: true
        });
      } else {
        // Fallback to localStorage for web
        localStorage.setItem(this.offlineCoursesKey, JSON.stringify(filteredCourses));
      }
      return true;
    } catch (error) {
      console.error('Error removing course:', error);
      return false;
    }
  }

  /**
   * Save content file to offline storage
   * @param {string} courseId ID of the course
   * @param {string} contentId ID of the content item
   * @param {Blob} data Content data as Blob
   * @param {string} contentType Type of content (video, pdf, etc.)
   * @returns {Promise<string>} Path to the saved content
   */
  async saveContent(courseId, contentId, data, contentType) {
    if (!this.isNative) {
      console.warn('Content saving is only available in native apps');
      return null;
    }

    try {
      // Create course directory if needed
      const coursePath = `${this.offlineContentDir}/${courseId}`;
      try {
        await Filesystem.mkdir({
          path: coursePath,
          directory: Directory.Data,
          recursive: true
        });
      } catch (error) {
        // Directory might already exist
      }

      // Convert blob to base64
      const base64Data = await this.blobToBase64(data);
      
      // Generate filename based on content type
      const extension = this.getExtensionForContentType(contentType);
      const filename = `${contentId}.${extension}`;
      
      // Write the file
      const result = await Filesystem.writeFile({
        path: `${coursePath}/${filename}`,
        data: base64Data,
        directory: Directory.Data,
        recursive: true
      });

      return result.uri;
    } catch (error) {
      console.error('Error saving content:', error);
      return null;
    }
  }

  /**
   * Get content file from offline storage
   * @param {string} courseId ID of the course
   * @param {string} contentId ID of the content item
   * @param {string} contentType Type of content (video, pdf, etc.)
   * @returns {Promise<string>} URI to the content
   */
  async getContent(courseId, contentId, contentType) {
    if (!this.isNative) {
      console.warn('Content retrieval is only available in native apps');
      return null;
    }

    try {
      const extension = this.getExtensionForContentType(contentType);
      const filename = `${contentId}.${extension}`;
      const path = `${this.offlineContentDir}/${courseId}/${filename}`;
      
      const file = await Filesystem.getUri({
        path: path,
        directory: Directory.Data
      });
      
      return file.uri;
    } catch (error) {
      console.error('Error getting content:', error);
      return null;
    }
  }

  /**
   * Check if content is available offline
   * @param {string} courseId ID of the course
   * @param {string} contentId ID of the content item
   * @param {string} contentType Type of content (video, pdf, etc.)
   * @returns {Promise<boolean>} Whether content is available offline
   */
  async isContentAvailable(courseId, contentId, contentType) {
    if (!this.isNative) return false;

    try {
      const extension = this.getExtensionForContentType(contentType);
      const filename = `${contentId}.${extension}`;
      const path = `${this.offlineContentDir}/${courseId}/${filename}`;
      
      await Filesystem.stat({
        path: path,
        directory: Directory.Data
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update course progress
   * @param {string} courseId ID of the course
   * @param {number} progress Progress percentage (0-100)
   * @returns {Promise<boolean>} Success status
   */
  async updateCourseProgress(courseId, progress) {
    try {
      const courses = await this.getOfflineCourses();
      const courseIndex = courses.findIndex(course => course.id === courseId);
      
      if (courseIndex >= 0) {
        courses[courseIndex].progress = progress;
        
        if (this.isNative) {
          await Storage.set({
            key: this.offlineCoursesKey,
            value: JSON.stringify(courses)
          });
        } else {
          localStorage.setItem(this.offlineCoursesKey, JSON.stringify(courses));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating course progress:', error);
      return false;
    }
  }

  /**
   * Helper: Convert Blob to base64 string
   * @param {Blob} blob Blob to convert
   * @returns {Promise<string>} Base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper: Get file extension based on content type
   * @param {string} contentType MIME type
   * @returns {string} File extension
   */
  getExtensionForContentType(contentType) {
    const map = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/html': 'html',
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png'
    };
    
    return map[contentType] || 'bin';
  }
}

export const offlineStorage = new OfflineStorageManager();
