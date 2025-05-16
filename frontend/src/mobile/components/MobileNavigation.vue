<template>
  <div class="mobile-navigation">
    <!-- Bottom Navigation Bar -->
    <nav class="bottom-nav">
      <router-link to="/lms" class="nav-item" active-class="active">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span class="nav-label">{{ $t('Home') }}</span>
      </router-link>
      
      <router-link to="/lms/courses" class="nav-item" active-class="active">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <span class="nav-label">{{ $t('Courses') }}</span>
      </router-link>
      
      <router-link to="/offline-courses" class="nav-item" active-class="active">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <div v-if="offlineCoursesCount > 0" class="badge">{{ offlineCoursesCount }}</div>
        </div>
        <span class="nav-label">{{ $t('Offline') }}</span>
      </router-link>
      
      <router-link to="/lms/profile" class="nav-item" active-class="active">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span class="nav-label">{{ $t('Profile') }}</span>
      </router-link>
      
      <router-link to="/settings" class="nav-item" active-class="active">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>
        <span class="nav-label">{{ $t('Settings') }}</span>
      </router-link>
    </nav>
    
    <!-- Network Status Indicator -->
    <div 
      v-if="!isOnline" 
      class="network-status offline"
      @click="showOfflineCourses"
    >
      {{ $t('You are offline. Tap to view offline courses.') }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from '../../offline/storage';

export default {
  name: 'MobileNavigation',
  setup() {
    const isNative = Capacitor.isNativePlatform();
    const isOnline = ref(true);
    const offlineCoursesCount = ref(0);
    const router = useRouter();
    let networkListenerId = null;

    // Navigate to offline courses
    const showOfflineCourses = () => {
      router.push('/offline-courses');
    };

    // Load offline courses count
    const loadOfflineCoursesCount = async () => {
      if (!isNative) return;
      
      try {
        const courses = await offlineStorage.getOfflineCourses();
        offlineCoursesCount.value = courses.filter(course => 
          course.status === 'completed' || course.status === 'downloading'
        ).length;
      } catch (error) {
        console.error('Error loading offline courses count:', error);
      }
    };

    // Setup event listeners
    onMounted(async () => {
      if (isNative) {
        // Load initial offline courses count
        await loadOfflineCoursesCount();
        
        // Check network status
        const status = await Network.getStatus();
        isOnline.value = status.connected;
        
        // Add network listener
        networkListenerId = Network.addListener('networkStatusChange', (status) => {
          isOnline.value = status.connected;
          
          // Reload offline courses count when going online
          if (status.connected) {
            loadOfflineCoursesCount();
          }
        });
        
        // Listen for offline content changes
        window.addEventListener('offlineContentChanged', loadOfflineCoursesCount);
      }
    });

    // Clean up event listeners
    onUnmounted(() => {
      if (isNative) {
        if (networkListenerId) {
          Network.removeAllListeners();
        }
        
        window.removeEventListener('offlineContentChanged', loadOfflineCoursesCount);
      }
    });

    return {
      isOnline,
      offlineCoursesCount,
      showOfflineCourses
    };
  }
};
</script>

<style scoped>
.mobile-navigation {
  position: relative;
  z-index: 100;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  color: #64748b;
  text-decoration: none;
  flex: 1;
  transition: color 0.2s;
}

.nav-item.active {
  color: #2563eb;
}

.nav-icon {
  position: relative;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  z-index: 101;
  transition: transform 0.3s ease;
}

.network-status.offline {
  background-color: #ef4444;
  color: white;
  transform: translateY(0);
}

/* Add padding to the page content to account for the bottom nav */
:global(body) {
  padding-bottom: 70px !important;
}

/* Add padding when offline banner is shown */
:global(body.is-offline) {
  padding-top: 40px !important;
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
  
  .network-status {
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 8px 8px;
  }
  
  :global(body) {
    padding-bottom: 0 !important;
  }
  
  :global(body.is-offline) {
    padding-top: 0 !important;
  }
}
</style>
