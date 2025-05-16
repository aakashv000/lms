<template>
  <div class="offline-courses-container">
    <div class="page-header">
      <h1>{{ $t('Offline Courses') }}</h1>
      <div class="network-status" :class="{ 'offline': !isOnline }">
        {{ isOnline ? $t('Online') : $t('Offline') }}
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ $t('Loading your offline courses...') }}</p>
    </div>

    <div v-else-if="offlineCourses.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
      <h2>{{ $t('No offline courses yet') }}</h2>
      <p>{{ $t('Download courses to access them when you\'re offline.') }}</p>
      <router-link to="/courses" class="primary-button">
        {{ $t('Browse Courses') }}
      </router-link>
    </div>

    <div v-else class="courses-list">
      <div 
        v-for="course in offlineCourses" 
        :key="course.id" 
        class="course-card"
      >
        <div class="course-image">
          <img :src="course.thumbnail || '/placeholder-course.jpg'" :alt="course.title">
          <div class="progress-indicator">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${course.progress}%` }"></div>
            </div>
            <span class="progress-text">{{ course.progress }}% {{ $t('Complete') }}</span>
          </div>
        </div>
        <div class="course-content">
          <h3 class="course-title">{{ course.title }}</h3>
          <p class="course-description">{{ course.description }}</p>
          <div class="course-meta">
            <span class="download-date">
              {{ $t('Downloaded') }}: {{ formatDate(course.downloadedAt) }}
            </span>
            <div class="course-actions">
              <router-link :to="`/course/${course.id}`" class="view-button">
                {{ $t('View Course') }}
              </router-link>
              <button class="delete-button" @click="removeCourse(course.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from '../../offline/storage';

export default {
  name: 'OfflineCourses',
  setup() {
    const isNative = Capacitor.isNativePlatform();
    const offlineCourses = ref([]);
    const loading = ref(true);
    const isOnline = ref(true);
    let networkListenerId = null;

    // Load offline courses
    const loadOfflineCourses = async () => {
      loading.value = true;
      
      try {
        if (isNative) {
          const courses = await offlineStorage.getOfflineCourses();
          offlineCourses.value = courses.filter(course => 
            course.status === 'completed' || course.status === 'downloading'
          );
        } else {
          // Fallback for web testing
          const storedCourses = localStorage.getItem('offline-courses');
          offlineCourses.value = storedCourses ? JSON.parse(storedCourses) : [];
        }
      } catch (error) {
        console.error('Error loading offline courses:', error);
        offlineCourses.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Remove a course from offline storage
    const removeCourse = async (courseId) => {
      try {
        if (isNative) {
          await offlineStorage.removeCourse(courseId);
        } else {
          // Fallback for web testing
          const courses = JSON.parse(localStorage.getItem('offline-courses') || '[]');
          const updatedCourses = courses.filter(course => course.id !== courseId);
          localStorage.setItem('offline-courses', JSON.stringify(updatedCourses));
        }
        
        // Refresh the list
        await loadOfflineCourses();
      } catch (error) {
        console.error('Error removing course:', error);
      }
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Setup event listeners
    onMounted(async () => {
      // Load offline courses
      await loadOfflineCourses();
      
      if (isNative) {
        // Check network status
        const status = await Network.getStatus();
        isOnline.value = status.connected;
        
        // Add network listener
        networkListenerId = Network.addListener('networkStatusChange', (status) => {
          isOnline.value = status.connected;
        });
      }
    });

    // Clean up event listeners
    onUnmounted(() => {
      if (isNative && networkListenerId) {
        Network.removeAllListeners();
      }
    });

    return {
      offlineCourses,
      loading,
      isOnline,
      removeCourse,
      formatDate
    };
  }
};
</script>

<style scoped>
.offline-courses-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.network-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #10b981;
  color: white;
}

.network-status.offline {
  background-color: #ef4444;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #2563eb;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: #64748b;
  max-width: 400px;
}

.primary-button {
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: #1d4ed8;
}

.courses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.course-card {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.course-image {
  position: relative;
  height: 180px;
}

.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.progress-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
}

.progress-bar {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background-color: #10b981;
}

.progress-text {
  font-size: 0.75rem;
  color: white;
}

.course-content {
  padding: 1rem;
}

.course-title {
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  color: #1e293b;
}

.course-description {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.download-date {
  font-size: 0.75rem;
  color: #64748b;
}

.course-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-button {
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.view-button:hover {
  background-color: #1d4ed8;
}

.delete-button {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 640px) {
  .courses-list {
    grid-template-columns: 1fr;
  }
}
</style>
