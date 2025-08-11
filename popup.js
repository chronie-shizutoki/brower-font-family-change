// 全局变量
let toggleBtn, statusDot, statusText, languageSelect;

function updateUI(isEnabled) { 
    // 更新切换开关状态 
    if (isEnabled) { 
        toggleBtn.classList.add('active'); 
        toggleBtn.setAttribute('aria-checked', 'true'); 
    } else { 
        toggleBtn.classList.remove('active'); 
        toggleBtn.setAttribute('aria-checked', 'false'); 
    } 
    
    // 更新状态指示器 
    if (statusDot) { 
        if (isEnabled) { 
            statusDot.classList.remove('inactive'); 
        } else { 
            statusDot.classList.add('inactive'); 
        } 
    } 
    
    // 添加无障碍属性 
    toggleBtn.setAttribute('role', 'switch'); 
    toggleBtn.setAttribute('tabindex', '0'); 
    toggleBtn.setAttribute('aria-label', isEnabled ? (chrome.i18n.getMessage('disableFontForce') || '禁用字体强制') : (chrome.i18n.getMessage('enableFontForce') || '启用字体强制')); 
    
    // 更新状态文本 
    updateStatusText(); 
} 

// 添加平滑的动画效果 
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
    
    // 添加ripple动画样式 
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
    
    // 初始化国际化 
    initializeI18n(); 
    
    // 加载当前状态 
    loadCurrentState(); 
    
    // 绑定切换按钮事件 
    toggleBtn.addEventListener('click', toggleFontForce); 
    
    // 绑定语言选择器事件 
    languageSelect.addEventListener('change', changeLanguage); 
    
    // 添加键盘支持 
    toggleBtn.addEventListener('keydown', function(e) { 
        if (e.key === 'Enter' || e.key === ' ') { 
            e.preventDefault(); 
            toggleFontForce(); 
        } 
    }); 
    
    // 检测系统主题变化 
    if (window.matchMedia) { 
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)'); 
        mediaQuery.addListener(function(e) { 
            // 主题变化时可以添加额外的处理逻辑 
            console.log('Theme changed to:', e.matches ? 'dark' : 'light'); 
        }); 
    } 
    
    // 页面加载动画 
    setTimeout(() => { 
        document.body.style.opacity = '1'; 
    }, 100); 
 });

// 国际化相关函数
// 翻译缓存
let translations = {};

// 加载翻译文件
function loadTranslations(language, callback) {
    // 如果已经加载过该语言的翻译，则直接调用回调
    if (translations[language]) {
        callback();
        return;
    }
    
    // 加载翻译文件
    fetch(`_locales/${language}/messages.json`)        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载翻译文件: ${language}`);
            }
            return response.json();
        })        .then(data => {
            translations[language] = data;
            callback();
        })        .catch(error => {
            console.error(error);
            // 如果加载失败，使用默认语言
            if (language !== 'en') {
                loadTranslations('en', callback);
            } else {
                callback();
            }
        });
}

// 获取翻译文本
function getMessage(messageKey, language) {
    if (!translations[language] || !translations[language][messageKey]) {
        // 如果找不到翻译，尝试使用英语
        if (language !== 'en' && translations['en'] && translations['en'][messageKey]) {
            return translations['en'][messageKey].message;
        }
        return messageKey;
    }
    return translations[language][messageKey].message;
}

function initializeI18n() {
    // 加载保存的语言设置
    chrome.storage.sync.get(['selectedLanguage'], function(result) {
        const savedLanguage = result.selectedLanguage || chrome.i18n.getUILanguage().replace('-', '_');
        const languageSelect = document.getElementById('languageSelect');
        
        // 设置语言选择器的值
        if (languageSelect) {
            languageSelect.value = savedLanguage;
        }
        
        // 立即更新字体（不需要等待翻译加载完成）
        updateFontFamily(savedLanguage);
        
        // 加载翻译
        loadTranslations(savedLanguage, function() {
            // 应用翻译
            applyTranslations(savedLanguage);
        });
    });
}

// 根据语言更新字体
function updateFontFamily(language) {
    const body = document.body;
    
    // 字体映射关系
    const fontMap = {
        'zh_CN': 'LXGWWenKaiGB-Regular',
        'zh_TW': 'LXGWWenKaiTC-Regular',
        'ko': 'LXGWWenKaiGB-Regular',
        'ja': 'KleeOne-Regular',
        'en': 'KleeOne-Regular',
        'ms': 'KleeOne-Regular'
    };
    
    // 获取当前语言对应的字体
    const font = fontMap[language] || 'KleeOne-Regular';
    
    // 设置body的字体
    body.style.fontFamily = `${font}, sans-serif`;
}

function applyTranslations(language) {
    // 获取所有带有 data-i18n 属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const messageKey = element.getAttribute('data-i18n');
        const message = getMessage(messageKey, language);
        
        if (message) {
            element.textContent = message;
        }
    });
    
    // 更新状态文本
    updateStatusText(language);
    
    // 更新字体
    updateFontFamily(language);
}

function changeLanguage() {
    const languageSelect = document.getElementById('languageSelect');
    const selectedLanguage = languageSelect.value;
    
    // 保存语言设置
    chrome.storage.sync.set({selectedLanguage: selectedLanguage}, function() {
        // 加载新语言的翻译并应用
        loadTranslations(selectedLanguage, function() {
            applyTranslations(selectedLanguage);
        });
        
        // 通知内容脚本语言变化
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'changeLanguage',
                    language: selectedLanguage
                }).catch(() => {
                    // 忽略错误，可能是页面还没有加载内容脚本
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

// 加载当前状态函数
function loadCurrentState() {
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const isEnabled = result.fontForceEnabled !== false; // 默认启用
        updateUI(isEnabled);
    });
}

// 切换字体强制功能
function toggleFontForce() {
    const toggleBtn = document.getElementById('toggleBtn');
    
    // 添加点击波纹效果
    addRippleEffect(toggleBtn, event);
    
    // 添加触觉反馈（如果支持）
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const currentState = result.fontForceEnabled !== false;
        const newState = !currentState;
        
        // 保存新状态
        chrome.storage.sync.set({fontForceEnabled: newState}, function() {
            updateUI(newState);
            
            // 通知内容脚本状态变化
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleFontForce',
                        enabled: newState
                    }).catch(() => {
                        // 忽略错误，可能是页面还没有加载内容脚本
                    });
                }
            });
        });
    });
}