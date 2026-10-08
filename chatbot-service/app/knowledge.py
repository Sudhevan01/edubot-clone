"""Knowledge base loader and validator module.

Loads knowledge.md and pages.json at startup and validates their structure.
Fails fast with clear error messages if files are missing or malformed.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional
from app.logging_config import logger


@dataclass
class Page:
    """Page metadata object representing a landing page route."""

    key: str
    label: str
    url: str


class KnowledgeStore:
    """Store for cached knowledge content and pages metadata."""

    def __init__(self) -> None:
        self.pages: Dict[str, Page] = {}
        self.raw_content: str = ""
        self.page_contents: Dict[str, str] = {}
        self.loaded: bool = False

    def load(self, knowledge_dir: Path) -> None:
        """Load knowledge.md and pages.json from the specified directory.

        Raises FileNotFoundError if files are missing.
        Raises ValueError if content is malformed or invalid.
        """
        pages_file = knowledge_dir / "pages.json"
        knowledge_file = knowledge_dir / "knowledge.md"

        if not pages_file.is_file():
            raise FileNotFoundError(f"pages.json missing at {pages_file}")
        if not knowledge_file.is_file():
            raise FileNotFoundError(f"knowledge.md missing at {knowledge_file}")

        # Parse pages.json
        try:
            with open(pages_file, "r", encoding="utf-8") as f:
                pages_data = json.load(f)
        except json.JSONDecodeError as err:
            raise ValueError(f"pages.json is malformed JSON: {err}")

        if not isinstance(pages_data, list) or len(pages_data) == 0:
            raise ValueError("pages.json must contain a non-empty list of page objects")

        parsed_pages: Dict[str, Page] = {}
        for item in pages_data:
            if not isinstance(item, dict):
                raise ValueError("pages.json items must be dictionaries")
            for req_key in ("key", "label", "url"):
                if req_key not in item or not isinstance(item[req_key], str) or not item[req_key].strip():
                    raise ValueError(f"pages.json item missing or invalid field '{req_key}': {item}")
            parsed_pages[item["key"]] = Page(
                key=item["key"], label=item["label"], url=item["url"]
            )

        # Parse knowledge.md
        with open(knowledge_file, "r", encoding="utf-8") as f:
            content = f.read().strip()

        if not content:
            raise ValueError("knowledge.md file is empty")

        # Parse sections separated by ## page: <key>
        page_contents: Dict[str, str] = {}
        sections = content.split("## page: ")
        for sec in sections:
            sec_str = sec.strip()
            if not sec_str:
                continue
            lines = sec_str.split("\n", 1)
            page_key = lines[0].strip()
            page_body = lines[1].strip() if len(lines) > 1 else ""
            if page_key in parsed_pages:
                page_contents[page_key] = page_body

        # Validate cross-referencing between pages.json and knowledge.md
        for key in parsed_pages:
            if key not in page_contents:
                raise ValueError(f"Page key '{key}' from pages.json not found in knowledge.md")

        self.pages = parsed_pages
        self.raw_content = content
        self.page_contents = page_contents
        self.loaded = True

        logger.info(f"Loaded {len(self.pages)} pages into knowledge store")


_store = KnowledgeStore()


def load_knowledge(knowledge_dir: Path) -> None:
    """Load knowledge base from directory."""
    _store.load(knowledge_dir)


def get_page_by_key(key: str) -> Optional[Page]:
    """Look up a page by key."""
    return _store.pages.get(key)


def get_all_pages() -> Dict[str, Page]:
    """Return dictionary of all loaded pages."""
    return _store.pages


def get_knowledge_content() -> str:
    """Return raw knowledge markdown content."""
    return _store.raw_content


def is_knowledge_loaded() -> bool:
    """Check if knowledge store is loaded."""
    return _store.loaded
