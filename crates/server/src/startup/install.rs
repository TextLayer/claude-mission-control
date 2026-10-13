//! Install-source detection.
//!
//! Extracted from `main.rs` in CQRS Phase 7.c. The detection is a
//! best-effort classification (one `stat`, once at startup) of how the
//! binary was launched.
//!
//! TextLayer fork: upstream's `ping_install_beacon` (an unconditional GET to
//! `get.claudeview.ai/ping` on every startup, ignoring the telemetry opt-out)
//! has been removed.

use std::path::{Path, PathBuf};

/// Filename of the install-source marker written by `install.sh` next to
/// the binary tree (see `install.sh`: `${INSTALL_DIR}/install-source`).
const INSTALL_SOURCE_MARKER: &str = "install-source";

/// Detect how the server was installed/launched.
///
/// Returns one of: "plugin", "install_sh", "npx".
///
/// Precedence is by *current launch*, then *install origin*:
/// 1. `plugin`     — Claude Code sets `CLAUDE_PLUGIN_ROOT` when it spawns us.
/// 2. `install_sh` — `install.sh` left its marker beside the binary.
/// 3. `npx`        — neither signal: ran from npm's transient cache.
pub fn detect_install_source() -> &'static str {
    if std::env::var("CLAUDE_PLUGIN_ROOT").is_ok() {
        return "plugin";
    }
    if install_sh_marker_present() {
        return "install_sh";
    }
    "npx"
}

/// True when the `install.sh` marker sits beside the running binary.
///
/// The binary lives at `${INSTALL_DIR}/bin/mission-control`; the marker at
/// `${INSTALL_DIR}/install-source`. Resolving the marker *relative to the
/// executable* makes the install.sh↔server contract explicit and
/// drift-proof — it holds regardless of `CLAUDE_VIEW_INSTALL_DIR`, unlike
/// the previous brittle substring match on the install path.
fn install_sh_marker_present() -> bool {
    std::env::current_exe()
        .ok()
        .and_then(|exe| marker_path_for_exe(&exe))
        .map(|m| m.is_file())
        .unwrap_or(false)
}

/// Pure path arithmetic: `${INSTALL_DIR}/bin/mission-control` →
/// `${INSTALL_DIR}/install-source`. Split out (no I/O, exe injected) so
/// the location contract is unit-testable without a real install — the
/// exact logic the `~/.cache → ~/.claude-view` migration broke unguarded.
fn marker_path_for_exe(exe: &Path) -> Option<PathBuf> {
    exe.parent() // …/bin
        .and_then(Path::parent) // …/ (INSTALL_DIR)
        .map(|root| root.join(INSTALL_SOURCE_MARKER))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn marker_resolves_beside_install_dir_not_cache() {
        // install.sh: BIN_DIR=${INSTALL_DIR}/bin, binary at bin/mission-control.
        let exe = Path::new("/home/u/.mission-control/bin/mission-control");
        assert_eq!(
            marker_path_for_exe(exe),
            Some(PathBuf::from("/home/u/.mission-control/install-source")),
            "marker must resolve to the INSTALL_DIR root, beside `version`"
        );
    }

    #[test]
    fn marker_path_honors_custom_install_dir() {
        // CLAUDE_VIEW_INSTALL_DIR override: contract still holds because
        // the marker is resolved relative to the binary, not a fixed path.
        let exe = Path::new("/opt/cv/bin/mission-control");
        assert_eq!(
            marker_path_for_exe(exe),
            Some(PathBuf::from("/opt/cv/install-source"))
        );
    }

    #[test]
    fn detect_reads_real_marker_via_injected_path() {
        let dir = tempfile::tempdir().expect("tempdir");
        let bin = dir.path().join("bin");
        std::fs::create_dir_all(&bin).expect("mkdir bin");
        let exe = bin.join("mission-control");

        // No marker yet → not install_sh.
        assert!(!marker_path_for_exe(&exe).unwrap().is_file());

        // install.sh writes the marker → detected.
        std::fs::write(dir.path().join(INSTALL_SOURCE_MARKER), "install_sh").expect("write marker");
        assert!(marker_path_for_exe(&exe).unwrap().is_file());
    }
}
