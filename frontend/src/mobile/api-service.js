import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { offlineStorage } from '../offline/storage';

/**
 * Mobile API Service
 * Handles API requests with offline support
 */
class MobileApiService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.baseUrl = '';
    this.isOnline = true;
    this.pendingActions = [];
    this.initialize();
  }

  /**
   * Initialize the API service
   */
  async initialize() {
    // Set base URL based on environment
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    
    if (this.isNative) {
      // Get initial network status
      const status = await Network.getStatus();
      this.isOnline = status.connected;
      
      // Listen for network status changes
      Network.addListener('networkStatusChange', status => {
        const wasOffline = !this.isOnline;
        this.isOnline = status.connected;
        
        // If we're back online, process pending actions
        if (wasOffline && this.isOnline && this.pendingActions.length > 0) {
          this.processPendingActions();
        }
      });
      
      // Load pending actions from storage
      await this.loadPendingActions();
    }
  }

  /**
   * Make an API request with offline support
   * @param {string} endpoint API endpoint
   * @param {Object} options Fetch options
   * @param {boolean} requiresAuth Whether the request requires authentication
   * @param {boolean} offlineSupport Whether the request supports offline mode
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}, requiresAuth = true, offlineSupport = false) {
    const url = this.baseUrl + endpoint;
    
    // Add auth headers if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    // Check if we're online
    if (!this.isOnline) {
      // If offline and request supports offline mode, try to get from cache
      if (offlineSupport) {
        return this.handleOfflineRequest(endpoint, options);
      } else {
        // Queue the request for later if it's a write operation
        if (options.method && options.method !== 'GET') {
          await this.queueAction(endpoint, options);
        }
        throw new Error('No network connection available');
      }
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response if it supports offline mode
      if (offlineSupport && options.method === 'GET') {
        await this.cacheResponse(endpoint, data);
      }
      
      return data;
    } catch (error) {
      // If request fails due to network issues, try offline mode
      if (offlineSupport && error.message.includes('network')) {
        return this.handleOfflineRequest(endpoint, options);
      }
      throw error;
    }
  }

  /**
   * Handle an API request in offline mode
   * @param {string} endpoint API endpoint
   * @param {Object} options Fetch options
   * @returns {Promise<Object>} Cached response data
   */
  async handleOfflineRequest(endpoint, options) {
    // Only support GET requests in offline mode
    if (options.method && options.method !== 'GET') {
      await this.queueAction(endpoint, options);
      throw new Error('Cannot perform write operations in offline mode');
    }
    
    // Try to get from cache
    const cachedData = await this.getCachedResponse(endpoint);
    
    if (cachedData) {
      return cachedData;
    }
    
    throw new Error('No cached data available for this request');
  }

  /**
   * Cache an API response
   * @param {string} endpoint API endpoint
   * @param {Object} data Response data
   */
  async cacheResponse(endpoint, data) {
    if (!this.isNative) return;
    
    try {
      const key = `api_cache_${endpoint}`;
      const value = JSON.stringify({
        data,
        timestamp: Date.now()
      });
      
      await offlineStorage.saveCacheItem(key, value);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Get cached API response
   * @param {string} endpoint API endpoint
   * @returns {Promise<Object>} Cached data
   */
  async getCachedResponse(endpoint) {
    if (!this.isNative) return null;
    
    try {
      const key = `api_cache_${endpoint}`;
      const cachedItem = await offlineStorage.getCacheItem(key);
      
      if (cachedItem) {
        const { data, timestamp } = JSON.parse(cachedItem);
        
        // Check if cache is still valid (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - timestamp <= maxAge) {
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Queue an action for later execution
   * @param {string} endpoint API endpoint
   * @param {Object} options Fetch options
   */
  async queueAction(endpoint, options) {
    if (!this.isNative) return;
    
    try {
      const action = {
        id: Date.now().toString(),
        endpoint,
        options,
        timestamp: Date.now()
      };
      
      this.pendingActions.push(action);
      await this.savePendingActions();
    } catch (error) {
      console.error('Error queuing action:', error);
    }
  }

  /**
   * Process pending actions when back online
   */
  async processPendingActions() {
    if (!this.isNative || !this.isOnline || this.pendingActions.length === 0) return;
    
    const actionsToProcess = [...this.pendingActions];
    this.pendingActions = [];
    
    for (const action of actionsToProcess) {
      try {
        await this.request(action.endpoint, action.options, true, false);
      } catch (error) {
        // If action fails, add it back to the queue
        this.pendingActions.push(action);
      }
    }
    
    await this.savePendingActions();
  }

  /**
   * Save pending actions to storage
   */
  async savePendingActions() {
    if (!this.isNative) return;
    
    try {
      await offlineStorage.saveCacheItem(
        'pending_actions',
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Load pending actions from storage
   */
  async loadPendingActions() {
    if (!this.isNative) return;
    
    try {
      const actionsJson = await offlineStorage.getCacheItem('pending_actions');
      if (actionsJson) {
        this.pendingActions = JSON.parse(actionsJson);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions = [];
    }
  }

  /**
   * Get authentication token
   * @returns {Promise<string>} Auth token
   */
  async getAuthToken() {
    if (this.isNative) {
      return await offlineStorage.getCacheItem('auth_token');
    } else {
      return localStorage.getItem('auth_token');
    }
  }

  /**
   * Set authentication token
   * @param {string} token Auth token
   */
  async setAuthToken(token) {
    if (this.isNative) {
      await offlineStorage.saveCacheItem('auth_token', token);
    } else {
      localStorage.setItem('auth_token', token);
    }
  }
}

// Add cache methods to offlineStorage
if (!offlineStorage.saveCacheItem) {
  offlineStorage.saveCacheItem = async function(key, value) {
    if (Capacitor.isNativePlatform()) {
      const { Storage } = await import('@capacitor/storage');
      await Storage.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  };
  
  offlineStorage.getCacheItem = async function(key) {
    if (Capacitor.isNativePlatform()) {
      const { Storage } = await import('@capacitor/storage');
      const { value } = await Storage.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  };
}

export const mobileApiService = new MobileApiService();
