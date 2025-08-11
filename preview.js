// 预览模式下模拟chrome.storage
if (!window.chrome || !chrome.storage) {
    console.log('Running in preview mode, simulating chrome.storage');
    
    // 模拟chrome.storage.sync
    window.chrome = window.chrome || {};
    chrome.storage = chrome.storage || {};
    chrome.storage.sync = {
        data: {},
        get: function(keys, callback) {
            const result = {};
            if (Array.isArray(keys)) {
                keys.forEach(key => {
                    result[key] = this.data[key];
                });
            } else if (typeof keys === 'string') {
                result[keys] = this.data[keys];
            } else if (typeof keys === 'object') {
                Object.keys(keys).forEach(key => {
                    result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
                });
            }
            setTimeout(() => callback(result), 0);
        },
        set: function(items, callback) {
            Object.assign(this.data, items);
            if (callback) {
                setTimeout(callback, 0);
            }
        }
    };
    
    // 模拟chrome.i18n
    chrome.i18n = {
        getUILanguage: function() {
            return 'en';
        },
        getMessage: function(messageKey) {
            const messages = {
                'disableFontForce': 'Disable Font Force',
                'enableFontForce': 'Enable Font Force',
                'statusEnabled': 'Font force enabled',
                'statusDisabled': 'Font force disabled'
            };
            return messages[messageKey] || messageKey;
        }
    };
    
    // 模拟chrome.tabs
    chrome.tabs = {
        query: function(queryInfo, callback) {
            setTimeout(() => callback([{id: 1}]), 0);
        },
        sendMessage: function(tabId, message, callback) {
            console.log('Sent message to tab:', message);
            if (callback) {
                setTimeout(() => callback({success: true}), 0);
            }
        }
    };
}

// 加载完成后初始化
window.addEventListener('load', function() {
    // 如果是预览模式，设置默认语言
    if (!window.chrome || !chrome.storage) {
        console.log('Setting default language for preview');
        // 先设置默认语言为en，确保翻译文件能被找到
        chrome.storage.sync.set({'selectedLanguage': 'en'});
        // 延迟后切换到zh_CN，以便演示语言切换效果
        setTimeout(() => {
            chrome.storage.sync.set({'selectedLanguage': 'zh_CN'});
            // 手动调用初始化函数
            if (window.initializeI18n) {
                initializeI18n();
            }
        }, 1000);
    }
});