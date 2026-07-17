from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import database.queries as db
from config import WEBAPP_URL

router = Router()

TXT = {
    'ru': {'search':'🔍 Поиск','register':'➕ Регистрация ресурса','my':'👤 Мои ресурсы','catalog':'📊 Каталог','top':'🏆 ТОП','help':'❓ Помощь','welcome':'🌟 <b>TrustGram Marketplace</b>\n\nМаркетплейс Telegram-ресурсов с честными отзывами.\n\nВыберите действие:','choose_lang':'🌐 Выберите язык / Choose language:'},
    'en': {'search':'🔍 Search','register':'➕ Register resource','my':'👤 My resources','catalog':'📊 Catalog','top':'🏆 Top','help':'❓ Help','welcome':'🌟 <b>TrustGram Marketplace</b>\n\nMarketplace of Telegram resources with honest reviews.\n\nChoose an action:','choose_lang':'🌐 Выберите язык / Choose language:'}
}

def main_menu(lang='ru'):
    t = TXT.get(lang, TXT['ru'])
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t['search'], switch_inline_query_current_chat="")],
        [InlineKeyboardButton(text=t['register'], callback_data="register_resource")],
        [InlineKeyboardButton(text=t['my'], callback_data="my_resources")],
        [InlineKeyboardButton(text=t['catalog'], web_app={"url": f"{WEBAPP_URL}/index.html?lang={lang}"})],
        [InlineKeyboardButton(text="🛒 Маркетплейс" if lang == 'ru' else "🛒 Marketplace", web_app={"url": f"{WEBAPP_URL}/index.html?lang={lang}&page=market"})],
        [InlineKeyboardButton(text=t['top'], callback_data="top_resources")],
        [InlineKeyboardButton(text=t['help'], callback_data="help")],
        [InlineKeyboardButton(text="🌐 RU/EN", callback_data="switch_lang")],
    ])

@router.message(Command("language"))
async def cmd_language(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru"), InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en")]])
    await message.answer(TXT['ru']['choose_lang'], reply_markup=kb)

@router.callback_query(lambda c: c.data in ("lang_ru", "lang_en"))
async def set_language(callback: types.CallbackQuery):
    lang = callback.data.split("_")[1]
    await db.set_user_lang(callback.from_user.id, lang)
    await callback.answer("✅")
    await callback.message.answer(TXT[lang]['welcome'], reply_markup=main_menu(lang))

@router.callback_query(lambda c: c.data == "switch_lang")
async def switch_lang(callback: types.CallbackQuery):
    user = await db.get_user(callback.from_user.id)
    cur = (user["lang"] if user else "ru") or "ru"
    new_lang = "en" if cur == "ru" else "ru"
    await db.set_user_lang(callback.from_user.id, new_lang)
    await callback.answer("✅ RU" if new_lang == "ru" else "✅ EN")
    await callback.message.edit_text(TXT[new_lang]['welcome'], reply_markup=main_menu(new_lang))

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    user = message.from_user
    await db.register_user(user.id, user.username, user.full_name)
    args = message.text.split()
    
    if len(args) > 1 and args[1].startswith("review_"):
        code = args[1].replace("review_", "")
        link = await db.get_link_by_code(code)
        if not link: await message.answer("❌ Недействительная ссылка."); return
        resource = await db.get_resource_by_id(link['resource_id'])
        if not resource: await message.answer("❌ Ресурс не найден."); return
        await db.set_context(user.id, "reviewing", {"resource_id": resource['id'], "title": resource['title']})
        await message.answer(f"📝 <b>Отзыв о:</b>\n«{resource['title']}»\n\nОтправьте оценку от 1 до 5 ⭐")
        return
    
    await message.answer("🌟 <b>TrustGram Marketplace</b>\n\nМаркетплейс Telegram-ресурсов с честными отзывами.\n\nВыберите действие:", reply_markup=main_menu())

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer("❓ <b>Помощь</b>\n\n/start — Главное меню\n/my — Мои ресурсы\n/top — ТОП\n\n📱 Каталог доступен в WebApp!")