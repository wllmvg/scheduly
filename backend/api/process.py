import io
import os

import requests as http

from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS

from scheduly_processor.scheduly import procesar_pdf

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")


def increment_counter():
    try:
        res = http.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_uses",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            json={}
        )
        print("INCREMENT STATUS:", res.status_code, res.text)
    except Exception as e:
        print("INCREMENT ERROR:", str(e))


@app.route("/", methods=["GET"])
def health():
    return jsonify({"success": True, "message": "Scheduly API running"})


@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"}), 200


@app.route("/api/stats", methods=["GET"])
def stats():
    try:
        res = http.get(
            f"{SUPABASE_URL}/rest/v1/stats?select=count&id=eq.1",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
        )
        data = res.json()
        return jsonify({"count": data[0]["count"] if data else 0})
    except Exception as e:
        return jsonify({"count": 0, "error": str(e)})


@app.route("/api/process", methods=["POST"])
def process_pdf():

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "message": "Empty filename"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "message": "Only PDF files allowed"}), 400

    try:
        pdf_bytes = io.BytesIO(file.read())
        ics_content = procesar_pdf(pdf_bytes)
        increment_counter()

        return jsonify({
            "success": True,
            "ics_content": ics_content
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)