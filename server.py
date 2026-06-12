# ─────────────────────────────────────────────────────────────────────────────
# ATLAS Backend Server — Python / Flask
# Run: python server.py
# Requires: pip install flask flask-cors anthropic python-dotenv
# ─────────────────────────────────────────────────────────────────────────────

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
from dotenv import load_dotenv

# Load .env file (reads ANTHROPIC_API_KEY)
load_dotenv()

app = Flask(__name__, static_folder="dist")
CORS(app)  # allows the React frontend to call this server

# Anthropic client — reads key from environment variable
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ATLAS running", "language": "Python/Flask"})


# ── Main agent endpoint ───────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    messages = data.get("messages", [])
    tools    = data.get("tools", [])
    system   = data.get("system", "You are ATLAS, a health AI agent. Use tools to get real data before answering.")

    try:
        response = client.messages.create(
            model      = "claude-sonnet-4-20250514",
            max_tokens = 1024,
            system     = system,
            tools      = tools,
            messages   = messages,
        )

        # Convert to JSON-serialisable dict
        return jsonify({
            "id":           response.id,
            "type":         response.type,
            "role":         response.role,
            "content":      [block_to_dict(b) for b in response.content],
            "model":        response.model,
            "stop_reason":  response.stop_reason,
            "usage": {
                "input_tokens":  response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            }
        })

    except anthropic.APIError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def block_to_dict(block):
    """Convert an Anthropic content block to a plain dict."""
    if block.type == "text":
        return {"type": "text", "text": block.text}
    elif block.type == "tool_use":
        return {
            "type":  "tool_use",
            "id":    block.id,
            "name":  block.name,
            "input": block.input,
        }
    return {"type": block.type}


# ── Serve built React app (after npm run build) ───────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print(f"\n✦ ATLAS Python backend running at http://localhost:{port}")
    print(f"  API health: http://localhost:{port}/api/health\n")
    app.run(host="0.0.0.0", port=port, debug=True)
