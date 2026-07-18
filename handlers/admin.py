from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import database.queries as db
from config import ADMIN_IDS

router = Router()

def is_admin(uid): return uid in ADMIN_IDS

def main_kb():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⏳ На модерации", callback_data="adm_pending"),
         InlineKeyboardButton(text="👥 Пользователи", callback_data="adm_users_0")],
        [InlineKeyboardButton(text="📊 Статистика", callback_data="adm_stats"),
         InlineKeyboardButton(text="🔄 Обновить", callback_data="adm_refresh")]
    ])

async def send_panel(target, edit=False):
    stats = await db.get_stats()
    text = (
        f"🛡️ <b>Админ-панель TrustGram</b>\n\n"
        f"📦 Ресурсов: <b>{stats.get('total_resources',0)}</b>\n"
        f"👥 Пользователей: <b>{stats.get('total_users',0)}</b>\n"
        f"💬 Отзывов: <b>{stats.get('total_reviews',0)}</b>\n"
        f"⏳ На модерации: <b>{stats.get('pending',0)}</b>"
    )
    fn = target.edit_text if edit else target.answer
    await fn(text, reply_markup=main_kb())

@router.message(Command("admin"))
@router.message(F.text.lower().in_({"/admin", "/admin@trusstgram_bot"}))
async def cmd_admin(msg: types.Message):
    if not is_admin(msg.from_user.id):
        await msg.answer(f"⛔ Нет доступа. Ваш ID: <code>{msg.from_user.id}</code>"); return
    await send_panel(msg)

@router.callback_query(F.data == "adm_refresh")
async def cb_refresh(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    await send_panel(cb.message, edit=True); await cb.answer("✅ Обновлено")

@router.callback_query(F.data == "adm_stats")
async def cb_stats(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    stats = await db.get_stats()
    text = (f"📊 <b>Подробная статистика</b>\n\n"
            f"📦 Всего ресурсов: <b>{stats.get('total_resources',0)}</b>\n"
            f"👥 Пользователей: <b>{stats.get('total_users',0)}</b>\n"
            f"💬 Отзывов: <b>{stats.get('total_reviews',0)}</b>\n"
            f"⏳ На модерации: <b>{stats.get('pending',0)}</b>")
    back = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="« Назад", callback_data="adm_refresh")]])
    await cb.message.edit_text(text, reply_markup=back); await cb.answer()

@router.callback_query(F.data == "adm_pending")
async def cb_pending(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    pending = await db.get_pending_resources()
    if not pending:
        back = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="« Назад", callback_data="adm_refresh")]])
        await cb.message.edit_text("✅ Нет ресурсов на модерации", reply_markup=back); return await cb.answer()
    rows = []
    for p in pending[:10]:
        rows.append([
            InlineKeyboardButton(text=f"✅ {p['title'][:18]}", callback_data=f"adm_ok_{p['id']}"),
            InlineKeyboardButton(text="❌", callback_data=f"adm_rej_{p['id']}")
        ])
    rows.append([InlineKeyboardButton(text="« Назад", callback_data="adm_refresh")])
    text = f"⏳ <b>На модерации ({len(pending)}):</b>\n\n" + "\n".join(
        f"{'📣' if p['resource_type']=='channel' else '👥' if p['resource_type']=='group' else '🤖'} <b>{p['title']}</b> — @{p['username'] or '?'}" for p in pending[:10])
    await cb.message.edit_text(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows)); await cb.answer()

@router.callback_query(F.data.startswith("adm_users_"))
async def cb_users(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    offset = int(cb.data.split("_")[-1])
    users = await db.get_all_users(limit=10)
    if not users:
        back = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="« Назад", callback_data="adm_refresh")]])
        await cb.message.edit_text("👥 Нет пользователей", reply_markup=back); return await cb.answer()
    rows = []
    for u in users:
        name = u['full_name'] or u['username'] or f"ID {u['telegram_id']}"
        rows.append([InlineKeyboardButton(text=f"👤 {name[:25]}", callback_data=f"adm_user_{u['telegram_id']}")])
    rows.append([InlineKeyboardButton(text="« Назад", callback_data="adm_refresh")])
    text = f"👥 <b>Пользователи ({len(users)}):</b>"
    await cb.message.edit_text(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows)); await cb.answer()

@router.callback_query(F.data.startswith("adm_user_"))
async def cb_user_detail(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    uid = int(cb.data.split("_")[-1])
    user = await db.get_user(uid)
    resources = await db.get_user_resources(uid)
    if not user:
        await cb.answer("Пользователь не найден"); return
    phone = user['phone'] or 'не указан'
    text = (f"👤 <b>{user['full_name'] or 'Без имени'}</b>\n"
            f"🆔 ID: <code>{user['telegram_id']}</code>\n"
            f"📱 Телефон: {phone}\n"
            f"🔗 @{user['username'] or '—'}\n"
            f"📦 Ресурсов: <b>{len(resources)}</b>\n\n")
    if resources:
        text += "<b>Ресурсы:</b>\n" + "\n".join(
            f"{'📣' if r['resource_type']=='channel' else '👥' if r['resource_type']=='group' else '🤖'} {r['title']} — {r['status']}" for r in resources[:5])
    rows = [
        [InlineKeyboardButton(text="🚫 Заблокировать", callback_data=f"adm_ban_{uid}")],
        [InlineKeyboardButton(text="« Пользователи", callback_data="adm_users_0")]
    ]
    await cb.message.edit_text(text, reply_markup=InlineKeyboardMarkup(inline_keyboard=rows)); await cb.answer()

@router.callback_query(F.data.startswith("adm_ok_"))
async def cb_approve(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    rid = int(cb.data.split("_")[-1])
    await db.update_resource(rid, status="approved")
    await db.log_admin_action(cb.from_user.id, "approve", rid)
    await cb.answer(f"✅ Ресурс #{rid} одобрен!")
    await cb_pending(cb)

@router.callback_query(F.data.startswith("adm_rej_"))
async def cb_reject(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    rid = int(cb.data.split("_")[-1])
    await db.update_resource(rid, status="blocked", rejection_reason="Нарушение правил")
    await db.log_admin_action(cb.from_user.id, "reject", rid)
    await cb.answer(f"❌ Ресурс #{rid} отклонён")
    await cb_pending(cb)

@router.callback_query(F.data.startswith("adm_ban_"))
async def cb_ban(cb: types.CallbackQuery):
    if not is_admin(cb.from_user.id): return await cb.answer()
    await cb.answer("⚠️ Функция в разработке")
