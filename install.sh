#!/bin/sh
set -eu

# TextLayer Mission Control installer
# Usage:
#   curl -fsSL https://github.com/TextLayer/claude-mission-control/releases/latest/download/install.sh | sh
#
# Environment variables:
#   MISSION_CONTROL_VERSION     - Install a specific version, e.g. 1.0.0 (default: latest)
#   MISSION_CONTROL_INSTALL_DIR - Override install location (default: ~/.mission-control)
#
# Everything is downloaded from this repo's GitHub Releases and checked
# against the release's checksums.txt before it is unpacked.

REPO="TextLayer/claude-mission-control"
BINARY="mission-control"
INSTALL_DIR="${MISSION_CONTROL_INSTALL_DIR:-$HOME/.mission-control}"
BIN_DIR="${INSTALL_DIR}/bin"

# --- Colors (disabled if not a terminal) ---

if [ -t 1 ]; then
  BOLD='\033[1m'
  DIM='\033[2m'
  GREEN='\033[32m'
  RED='\033[31m'
  RESET='\033[0m'
else
  BOLD='' DIM='' GREEN='' RED='' RESET=''
fi

info()    { printf "${BOLD}%s${RESET}\n" "$1"; }
success() { printf "${GREEN}${BOLD}%s${RESET}\n" "$1"; }
error()   { printf "${RED}error: %b${RESET}\n" "$1" >&2; exit 1; }
dim()     { printf "${DIM}%s${RESET}\n" "$1"; }

# --- Platform detection ---

detect_platform() {
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$os" in
    darwin) os="darwin" ;;
    linux)  os="linux" ;;
    *)      error "Unsupported OS: $os. Only macOS and Linux are supported." ;;
  esac

  case "$arch" in
    arm64|aarch64) arch="arm64" ;;
    x86_64|amd64)  arch="x64" ;;
    *)             error "Unsupported architecture: $arch" ;;
  esac

  echo "${os}-${arch}"
}

# --- Version resolution ---

resolve_version() {
  if [ -n "${MISSION_CONTROL_VERSION:-}" ]; then
    echo "${MISSION_CONTROL_VERSION#v}"
    return
  fi

  # /releases/latest redirects to /releases/tag/vX.Y.Z (or to /releases
  # when nothing has been published yet, which yields no tag here).
  tag=$(curl -sI "https://github.com/${REPO}/releases/latest" \
    | grep -i '^location:' \
    | sed -n 's|.*/tag/v||p' \
    | tr -d '[:space:]')

  if [ -z "$tag" ]; then
    error "Could not find the latest release.\n  Set MISSION_CONTROL_VERSION=x.y.z or check https://github.com/${REPO}/releases"
  fi

  echo "$tag"
}

# --- Checksum verification (required) ---

verify_checksum() {
  file="$1"
  version="$2"
  artifact="$3"

  checksums_url="https://github.com/${REPO}/releases/download/v${version}/checksums.txt"
  checksums=$(curl -fsSL "$checksums_url" 2>/dev/null || true)

  if [ -z "$checksums" ]; then
    error "Could not download checksums.txt for v${version}; refusing to install an unverified download."
  fi

  expected=$(echo "$checksums" | awk -v f="$artifact" '$2 == f { print $1 }')
  if [ -z "$expected" ]; then
    error "checksums.txt for v${version} has no entry for ${artifact}."
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$file" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    actual=$(shasum -a 256 "$file" | awk '{print $1}')
  else
    error "Neither sha256sum nor shasum is available to verify the download."
  fi

  if [ "$actual" != "$expected" ]; then
    error "Checksum verification failed.\n  Expected: $expected\n  Actual:   $actual"
  fi

  dim "  Checksum verified."
}

# --- Shell profile detection ---

detect_profile() {
  shell_name=$(basename "${SHELL:-/bin/sh}")

  case "$shell_name" in
    zsh)
      echo "${HOME}/.zshrc"
      ;;
    bash)
      if [ -f "${HOME}/.bashrc" ]; then
        echo "${HOME}/.bashrc"
      elif [ -f "${HOME}/.bash_profile" ]; then
        echo "${HOME}/.bash_profile"
      else
        echo "${HOME}/.bashrc"
      fi
      ;;
    fish)
      echo "${HOME}/.config/fish/config.fish"
      ;;
    *)
      echo "${HOME}/.profile"
      ;;
  esac
}

# --- PATH setup ---

setup_path() {
  # Check if already in PATH
  case ":${PATH}:" in
    *":${BIN_DIR}:"*) return ;;
  esac

  profile=$(detect_profile)
  shell_name=$(basename "${SHELL:-/bin/sh}")

  if [ "$shell_name" = "fish" ]; then
    path_line="fish_add_path \"${BIN_DIR}\""
  else
    path_line="export PATH=\"${BIN_DIR}:\$PATH\""
  fi

  # Check if line already exists in profile
  if [ -f "$profile" ] && grep -qF "$BIN_DIR" "$profile" 2>/dev/null; then
    return
  fi

  mkdir -p "$(dirname "$profile")"
  printf "\n# TextLayer Mission Control\n%s\n" "$path_line" >> "$profile"
  dim "  Added to PATH in $profile"
}

# --- Main ---

main() {
  info "Installing TextLayer Mission Control..."
  echo ""

  platform=$(detect_platform)
  version=$(resolve_version)
  artifact="${BINARY}-${platform}.tar.gz"
  url="https://github.com/${REPO}/releases/download/v${version}/${artifact}"

  info "  Platform: ${platform}"
  info "  Version:  v${version}"
  echo ""

  # Download to temp file for checksum verification
  tmp_dir=$(mktemp -d)
  tmp_file="${tmp_dir}/${artifact}"
  trap 'rm -rf "$tmp_dir"' EXIT

  printf "Downloading..."
  if ! curl -fSL --progress-bar "$url" -o "$tmp_file" 2>&1; then
    echo ""
    error "Download failed.\n  URL: $url\n  Check https://github.com/${REPO}/releases for available versions and platforms."
  fi
  echo ""

  verify_checksum "$tmp_file" "$version" "$artifact"

  # Clean and extract
  rm -rf "$BIN_DIR"
  mkdir -p "$BIN_DIR"
  tar xzf "$tmp_file" -C "$BIN_DIR"
  chmod +x "${BIN_DIR}/${BINARY}"

  # macOS: the binaries aren't signed by Apple; clear the quarantine flag so
  # Gatekeeper doesn't block the first run.
  if [ "$(uname -s)" = "Darwin" ]; then
    xattr -dr com.apple.quarantine "$BIN_DIR" 2>/dev/null || true
  fi

  # Version marker
  echo "$version" > "${INSTALL_DIR}/version"

  # Install-source marker — the explicit contract read by
  # detect_install_source() in the server (crates/server/src/startup/install.rs).
  # Co-located with the binary so it survives MISSION_CONTROL_INSTALL_DIR.
  echo "install_sh" > "${INSTALL_DIR}/install-source"

  setup_path

  echo ""
  success "TextLayer Mission Control v${version} installed."
  echo ""
  dim "  Installed to: ${BIN_DIR}/${BINARY}"

  if ! command -v node >/dev/null 2>&1; then
    dim "  Note: Node.js wasn't found. It's only needed to resume or take over sessions."
  fi

  case ":${PATH}:" in
    *":${BIN_DIR}:"*)
      echo ""
      info "Run '${BINARY}' to start it."
      ;;
    *)
      echo ""
      info "Restart your shell, then run '${BINARY}' to start it."
      dim "  Or run now: ${BIN_DIR}/${BINARY}"
      ;;
  esac
}

main
