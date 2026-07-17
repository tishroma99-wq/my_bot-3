import aiosqlite
import json
from datetime import datetime
from config import DATABASE_PATH

def rget(row, key, default=None):
    try: return row[key]
    except: return default

async def register_user(telegram_id, username, full_name):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("INSERT OR IGNORE INTO users (telegram_id, username, full_name) VALUES (?,?,?)", (telegram_id, username, full_name))
        await db.commit()

async def get_user(telegram_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,))
        return await c.fetchone()

async def set_user_lang(telegram_id, lang):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("UPDATE users SET lang=? WHERE telegram_id=?", (lang, telegram_id))
        await db.commit()

async def verify_user(telegram_id, phone, username):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "UPDATE users SET phone=?, verified_resource=? WHERE telegram_id=?",
            (phone, username, telegram_id)
        )
        await db.commit()
        return telegram_id

async def get_user_by_email(email):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM users WHERE email=?", (email,))
        return await c.fetchone()

async def create_user(email, password_hash):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        c = await db.execute("INSERT INTO users (email, password_hash) VALUES (?,?)", (email, password_hash))
        await db.commit()
        return c.lastrowid

async def count_resources(owner_id, item_only=False):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        if item_only:
            c = await db.execute("SELECT COUNT(*) FROM resources WHERE owner_id=? AND resource_type='item'", (owner_id,))
        else:
            c = await db.execute("SELECT COUNT(*) FROM resources WHERE owner_id=? AND resource_type!='item'", (owner_id,))
        row = await c.fetchone()
        return row[0] if row else 0

async def create_resource(owner_id, resource_type, title, username, chat_id, category, description, social_link="", status="pending", subcategory="", price=None, seller_phone=""):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        c = await db.execute("INSERT INTO resources (owner_id,resource_type,title,username,chat_id,category,description,social_link,status,subcategory,price,seller_phone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", (owner_id,resource_type,title,username,chat_id,category,description,social_link,status,subcategory,price,seller_phone))
        await db.commit()
        return c.lastrowid

async def get_resources(status="approved", category="", search="", limit=50, is_item=None, subcategory=""):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        q = "SELECT * FROM resources WHERE status=?"
        p = [status]
        if category: q += " AND category=?"; p.append(category)
        if subcategory: q += " AND subcategory=?"; p.append(subcategory)
        if is_item is True: q += " AND resource_type='item'"
        if is_item is False: q += " AND resource_type!='item'"
        if search: q += " AND (title LIKE ? OR description LIKE ?)"; p.extend([f"%{search}%", f"%{search}%"])
        q += " ORDER BY public_rating DESC LIMIT ?"; p.append(limit)
        c = await db.execute(q, p)
        return await c.fetchall()

async def get_resource_by_id(resource_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE id=?", (resource_id,))
        return await c.fetchone()

async def get_resource_by_chat_id(chat_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE chat_id=?", (chat_id,))
        return await c.fetchone()

async def get_user_resources(owner_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE owner_id=? ORDER BY created_at DESC", (owner_id,))
        return await c.fetchall()

async def update_resource(resource_id, **kwargs):
    if not kwargs: return
    kwargs['updated_at'] = datetime.now()
    s = ", ".join(f"{k}=?" for k in kwargs)
    v = list(kwargs.values()) + [resource_id]
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(f"UPDATE resources SET {s} WHERE id=?", v)
        await db.commit()

async def search_resources(query):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE (title LIKE ? OR username LIKE ? OR description LIKE ?) AND status='approved' ORDER BY public_rating DESC LIMIT 20", (f"%{query}%",f"%{query}%",f"%{query}%"))
        return await c.fetchall()

async def get_top_resources(limit=20):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE status='approved' AND total_reviews>0 ORDER BY public_rating DESC LIMIT ?", (limit,))
        return await c.fetchall()

async def get_categories():
    """Get all categories from database"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT slug, name_ru, name_en, icon, views FROM categories ORDER BY sort_order")
        return await c.fetchall()

async def get_reviews(resource_id, limit=20):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM reviews WHERE resource_id=? ORDER BY id DESC LIMIT ?", (resource_id, limit))
        return await c.fetchall()

async def add_review(resource_id, reviewer_id, rating, text):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        c = await db.execute("INSERT INTO reviews (resource_id,reviewer_id,rating,text) VALUES (?,?,?,?)", (resource_id,reviewer_id,rating,text))
        rid = c.lastrowid
        await db.execute("UPDATE resources SET total_reviews=total_reviews+1 WHERE id=?", (resource_id,))
        c = await db.execute("SELECT AVG(rating) FROM reviews WHERE resource_id=?", (resource_id,))
        r = await c.fetchone()
        if r and r[0]: await db.execute("UPDATE resources SET public_rating=? WHERE id=?", (round(r[0],1), resource_id))
        await db.commit()
        return rid

async def create_review_link(resource_id, code):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("INSERT INTO review_links (resource_id,code) VALUES (?,?)", (resource_id,code))
        await db.commit()

async def get_link_by_code(code):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM review_links WHERE code=? AND is_active=TRUE", (code,))
        return await c.fetchone()

async def set_context(user_id, action, data):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("INSERT OR REPLACE INTO user_context (user_id,action,data) VALUES (?,?,?)", (user_id,action,json.dumps(data,ensure_ascii=False)))
        await db.commit()

async def get_context(user_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM user_context WHERE user_id=?", (user_id,))
        r = await c.fetchone()
        if r: d = json.loads(r['data']); d['action'] = r['action']; return d
        return None

async def clear_context(user_id):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("DELETE FROM user_context WHERE user_id=?", (user_id,))
        await db.commit()

async def get_stats():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        c = await db.execute("SELECT COUNT(*) FROM resources"); tr = (await c.fetchone())[0]
        c = await db.execute("SELECT COUNT(*) FROM users"); tu = (await c.fetchone())[0]
        c = await db.execute("SELECT COUNT(*) FROM reviews"); tv = (await c.fetchone())[0]
        c = await db.execute("SELECT COUNT(*) FROM resources WHERE status='pending'"); tp = (await c.fetchone())[0]
        return {"total_resources":tr,"total_users":tu,"total_reviews":tv,"pending":tp}

async def get_pending_resources():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        c = await db.execute("SELECT * FROM resources WHERE status='pending' ORDER BY created_at ASC")
        return await c.fetchall()

async def log_admin_action(admin_id, action, resource_id, details=""):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("INSERT INTO admin_log (admin_id,action,resource_id,details) VALUES (?,?,?,?)", (admin_id,action,resource_id,details))
        await db.commit()