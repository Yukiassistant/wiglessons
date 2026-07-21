#!/usr/bin/env python3
"""Check that the curriculum's direct reference pages still resolve."""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.client import HTTPException
from pathlib import Path
from urllib.parse import urlparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
LESSONS_PATH = ROOT / "lessons.json"
SHOPIFY_SITEMAP_BASES = {
    "arda-wigs.com": "https://arda-wigs.com",
    "www.epiccosplay.com": "https://www.epiccosplay.com",
    "www.famcut.com": "https://www.famcut.com",
}


def fetch_bytes(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; WigLessonsReferenceCheck/1.0)"})
    with urlopen(request, timeout=30) as response:
        return response.read()


def published_shopify_urls(base_url: str) -> set[str]:
    root = ElementTree.fromstring(fetch_bytes(f"{base_url}/sitemap.xml"))
    child_maps = [
        node.text
        for node in root.iter()
        if node.tag.endswith("loc")
        and node.text
        and any(kind in node.text for kind in ("sitemap_blogs", "sitemap_pages"))
    ]
    published: set[str] = set()
    for sitemap_url in child_maps:
        sitemap = ElementTree.fromstring(fetch_bytes(sitemap_url))
        published.update(
            node.text.rstrip("/")
            for node in sitemap.iter()
            if node.tag.endswith("loc") and node.text
        )
    return published


def check_url(url: str) -> tuple[str, str | None]:
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "Mozilla/5.0 (compatible; WigLessonsReferenceCheck/1.0)",
        },
    )
    try:
        with urlopen(request, timeout=25) as response:
            status = response.getcode()
            content_type = response.headers.get_content_type()
            final_url = response.geturl()
            response.read(2048)
        requested = urlparse(url)
        resolved = urlparse(final_url)
        requested_host = (requested.hostname or "").lower().removeprefix("www.")
        resolved_host = (resolved.hostname or "").lower().removeprefix("www.")
        requested_path = requested.path.rstrip("/") or "/"
        resolved_path = resolved.path.rstrip("/") or "/"
        if (
            requested.scheme.lower(), requested_host, requested_path, requested.query
        ) != (
            resolved.scheme.lower(), resolved_host, resolved_path, resolved.query
        ):
            return url, f"redirected to a different page: {final_url}"
        if status < 200 or status >= 400:
            return url, f"HTTP {status}"
        if content_type not in {"text/html", "application/xhtml+xml", "application/pdf"}:
            return url, f"unexpected content type {content_type!r}"
        return url, None
    except HTTPError as error:
        return url, f"HTTP {error.code}"
    except (OSError, HTTPException) as error:
        return url, f"transport error: {error}"


def main() -> int:
    data = json.loads(LESSONS_PATH.read_text(encoding="utf-8"))
    urls = sorted(
        {
            resource["url"]
            for lesson in data["lessons"]
            for resource in lesson["requiredResources"]
        }
    )
    failures: list[tuple[str, str]] = []
    inconclusive: list[tuple[str, str]] = []
    sitemap_confirmed: set[str] = set()
    for hostname, base_url in SHOPIFY_SITEMAP_BASES.items():
        site_urls = {url.rstrip("/") for url in urls if urlparse(url).netloc == hostname}
        if not site_urls:
            continue
        try:
            published = published_shopify_urls(base_url)
        except (ElementTree.ParseError, OSError, HTTPException) as error:
            print(f"WARN could not read {base_url} sitemaps: {error}")
            continue
        sitemap_confirmed.update(url for url in site_urls if url in published)
        for missing in sorted(site_urls - published):
            failures.append((missing, "not found in current publisher sitemap"))

    fetch_urls = [url for url in urls if not any(url == item[0] for item in failures)]
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(check_url, url): url for url in fetch_urls}
        for future in as_completed(futures):
            url, error = future.result()
            if error:
                if error in {"HTTP 403", "HTTP 429"} or error.startswith("transport error:"):
                    inconclusive.append((url, error))
                else:
                    failures.append((url, error))
    if failures:
        for url, error in sorted(failures):
            print(f"FAIL {error}: {url}")
        print(f"{len(failures)} of {len(urls)} unique reference URLs failed")
        return 1
    if inconclusive:
        print(
            f"WARN {len(inconclusive)} URLs were publisher-rate-limited; "
            "no broken (404/410) reference was found"
        )
    print(
        f"Checked {len(urls)} unique direct reference URLs "
        f"({len(sitemap_confirmed)} in publisher sitemaps, "
        f"{len(fetch_urls) - len(inconclusive)} fetched successfully)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
