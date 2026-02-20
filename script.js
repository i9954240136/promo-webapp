const tg = window.Telegram.WebApp;
tg.expand();

// === ПОДКЛЮЧЕНИЕ К SUPABASE ===
const SUPABASE_URL = 'https://yfvvsbcvrwvahmceutvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnZzYmN2cnd2YWhtY2V1dHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTIxNjgsImV4cCI6MjA4NzA2ODE2OH0.ZVR8Hf9INeheMM1-sSQBKqng3xklVCWZxNKDe6j0iIQ';

// Заголовки для запросов
const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

let allCategories = [];
let allOffers = [];
let allPromoCodes = [];
let currentOffer = null;

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ===
async function supabaseFetch(table, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const response = await fetch(url, {
        ...options,
        headers: { ...HEADERS, ...options.headers }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    try {
        console.log('🔄 Начало загрузки данных...');
        
        // Загружаем категории
        allCategories = await supabaseFetch('categories', {
            method: 'GET'
        });
        allCategories.sort((a, b) => a.name.localeCompare(b.name));
        console.log('✅ Категории загружены:', allCategories.length);
        
        // Загружаем оферы
        const offersUrl = `${SUPABASE_URL}/rest/v1/offers?is_active=eq.true`;
        const offersResponse = await fetch(offersUrl, { headers: HEADERS });
        allOffers = await offersResponse.json();
        console.log('✅ Оферы загружены:', allOffers.length);
        
        // Загружаем промокоды
        const codesUrl = `${SUPABASE_URL}/rest/v1/promo_codes?is_verified=eq.true`;
        const codesResponse = await fetch(codesUrl, { headers: HEADERS });
        allPromoCodes = await codesResponse.json();
        console.log('✅ Промокоды загружены:', allPromoCodes.length);
        
        console.log('🎉 ВСЕГО ЗАГРУЖЕНО:', {
            categories: allCategories.length,
            offers: allOffers.length,
            codes: allPromoCodes.length
        });
        
        renderCategories();
        filterOffers('all', null);
        
    } catch (error) {
        console.error('❌ ОШИБКА ЗАГРУЗКИ:', error);
        document.getElementById('offersContainer').innerHTML = 
            `<p style="text-align: center; color: red; padding: 20px;">
                Ошибка загрузки данных<br>
                <small>${error.message}</small>
            </p>`;
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

// === МОДАЛЬНОЕ ОКНО (С УМНОЙ ОБРАБОТКОЙ ССЫЛОК) ===
window.openModal = function(offer, codes) {
    currentOffer = { offer, codes };
    
    document.getElementById('mBrand').innerText = offer.brand_name;
    
    // Создаём список всех промокодов
    const codesContainer = document.getElementById('mCode');
    codesContainer.innerHTML = '';
    
    // Добавляем все промокоды
    codes.forEach((code, index) => {
        const codeText = code.code_text || 'AUTO';
        const bonusInfo = code.bonus_info || '';
        
        // Проверяем, является ли code_text ссылкой
        const isLink = codeText.startsWith('http://') || codeText.startsWith('https://');
        
        const codeDiv = document.createElement('div');
        codeDiv.className = 'promo-code-item';
        
        if (isLink) {
            // Элемент для ссылки
            codeDiv.innerHTML = `
                <div class="code-text code-link">${codeText}</div>
                <div class="code-bonus">${bonusInfo}</div>
                <div class="code-action-btn" onclick="openLink('${codeText}')">
                    🔗 Перейти по ссылке
                </div>
            `;
        } else {
            // Элемент для промокода
            codeDiv.innerHTML = `
                <div class="code-text">${codeText}</div>
                <div class="code-bonus">${bonusInfo}</div>
                <div class="code-action-btn" onclick="copyPromoCode('${codeText}')">
                    📋 Скопировать
                </div>
            `;
        }
        
        codesContainer.appendChild(codeDiv);
    });
    
    // Добавляем подсказку внизу
    const hintDiv = document.createElement('div');
    hintDiv.className = 'modal-hint';
    hintDiv.innerHTML = '💡 Нажмите на кнопку, чтобы скопировать или перейти';
    codesContainer.appendChild(hintDiv);
    
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

// === ФУНКЦИЯ ДЛЯ КОПИРОВАНИЯ ПРОМОКОДА ===
window.copyPromoCode = function(code) {
    navigator.clipboard.writeText(code);
    
    // Визуальная обратная связь
    tg.showPopup({ 
        title: '✅ Успешно!',
        message: `Промокод "${code}" скопирован!`,
        buttons: [{id: 'ok', type: 'ok'}]
    });
};

// === ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ССЫЛКИ ===
window.openLink = function(url) {
    // Открываем ссылку в браузере
    tg.openLink(url);
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
