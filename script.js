// === ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===
var tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
var userId = tg.initDataUnsafe?.user?.id;
var SUPABASE_URL = 'https://yfvvsbcvrwvahmceutvi.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnZzYmN2cnd2YWhtY2V1dHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTIxNjgsImV4cCI6MjA4NzA2ODE2OH0.ZVR8Hf9INeheMM1-sSQBKqng3xklVCWZxNKDe6j0iIQ';

// Заголовки для запросов
var HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

var allCategories = [];
var allOffers = [];
var allPromoCodes = [];
var currentOffer = null;

// === ОТСЛЕЖИВАНИЕ ДЕЙСТВИЙ ===
async function trackAction(action, data) {
    if (!userId) {
        console.log('⚠️ No user_id, skipping tracking');
        return;
    }
    
    try {
        var payload = {
            user_id: userId,
            action: action,
            brand_name: data?.brand || null,
            promo_code: data?.code || null,
            metadata: {
                timestamp: new Date().toISOString(),
                platform: navigator.platform
            }
        };
        
        var response = await fetch(SUPABASE_URL + '/rest/v1/analytics', {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('✅ Tracked:', action, data);
        } else {
            console.error('❌ Track failed:', response.status);
        }
    } catch (error) {
        console.error('❌ Track error:', error);
    }
}

// === ОТСЛЕЖИВАНИЕ ОТКРЫТИЯ MINI APP ===
if (userId) {
    trackAction('app_opened', {});
    console.log('📱 Mini App opened, User ID:', userId);
} else {
    console.warn('⚠️ User ID not available');
}

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ===
async function supabaseFetch(table, options) {
    var url = SUPABASE_URL + '/rest/v1/' + table;
    var response = await fetch(url, Object.assign({}, options, {
        headers: Object.assign({}, HEADERS, options?.headers || {})
    }));
    
    if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
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
        allCategories.sort(function(a, b) { return a.name.localeCompare(b.name); });
        console.log('✅ Категории загружены:', allCategories.length);
        
        // Загружаем оферы
        var offersUrl = SUPABASE_URL + '/rest/v1/offers?is_active=eq.true';
        var offersResponse = await fetch(offersUrl, { headers: HEADERS });
        allOffers = await offersResponse.json();
        console.log('✅ Оферы загружены:', allOffers.length);
        
        // Загружаем промокоды
        var codesUrl = SUPABASE_URL + '/rest/v1/promo_codes?is_verified=eq.true';
        var codesResponse = await fetch(codesUrl, { headers: HEADERS });
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
            '<p style="text-align: center; color: red; padding: 20px;">' +
            'Ошибка загрузки данных<br>' +
            '<small>' + error.message + '</small>' +
            '</p>';
    }
}

// === ОТРИСОВКА КАТЕГОРИЙ ===
function renderCategories() {
    var container = document.getElementById('categoriesList');
    container.innerHTML = '<button class="cat-btn active" onclick="filterOffers(\'all\', this)">🗂 Все</button>';
    
    allCategories.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = (cat.icon_emoji || '📦') + ' ' + cat.name;
        btn.onclick = function(e) { filterOffers(cat.id, e.target); };
        container.appendChild(btn);
    });
}

// === ФИЛЬТРАЦИЯ ОФЕРОВ ===
window.filterOffers = function(catId, btnEl) {
    document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');
    
    var searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Отслеживаем поиск
    if (searchTerm.length > 0) {
        trackAction('search', { query: searchTerm });
    }
    
    var filtered = allOffers.filter(function(offer) {
        var matchCat = catId === 'all' || offer.category_id === catId;
        var matchSearch = offer.brand_name.toLowerCase().indexOf(searchTerm) !== -1;
        return matchCat && matchSearch;
    });
    
    var container = document.getElementById('offersContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Ничего не найдено</p>';
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(function(offer) {
        var offerCodes = allPromoCodes.filter(function(c) { return c.offer_id === offer.id; });
        var activeCodes = offerCodes.filter(function(c) { 
            return !c.expires_at || new Date(c.expires_at) > new Date(); 
        });
        
        if (activeCodes.length === 0) return;
        
        var card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = 
            '<div>' +
                '<div class="brand-name">' + offer.brand_name + '</div>' +
                '<div class="brand-desc">' + (offer.description || '') + '</div>' +
            '</div>' +
            '<div>➡️</div>';
        card.onclick = function() { openModal(offer, activeCodes); };
        container.appendChild(card);
    });
};

// === МОДАЛЬНОЕ ОКНО (С УВЕЛИЧЕНИЕМ ШТРИХ-КОДА) ===
window.openModal = function(offer, codes) {
    currentOffer = { offer: offer, codes: codes };
    
    // === ОТСЛЕЖИВАНИЕ ПРОСМОТРА БРЕНДА ===
    trackAction('brand_viewed', { 
        brand: offer.brand_name,
        offer_id: offer.id
    });
    
    document.getElementById('mBrand').innerText = offer.brand_name;
    
    var codesContainer = document.getElementById('mCode');
    codesContainer.innerHTML = '';
    
    codes.forEach(function(code, index) {
        var codeText = code.code_text || 'AUTO';
        var bonusInfo = code.bonus_info || '';
        var barcode = code.barcode || null;
        var barcodeType = code.barcode_type || 'EAN13';
        
        var isLink = codeText.indexOf('http://') === 0 || codeText.indexOf('https://') === 0;
        var hasBarcode = barcode && barcode.toString().trim().length > 0;
        
        var codeDiv = document.createElement('div');
        codeDiv.className = 'promo-code-item';
        
        if (isLink) {
            codeDiv.innerHTML = 
                '<div class="link-header">🎁 Бонус доступен по ссылке:</div>' +
                '<div class="code-text code-link">' + codeText + '</div>' +
                '<div class="code-bonus">' + bonusInfo + '</div>' +
                '<div class="code-action-btn" onclick="openLink(\'' + codeText + '\')">' +
                    '🔗 Перейти по ссылке' +
                '</div>';
        } else if (hasBarcode) {
            // === ШТРИХ-КОД — КНОПКА УВЕЛИЧЕНИЯ ===
            var barcodeId = 'barcode-' + index + '-' + Date.now();
            var barcodeImageId = 'barcode-img-' + index;
            
            codeDiv.innerHTML = 
                '<div class="code-text">' + codeText + '</div>' +
                '<div class="code-bonus">' + bonusInfo + '</div>' +
                '<div class="barcode-container" id="' + barcodeImageId + '">' +
                    '<svg id="' + barcodeId + '"></svg>' +
                '</div>' +
                '<div class="code-hint">📱 Покажите штрих-код на кассе</div>' +
                '<div class="code-action-btn barcode-expand-btn" onclick="expandBarcode(\'' + barcodeImageId + '\', \'' + barcodeId + '\', \'' + barcode + '\', \'' + barcodeType + '\')">' +
                    '📱 Показать штрих-код' +
                '</div>';
            
            // Генерируем штрих-код
            setTimeout(function() {
                try {
                    if (typeof JsBarcode !== 'undefined') {
                        JsBarcode('#' + barcodeId, barcode, {
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
            // === ОБЫЧНЫЙ ПРОМОКОД — КНОПКА КОПИРОВАНИЯ ===
            codeDiv.innerHTML = 
                '<div class="code-text">' + codeText + '</div>' +
                '<div class="code-bonus">' + bonusInfo + '</div>' +
                '<div class="code-action-btn" onclick="copyPromoCode(\'' + codeText + '\')">' +
                    '📋 Скопировать промокод' +
                '</div>';
        }
        
        codesContainer.appendChild(codeDiv);
    });
    
    var hintDiv = document.createElement('div');
    hintDiv.className = 'modal-hint';
    hintDiv.innerHTML = '💡 Нажмите на кнопку, чтобы скопировать или увеличить штрих-код';
    codesContainer.appendChild(hintDiv);
    
    var additionalSection = document.getElementById('additionalSection');
    var additionalContent = document.getElementById('additionalContent');
    
    if (offer.additional_info) {
        additionalContent.innerHTML = offer.additional_info.replace(/\n/g, '<br>');
        additionalSection.style.display = 'block';
    } else {
        additionalSection.style.display = 'none';
    }
    
    document.getElementById('modal').classList.remove('hidden');
};

// === ФУНКЦИЯ ДЛЯ КОПИРОВАНИЯ ПРОМОКОДА (С КАСТОМНЫМ УВЕДОМЛЕНИЕМ) ===
window.copyPromoCode = function(code) {
    navigator.clipboard.writeText(code);
    
    // === ОТСЛЕЖИВАНИЕ КОПИРОВАНИЯ ===
    trackAction('promo_copied', { 
        code: code,
        brand: currentOffer?.offer?.brand_name
    });
    
    // === КАСТОМНОЕ УВЕДОМЛЕНИЕ (вместо tg.showPopup) ===
    showCustomNotification('✅ Успешно!', 'Промокод "' + code + '" скопирован!');
};

// === ФУНКЦИЯ УВЕЛИЧЕНИЯ ШТРИХ-КОДА ===
window.expandBarcode = function(containerId, svgId, barcode, barcodeType) {
    var container = document.getElementById(containerId);
    var svg = document.getElementById(svgId);
    
    // Проверяем, уже увеличен или нет
    var isExpanded = container.classList.contains('barcode-expanded');
    
    if (isExpanded) {
        // Сворачиваем
        container.classList.remove('barcode-expanded');
        container.style.maxHeight = '100px';
        
        // Регенерируем маленький штрих-код
        setTimeout(function() {
            if (typeof JsBarcode !== 'undefined') {
                JsBarcode('#' + svgId, barcode, {
                    format: barcodeType,
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10
                });
            }
        }, 100);
    } else {
        // Разворачиваем
        container.classList.add('barcode-expanded');
        container.style.maxHeight = '300px';
        
        // Регенерируем большой штрих-код
        setTimeout(function() {
            if (typeof JsBarcode !== 'undefined') {
                JsBarcode('#' + svgId, barcode, {
                    format: barcodeType,
                    width: 4,
                    height: 100,
                    displayValue: true,
                    fontSize: 18,
                    margin: 15
                });
            }
        }, 100);
    }
};

// === КАСТОМНОЕ УВЕДОМЛЕНИЕ ===
window.showCustomNotification = function(title, message) {
    // Создаём элемент уведомления
    var notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = 
        '<div class="notification-content">' +
            '<div class="notification-title">' + title + '</div>' +
            '<div class="notification-message">' + message + '</div>' +
        '</div>';
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(function() {
        notification.classList.add('show');
    }, 10);
    
    // Убираем через 3 секунды
    setTimeout(function() {
        notification.classList.remove('show');
        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 3000);
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
    var content = document.getElementById('additionalContent');
    var toggle = document.querySelector('.additional-toggle');
    var icon = toggle.querySelector('.toggle-icon');
    
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
document.getElementById('searchInput').oninput = function() {
    var active = document.querySelector('.cat-btn.active');
    if (active && active.innerText.indexOf('🗂 Все') === -1) {
        var catName = active.innerText.split(' ')[1];
        var cat = allCategories.find(function(c) { return c.name.indexOf(catName) !== -1; });
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
