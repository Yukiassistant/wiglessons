#!/usr/bin/env python3
"""Build NotebookLM-ready source packets from the wig lessons JSON."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LESSONS_PATH = ROOT / "lessons.json"
OUT_DIR = ROOT / "notebooklm-podcasts"

HOST_BRIEF = """Create a short 5-8 minute private study audio overview from this source.

Style requirements:
- Explain practical cosplay wig technique in plain beginner-friendly language.
- Focus on the wig skill, decision, and what to look at in references. Include a safety caution only when the source lesson provides one.
- Treat every exercise as reference-based or hypothetical. Do not tell the listener to obtain, buy, wear, handle, or modify a wig or styling materials.
- Define terms naturally when they appear.
- Avoid motivational filler, generic study advice, and meta commentary.
- Do not mention JSON, the web app, daily lesson structure, NotebookLM, source packets, or curriculum design.
- Do not invent product claims or exact temperatures. If a technique involves heat, adhesive, dye, blades, dust, or skin contact, emphasize testing and safety.
"""

EPISODES = [
    {
        "number": 1,
        "title": "Wig Anatomy And Reference Views",
        "days": range(1, 10),
        "focus": "Identify the physical parts of a wig and learn how front, side, and back references change the build plan.",
    },
    {
        "number": 2,
        "title": "Setup, Fit, And Heat Safety",
        "days": range(10, 19),
        "focus": "Understand task-specific tools, fit checks, alignment points, and the basic heat-safety rules for synthetic fiber.",
    },
    {
        "number": 3,
        "title": "Steam, Care, And Cutting Setup",
        "days": range(19, 28),
        "focus": "Use steam carefully, protect the wig during care and storage, and set up conservative cutting habits.",
    },
    {
        "number": 4,
        "title": "Cutting Shape, Layers, And Volume",
        "days": range(28, 37),
        "focus": "Shape face framing, soften edges, compare stand fit to worn fit, and place hidden volume without ruining the surface.",
    },
    {
        "number": 5,
        "title": "Texture, Product, And Adhesives",
        "days": range(37, 46),
        "focus": "Separate support texture from visible finish, use product as finish instead of structure, and choose adhesives safely.",
    },
    {
        "number": 6,
        "title": "Anime Hair Shapes And Spikes",
        "days": range(46, 55),
        "focus": "Translate stylized character hair into major chunks, negative space, soft spikes, supported spikes, and movement tests.",
    },
    {
        "number": 7,
        "title": "Wefts, Ponytails, Braids, And Edges",
        "days": range(55, 64),
        "focus": "Use wefts and donor fiber deliberately, plan ponytail load, handle updo exposure, and understand visible edge choices.",
    },
    {
        "number": 8,
        "title": "Hairlines, Ventilating, And Color Tests",
        "days": range(64, 73),
        "focus": "Plan hairline methods, understand ventilating use cases, check density gradients, and test synthetic color changes safely.",
    },
    {
        "number": 9,
        "title": "Color Choices And Structural Builds",
        "days": range(73, 82),
        "focus": "Choose lower-risk color paths and plan hard caps, shells, armatures, foam cores, wire, hardware, detachable pieces, and removal.",
    },
    {
        "number": 10,
        "title": "Transport, Samples, Photos, And Review",
        "days": range(82, 91),
        "focus": "Understand transport protection, plan sample concepts, evaluate documentation, critique by cause, and choose the next study target.",
    },
]


def link_line(resource: dict[str, str]) -> str:
    return f"- {resource['title']}: {resource['url']}"


def lesson_block(lesson: dict) -> str:
    glossary = "\n".join(
        f"- {entry['term']}: {entry['definition']}" for entry in lesson["glossary"]
    )
    resources = "\n".join(link_line(item) for item in lesson["requiredResources"])
    safety = f"\nSafety note: {lesson['safety']}\n" if lesson.get("safety") else ""
    return f"""## Lesson {lesson['day']}: {lesson['title']}

Objective: {lesson['objective']}

Core concept: {lesson['concept']}

Practice prompt: {lesson['practice']}
{safety}

Check question: {lesson['reflection']}

Ready when: {lesson['readiness']}

Key terms:
{glossary}

References:
{resources}
"""


def packet_text(episode: dict, lessons_by_day: dict[int, dict]) -> str:
    lessons = [lessons_by_day[day] for day in episode["days"]]
    lesson_range = f"{lessons[0]['day']}-{lessons[-1]['day']}"
    blocks = "\n".join(lesson_block(lesson) for lesson in lessons)
    return f"""# Episode {episode['number']:02d}: {episode['title']}

Lesson range: {lesson_range}

Episode focus: {episode['focus']}

# Host Brief

{HOST_BRIEF}

# Source Lessons

{blocks}
"""


def index_text() -> str:
    rows = "\n".join(
        f"- Episode {item['number']:02d}: {item['title']} - lessons {min(item['days'])}-{max(item['days'])}"
        for item in EPISODES
    )
    return f"""# NotebookLM Podcast Packets

These files are source packets for turning the 90 cosplay wig lessons into short NotebookLM Audio Overviews.

Recommended use:
- Upload one episode file into a NotebookLM notebook.
- Generate a short Audio Overview from that source.
- Standard NotebookLM accounts may be limited to 3 Audio Overviews per day, so plan on about four days for all 10 episodes.
- Listen back before relying on an episode, especially for heat, adhesive, dye, blade, dust, or skin-contact topics.

Episode list:
{rows}
"""


def main() -> int:
    data = json.loads(LESSONS_PATH.read_text(encoding="utf-8"))
    lessons_by_day = {lesson["day"]: lesson for lesson in data["lessons"]}

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "README.md").write_text(index_text(), encoding="utf-8")

    for episode in EPISODES:
        filename = f"episode-{episode['number']:02d}.md"
        (OUT_DIR / filename).write_text(packet_text(episode, lessons_by_day), encoding="utf-8")

    print(f"Wrote {len(EPISODES)} episode packets to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
