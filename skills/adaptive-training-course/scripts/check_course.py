#!/usr/bin/env python3
"""Validate goal, fact, interaction and assessment references in course data."""

import argparse
import json
from pathlib import Path


def identifiers(items, label):
    if not isinstance(items, list) or not items:
        raise ValueError(f"{label} must be a non-empty list")
    found = set()
    for item in items:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item["id"]:
            raise ValueError(f"{label} requires non-empty identifiers")
        if item["id"] in found:
            raise ValueError(f"Duplicate identifier in {label}: {item['id']}")
        found.add(item["id"])
    return found


def check_course(course):
    goals = identifiers(course.get("learning_objectives"), "learning_objectives")
    scenario = course.get("scenario")
    assessment = course.get("assessment")
    if not isinstance(scenario, dict) or not isinstance(assessment, dict):
        raise ValueError("scenario and assessment must be objects")
    facts = identifiers(scenario.get("facts"), "facts")
    segments = course.get("segments")
    questions = assessment.get("questions")
    identifiers(segments, "segments")
    identifiers(questions, "questions")
    dimensions = assessment.get("dimensions")
    identifiers(dimensions, "dimensions")
    errors = []
    if not isinstance(assessment.get("version"), str) or not assessment["version"].strip():
        errors.append("missing_assessment_version")
    weights = [item.get("weight") for item in dimensions]
    if any(type(weight) is not int or weight < 0 for weight in weights):
        errors.append("invalid_dimension_weight")
    elif sum(weights) != 100:
        errors.append("dimension_weights_must_total_100")

    covered_goals = set()
    for item in segments + questions:
        for field, allowed in [("goal_ids", goals), ("fact_ids", facts)]:
            values = item.get(field)
            if not isinstance(values, list) or not values or any(value not in allowed for value in values):
                errors.append(f"invalid_{field}:{item['id']}")
            elif field == "goal_ids" and item in segments:
                covered_goals.update(values)
    for segment in segments:
        interaction = segment.get("interaction")
        if not isinstance(interaction, dict) or interaction.get("kind") not in {"comparison", "dialogue-branch", "timeline"}:
            errors.append(f"unsupported_interaction:{segment['id']}")
        if not isinstance(segment.get("narration"), str) or not segment["narration"].strip():
            errors.append(f"missing_narration:{segment['id']}")
    assessed_goals = set()
    for question in questions:
        option_ids = identifiers(question.get("options"), "options")
        if len(option_ids) < 2:
            errors.append(f"insufficient_options:{question['id']}")
        if question.get("correct_option") not in option_ids:
            errors.append(f"invalid_correct_option:{question['id']}")
        if not isinstance(question.get("rationale"), str) or not question["rationale"].strip():
            errors.append(f"missing_rationale:{question['id']}")
        assessed_goals.update(value for value in question.get("goal_ids", []) if isinstance(value, str))
    for goal in goals - covered_goals:
        errors.append(f"uncovered_goal:{goal}")
    for goal in goals - assessed_goals:
        errors.append(f"unassessed_goal:{goal}")
    return {
        "goal_count": len(goals),
        "segment_count": len(segments),
        "question_count": len(questions),
        "structural_check": "pass" if not errors else "fail",
        "issues": errors,
        "human_review_required": ["instructional_quality", "fact_support", "media_playback"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    args = parser.parse_args()
    try:
        course = json.loads(args.input.read_text(encoding="utf-8"))
        if not isinstance(course, dict):
            raise ValueError("Input must be a JSON object")
        report = check_course(course)
    except (OSError, ValueError, TypeError) as error:
        parser.exit(2, f"Input error: {error}\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["structural_check"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
