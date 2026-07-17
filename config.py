# config.py
import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://tishroma99-wq.github.io/web-4")
DATABASE_PATH = os.getenv("DATABASE_PATH", "trustgram.db")
API_URL = os.getenv("API_URL", "http://localhost:8000")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN не найден. Проверь файл .env")
