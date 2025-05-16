@echo off
echo ===================================
echo Frappe Learning Android App Builder
echo ===================================

cd ../../frontend

echo.
echo Step 1: Installing dependencies...
call yarn install
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies!
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Running tests...
call yarn test
if %ERRORLEVEL% neq 0 (
    echo Tests failed! Please fix the issues before building.
    exit /b %ERRORLEVEL%
)

echo.
echo Step 3: Building app for mobile...
call yarn build:mobile
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo Step 4: Syncing with Capacitor...
call yarn cap:sync
if %ERRORLEVEL% neq 0 (
    echo Sync failed!
    exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully!
echo To open in Android Studio, run: yarn cap:open
echo.
