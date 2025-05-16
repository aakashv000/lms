import { offlineStorage } from './storage';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * Download Manager for offline content
 * Handles downloading and queuing course content for offline use
 */
class DownloadManager {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.downloadQueue = [];
    this.isDownloading = false;
    this.listeners = [];
    this.initialize();
  }

  /**
   * Initialize the download manager
   */
  async initialize() {
    if (this.isNative) {
      // Listen for network status changes
      Network.addListener('networkStatusChange', status => {
        if (status.connected && this.downloadQueue.length > 0 && !this.isDownloading) {
          this.processQueue();
        }
      });
    }
  }

  /**
   * Add a course to the download queue
   * @param {Object} course Course object with metadata and content URLs
   * @returns {Promise<boolean>} Success status
   */
  async queueCourseDownload(course) {
    try {
      // First save the course metadata
      await offlineStorage.saveCourseMetadata({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        progress: 0,
        contentCount: course.content.length,
        downloadedContentCount: 0,
        status: 'queued'
      });

      // Add each content item to the download queue
      course.content.forEach(item => {
        this.downloadQueue.push({
          courseId: course.id,
          contentId: item.id,
          url: item.url,
          contentType: item.contentType,
          title: item.title
        });
      });

      // Start processing the queue if not already downloading
      if (!this.isDownloading) {
        this.processQueue();
      }

      return true;
    } catch (error) {
      console.error('Error queuing course download:', error);
      return false;
    }
  }

  /**
   * Process the download queue
   */
  async processQueue() {
    if (this.isDownloading || this.downloadQueue.length === 0) return;

    this.isDownloading = true;
    this.notifyListeners('download_started');

    try {
      // Check network status
      if (this.isNative) {
        const status = await Network.getStatus();
        if (!status.connected) {
          this.isDownloading = false;
          this.notifyListeners('download_paused', { reason: 'offline' });
          return;
        }
      }

      // Group queue items by course for progress tracking
      const courseGroups = this.groupQueueByCourse();
      
      // Process each course group
      for (const courseId in courseGroups) {
        const items = courseGroups[courseId];
        let downloadedCount = 0;
        
        // Get existing course data
        const courses = await offlineStorage.getOfflineCourses();
        const course = courses.find(c => c.id === courseId);
        
        if (!course) continue;
        
        // Update course status
        await offlineStorage.saveCourseMetadata({
          ...course,
          status: 'downloading'
        });
        
        // Process each item in the course
        for (const item of items) {
          try {
            // Download and save the content
            const blob = await this.downloadContent(item.url);
            if (blob) {
              await offlineStorage.saveContent(
                item.courseId,
                item.contentId,
                blob,
                item.contentType
              );
              
              // Remove from queue
              this.downloadQueue = this.downloadQueue.filter(
                qItem => !(qItem.courseId === item.courseId && qItem.contentId === item.contentId)
              );
              
              // Update progress
              downloadedCount++;
              const progress = Math.round((downloadedCount / items.length) * 100);
              
              await offlineStorage.saveCourseMetadata({
                ...course,
                downloadedContentCount: course.downloadedContentCount + 1,
                progress: progress,
                status: progress === 100 ? 'completed' : 'downloading'
              });
              
              this.notifyListeners('item_downloaded', {
                courseId: item.courseId,
                contentId: item.contentId,
                progress: progress
              });
            }
          } catch (error) {
            console.error(`Error downloading content ${item.contentId}:`, error);
            // Continue with next item
          }
        }
        
        // Final update for course
        await offlineStorage.saveCourseMetadata({
          ...course,
          status: 'completed'
        });
        
        this.notifyListeners('course_downloaded', { courseId });
      }
    } catch (error) {
      console.error('Error processing download queue:', error);
    } finally {
      this.isDownloading = false;
      if (this.downloadQueue.length > 0) {
        // More items in queue
        this.notifyListeners('download_paused', { reason: 'error' });
      } else {
        this.notifyListeners('download_completed');
      }
    }
  }

  /**
   * Download content from URL
   * @param {string} url URL to download from
   * @returns {Promise<Blob>} Content as Blob
   */
  async downloadContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.blob();
    } catch (error) {
      console.error('Error downloading content:', error);
      return null;
    }
  }

  /**
   * Group download queue items by course
   * @returns {Object} Object with courseId keys and arrays of queue items
   */
  groupQueueByCourse() {
    return this.downloadQueue.reduce((groups, item) => {
      if (!groups[item.courseId]) {
        groups[item.courseId] = [];
      }
      groups[item.courseId].push(item);
      return groups;
    }, {});
  }

  /**
   * Cancel download for a course
   * @param {string} courseId ID of the course to cancel
   * @returns {Promise<boolean>} Success status
   */
  async cancelDownload(courseId) {
    try {
      // Remove items from queue
      this.downloadQueue = this.downloadQueue.filter(item => item.courseId !== courseId);
      
      // Update course status
      const courses = await offlineStorage.getOfflineCourses();
      const course = courses.find(c => c.id === courseId);
      
      if (course) {
        await offlineStorage.saveCourseMetadata({
          ...course,
          status: 'cancelled'
        });
      }
      
      this.notifyListeners('download_cancelled', { courseId });
      return true;
    } catch (error) {
      console.error('Error cancelling download:', error);
      return false;
    }
  }

  /**
   * Add event listener
   * @param {Function} callback Callback function
   * @returns {number} Listener ID
   */
  addListener(callback) {
    this.listeners.push(callback);
    return this.listeners.length - 1;
  }

  /**
   * Remove event listener
   * @param {number} id Listener ID
   */
  removeListener(id) {
    if (id >= 0 && id < this.listeners.length) {
      this.listeners[id] = null;
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event Event name
   * @param {Object} data Event data
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(listener => {
      if (listener) {
        listener({ event, data });
      }
    });
  }
}

export const downloadManager = new DownloadManager();
