#!/usr/bin/env python3
"""Validate basic front matter expectations for posts and drafts."""

from __future__ import annotations

import re
import sys
from pathlib import Path


FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
KEY_RE = re.compile(r"^([A-Za-z0-9_]+):(.*)$")
HTTP_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def parse_front_matter(path: Path) -> dict[str, list[str]]:
    text = path.read_text(encoding="utf-8")
    match = FRONT_MATTER_RE.match(text)
    if not match:
        raise ValueError("missing or invalid front matter block")

    blocks: dict[str, list[str]] = {}
    current_key: str | None = None

    for line in match.group(1).splitlines():
        key_match = KEY_RE.match(line)
        if key_match:
            current_key = key_match.group(1)
            blocks[current_key] = [line]
        elif current_key is not None:
            blocks[current_key].append(line)
        else:
            raise ValueError(f"unexpected front matter line: {line}")

    return blocks


def scalar_value(blocks: dict[str, list[str]], key: str) -> str | None:
    lines = blocks.get(key)
    if not lines:
        return None

    first = lines[0]
    value = first.split(":", 1)[1].strip()

    if len(lines) > 1:
        return None

    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]

    return value


def validate(path: Path) -> list[str]:
    errors: list[str] = []

    try:
        blocks = parse_front_matter(path)
    except ValueError as exc:
        return [f"{path}: {exc}"]

    title = scalar_value(blocks, "title")
    if not title:
        errors.append(f"{path}: missing title")

    summary = scalar_value(blocks, "summary")
    if not summary:
        errors.append(f"{path}: missing summary")

    if path.parent.name == "_posts":
        date = scalar_value(blocks, "date")
        if not date:
            errors.append(f"{path}: missing date")

    if "category" in blocks and "categories" not in blocks:
        errors.append(f"{path}: uses 'category:'; expected 'categories:'")

    link = scalar_value(blocks, "link")
    if link and not HTTP_URL_RE.match(link):
        errors.append(f"{path}: link must be an absolute http(s) URL")

    return errors


def main(argv: list[str]) -> int:
    if not argv:
        return 0

    errors: list[str] = []
    for name in argv:
        path = Path(name)
        if path.suffix.lower() not in {".md", ".markdown"}:
            continue
        if path.parent.name not in {"_posts", "_drafts"}:
            continue
        errors.extend(validate(path))

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
