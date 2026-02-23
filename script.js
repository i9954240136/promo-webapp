// === ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===
var tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
var userId = tg.initDataUnsafe?.user?.id;
var SUPABASE_URL = 'https://yfvvsbcvrwvahmceutvi.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnZzYmN2cnd2YWhtY2V1dHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTIxNjgsImV4cCI6MjA4NzA2ODE2OH0.ZVR8Hf9INeheMM1-sSQBKqng3xklVCWZxNKDe6j0iIQ';
var currentOffer = null;
var currentTab = 'catalog';
var userLanguage = 'ru';
var userFavorites = [];
var recentSearches = [];

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

// === ЛОКАЛИЗАЦИЯ ===
var translations = {
    ru: {
        searchPlaceholder: '🔍 Найти бренд...',
        catalog: '📚 Каталог',
        favorites: '⭐ Избранное',
        emptyFavorites: 'В избранном пока пусто',
        addToFavorites: 'В избранное',
        removeFromFavorites: 'Удалить из избранного',
        share: '🔗 Поделиться',
        settings: '⚙️ Настройки',
        language: '🌐 Язык',
        notifications: '🔔 Уведомления',
        clearHistory: '🗑️ Очистить историю',
        categories: '📂 Категория',
        discount: '💰 Мин. скидка',
        sort: '📊 Сортировка',
        applyFilters: 'Применить',
        allCategories: 'Все категории',
        anyDiscount: 'Любая',
        popularity: 'По популярности',
        alphabet: 'По алфавиту',
        byDiscount: 'По размеру скидки',
        byDate: 'По дате добавления',
        loading: 'Загрузка...',
        notFound: 'Ничего не найдено',
        showBarcode: '📱 Показать штрих-код',
        copyCode: '📋 Скопировать промокод',
        goToLink: '🔗 Перейти по ссылке',
        showAtCheckout: '📱 Покажите штрих-код на кассе',
        copied: 'Успешно!',
        codeCopied: 'Промокод скопирован!',
        additionalConditions: '📋 Дополнительные условия',
        recentSearches: '🕐 Недавние поиски'
    },
    en: {
        searchPlaceholder: '🔍 Find brand...',
        catalog: '📚 Catalog',
        favorites: '⭐ Favorites',
        emptyFavorites: 'No favorites yet',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites',
        share: '🔗 Share',
        settings: '⚙️ Settings',
        language: '🌐 Language',
        notifications: '🔔 Notifications',
        clearHistory: '🗑️ Clear history',
        categories: '📂 Category',
        discount: '💰 Min. discount',
        sort: '📊 Sort by',
        applyFilters: 'Apply',
        allCategories: 'All categories',
        anyDiscount: 'Any',
        popularity: 'By popularity',
        alphabet: 'Alphabetically',
        byDiscount: 'By discount size',
        byDate: 'By date added',
        loading: 'Loading...',
        notFound: 'Nothing found',
        showBarcode: '📱 Show barcode',
        copyCode: '📋 Copy promo code',
        goToLink: '🔗 Go to link',
        showAtCheckout: '📱 Show barcode at checkout',
        copied: 'Success!',
        codeCopied: 'Promo code copied!',
        additionalConditions: '📋 Additional conditions',
        recentSearches: '🕐 Recent searches'
    },
    de: {
        searchPlaceholder: '🔍 Marke finden...',
        catalog: '📚 Katalog',
        favorites: '⭐ Favoriten',
        emptyFavorites: 'Noch keine Favoriten',
        addToFavorites: 'Zu Favoriten hinzufügen',
        removeFromFavorites: 'Aus Favoriten entfernen',
        share: '🔗 Teilen',
        settings: '⚙️ Einstellungen',
        language: '🌐 Sprache',
        notifications: '🔔 Benachrichtigungen',
        clearHistory: '🗑️ Verlauf löschen',
        categories: '📂 Kategorie',
        discount: '💰 Min. Rabatt',
        sort: '📊 Sortieren nach',
        applyFilters: 'Anwenden',
        allCategories: 'Alle Kategorien',
        anyDiscount: 'Beliebig',
        popularity: 'Nach Beliebtheit',
        alphabet: 'Alphabetisch',
        byDiscount: 'Nach Rabattgröße',
        byDate: 'Nach Datum',
        loading: 'Laden...',
        notFound: 'Nichts gefunden',
        showBarcode: '📱 Barcode anzeigen',
        copyCode: '📋 Code kopieren',
        goToLink: '🔗 Zum Link',
        showAtCheckout: '📱 Barcode an der Kasse zeigen',
        copied: 'Erfolg!',
        codeCopied: 'Code kopiert!',
        additionalConditions: '📋 Zusätzliche Bedingungen',
        recentSearches: '🕐 Letzte Suchen'
    }
};

var t = translations[userLanguage];

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

// === ОБНОВЛЕНИЕ ТЕКСТОВ ИНТЕРФЕЙСА ===
function updateUITexts() {
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;
    
    // Вкладки
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function(btn) {
        if (btn.dataset.tab === 'catalog') {
            btn.innerHTML = '📚 ' + t.catalog;
        } else if (btn.dataset.tab === 'favorites') {
            btn.innerHTML = '⭐ ' + t.favorites;
        } else if (btn.dataset.tab === 'settings') {
            btn.innerHTML = '⚙️';
        }
    });
    
    // Фильтры
    var filterLabels = document.querySelectorAll('.filter-group label');
    if (filterLabels[0]) filterLabels[0].innerHTML = '📂 ' + t.categories + ':';
    if (filterLabels[1]) filterLabels[1].innerHTML = '💰 ' + t.discount + ':';
    if (filterLabels[2]) filterLabels[2].innerHTML = '📊 ' + t.sort + ':';
    
    // Кнопки
    var applyBtn = document.querySelector('.apply-filters-btn');
    if (applyBtn) applyBtn.textContent = t.applyFilters;
    
    // Настройки
    var settingLabels = document.querySelectorAll('.setting-item label');
    if (settingLabels[0]) settingLabels[0].innerHTML = '🌐 ' + t.language;
    if (settingLabels[1]) settingLabels[1].innerHTML = '🔔 ' + t.notifications;
    
    var clearBtn = document.querySelector('.clear-history-btn');
    if (clearBtn) clearBtn.textContent = t.clearHistory;
    
    // Кнопки в модалке
    var shareBtn = document.querySelector('.share-btn');
    if (shareBtn) shareBtn.innerHTML = t.share;
    
    var additionalToggle = document.querySelector('.additional-toggle');
    if (additionalToggle) {
        additionalToggle.innerHTML = t.additionalConditions + ' <span class="toggle-icon">▼</span>';
    }
    
    // Перерисовываем категории
    renderCategories();
}

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData() {
    try {
        console.log('🔄 Начало загрузки данных...');
        var container = document.getElementById('offersContainer');
        if (!container) {
            console.error('❌ Контейнер offersContainer не найден');
            return;
        }
        allCategories = await supabaseFetch('categories', { method: 'GET' });
        allCategories.sort(function(a, b) { return a.name.localeCompare(b.name); });
        console.log('✅ Категории загружены:', allCategories.length);
        populateCategoryFilter();
        var offersUrl = SUPABASE_URL + '/rest/v1/offers?is_active=eq.true';
        var offersResponse = await fetch(offersUrl, { headers: HEADERS });
        allOffers = await offersResponse.json();
        console.log('✅ Оферы загружены:', allOffers.length);
        var codesUrl = SUPABASE_URL + '/rest/v1/promo_codes?is_verified=eq.true';
        var codesResponse = await fetch(codesUrl, { headers: HEADERS });
        allPromoCodes = await codesResponse.json();
        console.log('✅ Промокоды загружены:', allPromoCodes.length);
        if (userId) {
            await loadUserFavorites();
            console.log('✅ Избранное загружено:', userFavorites.length);
        }
        if (userId) {
            await loadSearchHistory();
        }
        if (userId) {
            await loadUserSettings();
        }
        console.log('🎉 ВСЕГО ЗАГРУЖЕНО:', {
            categories: allCategories.length,
            offers: allOffers.length,
            codes: allPromoCodes.length
        });
        currentTab = 'catalog';
        renderCategories();
        filterOffers('all', null);
        var emptyFavorites = document.getElementById('emptyFavorites');
        if (emptyFavorites) {
            emptyFavorites.classList.add('hidden');
        }
    } catch (error) {
        console.error('❌ ОШИБКА ЗАГРУЗКИ:', error);
        var container = document.getElementById('offersContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Ошибка загрузки данных<br><small>' + error.message + '</small></p>';
        }
    }
}

// === ЗАГРУЗКА ИЗБРАННОГО ===
async function loadUserFavorites() {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/favorites?user_id=eq.' + userId, { headers: HEADERS });
        if (response.ok) {
            userFavorites = await response.json();
            console.log('✅ Избранное загружено:', userFavorites.length);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки избранного:', error);
    }
}

// === ЗАГРУЗКА ИСТОРИИ ПОИСКА ===
async function loadSearchHistory() {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/search_history?user_id=eq.' + userId + '&order=created_at.desc&limit=5', { headers: HEADERS });
        if (response.ok) {
            recentSearches = await response.json();
            displayRecentSearches();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки истории:', error);
    }
}

// === ЗАГРУЗКА НАСТРОЕК ПОЛЬЗОВАТЕЛЯ ===
async function loadUserSettings() {
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/user_settings?user_id=eq.' + userId, { headers: HEADERS });
        if (response.ok) {
            var settings = await response.json();
            if (settings && settings.length > 0) {
                userLanguage = settings[0].language || 'ru';
                t = translations[userLanguage];
                var langSelect = document.getElementById('languageSelect');
                var notifToggle = document.getElementById('notificationsToggle');
                if (langSelect) langSelect.value = userLanguage;
                if (notifToggle) notifToggle.checked = settings[0].notifications_enabled !== false;
                updateUITexts();
            }
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки настроек:', error);
    }
}

// === СОХРАНЕНИЕ НАСТРОЕК ===
async function saveUserSettings() {
    if (!userId) return;
    try {
        var settings = {
            user_id: userId,
            language: userLanguage,
            notifications_enabled: document.getElementById('notificationsToggle').checked,
            updated_at: new Date().toISOString()
        };
        var checkResponse = await fetch(SUPABASE_URL + '/rest/v1/user_settings?user_id=eq.' + userId, { headers: HEADERS });
        if (checkResponse.ok) {
            var existing = await checkResponse.json();
            if (existing && existing.length > 0) {
                await fetch(SUPABASE_URL + '/rest/v1/user_settings?id=eq.' + existing[0].id, {
                    method: 'PATCH',
                    headers: HEADERS,
                    body: JSON.stringify(settings)
                });
            } else {
                await fetch(SUPABASE_URL + '/rest/v1/user_settings', {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify(settings)
                });
            }
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения настроек:', error);
    }
}

// === ЗАПОЛНЕНИЕ ФИЛЬТРА КАТЕГОРИЙ ===
function populateCategoryFilter() {
    var select = document.getElementById('categoryFilter');
    if (!select) return;
    select.innerHTML = '<option value="all">' + t.allCategories + '</option>';
    allCategories.forEach(function(cat) {
        var option = document.createElement('option');
        option.value = cat.id;
        option.textContent = (cat.icon_emoji || '📦') + ' ' + cat.name;
        select.appendChild(option);
    });
}

// === ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ===
window.switchTab = function(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    var offersContainer = document.getElementById('offersContainer');
    var emptyFavorites = document.getElementById('emptyFavorites');
    if (tabName === 'favorites') {
        offersContainer.classList.add('hidden');
        if (emptyFavorites) emptyFavorites.classList.remove('hidden');
        renderFavorites();
    } else {
        offersContainer.classList.remove('hidden');
        if (emptyFavorites) emptyFavorites.classList.add('hidden');
        filterOffers('all', document.querySelector('.cat-btn.active'));
    }
    trackAction('tab_switched', { tab: tabName });
};

// === ОТРИСОВКА ИЗБРАННОГО ===
function renderFavorites() {
    var container = document.getElementById('offersContainer');
    var emptyState = document.getElementById('emptyFavorites');
    
    if (!container) {
        console.error('❌ Контейнер не найден');
        return;
    }
    
    console.log('📋 renderFavorites вызвана. Избранное:', userFavorites.length);
    console.log('Все оферы:', allOffers.length);
    
    if (userFavorites.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = '';
    
    // Фильтруем оферы по избранным
    var favoriteOfferIds = userFavorites.map(function(f) { return f.offer_id; });
    console.log('ID избранных оферов:', favoriteOfferIds);
    
    var favoriteOffers = allOffers.filter(function(o) {
        return favoriteOfferIds.indexOf(o.id) !== -1;
    });
    
    console.log('Найдено избранных оферов:', favoriteOffers.length);
    
    if (favoriteOffers.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    favoriteOffers.forEach(function(offer) {
        var offerCodes = allPromoCodes.filter(function(c) { return c.offer_id === offer.id; });
        var activeCodes = offerCodes.filter(function(c) {
            return !c.expires_at || new Date(c.expires_at) > new Date();
        });
        
        if (activeCodes.length === 0) return;
        
        var isFavorite = userFavorites.some(function(f) { return f.offer_id === offer.id; });
        
        var card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = '<div><div class="brand-name">' + offer.brand_name + '</div><div class="brand-desc">' + (offer.description || '') + '</div></div><div class="card-actions"><button class="favorite-toggle ' + (isFavorite ? 'active' : '') + '" onclick="toggleFavorite(event, ' + offer.id + ')">⭐</button><span>➡️</span></div>';
        card.onclick = function(e) {
            if (!e.target.classList.contains('favorite-toggle')) {
                openModal(offer, activeCodes);
            }
        };
        container.appendChild(card);
    });
}

// === ОТРИСОВКА КАТЕГОРИЙ ===
function renderCategories() {
    var container = document.getElementById('categoriesList');
    if (!container) return;
    container.innerHTML = '<button class="cat-btn active" onclick="filterOffers(\'all\', this)">🗂 ' + t.allCategories + '</button>';
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
    if (searchTerm.length >= 2 && userId) {
        saveSearchToHistory(searchTerm);
    }
    var filtered = allOffers.filter(function(offer) {
        var matchCat = catId === 'all' || offer.category_id === catId;
        var matchSearch = offer.brand_name.toLowerCase().indexOf(searchTerm) !== -1 || (offer.description && offer.description.toLowerCase().indexOf(searchTerm) !== -1);
        return matchCat && matchSearch;
    });
    var container = document.getElementById('offersContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">' + t.notFound + '</p>';
        return;
    }
    container.innerHTML = '';
    filtered.forEach(function(offer) {
        var offerCodes = allPromoCodes.filter(function(c) { return c.offer_id === offer.id; });
        var activeCodes = offerCodes.filter(function(c) {
            return !c.expires_at || new Date(c.expires_at) > new Date();
        });
        if (activeCodes.length === 0) return;
        var isFavorite = userFavorites.some(function(f) { return f.offer_id === offer.id; });
        var card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = '<div><div class="brand-name">' + offer.brand_name + '</div><div class="brand-desc">' + (offer.description || '') + '</div></div><div class="card-actions"><button class="favorite-toggle ' + (isFavorite ? 'active' : '') + '" onclick="toggleFavorite(event, ' + offer.id + ')">⭐</button><span>➡️</span></div>';
        card.onclick = function(e) {
            if (!e.target.classList.contains('favorite-toggle')) {
                openModal(offer, activeCodes);
            }
        };
        container.appendChild(card);
    });
};

// === СОХРАНЕНИЕ ПОИСКА В ИСТОРИЮ ===
async function saveSearchToHistory(query) {
    try {
        await fetch(SUPABASE_URL + '/rest/v1/search_history', {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ user_id: userId, search_query: query })
        });
        recentSearches.unshift({ search_query: query, created_at: new Date().toISOString() });
        recentSearches = recentSearches.slice(0, 5);
        displayRecentSearches();
    } catch (error) {
        console.error('❌ Ошибка сохранения поиска:', error);
    }
}

// === ОТОБРАЖЕНИЕ НЕДАВНИХ ПОИСКОВ ===
function displayRecentSearches() {
    var container = document.getElementById('recentSearches');
    if (!container) return;
    if (recentSearches.length === 0) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    container.innerHTML = '<div class="recent-title">' + t.recentSearches + '</div>';
    recentSearches.forEach(function(search) {
        var item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = '🕐 ' + search.search_query;
        item.onclick = function() {
            document.getElementById('searchInput').value = search.search_query;
            filterOffers('all', null);
        };
        container.appendChild(item);
    });
}

// === ОЧИСТКА ИСТОРИИ ПОИСКА ===
window.clearSearchHistory = async function() {
    if (!userId) return;
    try {
        await fetch(SUPABASE_URL + '/rest/v1/search_history?user_id=eq.' + userId, { method: 'DELETE', headers: HEADERS });
        recentSearches = [];
        displayRecentSearches();
        showCustomNotification('✅', 'История очищена');
    } catch (error) {
        console.error('❌ Ошибка очистки истории:', error);
    }
};

// === ПЕРЕКЛЮЧЕНИЕ ФИЛЬТРОВ ===
window.toggleFilters = function() {
    var panel = document.getElementById('filtersPanel');
    if (panel) panel.classList.toggle('hidden');
};

// === ПРИМЕНЕНИЕ ФИЛЬТРОВ ===
window.applyFilters = function() {
    var categoryId = document.getElementById('categoryFilter').value;
    var minDiscount = parseInt(document.getElementById('discountFilter').value);
    var sortBy = document.getElementById('sortFilter').value;
    var filtered = allOffers.filter(function(offer) {
        var matchCat = categoryId === 'all' || offer.category_id == categoryId;
        var matchDiscount = minDiscount === 0 || (offer.discount_amount && offer.discount_amount >= minDiscount);
        return matchCat && matchDiscount;
    });
    filtered.sort(function(a, b) {
        if (sortBy === 'alphabet') {
            return a.brand_name.localeCompare(b.brand_name);
        } else if (sortBy === 'discount') {
            return (b.discount_amount || 0) - (a.discount_amount || 0);
        } else if (sortBy === 'newest') {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        } else {
            return (b.views_count || 0) - (a.views_count || 0);
        }
    });
    var container = document.getElementById('offersContainer');
    container.innerHTML = '';
    filtered.forEach(function(offer) {
        var offerCodes = allPromoCodes.filter(function(c) { return c.offer_id === offer.id; });
        var activeCodes = offerCodes.filter(function(c) {
            return !c.expires_at || new Date(c.expires_at) > new Date();
        });
        if (activeCodes.length === 0) return;
        var card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = '<div><div class="brand-name">' + offer.brand_name + '</div><div class="brand-desc">' + (offer.description || '') + '</div></div><div>➡️</div>';
        card.onclick = function() { openModal(offer, activeCodes); };
        container.appendChild(card);
    });
    document.getElementById('filtersPanel').classList.add('hidden');
    trackAction('filters_applied', { category: categoryId, discount: minDiscount, sort: sortBy });
};

// === ИЗБРАННОЕ: ДОБАВИТЬ/УДАЛИТЬ ===
window.toggleFavorite = async function(event, offerId) {
    event.stopPropagation();
    if (!userId) {
        showCustomNotification('⚠️', 'Войдите в Telegram');
        return;
    }
    var isFavorite = userFavorites.some(function(f) { return f.offer_id === offerId; });
    try {
        if (isFavorite) {
            var fav = userFavorites.find(function(f) { return f.offer_id === offerId; });
            if (fav) {
                await fetch(SUPABASE_URL + '/rest/v1/favorites?id=eq.' + fav.id, { method: 'DELETE', headers: HEADERS });
                userFavorites = userFavorites.filter(function(f) { return f.offer_id !== offerId; });
                showCustomNotification('⭐', 'Удалено из избранного');
            }
        } else {
            await fetch(SUPABASE_URL + '/rest/v1/favorites', {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify({ user_id: userId, offer_id: offerId })
            });
            userFavorites.push({ user_id: userId, offer_id: offerId });
            showCustomNotification('⭐', 'Добавлено в избранное');
        }
        if (currentTab === 'favorites') {
            renderFavorites();
        } else {
            filterOffers('all', document.querySelector('.cat-btn.active'));
        }
        trackAction('favorite_toggled', { offer_id: offerId, added: !isFavorite });
    } catch (error) {
        console.error('❌ Ошибка избранного:', error);
        showCustomNotification('❌', 'Ошибка');
    }
};

// === ИЗБРАННОЕ ИЗ МОДАЛЬНОГО ОКНА ===
window.toggleFavoriteFromModal = function() {
    if (!currentOffer) return;
    var offerId = currentOffer.offer.id;
    var isFavorite = userFavorites.some(function(f) { return f.offer_id === offerId; });
    var event = { stopPropagation: function() {} };
    toggleFavorite(event, offerId);
    updateFavoriteButton(isFavorite);
};

// === ОБНОВЛЕНИЕ КНОПКИ ИЗБРАННОГО ===
function updateFavoriteButton(isFavorite) {
    var btn = document.querySelector('.favorite-btn');
    if (!btn) return;
    var icon = btn.querySelector('.favorite-icon');
    var text = btn.querySelector('.favorite-text');
    if (isFavorite) {
        btn.classList.add('active');
        if (icon) icon.textContent = '⭐';
        if (text) text.textContent = t.removeFromFavorites;
    } else {
        btn.classList.remove('active');
        if (icon) icon.textContent = '☆';
        if (text) text.textContent = t.addToFavorites;
    }
}

// === МОДАЛЬНОЕ ОКНО ===
window.openModal = function(offer, codes) {
    currentOffer = { offer: offer, codes: codes };
    trackAction('brand_viewed', { brand: offer.brand_name, offer_id: offer.id });
    var mBrand = document.getElementById('mBrand');
    if (mBrand) mBrand.innerText = offer.brand_name;
    var codesContainer = document.getElementById('mCode');
    if (!codesContainer) return;
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
            codeDiv.innerHTML = '<div class="link-header">🎁 ' + (userLanguage === 'ru' ? 'Бонус по ссылке' : 'Bonus via link') + ':</div><div class="code-text code-link">' + codeText + '</div><div class="code-bonus">' + bonusInfo + '</div><div class="code-action-btn" onclick="openLink(\'' + codeText + '\')">' + t.goToLink + '</div>';
        } else if (hasBarcode) {
            var barcodeId = 'barcode-' + index + '-' + Date.now();
            var barcodeImageId = 'barcode-img-' + index;
            codeDiv.innerHTML = '<div class="code-text">' + codeText + '</div><div class="code-bonus">' + bonusInfo + '</div><div class="barcode-container" id="' + barcodeImageId + '"><svg id="' + barcodeId + '"></svg></div><div class="code-hint">' + t.showAtCheckout + '</div><div class="code-action-btn barcode-expand-btn" onclick="expandBarcode(\'' + barcodeImageId + '\', \'' + barcodeId + '\', \'' + barcode + '\', \'' + barcodeType + '\')">' + t.showBarcode + '</div>';
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
            codeDiv.innerHTML = '<div class="code-text">' + codeText + '</div><div class="code-bonus">' + bonusInfo + '</div><div class="code-action-btn" onclick="copyPromoCode(\'' + codeText + '\')">' + t.copyCode + '</div>';
        }
        codesContainer.appendChild(codeDiv);
    });
    var isFavorite = userFavorites.some(function(f) { return f.offer_id === offer.id; });
    updateFavoriteButton(isFavorite);
    var hintDiv = document.createElement('div');
    hintDiv.className = 'modal-hint';
    hintDiv.innerHTML = '💡 ' + (userLanguage === 'ru' ? 'Нажмите на кнопку' : 'Tap the button');
    codesContainer.appendChild(hintDiv);
    var additionalSection = document.getElementById('additionalSection');
    var additionalContent = document.getElementById('additionalContent');
    if (offer.additional_info) {
        additionalContent.innerHTML = offer.additional_info.replace(/\n/g, '<br>');
        if (additionalSection) additionalSection.style.display = 'block';
    } else {
        if (additionalSection) additionalSection.style.display = 'none';
    }
    var modal = document.getElementById('modal');
    if (modal) modal.classList.remove('hidden');
};

// === КОПИРОВАНИЕ ПРОМОКОДА ===
window.copyPromoCode = function(code) {
    navigator.clipboard.writeText(code);
    trackAction('promo_copied', { code: code, brand: currentOffer?.offer?.brand_name });
    showCustomNotification('✅', t.codeCopied);
};

// === УВЕЛИЧЕНИЕ ШТРИХ-КОДА ===
window.expandBarcode = function(containerId, svgId, barcode, barcodeType) {
    var container = document.getElementById(containerId);
    var svg = document.getElementById(svgId);
    if (!container) return;
    var isExpanded = container.classList.contains('barcode-expanded');
    if (isExpanded) {
        container.classList.remove('barcode-expanded');
        container.style.maxHeight = '100px';
        setTimeout(function() {
            if (typeof JsBarcode !== 'undefined' && svg) {
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
        container.classList.add('barcode-expanded');
        container.style.maxHeight = '300px';
        setTimeout(function() {
            if (typeof JsBarcode !== 'undefined' && svg) {
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
    var notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = '<div class="notification-content"><div class="notification-title">' + title + '</div><div class="notification-message">' + message + '</div></div>';
    document.body.appendChild(notification);
    setTimeout(function() {
        notification.classList.add('show');
    }, 10);
    setTimeout(function() {
        notification.classList.remove('show');
        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 3000);
};

// === ПОДЕЛИТЬСЯ (с промокодами) ===
window.shareOffer = function() {
    if (!currentOffer) return;
    var offer = currentOffer.offer;
    var codes = currentOffer.codes;
    var shareText = '🎁 ' + offer.brand_name + '\n\n';
    if (offer.description) {
        shareText += offer.description + '\n\n';
    }
    shareText += '📋 Промокоды:\n';
    codes.forEach(function(code, i) {
        shareText += (i + 1) + '. ' + code.code_text;
        if (code.bonus_info) {
            shareText += ' - ' + code.bonus_info;
        }
        shareText += '\n';
    });
    shareText += '\nОткрыто в Promo Bot';
    if (navigator.share) {
        navigator.share({
            title: offer.brand_name,
            text: shareText,
            url: window.location.href
        }).then(function() {
            trackAction('offer_shared', { brand: offer.brand_name });
        });
    } else {
        navigator.clipboard.writeText(shareText);
        showCustomNotification('🔗', 'Текст скопирован');
    }
};

// === ОТКРЫТЬ ССЫЛКУ ===
window.openLink = function(url) {
    trackAction('link_clicked', { url: url, brand: currentOffer?.offer?.brand_name });
    tg.openLink(url);
};

// === ЗАКРЫТЬ МОДАЛЬНОЕ ОКНО ===
window.closeModal = function() {
    var modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden');
};

// === ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ ===
window.toggleAdditional = function() {
    var content = document.getElementById('additionalContent');
    var toggle = document.querySelector('.additional-toggle');
    var icon = toggle ? toggle.querySelector('.toggle-icon') : null;
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
        if (toggle) toggle.classList.add('active');
    } else {
        content.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        if (toggle) toggle.classList.remove('active');
    }
};

// === НАСТРОЙКИ ===
window.toggleSettings = function() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.toggle('hidden');
};

// === СМЕНА ЯЗЫКА ===
window.changeLanguage = function(lang) {
    userLanguage = lang;
    t = translations[lang];
    updateUITexts();
    saveUserSettings();
    trackAction('language_changed', { language: lang });
};

// === ПОИСК ===
var searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.oninput = function() {
        var active = document.querySelector('.cat-btn.active');
        if (active && active.innerText.indexOf('🗂') === -1) {
            var catName = active.innerText.split(' ')[1];
            var cat = allCategories.find(function(c) { return c.name.indexOf(catName) !== -1; });
            if (cat) filterOffers(cat.id, active);
        } else {
            filterOffers('all', active);
        }
    };
}

// === ЗАКРЫТИЕ ПО КЛИКУ ВНЕ МОДАЛКИ ===
var modal = document.getElementById('modal');
if (modal) {
    modal.onclick = function(e) {
        if (e.target === this) closeModal();
    };
}

// === ОТСЛЕЖИВАНИЕ ОТКРЫТИЯ MINI APP ===
if (userId) {
    trackAction('app_opened', {});
    console.log('📱 Mini App opened, User ID:', userId);
} else {
    console.warn('⚠️ User ID not available');
}

// === ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        tg.expand();
        loadData();
    });
} else {
    tg.expand();
    loadData();
}

