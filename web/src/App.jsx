import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
        if (tg) {
            tg.expand(); tg.ready();
            const tp = tg.themeParams || {};
            const root = document.documentElement.style;
            if (tp.bg_color) root.setProperty('--bg', tp.bg_color);
            if (tp.secondary_bg_color) root.setProperty('--bg-card', tp.secondary_bg_color);
            if (tp.button_color) root.setProperty('--primary', tp.button_color);
            if (tp.link_color) root.setProperty('--accent', tp.link_color);
            if (tp.hint_color) root.setProperty('--hint', tp.hint_color);
            if (tp.text_color) root.setProperty('--tg-text', tp.text_color);
            tg.setHeaderColor(tp.bg_color || '#000000');
            tg.setBackgroundColor(tp.bg_color || '#000000');
        }
        const haptic = tg ? tg.HapticFeedback : null;
        const API = 'https://trustworthy-rebirth-production-fe8b.up.railway.app';

        const L = {
            ru: { nav: { home:'🏠 Главная', market:'🛒 Маркет', top:'🏆 ТОП', pricing:'💎 Тарифы', register:'📝 Верификация', rules:'📜 Правила', about:'ℹ️ О сервисе' }, home: { title:'Категории', sub:'Выберите категорию', back:'← Назад', load:'Загрузка...', empty:'Ничего не найдено', search:'Поиск...' }, top: { title:'ТОП ресурсов', sub:'Самые популярные', views:'просмотров', rating:'Рейтинг', reviews:'отзывов' }, pricing: { title:'Тарифы', sub:'Оплата звёздами ⭐', pro:'PRO', biz:'Бизнес', proPrice:'200 ⭐', bizPrice:'500 ⭐', proPeriod:'/мес', bizPeriod:'/мес', proFeatures:['50 ссылок/день','Статистика','Приоритет','Верификация'], bizFeatures:['Безлимит','Аналитика','ТОП','API','Менеджер'], cta:'Оплатить ⭐', popular:'Популярный', processing:'Обработка...' }, register: { title:'Регистрация', email:'Email', pass:'Пароль', confirm:'Подтвердите пароль', btn:'Создать аккаунт', success:'Аккаунт создан!', error:'Ошибка регистрации', empty:'Заполните все поля', passMismatch:'Пароли не совпадают' }, about: { title:'О TrustGram', sub:'Платформа честных отзывов', desc1:'TrustGram — это инновационная платформа для поиска и верификации Telegram-ресурсов. Мы помогаем пользователям находить качественные каналы, чаты и ботов.', desc2:'Наша миссия — создать прозрачную экосистему, где каждый ресурс проходит проверку реальными пользователями.', features:'Ключевые возможности', featureItems:['Поиск по категориям','Рейтинг и отзывы','Верификация','Статистика','API для разработчиков','Поддержка 24/7'], stats:'Наша статистика', statItems:['Ресурсов в базе','Пользователей','Категорий','Отзывов'], questions:'Частые вопросы', qa:[{ q:'Как добавить ресурс?', a:'Используйте нашего бота @trustgram_bot' },{ q:'Как работает рейтинг?', a:'Рейтинг формируется на основе отзывов пользователей' },{ q:'Какие способы оплаты?', a:'Оплата звёздами Telegram ⭐' }] } },
            en: { nav: { home:'🏠 Home', market:'🛒 Market', top:'🏆 Top', pricing:'💎 Plans', register:'📝 Verify', rules:'📜 Rules', about:'ℹ️ About' }, home: { title:'Categories', sub:'Choose a category', back:'← Back', load:'Loading...', empty:'Nothing found', search:'Search...' }, top: { title:'Top Resources', sub:'Most popular', views:'views', rating:'Rating', reviews:'reviews' }, pricing: { title:'Plans', sub:'Pay with Stars ⭐', pro:'PRO', biz:'Business', proPrice:'200 ⭐', bizPrice:'500 ⭐', proPeriod:'/mo', bizPeriod:'/mo', proFeatures:['50 links/day','Stats','Priority','Verify'], bizFeatures:['Unlimited','Analytics','Top','API','Manager'], cta:'Pay ⭐', popular:'Popular', processing:'Processing...' }, register: { title:'Sign Up', email:'Email', pass:'Password', confirm:'Confirm Password', btn:'Create Account', success:'Account created!', error:'Registration failed', empty:'Fill all fields', passMismatch:'Passwords do not match' }, about: { title:'About', sub:'Honest review platform', desc1:'TrustGram is an innovative platform for finding and verifying Telegram resources. We help users find quality channels, chats and bots.', desc2:'Our mission is to create a transparent ecosystem where every resource is verified by real users.', features:'Key Features', featureItems:['Category Search','Ratings & Reviews','Verification','Statistics','Developer API','24/7 Support'], stats:'Our Stats', statItems:['Resources','Users','Categories','Reviews'], questions:'FAQ', qa:[{ q:'How to add a resource?', a:'Use our bot @trustgram_bot' },{ q:'How does rating work?', a:'Rating is based on user reviews' },{ q:'What payment methods?', a:'Payment via Telegram Stars ⭐' }] } }
        };

        const DEMO_RESOURCES = [
            { id:'d1', resource_type:'channel', title:'TrustGram News', username:'TrusstGram_bot', description:'Официальный канал TrustGram — новости платформы, обновления и полезные советы.', public_rating:5.0, total_reviews:12, category:'news' },
            { id:'d2', resource_type:'channel', title:'Крипто Инсайдер', username:'', description:'Аналитика по криптовалютам, сигналы и разборы рынка каждый день.', public_rating:4.7, total_reviews:38, category:'finance' },
            { id:'d3', resource_type:'group', title:'IT Разработчики', username:'', description:'Сообщество разработчиков: вакансии, вопросы, код-ревью и полезные материалы.', public_rating:4.8, total_reviews:24, category:'tech' },
            { id:'d4', resource_type:'bot', title:'ИИ Ассистент', username:'', description:'Умный бот на базе нейросетей — отвечает на вопросы, пишет тексты и помогает с задачами.', public_rating:4.5, total_reviews:56, category:'tech' },
            { id:'d5', resource_type:'channel', title:'Спорт Live', username:'', description:'Трансляции, результаты матчей и новости спорта в режиме реального времени.', public_rating:4.6, total_reviews:19, category:'sport' },
            { id:'d6', resource_type:'channel', title:'Киноман', username:'', description:'Рецензии, рейтинги и подборки фильмов и сериалов — для настоящих любителей кино.', public_rating:4.9, total_reviews:31, category:'cinema' },
        ];

        const CATS = [
            { id:1, slug:'shop', ru:'Товары', en:'Shopping', views:12500, subs:[{ id:101, ru:'Обувь', en:'Shoes', slug:'shoes' },{ id:102, ru:'Одежда', en:'Clothing', slug:'clothing' },{ id:103, ru:'Аксессуары', en:'Accessories', slug:'accessories' },{ id:104, ru:'Электроника', en:'Electronics', slug:'electronics' }] },
            { id:2, slug:'tech', ru:'Технологии', en:'Technology', views:9800, subs:[{ id:201, ru:'Боты', en:'Bots', slug:'bots' },{ id:202, ru:'IT-новости', en:'IT News', slug:'it-news' },{ id:203, ru:'Утилиты', en:'Utilities', slug:'utilities' }] },
            { id:3, slug:'news', ru:'Новости', en:'News', views:21000, subs:[{ id:301, ru:'Мировые', en:'World', slug:'world' },{ id:302, ru:'Политика', en:'Politics', slug:'politics' },{ id:303, ru:'Экономика', en:'Economy', slug:'economy' }] },
            { id:4, slug:'edu', ru:'Образование', en:'Education', views:7500, subs:[{ id:401, ru:'Курсы', en:'Courses', slug:'courses' },{ id:402, ru:'Университеты', en:'Universities', slug:'universities' }] },
            { id:5, slug:'game', ru:'Игры', en:'Gaming', views:32000, subs:[{ id:501, ru:'Шутеры', en:'Shooters', slug:'shooters' },{ id:502, ru:'Стратегии', en:'Strategy', slug:'strategy' },{ id:503, ru:'Инди', en:'Indie', slug:'indie' }] },
            { id:6, slug:'finance', ru:'Финансы', en:'Finance', views:18000, subs:[{ id:601, ru:'Крипто', en:'Crypto', slug:'crypto' },{ id:602, ru:'Инвестиции', en:'Investments', slug:'investments' }] },
            { id:7, slug:'health', ru:'Здоровье', en:'Health', views:5600, subs:[{ id:701, ru:'Медицина', en:'Medicine', slug:'medicine' },{ id:702, ru:'Фитнес', en:'Fitness', slug:'fitness' }] },
            { id:8, slug:'travel', ru:'Путешествия', en:'Travel', views:8900, subs:[{ id:801, ru:'Пляжи', en:'Beaches', slug:'beaches' },{ id:802, ru:'Горы', en:'Mountains', slug:'mountains' }] },
            { id:9, slug:'music', ru:'Музыка', en:'Music', views:15000, subs:[{ id:901, ru:'Рок', en:'Rock', slug:'rock' },{ id:902, ru:'Электронная', en:'Electronic', slug:'electronic' }] },
            { id:10, slug:'sport', ru:'Спорт', en:'Sports', views:22000, subs:[{ id:1001, ru:'Баскетбол', en:'Basketball', slug:'basketball' },{ id:1002, ru:'Теннис', en:'Tennis', slug:'tennis' }] },
            { id:11, slug:'auto', ru:'Авто', en:'Auto', views:11000, subs:[{ id:1101, ru:'Спорткары', en:'Sports cars', slug:'sports-cars' },{ id:1102, ru:'Внедорожники', en:'SUVs', slug:'suvs' }] },
            { id:12, slug:'cinema', ru:'Кино', en:'Cinema', views:17000, subs:[{ id:1201, ru:'Фильмы', en:'Movies', slug:'movies' },{ id:1202, ru:'Сериалы', en:'Series', slug:'series' }] },
        ];

        const MARKET_CATS = [
            { id:'m1', slug:'electronics', ru:'Электроника', en:'Electronics', subs:[{ id:'m101', ru:'Телефоны', en:'Phones', slug:'phones' },{ id:'m102', ru:'Наушники', en:'Headphones', slug:'headphones' },{ id:'m103', ru:'Ноутбуки', en:'Laptops', slug:'laptops' },{ id:'m104', ru:'Гаджеты', en:'Gadgets', slug:'gadgets' }] },
            { id:'m2', slug:'clothing', ru:'Одежда и обувь', en:'Clothing', subs:[{ id:'m201', ru:'Мужская', en:"Men's", slug:'mens' },{ id:'m202', ru:'Женская', en:"Women's", slug:'womens' },{ id:'m203', ru:'Обувь', en:'Shoes', slug:'shoes' }] },
            { id:'m3', slug:'transport', ru:'Транспорт', en:'Transport', subs:[{ id:'m301', ru:'Авто', en:'Cars', slug:'cars' },{ id:'m302', ru:'Мото', en:'Moto', slug:'moto' },{ id:'m303', ru:'Запчасти', en:'Parts', slug:'parts' }] },
            { id:'m4', slug:'home', ru:'Дом и быт', en:'Home', subs:[{ id:'m401', ru:'Мебель', en:'Furniture', slug:'furniture' },{ id:'m402', ru:'Техника', en:'Appliances', slug:'appliances' }] },
            { id:'m5', slug:'hobby', ru:'Хобби', en:'Hobby', subs:[{ id:'m501', ru:'Спорт', en:'Sport', slug:'sport' },{ id:'m502', ru:'Коллекции', en:'Collections', slug:'collections' }] },
        ];

        const CAT_COLORS = { shop:0xff6b9d, tech:0x00d4ff, news:0xff3b30, edu:0x34c759, game:0xaf52de, finance:0xf5c542, health:0xff9500, travel:0x00bfff, music:0xe91e63, sport:0x4caf50, auto:0x3a86ff, cinema:0x9c27b0, electronics:0xe8384f, clothing:0xff9500, transport:0x3a86ff, home:0x34c759, hobby:0xaf52de };
        const MARKET_ICONS = { electronics:'📱', clothing:'👕', transport:'🚗', home:'🛋', hobby:'🎯' };
        const CAT_ICONS = { shop:'🛍', tech:'📱', news:'📰', edu:'🎓', game:'🎮', finance:'💰', health:'❤️', travel:'✈️', music:'🎵', sport:'⚽', auto:'🚗', cinema:'🎬' };
        const SUB_ICONS = ['👟','👕','💍','💻','🤖','📡','🔧','🌍','🏛','📊','📚','🏫','🎯','♟','👾','₿','📈','💊','🧘','🏖','🏔','🎸','🎹','🏀','🎾','🏎','🛻','🍿','📺'];

        async function fetchAPI(endpoint, options = {}) { 
            try { 
                const r = await fetch(`${API}${endpoint}`, options); 
                if (!r.ok) {
                    const err = await r.json().catch(() => ({detail: 'Request failed'}));
                    throw new Error(err.detail || 'Request failed');
                }
                return await r.json(); 
            } catch (e) { 
                // Error will be handled by caller
                throw e; 
            } 
        }
        
        async function postAPI(endpoint, body) { 
            try { 
                const r = await fetch(`${API}${endpoint}`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(body) 
                });
                if (!r.ok) {
                    const err = await r.json().catch(() => ({detail: 'Request failed'}));
                    throw new Error(err.detail || 'Request failed');
                }
                return await r.json(); 
            } catch (e) { 
                throw e; 
            } 
        }

        function useToast() {
            const [toasts, setToasts] = useState([]);
            const addToast = useCallback((message, type = 'info', duration = 3000) => {
                const id = Date.now() + Math.random();
                setToasts(prev => [...prev, { id, message, type }]);
                setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
            }, []);
            const ToastContainer = ({ root }) => {
                if (!root) return null;
                return createPortal(
                    <div style={{ position:'fixed', top:'80px', left:'50%', transform:'translateX(-50%)', zIndex:999, display:'flex', flexDirection:'column', gap:'8px', pointerEvents:'none' }}>
                        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
                    </div>, root
                );
            };
            return { addToast, ToastContainer };
        }

        function RippleButton({ children, onClick, className, ...props }) {
            const ref = useRef(null);
            const h = useCallback((e) => {
                const el = ref.current; if (!el) return;
                const r = el.getBoundingClientRect();
                const s = Math.max(r.width, r.height);
                const ri = document.createElement('span');
                ri.className = 'ripple-effect';
                ri.style.width = ri.style.height = s + 'px';
                ri.style.left = (e.clientX - r.left - s / 2) + 'px';
                ri.style.top = (e.clientY - r.top - s / 2) + 'px';
                el.appendChild(ri);
                setTimeout(() => ri.remove(), 600);
                haptic?.impactOccurred('light');
                if (onClick) onClick(e);
            }, [onClick]);
            return <button ref={ref} onClick={h} className={`ripple ${className || ''}`} {...props}>{children}</button>;
        }

        function SkeletonCard({ count = 6 }) {
            return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: count }).map((_, i) => <div key={i} className="glass rounded-2xl p-5 text-center list-item"><div className="skeleton w-12 h-12 rounded-full mx-auto mb-3"></div><div className="skeleton h-4 w-20 mx-auto mb-2"></div><div className="skeleton h-3 w-16 mx-auto"></div></div>)}</div>;
        }

        function SkeletonList({ count = 5 }) {
            return <div className="space-y-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4 list-item"><div className="skeleton w-10 h-10 rounded-full"></div><div className="flex-1 space-y-2"><div className="skeleton h-5 w-48"></div><div className="skeleton h-3 w-32"></div></div><div className="space-y-2 text-right"><div className="skeleton h-5 w-16 ml-auto"></div><div className="skeleton h-3 w-10 ml-auto"></div></div></div>)}</div>;
        }

        function Navbar({ lang, setLang, sidebarOpen, setSidebarOpen }) {
            return (<nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5"><div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"><div className="flex items-center gap-3"><RippleButton onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white/50 hover:text-white p-2 rounded-xl transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg></RippleButton><span className="text-2xl floating">🛡️</span><h1 className="text-xl font-bold gradient-text">TrustGram</h1></div><div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1">{['ru', 'en'].map(l => <RippleButton key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${lang === l ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 scale-105' : 'text-white/40 hover:text-white/70'}`}>{l.toUpperCase()}</RippleButton>)}</div></div></nav>);
        }

        const ADMIN_ID = 8547928521;

        function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, t }) {
            const tgUser = tg?.initDataUnsafe?.user || null;
            const isAdmin = tgUser && tgUser.id === ADMIN_ID;
            return (<>{sidebarOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}<aside className={`fixed top-16 left-0 bottom-0 w-64 glass-strong border-r border-white/5 z-40 transition-all duration-400 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}><div className="p-4 space-y-1.5 pt-6">{['home', 'market', 'top', 'pricing', 'register', 'rules', 'about'].map((k, i) => <button key={k} onClick={() => { setPage(k); setSidebarOpen(false); haptic?.impactOccurred('light'); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 list-item ${page === k ? 'bg-sky-600/15 text-sky-300 border border-sky-500/20 shadow-lg shadow-sky-600/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{t.nav[k]}</button>)}
            {isAdmin && <button onClick={() => { tg?.openTelegramLink ? tg.openTelegramLink('https://t.me/TrusstGram_bot') : window.open('https://t.me/TrusstGram_bot'); }} className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 list-item bg-sky-500/10 text-sky-300 border border-sky-500/20 mt-2">🛡️ Админ-панель</button>}
            </div><div className="absolute bottom-6 left-4 right-4"><div className="divider-gradient mb-4"></div><p className="text-xs text-white/20 text-center">TrustGram v2.0</p></div></aside></>);
        }

        function MarketPage({ lang, addToast }) {
            const [cat, setCat] = useState(null);
            const [sub, setSub] = useState(null);
            const [items, setItems] = useState([]);
            const [loading, setLoading] = useState(false);
            const [selectedId, setSelectedId] = useState(null);

            const openSub = useCallback(async (c, s) => {
                haptic?.impactOccurred('light'); setSub(s); setLoading(true);
                try { const d = await fetchAPI(`/api/catalog?kind=item&category=${c.slug}&subcategory=${s.slug}&limit=20`); setItems(Array.isArray(d) ? d : []); }
                catch (e) { addToast('Ошибка загрузки', 'error'); }
                setLoading(false);
            }, [addToast]);

            const gb = useCallback(() => { haptic?.impactOccurred('light'); if (sub) { setSub(null); setItems([]); } else { setCat(null); } }, [sub]);

            if (cat && sub) return (<div className="space-y-6 tg-content page-enter">
                <button onClick={gb} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sky-400 hover:text-sky-300 text-sm font-medium transition-all duration-200 active:scale-95"><span>←</span> Назад</button>
                <h2 className="text-2xl font-bold text-white">{sub[lang === 'ru' ? 'ru' : 'en']}</h2>
                {loading ? <SkeletonList count={6} /> : items.length === 0 ? <div className="text-center py-16 fade-in-up"><span className="text-5xl block mb-4 opacity-30">🛒</span><p className="text-white/40">Пока нет товаров в этой категории</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{items.map((r, i) => <div key={r.id || i} onClick={() => setSelectedId(r.id)} className="glass rounded-2xl p-5 card-hover list-item"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-white truncate">{r.title}</h3><span className="text-yellow-400 font-bold star-shine">⭐{(r.public_rating || 0).toFixed(1)}</span></div><p className="text-sm text-white/50 line-clamp-2 mb-3">{r.description || ''}</p><span className="text-xl font-bold gradient-text-gold">{r.price} ₽</span></div>)}</div>}
                {selectedId && <ResourceDetailModal resourceId={selectedId} onClose={() => setSelectedId(null)} addToast={addToast} />}
            </div>);

            if (cat) return (<div className="space-y-6 tg-content page-enter">
                <button onClick={gb} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sky-400 hover:text-sky-300 text-sm font-medium transition-all duration-200 active:scale-95"><span>←</span> Назад</button>
                <h2 className="text-3xl font-bold text-white">{cat[lang === 'ru' ? 'ru' : 'en']}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{cat.subs.map(s => <div key={s.id} onClick={() => openSub(cat, s)} className="glass rounded-2xl p-5 text-center card-hover list-item"><span className="text-3xl block mb-2">📦</span><span className="text-sm text-white/80 font-medium">{s[lang === 'ru' ? 'ru' : 'en']}</span></div>)}</div>
            </div>);

            return (<div className="space-y-8 tg-content page-enter">
                <div className="text-center"><h2 className="text-4xl font-bold gradient-text">Маркетплейс</h2><p className="text-white/30 mt-2 text-sm">Покупай и продавай — товары, техника и не только</p></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{MARKET_CATS.map(c => <div key={c.slug} onClick={() => { haptic?.impactOccurred('light'); setCat(c); }} className="glass rounded-2xl p-5 text-center card-hover list-item group"><span className="text-4xl block mb-2 transition-transform duration-300 group-hover:scale-110" style={{ filter:'drop-shadow(0 0 10px ' + (CAT_COLORS[c.slug] || '#29b6f6') + '66)' }}>{MARKET_ICONS[c.slug] || '📦'}</span><h3 className="text-sm font-semibold text-white mt-1">{c[lang === 'ru' ? 'ru' : 'en']}</h3></div>)}</div>
            </div>);
        }

        function HomePage({ t, lang, addToast }) {
            const [cat, setCat] = useState(null);
            const [sub, setSub] = useState(null);
            const [loading, setLoading] = useState(false);
            const [resources, setResources] = useState([]);
            const [search, setSearch] = useState('');
            const [initialLoading, setInitialLoading] = useState(true);
            const [categories, setCategories] = useState([]);
            const [selectedId, setSelectedId] = useState(null);
            
            useEffect(() => {
                const t = setTimeout(() => setInitialLoading(false), 400);
                return () => clearTimeout(t);
            }, []);
            
            // Load categories from API on mount
            useEffect(() => {
                fetchAPI('/api/categories')
                    .then(data => { if (Array.isArray(data)) setCategories(data); })
                    .catch(() => {}); // fallback to CATS
            }, []);
            
            const sc = useCallback(async (c) => {
                haptic?.impactOccurred('light'); setCat(c); setSub(null);
                if (!c.subs || c.subs.length === 0) {
                    setLoading(true);
                    try { const d = await fetchAPI(`/api/catalog?category=${c.slug}&limit=20`); setResources(Array.isArray(d) ? d : []); }
                    catch (e) { addToast('Ошибка загрузки', 'error'); }
                    setLoading(false);
                } else { setResources([]); }
            }, [addToast]);
            const ss = useCallback(async (s) => { 
                haptic?.impactOccurred('light'); 
                setSub(s); 
                setLoading(true); 
                try {
                    const d = await fetchAPI(`/api/catalog?category=${s.slug}&limit=20`);
                    setResources(Array.isArray(d) ? d : []);
                } catch (e) {
                    addToast('Ошибка загрузки', 'error');
                }
                setLoading(false); 
            }, [addToast]);
            const gb = useCallback(() => { haptic?.impactOccurred('light'); if (sub) { setSub(null); setResources([]); } else { setCat(null); } }, [sub]);
            const ds = useCallback(async () => { 
                if (!search.trim()) return; 
                haptic?.impactOccurred('light'); 
                setLoading(true); 
                try {
                    const d = await fetchAPI(`/api/catalog?search=${encodeURIComponent(search)}&limit=20`);
                    setResources(Array.isArray(d) ? d : []);
                    setCat({ ru:'Поиск', en:'Search', slug:'search' });
                    setSub(null);
                } catch (e) {
                    addToast('Ошибка поиска', 'error');
                }
                setLoading(false); 
            }, [search, addToast]);

            if (cat && !sub && cat.subs && cat.subs.length > 0) return (<div className="space-y-6 tg-content page-enter"><button onClick={gb} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sky-400 hover:text-sky-300 text-sm font-medium transition-all duration-200 active:scale-95"><span>←</span> {t.home.back}</button><div className="flex items-center gap-4"><span className="text-5xl" style={{ filter:'drop-shadow(0 0 16px ' + (CAT_COLORS[cat.slug] || '#6c5ce7') + '88)' }}>{CAT_ICONS[cat.slug] || '📂'}</span><div><h2 className="text-3xl font-bold text-white">{cat[lang === 'ru' ? 'ru' : 'en']}</h2><p className="text-sm text-white/30 mt-1">{(cat.subs || []).length} подкатегорий</p></div></div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{(cat.subs || []).map((s, i) => <div key={s.id} onClick={() => ss(s)} className="glass rounded-2xl p-5 text-center card-hover list-item"><span className="text-3xl block mb-2">{SUB_ICONS[i] || '📦'}</span><span className="text-sm text-white/80 font-medium">{s[lang === 'ru' ? 'ru' : 'en']}</span></div>)}</div></div>);

            if (sub || (cat && (!cat.subs || cat.subs.length === 0))) return (<div className="space-y-6 tg-content page-enter"><button onClick={gb} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sky-400 hover:text-sky-300 text-sm font-medium transition-all duration-200 active:scale-95"><span>←</span> {t.home.back}</button><h2 className="text-2xl font-bold text-white">{(sub || cat)?.[lang === 'ru' ? 'ru' : 'en']}</h2>{loading ? <SkeletonList count={6} /> : resources.length === 0 ? <div className="text-center py-16 fade-in-up"><span className="text-5xl block mb-4 opacity-30">🔍</span><p className="text-white/40">{t.home.empty}</p></div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{resources.map((r, i) => <div key={r.id || i} onClick={() => setSelectedId(r.id)} className="glass rounded-2xl p-5 card-hover list-item"><div className="flex items-center gap-3 mb-3"><span className="text-2xl">{r.resource_type === 'channel' ? '📣' : '👥'}</span><div className="flex-1 min-w-0"><h3 className="font-semibold text-white truncate">{r.title || r.channel_title}</h3><p className="text-xs text-white/40 truncate">@{r.username || r.channel_username}</p></div><span className="text-yellow-400 font-bold star-shine">⭐{(r.public_rating || 0).toFixed(1)}</span></div><p className="text-sm text-white/50 line-clamp-2 mb-3">{r.description || ''}</p><div className="flex items-center justify-between"><span className="text-xs text-white/20">{r.total_reviews || 0} отзывов</span>{r.username && <a href={`https://t.me/${r.username || r.channel_username}`} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 rounded-xl text-xs font-medium transition-all duration-300 active:scale-95">🚀 Перейти</a>}</div></div>)}</div>}{selectedId && <ResourceDetailModal resourceId={selectedId} onClose={() => setSelectedId(null)} addToast={addToast} />}</div>);

            return (<div className="space-y-8 tg-content page-enter"><div className="text-center"><h2 className="text-4xl font-bold gradient-text">{t.home.title}</h2><p className="text-white/30 mt-2 text-sm">{t.home.sub}</p></div><div className="relative max-w-md mx-auto group"><input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && ds()} placeholder={t.home.search} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-sky-500/40 focus:bg-white/[0.07] focus:shadow-lg focus:shadow-sky-600/5" /><RippleButton onClick={ds} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/60 rounded-xl transition">🔍</RippleButton></div>{initialLoading ? <SkeletonCard count={12} /> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{(categories.length > 0 ? categories : CATS).map((c, i) => <div key={c.id || c.slug} onClick={() => sc(c)} className="glass rounded-2xl p-5 text-center card-hover list-item group"><span className="text-4xl block mb-2 transition-transform duration-300 group-hover:scale-110" style={{ filter:'drop-shadow(0 0 10px ' + (CAT_COLORS[c.slug] || '#6c5ce7') + '66)' }}>{CAT_ICONS[c.slug] || '📂'}</span><h3 className="text-sm font-semibold text-white mt-1">{c[lang === 'ru' ? 'ru' : 'en']}</h3><p className="text-xs text-white/25 mt-1">{(c.views || 0).toLocaleString()}</p></div>)}</div>}</div>);
        }

        function TopPage({ t, addToast }) {
            const [items, setItems] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(false);
            const [selectedId, setSelectedId] = useState(null);
            useEffect(() => { fetchAPI('/api/top?limit=10').then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => { setError(true); setLoading(false); addToast('Ошибка загрузки ТОП', 'error'); }); }, [addToast]);
            const medals = ['🥇', '🥈', '🥉'];
            const retry = () => { setLoading(true); setError(false); fetchAPI('/api/top?limit=10').then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); };
            return (<div className="space-y-6 tg-content page-enter"><div className="text-center"><h2 className="text-3xl font-bold gradient-text">{t.top.title}</h2><p className="text-white/30 mt-2 text-sm">{t.top.sub}</p></div>{loading ? <SkeletonList count={8} /> : error ? <div className="text-center py-16 fade-in-up"><span className="text-5xl block mb-4 opacity-30">⚠️</span><p className="text-white/40">Ошибка загрузки</p><RippleButton onClick={retry} className="mt-4 px-6 py-2 bg-white/5 rounded-xl text-sm text-white/60 hover:text-white/80 transition">🔄 Повторить</RippleButton></div> : items.length === 0 ? <div className="text-center py-16 fade-in-up"><span className="text-5xl block mb-4 opacity-30">🏆</span><p className="text-white/40">Нет данных</p></div> : <div className="space-y-3">{items.map((item, i) => <div key={item.id || i} onClick={() => setSelectedId(item.id)} className="glass rounded-2xl p-5 card-hover flex items-center gap-4 list-item"><span className="text-3xl">{medals[i] || `${i + 1}.`}</span><div className="flex-1 min-w-0"><h3 className="text-lg font-semibold text-white truncate">{item.title || item.channel_title}</h3><p className="text-sm text-white/40 truncate">@{item.username || item.channel_username}</p></div><div className="text-right"><div className="text-yellow-400 font-bold text-lg star-shine">⭐{(item.public_rating || 0).toFixed(1)}</div><div className="text-xs text-white/25">{item.total_reviews || 0} {t.top.reviews}</div></div></div>)}</div>}{selectedId && <ResourceDetailModal resourceId={selectedId} onClose={() => setSelectedId(null)} addToast={addToast} />}</div>);
        }

        function PricingPage({ t }) {
            const [processing, setProcessing] = useState(null);
            const h = useCallback(async (plan) => {
                if (!tg) { window.open('https://t.me/TrusstGram_bot', '_blank'); return; }
                haptic?.impactOccurred('heavy'); setProcessing(plan);
                try {
                    const prices = { pro: 200, biz: 500 };
                    const labels = { pro: 'Тариф PRO', biz: 'Тариф Бизнес' };
                    const tgUser = tg?.initDataUnsafe?.user;
                    if (!tgUser) { window.open('https://t.me/TrusstGram_bot', '_blank'); return; }
                    await postAPI('/api/plans/buy', { telegram_id: tgUser.id, plan, price: prices[plan], label: labels[plan] });
                } catch (e) { /* бот отправит инвойс */ }
                setProcessing(null);
            }, []);
            return (<div className="space-y-8 tg-content max-w-4xl mx-auto page-enter"><div className="text-center"><h2 className="text-3xl font-bold gradient-text">{t.pricing.title}</h2><p className="text-white/30 mt-2 text-sm">{t.pricing.sub}</p></div><div className="grid md:grid-cols-2 gap-6">{['pro', 'biz'].map((k, i) => <div key={k} className={`glass rounded-3xl p-8 card-hover text-center relative ${i === 1 ? 'border-sky-500/25 glow-pulse' : ''}`}>{i === 1 && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-xs font-bold px-5 py-1.5 rounded-full badge-pulse">{t.pricing.popular}</span>}<h3 className="text-2xl font-bold text-white mb-2">{t.pricing[k]}</h3><div className="divider-gradient my-4"></div><div className="my-6"><span className="text-4xl font-bold gradient-text-gold">{t.pricing[k + 'Price']}</span><span className="text-white/30 text-sm ml-1">{t.pricing[k + 'Period']}</span></div><ul className="space-y-3 mb-8 text-left">{t.pricing[k + 'Features'].map((f, j) => <li key={j} className="text-sm text-white/50 flex items-center gap-3 list-item"><span className="text-sky-400 flex-shrink-0">✓</span><span>{f}</span></li>)}</ul><RippleButton onClick={() => h(k)} disabled={processing !== null} className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-sky-600/20">{processing === k ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>{t.pricing.processing}</span> : t.pricing.cta}</RippleButton></div>)}</div><div className="glass rounded-2xl p-6 text-center"><p className="text-sm text-white/30">💡 Оплата происходит через Telegram Stars. Средства списываются мгновенно.</p></div></div>);
        }

        function RegisterPage({ t, addToast }) {
            const tgUser = tg?.initDataUnsafe?.user || null;
            const [phone, setPhone] = useState(null);
            const [resourceUsername, setResourceUsername] = useState('');
            const [loading, setLoading] = useState(false);
            const [success, setSuccess] = useState(false);

            const shareContact = useCallback(() => {
                if (!tg || !tg.requestContact) { addToast('Откройте через Telegram-бота для верификации', 'error'); return; }
                tg.requestContact((ok, data) => {
                    if (ok && data?.responseUnsafe?.contact?.phone_number) {
                        setPhone(data.responseUnsafe.contact.phone_number);
                        haptic?.notificationOccurred('success');
                    } else {
                        addToast('Не удалось получить номер', 'error');
                    }
                });
            }, [addToast]);

            const submit = useCallback(async () => {
                if (!tgUser) { addToast('Откройте страницу через кнопку в боте', 'error'); return; }
                if (!phone) { addToast('Сначала поделитесь номером телефона', 'error'); return; }
                const clean = resourceUsername.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
                if (!clean) { addToast('Укажите @username вашего канала/группы/бота', 'error'); return; }
                setLoading(true);
                try {
                    const r = await postAPI('/api/register', { telegram_id: tgUser.id, phone, username: clean });
                    if (r?.success) { setSuccess(true); addToast('Верификация пройдена!', 'success'); haptic?.notificationOccurred('success'); }
                } catch (e) { addToast(e.message || 'Ошибка верификации', 'error'); haptic?.notificationOccurred('error'); }
                setLoading(false);
            }, [tgUser, phone, resourceUsername, addToast]);

            if (success) return (<div className="space-y-8 tg-content max-w-md mx-auto page-enter text-center"><div className="glass rounded-3xl p-12"><span className="text-6xl block mb-6 floating">✅</span><h2 className="text-2xl font-bold text-white mb-2">Верификация пройдена</h2><p className="text-white/40 text-sm">Бот проверит права администратора на {resourceUsername} автоматически.</p></div></div>);

            return (<div className="space-y-8 tg-content max-w-md mx-auto page-enter"><div className="text-center"><h2 className="text-3xl font-bold gradient-text">Верификация</h2><p className="text-white/30 mt-2 text-sm">Без email — только реальный Telegram-профиль</p></div><div className="glass rounded-3xl p-8 space-y-5">
                {tgUser ? <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl"><span className="text-3xl">✅</span><div><p className="text-white font-semibold">{tgUser.first_name} {tgUser.last_name || ''}</p><p className="text-xs text-white/40">@{tgUser.username || 'без username'} · ID {tgUser.id}</p></div></div> : <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sm text-sky-300">Откройте эту страницу через кнопку в боте — так мы подтверждаем, что это реальный Telegram-аккаунт.</div>}

                <div>
                    <label className="input-label">Номер телефона</label>
                    {phone ? <div className="input-premium flex items-center justify-between"><span>📱 {phone}</span><span className="text-sky-400 text-xs">подтверждён</span></div> : <RippleButton onClick={shareContact} className="btn-premium w-full">📱 Поделиться номером через Telegram</RippleButton>}
                    <p className="text-xs text-white/25 mt-1.5">Номер передаётся напрямую из Telegram — подделать нельзя.</p>
                </div>

                <div>
                    <label className="input-label">Ваш канал / группа / бот</label>
                    <input type="text" value={resourceUsername} onChange={e => setResourceUsername(e.target.value)} className="input-premium" placeholder="@your_channel" disabled={loading} />
                    <p className="text-xs text-white/25 mt-1.5">После отправки бот проверит, что вы админ/владелец этого ресурса.</p>
                </div>

                <RippleButton onClick={submit} disabled={loading || !phone} className="btn-premium w-full disabled:opacity-50">{loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>Проверка...</span> : 'Пройти верификацию'}</RippleButton>
            </div></div>);
        }

        function RulesPage() {
            const rules = [
                ['1. Общие положения', 'TrustGram — маркетплейс Telegram-ресурсов (каналов, групп, ботов) и площадка для размещения объявлений о продаже товаров. Регистрируя ресурс или объявление, вы подтверждаете, что являетесь его владельцем/администратором и соглашаетесь с настоящими правилами.'],
                ['2. Верификация', 'Для размещения ресурса бот проверяет права администратора автоматически. Для размещения товара требуется подтверждённый номер телефона через Telegram. Это снижает риск фейковых аккаунтов, но не является финансовой гарантией сделки.'],
                ['3. Оплата публикаций', 'Первая публикация ресурса или товара — бесплатна. Вторая и последующие оплачиваются звёздами Telegram: ресурсы — 25⭐ / 50⭐, товары — 50⭐ / 100⭐. Оплата взимается только за размещение в каталоге, не за саму сделку между пользователями.'],
                ['4. Сделки между пользователями', 'TrustGram не участвует в сделках купли-продажи между пользователями и не несёт ответственности за их исход. Все договорённости о цене, оплате и доставке товара — исключительно между покупателем и продавцом. Будьте внимательны и проверяйте контрагента перед оплатой.'],
                ['5. Запрещённый контент', 'Запрещено размещение ресурсов и товаров, связанных с азартными играми, оружием, наркотиками, порнографией, мошенничеством и любой деятельностью, нарушающей законодательство или Правила Telegram.'],
                ['6. Модерация', 'Администрация оставляет за собой право отклонить или заблокировать любой ресурс/объявление без объяснения причин, если оно нарушает данные правила.'],
                ['7. Отзывы', 'Отзывы должны быть основаны на реальном опыте использования ресурса или взаимодействия с продавцом. Заказные, оскорбительные и фейковые отзывы удаляются.'],
            ];
            return (<div className="space-y-8 tg-content page-enter max-w-3xl mx-auto">
                <div className="text-center"><span className="text-5xl block mb-4">📜</span><h2 className="text-3xl font-bold gradient-text">Правила использования</h2></div>
                <div className="space-y-4">{rules.map(([title, text], i) => <div key={i} className="glass rounded-2xl p-6 list-item"><h3 className="font-semibold text-white mb-2">{title}</h3><p className="text-sm text-white/50 leading-relaxed">{text}</p></div>)}</div>
            </div>);
        }

        function AboutPage({ t }) {
            const [expandedQA, setExpandedQA] = useState(null);
            const toggleQA = useCallback((i) => { setExpandedQA(p => p === i ? null : i); haptic?.impactOccurred('light'); }, []);
            return (<div className="space-y-8 tg-content page-enter max-w-4xl mx-auto"><div className="text-center"><span className="text-6xl block mb-4 floating">🛡️</span><h2 className="text-3xl font-bold gradient-text">{t.about.title}</h2><p className="text-white/30 mt-2 text-sm">{t.about.sub}</p></div><div className="grid md:grid-cols-2 gap-4"><div className="glass rounded-2xl p-6 card-hover-subtle"><span className="text-2xl block mb-3">🎯</span><p className="text-sm text-white/60 leading-relaxed">{t.about.desc1}</p></div><div className="glass rounded-2xl p-6 card-hover-subtle"><span className="text-2xl block mb-3">🚀</span><p className="text-sm text-white/60 leading-relaxed">{t.about.desc2}</p></div></div><div><h3 className="text-xl font-bold text-white mb-4">{t.about.features}</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{t.about.featureItems.map((f, i) => <div key={i} className="glass rounded-xl p-4 text-center card-hover-subtle list-item"><span className="text-2xl block mb-2">{['🔍','⭐','✅','📊','🔌','🎧'][i] || '✨'}</span><span className="text-xs text-white/60">{f}</span></div>)}</div></div><div><h3 className="text-xl font-bold text-white mb-4">{t.about.stats}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{t.about.statItems.map((s, i) => <div key={i} className="glass rounded-2xl p-6 text-center card-hover-subtle"><span className="text-3xl font-bold gradient-text-accent count-up">{['12,500','8,200','12','45,000'][i]}</span><p className="text-xs text-white/40 mt-1">{s}</p></div>)}</div></div><div><h3 className="text-xl font-bold text-white mb-4">{t.about.questions}</h3><div className="space-y-2">{t.about.qa.map((item, i) => <div key={i} className="glass rounded-2xl overflow-hidden card-hover-subtle"><button onClick={() => toggleQA(i)} className="w-full px-6 py-4 flex items-center justify-between text-left"><span className="text-sm font-medium text-white/80">{item.q}</span><span className={`text-white/30 text-xl transition-transform duration-300 ${expandedQA === i ? 'rotate-45' : ''}`}>+</span></button><div className="accordion-content" style={{ maxHeight: expandedQA === i ? '200px' : '0px', opacity: expandedQA === i ? 1 : 0 }}><div className="px-6 pb-4"><div className="divider-gradient mb-3"></div><p className="text-sm text-white/40 leading-relaxed">{item.a}</p></div></div></div>)}</div></div></div>);
        }

                function ResourceDetailModal({ resourceId, onClose, addToast }) {
                    const [data, setData] = useState(null);
                    const [loading, setLoading] = useState(true);
                    const [rating, setRating] = useState(5);
                    const [text, setText] = useState('');
                    const [sending, setSending] = useState(false);

                    useEffect(() => {
                        fetchAPI(`/api/resource/${resourceId}`).then(setData).catch(() => addToast('Ошибка загрузки', 'error')).finally(() => setLoading(false));
                    }, [resourceId]);

                    const submitReview = useCallback(async () => {
                        if (text.trim().length < 10) { addToast('Отзыв — минимум 10 символов', 'error'); return; }
                        setSending(true);
                        try {
                            await postAPI(`/api/resource/${resourceId}/review`, { rating, text });
                            addToast('✅ Отзыв добавлен', 'success');
                            setText('');
                            const fresh = await fetchAPI(`/api/resource/${resourceId}`); setData(fresh);
                        } catch (e) { addToast(e.message || 'Ошибка отправки', 'error'); }
                        setSending(false);
                    }, [resourceId, rating, text, addToast]);

                    return (<div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
                        <div className="glass-strong rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto space-y-4 page-enter" onClick={e => e.stopPropagation()}>
                            {loading ? <SkeletonList count={2} /> : !data ? <p className="text-white/40">Не найдено</p> : <>
                                <div className="flex items-center gap-3"><span className="text-3xl">{data.resource_type === 'item' ? '🛒' : data.resource_type === 'channel' ? '📣' : data.resource_type === 'bot' ? '🤖' : '👥'}</span><div><h3 className="text-xl font-bold text-white">{data.title}</h3>{data.resource_type !== 'item' && <p className="text-sm text-white/40">@{data.username}</p>}</div></div>
                                {data.resource_type === 'item' ? <div className="flex items-center gap-3"><span className="text-2xl font-bold gradient-text-gold">{data.price} ₽</span><span className="text-yellow-400 font-bold">⭐ {(data.public_rating || 0).toFixed(1)}</span></div> : <div className="flex gap-4 text-sm"><span className="text-white/60">👥 {data.members_count ?? '—'} подписчиков</span><span className="text-yellow-400 font-bold">⭐ {(data.public_rating || 0).toFixed(1)}</span></div>}
                                <p className="text-sm text-white/60">{data.description || "Без описания"}</p><p className="text-xs text-white/25">📅 Добавлен: {data.created_at ? new Date(data.created_at).toLocaleDateString("ru-RU") : "—"}</p>
                                {data.resource_type === 'item'
                                    ? <RippleButton onClick={() => { const link = data.username ? `https://t.me/${data.username}` : null; if (link && tg?.openTelegramLink) tg.openTelegramLink(link); else if (link) window.open(link); else addToast('У продавца не указан username', 'error'); }} className="btn-premium w-full">💬 Написать продавцу</RippleButton>
                                    : <a href={`https://t.me/${data.username}`} target="_blank" rel="noopener noreferrer" className="btn-premium w-full block text-center">🚀 Перейти в {data.resource_type === 'channel' ? 'канал' : data.resource_type === 'bot' ? 'бота' : 'группу'}</a>}
                                <div className="divider-gradient"></div>
                                <h4 className="font-semibold text-white">✍️ Оставить отзыв</h4>
                                <div className="glass rounded-xl p-4 space-y-3">
                                    <div><p className="text-xs text-white/40 mb-2">Ваша оценка</p><div className="flex gap-3">{[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} className={`text-3xl transition-transform active:scale-90 ${n <= rating ? 'opacity-100 scale-110' : 'opacity-30'}`}>⭐</button>)}</div></div>
                                    <div><textarea value={text} onChange={e => setText(e.target.value)} className="input-premium resize-none" rows="4" placeholder="Расскажите о своём опыте использования — это поможет другим пользователям..." disabled={sending} maxLength={500} /><p className="text-xs text-white/25 mt-1 text-right">{text.length}/500</p></div>
                                    <RippleButton onClick={submitReview} disabled={sending || text.trim().length < 10} className="btn-premium w-full disabled:opacity-40">{sending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>Отправка...</span> : `Отправить отзыв (${rating}⭐)`}</RippleButton>
                                    {text.trim().length > 0 && text.trim().length < 10 && <p className="text-xs text-red-400 text-center">Минимум 10 символов</p>}
                                </div>
                                <div className="divider-gradient"></div>
                                <h4 className="font-semibold text-white">Отзывы ({(data.reviews || []).length})</h4>
                                {(data.reviews || []).length === 0 ? <p className="text-sm text-white/30">Пока нет отзывов</p> : data.reviews.map((r, i) => <div key={i} className="glass rounded-xl p-3"><span className="text-yellow-400 text-sm">{'⭐'.repeat(r.rating)}</span><p className="text-sm text-white/60 mt-1">{r.text}</p></div>)}
                            </>}
                        </div>
                    </div>);
                }

                function AddResourceModal({ onClose, addToast }) {
            const tgUser = tg?.initDataUnsafe?.user || null;
            const [kind, setKind] = useState('resource');
            const [username, setUsername] = useState('');
            const [title, setTitle] = useState('');
            const [price, setPrice] = useState('');
            const [category, setCategory] = useState(CATS[0]?.slug || '');
            const [marketCat, setMarketCat] = useState(MARKET_CATS[0]?.slug || '');
            const [subcategory, setSubcategory] = useState(MARKET_CATS[0]?.subs[0]?.slug || '');
            const [description, setDescription] = useState('');
            const [loading, setLoading] = useState(false);

            const submit = useCallback(async () => {
                if (!tgUser) { addToast('Откройте сайт через кнопку в боте', 'error'); return; }
                if (description.trim().length < 10) { addToast('Описание — минимум 10 символов', 'error'); return; }
                setLoading(true);
                try {
                    let payload;
                    if (kind === 'item') {
                        if (!title.trim() || !price) { addToast('Укажите название и цену', 'error'); setLoading(false); return; }
                        payload = { telegram_id: tgUser.id, kind: 'item', title: title.trim(), price: Number(price), category: marketCat, subcategory, description, seller_username: tgUser.username || '' };
                    } else {
                        const clean = username.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
                        if (!clean) { addToast('Укажите @username ресурса', 'error'); setLoading(false); return; }
                        payload = { telegram_id: tgUser.id, kind: 'resource', username: clean, category, description };
                    }
                    const r = await postAPI('/api/resources/submit', payload);
                    if (r?.free) { addToast('✅ Опубликовано!', 'success'); }
                    else { addToast(`💫 Откройте бота — там счёт на ${r.price}⭐ для завершения`, 'info', 5000); }
                    onClose();
                } catch (e) { addToast(e.message || 'Ошибка отправки', 'error'); }
                setLoading(false);
            }, [kind, username, title, price, category, marketCat, subcategory, description, tgUser, addToast, onClose]);

            const marketSubs = MARKET_CATS.find(c => c.slug === marketCat)?.subs || [];

            return (<div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
                <div className="glass-strong rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md space-y-4 page-enter max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-white">➕ Добавить</h3>
                    <div className="flex gap-2 bg-white/5 rounded-xl p-1">
                        <button onClick={() => setKind('resource')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${kind === 'resource' ? 'bg-sky-600 text-white' : 'text-white/40'}`}>📣 Ресурс</button>
                        <button onClick={() => setKind('item')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${kind === 'item' ? 'bg-sky-600 text-white' : 'text-white/40'}`}>🛒 Товар</button>
                    </div>

                    {kind === 'resource' ? <>
                        <div><label className="input-label">@username канала/группы/бота</label><input value={username} onChange={e => setUsername(e.target.value)} className="input-premium" placeholder="@your_channel" disabled={loading} /></div>
                        <div><label className="input-label">Категория</label><select value={category} onChange={e => setCategory(e.target.value)} className="input-premium" disabled={loading}>{CATS.map(c => <option key={c.slug} value={c.slug}>{c.ru}</option>)}</select></div>
                        <p className="text-xs text-white/30">Первая публикация бесплатна, вторая — 25⭐, далее — 50⭐. Оплата в боте.</p>
                    </> : <>
                        <div><label className="input-label">Название товара</label><input value={title} onChange={e => setTitle(e.target.value)} className="input-premium" placeholder="iPhone 15 Pro, б/у" disabled={loading} /></div>
                        <div><label className="input-label">Цена, ₽</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-premium" placeholder="50000" disabled={loading} /></div>
                        <div><label className="input-label">Категория</label><select value={marketCat} onChange={e => { setMarketCat(e.target.value); setSubcategory(MARKET_CATS.find(c => c.slug === e.target.value)?.subs[0]?.slug || ''); }} className="input-premium" disabled={loading}>{MARKET_CATS.map(c => <option key={c.slug} value={c.slug}>{c.ru}</option>)}</select></div>
                        <div><label className="input-label">Подкатегория</label><select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="input-premium" disabled={loading}>{marketSubs.map(s => <option key={s.slug} value={s.slug}>{s.ru}</option>)}</select></div>
                        <p className="text-xs text-white/30">Нужна верификация телефона (раздел «Верификация»). Первая публикация бесплатна, вторая — 50⭐, далее — 100⭐.</p>
                    </>}

                    <div><label className="input-label">Описание</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-premium" rows="3" placeholder="Коротко о ресурсе или товаре..." disabled={loading} /></div>
                    <RippleButton onClick={submit} disabled={loading} className="btn-premium w-full">{loading ? 'Отправка...' : 'Опубликовать'}</RippleButton>
                </div>
            </div>);
        }
function App() {
            const [lang, setLang] = useState('ru');
            const [page, setPage] = useState(() => new URLSearchParams(window.location.search).get('page') || 'home');
            const [sidebarOpen, setSidebarOpen] = useState(false);
            const [showAddModal, setShowAddModal] = useState(false);
            const toastRootRef = useRef(null);
            const t = L[lang];
            const { addToast, ToastContainer } = useToast();
            useEffect(() => { toastRootRef.current = document.getElementById('toast-root'); }, []);
            const pages = { home: <HomePage t={t} lang={lang} addToast={addToast} />, market: <MarketPage lang={lang} addToast={addToast} />, top: <TopPage t={t} addToast={addToast} />, pricing: <PricingPage t={t} />, register: <RegisterPage t={t} addToast={addToast} />, rules: <RulesPage />, about: <AboutPage t={t} /> };
            return (<div className="min-h-screen tg-bg"><Navbar lang={lang} setLang={setLang} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /><Sidebar page={page} setPage={setPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} t={t} /><main className="pt-16 lg:pl-64"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">{pages[page]}</div></main>
                <button onClick={() => { haptic?.impactOccurred('medium'); setShowAddModal(true); }} className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-sky-500 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-sky-600/40 active:scale-90 transition-all duration-300 glow-pulse ${sidebarOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}`}>+</button>
                {showAddModal && <AddResourceModal onClose={() => setShowAddModal(false)} addToast={addToast} />}
                <ToastContainer root={toastRootRef.current} /></div>);
        }

export default App;
