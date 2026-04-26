# app.py – Application entry point

from flask import Flask
from config import SECRET_KEY
from routes import main_bp, api_bp

app = Flask(__name__)
app.secret_key = SECRET_KEY

# Register blueprints
app.register_blueprint(main_bp)
app.register_blueprint(api_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
