import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import router from './router';
import { Capacitor } from '@capacitor/core';

// Initialize the app
const app = createApp(App);

// Use Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Use the mobile router
app.use(router);

// Wait for device ready event on native platforms
if (Capacitor.isNativePlatform()) {
  document.addEventListener('deviceready', () => {
    app.mount('#app');
  }, false);
} else {
  // Mount immediately on web
  app.mount('#app');
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Handle network status changes
if (Capacitor.isNativePlatform()) {
  const { Network } = await import('@capacitor/network');
  
  // Initial network status
  const status = await Network.getStatus();
  
  // Add listener for network status changes
  Network.addListener('networkStatusChange', status => {
    // Dispatch event for components to listen to
    window.dispatchEvent(new CustomEvent('networkStatusChange', { detail: status }));
    
    // Show toast notification when offline
    if (!status.connected) {
      showToast('You are offline. Some features may be limited.');
    }
  });
}

// Helper function to show toast notifications
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'mobile-toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Add global CSS for mobile-specific styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
  .mobile-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 9999;
    transition: transform 0.3s ease;
    max-width: 80%;
    text-align: center;
  }
  
  .mobile-toast.show {
    transform: translateX(-50%) translateY(0);
  }
  
  /* Mobile-specific overrides */
  @media (max-width: 768px) {
    body {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      user-select: none;
    }
    
    /* Improve touch targets */
    button, a, input, select, textarea {
      min-height: 44px;
      min-width: 44px;
    }
  }
`;

document.head.appendChild(mobileStyles);
