import ipaddress
import logging
import os
import re
import socket
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

OLLAMA_GENERATE_URL = os.environ.get("OLLAMA_GENERATE_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "15"))
MAX_CONTENT_LENGTH = 4000

FALLBACK_OLLAMA_DOWN = (
    "Unable to generate AI analysis. This may be due to a local model issue. Please try again."
)


def is_valid_url(url):
    """Simple URL validation without external dependencies."""
    if not url or not isinstance(url, str):
        return False

    check_url = url
    if not url.startswith(("http://", "https://")):
        check_url = "http://" + url

    try:
        result = urlparse(check_url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def is_url_safe(url):
    """
    Check if the URL is safe to access:
    - Must be HTTP or HTTPS
    - Must not point to private IP ranges, localhost, or internal network resources
    """
    try:
        parsed_url = urlparse(url)

        if parsed_url.scheme not in ["http", "https"]:
            return False

        hostname = parsed_url.netloc

        if ":" in hostname:
            hostname = hostname.split(":")[0]

        blocklist = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]
        if hostname.lower() in blocklist or hostname.endswith((".local", ".internal", ".intranet")):
            return False

        try:
            ip = ipaddress.ip_address(hostname)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
                or ip.is_unspecified
            ):
                return False
        except ValueError:
            pass

        try:
            resolved_ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(resolved_ip)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False
        except (socket.gaierror, ValueError):
            pass

        return True
    except Exception:
        return False


def sanitize_for_prompt(text):
    """Sanitize text to be safely included in an AI prompt."""
    if not text:
        return ""

    text = re.sub(r"[\x00-\x1F\x7F]", "", text)
    text = re.sub(
        r"\[(?:SYSTEM|USER|ASSISTANT|INSTRUCTION|SEARCH|WEBSITE|END).*?\]",
        lambda m: "\\" + m.group(0),
        text,
        flags=re.IGNORECASE,
    )

    return text


def duckduckgo_check(domain):
    """Check if a domain is suspicious based on DuckDuckGo search results."""
    suspicious_keywords = [
        "scam",
        "fraud",
        "phishing",
        "malware",
        "virus",
        "spam",
        "malicious",
        "fake",
        "suspicious",
    ]

    try:
        search_url = f"https://html.duckduckgo.com/html/?q={domain}+review+scam"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        if not is_url_safe(search_url):
            return {"is_suspicious": False, "matched_keywords": [], "error": "Search URL considered unsafe"}

        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        results = soup.find_all("a", class_="result__snippet")

        matched_keywords = []
        for result in results[:5]:
            text = result.get_text().lower()
            for keyword in suspicious_keywords:
                if keyword in text and keyword not in matched_keywords:
                    matched_keywords.append(keyword)

        return {"is_suspicious": len(matched_keywords) > 0, "matched_keywords": matched_keywords}
    except Exception as e:
        return {"is_suspicious": False, "matched_keywords": [], "error": str(e)}


def fetch_website_text(url):
    """Fetch and extract text content from a website."""
    try:
        if not is_url_safe(url):
            return "[Error: URL is not safe to access]"

        response = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            timeout=10,
        )

        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        for script in soup(["script", "style", "meta", "noscript"]):
            script.decompose()

        text = soup.get_text(separator=" ")
        text = re.sub(r"\s+", " ", text).strip()

        return text[:MAX_CONTENT_LENGTH]
    except requests.RequestException as e:
        return f"[Error fetching website: {str(e)}]"
    except Exception as e:
        return f"[Error processing website content: {str(e)}]"


def extract_summary(response_text):
    """Remove model thinking blocks and normalize."""
    if not response_text:
        return ""
    text = re.sub(r"<think>.*?</think>\s*", "", response_text, flags=re.DOTALL).strip()
    return text


def clean_plain_text(text):
    """Plain readable text: no markdown noise, single-line friendly paragraphs."""
    if not text or not isinstance(text, str):
        return ""

    text = extract_summary(text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"[`_]{1,2}", "", text)
    return text


def _prediction_hint(prediction):
    """Optional one-line hint for the LLM based on automated verdict."""
    if not prediction:
        return ""
    p = str(prediction).lower().strip()
    if p in ("malicious", "phishing"):
        return (
            "An automated scan flagged elevated risk for this URL. Emphasize phishing, "
            "impersonation, and why the user should avoid entering credentials."
        )
    if p == "suspicious":
        return (
            "An automated scan found mixed or caution signals. Explain uncertainty and what to verify before clicking."
        )
    if p in ("safe", "legitimate"):
        return (
            "Automated signals look relatively benign, but remind the user to stay cautious with links and logins."
        )
    return ""


def _build_cyber_prompt(safe_url, prediction=None):
    base = """You are a cybersecurity assistant. Analyze the URL below and explain whether it may be safe or suspicious. Highlight possible risks such as phishing, impersonation, or unusual domain structure. Keep the explanation concise and easy to understand. Write 2 to 4 short sentences in plain text only. Do not use markdown, bullet lists, or headings.

URL: {url}""".format(
        url=safe_url
    )

    hint = _prediction_hint(prediction)
    if hint:
        base = base + "\n\nContext: " + hint
    return base


def generate_response(url, prediction=None):
    """
    Call local Ollama to produce a short threat explanation.

    Always returns:
      {"summary": str, "status": "success" | "fallback"}
    """
    if not url or not isinstance(url, str):
        logger.info("LLM: skipped — invalid URL type")
        return {
            "summary": "We could not analyze this input. Please provide a valid web address.",
            "status": "fallback",
        }

    if not is_valid_url(url):
        logger.info("LLM: skipped — malformed URL")
        return {
            "summary": "We couldn't analyze that URL format. Please provide a full web address (for example https://example.com).",
            "status": "fallback",
        }

    if not is_url_safe(url):
        logger.info("LLM: skipped — URL not safe for analysis (SSRF policy)")
        return {
            "summary": "This URL points to a restricted or internal address and cannot be analyzed.",
            "status": "fallback",
        }

    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    safe_url = sanitize_for_prompt(url)
    safe_domain = sanitize_for_prompt(domain)

    if not safe_domain:
        logger.info("LLM: skipped — empty domain")
        return {
            "summary": "We couldn't determine a domain from this URL. Check the link and try again.",
            "status": "fallback",
        }

    prompt = _build_cyber_prompt(safe_url, prediction=prediction)

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    logger.info("LLM: Ollama request start model=%s url=%s", OLLAMA_MODEL, OLLAMA_GENERATE_URL)

    try:
        response = requests.post(
            OLLAMA_GENERATE_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()

        try:
            data = response.json()
        except ValueError as e:
            logger.warning("LLM: invalid JSON from Ollama: %s", e)
            return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}

        if isinstance(data, dict) and data.get("error"):
            logger.warning("LLM: Ollama error field: %s", data.get("error"))
            return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}

        raw_text = ""
        if isinstance(data, dict):
            raw_text = data.get("response") or data.get("message") or ""

        clean = clean_plain_text(raw_text)
        if len(clean) < 12:
            logger.warning("LLM: empty or too-short model output")
            return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}

        if len(clean) > 2000:
            clean = clean[:2000].rsplit(" ", 1)[0] + "…"

        logger.info("LLM: Ollama success (%d chars)", len(clean))
        return {"summary": clean, "status": "success"}

    except requests.exceptions.Timeout:
        logger.warning("LLM: Ollama timeout after %ss", OLLAMA_TIMEOUT)
        return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}
    except requests.exceptions.ConnectionError as e:
        logger.warning("LLM: connection error: %s", e)
        return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}
    except requests.exceptions.RequestException as e:
        logger.warning("LLM: request failed: %s", e)
        return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}
    except Exception as e:
        logger.exception("LLM: unexpected error: %s", e)
        return {"summary": FALLBACK_OLLAMA_DOWN, "status": "fallback"}
