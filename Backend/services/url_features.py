import ipaddress
import re
import socket
from datetime import datetime
from urllib.parse import urlparse

import requests
import tldextract
import whois
from bs4 import BeautifulSoup

FEATURE_NAMES = [
    "having_IP_Address",
    "URL_Length",
    "Shortening_Service",
    "having_At_Symbol",
    "double_slash_redirecting",
    "Prefix_Suffix",
    "having_Sub_Domain",
    "SSLfinal_State",
    "Domain_registeration_length",
    "Favicon",
    "port",
    "HTTPS_token",
    "Request_URL",
    "URL_of_Anchor",
    "Links_in_tags",
    "SFH",
    "Submitting_to_email",
    "Abnormal_URL",
    "Redirect",
    "on_mouseover",
    "RightClick",
    "popUpWidnow",
    "Iframe",
    "age_of_domain",
    "DNSRecord",
    "Web_Traffic",
    "Page_Rank",
    "Google_Index",
    "Links_pointing_to_page",
    "Statistical_report",
]

SHORTENERS = ("bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "rb.gy")
MAX_EXTERNAL_REQUESTS = 3


def is_url_safe(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return False
        host = parsed.netloc.split(":")[0]
        if host in ("localhost", "127.0.0.1", "::1") or host.startswith("127."):
            return False
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            pass
        return True
    except Exception:
        return False


def safe_request_get(url: str, **kwargs):
    if not is_url_safe(url):
        return None
    try:
        return requests.get(url, **kwargs)
    except Exception:
        return None


def _domain_registration_length_days(whois_data) -> int:
    if not whois_data:
        return 0
    exp = getattr(whois_data, "expiration_date", None)
    cre = getattr(whois_data, "creation_date", None)
    if isinstance(exp, list):
        exp = exp[0]
    if isinstance(cre, list):
        cre = cre[0]
    if exp and cre and isinstance(exp, datetime) and isinstance(cre, datetime):
        return max((exp - cre).days, 0)
    return 0


def _age_of_domain_days(whois_data) -> int:
    if not whois_data:
        return 0
    cre = getattr(whois_data, "creation_date", None)
    if isinstance(cre, list):
        cre = cre[0]
    if cre and isinstance(cre, datetime):
        return max((datetime.now() - cre).days, 0)
    return 0


def extract_features_from_url(url: str):
    if not is_url_safe(url):
        return [1] * len(FEATURE_NAMES)

    parsed = urlparse(url)
    domain = parsed.netloc
    path = parsed.path or ""
    domain_info = tldextract.extract(url)
    full_domain = f"{domain_info.domain}.{domain_info.suffix}" if domain_info.suffix else domain_info.domain

    response = None
    html = ""
    soup = None
    external_requests = 0

    response = safe_request_get(url, timeout=3, allow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    if response is not None:
        external_requests += 1
        html = response.text or ""
        soup = BeautifulSoup(html, "html.parser")

    whois_data = None
    if external_requests < MAX_EXTERNAL_REQUESTS:
        try:
            whois_data = whois.whois(full_domain)
            external_requests += 1
        except Exception:
            whois_data = None

    features = []

    features.append(1 if re.match(r"^\d{1,3}(?:\.\d{1,3}){3}$", domain.split(":")[0]) else -1)
    features.append(1 if len(url) >= 75 else 0 if len(url) >= 54 else -1)
    features.append(1 if any(s in domain.lower() for s in SHORTENERS) else -1)
    features.append(1 if "@" in url else -1)
    features.append(1 if url.rfind("//") > 7 else -1)
    features.append(1 if "-" in domain_info.domain else -1)

    subdomain_count = 0 if not domain_info.subdomain else len(domain_info.subdomain.split("."))
    features.append(1 if subdomain_count > 2 else 0 if subdomain_count == 2 else -1)
    features.append(-1 if parsed.scheme == "https" else 1)

    reg_days = _domain_registration_length_days(whois_data)
    features.append(-1 if reg_days >= 365 else 1)

    icon = soup.find("link", rel=lambda x: x and "icon" in x.lower()) if soup else None
    icon_href = icon.get("href", "") if icon else ""
    features.append(-1 if icon_href and domain in icon_href else 1)

    features.append(1 if parsed.port else -1)
    features.append(1 if "https" in domain_info.domain.lower() else -1)

    req_tags = soup.find_all(["img", "script"], src=True) if soup else []
    if req_tags:
        external = sum(1 for t in req_tags if domain not in t.get("src", ""))
        ratio = external / len(req_tags)
        features.append(1 if ratio > 0.61 else 0 if ratio > 0.22 else -1)
    else:
        features.append(1)

    anchors = soup.find_all("a", href=True) if soup else []
    if anchors:
        unsafe = sum(1 for a in anchors if domain not in a.get("href", "") and not a.get("href", "").startswith("#"))
        ratio = unsafe / len(anchors)
        features.append(1 if ratio > 0.67 else 0 if ratio > 0.31 else -1)
    else:
        features.append(1)

    meta_tags = soup.find_all(["meta", "link", "script"]) if soup else []
    if meta_tags:
        external = sum(1 for t in meta_tags if domain not in str(t))
        ratio = external / len(meta_tags)
        features.append(1 if ratio > 0.81 else 0 if ratio > 0.17 else -1)
    else:
        features.append(1)

    forms = soup.find_all("form") if soup else []
    if forms:
        form_risk = -1
        for form in forms:
            action = (form.get("action") or "").strip().lower()
            if action in ("", "about:blank"):
                form_risk = 1
                break
            if domain not in action and not action.startswith("/"):
                form_risk = 0
        features.append(form_risk)
    else:
        features.append(1)

    features.append(1 if "mailto:" in html.lower() else -1)
    features.append(1 if domain not in url else -1)

    if response is not None:
        history_len = len(response.history)
        features.append(1 if history_len > 3 else 0 if history_len > 0 else -1)
    else:
        features.append(1)

    features.append(1 if "onmouseover" in html.lower() else -1)
    features.append(1 if "event.button==2" in html.lower() else -1)
    features.append(1 if "window.open" in html.lower() else -1)
    features.append(1 if soup and soup.find("iframe") else -1)

    age_days = _age_of_domain_days(whois_data)
    features.append(-1 if age_days >= 180 else 1)

    try:
        socket.gethostbyname(domain.split(":")[0])
        features.append(-1)
    except Exception:
        features.append(1)

    traffic_resp = safe_request_get(f"https://www.{full_domain}", timeout=3)
    features.append(1 if traffic_resp and traffic_resp.status_code == 200 else -1)

    features.append(1 if len(anchors) > 50 else 0 if len(anchors) > 10 else -1)
    features.append(0)

    backlinks = [a for a in anchors if full_domain and full_domain in a.get("href", "")]
    features.append(1 if len(backlinks) > 5 else 0 if len(backlinks) > 1 else -1)

    blacklist = ("malwaredomainlist.com", "phishtank.org", "stopbadware.org", "clean-mx.com", "malc0de.com")
    features.append(1 if any(b in url.lower() for b in blacklist) else -1)

    return features
