# Frappe Learning Mobile App Development Guide

Here's a comprehensive guide to building, running, and developing the Frappe Learning mobile app.

## Setup and Installation

### Prerequisites

- Node.js 16+ and Yarn
- Android Studio
- Android SDK (API level 33+)
- JDK 11+

### Initial Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/frappe/lms.git
   cd lms
   ```

2. **Install dependencies**:
   ```bash
   cd frontend
   yarn install
   ```

## Building and Running

### Development Build

1. **Initialize Capacitor** (first time only):
   ```bash
   yarn cap:init
   ```

2. **Add Android platform** (first time only):
   ```bash
   yarn cap:add
   ```

3. **Build and sync the app**:
   ```bash
   yarn cap:build
   ```
   This runs both `build:mobile` and `cap:sync` commands.

4. **Open in Android Studio**:
   ```bash
   yarn cap:open
   ```

5. **Run the app** from Android Studio on an emulator or connected device.

### Production Build

1. **Build for production**:
   ```bash
   yarn build:mobile
   yarn cap:sync
   ```

2. **Generate signed APK/Bundle** in Android Studio:
   - Open the project in Android Studio
   - Select `Build > Generate Signed Bundle / APK`
   - Follow the wizard to create a keystore (or use existing)
   - Choose build type (release)
   - Complete the build process

## Testing

### Running Tests

```bash
yarn test
```

This will run all Jest tests for the mobile app components.

### Writing Tests

- Unit tests go in `__tests__` directories next to the files they test
- Mobile-specific tests are in `frontend/src/mobile/__tests__/`
- Offline functionality tests are in `frontend/src/offline/__tests__/`

## Development Workflow

### Making Changes to Web Components

1. Make changes to Vue components
2. Run `yarn build:mobile` to build for mobile
3. Run `yarn cap:sync` to sync changes to Android project
4. Test in Android Studio

### Adding New Mobile Features

1. Create new components in `frontend/src/mobile/components/`
2. Add new views in `frontend/src/mobile/views/`
3. Update the router in `frontend/src/mobile/router.js` if needed
4. Build and test as described above

### Offline Content Development

When working with offline functionality:

1. Modify files in `frontend/src/offline/`
2. Test offline behavior by enabling airplane mode on the device/emulator
3. Check that content downloads correctly and is accessible offline

## Available Scripts

- `yarn dev` - Start development server for web
- `yarn build` - Build for web
- `yarn build:mobile` - Build for Android
- `yarn cap:init` - Initialize Capacitor project
- `yarn cap:add` - Add Android platform
- `yarn cap:sync` - Sync web code to Android project
- `yarn cap:build` - Build and sync in one command
- `yarn cap:open` - Open Android project in Android Studio
- `yarn test` - Run tests

## Troubleshooting

### Common Issues

1. **Build fails with Capacitor errors**:
   - Check that Capacitor is properly initialized
   - Ensure Android SDK is properly set up
   - Run `yarn cap:sync` to ensure latest changes are synced

2. **Offline content not working**:
   - Check network status detection
   - Verify storage permissions are granted
   - Check console logs for storage errors

3. **App crashes on startup**:
   - Check Android logcat for errors
   - Verify minimum SDK version compatibility
   - Ensure all required plugins are properly installed

### Debugging

- Use Chrome remote debugging for web code
- Use Android Studio's debugger for native code
- Check logs with `adb logcat`

## Documentation

For more detailed information, refer to:

- `lms/mobile/README.md` - General setup instructions
- `lms/mobile/IMPLEMENTATION.md` - Implementation details
- `lms/mobile/OFFLINE_FEATURES.md` - User guide for offline features

## Project Structure Overview

```
frontend/
├── src/
│   ├── mobile/         # Mobile-specific code
│   ├── offline/        # Offline functionality
│   └── service-worker/ # Service worker for offline caching
├── public/
│   └── mobile-assets/  # Mobile-specific assets
├── vite.mobile.config.js  # Mobile build configuration
└── index.mobile.html      # Mobile entry point

lms/
└── mobile/            # Mobile-specific backend files
```

This structure ensures proper separation of concerns while minimizing changes to the existing codebase.

## Advanced Development Topics

### Adding New Capacitor Plugins

To add a new Capacitor plugin:

1. Install the plugin:
   ```bash
   yarn add @capacitor/plugin-name
   ```

2. Sync the plugin to the native project:
   ```bash
   yarn cap:sync
   ```

3. Import and use the plugin in your code:
   ```javascript
   import { PluginName } from '@capacitor/plugin-name';
   ```

### Creating Custom Capacitor Plugins

For functionality not covered by existing plugins:

1. Create a new directory in `lms/mobile/plugins/`
2. Follow the [Capacitor plugin development guide](https://capacitorjs.com/docs/plugins/creating-plugins)
3. Register your plugin in `capacitor.config.json`

### Optimizing Performance

1. **Reduce bundle size**:
   - Use code splitting with dynamic imports
   - Analyze bundle with tools like `webpack-bundle-analyzer`

2. **Improve startup time**:
   - Minimize JavaScript execution on startup
   - Use lazy loading for routes and components

3. **Optimize offline storage**:
   - Implement data compression for stored content
   - Use efficient querying patterns

### Security Best Practices

1. **Content Security**:
   - Implement proper Content Security Policy
   - Use HTTPS for all API requests

2. **Data Protection**:
   - Encrypt sensitive data at rest
   - Implement secure authentication flows

3. **Permission Handling**:
   - Request only necessary permissions
   - Provide clear explanations for permission requests

### Continuous Integration

Set up CI/CD for the mobile app:

1. Configure GitHub Actions or similar CI system
2. Automate testing with Jest
3. Set up automated builds for development/staging
4. Implement deployment to internal testing channels
