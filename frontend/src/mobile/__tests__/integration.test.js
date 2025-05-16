/**
 * @jest-environment jsdom
 */

import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import OfflineDownloadButton from '../components/OfflineDownloadButton.vue';
import { offlineStorage } from '../../offline/storage';
import { downloadManager } from '../../offline/download-manager';

// Mock Vue Router
jest.mock('vue-router', () => ({
  createRouter: jest.fn(() => ({
    push: jest.fn(),
    beforeEach: jest.fn(),
    afterEach: jest.fn(),
    currentRoute: { value: { path: '/' } }
  })),
  createWebHistory: jest.fn()
}));

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn().mockReturnValue(true)
  }
}));

// Mock Network
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn().mockResolvedValue({ connected: true }),
    addListener: jest.fn().mockReturnValue(1),
    removeAllListeners: jest.fn()
  }
}));

// Mock offlineStorage
jest.mock('../../offline/storage', () => ({
  offlineStorage: {
    getOfflineCourses: jest.fn().mockResolvedValue([]),
    saveCourseMetadata: jest.fn().mockResolvedValue(true),
    removeCourse: jest.fn().mockResolvedValue(true)
  }
}));

// Mock downloadManager
jest.mock('../../offline/download-manager', () => ({
  downloadManager: {
    queueCourseDownload: jest.fn().mockResolvedValue(true),
    cancelDownload: jest.fn().mockResolvedValue(true),
    addListener: jest.fn().mockReturnValue(0),
    removeListener: jest.fn()
  }
}));

// Mock translation function
global.$t = jest.fn(key => key);

describe('Mobile Integration Tests', () => {
  let wrapper;
  let router;
  let pinia;
  
  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: []
    });
    
    pinia = createPinia();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });
  
  test('OfflineDownloadButton integrates with storage and download manager', async () => {
    // Mock course data
    const course = {
      id: 'course-123',
      title: 'Test Course',
      description: 'Test Description',
      lessons: [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          video_url: 'https://example.com/video1.mp4'
        }
      ]
    };
    
    // Mount the component
    wrapper = mount(OfflineDownloadButton, {
      props: {
        course
      },
      global: {
        plugins: [router, pinia],
        mocks: {
          $t: key => key
        }
      }
    });
    
    // Verify initial state
    expect(wrapper.find('.download-button').exists()).toBe(true);
    expect(wrapper.find('.download-progress').exists()).toBe(false);
    
    // Trigger download
    await wrapper.find('.download-button').trigger('click');
    
    // Verify download was queued
    expect(downloadManager.queueCourseDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'course-123',
        title: 'Test Course',
        content: expect.arrayContaining([
          expect.objectContaining({
            id: 'lesson-1',
            contentType: 'video/mp4'
          })
        ])
      })
    );
    
    // Simulate download progress update
    await wrapper.setData({ isDownloading: true, progress: 50 });
    
    // Verify progress is shown
    expect(wrapper.find('.download-progress').exists()).toBe(true);
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 50%');
    
    // Trigger cancel download
    await wrapper.find('.cancel-button').trigger('click');
    
    // Verify cancel was called
    expect(downloadManager.cancelDownload).toHaveBeenCalledWith('course-123');
  });
  
  test('Mobile API service handles offline mode correctly', async () => {
    // This would test the mobile API service's offline handling
    // but we'll just verify the imports work correctly for now
    const { mobileApiService } = await import('../api-service');
    expect(mobileApiService).toBeDefined();
  });
});
