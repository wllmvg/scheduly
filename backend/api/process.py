import io

from flask import Flask
from flask import request
from flask import jsonify
from flask import send_file
from flask_cors import CORS

from processor.scheduly import procesar_pdf

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)


@app.route("/", methods=["GET"])
def health():
    return jsonify(
        {
            "success": True,
            "message": "Scheduly API running"
        }
    )


@app.route("/api/process", methods=["POST"])
def process_pdf():

    if "file" not in request.files:
        return jsonify(
            {
                "success": False,
                "message": "No file provided"
            }
        ), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify(
            {
                "success": False,
                "message": "Empty filename"
            }
        ), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify(
            {
                "success": False,
                "message": "Only PDF files allowed"
            }
        ), 400

    try:

        pdf_bytes = io.BytesIO(file.read())

        ics_content = procesar_pdf(pdf_bytes)

        return send_file(
            io.BytesIO(
                ics_content.encode("utf-8")
            ),
            mimetype="text/calendar",
            as_attachment=True,
            download_name="horario.ics"
        )

    except Exception as e:

        return jsonify(
            {
                "success": False,
                "message": str(e)
            }
        ), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )