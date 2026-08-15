// Font forcing script - targeted replacement
(function() {
    'use strict';
    
    let isEnabled = true;
    let observer = null;
    let checkInterval = null;
    let currentLanguage = 'zh_CN';
    let fontsLoaded = false;
    
    // Font mapping table
    const fontMap = {
        'zh_CN': 'system-ui',
        'zh_TW': 'system-ui',
        'ko': 'system-ui',
        'ja': 'system-ui',
        'en': 'system-ui',
    };
    
    // Font list
    const fonts = [
        {
            family: 'system-ui',
            url: 'woff2'
        },
        {
            family: 'system-ui',
            url: 'woff2'
        },
        {
            family: 'system-ui',
            url: 'woff2'
        }
    ];
    
    // Target fonts: only replace elements using these fonts
    // Extend this list as needed
    const targetFonts = [
        // Microsoft YaHei
        'Microsoft YaHei', '微软雅黑',
        // DengXian
        'DengXian', '等线',
        // Xiaomi fonts
        'MiSans', '小米字体',
        // Apple Chinese fonts
        'PingFang SC', 'PingFangSC', 'PingFang HK', 'PingFangHK',
        'PingFang TC', 'PingFangTC', '苹方', '苹果字体',
        // Additional common Chinese system fonts
        'SimSun', '宋体',
        'SimHei', '黑体',
        'KaiTi', '楷体',
        'FangSong', '仿宋',
        'NSimSun', '新宋体',
        'Microsoft JhengHei', '微軟正黑體',
        'PMingLiU', '新細明體',
        'MingLiU', '細明體',
        'DFKai-SB', '標楷體',
        // System font standardization: replace non-standard web fonts
        'Mona Sans VF',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Noto Sans Backtick Fix',
        'Noto Sans',
        'Helvetica',
        'Arial',
        'Segoe UI'
    ];
    
    // Build a Set for O(1) lookup (lowercased)
    const targetFontSet = new Set(targetFonts.map(f => f.toLowerCase()));
    
    // Load fonts
    function loadFonts() {
        if (fontsLoaded) return Promise.resolve(true);
        
        let baseUrl = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            baseUrl = chrome.runtime.getURL('');
        } else {
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
                        resolve(false);
                    });
            });
        });
        
        return Promise.all(fontPromises).then(results => {
            fontsLoaded = results.some(result => result);
            return fontsLoaded;
        });
    }
    
    // Check if an element's computed font-family contains any target font
    function isTargetFontElement(el) {
        // Skip elements that are already processed
        if (el.hasAttribute('data-force-font-processed')) return false;
        
        // Check computed font-family
        try {
            const computedFamily = getComputedStyle(el).fontFamily.toLowerCase();
            const families = computedFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
            return families.some(f => targetFontSet.has(f));
        } catch (e) {
            return false;
        }
    }
    
    // Scan DOM and mark elements that use target fonts
    function scanAndMarkTargetFonts(root) {
        root = root || document.documentElement;
        if (!root) return;
        
        // Process the root element itself
        if (root.nodeType === Node.ELEMENT_NODE && isTargetFontElement(root)) {
            root.setAttribute('data-force-font', 'true');
        }
        if (root.nodeType === Node.ELEMENT_NODE) {
            root.setAttribute('data-force-font-processed', 'true');
        }
        
        // Process all descendants
        const allElements = root.querySelectorAll('*');
        allElements.forEach(el => {
            if (isTargetFontElement(el)) {
                el.setAttribute('data-force-font', 'true');
            }
            el.setAttribute('data-force-font-processed', 'true');
        });
    }
    
    // Clear all data-force-font markers
    function clearForceFontMarkers(root) {
        root = root || document.documentElement;
        if (!root) return;
        
        if (root.nodeType === Node.ELEMENT_NODE) {
            root.removeAttribute('data-force-font');
            root.removeAttribute('data-force-font-processed');
        }
        
        const marked = root.querySelectorAll('[data-force-font], [data-force-font-processed]');
        marked.forEach(el => {
            el.removeAttribute('data-force-font');
            el.removeAttribute('data-force-font-processed');
        });
    }
    
    // Check if extension is enabled and language settings
    function checkEnabled() {
        loadFonts().then(() => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.get(['fontForceEnabled', 'selectedLanguage'], function(result) {
                    isEnabled = result.fontForceEnabled !== false;
                    currentLanguage = result.selectedLanguage || 'zh_CN';
                    if (isEnabled) {
                        applyFontForce();
                        startObserving();
                    } else {
                        removeFontForce();
                        stopObserving();
                    }
                });
            } else {
                applyFontForce();
                startObserving();
            }
        });
    }
    
    // Apply font forcing (targeted)
    function applyFontForce() {
        if (!isEnabled) return;
        
        loadFonts().then(() => {
            const font = fontMap[currentLanguage] || fontMap['zh_CN'];
            
            // Create/update style element
            let style = document.getElementById('force-font-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'force-font-style';
            }
            
            const supportsCssLayers = CSS && CSS.supports && CSS.supports('@layer force-font');
        
            if (supportsCssLayers) {
                style.textContent = `
                @layer force-font {
                    ${fontRules}
                }
                @layer {
                    /* Empty layer to make it highest priority */
                }
                `;
            } else {
                style.textContent = fontRules;
            }
            
            // Add to head
            if (document.head) {
                document.head.appendChild(style);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    if (document.head && isEnabled) {
                        document.head.appendChild(style);
                    }
                });
            }
            
            // Add language font class to html element
            if (document.documentElement && isEnabled) {
                Object.keys(fontMap).forEach(lang => {
                    document.documentElement.classList.remove(`font-${lang}`);
                });
                document.documentElement.classList.add(`font-${currentLanguage}`);
            }
            
            // Scan DOM and mark elements with target fonts
            scanAndMarkTargetFonts();
        });
    }
    
    // Remove font forcing
    function removeFontForce() {
        const style = document.getElementById('force-font-style');
        if (style) {
            style.remove();
        }
        
        // Clear all markers
        clearForceFontMarkers();
        
        // Remove language font class from html element
        if (document.documentElement) {
            Object.keys(fontMap).forEach(lang => {
                document.documentElement.classList.remove(`font-${lang}`);
            });
        }
    }
    
    // Start observing dynamic changes
    function startObserving() {
        if (!isEnabled || observer) return;
        
        // Monitor body for new elements
        observer = new MutationObserver(function(mutations) {
            if (!isEnabled) return;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Scan the new node and its descendants for target fonts
                            scanAndMarkTargetFonts(node);
                            // Also add language font class
                            node.classList.add(`font-${currentLanguage}`);
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
        
        // Throttle function
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        }
        
        // Throttled re-scan for CSS changes
        const throttledReapply = throttle(function() {
            // Clear old markers and re-scan (CSS may have changed)
            clearForceFontMarkers();
            applyFontForce();
        }, 500);
        
        // Monitor head for CSS changes
        let headObserver = new MutationObserver(function(mutations) {
            if (!isEnabled) return;
            
            let cssChanged = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            (node.tagName.toLowerCase() === 'style' ||
                             (node.tagName.toLowerCase() === 'link' && node.getAttribute('rel') === 'stylesheet'))) {
                            cssChanged = true;
                        }
                    });
                } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
                    if (mutation.target.tagName && (
                        mutation.target.tagName.toLowerCase() === 'style' ||
                        (mutation.target.tagName.toLowerCase() === 'link' &&
                         mutation.target.getAttribute('rel') === 'stylesheet' &&
                         mutation.attributeName === 'href'))) {
                        cssChanged = true;
                    }
                }
            });
            
            if (cssChanged) {
                setTimeout(function() {
                    throttledReapply();
                }, 100);
            }
        });
        
        if (document.head) {
            headObserver.observe(document.head, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['href', 'rel']
            });
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                if (isEnabled && document.head) {
                    headObserver.observe(document.head, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributes: true,
                        attributeFilter: ['href', 'rel']
                    });
                }
            });
        }
        
        // Periodic re-scan to catch any missed elements
        if (!checkInterval) {
            checkInterval = setInterval(function() {
                if (isEnabled) {
                    // Re-scan for newly appeared target-font elements
                    scanAndMarkTargetFonts();
                }
            }, 3000);
        }
        
        // Store observers for cleanup
        window.__forceFontObservers = window.__forceFontObservers || [];
        window.__forceFontObservers.push(observer, headObserver);
    }
    
    // Stop observing
    function stopObserving() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        if (window.__forceFontObservers) {
            window.__forceFontObservers.forEach(function(obs) {
                obs.disconnect();
            });
            window.__forceFontObservers = [];
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