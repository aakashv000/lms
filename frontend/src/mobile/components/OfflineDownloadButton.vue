<template>
  <div class="offline-download-container">
    <button 
      v-if="!isDownloaded && !isDownloading" 
      class="download-button" 
      @click="downloadCourse"
      :disabled="!isOnline"
    >
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </span>
      <span>{{ $t('Download for offline use') }}</span>
    </button>
    
    <div v-else-if="isDownloading" class="download-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-text">
        {{ progress }}% {{ $t('Downloaded') }}
        <button class="cancel-button" @click="cancelDownload">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-else class="downloaded-status">
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </span>
      <span>{{ $t('Available offline') }}</span>
      <button class="remove-button" @click="removeCourse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from '../../offline/storage';
import { downloadManager } from '../../offline/download-manager';

export default {
  name: 'OfflineDownloadButton',
  props: {
    course: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isNative = Capacitor.isNativePlatform();
    const isDownloaded = ref(false);
    const isDownloading = ref(false);
    const progress = ref(0);
    const isOnline = ref(true);
    let downloadListenerId = null;
    let networkListenerId = null;

    // Check if course is already downloaded
    const checkDownloadStatus = async () => {
      if (!isNative) return;
      
      const offlineCourses = await offlineStorage.getOfflineCourses();
      const course = offlineCourses.find(c => c.id === props.course.id);
      
      if (course) {
        isDownloaded.value = course.status === 'completed';
        isDownloading.value = course.status === 'downloading' || course.status === 'queued';
        progress.value = course.progress || 0;
      } else {
        isDownloaded.value = false;
        isDownloading.value = false;
        progress.value = 0;
      }
    };

    // Download the course for offline use
    const downloadCourse = async () => {
      if (!isNative || !isOnline.value) return;
      
      isDownloading.value = true;
      progress.value = 0;
      
      // Prepare course content for download
      const courseContent = props.course.lessons.map(lesson => ({
        id: lesson.id,
        url: lesson.video_url || lesson.content_url,
        contentType: lesson.video_url ? 'video/mp4' : 'text/html',
        title: lesson.title
      }));
      
      // Queue the course for download
      await downloadManager.queueCourseDownload({
        id: props.course.id,
        title: props.course.title,
        description: props.course.description,
        thumbnail: props.course.image,
        content: courseContent
      });
    };

    // Cancel the download
    const cancelDownload = async () => {
      if (!isNative) return;
      
      await downloadManager.cancelDownload(props.course.id);
      isDownloading.value = false;
      progress.value = 0;
    };

    // Remove the course from offline storage
    const removeCourse = async () => {
      if (!isNative) return;
      
      await offlineStorage.removeCourse(props.course.id);
      isDownloaded.value = false;
    };

    // Handle download events
    const handleDownloadEvent = (event) => {
      if (event.data.courseId === props.course.id) {
        if (event.event === 'item_downloaded') {
          progress.value = event.data.progress;
        } else if (event.event === 'course_downloaded') {
          isDownloading.value = false;
          isDownloaded.value = true;
          progress.value = 100;
        } else if (event.event === 'download_cancelled') {
          isDownloading.value = false;
          progress.value = 0;
        }
      }
    };

    // Setup event listeners
    onMounted(async () => {
      if (!isNative) return;
      
      // Check initial download status
      await checkDownloadStatus();
      
      // Add download event listener
      downloadListenerId = downloadManager.addListener(handleDownloadEvent);
      
      // Check network status
      const status = await Network.getStatus();
      isOnline.value = status.connected;
      
      // Add network listener
      networkListenerId = Network.addListener('networkStatusChange', (status) => {
        isOnline.value = status.connected;
      });
    });

    // Clean up event listeners
    onUnmounted(() => {
      if (!isNative) return;
      
      if (downloadListenerId !== null) {
        downloadManager.removeListener(downloadListenerId);
      }
      
      if (networkListenerId) {
        Network.removeAllListeners();
      }
    });

    return {
      isDownloaded,
      isDownloading,
      progress,
      isOnline,
      downloadCourse,
      cancelDownload,
      removeCourse
    };
  }
};
</script>

<style scoped>
.offline-download-container {
  margin: 1rem 0;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.download-button:hover {
  background-color: #1d4ed8;
}

.download-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.download-progress {
  margin: 1rem 0;
}

.progress-bar {
  height: 0.5rem;
  background-color: #e2e8f0;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #64748b;
}

.cancel-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
}

.downloaded-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-weight: 500;
}

.remove-button {
  margin-left: auto;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
