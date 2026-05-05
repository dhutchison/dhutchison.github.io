#!/usr/bin/env python3
"""Publish a Jekyll draft by moving it into `_posts/`.

This preserves the existing front matter structure where possible, while
ensuring a post has at least:
  - summary (prompted for if missing)
  - date (defaults to current local datetime)
  - slug (defaults from title)
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
import unicodedata
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DRAFTS_DIR = ROOT / "_drafts"
POSTS_DIR = ROOT / "_posts"


@dataclass
class FrontMatterBlock:
    key: str
    lines: list[str]

    def scalar_value(self) -> str | None:
        if not self.lines:
            return ""

        first = self.lines[0]
        if not first.startswith(f"{self.key}:"):
            return None

        value = first.split(":", 1)[1].strip()
        if len(self.lines) > 1:
          return None

        if (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in {"'", '"'}
        ):
            value = value[1:-1]

        return value


def choose_file(directory: Path) -> Path | None:
    files = sorted(path for path in directory.iterdir() if path.is_file())
    if not files:
        print(f"No draft files found in {directory}")
        return None

    print(f"Choose file from {directory}:")
    for idx, path in enumerate(files, start=1):
        print(f"{idx}: {path.name}")

    print("> ", end="", flush=True)
    selection = input().strip()
    if not selection.isdigit():
        return None

    idx = int(selection) - 1
    if idx < 0 or idx >= len(files):
        return None

    return files[idx]


def split_front_matter(text: str) -> tuple[str, str, str]:
    match = re.match(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", text, re.DOTALL)
    if not match:
        raise ValueError("Invalid header format")

    return "---", match.group(1), match.group(2).rstrip() + "\n"


def parse_front_matter(front_matter: str) -> OrderedDict[str, FrontMatterBlock]:
    blocks: OrderedDict[str, FrontMatterBlock] = OrderedDict()
    current_key: str | None = None

    for line in front_matter.splitlines():
        key_match = re.match(r"^([A-Za-z0-9_]+):(.*)$", line)
        if key_match:
            current_key = key_match.group(1)
            blocks[current_key] = FrontMatterBlock(current_key, [line])
        elif current_key is not None:
            blocks[current_key].lines.append(line)
        else:
            raise ValueError(f"Unexpected front matter line before any key: {line}")

    return blocks


def dump_front_matter(blocks: OrderedDict[str, FrontMatterBlock]) -> str:
    return "\n".join("\n".join(block.lines) for block in blocks.values()) + "\n"


def quote_yaml_scalar(value: str) -> str:
    if value == "":
        return '""'

    if re.search(r"[:#\[\]\{\}\n\r]|^\s|\s$|^['\"]", value):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'

    return value


def set_scalar(blocks: OrderedDict[str, FrontMatterBlock], key: str, value: str) -> None:
    blocks[key] = FrontMatterBlock(key, [f"{key}: {quote_yaml_scalar(value)}"])


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return slug or "post"


def publish(draft_path: Path) -> None:
    if not draft_path.exists():
        raise FileNotFoundError(f"Specified file not found: {draft_path}")

    raw_text = draft_path.read_text(encoding="utf-8")
    _, front_matter, content = split_front_matter(raw_text)
    blocks = parse_front_matter(front_matter)

    title = blocks.get("title").scalar_value() if blocks.get("title") else None
    if not title:
        print("Post is missing a title. Please enter one: ", end="", flush=True)
        title = input().strip()
        if not title:
            raise ValueError("Title is required")
        set_scalar(blocks, "title", title)

    summary = blocks.get("summary").scalar_value() if blocks.get("summary") else None
    if not summary:
        print("Post is missing a summary. Please enter one: ", end="", flush=True)
        summary = input().strip()
        if summary:
            set_scalar(blocks, "summary", summary)

    now = datetime.now()
    short_date = now.strftime("%Y-%m-%d")
    long_date = now.strftime("%Y-%m-%d %H:%M")

    date_value = blocks.get("date").scalar_value() if blocks.get("date") else None
    if not date_value:
        set_scalar(blocks, "date", long_date)

    slug_value = blocks.get("slug").scalar_value() if blocks.get("slug") else None
    if not slug_value:
        set_scalar(blocks, "slug", slugify(title))
        slug_value = blocks["slug"].scalar_value()

    draft_path.write_text(
        "---\n" + dump_front_matter(blocks) + "---\n" + content,
        encoding="utf-8",
    )

    extension = draft_path.suffix if draft_path.suffix in {".md", ".markdown"} else ".markdown"
    target = POSTS_DIR / f"{short_date}-{slug_value}{extension}"
    shutil.move(str(draft_path), str(target))
    print(f'Published "{title}" to {target}')


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish a Jekyll draft into _posts.")
    parser.add_argument("filename", nargs="?", help="Path to a draft file")
    args = parser.parse_args()

    if args.filename:
        draft_path = Path(args.filename).expanduser()
        if not draft_path.is_absolute():
            draft_path = (ROOT / draft_path).resolve()
    else:
        selected = choose_file(DRAFTS_DIR)
        if selected is None:
            return 1
        draft_path = selected

    publish(draft_path)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nCancelled.")
        raise SystemExit(1)
    except Exception as exc:  # noqa: BLE001
        print(exc, file=sys.stderr)
        raise SystemExit(1)
