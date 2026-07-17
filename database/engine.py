import aiosqlite
from database.models import SCHEMA
from config import DATABASE_PATH

CATEGORIES_SEED = [
    ("shop", "Товары", "Shopping", "🛍", 12500, 1),
    ("tech", "Технологии", "Technology", "📱", 9800, 2),
    ("news", "Новости", "News", "📰", 21000, 3),
    ("edu", "Образование", "Education", "🎓", 7500, 4),
    ("game", "Игры", "Gaming", "🎮", 32000, 5),
    ("finance", "Финансы", "Finance", "💰", 18000, 6),
    ("health", "Здоровье", "Health", "❤️", 5600, 7),
    ("travel", "Путешествия", "Travel", "✈️", 8900, 8),
    ("music", "Музыка", "Music", "🎵", 15000, 9),
    ("sport", "Спорт", "Sports", "⚽", 22000, 10),
    ("auto", "Авто", "Auto", "🚗", 11000, 11),
    ("cinema", "Кино", "Cinema", "🎬", 17000, 12),
]

async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db

async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.executescript(SCHEMA)
        # Seed categories
        for cat in CATEGORIES_SEED:
            await db.execute(
                """INSERT OR IGNORE INTO categories (slug, name_ru, name_en, icon, views, sort_order) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                cat
            )
        await db.commit()
    print("Database initialized with categories")