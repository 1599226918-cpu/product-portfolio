#!/usr/bin/env python3
"""Check document references and exact quotations in a supplied RAG dataset."""

import argparse
import json
from pathlib import Path


def unique_items(items, label, key="id"):
    result = {}
    if not isinstance(items, list):
        raise ValueError(f"{label} must be a list")
    for item in items:
        if not isinstance(item, dict) or not isinstance(item.get(key), str) or not item[key]:
            raise ValueError(f"{label} requires a non-empty {key}")
        if item[key] in result:
            raise ValueError(f"Duplicate identifier in {label}: {item[key]}")
        result[item[key]] = item
    return result


def check_dataset(dataset):
    documents = unique_items(dataset.get("documents"), "documents")
    cases = unique_items(dataset.get("cases"), "cases")
    results = unique_items(dataset.get("results"), "results", "case_id")
    if not documents or not cases:
        raise ValueError("At least one document and one case are required")
    sections = {}
    for document in documents.values():
        for section in unique_items(document.get("sections"), "sections").values():
            if not isinstance(section.get("text"), str) or not section["text"].strip():
                raise ValueError("Every section requires non-empty text")
            sections[f"{document['id']}/{section['id']}"] = section["text"]

    errors = []
    modes = {"grounded", "insufficient", "conflict"}
    for result_id in results.keys() - cases.keys():
        errors.append({"case_id": result_id, "issue": "unknown_case"})
    for case_id, case in cases.items():
        expected = case.get("expected")
        if not isinstance(expected, dict) or expected.get("answer_mode") not in modes:
            raise ValueError(f"Invalid expected answer mode for {case_id}")
        required = expected.get("evidence_sections")
        if not isinstance(required, list) or any(key not in sections for key in required):
            raise ValueError(f"Invalid expected evidence for {case_id}")
        if expected["answer_mode"] == "grounded" and not required:
            raise ValueError(f"Grounded cases require reference evidence: {case_id}")
        if expected["answer_mode"] == "conflict" and len(set(required)) < 2:
            raise ValueError(f"Conflict cases require at least two evidence sections: {case_id}")
        if expected["answer_mode"] == "insufficient" and required:
            raise ValueError(f"Insufficient cases must have an empty reference list: {case_id}")
        if case_id not in results:
            errors.append({"case_id": case_id, "issue": "missing_result"})
            continue
        result = results[case_id]
        if not isinstance(result.get("answer"), str) or not result["answer"].strip():
            errors.append({"case_id": case_id, "issue": "empty_answer"})
        if result.get("answer_mode") != expected["answer_mode"]:
            errors.append({"case_id": case_id, "issue": "answer_mode_mismatch"})
        citations = result.get("citations")
        if not isinstance(citations, list):
            errors.append({"case_id": case_id, "issue": "invalid_citation_list"})
            continue
        cited = set()
        for citation in citations:
            if not isinstance(citation, dict):
                errors.append({"case_id": case_id, "issue": "invalid_citation"})
                continue
            key = f"{citation.get('document_id')}/{citation.get('section_id')}"
            quote = citation.get("quote")
            if key not in sections:
                errors.append({"case_id": case_id, "issue": "unknown_section", "section": key})
            elif not isinstance(quote, str) or not quote.strip() or quote not in sections[key]:
                errors.append({"case_id": case_id, "issue": "quotation_mismatch", "section": key})
            else:
                cited.add(key)
        for key in set(required) - cited:
            errors.append({"case_id": case_id, "issue": "missing_expected_evidence", "section": key})
        if expected["answer_mode"] == "insufficient" and citations:
            errors.append({"case_id": case_id, "issue": "unexpected_evidence_for_insufficient_case"})
    return {
        "case_count": len(cases),
        "result_count": len(results),
        "structural_check": "pass" if not errors else "fail",
        "issues": errors,
        "human_review_required": ["answer_faithfulness", "business_correctness", "conflict_resolution"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        dataset = json.loads(args.input.read_text(encoding="utf-8"))
        if not isinstance(dataset, dict):
            raise ValueError("Input must be a JSON object")
        report = check_dataset(dataset)
    except (OSError, ValueError, TypeError) as error:
        parser.exit(2, f"Input error: {error}\n")
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0 if report["structural_check"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
