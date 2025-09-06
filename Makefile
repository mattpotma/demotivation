# Demotivation App Makefile
# Build and deployment targets for React Native Android app

# Variables
JAVA_HOME_PATH = /usr/lib/jvm/java-17-openjdk-amd64
ANDROID_DIR = android
APK_DEBUG = $(ANDROID_DIR)/app/build/outputs/apk/debug/app-debug.apk
APK_RELEASE = $(ANDROID_DIR)/app/build/outputs/apk/release/app-release.apk

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install-deps  - Install npm dependencies"
	@echo "  lint          - Run ESLint"
	@echo "  format        - Format code with Prettier"
	@echo "  clean         - Clean Android build artifacts"
	@echo "  build-debug   - Build debug APK"
	@echo "  build-release - Build release APK"
	@echo "  install-debug - Install debug APK to connected device"
	@echo "  install-release - Install release APK to connected device"
	@echo "  deploy-debug  - Build and install debug APK"
	@echo "  deploy-release - Build and install release APK"
	@echo "  devices       - List connected ADB devices"
	@echo "  start         - Start React Native development server"

# Dependency management
.PHONY: install-deps
install-deps:
	npm install

# Code quality
.PHONY: lint
lint:
	npm run lint

.PHONY: format
format:
	npx prettier --write .

# Clean
.PHONY: clean
clean:
	cd $(ANDROID_DIR) && ./gradlew clean

# Build targets
.PHONY: build-debug
build-debug:
	@echo "Building debug APK..."
	cd $(ANDROID_DIR) && JAVA_HOME=$(JAVA_HOME_PATH) ./gradlew assembleDebug
	@echo "Debug APK built: $(APK_DEBUG)"

.PHONY: build-release
build-release:
	@echo "Building release APK..."
	cd $(ANDROID_DIR) && JAVA_HOME=$(JAVA_HOME_PATH) ./gradlew assembleRelease
	@echo "Release APK built: $(APK_RELEASE)"

# Device management
.PHONY: devices
devices:
	@echo "Connected ADB devices:"
	adb devices

# Install targets
.PHONY: install-debug
install-debug:
	@if [ ! -f "$(APK_DEBUG)" ]; then \
		echo "Debug APK not found. Run 'make build-debug' first."; \
		exit 1; \
	fi
	@echo "Installing debug APK to device..."
	adb install -r $(APK_DEBUG)
	@echo "Debug APK installed successfully!"

.PHONY: install-release
install-release:
	@if [ ! -f "$(APK_RELEASE)" ]; then \
		echo "Release APK not found. Run 'make build-release' first."; \
		exit 1; \
	fi
	@echo "Installing release APK to device..."
	adb install -r $(APK_RELEASE)
	@echo "Release APK installed successfully!"

# Deploy targets (build + install)
.PHONY: deploy-debug
deploy-debug: build-debug install-debug
	@echo "Debug deployment complete!"

.PHONY: deploy-release
deploy-release: build-release install-release
	@echo "Release deployment complete!"

# Development
.PHONY: start
start:
	npm start

# Launch app on device
.PHONY: launch
launch:
	@echo "Launching Demotivation app on device..."
	adb shell am start -n com.demotivation/.MainActivity

# Uninstall app from device
.PHONY: uninstall
uninstall:
	@echo "Uninstalling Demotivation app from device..."
	adb uninstall com.demotivation

# View device logs
.PHONY: logs
logs:
	@echo "Showing device logs (Ctrl+C to stop)..."
	adb logcat | grep -i demotivation

# Quick development cycle
.PHONY: dev
dev: format lint deploy-debug launch
	@echo "Development cycle complete!"