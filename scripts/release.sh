#!/bin/bash
set -euo pipefail

# Build TextLayer Mission Control release downloads on this machine and publish
# them as a GitHub Release. There is no GitHub Actions pipeline: this script is
# the whole release process.
#
# Usage:
#   ./scripts/release.sh [options] [patch|minor|major|X.Y.Z]
#
#   With a version argument, bumps every version file, commits "release: vX.Y.Z"
#   and releases that. Without one, releases the version already in Cargo.toml.
#
# Options:
#   --dry-run            Build, package and verify only. No bump, tag, push or release.
#   --platforms LIST     Comma-separated subset of: darwin-arm64,darwin-x64,linux-x64,linux-arm64
#                        (default: all four). macOS builds need a Mac; Linux builds need Docker.
#   -y, --yes            Don't ask for confirmation before publishing.
#
# Environment:
#   SKIP_CI=1            Skip ./scripts/ci-local.sh (run it yourself first).
#   RELEASE_REPO=o/r     Publish somewhere else (default: TextLayer/claude-mission-control).
#
# Output: target/release-artifacts/vX.Y.Z/
#   mission-control-<platform>.tar.gz   binary + web app (dist/) + sidecar/dist/ + LICENSE
#   checksums.txt                       sha256 of every tarball (install.sh requires it)
#   install.sh                          the installer, served from releases/latest/download/

REPO="${RELEASE_REPO:-TextLayer/claude-mission-control}"
BINARY="mission-control"
ALL_PLATFORMS="darwin-arm64,darwin-x64,linux-x64,linux-arm64"
RUST_IMAGE="rust:1.94.1-bookworm" # keep in step with rust-toolchain.toml

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# --- Args -------------------------------------------------------------------

DRY_RUN=0
ASSUME_YES=0
PLATFORMS="$ALL_PLATFORMS"
BUMP=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --platforms) PLATFORMS="${2:?--platforms needs a value}"; shift ;;
    --platforms=*) PLATFORMS="${1#*=}" ;;
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help) sed -n '4,28p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    patch|minor|major) BUMP="$1" ;;
    [0-9]*.[0-9]*.[0-9]*) BUMP="$1" ;;
    *) echo "Unknown argument: $1 (see --help)" >&2; exit 1 ;;
  esac
  shift
done

die() { echo "error: $*" >&2; exit 1; }
step() { echo ""; echo "=== $* ==="; }

IFS=',' read -r -a PLATFORM_LIST <<< "$PLATFORMS"
for p in "${PLATFORM_LIST[@]}"; do
  case ",$ALL_PLATFORMS," in *",$p,"*) ;; *) die "unknown platform '$p'" ;; esac
done

current_version() { sed -n 's/^version = "\(.*\)"/\1/p' Cargo.toml | head -1; }

# Files that carry the product version. The binary reports Cargo.toml's; the
# web app's About page reports the root package.json's.
VERSION_FILES=(
  package.json
  apps/web/package.json
  apps/share/package.json
  apps/mobile/package.json
  packages/shared/package.json
  packages/design-tokens/package.json
  sidecar/package.json
)

# --- Preconditions ----------------------------------------------------------

needs_mac=0
needs_docker=0
for p in "${PLATFORM_LIST[@]}"; do
  case "$p" in darwin-*) needs_mac=1 ;; linux-*) needs_docker=1 ;; esac
done
if [ "$needs_mac" = 1 ] && [ "$(uname -s)" != "Darwin" ]; then
  die "macOS downloads can only be built on a Mac. Pass --platforms linux-x64,linux-arm64."
fi
if [ "$needs_docker" = 1 ] && ! docker info >/dev/null 2>&1; then
  die "Linux downloads are built in Docker, and Docker isn't running. Start it, or pass --platforms darwin-arm64,darwin-x64."
fi

if [ "$DRY_RUN" = 1 ]; then
  [ -z "$BUMP" ] || die "--dry-run doesn't bump versions; drop '$BUMP'."
  [ -z "$(git status --porcelain)" ] || echo "note: working tree has uncommitted changes; the dry run builds them as-is."
else
  command -v gh >/dev/null 2>&1 || die "the GitHub CLI (gh) is required: brew install gh"
  gh auth status >/dev/null 2>&1 || die "gh isn't signed in: gh auth login"
  [ -z "$(git status --porcelain)" ] || die "working tree isn't clean; commit or set aside your changes first."
  branch="$(git rev-parse --abbrev-ref HEAD)"
  [ "$branch" = "main" ] || die "releases are cut from main (you're on '$branch')."
fi

# --- Version ----------------------------------------------------------------

VERSION="$(current_version)"
if [ -n "$BUMP" ]; then
  IFS='.' read -r major minor patch <<< "${VERSION%%-*}"
  case "$BUMP" in
    patch) VERSION="${major}.${minor}.$((patch + 1))" ;;
    minor) VERSION="${major}.$((minor + 1)).0" ;;
    major) VERSION="$((major + 1)).0.0" ;;
    *) VERSION="$BUMP" ;;
  esac
fi
TAG="v${VERSION}"

if [ "$DRY_RUN" = 0 ]; then
  if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null ||
     git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
    die "tag $TAG already exists."
  fi
fi

echo "Mission Control $TAG → ${REPO}$([ "$DRY_RUN" = 1 ] && echo ' (dry run)')"
echo "Platforms: ${PLATFORM_LIST[*]}"

# --- Local CI ---------------------------------------------------------------

if [ "${SKIP_CI:-0}" != "1" ]; then
  "$ROOT/scripts/ci-local.sh"
else
  echo "Skipping local CI (SKIP_CI=1)"
fi

# --- Bump -------------------------------------------------------------------

if [ -n "$BUMP" ]; then
  step "Bumping to $VERSION"
  node -e '
    const fs = require("fs");
    const v = process.argv[1];
    const cargo = fs.readFileSync("Cargo.toml", "utf8");
    fs.writeFileSync("Cargo.toml", cargo.replace(/^version = ".*"/m, `version = "${v}"`));
    for (const f of process.argv.slice(2)) {
      const s = fs.readFileSync(f, "utf8");
      fs.writeFileSync(f, s.replace(/"version": "[^"]*"/, `"version": "${v}"`));
    }
  ' "$VERSION" "${VERSION_FILES[@]}"
  "$ROOT/scripts/cq" update --workspace --quiet
  git add Cargo.toml Cargo.lock "${VERSION_FILES[@]}"
  git commit -m "release: ${TAG}"
fi

# --- Build environment -------------------------------------------------------

# Release builds never talk to anyone else's servers: no analytics key, no
# sign-in, no share or mobile relay endpoints. Clear anything a developer's
# shell might have exported, because the Rust build bakes these in.
for v in POSTHOG_API_KEY SUPABASE_URL SUPABASE_PUBLISHABLE_KEY SUPABASE_ANON_KEY \
         RELAY_URL SHARE_WORKER_URL SHARE_VIEWER_URL \
         VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY VITE_SENTRY_DSN; do
  unset "$v"
done
export CLAUDE_VIEW_BUILD_SHA
CLAUDE_VIEW_BUILD_SHA="$(git rev-parse --short HEAD)"

# Same shared target dir that ./scripts/cq uses.
COMMON_GIT_DIR="$(git rev-parse --git-common-dir)"
case "$COMMON_GIT_DIR" in /*) ;; *) COMMON_GIT_DIR="$ROOT/$COMMON_GIT_DIR" ;; esac
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$(cd "$COMMON_GIT_DIR/.." && pwd)/target}"

OUT="$ROOT/target/release-artifacts/$TAG"
rm -rf "$OUT"
mkdir -p "$OUT"

# --- Web app + sidecar (platform-independent) ----------------------------------

step "Building web app"
bun install --frozen-lockfile
(cd apps/web && NODE_OPTIONS="--max-old-space-size=4096" bun run build)

step "Building sidecar"
(cd sidecar && bun run build)
[ -f sidecar/dist/index.js ] || die "sidecar build produced no dist/index.js"

# --- Binaries -----------------------------------------------------------------

triple_for() {
  case "$1" in
    darwin-arm64) echo aarch64-apple-darwin ;;
    darwin-x64) echo x86_64-apple-darwin ;;
    linux-x64) echo x86_64-unknown-linux-gnu ;;
    linux-arm64) echo aarch64-unknown-linux-gnu ;;
  esac
}

CARGO_ARGS=(--profile dist -p claude-view-server --no-default-features --features dist --locked)

build_darwin() {
  local triple="$1"
  if command -v rustup >/dev/null 2>&1 && ! rustup target list --installed | grep -qx "$triple"; then
    rustup target add "$triple"
  fi
  "$ROOT/scripts/cq" build "${CARGO_ARGS[@]}" --target "$triple"
  BUILT_BINARY="$CARGO_TARGET_DIR/$triple/dist/$BINARY"
}

build_linux() {
  local platform="$1" arch
  case "$platform" in linux-x64) arch=amd64 ;; linux-arm64) arch=arm64 ;; esac
  local out="$CARGO_TARGET_DIR/docker-$platform"
  mkdir -p "$out"
  # Debian bookworm (glibc 2.36) so the binary runs on most current distros.
  # Cargo caches live in named volumes so repeat releases build incrementally.
  docker run --rm --platform "linux/$arch" \
    -v "$ROOT":/src:ro \
    -v "$out":/out \
    -v "mission-control-cargo-registry:/usr/local/cargo/registry" \
    -v "mission-control-target-$platform:/target" \
    -e CARGO_TARGET_DIR=/target \
    -e RUSTUP_TOOLCHAIN="${RUST_IMAGE#rust:}" \
    -e CLAUDE_VIEW_BUILD_SHA \
    -w /src \
    "${RUST_IMAGE}" \
    bash -euc "
      dpkg -s libssl-dev pkg-config >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq libssl-dev pkg-config; }
      cargo build ${CARGO_ARGS[*]}
      cp /target/dist/$BINARY /out/$BINARY
    "
  BUILT_BINARY="$out/$BINARY"
}

for platform in "${PLATFORM_LIST[@]}"; do
  step "Building $platform"
  case "$platform" in
    darwin-*) build_darwin "$(triple_for "$platform")" ;;
    linux-*) build_linux "$platform" ;;
  esac
  [ -x "$BUILT_BINARY" ] || die "$platform build produced no binary at $BUILT_BINARY"

  stage="$(mktemp -d)"
  cp "$BUILT_BINARY" "$stage/$BINARY"
  cp -R apps/web/dist "$stage/dist"
  mkdir -p "$stage/sidecar"
  cp -R sidecar/dist "$stage/sidecar/dist"
  cp LICENSE "$stage/LICENSE"
  # COPYFILE_DISABLE keeps macOS resource-fork (._*) files out of the tarball.
  COPYFILE_DISABLE=1 tar -czf "$OUT/$BINARY-$platform.tar.gz" -C "$stage" .
  rm -rf "$stage"
done

# --- Verify ---------------------------------------------------------------------

step "Verifying"
host_platform="$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')"
for platform in "${PLATFORM_LIST[@]}"; do
  tarball="$OUT/$BINARY-$platform.tar.gz"
  tmp="$(mktemp -d)"
  tar -xzf "$tarball" -C "$tmp"
  [ -x "$tmp/$BINARY" ] || die "$platform: $BINARY missing or not executable"
  [ -f "$tmp/dist/index.html" ] || die "$platform: web app (dist/index.html) missing"
  [ -f "$tmp/sidecar/dist/index.js" ] || die "$platform: sidecar/dist/index.js missing"

  arch_info="$(file -b "$tmp/$BINARY")"
  case "$platform" in
    *-arm64) echo "$arch_info" | grep -qiE 'arm64|aarch64' || die "$platform: wrong architecture ($arch_info)" ;;
    *-x64) echo "$arch_info" | grep -qiE 'x86[-_]64' || die "$platform: wrong architecture ($arch_info)" ;;
  esac

  if [ "$platform" = "$host_platform" ]; then
    reported="$("$tmp/$BINARY" --version 2>&1 | head -1 | awk '{print $NF}')"
    [ "$reported" = "$VERSION" ] || die "$platform: binary reports '$reported', expected '$VERSION'"
    echo "OK  $platform  $(du -h "$tarball" | cut -f1)  (ran: --version = $reported)"
  else
    echo "OK  $platform  $(du -h "$tarball" | cut -f1)"
  fi
  rm -rf "$tmp"
done

(cd "$OUT" && shasum -a 256 "$BINARY"-*.tar.gz > checksums.txt)
cp install.sh "$OUT/install.sh"
echo ""
cat "$OUT/checksums.txt"

if [ "$DRY_RUN" = 1 ]; then
  echo ""
  echo "Dry run complete. Downloads are in: $OUT"
  exit 0
fi

# --- Publish --------------------------------------------------------------------

if [ "$ASSUME_YES" != 1 ]; then
  echo ""
  read -r -p "Push main and $TAG, then publish the GitHub Release on $REPO? [y/N] " answer
  case "$answer" in y|Y|yes|YES) ;; *) echo "Not published. Downloads are in: $OUT"; exit 0 ;; esac
fi

step "Publishing $TAG"
git tag "$TAG"
git push origin main "refs/tags/$TAG"
gh release create "$TAG" \
  --repo "$REPO" \
  --title "Mission Control $TAG" \
  --generate-notes \
  --verify-tag \
  "$OUT"/*.tar.gz "$OUT/checksums.txt" "$OUT/install.sh"

echo ""
echo "Released: https://github.com/$REPO/releases/tag/$TAG"
echo "Install:  curl -fsSL https://github.com/$REPO/releases/latest/download/install.sh | sh"
