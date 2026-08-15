// Global variables
let toggleBtn, statusDot, statusText, languageSelect;
let languageSelectButton, languageSelectLabel, languageOptionsContainer, languageOptions;

function updateUI(isEnabled) { 
    if (isEnabled) { 
        toggleBtn.classList.add('active'); 
        toggleBtn.setAttribute('aria-checked', 'true'); 
    } else { 
        toggleBtn.classList.remove('active'); 
        toggleBtn.setAttribute('aria-checked', 'false'); 
    } 
    
    if (statusDot) { 
        if (isEnabled) { 
            statusDot.classList.remove('inactive'); 
        } else { 
            statusDot.classList.add('inactive'); 
        } 
    } 
    
    toggleBtn.setAttribute('role', 'switch'); 
    toggleBtn.setAttribute('tabindex', '0'); 
    toggleBtn.setAttribute('aria-label', isEnabled ? (chrome.i18n.getMessage('disableFontForce') || 'Disable font force') : (chrome.i18n.getMessage('enableFontForce') || 'Enable font force')); 
    
    updateStatusText(); 
}

function toggleLanguageDropdown() {
    const expanded = languageSelectButton.getAttribute('aria-expanded') === 'true';
    languageSelectButton.setAttribute('aria-expanded', String(!expanded));
    languageOptionsContainer.setAttribute('aria-hidden', String(expanded));
    languageOptionsContainer.classList.toggle('open', !expanded);
}

function closeLanguageDropdown() {
    if (!languageSelectButton) return;
    languageSelectButton.setAttribute('aria-expanded', 'false');
    languageOptionsContainer.setAttribute('aria-hidden', 'true');
    languageOptionsContainer.classList.remove('open');
}

function setLanguageOption(value) {
    if (!languageSelect) return;
    languageSelect.value = value;
    const option = languageOptions.find(item => item.dataset.value === value);
    if (option) {
        languageOptions.forEach(item => item.classList.remove('active'));
        option.classList.add('active');
        languageSelectLabel.textContent = option.textContent;
    }
    closeLanguageDropdown();
    changeLanguage();
}

function syncLanguageUI(language) {
    if (!languageSelect || !languageSelectLabel) return;
    const option = languageOptions.find(item => item.dataset.value === language);
    if (option) {
        option.classList.add('active');
        languageSelectLabel.textContent = option.textContent;
    }
    languageSelect.value = language;
}

function addRippleEffect(element, event) { 
    const ripple = document.createElement('span'); 
    const rect = element.getBoundingClientRect(); 
    const size = Math.max(rect.width, rect.height); 
    const x = event.clientX - rect.left - size / 2; 
    const y = event.clientY - rect.top - size / 2; 
    
    ripple.style.cssText = ` 
        position: absolute; 
        width: ${size}px; 
        height: ${size}px; 
        left: ${x}px; 
        top: ${y}px; 
        background: rgba(255, 255, 255, 0.3); 
        border-radius: 50%; 
        transform: scale(0); 
        animation: ripple 0.6s ease-out; 
        pointer-events: none; 
    `; 
    
    if (!document.getElementById('ripple-style')) { 
        const style = document.createElement('style'); 
        style.id = 'ripple-style'; 
        style.textContent = ` 
            @keyframes ripple { 
                to { 
                    transform: scale(2); 
                    opacity: 0; 
                } 
            } 
        `; 
        document.head.appendChild(style); 
    } 
    
    element.style.position = 'relative'; 
    element.style.overflow = 'hidden'; 
    element.appendChild(ripple); 
    
    setTimeout(() => { 
        ripple.remove(); 
    }, 600); 
} 

document.addEventListener('DOMContentLoaded', function() { 
    toggleBtn = document.getElementById('toggleBtn'); 
    statusDot = document.getElementById('statusDot'); 
    statusText = document.getElementById('statusText'); 
    languageSelect = document.getElementById('languageSelect'); 
    languageSelectButton = document.getElementById('languageSelectButton');
    languageSelectLabel = document.getElementById('languageSelectLabel');
    languageOptionsContainer = document.getElementById('languageOptions');
    languageOptions = Array.from(document.querySelectorAll('.custom-option'));
    
    initializeI18n(); 
    
    loadCurrentState(); 
    
    toggleBtn.addEventListener('click', toggleFontForce); 
    
    languageSelectButton.addEventListener('click', toggleLanguageDropdown);
    languageOptions.forEach(option => {
        option.addEventListener('click', () => setLanguageOption(option.dataset.value));
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLanguageOption(option.dataset.value);
            }
        });
    });

    document.addEventListener('click', (event) => {
        const isInside = event.target.closest('#languageSelectWrapper');
        if (!isInside) {
            closeLanguageDropdown();
        }
    });

    toggleBtn.addEventListener('keydown', function(e) { 
        if (e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault(); 
            toggleFontForce(); 
        } 
    }); 
    
    if (window.matchMedia) { 
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)'); 
        mediaQuery.addListener(function(e) { 
            console.log('Theme changed to:', e.matches ? 'dark' : 'light'); 
        }); 
    } 
    
    setTimeout(() => { 
        document.body.style.opacity = '1'; 
    }, 100); 
});

// Translation cache
let translations = {};

function loadTranslations(language, callback) {
    if (translations[language]) {
        callback();
        return;
    }
    
    fetch(`_locales/${language}/messages.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load translation file: ${language}`);
            }
            return response.json();
        })
        .then(data => {
            translations[language] = data;
            callback();
        })
        .catch(error => {
            console.error(error);
            if (language !== 'en') {
                loadTranslations('en', callback);
            } else {
                callback(messageKey);
            }
        });
}

function getMessage(messageKey, language) {
    if (!translations[language] || !translations[language][messageKey]) {
        if (language !== 'en' && translations['en'] && translations['en'][messageKey]) {
            return translations['en'][messageKey].message;
        }
        return messageKey;
    }
    return translations[language][messageKey].message;
}

function initializeI18n() {
    chrome.storage.sync.get(['selectedLanguage'], function(result) {
        const savedLanguage = result.selectedLanguage || chrome.i18n.getUILanguage().replace('-', '_');
        const languageSelect = document.getElementById('languageSelect');
        
        if (languageSelect) {
            languageSelect.value = savedLanguage;
        }
        syncLanguageUI(savedLanguage);
        
        updateFontFamily(savedLanguage);
        
        loadTranslations(savedLanguage, function() {
            applyTranslations(savedLanguage);
        });
    });
}

// Update popup font family based on language (popup always uses system-ui)
function updateFontFamily(language) {
    document.body.style.fontFamily = 'system-ui, sans-serif';
}

function applyTranslations(language) {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const messageKey = element.getAttribute('data-i18n');
        const message = getMessage(messageKey, language);
        
        if (message) {
            element.textContent = message;
        }
    });
    
    updateStatusText(language);
    updateFontFamily(language);
}

function changeLanguage() {
    const languageSelect = document.getElementById('languageSelect');
    const selectedLanguage = languageSelect.value;
    
    chrome.storage.sync.set({selectedLanguage: selectedLanguage}, function() {
        loadTranslations(selectedLanguage, function() {
            applyTranslations(selectedLanguage);
        });
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'changeLanguage',
                    language: selectedLanguage
                }).catch(() => {
                    // Ignore errors
                });
            }
        });
    });
}

function updateStatusText(language) {
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (statusText && toggleBtn) {
        const isEnabled = toggleBtn.classList.contains('active');
        const messageKey = isEnabled ? 'statusEnabled' : 'statusDisabled';
        const message = getMessage(messageKey, language);
        
        if (message) {
            statusText.textContent = message;
        }
    }
}

function loadCurrentState() {
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const isEnabled = result.fontForceEnabled !== false;
        updateUI(isEnabled);
    });
}

function toggleFontForce() {
    const toggleBtn = document.getElementById('toggleBtn');
    
    addRippleEffect(toggleBtn, event);
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const currentState = result.fontForceEnabled !== false;
        const newState = !currentState;
        
        chrome.storage.sync.set({fontForceEnabled: newState}, function() {
            updateUI(newState);
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleFontForce',
                        enabled: newState
                    }).catch(() => {
                        // Ignore errors
                    });
                }
            });
        });
    });
}