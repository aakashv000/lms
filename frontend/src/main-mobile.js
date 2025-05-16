import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { Capacitor } from '@capacitor/core';

// Determine which router to use based on platform
let router;

if (Capacitor.isNativePlatform()) {
  // Use mobile router for native platforms
  import('./mobile/router').then((module) => {
    router = module.default;
    initializeApp();
  });
} else {
  // Use web router for browser
  import('./router').then((module) => {
    router = module.routes;
    initializeApp();
  });
}

// Initialize the app with the appropriate router
function initializeApp() {
  const app = createApp(App);
  const pinia = createPinia();
  
  app.use(pinia);
  app.use(router);
  
  // Add mobile detection to the app
  app.config.globalProperties.$isMobile = Capacitor.isNativePlatform();
  
  // Wait for device ready on native platforms
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
}

// Add mobile detection to body for CSS targeting
if (Capacitor.isNativePlatform()) {
  document.body.classList.add('is-mobile-app');
}
