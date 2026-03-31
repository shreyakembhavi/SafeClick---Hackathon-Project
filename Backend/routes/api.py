from flask import Blueprint, request, jsonify
from flask_cors import CORS
from ml.phishing_model import predict_from_features
from PIL import Image
from services.logic import FALLBACK_OLLAMA_DOWN, generate_response
from services.url_features import extract_features_from_url, FEATURE_NAMES
from werkzeug.utils import secure_filename
import os
import pytesseract
import re
import time
import tldextract

api_bp = Blueprint("api", __name__)
CORS(api_bp)

UPLOAD_FOLDER = "uploads"
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

WHITELIST = {
    "google.com",
    "wikipedia.org",
    "github.com",
    "apple.com",
    "microsoft.com",
    "amazon.com",
}


def validate_llm_output(llm_result) -> str:
    """Normalize LLM payload; always return display-safe text for JSON."""
    if not isinstance(llm_result, dict):
        return FALLBACK_OLLAMA_DOWN
    text = llm_result.get("summary")
    if not isinstance(text, str):
        return FALLBACK_OLLAMA_DOWN
    out = re.sub(r"\s+", " ", text).strip()[:1500]
    return out or FALLBACK_OLLAMA_DOWN


def allowed_image_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def validate_image_content(file_obj) -> bool:
    try:
        image = Image.open(file_obj)
        image.verify()
        file_obj.seek(0)
        return True
    except Exception:
        return False


def check_url_logic(url: str):
    domain_info = tldextract.extract(url)
    full_domain = f"{domain_info.domain}.{domain_info.suffix}"

    if full_domain in WHITELIST:
        time.sleep(3)
        return {
            "url": url,
            "features": dict(zip(FEATURE_NAMES, [-1] * len(FEATURE_NAMES))),
            "prediction": "legitimate",
            "confidence": "100%",
            "llm_report": f"The domain {url} is considered safe.",
        }

    features = extract_features_from_url(url)
    result = predict_from_features(features)
    feature_dict = dict(zip(FEATURE_NAMES, features))
    llm_result = generate_response(url, prediction=result["prediction"])
    llm_summary = validate_llm_output(llm_result)

    return {
        "url": url,
        "features": feature_dict,
        "prediction": result["prediction"],
        "confidence": f"{result['confidence']}%",
        "llm_report": llm_summary,
    }


@api_bp.route("/check_url", methods=["POST"])
def check_url():
    url = request.form.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        result = check_url_logic(url)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/upload_image", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not allowed_image_file(file.filename):
        return jsonify({"error": "Invalid image file type"}), 400
    if not validate_image_content(file):
        return jsonify({"error": "Invalid image content or potential malicious file"}), 400

    timestamp = int(time.time())
    filename = f"{timestamp}_{secure_filename(file.filename)}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        text = pytesseract.image_to_string(Image.open(filepath))
        urls = re.findall(r"https?://[^\s]+", text)

        if not urls:
            return jsonify(
                {
                    "text": text,
                    "urls": [],
                    "message": "No URL found in image.",
                }
            ), 200

        selected_url = urls[0]
        result = check_url_logic(selected_url)
        return jsonify(
            {
                "text": text,
                "urls": urls,
                "selected_url": selected_url,
                **result,
                "message": "Image processed, URL scanned, and results returned",
            }
        ), 200
    except Exception as e:
        return jsonify({"error": f"OCR or URL scan failed: {str(e)}"}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)