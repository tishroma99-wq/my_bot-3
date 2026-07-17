from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import database.queries as db
from database.engine import init_db
from moderation.content_checker import auto_moderate_resource
from config import BOT_TOKEN
from aiogram import Bot
from aiogram.types import LabeledPrice
import bcrypt

bot = Bot(token=BOT_TOKEN)

def get_publish_price(count: int) -> int:
    if count == 0:
        return 0
    if count == 1:
        return 25
    return 50

def get_item_price(count: int) -> int:
    if count == 0:
        return 0
    if count == 1:
        return 50
    return 100

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("FastAPI + SQLite started!")
    yield

app = FastAPI(title="TrustGram API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== КАТАЛОГ ==========
@app.get("/api/categories")
async def get_categories():
    categories = await db.get_categories()
    return [dict(c) for c in categories]

@app.get("/api/top-resources")
async def get_top_resources(limit: int = 20):
    resources = await db.get_top_resources(limit)
    return [dict(r) for r in resources]

@app.get("/api/top")
async def get_top(limit: int = 20):
    resources = await db.get_top_resources(limit)
    return [dict(r) for r in resources]

@app.get("/api/catalog")
async def get_catalog(category: str = "", subcategory: str = "", search: str = "", limit: int = 50, kind: str = "resource"):
    resources = await db.get_resources(status="approved", category=category, subcategory=subcategory, search=search, limit=limit, is_item=(kind == "item"))
    return [dict(r) for r in resources]

@app.get("/api/resource/{resource_id}")
async def get_resource(resource_id: int):
    r = await db.get_resource_by_id(resource_id)
    if not r: raise HTTPException(status_code=404, detail="Not found")
    data = dict(r)
    try:
        chat = await bot.get_chat(data["chat_id"])
        data["members_count"] = await bot.get_chat_member_count(data["chat_id"])
        data["photo_url"] = None
    except Exception:
        data["members_count"] = None
    data["reviews"] = [dict(x) for x in await db.get_reviews(resource_id)]
    return data

@app.get("/api/stats")
async def get_stats():
    return await db.get_stats()

# ========== АУТЕНТИФИКАЦИЯ ==========
@app.post("/api/register")
async def register_user(data: dict):
    telegram_id = data.get("telegram_id")
    phone = data.get("phone", "").strip()
    username = data.get("username", "").strip()

    if not telegram_id:
        raise HTTPException(status_code=400, detail="Данные Telegram не найдены. Откройте через бота.")
    if not phone:
        raise HTTPException(status_code=400, detail="Нужно поделиться номером телефона")
    if not username:
        raise HTTPException(status_code=400, detail="Укажите канал/группу/бота для верификации")

    existing = await db.get_user(telegram_id)
    if existing and existing["phone"]:
        raise HTTPException(status_code=409, detail="Этот аккаунт уже верифицирован")

    user_id = await db.verify_user(telegram_id, phone, username)
    return {"success": True, "user_id": user_id}

# ========== ОТЗЫВЫ ==========
@app.post("/api/resource/{resource_id}/review")
async def submit_review(resource_id: int, data: dict):
    rating = data.get("rating")
    text = data.get("text", "").strip()
    
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be integer 1-5")
    
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Review text must be at least 10 characters")
    
    resource = await db.get_resource_by_id(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    review_id = await db.add_review(resource_id, 0, rating, text)
    return {"success": True, "review_id": review_id}

@app.post("/api/resources/submit")
async def submit_resource(data: dict):
    telegram_id = data.get("telegram_id")
    kind = data.get("kind", "resource")  # "resource" | "item"
    category = data.get("category")
    description = (data.get("description") or "").strip()

    if not telegram_id or not category:
        raise HTTPException(status_code=400, detail="Заполните все поля")
    if len(description) < 10:
        raise HTTPException(status_code=400, detail="Описание — минимум 10 символов")

    if kind == "item":
        title = (data.get("title") or "").strip()
        subcategory = (data.get("subcategory") or "").strip()
        price = data.get("price")
        if not title or not subcategory or not price:
            raise HTTPException(status_code=400, detail="Заполните название, подкатегорию и цену")

        user = await db.get_user(telegram_id)
        phone = user["phone"] if user else None
        if not phone:
            raise HTTPException(status_code=400, detail="Сначала пройдите верификацию номера телефона (раздел «Верификация»)")

        status, reason = await auto_moderate_resource(description, "item")
        if status == "rejected":
            raise HTTPException(status_code=400, detail=f"Отклонено модерацией: {reason}")

        seller_username = data.get("seller_username") or ""
        ctx = {"type": "item", "username": seller_username, "title": title, "chat_id": telegram_id,
               "category": category, "subcategory": subcategory, "description": description,
               "price": price, "seller_phone": phone, "social": "none", "auto_status": status}

        count = await db.count_resources(telegram_id, item_only=True)
        price_stars = get_item_price(count)
    else:
        username = (data.get("username") or "").strip()
        if not username:
            raise HTTPException(status_code=400, detail="Укажите @username ресурса")
        try:
            chat = await bot.get_chat(f"@{username}")
        except Exception:
            raise HTTPException(status_code=404, detail="Ресурс не найден в Telegram")

        rtype = "channel" if chat.type == "channel" else "group" if chat.type in ("supergroup", "group") else "bot"
        status, reason = await auto_moderate_resource(description, rtype)
        if status == "rejected":
            raise HTTPException(status_code=400, detail=f"Отклонено модерацией: {reason}")

        ctx = {"type": rtype, "username": username, "title": chat.title or username, "chat_id": chat.id,
               "category": category, "description": description, "social": "none", "auto_status": status}
        count = await db.count_resources(telegram_id, item_only=False)
        price_stars = get_publish_price(count)

    if price_stars == 0:
        await db.create_resource(
            owner_id=telegram_id, resource_type=ctx["type"], title=ctx["title"], username=ctx.get("username", ""),
            chat_id=ctx["chat_id"], category=category, description=description, social_link="none", status=ctx["auto_status"],
            subcategory=ctx.get("subcategory", ""), price=ctx.get("price"), seller_phone=ctx.get("seller_phone", "")
        )
        return {"success": True, "free": True}

    await db.set_context(telegram_id, "awaiting_payment", ctx)
    label = "Публикация товара" if kind == "item" else "Публикация ресурса"
    try:
        await bot.send_invoice(chat_id=telegram_id, title=label, provider_token="",
                                description=f"Размещение «{ctx['title']}» в TrustGram",
                                payload=f"publish_{telegram_id}", currency="XTR",
                                prices=[LabeledPrice(label=label, amount=price_stars)])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось отправить счёт. Сначала напишите /start вашему боту в Telegram, затем попробуйте снова. ({e})")
    return {"success": True, "free": False, "price": price_stars}

@app.post("/api/plans/buy")
async def buy_plan(data: dict):
    telegram_id = data.get("telegram_id")
    plan = data.get("plan")
    price = data.get("price", 500)
    label = data.get("label", "Тариф PRO")
    if not telegram_id or not plan:
        raise HTTPException(status_code=400, detail="Недостаточно данных")
    try:
        await bot.send_invoice(
            chat_id=telegram_id, title=label,
            description=f"Подписка {label} в TrustGram на 1 месяц",
            payload=f"plan_{plan}_{telegram_id}", currency="XTR",
            prices=[LabeledPrice(label=label, amount=price)]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Сначала напишите /start боту: {e}")
    return {"success": True}

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)