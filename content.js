// Font forcing script
(function() {
    'use strict';
    
    let isEnabled = true;
    let observer = null;
    let checkInterval = null;
    let currentLanguage = 'zh_CN'; // Default language is Simplified Chinese
    let fontsLoaded = false;
    
    // Font mapping table
    const fontMap = {
        'zh_CN': 'LXGWWenKaiGB-Regular', // Simplified Chinese
        'zh_TW': 'LXGWWenKaiTC-Regular', // Traditional Chinese
        'ko': 'LXGWWenKaiGB-Regular',    // Korean
        'ja': 'KleeOne-Regular',         // Japanese
        'en': 'KleeOne-Regular',         // English
        'ms': 'KleeOne-Regular'          // Malay
    };
    
    // Font list
    const fonts = [
        {
            family: 'LXGWWenKaiGB-Regular',
            url: 'LXGWWenKaiGB-Regular.woff2'
        },
        {
            family: 'LXGWWenKaiTC-Regular',
            url: 'LXGWWenKaiTC-Regular.woff2'
        },
        {
            family: 'KleeOne-Regular',
            url: 'KleeOne-Regular.woff2'
        }
    ];
    
    // Load fonts
    function loadFonts() {
        if (fontsLoaded) return Promise.resolve(true);
        
        // Determine base URL for font files
        let baseUrl = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            baseUrl = chrome.runtime.getURL('');
        } else {
            // Fallback to relative path
            baseUrl = './';
        }
        
        const fontPromises = fonts.map(font => {
            return new Promise((resolve, reject) => {
                const fontFace = new FontFace(font.family, `url(${baseUrl}${font.url})`);
                fontFace.load()
                    .then(loadedFont => {
                        document.fonts.add(loadedFont);
                        resolve(true);
                    })
                    .catch(error => {
                        console.error(`Failed to load font ${font.family}:`, error);
                        resolve(false); // Continue trying other fonts even if this one fails
                    });
            });
        });
        
        return Promise.all(fontPromises).then(results => {
            fontsLoaded = results.some(result => result); // If at least one font loads successfully
            return fontsLoaded;
        });
    }
    
    // Check if extension is enabled and language settings
    function checkEnabled() {
        // First load fonts
        loadFonts().then(() => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.get(['fontForceEnabled', 'selectedLanguage'], function(result) {
                    isEnabled = result.fontForceEnabled !== false; // Default to enabled
                    currentLanguage = result.selectedLanguage || 'zh_CN'; // If no language setting, use default
                    if (isEnabled) {
                        applyFontForce();
                        startObserving();
                    } else {
                        removeFontForce();
                        stopObserving();
                    }
                });
            } else {
                // If chrome API is not available, enable by default
                applyFontForce();
                startObserving();
            }
        });
    }
    
    // Apply font forcing
    function applyFontForce() {
        if (!isEnabled) return;
        
        // Ensure fonts are loaded
        loadFonts().then(() => {
            // Get font corresponding to current language, use default if not exists
            const font = fontMap[currentLanguage] || fontMap['zh_CN'];
            
            // Create style element
            let style = document.getElementById('force-font-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'force-font-style';
            }
            
            // Add corresponding font class based on current language
            style.textContent = `
                * { 
                    font-family: unset !important;
                }
                .font-zh_CN, .font-ko {
                    font-family: 'LXGWWenKaiGB-Regular', sans-serif !important;
                }
                .font-zh_TW {
                    font-family: 'LXGWWenKaiTC-Regular', sans-serif !important;
                }
                .font-ja, .font-en, .font-ms {
                    font-family: 'KleeOne-Regular', sans-serif !important;
                }
                html {
                    font-family: '${font}', sans-serif !important;
                }
            `;
            
            // Add to head
            if (document.head) {
                document.head.appendChild(style);
            } else {
                // If head is not loaded yet, wait
                document.addEventListener('DOMContentLoaded', function() {
                    if (document.head && isEnabled) {
                        document.head.appendChild(style);
                    }
                });
            }

            // Add corresponding language font class to html element
            if (document.documentElement) {
                // Remove all language font classes
                Object.keys(fontMap).forEach(lang => {
                    document.documentElement.classList.remove(`font-${lang}`);
                });
                // Add current language font class
                document.documentElement.classList.add(`font-${currentLanguage}`);
            }
        });
    }
    
    // Remove font forcing
    function removeFontForce() {
        const style = document.getElementById('force-font-style');
        if (style) {
            style.remove();
        }
    }
    
    // Start observing dynamic changes
    function startObserving() {
        if (!isEnabled || observer) return;
        
        observer = new MutationObserver(function(mutations) {
            if (!isEnabled) return;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Apply language font class to newly added elements
                            node.classList.add(`font-${currentLanguage}`);
                            // Also apply language font class to their children
                            const children = node.querySelectorAll('*');
                            children.forEach(function(child) {
                                child.classList.add(`font-${currentLanguage}`);
                            });
                        }
                    });
                }
            });
        });
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                if (isEnabled && observer && document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            });
        }
        
        // Regularly check and reapply fonts (to prevent being overwritten by other scripts)
        if (!checkInterval) {
            checkInterval = setInterval(function() {
                if (isEnabled) {
                    // Ensure html element always has current language font class
                    if (document.documentElement) {
                        Object.keys(fontMap).forEach(lang => {
                            document.documentElement.classList.remove(`font-${lang}`);
                        });
                        document.documentElement.classList.add(`font-${currentLanguage}`);
                    }
                }
            }, 1000);
        }
    }
    
    // Stop observing
    function stopObserving() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }
    
    // Listen for messages from popup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === 'toggleFontForce') {
                isEnabled = request.enabled;
                if (isEnabled) {
                    applyFontForce();
                    startObserving();
                } else {
                    removeFontForce();
                    stopObserving();
                }
                sendResponse({success: true});
            } else if (request.action === 'changeLanguage') {
                currentLanguage = request.language;
                if (isEnabled) {
                    applyFontForce();
                }
                sendResponse({success: true});
            }
        });
    }
    
    // Expose global methods for testing
    window.__forceFontScript = {
        changeLanguage: function(language) {
            currentLanguage = language;
            if (isEnabled) {
                applyFontForce();
            }
        },
        toggleEnabled: function(enabled) {
            isEnabled = enabled;
            if (isEnabled) {
                applyFontForce();
                startObserving();
            } else {
                removeFontForce();
                stopObserving();
            }
        }
    }

    // Initialize
    checkEnabled();
})();
