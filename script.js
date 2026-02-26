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
var selectedCategories = [];

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
        catalog: 'Каталог',
        favorites: 'Избранное',
        emptyFavorites: 'В избранном пока пусто',
        addToFavorites: 'Добавить в избранное',
        removeFromFavorites: 'В избранном',
        share: 'Поделиться',
        settings: 'Настройки',
        language: 'Язык',
        notifications: 'Уведомления',
        clearHistory: 'Очистить историю поиска',
        discount: 'Мин. скидка',
        sort: 'Сортировка',
        applyFilters: 'Применить',
        allCategories: 'Все категории',
        anyDiscount: 'Любая',
        popularity: 'По популярности',
        alphabet: 'По алфавиту',
        byDiscount: 'По размеру скидки',
        byDate: 'По дате добавления',
        loading: 'Загрузка...',
        notFound: 'Ничего не найдено',
        showBarcode: 'Показать штрих-код',
        copyCode: 'Скопировать промокод',
        goToLink: 'Перейти по ссылке',
        showAtCheckout: 'Покажите штрих-код на кассе',
        copied: 'Успешно!',
        codeCopied: 'Промокод скопирован!',
        additionalConditions: 'Дополнительные условия',
        recentSearches: 'Недавние поиски',
        enabled: 'Включены',
        disabled: 'Отключены'
    },
    en: {
        searchPlaceholder: '🔍 Find brand...',
        catalog: 'Catalog',
        favorites: 'Favorites',
        emptyFavorites: 'No favorites yet',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'In favorites',
        share: 'Share',
        settings: 'Settings',
        language: 'Language',
        notifications: 'Notifications',
        clearHistory: 'Clear search history',
        discount: 'Min. discount',
        sort: 'Sort by',
        applyFilters: 'Apply',
        allCategories: 'All categories',
        anyDiscount: 'Any',
        popularity: 'By popularity',
        alphabet: 'Alphabetically',
        byDiscount: 'By discount size',
        byDate: 'By date added',
        loading: 'Loading...',
        notFound: 'Nothing found',
        showBarcode: 'Show barcode',
        copyCode: 'Copy promo code',
        goToLink: 'Go to link',
        showAtCheckout: 'Show barcode at checkout',
        copied: 'Success!',
        codeCopied: 'Promo code copied!',
        additionalConditions: 'Additional conditions',
        recentSearches: 'Recent searches',
        enabled: 'Enabled',
        disabled: 'Disabled'
    },
    de: {
        searchPlaceholder: '🔍 Marke finden...',
        catalog: 'Katalog',
        favorites: 'Favoriten',
        emptyFavorites: 'Noch keine Favoriten',
        addToFavorites: 'Zu Favoriten hinzufügen',
        removeFromFavorites: 'In Favoriten',
        share: 'Teilen',
        settings: 'Einstellungen',
        language: 'Sprache',
        notifications: 'Benachrichtigungen',
        clearHistory: 'Verlauf löschen',
        discount: 'Min. Rabatt',
        sort: 'Sortieren nach',
        applyFilters: 'Anwenden',
        allCategories: 'Alle Kategorien',
        anyDiscount: 'Beliebig',
        popularity: 'Nach Beliebtheit',
        alphabet: 'Alphabetisch',
        byDiscount: 'Nach Rabattgröße',
        byDate: 'Nach Datum',
        loading: 'Laden...',
        notFound: 'Nichts gefunden',
        showBarcode: 'Barcode anzeigen',
        copyCode: 'Code kopieren',
        goToLink: 'Zum Link',
        showAtCheckout: 'Barcode an der Kasse zeigen',
        copied: 'Erfolg!',
        codeCopied: 'Code kopiert!',
        additionalConditions: 'Zusätzliche Bedingungen',
        recentSearches: 'Letzte Suchen',
        enabled: 'Aktiviert',
        disabled: 'Deaktiviert'
    }
};

var t = translations[userLanguage];

// === ОТСЛЕЖИВАНИЕ ДЕЙСТВИЙ ===
async function trackAction(action, data) {
    if (!userId) return;
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
        await fetch(SUPABASE_URL + '/rest/v1/analytics', {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
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
    
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function(btn) {
        if (btn.dataset.tab === 'catalog') {
            btn.textContent = t.catalog;
        } else if (btn.dataset.tab === 'favorites') {
            btn.textContent = t.favorites;
        }
    });
    
    var filterLabels = document.querySelectorAll('.filter-group label');
    if (filterLabels[0]) filterLabels[0].textContent = t.discount + ':';
    if (filterLabels[1]) filterLabels[1].textContent = t.sort + ':';
    
    var applyBtn = document.querySelector('.apply-filters-btn');
    if (applyBtn) applyBtn.textContent = t.applyFilters;
    
    var settingLabels = document.querySelectorAll('.setting-item label');
    if (settingLabels[0]) settingLabels[0].textContent = t.language + ':';
    if (settingLabels[1]) settingLabels[1].textContent = t.notifications + ':';
    
    var clearBtn = document.querySelector('.clear-history-btn');
    if (clearBtn) clearBtn.textContent = t.clearHistory;
    
    var shareBtn = document.querySelector('.share-btn');
    if (shareBtn) shareBtn.textContent = t.share;
    
    var additionalToggle = document.querySelector('.additional-toggle');
    if (additionalToggle) {
        additionalToggle.firstChild.textContent = t.additionalConditions + ' ';
    }
    
    updateSelectedCategoriesText();
}

// === ОБНОВЛЕНИЕ ТЕКСТА КАТЕГОРИЙ ===
function updateSelectedCategoriesText() {
    var textElement = document.getElementById('selectedCategoriesText');
    if (!textElement) return;
    
    if (selectedCategories.length === 0) {
        textElement.textContent = t.allCategories;
    } else if (selectedCategories.length === 1) {
        var cat = allCategories.find(function(c) { return c.id === selectedCategories[0]; });
        textElement.textContent = cat ? cat.name : t.allCategories;
    } else {
        textElement.textContent = selectedCategories.length + ' ' + (userLanguage === 'ru' ? 'категории' : 'categories');
    }
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
        
        var offersUrl = SUPABASE_URL + '/rest/v1/offers?is_active=eq.true';
        var offersResponse = await fetch(offersUrl, { headers: HEADERS });
        allOffers = await offersResponse.json();
        console.log('✅ Оферы загружены:', allOffers.length);
        
        var codesUrl = SUPABASE_URL + '/rest/v1/promo_codes?is_verified=eq.true';
        var codesResponse = await fetch(codesUrl, { headers: HEADERS });
        allPromoCodes = await codesResponse.json();
        console.log('✅ Промокоды загружены:', allPromoCodes.length);
        
        await loadUserFavorites();
        console.log('✅ Избранное загружено:', userFavorites.length);
        
        if (userId) {
            await loadSearchHistory();
            await loadUserSettings();
        }
        
        console.log('🎉 ВСЕГО ЗАГРУЖЕНО:', {
            categories: allCategories.length,
            offers: allOffers.length,
            codes: allPromoCodes.length
        });
        
        currentTab = 'catalog';
        renderCategoryList();
        filterOffers();
        
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

// === ЗАГРУЗКА ИЗБРАННОГО (ИЗ LOCALSTORAGE) ===
async function loadUserFavorites() {
    try {
        if (typeof localStorage === 'undefined') {
            console.log('⚠️ localStorage недоступен');
            userFavorites = [];
            return;
        }
        
        var stored = localStorage.getItem('userFavorites');
        console.log('🔍 localStorage userFavorites:', stored);
        
        if (stored && stored !== 'null') {
            userFavorites = JSON.parse(stored);
            console.log('✅ Избранное загружено:', userFavorites.length, 'оферов');
        } else {
            userFavorites = [];
            console.log('ℹ️ Избранное пустое');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки избранного:', error);
        userFavorites = [];
    }
}

// === ЗАГРУЗКА ИСТОРИИ ПОИСКА ===
async function loadSearchHistory() {
    if (!userId) return;
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

// === ЗАГРУЗКА НАСТРОЕК ===
async function loadUserSettings() {
    if (!userId) return;
    try {
        var response = await fetch(SUPABASE_URL + '/rest/v1/user_settings?user_id=eq.' + userId, { headers: HEADERS });
        if (response.ok) {
            var settings = await response.json();
            if (settings && settings.length > 0) {
                userLanguage = settings[0].language || 'ru';
                t = translations[userLanguage];
                
                var langSelect = document.getElementById('languageSelect');
                var notifSelect = document.getElementById('notificationsSelect');
                
                if (langSelect) langSelect.value = userLanguage;
                if (notifSelect) notifSelect.value = settings[0].notifications_enabled !== false ? 'true' : 'false';
                
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
        var notifSelect = document.getElementById('notificationsSelect');
        var settings = {
            user_id: userId,
            language: userLanguage,
            notifications_enabled: notifSelect ? notifSelect.value === 'true' : true,
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

// === ОТРИСОВКА СПИСКА КАТЕГОРИЙ ===
function renderCategoryList() {
    var list = document.getElementById('categoryList');
    if (!list) return;
    
    list.innerHTML = '';
    
    var allItem = document.createElement('div');
    allItem.className = 'category-item';
    allItem.innerHTML = '<input type="checkbox" id="cat-all" ' + (selectedCategories.length === 0 ? 'checked' : '') + '><label for="cat-all">' + t.allCategories + '</label>';
    allItem.onclick = function(e) {
        if (e.target.tagName !== 'LABEL') selectAllCategories();
    };
    list.appendChild(allItem);
    
    allCategories.forEach(function(cat) {
        var item = document.createElement('div');
        item.className = 'category-item';
        var isChecked = selectedCategories.indexOf(cat.id) !== -1;
        item.innerHTML = '<input type="checkbox" id="cat-' + cat.id + '" ' + (isChecked ? 'checked' : '') + '><label for="cat-' + cat.id + '">' + cat.name + '</label>';
        item.onclick = function(e) {
            if (e.target.tagName !== 'LABEL') toggleCategory(cat.id);
        };
        list.appendChild(item);
    });
}

// === ВЫБРАТЬ ВСЕ КАТЕГОРИИ ===
function selectAllCategories() {
    selectedCategories = [];
    updateSelectedCategoriesText();
    renderCategoryList();
}

// === ПЕРЕКЛЮЧИТЬ КАТЕГОРИЮ ===
function toggleCategory(categoryId) {
    var index = selectedCategories.indexOf(categoryId);
    if (index === -1) {
        selectedCategories.push(categoryId);
    } else {
        selectedCategories.splice(index, 1);
    }
    updateSelectedCategoriesText();
    renderCategoryList();
}

// === ПРИМЕНИТЬ ВЫБОР КАТЕГОРИЙ ===
window.applyCategorySelection = function() {
    toggleCategoryModal();
    filterOffers();
    trackAction('categories_selected', { count: selectedCategories.length });
};

// === ОТКРЫТЬ/ЗАКРЫТЬ МОДАЛКУ КАТЕГОРИЙ ===
window.toggleCategoryModal = function() {
    var modal = document.getElementById('categoryModal');
    var btn = document.querySelector('.category-select-btn');
    if (!modal) return;
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        if (btn) btn.classList.add('active');
        renderCategoryList();
    } else {
        modal.classList.add('hidden');
        if (btn) btn.classList.remove('active');
    }
};

// === ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ===
window.switchTab = function(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
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
        filterOffers();
    }
    trackAction('tab_switched', { tab: tabName });
};

// === ОТРИСОВКА ИЗБРАННОГО (ИСПРАВЛЕНО) ===
function renderFavorites() {
    var container = document.getElementById('offersContainer');
    var emptyState = document.getElementById('emptyFavorites');
    if (!container) return;
    
    console.log('📋 renderFavorites вызвана');
    console.log('📋 userFavorites:', userFavorites);
    console.log('📋 allOffers.length:', allOffers.length);
    
    if (userFavorites.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        console.log('⚠️ userFavorites пустой');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    container.classList.remove('hidden');  // ← ПОКАЗАТЬ КОНТЕЙНЕР!
    container.innerHTML = '';
    
    var favoriteOfferIds = userFavorites.map(function(f) { return f.offer_id; });
    console.log('📋 favoriteOfferIds:', favoriteOfferIds);
    
    var favoriteOffers = allOffers.filter(function(o) {
        return favoriteOfferIds.indexOf(o.id) !== -1;
    });
    
    console.log('📋 favoriteOffers найдено:', favoriteOffers.length);
    console.log('📋 favoriteOffers:', favoriteOffers);
    
    if (favoriteOffers.length === 0) {
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        console.log('⚠️ Не найдено оферов с такими ID');
        return;
    }
    
    favoriteOffers.forEach(function(offer, idx) {
        console.log('📋 Обработка офера #' + idx + ':', offer.id, offer.brand_name);
        
        var offerCodes = allPromoCodes.filter(function(c) { return c.offer_id === offer.id; });
        console.log('📋 offerCodes:', offerCodes.length);
        
        var activeCodes = offerCodes.filter(function(c) {
            return !c.expires_at || new Date(c.expires_at) > new Date();
        });
        
        console.log('📋 activeCodes:', activeCodes.length);
        
        if (activeCodes.length === 0) {
            console.log('⚠️ Нет активных кодов для офера', offer.id);
            return;
        }
        
        var card = document.createElement('div');
        card.className = 'offer-card';
        card.innerHTML = '<div><div class="brand-name">' + offer.brand_name + '</div><div class="brand-desc">' + (offer.description || '') + '</div></div><div class="card-actions"><button class="favorite-toggle active" onclick="toggleFavorite(event, ' + offer.id + ')">★</button></div>';
        card.onclick = function(e) {
            if (!e.target.classList.contains('favorite-toggle')) openModal(offer, activeCodes);
        };
        container.appendChild(card);
        console.log('✅ Карточка добавлена:', offer.brand_name);
    });
}

// === ИЗБРАННОЕ ИЗ СПИСКА ===
window.toggleFavoriteFromList = function(event, offerId) {
    event.stopPropagation();
    toggleFavorite(event, offerId);
};

// === ФИЛЬТРАЦИЯ ОФЕРОВ ===
function filterOffers() {
    var searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.length >= 2 && userId) {
        saveSearchToHistory(searchTerm);
    }
    
    var filtered = allOffers.filter(function(offer) {
        var matchCat = selectedCategories.length === 0 || selectedCategories.indexOf(offer.category_id) !== -1;
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
        card.innerHTML = '<div><div class="brand-name">' + offer.brand_name + '</div><div class="brand-desc">' + (offer.description || '') + '</div></div><div class="card-actions"><button class="favorite-toggle ' + (isFavorite ? 'active' : '') + '" onclick="toggleFavoriteFromList(event, ' + offer.id + ')">' + (isFavorite ? '★' : '☆') + '</button></div>';
        card.onclick = function(e) {
            if (!e.target.classList.contains('favorite-toggle')) openModal(offer, activeCodes);
        };
        container.appendChild(card);
    });
}

// === СОХРАНЕНИЕ ПОИСКА ===
async function saveSearchToHistory(query) {
    if (!userId) return;
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
    var searchInput = document.getElementById('searchInput');
    if (!container) return;
    
    if (recentSearches.length === 0 || (searchInput && searchInput.value === '' && document.activeElement !== searchInput)) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    container.innerHTML = '<div class="recent-title">' + t.recentSearches + '</div>';
    
    recentSearches.forEach(function(search) {
        var item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = search.search_query;
        item.onclick = function() {
            searchInput.value = search.search_query;
            filterOffers();
        };
        container.appendChild(item);
    });
}

// === ОЧИСТКА ИСТОРИИ ===
window.clearSearchHistory = async function() {
    if (!userId) {
        recentSearches = [];
        displayRecentSearches();
        showCustomNotification('✅', 'История очищена');
        return;
    }
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
    var minDiscount = parseInt(document.getElementById('discountFilter').value);
    var sortBy = document.getElementById('sortFilter').value;
    
    var filtered = allOffers.filter(function(offer) {
        var matchCat = selectedCategories.length === 0 || selectedCategories.indexOf(offer.category_id) !== -1;
        var matchDiscount = minDiscount === 0 || (offer.discount_amount && offer.discount_amount >= minDiscount);
        return matchCat && matchDiscount;
    });
    
    filtered.sort(function(a, b) {
        if (sortBy === 'alphabet') return a.brand_name.localeCompare(b.brand_name);
        if (sortBy === 'discount') return (b.discount_amount || 0) - (a.discount_amount || 0);
        if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return (b.views_count || 0) - (a.views_count || 0);
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
    trackAction('filters_applied', { discount: minDiscount, sort: sortBy });
};

// === ИЗБРАННОЕ: ДОБАВИТЬ/УДАЛИТЬ ===
window.toggleFavorite = function(event, offerId) {
    event.stopPropagation();
    
    console.log('⭐ toggleFavorite вызвана, offerId:', offerId);
    console.log('⭐ userFavorites до:', userFavorites);
    
    var isFavorite = userFavorites.some(function(f) { return f.offer_id === offerId; });
    
    if (isFavorite) {
        userFavorites = userFavorites.filter(function(f) { return f.offer_id !== offerId; });
        console.log('⭐ Удалено из избранного:', offerId);
        showCustomNotification('⭐', 'Удалено из избранного');
    } else {
        userFavorites.push({ user_id: userId, offer_id: offerId });
        console.log('⭐ Добавлено в избранное:', offerId);
        showCustomNotification('⭐', 'Добавлено в избранное');
    }
    
    console.log('⭐ userFavorites после:', userFavorites);
    
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
            console.log('💾 Сохранено в localStorage');
            var check = localStorage.getItem('userFavorites');
            console.log('💾 Проверка localStorage:', check);
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
    }
    
    if (currentTab === 'favorites') {
        console.log('🔄 Вызов renderFavorites()');
        renderFavorites();
    } else {
        console.log('🔄 Вызов filterOffers()');
        filterOffers();
    }
    
    trackAction('favorite_toggled', { offer_id: offerId, added: !isFavorite });
};

// === ИЗБРАННОЕ ИЗ МОДАЛКИ ===
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
    var text = btn ? btn.querySelector('.favorite-text') : null;
    if (text) {
        text.textContent = isFavorite ? t.removeFromFavorites : t.addToFavorites;
    }
    if (btn) {
        if (isFavorite) btn.classList.add('active');
        else btn.classList.remove('active');
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
            codeDiv.innerHTML = '<div class="link-header">Бонус по ссылке:</div><div class="code-text code-link">' + codeText + '</div><div class="code-bonus">' + bonusInfo + '</div><div class="code-action-btn" onclick="openLink(\'' + codeText + '\')">' + t.goToLink + '</div>';
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
    
    setTimeout(function() { notification.classList.add('show'); }, 10);
    setTimeout(function() {
        notification.classList.remove('show');
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
};

// === ПОДЕЛИТЬСЯ ===
window.shareOffer = function() {
    if (!currentOffer) return;
    
    var offer = currentOffer.offer;
    var codes = currentOffer.codes;
    var shareText = offer.brand_name + '\n\n';
    
    if (offer.description) shareText += offer.description + '\n\n';
    
    shareText += 'Промокоды:\n';
    codes.forEach(function(code, i) {
        shareText += (i + 1) + '. ' + code.code_text;
        if (code.bonus_info) shareText += ' - ' + code.bonus_info;
        shareText += '\n';
    });
    
    shareText += '\nОткрыто в Promo Bot';
    
    if (navigator.share) {
        navigator.share({
            title: offer.brand_name,
            text: shareText,
            url: window.location.href
        }).then(function() { trackAction('offer_shared', { brand: offer.brand_name }); });
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

// === ЗАКРЫТЬ МОДАЛКУ ===
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

// === ИЗМЕНЕНИЕ УВЕДОМЛЕНИЙ ===
window.changeNotifications = function(value) {
    saveUserSettings();
};

// === ПОИСК ===
var searchInput = document.getElementById('searchInput');
var recentSearchesContainer = document.getElementById('recentSearches');

if (searchInput) {
    searchInput.onfocus = function() { displayRecentSearches(); };
    searchInput.oninput = function() { filterOffers(); displayRecentSearches(); };
    searchInput.onblur = function() {
        setTimeout(function() {
            if (recentSearchesContainer) recentSearchesContainer.classList.add('hidden');
        }, 200);
    };
}

// === СКРЫТИЕ НЕДАВНИХ ПОИСКОВ ПРИ СКРОЛЛЕ ===
window.addEventListener('scroll', function() {
    if (recentSearchesContainer && !recentSearchesContainer.classList.contains('hidden')) {
        recentSearchesContainer.classList.add('hidden');
    }
});

// === ЗАКРЫТИЕ ПО КЛИКУ ВНЕ МОДАЛКИ ===
var modal = document.getElementById('modal');
if (modal) {
    modal.onclick = function(e) { if (e.target === this) closeModal(); };
}

var categoryModal = document.getElementById('categoryModal');
if (categoryModal) {
    categoryModal.onclick = function(e) { if (e.target === this) toggleCategoryModal(); };
}

// === ОТСЛЕЖИВАНИЕ ОТКРЫТИЯ ===
if (userId) {
    trackAction('app_opened', {});
    console.log('📱 Mini App opened, User ID:', userId);
} else {
    console.warn('⚠️ User ID not available');
}

// === CUSTOM DROPDOWN ФУНКЦИИ ===

// Открыть/закрыть dropdown
window.toggleCustomSelect = function(name) {
    console.log('🔽 toggleCustomSelect:', name);
    
    // ЗАКРЫТЬ ВСЕ dropdowns сначала
    document.querySelectorAll('.custom-select-options').forEach(function(opt) {
        opt.classList.remove('show');
    });
    document.querySelectorAll('.custom-select-selected').forEach(function(sel) {
        sel.classList.remove('active');
    });
    
    // Открыть текущий
    var options = document.getElementById(name + 'Options');
    var container = document.getElementById(name + 'Container');
    var selected = container.querySelector('.custom-select-selected');
    
    if (options && selected) {
        options.classList.add('show');
        selected.classList.add('active');
    }
    
    console.log('✅ toggleCustomSelect completed');
};

// Выбрать опцию
window.selectCustomOption = function(name, value, text) {
    console.log('✅ selectCustomOption:', name, '=', value);
    
    var container = document.getElementById(name + 'Container');
    var selected = container.querySelector('.custom-select-selected');
    var textSpan = selected.querySelector('.custom-select-text');
    var options = document.getElementById(name + 'Options');
    
    // Обновить текст
    textSpan.textContent = text;
    
    // Обновить выделение
    options.querySelectorAll('.custom-select-option').forEach(function(opt) {
        opt.classList.remove('selected');
        if (opt.dataset.value === value) {
            opt.classList.add('selected');
        }
    });
    
    // Закрыть dropdown
    options.classList.remove('show');
    selected.classList.remove('active');
    
    // Вызвать функцию изменения
    if (name === 'languageSelect') {
        changeLanguage(value);
    } else if (name === 'notificationsSelect') {
        changeNotifications(value);
    }
    // Для фильтров - ждём кнопку "Применить"
};

// Закрыть dropdowns при клике вне
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select-options').forEach(function(opt) {
            opt.classList.remove('show');
        });
        document.querySelectorAll('.custom-select-selected').forEach(function(sel) {
            sel.classList.remove('active');
        });
    }
});

// === ИНИЦИАЛИЗАЦИЯ ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        tg.expand();
        loadData();
    });
} else {
    tg.expand();
    loadData();
}

// === ИНИЦИАЛИЗАЦИЯ CUSTOM DROPDOWNS ===
function initCustomSelects() {
    // Добавить обработчики на опции
    ['discountFilter', 'sortFilter', 'languageSelect', 'notificationsSelect'].forEach(function(name) {
        var options = document.getElementById(name + 'Options');
        if (options) {
            options.querySelectorAll('.custom-select-option').forEach(function(opt) {
                opt.onclick = function() {
                    selectCustomOption(name, this.dataset.value, this.textContent);
                };
            });
        }
    });
    
    // Установить текущие значения из старых select
    setTimeout(function() {
        var discountFilter = document.getElementById('discountFilter');
        var sortFilter = document.getElementById('sortFilter');
        var languageSelect = document.getElementById('languageSelect');
        var notificationsSelect = document.getElementById('notificationsSelect');
        
        if (discountFilter) {
            var container = document.getElementById('discountFilterContainer');
            if (container) {
                container.querySelector('.custom-select-text').textContent = discountFilter.options[discountFilter.selectedIndex].text;
            }
        }
        
        if (sortFilter) {
            var container = document.getElementById('sortFilterContainer');
            if (container) {
                container.querySelector('.custom-select-text').textContent = sortFilter.options[sortFilter.selectedIndex].text;
            }
        }
        
        if (languageSelect) {
            var container = document.getElementById('languageSelectContainer');
            if (container) {
                container.querySelector('.custom-select-text').textContent = languageSelect.options[languageSelect.selectedIndex].text;
            }
        }
        
        if (notificationsSelect) {
            var container = document.getElementById('notificationsSelectContainer');
            if (container) {
                container.querySelector('.custom-select-text').textContent = notificationsSelect.options[notificationsSelect.selectedIndex].text;
            }
        }
    }, 100);
}

// Вызвать после загрузки данных
var originalLoadData = loadData;
loadData = function() {
    originalLoadData().then(function() {
        initCustomSelects();
    });
};


