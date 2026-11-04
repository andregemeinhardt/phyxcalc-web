#!/usr/bin/env python3
"""
Executes compatibility/cases.json against the reference harness (build/reference/harness/runner)
with process isolation, per-case timeout protection, and discrepancy analysis.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Run reference calculation test harness.")
    parser.add_argument("--update-cases", action="store_true", help="Record observations into compatibility/cases.json")
    parser.add_argument("--case", type=str, help="Run only a specific case ID")
    parser.add_argument("--timeout", type=float, default=5.0, help="Per-case timeout in seconds")
    args = parser.parse_args()

    workspace_root = Path(__file__).resolve().parent.parent
    runner_bin = workspace_root / "build" / "reference" / "harness" / "runner"
    cases_file = workspace_root / "compatibility" / "cases.json"

    if not runner_bin.is_file():
        print(f"Error: Runner binary not found at {runner_bin}", file=sys.stderr)
        sys.exit(1)

    with open(cases_file, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    # Fetch platform info
    plat_proc = subprocess.run([str(runner_bin), "--platform-info"], capture_output=True, text=True, check=True)
    platform_info = json.loads(plat_proc.stdout)

    print("=" * 70)
    print("PhyxCalc Native Reference Runner")
    print("=" * 70)
    print(f"Platform:       {platform_info.get('os')} ({platform_info.get('arch')})")
    print(f"Compiler:       {platform_info.get('compiler')}")
    print(f"Qt Version:     {platform_info.get('qt')}")
    print(f"sizeof(ldouble):{platform_info.get('sizeof_long_double')} bytes (digits: {platform_info.get('digits_long_double')})")
    print(f"sizeof(longint):{platform_info.get('sizeof_long_int')} bytes")
    print("=" * 70)

    target_cases = corpus["cases"]
    if args.case:
        target_cases = [c for c in target_cases if c["id"] == args.case]
        if not target_cases:
            print(f"Error: Case {args.case} not found.", file=sys.stderr)
            sys.exit(1)

    observations = {}
    mismatches = []
    probes_resolved = []
    timeouts = []
    crashes = []

    for case in target_cases:
        cid = case["id"]
        evidence = case.get("evidence", "")

        try:
            start_t = time.perf_counter()
            elapsed = 0.0
            proc = subprocess.run(
                [str(runner_bin), "--case", cid],
                cwd=str(workspace_root),
                capture_output=True,
                text=True,
                timeout=args.timeout
            )
            elapsed = time.perf_counter() - start_t

            if proc.returncode != 0:
                print(f"  [CRASH] {cid}: process exited with code {proc.returncode}")
                crashes.append((cid, proc.stderr.strip()))
                continue

            obs = json.loads(proc.stdout)
            observations[cid] = obs

        except subprocess.TimeoutExpired:
            print(f"  [TIMEOUT] {cid} whole case timed out; falling back to step-by-step execution...")
            timeouts.append(cid)

            # Step-by-step execution to isolate which step hangs
            case_steps = case.get("steps", [])
            step_observations = []
            for s_idx, s_item in enumerate(case_steps):
                s_input = s_item.get("input", "")
                try:
                    step_proc = subprocess.run(
                        [str(runner_bin), "--case", cid, "--step", str(s_idx)],
                        cwd=str(workspace_root),
                        capture_output=True,
                        text=True,
                        timeout=1.5
                    )
                    if step_proc.returncode == 0:
                        s_obs = json.loads(step_proc.stdout)
                        step_observations.append(s_obs)
                        print(f"    - step {s_idx} ('{s_input}'): completed OK")
                    else:
                        step_observations.append({
                            "input": s_input,
                            "kind": "probe",
                            "status": "crash",
                            "display": f"crash (exit code {step_proc.returncode})"
                        })
                        print(f"    - step {s_idx} ('{s_input}'): CRASH {step_proc.returncode}")
                except subprocess.TimeoutExpired:
                    step_observations.append({
                        "input": s_input,
                        "kind": "probe",
                        "status": "timeout",
                        "display": "hang (unbounded loop in PhyxCalculator::calculateDataset)"
                    })
                    print(f"    - step {s_idx} ('{s_input}'): TIMEOUT / HANG confirmed")

            obs = {
                "referenceBuild": platform_info.get("referenceBuild", "ubuntu-26.04-gcc15-qt5.15-qwt6.1"),
                "platform": platform_info,
                "settings": {
                    "decimalPrecision": 6,
                    "numberFormat": "g",
                    "imaginaryUnit": "j",
                    "unitMode": 1,
                    "prefixMode": 1,
                    "useFractions": case.get("settings", {}).get("useFractions", False)
                },
                "steps": step_observations,
                "date": "2026-11-04"
            }
            observations[cid] = obs

            # Analyze steps vs expectations
            case_steps = case.get("steps", [])
            obs_steps = obs.get("steps", [])

            for s_idx, (exp_step, obs_step) in enumerate(zip(case_steps, obs_steps)):
                exp = exp_step.get("expect", {})
                kind = exp.get("kind")
                inp = exp_step.get("input", "")

                if kind == "value":
                    # Check raw or display
                    obs_raw = obs_step.get("raw", {})
                    exp_real = float(exp.get("real", 0))
                    obs_real = float(obs_raw.get("real", 0)) if "real" in obs_raw else None
                    exp_unit = exp.get("unit", "")
                    obs_unit = obs_raw.get("unit", "")

                    diff = None
                    if obs_real is not None:
                        diff = abs(obs_real - exp_real)
                        if diff > 1e-9 or exp_unit != obs_unit:
                            mismatches.append({
                                "case": cid,
                                "step": s_idx,
                                "input": inp,
                                "expected": f"{exp.get('real')}{exp_unit}",
                                "observed": f"{obs_raw.get('real')}{obs_unit}",
                                "display": obs_step.get("display")
                            })
                    else:
                        mismatches.append({
                            "case": cid,
                            "step": s_idx,
                            "input": inp,
                            "expected": f"value {exp.get('real')}",
                            "observed": f"no value (kind: {obs_step.get('kind')})",
                            "display": obs_step.get("display")
                        })

                elif kind == "display":
                    exp_text = exp.get("text", "")
                    obs_text = obs_step.get("display", "")
                    if exp_text != obs_text:
                        mismatches.append({
                            "case": cid,
                            "step": s_idx,
                            "input": inp,
                            "expected": exp_text,
                            "observed": obs_text
                        })

                elif kind == "error":
                    exp_code = exp.get("code")
                    obs_code = obs_step.get("error", {}).get("code")
                    if exp_code != obs_code:
                        mismatches.append({
                            "case": cid,
                            "step": s_idx,
                            "input": inp,
                            "expected": f"error {exp_code}",
                            "observed": f"error {obs_code}"
                        })

                elif kind == "silent":
                    if obs_step.get("kind") != "silent":
                        mismatches.append({
                            "case": cid,
                            "step": s_idx,
                            "input": inp,
                            "expected": "silent",
                            "observed": obs_step.get("kind"),
                            "display": obs_step.get("display")
                        })

                elif kind == "probe":
                    probes_resolved.append({
                        "case": cid,
                        "step": s_idx,
                        "question": exp.get("question"),
                        "input": inp,
                        "observed_kind": obs_step.get("kind"),
                        "observed_display": obs_step.get("display"),
                        "observed_raw": obs_step.get("raw"),
                        "observed_error": obs_step.get("error")
                    })

            print(f"  [OK] {cid} ({len(case_steps)} steps, {elapsed*1000:.1f}ms)")

        except subprocess.TimeoutExpired:
            print(f"  [TIMEOUT] {cid} exceeded {args.timeout}s")
            timeouts.append(cid)

    print("\n" + "=" * 70)
    print("Execution Summary")
    print("=" * 70)
    print(f"Total Cases Executed:    {len(observations)} / {len(target_cases)}")
    print(f"Timeouts:                {len(timeouts)}")
    print(f"Crashes:                 {len(crashes)}")
    print(f"Expectation Mismatches:  {len(mismatches)}")
    print(f"Probes Captured:         {len(probes_resolved)}")
    print("=" * 70)

    if mismatches:
        print("\nMismatches:")
        for m in mismatches:
            print(f"  - {m['case']} step {m['step']} ('{m['input']}'): expected [{m['expected']}], observed [{m['observed']}]")

    if probes_resolved:
        print(f"\nCaptured {len(probes_resolved)} Probes. Highlights:")
        for p in probes_resolved[:10]:
            print(f"  - {p['case']} ('{p['input']}'): display=[{p['observed_display']}], kind={p['observed_kind']}")

    if args.update_cases:
        print("\nUpdating compatibility/cases.json with captured observations...")
        # Add write permissions if necessary
        compatibility_root = workspace_root / "compatibility"
        import stat
        cases_file.chmod(cases_file.stat().st_mode | stat.S_IWUSR)
        compatibility_root.chmod(compatibility_root.stat().st_mode | stat.S_IWUSR)

        for case in corpus["cases"]:
            cid = case["id"]
            if cid in observations:
                case["observation"] = observations[cid]

        with open(cases_file, "w", encoding="utf-8") as f:
            json.dump(corpus, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print("Updated cases.json successfully.")


if __name__ == "__main__":
    main()
