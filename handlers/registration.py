# handlers/registration.py
import uuid
from aiogram import Router, types, F
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, LabeledPrice
import database.queries as db
from moderation.content_checker import auto_moderate_resource

router = Router()

CATEGORIES = {
    "shop": "🛍 Shopping", "tech": "📱 Technology", "news": "📰 News",
    "edu": "🎓 Education", "game": "🎮 Gaming", "finance": "💰 Finance",
    "art": "🎨 Art", "chat": "👥 Community", "food": "🍔 Food",
    "beauty": "💄 Beauty", "home": "🏠 Home", "services": "🛠 Services", "other": "📦 Other"
}
RESOURCE_TYPES = {"channel": "📣 Канал", "group": "👥 Группа", "bot": "🤖 Бот"}

@router.callback_query(F.data == "register_resource")
async def cb_register(callback: types.CallbackQuery):
    await callback.answer()
    await callback.message.edit_text(
        "➕ <b>Регистрация ресурса</b>\n\n"
        "1️⃣ <b>Через пересылку:</b> добавьте бота админом в канал/группу и перешлите любое сообщение\n\n"
        "2️⃣ <b>Через ссылку:</b> отправьте @username или t.me/username\n\n"
        "Бот сам определит тип ресурса.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="« Назад", callback_data="start")]
        ])
    )

@router.message(F.forward_from_chat)
async def handle_forward(message: types.Message):
    chat = message.forward_from_chat
    user_id = message.from_user.id
    
    if chat.type not in ["channel", "supergroup"]:
        await message.answer("❌ Можно регистрировать только каналы и группы.")
        return
    
    rtype = "channel" if chat.type == "channel" else "group"
    
    existing = await db.get_resource_by_chat_id(chat.id)
    if existing:
        await message.answer("⚠️ Этот ресурс уже зарегистрирован.")
        return
    
    await db.set_context(user_id, "registering", {
        "type": rtype, "username": chat.username, "title": chat.title, "chat_id": chat.id
    })
    
    await message.answer(
        f"✅ <b>Ресурс найден!</b>\n\n"
        f"📌 Тип: {RESOURCE_TYPES.get(rtype, rtype)}\n"
        f"📢 Название: {chat.title}\n"
        f"🔗 @{chat.username}\n\n"
        f"Теперь отправьте <b>описание</b> и <b>ссылку на соцсеть</b> одним сообщением:\n\n"
        f"<code>Описание вашего ресурса\nhttps://instagram.com/username</code>"
    )

@router.message(F.text.regexp(r'^@[a-zA-Z0-9_]+$|^https?://t\.me/[a-zA-Z0-9_]+$'))
async def handle_link(message: types.Message):
    text = message.text.strip()
    username = text.replace("@", "").replace("https://t.me/", "").replace("http://t.me/", "")
    user_id = message.from_user.id
    
    try:
        chat = await message.bot.get_chat(f"@{username}")
    except:
        await message.answer("❌ Ресурс не найден.")
        return
    
    rtype = "channel" if chat.type == "channel" else "group" if chat.type in ["supergroup", "group"] else "bot"
    
    await db.set_context(user_id, "registering", {
        "type": rtype, "username": username, "title": chat.title or username, "chat_id": chat.id
    })
    
    await message.answer(
        f"✅ <b>Resource detected!</b>\n\n"
        f"📌 Type: {RESOURCE_TYPES.get(rtype, rtype)}\n"
        f"📢 Title: {chat.title or username}\n"
        f"🔗 @{username}\n\n"
        f"Now send the <b>description</b> and <b>social link</b> in one message."
    )

@router.message(F.text)
async def handle_text(message: types.Message):
    if message.text.startswith("/"):
        return
    
    user_id = message.from_user.id
    ctx = await db.get_context(user_id)
    
    if ctx and ctx.get("action") == "registering" and "description" not in ctx:
        lines = message.text.strip().split("\n")
        desc = lines[0].strip() if lines else ""
        social = lines[1].strip() if len(lines) > 1 else "none"
        
        if len(desc) < 10:
            await message.answer("❌ Описание должно быть не короче 10 символов.")
            return
        
        rtype = ctx.get("type", "channel")
        status, reason = await auto_moderate_resource(desc, rtype)
        
        ctx["description"] = desc
        ctx["social"] = social
        ctx["auto_status"] = status
        await db.set_context(user_id, "registering", ctx)
        
        if status == "blocked":
            await message.answer(f"❌ <b>Resource rejected</b>\n\nПричина: {reason}")
            await db.clear_context(user_id)
            return
        
        cats = list(CATEGORIES.items())
        buttons = []
        for i in range(0, len(cats), 2):
            row = []
            for j in range(2):
                if i + j < len(cats):
                    cid, cname = cats[i + j]
                    row.append(InlineKeyboardButton(text=cname, callback_data=f"regcat_{cid}"))
            buttons.append(row)
        buttons.append([InlineKeyboardButton(text="« Cancel", callback_data="cancel_reg")])
        
        await message.answer("📂 Выберите <b>категорию</b>:", reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons))
        return
    
    if ctx and ctx.get("action") == "reviewing":
        if "rating" not in ctx:
            try:
                r = int(message.text)
                if 1 <= r <= 5:
                    ctx["rating"] = r
                    await db.set_context(user_id, "reviewing", ctx)
                    await message.answer(f"⭐ Оценка {r}/5 сохранена! Теперь напишите текст отзыва.")
                    return
            except:
                pass
            await message.answer("❌ Отправьте число от 1 до 5.")
            return
        
        if "rating" in ctx:
            rid, rating, text = ctx["resource_id"], ctx["rating"], message.text
            await db.add_review(rid, user_id, rating, text)
            await db.clear_context(user_id)
            await message.answer(f"✅ <b>Review published!</b>\n⭐ {'⭐'*rating}\n💬 {text[:300]}\n\nСпасибо! 🙏")
            return

def get_publish_price(count: int) -> int:
    """1-я публикация — бесплатно, 2-я — 25⭐, 3-я и далее — 50⭐"""
    if count == 0:
        return 0
    if count == 1:
        return 25
    return 50

@router.callback_query(F.data.startswith("regcat_"))
async def cb_regcat(callback: types.CallbackQuery):
    await callback.answer()
    cat_id = callback.data.replace("regcat_", "")
    ctx = await db.get_context(callback.from_user.id)

    if not ctx or ctx.get("action") != "registering":
        await callback.message.edit_text("❌ Сессия истекла.")
        return

    ctx["category"] = cat_id
    count = await db.count_resources(callback.from_user.id)
    price = get_publish_price(count)

    if price == 0:
        await _finish_registration(callback.from_user.id, ctx, callback.message)
        return

    await db.set_context(callback.from_user.id, "awaiting_payment", ctx)
    await callback.message.bot.send_invoice(
        chat_id=callback.from_user.id,
        title="Публикация ресурса",
        description=f"Размещение «{ctx.get('title')}» в каталоге TrustGram",
        payload=f"publish_{callback.from_user.id}",
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label="Публикация ресурса", amount=price)],
    )
    await callback.message.edit_text(f"💫 Это ваша {count+1}-я публикация — стоимость {price}⭐.\nОплатите счёт выше, чтобы завершить размещение.")

async def _finish_registration(user_id, ctx, message):
    await db.create_resource(
        owner_id=user_id,
        resource_type=ctx.get("type", "channel"),
        title=ctx.get("title", "Без названия"),
        username=ctx.get("username"),
        chat_id=ctx.get("chat_id"),
        category=ctx.get("category"),
        description=ctx.get("description", ""),
        social_link=ctx.get("social", ""),
        status=ctx.get("auto_status", "pending"),
        subcategory=ctx.get("subcategory", ""),
        price=ctx.get("price"),
        seller_phone=ctx.get("seller_phone", "")
    )
    await db.clear_context(user_id)
    status_text = "одобрен ✅" if ctx.get("auto_status") == "approved" else "на модерации ⏳"
    await message.answer(
        f"✅ <b>Ресурс зарегистрирован!</b>\n\n"
        f"📢 {ctx.get('title')}\n"
        f"📂 {CATEGORIES.get(ctx.get('category'), 'Другое')}\n"
        f"📌 Статус: {status_text}\n\n"
        f"Команда /my — управление вашими ресурсами.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="👤 Мои ресурсы", callback_data="my_resources")],
            [InlineKeyboardButton(text="« Главное меню", callback_data="start")]
        ])
    )

@router.pre_checkout_query()
async def process_pre_checkout(pre_checkout_q: types.PreCheckoutQuery):
    await pre_checkout_q.answer(ok=True)

@router.message(F.successful_payment)
async def process_successful_payment(message: types.Message):
    ctx = await db.get_context(message.from_user.id)
    if not ctx or ctx.get("action") != "awaiting_payment":
        await message.answer("✅ Оплата получена, но данные публикации не найдены. Напишите в поддержку.")
        return
    await _finish_registration(message.from_user.id, ctx, message)

@router.callback_query(F.data == "cancel_reg")
async def cb_cancel_reg(callback: types.CallbackQuery):
    await callback.answer()
    await db.clear_context(callback.from_user.id)
    await callback.message.edit_text("❌ Registration cancelled.")