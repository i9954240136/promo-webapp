// === МОДАЛЬНОЕ ОКНО (УЛУЧШЕННАЯ ВЕРСИЯ) ===
window.openModal = function(offer, codes) {
    currentOffer = { offer, codes };
    
    document.getElementById('mBrand').innerText = offer.brand_name;
    
    // Создаём список всех промокодов
    const codesContainer = document.getElementById('mCode');
    codesContainer.innerHTML = '';
    
    // Добавляем все промокоды
    codes.forEach((code, index) => {
        const codeDiv = document.createElement('div');
        codeDiv.className = 'promo-code-item';
        codeDiv.innerHTML = `
            <div class="code-text">${code.code_text || 'AUTO'}</div>
            <div class="code-bonus">${code.bonus_info || ''}</div>
            <div class="code-hint">📋 Нажмите для копирования</div>
        `;
        codeDiv.onclick = () => {
            navigator.clipboard.writeText(code.code_text || 'AUTO');
            
            // Визуальная обратная связь
            codeDiv.style.background = '#4CAF50';
            codeDiv.style.color = '#fff';
            setTimeout(() => {
                codeDiv.style.background = '#f0f0f0';
                codeDiv.style.color = '#000';
            }, 500);
            
            tg.showPopup({ message: `✅ ${code.code_text || 'AUTO'} скопирован!` });
        };
        codesContainer.appendChild(codeDiv);
    });
    
    // Добавляем подсказку внизу
    const hintDiv = document.createElement('div');
    hintDiv.className = 'modal-hint';
    hintDiv.innerHTML = '💡 Нажмите на любой промокод, чтобы скопировать';
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
