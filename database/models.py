SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    full_name TEXT,
    lang TEXT DEFAULT 'ru',
    phone TEXT,
    verified_resource TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    views INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    resource_type TEXT NOT NULL CHECK(resource_type IN ('channel','group','bot','item')),
    subcategory TEXT DEFAULT '',
    price REAL DEFAULT NULL,
    seller_phone TEXT DEFAULT '',
    title TEXT NOT NULL,
    username TEXT,
    chat_id INTEGER,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    social_link TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','blocked')),
    rejection_reason TEXT DEFAULT '',
    moderation_score INTEGER DEFAULT 0,
    public_rating REAL DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    verified_reviews INTEGER DEFAULT 0,
    trust_score REAL DEFAULT 50.0,
    is_admin_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(telegram_id),
    FOREIGN KEY (category) REFERENCES categories(slug)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL,
    reviewer_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    text TEXT,
    verification_status TEXT DEFAULT 'unverified',
    is_suspicious BOOLEAN DEFAULT FALSE,
    sentiment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id)
);

CREATE TABLE IF NOT EXISTS review_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_context (
    user_id INTEGER PRIMARY KEY,
    action TEXT,
    data TEXT
);

CREATE TABLE IF NOT EXISTS admin_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource_id INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_rating ON resources(public_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_resource ON reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""