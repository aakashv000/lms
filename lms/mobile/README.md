# Frappe Learning Mobile App

This directory contains the Android mobile app implementation for Frappe Learning LMS.

## Features

- **Offline Course Access**: Download courses for offline viewing
- **Secure Content Storage**: Encrypted storage for course content
- **Sync Progress**: Synchronize course progress between web and mobile
- **Native UI**: Mobile-optimized user interface
- **Push Notifications**: Get notified about course updates and deadlines

## Setup Instructions

### Prerequisites

- Node.js 16+
- Yarn
- Android Studio
- Android SDK (API level 33+)
- JDK 11+

### Development Setup

1. Install dependencies:
   ```bash
   cd frontend
   yarn install
   ```

2. Initialize Capacitor:
   ```bash
   yarn cap:init
   yarn cap:add
   ```

3. Build the app:
   ```bash
   yarn build:mobile
   yarn cap:sync
   ```

4. Open in Android Studio:
   ```bash
   yarn cap:open
   ```

### Building for Production

1. Build the app with production mode:
   ```bash
   yarn build:mobile
   yarn cap:sync
   ```

2. In Android Studio:
   - Select `Build > Generate Signed Bundle / APK`
   - Follow the wizard to create a signed APK or App Bundle

## Project Structure

- `capacitor.config.json` - Capacitor configuration
- `android/` - Android project files
- `plugins/` - Custom Capacitor plugins
- `tests/` - Mobile-specific tests

## Testing

Run the tests with:

```bash
cd frontend
yarn test
```

## Offline Content Management

The app uses a combination of Capacitor's Storage and Filesystem plugins to securely store offline content. Content is encrypted and not directly accessible to users through the file system.

## Network Handling

The app automatically detects network status changes and provides appropriate UI feedback. When offline, the app will:

1. Show offline indicator
2. Disable features that require network connectivity
3. Allow access to downloaded content
4. Queue actions to be performed when back online

## Security Considerations

- Course content is stored in the app's private storage area
- Media files are not directly accessible through the device's file manager
- Authentication tokens are securely stored
- Network requests use HTTPS
