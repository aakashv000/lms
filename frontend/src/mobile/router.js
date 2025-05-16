import { createRouter, createWebHistory } from 'vue-router';
import { Capacitor } from '@capacitor/core';

// Import the main router configuration
import { routes as webRoutes } from '../router';

// Mobile-specific routes
const mobileSpecificRoutes = [
  {
    path: '/offline-courses',
    name: 'OfflineCourses',
    component: () => import('./views/OfflineCourses.vue'),
    meta: {
      requiresAuth: true,
      mobileOnly: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./views/Settings.vue'),
    meta: {
      requiresAuth: true,
      mobileOnly: true
    }
  }
];

// Filter out any web-specific routes that shouldn't be in the mobile app
const filteredWebRoutes = webRoutes.filter(route => {
  // Include routes that don't have a mobileExclude meta property
  return !route.meta?.mobileExclude;
});

// Combine routes, giving priority to mobile-specific routes
const routes = [...mobileSpecificRoutes, ...filteredWebRoutes];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is authenticated
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
      // Redirect to login page
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
  }
  
  // Check if route is mobile-only and we're not on a mobile device
  if (to.matched.some(record => record.meta.mobileOnly) && !Capacitor.isNativePlatform()) {
    // Redirect to home page
    next({ name: 'Home' });
    return;
  }
  
  next();
});

// Helper function to check authentication
async function checkAuthentication() {
  // In a real app, this would check for a valid auth token
  if (Capacitor.isNativePlatform()) {
    const { Storage } = await import('@capacitor/storage');
    const { value } = await Storage.get({ key: 'auth_token' });
    return !!value;
  } else {
    return !!localStorage.getItem('auth_token');
  }
}

export default router;
