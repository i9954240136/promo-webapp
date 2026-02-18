const tg = window.Telegram.WebApp;
tg.expand();

// === 🗄 БАЗА ДАННЫХ (Заполняйте здесь) ===
const data = {
    categories: [
        { id: 1, name: "Еда", emoji: "🍕" },
        { id: 2, name: "Одежда", emoji: "👗" }
        // Добавьте остальные категории здесь
    ],
    offers: [
        // Пример: { id: 1, cat: 1, brand: "Яндекс.Еда", desc: "Скидка 30%", code: "FOOD30", bonus: "-300₽" },
        // Добавляйте новые строки по аналогии
    ]
};

// === 🛠 ЛОГИКА (Не меняйте, если не уверены) ===
const catsEl = document.getElementById('categoriesList');
const offersEl = document.getElementById('offersContainer');
const modal = document.getElementById('modal');
const search = document.getElementById('searchInput');

// Рендер категорий
function renderCats(filter = '') {
    catsEl.innerHTML = `<button class="cat-btn active" onclick="filterOffers('all', this)">🗂 Все</button>`;
    data.categories.filter(c => c.name.toLowerCase().includes(filter)).forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = `${c.emoji} ${c.name}`;
        btn.onclick = (e) => filterOffers(c.id, e.target);
        catsEl.appendChild(btn);
    });
}

// Фильтрация и рендер оферов
window.filterOffers = function(catId, btnEl) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(btnEl) btnEl.classList.add('active');
    
    offersEl.innerHTML = '';
    const term = search.value.toLowerCase();
    
    const filtered = data.offers.filter(o => {
        const matchCat = catId === 'all' || o.cat === catId;
        const matchSearch = o.brand.toLowerCase().includes(term);
        return matchCat && matchSearch;
    });

    if(filtered.length === 0) offersEl.innerHTML = '<p style="text-align:center">Ничего не найдено</p>';
    
    filtered.forEach(o => {
        const card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = `<div><div class="brand-name">${o.brand}</div><div class="brand-desc">${o.desc}</div></div><div>➡️</div>`;
        card.onclick = () => openModal(o);
        offersEl.appendChild(card);
    });
};

// Модальное окно
function openModal(offer) {
    document.getElementById('mBrand').innerText = offer.brand;
    document.getElementById('mCode').innerText = offer.code;
    document.getElementById('mBonus').innerText = offer.bonus || '';
    modal.classList.remove('hidden');
    
    document.getElementById('copyBtn').onclick = () => {
        navigator.clipboard.writeText(offer.code);
        tg.showPopup({ message: '✅ Код скопирован!' });
    };
}

document.querySelector('.close').onclick = () => modal.classList.add('hidden');
search.oninput = (e) => {
    const active = document.querySelector('.cat-btn.active');
    // Простой хак для перезапуска фильтрации по текущей категории
    if(active && active.innerText !== '🗂 Все') active.click(); 
    else filterOffers('all', active);
};

// Старт
renderCats();
filterOffers('all');