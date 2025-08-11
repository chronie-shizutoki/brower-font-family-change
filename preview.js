// Simulate chrome.storage in preview mode
if (!window.chrome || !chrome.storage) {
    console.log('Running in preview mode, simulating chrome.storage');
    
    // Simulate chrome.storage.sync
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
    
    // Simulate chrome.i18n
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
    
    // Simulate chrome.tabs
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

// Load after the DOM is ready
window.addEventListener('DOMContentLoaded', function() {
    // If in preview mode, set default language
    if (!window.chrome || !chrome.storage) {
        console.log('Setting default language for preview');
        // First set default language to en, ensure translation files can be found
        chrome.storage.sync.set({'selectedLanguage': 'en'});
        // Delay after switching to zh_CN, so that the language switch effect can be demonstrated
        setTimeout(() => {
            chrome.storage.sync.set({'selectedLanguage': 'zh_CN'});
            // Manually call the initialization function
            if (window.initializeI18n) {
                initializeI18n();
            }
        }, 1000);
    }
});