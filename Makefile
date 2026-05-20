GO ?= go
BINARY ?= beeper
VERSION ?= 0.6.2
GOCACHE ?= $(CURDIR)/.cache/go-build
DIST_DIR ?= dist
PLATFORMS ?= darwin/amd64 darwin/arm64 linux/amd64 linux/arm64 windows/amd64 windows/arm64

.PHONY: build test check dist clean

build:
	mkdir -p $(GOCACHE)
	GOCACHE=$(GOCACHE) $(GO) build -ldflags "-X github.com/beeper/desktop-api-cli/internal/buildinfo.Version=$(VERSION)" -o bin/$(BINARY) ./cmd/beeper

test:
	mkdir -p $(GOCACHE)
	GOCACHE=$(GOCACHE) $(GO) test ./...

check: test build

dist:
	rm -rf $(DIST_DIR)
	mkdir -p $(DIST_DIR) $(GOCACHE)
	for platform in $(PLATFORMS); do \
		goos=$${platform%/*}; \
		goarch=$${platform#*/}; \
		ext=""; \
		if [ "$$goos" = "windows" ]; then ext=".exe"; fi; \
		name="$(BINARY)_$(VERSION)_$${goos}_$${goarch}"; \
		work="$(DIST_DIR)/$$name"; \
		mkdir -p "$$work"; \
		GOCACHE=$(GOCACHE) CGO_ENABLED=0 GOOS=$$goos GOARCH=$$goarch $(GO) build -ldflags "-X github.com/beeper/desktop-api-cli/internal/buildinfo.Version=$(VERSION)" -o "$$work/$(BINARY)$$ext" ./cmd/beeper; \
		cp README.md LICENSE SECURITY.md "$$work/"; \
		tar -C "$(DIST_DIR)" -czf "$(DIST_DIR)/$$name.tar.gz" "$$name"; \
		rm -rf "$$work"; \
	done
	if command -v sha256sum >/dev/null 2>&1; then \
		(cd $(DIST_DIR) && sha256sum *.tar.gz > checksums.txt); \
	else \
		(cd $(DIST_DIR) && shasum -a 256 *.tar.gz > checksums.txt); \
	fi

clean:
	rm -rf bin .cache $(DIST_DIR)
