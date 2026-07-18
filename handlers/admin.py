from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import database.queries as db
from config import ADMIN_IDS

router = Router()

def is_admin(uid): return uid in ADMIN_IDS

def admin_kb(pending):
    rows = []
    for p in pending[:8]:
        rows.append([
            InlineKeyboardButton(text=f"✅ {p['title'][:20]}", callback_data=f"adm_ok_{p['id']}"),
            InlineKeyboardButton(text="❌", callback_data=f"adm_rej_{p['id']}")
        ])
    rows.append([InlineKeyboardButton(text="🔄 Обновить", callback_data="adm_refresh")])
    return InlineKeyboardMarkup(inline_keyboard=rows)

async def send_admin_panel(target, edit=False):
    stats = await db.get_stats()
    pending = await db.get_pending_resources()
    text = (
        f"🛡️ <b>Админ-панель TrustGram</b>\n\n"
        f"📦 Ресурсов: <b>{stats.get('total_resources', 0)}</b>\n"
        f"👥 Пользователей: <b>{stats.get('total_users', 0)}</b>\n"
        f"💬 Отзывов: <b>{stats.get('total_reviews', 0)}</b>\n"
        f"⏳ На модерации: <b>{stats.get('pending', 0)}</b>\n"
    )
    if pending:
        text += "\n<b>Ожидают проверки:</b>"
    kb = admin_kb(pending)
    if edit:
        await target.edit_text(text, reply_markup=kb)
    else:
        await target.answer(text, reply_markup=kb)

@router.message(Command("admin"))
@router.message(F.text.lower().in_({"/admin", "/admin@trusstgram_bot"}))
async def cmd_admin(message: types.Message):
    if not is_admin(message.from_user.id):
        await message.answer(f"⛔ Нет доступа. Ваш ID: <code>{message.from_user.id}</code>")
        return
    await send_admin_panel(message)

@router.callback_query(F.data == "adm_refresh")
async def cb_refresh(callback: types.CallbackQuery):
    if not is_admin(callback.from_user.id): return await callback.answer()
    await send_admin_panel(callback.message, edit=True)
    await callback.answer("Обновлено")

@router.callback_query(F.data.startswith("adm_ok_"))
async def cb_approve(callback: types.CallbackQuery):
    if not is_admin(callback.from_user.id): return await callback.answer()
    rid = int(callback.data.split("_")[-1])
    await db.update_resource(rid, status="approved")
    await db.log_admin_action(callback.from_user.id, "approve", rid)
    await callback.answer(f"✅ Ресурс #{rid} одобрен!")
    await send_admin_panel(callback.message, edit=True)

@router.callback_query(F.data.startswith("adm_rej_"))
async def cb_reject(callback: types.CallbackQuery):
    if not is_admin(callback.from_user.id): return await callback.answer()
    rid = int(callback.data.split("_")[-1])
    await db.update_resource(rid, status="blocked", rejection_reason="Нарушение правил")
    await db.log_admin_action(callback.from_user.id, "reject", rid)
    await callback.answer(f"❌ Ресурс #{rid} отклонён")
    await send_admin_panel(callback.message, edit=True)

@router.message(Command("approve"))
async def cmd_approve(message: types.Message):
    if not is_admin(message.from_user.id): return
    args = message.text.split()
    if len(args) < 2: await message.answer("Использование: /approve [id]"); return
    try:
        rid = int(args[1])
        await db.update_resource(rid, status="approved")
        await message.answer(f"✅ Ресурс #{rid} одобрен!")
    except: await message.answer("❌ Ошибка")

@router.message(Command("reject"))
async def cmd_reject(message: types.Message):
    if not is_admin(message.from_user.id): return
    args = message.text.split()
    if len(args) < 2: await message.answer("Использование: /reject [id] [причина]"); return
    try:
        rid = int(args[1])
        reason = " ".join(args[2:]) if len(args) > 2 else "Нарушение правил"
        await db.update_resource(rid, status="blocked", rejection_reason=reason)
        await message.answer(f"❌ Ресурс #{rid} отклонён. Причина: {reason}")
    except: await message.answer("❌ Ошибка")
