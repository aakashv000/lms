<template>
  <div class="settings-container">
    <div class="page-header">
      <h1>{{ $t('Settings') }}</h1>
    </div>

    <div class="settings-section">
      <h2>{{ $t('Offline Content') }}</h2>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('Download over Wi-Fi only') }}</div>
          <div class="setting-description">{{ $t('Only download course content when connected to Wi-Fi') }}</div>
        </div>
        <div class="setting-control">
          <label class="toggle">
            <input type="checkbox" v-model="wifiOnly">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('Video Quality') }}</div>
          <div class="setting-description">{{ $t('Choose the quality of downloaded videos') }}</div>
        </div>
        <div class="setting-control">
          <select v-model="videoQuality" class="select-control">
            <option value="low">{{ $t('Low (480p)') }}</option>
            <option value="medium">{{ $t('Medium (720p)') }}</option>
            <option value="high">{{ $t('High (1080p)') }}</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('Storage Usage') }}</div>
          <div class="setting-description">
            {{ storageUsage }} {{ $t('MB used for offline content') }}
          </div>
        </div>
        <div class="setting-control">
          <button class="clear-button" @click="showClearStorageConfirm = true">
            {{ $t('Clear All') }}
          </button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>{{ $t('Notifications') }}</h2>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('Course Reminders') }}</div>
          <div class="setting-description">{{ $t('Get reminders about your enrolled courses') }}</div>
        </div>
        <div class="setting-control">
          <label class="toggle">
            <input type="checkbox" v-model="courseReminders">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('New Content') }}</div>
          <div class="setting-description">{{ $t('Get notified when new content is added to your courses') }}</div>
        </div>
        <div class="setting-control">
          <label class="toggle">
            <input type="checkbox" v-model="newContentNotifications">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>{{ $t('Account') }}</h2>
      
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('Sync Progress') }}</div>
          <div class="setting-description">{{ $t('Sync your course progress across devices') }}</div>
        </div>
        <div class="setting-control">
          <label class="toggle">
            <input type="checkbox" v-model="syncProgress">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-title">{{ $t('App Version') }}</div>
          <div class="setting-description">{{ appVersion }}</div>
        </div>
      </div>

      <button class="logout-button" @click="logout">
        {{ $t('Log Out') }}
      </button>
    </div>

    <!-- Clear Storage Confirmation Dialog -->
    <div v-if="showClearStorageConfirm" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ $t('Clear All Offline Content?') }}</h3>
        <p>{{ $t('This will delete all downloaded courses and cannot be undone.') }}</p>
        <div class="modal-actions">
          <button class="cancel-button" @click="showClearStorageConfirm = false">
            {{ $t('Cancel') }}
          </button>
          <button class="confirm-button" @click="clearAllStorage">
            {{ $t('Clear All') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from '../../offline/storage';
import { useRouter } from 'vue-router';

export default {
  name: 'Settings',
  setup() {
    const isNative = Capacitor.isNativePlatform();
    const router = useRouter();
    
    // Settings state
    const wifiOnly = ref(true);
    const videoQuality = ref('medium');
    const courseReminders = ref(true);
    const newContentNotifications = ref(true);
    const syncProgress = ref(true);
    const storageUsage = ref(0);
    const appVersion = ref('1.0.0');
    const showClearStorageConfirm = ref(false);

    // Load settings
    const loadSettings = async () => {
      if (isNative) {
        try {
          // Load settings from storage
          const settings = await loadStorageSettings();
          
          wifiOnly.value = settings.wifiOnly ?? true;
          videoQuality.value = settings.videoQuality ?? 'medium';
          courseReminders.value = settings.courseReminders ?? true;
          newContentNotifications.value = settings.newContentNotifications ?? true;
          syncProgress.value = settings.syncProgress ?? true;
          
          // Calculate storage usage
          await calculateStorageUsage();
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
    };

    // Save settings when changed
    const saveSettings = async () => {
      if (isNative) {
        try {
          const settings = {
            wifiOnly: wifiOnly.value,
            videoQuality: videoQuality.value,
            courseReminders: courseReminders.value,
            newContentNotifications: newContentNotifications.value,
            syncProgress: syncProgress.value
          };
          
          await offlineStorage.saveCacheItem('app_settings', JSON.stringify(settings));
        } catch (error) {
          console.error('Error saving settings:', error);
        }
      }
    };

    // Load settings from storage
    const loadStorageSettings = async () => {
      try {
        const settingsJson = await offlineStorage.getCacheItem('app_settings');
        return settingsJson ? JSON.parse(settingsJson) : {};
      } catch (error) {
        console.error('Error loading storage settings:', error);
        return {};
      }
    };

    // Calculate storage usage
    const calculateStorageUsage = async () => {
      if (!isNative) return;
      
      try {
        // This is a placeholder. In a real app, you would use Capacitor's
        // Filesystem plugin to calculate actual storage usage
        const courses = await offlineStorage.getOfflineCourses();
        
        // Estimate storage usage (10MB per course as a placeholder)
        const estimatedUsage = courses.length * 10;
        storageUsage.value = estimatedUsage;
      } catch (error) {
        console.error('Error calculating storage usage:', error);
        storageUsage.value = 0;
      }
    };

    // Clear all offline storage
    const clearAllStorage = async () => {
      if (!isNative) return;
      
      try {
        // Get all offline courses
        const courses = await offlineStorage.getOfflineCourses();
        
        // Remove each course
        for (const course of courses) {
          await offlineStorage.removeCourse(course.id);
        }
        
        // Update storage usage
        storageUsage.value = 0;
        
        // Close confirmation dialog
        showClearStorageConfirm.value = false;
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
    };

    // Logout
    const logout = async () => {
      if (isNative) {
        try {
          // Clear auth token
          await offlineStorage.saveCacheItem('auth_token', '');
          
          // Redirect to login page
          router.push('/login');
        } catch (error) {
          console.error('Error logging out:', error);
        }
      } else {
        // For web testing
        localStorage.removeItem('auth_token');
        router.push('/login');
      }
    };

    // Watch for settings changes
    const watchSettings = () => {
      // This would normally use watch() from Vue, but for simplicity
      // we're just setting up event listeners on the form elements
      const settingsToWatch = [
        { ref: wifiOnly, name: 'wifiOnly' },
        { ref: videoQuality, name: 'videoQuality' },
        { ref: courseReminders, name: 'courseReminders' },
        { ref: newContentNotifications, name: 'newContentNotifications' },
        { ref: syncProgress, name: 'syncProgress' }
      ];
      
      // For each setting, set up a watcher
      settingsToWatch.forEach(setting => {
        if (typeof setting.ref === 'object' && setting.ref.hasOwnProperty('value')) {
          Object.defineProperty(setting.ref, 'value', {
            get: function() {
              return this._value;
            },
            set: function(newVal) {
              this._value = newVal;
              saveSettings();
            }
          });
        }
      });
    };

    onMounted(async () => {
      await loadSettings();
      watchSettings();
    });

    return {
      wifiOnly,
      videoQuality,
      courseReminders,
      newContentNotifications,
      syncProgress,
      storageUsage,
      appVersion,
      showClearStorageConfirm,
      clearAllStorage,
      logout
    };
  }
};
</script>

<style scoped>
.settings-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.settings-section {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #1e293b;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #1e293b;
}

.setting-description {
  font-size: 0.875rem;
  color: #64748b;
}

.setting-control {
  margin-left: 1rem;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2563eb;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Select Control */
.select-control {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #cbd5e1;
  background-color: white;
  color: #1e293b;
  font-size: 0.875rem;
  min-width: 120px;
}

/* Buttons */
.clear-button {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background-color: #dc2626;
}

.logout-button {
  width: 100%;
  background-color: #f1f5f9;
  color: #1e293b;
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #e2e8f0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-bottom: 0.75rem;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #1e293b;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
}

.confirm-button {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
}
</style>
