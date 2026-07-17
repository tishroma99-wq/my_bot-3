# handlers/catalog.py
from aiogram import Router, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, InlineQueryResultArticle, InputTextMessageContent
import database.queries as db
from config import WEBAPP_URL

router = Router()

RESOURCE_TYPES = {"channel": "📣 Канал", "group": "👥 Группа", "bot": "🤖 Бот"}
CATEGORIES = {"shop": "🛍 Товары", "tech": "📱 Технологии", "news": "📰 Новости", "edu": "🎓 Образование", "game": "🎮 Игры", "finance": "💰 Финансы", "art": "🎨 Искусство", "chat": "👥 Общение", "food": "🍔 Еда", "beauty": "💄 Красота", "home": "🏠 Дом", "services": "🛠 Услуги", "other": "📦 Другое"}

def rget(row, key, default=None):
    try: return row[key]
    except: return default

@router.callback_query(lambda c: c.data == "my_resources")
async def cb_my_resources(callback: types.CallbackQuery):
    await callback.answer()
    resources = await db.get_user_resources(callback.from_user.id)
    
    if not resources:
        await callback.message.edit_text(
            "👤 You have no resources yet.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="➕ Register", callback_data="register_resource")],
                [InlineKeyboardButton(text="« Back", callback_data="start")]
            ])
        )
        return
    
    text = "👤 <b>Your Resources:</b>\n\n"
    for r in resources:
        status_emoji = {"approved": "✅", "pending": "⏳", "blocked": "❌"}.get(r['status'], "❓")
        text += f"{status_emoji} <b>{r['title']}</b>\n"
        text += f"   📌 {RESOURCE_TYPES.get(r['resource_type'], 'Unknown')}\n"
        text += f"   ⭐ {r['public_rating']:.1f} | 📝 {r['total_reviews']} reviews\n\n"
    
    await callback.message.edit_text(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Open Catalog", web_app={"url": f"{WEBAPP_URL}/index.html"})],
        [InlineKeyboardButton(text="« Back", callback_data="start")]
    ]))

@router.callback_query(lambda c: c.data == "top_resources")
async def cb_top(callback: types.CallbackQuery):
    await callback.answer()
    resources = await db.get_top_resources(10)
    
    if not resources:
        await callback.message.edit_text("🏆 No rated resources yet.")
        return
    
    medals = {0: "🥇", 1: "🥈", 2: "🥉"}
    text = "🏆 <b>Top 10 Resources:</b>\n\n"
    for i, r in enumerate(resources):
        text += f"{medals.get(i, f'{i+1}.')} {r['title']} — ⭐{r['public_rating']:.1f}\n"
    
    await callback.message.edit_text(text)

@router.callback_query(lambda c: c.data == "start")
async def cb_start(callback: types.CallbackQuery):
    await callback.answer()
    from handlers.start import cmd_start
    await cmd_start(callback.message)

@router.inline_query()
async def inline_search(query: types.InlineQuery):
    q = query.query.strip()
    resources = await db.search_resources(q) if q else await db.get_top_resources(10)
    
    results = []
    for r in resources[:20]:
        results.append(InlineQueryResultArticle(
            id=str(r['id']),
            title=r['title'],
            description=f"⭐{r['public_rating']:.1f} • {r['total_reviews']} reviews",
            input_message_content=InputTextMessageContent(
                message_text=f"📢 <b>{r['title']}</b>\n⭐ {r['public_rating']:.1f}\n🔗 @{r['username']}"
            )
        ))
    
    await query.answer(results, cache_time=10)