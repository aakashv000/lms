/**
 * @jest-environment jsdom
 */

import { offlineStorage } from '../storage';

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn().mockReturnValue(false)
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('OfflineStorageManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('getOfflineCourses returns empty array when no courses are stored', async () => {
    const courses = await offlineStorage.getOfflineCourses();
    expect(courses).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('offline-courses');
  });

  test('saveCourseMetadata stores course data correctly', async () => {
    const courseData = {
      id: 'course-123',
      title: 'Test Course',
      description: 'Test Description',
      progress: 0
    };

    const result = await offlineStorage.saveCourseMetadata(courseData);
    
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Verify the course was stored correctly
    const storedCoursesJson = localStorageMock.getItem('offline-courses');
    const storedCourses = JSON.parse(storedCoursesJson);
    
    expect(storedCourses).toHaveLength(1);
    expect(storedCourses[0].id).toBe('course-123');
    expect(storedCourses[0].title).toBe('Test Course');
    expect(storedCourses[0].downloadedAt).toBeDefined();
  });

  test('removeCourse removes a course from storage', async () => {
    // First add a course
    await offlineStorage.saveCourseMetadata({
      id: 'course-123',
      title: 'Test Course'
    });
    
    // Then remove it
    const result = await offlineStorage.removeCourse('course-123');
    
    expect(result).toBe(true);
    
    // Verify the course was removed
    const courses = await offlineStorage.getOfflineCourses();
    expect(courses).toHaveLength(0);
  });

  test('updateCourseProgress updates progress correctly', async () => {
    // First add a course
    await offlineStorage.saveCourseMetadata({
      id: 'course-123',
      title: 'Test Course',
      progress: 0
    });
    
    // Update progress
    const result = await offlineStorage.updateCourseProgress('course-123', 50);
    
    expect(result).toBe(true);
    
    // Verify progress was updated
    const courses = await offlineStorage.getOfflineCourses();
    expect(courses[0].progress).toBe(50);
  });

  test('getExtensionForContentType returns correct extensions', () => {
    expect(offlineStorage.getExtensionForContentType('video/mp4')).toBe('mp4');
    expect(offlineStorage.getExtensionForContentType('application/pdf')).toBe('pdf');
    expect(offlineStorage.getExtensionForContentType('unknown/type')).toBe('bin');
  });
});
