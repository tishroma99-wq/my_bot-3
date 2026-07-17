import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from database.engine import init_db
from config import BOT_TOKEN
from handlers import start, registration, catalog, admin

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("trustgram")

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

dp.include_router(start.router)
dp.include_router(registration.router)
dp.include_router(catalog.router)
dp.include_router(admin.router)

async def main():
    await init_db()
    me = await bot.get_me()
    logger.info(f"✅ Бот запущен как @{me.username}")
    while True:
        try:
            await dp.start_polling(bot)
        except Exception:
            logger.exception("Бот упал, перезапуск через 5 секунд")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())