// === ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
const userId = tg.initDataUnsafe?.user?.id;
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

// === ОТСЛЕЖИВАНИЕ ДЕЙСТВИЙ ===
async function trackAction(action, data = {}) {
    """Отправляет событие в аналитику"""
    if (!userId) {
        console.log('⚠️ No user_id, skipping tracking');
        return;
    }
    
    try {
        const payload = {
            user_id: userId,
            action: action,
            brand_name: data.brand || null,
            promo_code: data.code || null,
            metadata: {
                ...data,
                timestamp: new Date().toISOString(),
                platform: navigator.platform,
                userAgent: navigator.userAgent
            }
        };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log(`✅ Tracked: ${action}`, data);
        } else {
            console.error('❌ Track failed:', response.status);
        }
    } catch (error) {
        console.error('❌ Track error:', error);
    }
}

// === ОТСЛЕЖИВАНИЕ ОТКРЫТИЯ MINI APP ===
if (userId) {
    trackAction('app_opened');
    console.log('📱 Mini App opened, User ID:', userId);
} else {
    console.warn('⚠️ User ID not available');
}

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
    
    // Отслеживаем поиск
    if (searchTerm.length > 0) {
        trackAction('search', { query: searchTerm });
    }
    
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

// === МОДАЛЬНОЕ ОКНО (С ОТСЛЕЖИВАНИЕМ) ===
window.openModal = function(offer, codes) {
    currentOffer = { offer, codes };
    
    // === ОТСЛЕЖИВАНИЕ ПРОСМОТРА БРЕНДА ===
    trackAction('brand_viewed', { 
        brand: offer.brand_name,
        offer_id: offer.id
    });
    
    document.getElementById('mBrand').innerText = offer.brand_name;
    
    const codesContainer = document.getElementById('mCode');
    codesContainer.innerHTML = '';
    
    codes.forEach((code, index) => {
        const codeText = code.code_text || 'AUTO';
        const bonusInfo = code.bonus_info || '';
        const barcode = code.barcode || null;
        const barcodeType = code.barcode_type || 'EAN13';
        
        const isLink = codeText.startsWith('http://') || codeText.startsWith('https://');
        const hasBarcode = barcode && barcode.toString().trim().length > 0;
        
        const codeDiv = document.createElement('div');
        codeDiv.className = 'promo-code-item';
        
        if (isLink) {
            codeDiv.innerHTML = `
                <div class="link-header">🎁 Бонус доступен по ссылке:</div>
                <div class="code-text code-link">${codeText}</div>
                <div class="code-bonus">${bonusInfo}</div>
                <div class="code-action-btn" onclick="openLink('${codeText}')">
                    🔗 Перейти по ссылке
                </div>
            `;
        } else if (hasBarcode) {
            const barcodeId = `barcode-${index}-${Date.now()}`;
            codeDiv.innerHTML = `
                <div class="code-text">${codeText}</div>
                <div class="code-bonus">${bonusInfo}</div>
                <div class="barcode-container">
                    <svg id="${barcodeId}"></svg>
                </div>
                <div class="code-hint">📱 Покажите штрих-код на кассе</div>
                <div class="code-action-btn" onclick="copyPromoCode('${codeText}')">
                    📋 Скопировать код
                </div>
            `;
            
            setTimeout(() => {
                try {
                    if (typeof JsBarcode !== 'undefined') {
                        JsBarcode(`#${barcodeId}`, barcode, {
                            format: barcodeType,
                            width: 2,
                            height: 50,
                            displayValue: true,
                            fontSize: 14,
                            margin: 10,
                            background: "#ffffff",
                            lineColor: "#000000"
                        });
                    }
                } catch (e) {
                    console.error('Ошибка генерации штрих-кода:', e);
                }
            }, 100);
        } else {
            codeDiv.innerHTML = `
                <div class="code-text">${codeText}</div>
                <div class="code-bonus">${bonusInfo}</div>
                <div class="code-action-btn" onclick="copyPromoCode('${codeText}')">
                    📋 Скопировать промокод
                </div>
            `;
        }
        
        codesContainer.appendChild(codeDiv);
    });
    
    const hintDiv = document.createElement('div');
    hintDiv.className = 'modal-hint';
    hintDiv.innerHTML = '💡 Нажмите на кнопку, чтобы скопировать или перейти';
    codesContainer.appendChild(hintDiv);
    
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
    
    // === ОТСЛЕЖИВАНИЕ КОПИРОВАНИЯ ===
    trackAction('promo_copied', { 
        code: code,
        brand: currentOffer?.offer?.brand_name
    });
    
    tg.showPopup({ 
        title: '✅ Успешно!',
        message: `Промокод "${code}" скопирован!`,
        buttons: [{id: 'ok', type: 'ok'}]
    });
};

// === ФУНКЦИЯ ДЛЯ ОТКРЫТИЯ ССЫЛКИ ===
window.openLink = function(url) {
    // === ОТСЛЕЖИВАНИЕ КЛИКА ПО ССЫЛКЕ ===
    trackAction('link_clicked', { 
        url: url,
        brand: currentOffer?.offer?.brand_name
    });
    
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
