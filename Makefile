.PHONY: update run build-apk clean help

# Update dependencies
update:
	flutter pub get
	flutter pub upgrade

# Run the app in debug mode
run:
	flutter run

# Build Android APK
build-apk:
	flutter build apk --release

# Clean build artifacts
clean:
	flutter clean
	flutter pub get

# Show help
help:
	@echo "Available targets:"
	@echo "  update     - Update Flutter dependencies"
	@echo "  run        - Run the app in debug mode"
	@echo "  build-apk  - Build release APK for Android"
	@echo "  clean      - Clean build artifacts and reinstall dependencies"
	@echo "  help       - Show this help message"