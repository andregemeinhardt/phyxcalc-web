#!/usr/bin/env python3
"""
Verifies the imported PhyxCalc source against the pinned upstream archive.
Ports scripts/verify-source.ps1 with exact equivalent assertions.
"""

import argparse
import hashlib
import io
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

REVISION = "c952bc8fecda1f5c14e05ed33656492564bc6cd4"
ARCHIVE_URL = f"https://codeload.github.com/machinekoder/PhyxCalc/zip/{REVISION}"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Verify source against upstream pinned commit.")
    parser.add_argument("--restore-images", action="store_true", help="Restore or repair normalized image files.")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    workspace_root = script_dir.parent
    project_root = workspace_root / "PhyxCalc"

    print(f"Downloading upstream archive for {REVISION}...")
    with urllib.request.urlopen(ARCHIVE_URL) as response:
        archive_bytes = response.read()

    archive_sha256 = sha256_bytes(archive_bytes)
    print(f"Archive downloaded ({len(archive_bytes)} bytes, SHA-256: {archive_sha256})")

    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
        entries = [e for e in zf.infolist() if not e.is_dir()]

        if args.restore_images:
            icon_entry = next((e for e in entries if e.filename.endswith("/images/phyxcalc.png")), None)
            alt_entry = next((e for e in entries if e.filename.endswith("/images/PhyxCalc.png")), None)

            # If PhyxCalc.png exists but has the hash of phyxcalc.png, fix casing
            mis_cased = project_root / "images" / "PhyxCalc.png"
            target_icon = project_root / "images" / "phyxcalc.png"

            if mis_cased.is_file() and not target_icon.is_file():
                if sha256_file(mis_cased).lower() == sha256_bytes(zf.read(icon_entry)).lower():
                    mis_cased.rename(target_icon)

            if target_icon.exists():
                local_hash = sha256_file(target_icon)
                entry_hash = sha256_bytes(zf.read(icon_entry))
                if local_hash.lower() != entry_hash.lower():
                    raise RuntimeError("The local application icon was modified; refusing to overwrite it.")
            elif icon_entry:
                target_icon.parent.mkdir(parents=True, exist_ok=True)
                target_icon.write_bytes(zf.read(icon_entry))

            alt_path = project_root / "images" / "phyxcalc-original.png"
            if not alt_path.exists() and alt_entry:
                alt_path.parent.mkdir(parents=True, exist_ok=True)
                alt_path.write_bytes(zf.read(alt_entry))

        issues = []
        checked_files = 0
        seen_paths = set()

        for entry in entries:
            # Drop the top-level directory (e.g. PhyxCalc-<commit>/)
            slash_idx = entry.filename.find("/")
            if slash_idx < 0:
                continue
            rel_path = entry.filename[slash_idx + 1 :]
            if rel_path == "images/PhyxCalc.png":
                rel_path = "images/phyxcalc-original.png"

            lower_path = rel_path.lower()
            if lower_path in seen_paths:
                issues.append(f"Case-colliding path: {rel_path}")
            seen_paths.add(lower_path)

            local_path = project_root / rel_path
            if not local_path.is_file():
                issues.append(f"Missing: {rel_path}")
                continue

            entry_filename = Path(entry.filename).name
            if local_path.name != entry_filename and rel_path != "images/phyxcalc-original.png":
                issues.append(f"Incorrect filename casing: {rel_path} (expected {entry_filename})")

            local_hash = sha256_file(local_path)
            entry_hash = sha256_bytes(zf.read(entry))
            if local_hash.lower() != entry_hash.lower():
                issues.append(f"Modified: {rel_path}")

            checked_files += 1

        if issues:
            raise RuntimeError("\n".join(issues))

        print("=" * 60)
        print("PhyxCalc Source Verification Summary")
        print("=" * 60)
        print(f"Revision:      {REVISION}")
        print(f"VerifiedFiles: {checked_files}")
        print(f"ArchiveSHA256: {archive_sha256}")
        print("Result:        All upstream files match; only the documented image path is renamed.")
        print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Verification failed: {exc}", file=sys.stderr)
        sys.exit(1)
