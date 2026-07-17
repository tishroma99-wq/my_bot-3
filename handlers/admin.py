# handlers/admin.py
from aiogram import Router, types
from aiogram.filters import Command
import database.queries as db
from config import ADMIN_IDS

router = Router()

def is_admin(user_id):
    return user_id in ADMIN_IDS

@router.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if not is_admin(message.from_user.id):
        await message.answer(f"⛔ Доступ только для администратора.\nВаш ID: {message.from_user.id}")
        return
    
    stats = await db.get_stats()
    pending = await db.get_pending_resources()
    
    text = (
        f"🔐 <b>Admin Panel</b>\n\n"
        f"📊 Resources: {stats['total_resources']}\n"
        f"👥 Users: {stats['total_users']}\n"
        f"📝 Reviews: {stats['total_reviews']}\n"
        f"⏳ Pending: {stats['pending']}\n\n"
    )
    
    if pending:
        text += "<b>Pending:</b>\n"
        for p in pending[:5]:
            text += f"• {p['title']} — /approve_{p['id']} | /reject_{p['id']}\n"
    
    await message.answer(text)

@router.message(Command("approve"))
async def cmd_approve(message: types.Message):
    if not is_admin(message.from_user.id):
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /approve [id_ресурса]")
        return
    
    try:
        rid = int(args[1])
        await db.update_resource(rid, status="approved")
        await db.log_admin_action(message.from_user.id, "approve", rid)
        await message.answer(f"✅ Ресурс #{rid} одобрен!")
    except:
        await message.answer("❌ Ошибка.")

@router.message(Command("reject"))
async def cmd_reject(message: types.Message):
    if not is_admin(message.from_user.id):
        return
    
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Использование: /reject [id_ресурса]")
        return
    
    try:
        rid = int(args[1])
        reason = " ".join(args[2:]) if len(args) > 2 else "Нарушение правил"
        await db.update_resource(rid, status="blocked", rejection_reason=reason)
        await db.log_admin_action(message.from_user.id, "reject", rid, reason)
        await message.answer(f"❌ Ресурс #{rid} отклонён.")
    except:
        await message.answer("❌ Ошибка.")