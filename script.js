const tg = window.Telegram.WebApp;
tg.expand();

// === ПОДКЛЮЧЕНИЕ К SUPABASE ===
const SUPABASE_URL = 'https://yfvvsbcvrwvahmceutvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnZzYmN2cnd2YWhtY2V1dHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTIxNjgsImV4cCI6MjA4NzA2ODE2OH0.ZVR8Hf9INeheMM1-sSQBKqng3xklVCWZxNKDe6j0iIQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allCategories = [];
let allOffers = [];
let allPromoCodes = [];
let currentOffer = null;

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    try {
        // Загружаем категории
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (catError) throw catError;
        allCategories = categories || [];
        
        // Загружаем оферы
        const { data: offers, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('is_active', true);
        
        if (offerError) throw offerError;
        allOffers = offers || [];
        
        // Загружаем промокоды
        const { data: codes, error: codeError } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('is_verified', true);
        
        if (codeError) throw codeError;
        allPromoCodes = codes || [];
        
        console.log('Загружено:', {
            categories: allCategories.length,
            offers: allOffers.length,
            codes: allPromoCodes.length
        });
        
        renderCategories();
        renderOffers('all');
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('offersContainer').innerHTML = 
            '<p style="text-align: center; color: red;">Ошибка загрузки данных</p>';
    }
}

// === ОТРИСОВКА КАТЕГОРИЙ ===
function renderCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '<button class="cat-btn active" onclick="filterOffers(\'all\', this)">🗂 Все</button>';
    
    allCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = `${cat.icon_emoji || '📦'} ${cat.name}`;
        btn.onclick = (e) => filterOffers(cat.id, e.target);
        container.appendChild(btn);
    });
}

// === ФИЛЬТРАЦИЯ ОФЕРОВ ===
window.filterOffers = function(catId, btnEl) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allOffers.filter(offer => {
        const matchCat = catId === 'all' || offer.category_id === catId;
        const matchSearch = offer.brand_name.toLowerCase().includes(searchTerm);
        return matchCat && matchSearch;
    });
    
    const container = document.getElementById('offersContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Ничего не найдено</p>';
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(offer => {
        const offerCodes = allPromoCodes.filter(c => c.offer_id === offer.id);
        const activeCodes = offerCodes.filter(c => !c.expires_at || new Date(c.expires_at) > new Date());
        
        if (activeCodes.length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = `
            <div>
                <div class="brand-name">${offer.brand_name}</div>
                <div class="brand-desc">${offer.description || ''}</div>
            </div>
            <div>➡️</div>
        `;
        card.onclick = () => openModal(offer, activeCodes);
        container.appendChild(card);
    });
};

// === МОДАЛЬНОЕ ОКНО ===
window.openModal = function(offer, codes) {
    currentOffer = { offer, codes };
    
    document.getElementById('mBrand').innerText = offer.brand_name;
    document.getElementById('mCode').innerText = codes[0].code_text || 'AUTO';
    document.getElementById('mBonus').innerText = codes[0].bonus_info || '';
    
    // Дополнительные условия
    const additionalSection = document.getElementById('additionalSection');
    const additionalContent = document.getElementById('additionalContent');
    
    if (offer.additional_info) {
        additionalContent.innerHTML = offer.additional_info.replace(/\n/g, '<br>');
        additionalSection.style.display = 'block';
    } else {
        additionalSection.style.display = 'none';
    }
    
    document.getElementById('modal').classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('modal').classList.add('hidden');
};

window.toggleAdditional = function() {
    const content = document.getElementById('additionalContent');
    const toggle = document.querySelector('.additional-toggle');
    const icon = toggle.querySelector('.toggle-icon');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
        toggle.classList.add('active');
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        toggle.classList.remove('active');
    }
};

window.copyCode = function() {
    const code = document.getElementById('mCode').innerText;
    navigator.clipboard.writeText(code);
    tg.showPopup({ message: '✅ Код скопирован!' });
};

// Поиск
document.getElementById('searchInput').oninput = () => {
    const active = document.querySelector('.cat-btn.active');
    if (active && active.innerText !== '🗂 Все') {
        const catName = active.innerText.split(' ')[1];
        const cat = allCategories.find(c => c.name.includes(catName));
        if (cat) filterOffers(cat.id, active);
    } else {
        filterOffers('all', active);
    }
};

// Закрытие по клику вне модалки
document.getElementById('modal').onclick = function(e) {
    if (e.target === this) closeModal();
};

// Загрузка при старте
loadData();

