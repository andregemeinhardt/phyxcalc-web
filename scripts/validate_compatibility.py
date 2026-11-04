#!/usr/bin/env python3
"""
Offline validation of the PhyxCalc Phase 2 compatibility specification.
Ports scripts/validate-compatibility.ps1 with exact equivalent assertions.
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def main():
    script_dir = Path(__file__).resolve().parent
    workspace_root = script_dir.parent
    compatibility_root = workspace_root / "compatibility"
    phyxcalc_root = workspace_root / "PhyxCalc"

    cases_path = compatibility_root / "cases.json"
    if not cases_path.is_file():
        raise FileNotFoundError(f"Fixture not found: {cases_path}")

    with open(cases_path, "r", encoding="utf-8") as f:
        fixture = json.load(f)

    # 1. Schema and revision check
    if fixture.get("schemaVersion") != 1 or fixture.get("upstreamRevision") != "c952bc8fecda1f5c14e05ed33656492564bc6cd4":
        raise ValueError("The fixture schema or upstream revision does not match the baseline.")

    startup_defs_rel = fixture.get("profile", {}).get("startupDefinitions", "")
    if not (workspace_root / startup_defs_rel).is_file():
        raise FileNotFoundError(f"Startup definitions are missing: {startup_defs_rel}")

    profile = fixture.get("profile", {})
    if profile.get("decimalPrecision") != 6 or profile.get("numberFormat") != "g" or profile.get("imaginaryUnit") != "j":
        raise ValueError("The default fixture formatting profile changed without baseline review.")

    # 2. FEATURES.md validation
    features_path = compatibility_root / "FEATURES.md"
    features_content = features_path.read_text(encoding="utf-8")

    feature_pattern = re.compile(r"^\|\s*([a-z][a-z0-9-]+)\s*\|[^|\r\n]*\|\s*(?:not started|in progress|implemented|verified|explicitly deferred)\s*\|", re.MULTILINE)
    feature_identifiers = {}
    for match in feature_pattern.finditer(features_content):
        fid = match.group(1)
        if fid in feature_identifiers:
            raise ValueError(f"Duplicate feature matrix ID: {fid}")
        feature_identifiers[fid] = True

    if not feature_identifiers:
        raise ValueError("The feature matrix has no tracked rows.")

    link_pattern = re.compile(r"\]\((?P<path>\.\./PhyxCalc/[^)]+)\)")
    for match in link_pattern.finditer(features_content):
        link_path = (compatibility_root / match.group("path")).resolve()
        if not link_path.is_file():
            raise FileNotFoundError(f"Broken feature evidence link: {match.group('path')}")

    # 3. CalculationError extraction
    header_path = phyxcalc_root / "phyxcalculator.h"
    header_content = header_path.read_text(encoding="utf-8")
    enum_match = re.search(r"enum\s+CalculationError\s*\{(?P<members>.*?)\}", header_content, re.DOTALL)
    if not enum_match:
        raise ValueError("CalculationError enum not found in phyxcalculator.h")

    error_names = set(re.findall(r"\b[A-Za-z]+Error\b", enum_match.group("members")))

    # 4. cases.json validation
    case_identifiers = {}
    step_count = 0
    probe_count = 0
    observation_count = 0
    covered_features = {}
    number_pattern = re.compile(r"^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$")

    cases = fixture.get("cases", [])
    if not cases:
        raise ValueError("The fixture corpus is empty.")

    profile_keys = set(profile.keys())

    for case in cases:
        cid = case.get("id", "")
        if not re.match(r"^[a-z][a-z0-9-]+$", cid) or cid in case_identifiers:
            raise ValueError(f"Invalid or duplicate case ID: {cid}")
        case_identifiers[cid] = True

        feature = case.get("feature", "")
        if feature not in feature_identifiers:
            raise ValueError(f"Unknown feature for case {cid}: {feature}")
        covered_features[feature] = True

        evidence = case.get("evidence", "")
        if evidence not in ("documentation", "source-derived", "probe"):
            raise ValueError(f"Unknown evidence category: {cid}")

        source_rel = case.get("source", "")
        if not source_rel or not (workspace_root / source_rel).is_file():
            raise FileNotFoundError(f"Missing source evidence: {cid}")

        case_settings = case.get("settings", {})
        for sname in case_settings.keys():
            if sname and sname not in profile_keys:
                raise ValueError(f"Unknown setting override in {cid}: {sname}")

        if "observation" not in case:
            raise ValueError(f"Case lacks an explicit observation field: {cid}")

        obs = case["observation"]
        if obs is not None:
            for field in ("referenceBuild", "platform", "settings", "steps", "date"):
                if field not in obs:
                    raise ValueError(f"Incomplete reference observation in {cid}: {field}")
            if len(obs.get("steps", [])) != len(case.get("steps", [])):
                raise ValueError(f"Observation step count mismatch: {cid}")
            observation_count += 1

        steps = case.get("steps", [])
        if not steps:
            raise ValueError(f"Case contains no steps: {cid}")

        for step in steps:
            if not isinstance(step.get("input"), str):
                raise ValueError(f"Step input must be a string, including a blank list terminator: {cid}")

            exp = step.get("expect", {})
            kind = exp.get("kind")
            if kind == "value":
                for comp in ("real", "imaginary"):
                    val = exp.get(comp)
                    if not isinstance(val, str) or not number_pattern.match(val):
                        raise ValueError(f"Invalid decimal-string component in {cid}: {comp}")
                if not isinstance(exp.get("unit"), str):
                    raise ValueError(f"Numeric expectation requires an explicit unit string: {cid}")
            elif kind == "display":
                if not isinstance(exp.get("text"), str):
                    raise ValueError(f"Display expectation requires text: {cid}")
            elif kind == "error":
                if exp.get("code") not in error_names:
                    raise ValueError(f"Unknown legacy error class in {cid}: {exp.get('code')}")
            elif kind == "silent":
                pass
            elif kind == "probe":
                q = exp.get("question")
                if not q or not q.strip():
                    raise ValueError(f"Probe requires a specific question: {cid}")
                probe_count += 1
            else:
                raise ValueError(f"Unknown expectation kind in {cid}: {kind}")

            step_count += 1

    # 5. Grammar and engine actions validation
    engine_path = phyxcalc_root / "phyxcalculator.cpp"
    engine_content = engine_path.read_text(encoding="utf-8")
    action_names = set(re.findall(r'functionMap\.insert\("(?P<name>[A-Za-z0-9_]+)"', engine_content))
    action_names.add("bufferParameter")

    grammar_path = phyxcalc_root / "settings" / "grammar.txt"
    used_actions = set()
    with open(grammar_path, "r", encoding="utf-8") as f:
        for line in f:
            rule = line.split("//", 1)[0].strip()
            if not rule or rule.startswith("#"):
                continue
            rule_parts = re.split(r"(?<!\\);", rule)
            if len(rule_parts) < 2:
                continue
            actions = rule_parts[-1].split(",")
            for act in actions:
                aname = act.strip()
                if not aname:
                    continue
                if aname not in action_names:
                    raise ValueError(f"Grammar calls an unknown engine action: {aname}")
                used_actions.add(aname)

    # 6. UI Designer actions count
    ui_action_count = 0
    for ui_path in phyxcalc_root.glob("*.ui"):
        tree = ET.parse(ui_path)
        ui_action_count += len(tree.findall(".//action"))

    print("=" * 60)
    print("PhyxCalc Offline Specification Validation Summary")
    print("=" * 60)
    print(f"FeatureRows:                {len(feature_identifiers)}")
    print(f"Cases:                      {len(case_identifiers)}")
    print(f"Steps:                      {step_count}")
    print(f"CalculationFeatureGroups:   {len(covered_features)}")
    print(f"ProbeSteps:                 {probe_count}")
    print(f"RecordedObservations:       {observation_count}")
    print(f"GrammarActionsResolved:     {len(used_actions)}")
    print(f"DesignerActionsInventoried: {ui_action_count}")
    print("Scope: Offline specification validation only; no calculator was executed.")
    print("Result: PASS")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
