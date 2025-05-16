/**
 * @jest-environment jsdom
 */

import { downloadManager } from '../download-manager';
import { offlineStorage } from '../storage';

// Mock offlineStorage
jest.mock('../storage', () => ({
  offlineStorage: {
    saveCourseMetadata: jest.fn().mockResolvedValue(true),
    getOfflineCourses: jest.fn().mockResolvedValue([]),
    saveContent: jest.fn().mockResolvedValue('/path/to/content'),
    removeCourse: jest.fn().mockResolvedValue(true)
  }
}));

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn().mockReturnValue(false)
  }
}));

// Mock Network
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn().mockResolvedValue({ connected: true }),
    addListener: jest.fn().mockReturnValue(1)
  }
}));

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob(['test content'], { type: 'text/plain' }))
  })
);

describe('DownloadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('queueCourseDownload adds course to queue and saves metadata', async () => {
    const course = {
      id: 'course-123',
      title: 'Test Course',
      description: 'Test Description',
      content: [
        {
          id: 'content-1',
          url: 'https://example.com/content-1',
          contentType: 'video/mp4',
          title: 'Lesson 1'
        },
        {
          id: 'content-2',
          url: 'https://example.com/content-2',
          contentType: 'application/pdf',
          title: 'Lesson 2'
        }
      ]
    };

    // Mock processQueue to prevent actual processing
    const originalProcessQueue = downloadManager.processQueue;
    downloadManager.processQueue = jest.fn();

    const result = await downloadManager.queueCourseDownload(course);
    
    expect(result).toBe(true);
    expect(offlineStorage.saveCourseMetadata).toHaveBeenCalledWith(expect.objectContaining({
      id: 'course-123',
      title: 'Test Course',
      status: 'queued'
    }));
    
    // Verify items were added to queue
    expect(downloadManager.downloadQueue.length).toBe(2);
    expect(downloadManager.downloadQueue[0].courseId).toBe('course-123');
    expect(downloadManager.downloadQueue[0].contentId).toBe('content-1');
    
    // Restore original method
    downloadManager.processQueue = originalProcessQueue;
    
    // Clear queue for other tests
    downloadManager.downloadQueue = [];
  });

  test('cancelDownload removes items from queue', async () => {
    // Add items to queue
    downloadManager.downloadQueue = [
      {
        courseId: 'course-123',
        contentId: 'content-1',
        url: 'https://example.com/content-1',
        contentType: 'video/mp4',
        title: 'Lesson 1'
      },
      {
        courseId: 'course-123',
        contentId: 'content-2',
        url: 'https://example.com/content-2',
        contentType: 'application/pdf',
        title: 'Lesson 2'
      },
      {
        courseId: 'course-456',
        contentId: 'content-3',
        url: 'https://example.com/content-3',
        contentType: 'video/mp4',
        title: 'Lesson 3'
      }
    ];
    
    // Mock getOfflineCourses to return a course
    offlineStorage.getOfflineCourses.mockResolvedValueOnce([
      { id: 'course-123', title: 'Test Course', status: 'downloading' }
    ]);
    
    // Add a test listener
    const mockListener = jest.fn();
    downloadManager.addListener(mockListener);
    
    const result = await downloadManager.cancelDownload('course-123');
    
    expect(result).toBe(true);
    expect(downloadManager.downloadQueue.length).toBe(1);
    expect(downloadManager.downloadQueue[0].courseId).toBe('course-456');
    
    // Verify course status was updated
    expect(offlineStorage.saveCourseMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'course-123',
        status: 'cancelled'
      })
    );
    
    // Verify listener was notified
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'download_cancelled',
        data: { courseId: 'course-123' }
      })
    );
    
    // Clear queue for other tests
    downloadManager.downloadQueue = [];
    downloadManager.listeners = [];
  });

  test('downloadContent fetches content correctly', async () => {
    const url = 'https://example.com/content';
    const blob = await downloadManager.downloadContent(url);
    
    expect(fetch).toHaveBeenCalledWith(url);
    expect(blob).toBeInstanceOf(Blob);
  });

  test('groupQueueByCourse groups items correctly', () => {
    // Add items to queue
    downloadManager.downloadQueue = [
      { courseId: 'course-1', contentId: 'content-1' },
      { courseId: 'course-1', contentId: 'content-2' },
      { courseId: 'course-2', contentId: 'content-3' }
    ];
    
    const groups = downloadManager.groupQueueByCourse();
    
    expect(Object.keys(groups).length).toBe(2);
    expect(groups['course-1'].length).toBe(2);
    expect(groups['course-2'].length).toBe(1);
    
    // Clear queue for other tests
    downloadManager.downloadQueue = [];
  });

  test('addListener and removeListener work correctly', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    const id1 = downloadManager.addListener(listener1);
    const id2 = downloadManager.addListener(listener2);
    
    expect(downloadManager.listeners.length).toBe(2);
    
    downloadManager.notifyListeners('test_event', { test: true });
    
    expect(listener1).toHaveBeenCalledWith({ event: 'test_event', data: { test: true } });
    expect(listener2).toHaveBeenCalledWith({ event: 'test_event', data: { test: true } });
    
    downloadManager.removeListener(id1);
    
    downloadManager.notifyListeners('another_event');
    
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
    
    // Clear listeners for other tests
    downloadManager.listeners = [];
  });
});
