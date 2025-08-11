// 强制字体设置脚本
(function() {
    'use strict';
    
    let isEnabled = true;
    let observer = null;
    let checkInterval = null;
    let currentLanguage = 'zh_CN'; // 默认语言为简体中文
    let fontsLoaded = false;
    
    // 字体映射表
    const fontMap = {
        'zh_CN': 'LXGWWenKaiGB-Regular', // 简体中文
        'zh_TW': 'LXGWWenKaiTC-Regular', // 繁体中文
        'ko': 'LXGWWenKaiGB-Regular',    // 韩语
        'ja': 'KleeOne-Regular',         // 日语
        'en': 'KleeOne-Regular',         // 英语
        'ms': 'KleeOne-Regular'          // 马来语
    };
    
    // 字体列表
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
    
    // 加载字体
    function loadFonts() {
        if (fontsLoaded) return Promise.resolve(true);
        
        // 确定字体文件的基础URL
        let baseUrl = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            baseUrl = chrome.runtime.getURL('');
        } else {
            // 回退到相对路径
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
                        console.error(`字体 ${font.family} 加载失败:`, error);
                        resolve(false); // 即使失败也继续尝试其他字体
                    });
            });
        });
        
        return Promise.all(fontPromises).then(results => {
            fontsLoaded = results.some(result => result); // 如果至少有一个字体加载成功
            return fontsLoaded;
        });
    }
    
    // 检查插件是否启用和语言设置
    function checkEnabled() {
        // 首先加载字体
        loadFonts().then(() => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.get(['fontForceEnabled', 'selectedLanguage'], function(result) {
                    isEnabled = result.fontForceEnabled !== false; // 默认启用
                    currentLanguage = result.selectedLanguage || 'zh_CN'; // 如果没有保存的语言设置，使用默认值
                    if (isEnabled) {
                        applyFontForce();
                        startObserving();
                    } else {
                        removeFontForce();
                        stopObserving();
                    }
                });
            } else {
                // 如果chrome API不可用，默认启用
                applyFontForce();
                startObserving();
            }
        });
    }
    
    // 应用字体强制
    function applyFontForce() {
        if (!isEnabled) return;
        
        // 确保字体已加载
        loadFonts().then(() => {
            // 获取当前语言对应的字体，如果不存在则使用默认字体
            const font = fontMap[currentLanguage] || fontMap['zh_CN'];
            
            // 创建样式元素
            let style = document.getElementById('force-font-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'force-font-style';
            }
            
            // 根据当前语言添加对应的字体类
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
            
            // 添加到head
            if (document.head) {
                document.head.appendChild(style);
            } else {
                // 如果head还没有加载，等待
                document.addEventListener('DOMContentLoaded', function() {
                    if (document.head && isEnabled) {
                        document.head.appendChild(style);
                    }
                });
            }

            // 为html元素添加对应的语言字体类
            if (document.documentElement) {
                // 移除所有语言字体类
                Object.keys(fontMap).forEach(lang => {
                    document.documentElement.classList.remove(`font-${lang}`);
                });
                // 添加当前语言的字体类
                document.documentElement.classList.add(`font-${currentLanguage}`);
            }
        });
    }
    
    // 移除字体强制
    function removeFontForce() {
        const style = document.getElementById('force-font-style');
        if (style) {
            style.remove();
        }
    }
    
    // 开始监听动态变化
    function startObserving() {
        if (!isEnabled || observer) return;
        
        observer = new MutationObserver(function(mutations) {
            if (!isEnabled) return;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 对新添加的元素应用语言字体类
                            node.classList.add(`font-${currentLanguage}`);
                            // 对其子元素也应用语言字体类
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
        
        // 定期检查并重新应用字体（防止被其他脚本覆盖）
        if (!checkInterval) {
            checkInterval = setInterval(function() {
                if (isEnabled) {
                    // 确保html元素始终有当前语言的字体类
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
    
    // 停止监听
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
    
    // 监听来自popup的消息
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
    
    // 暴露全局方法用于测试
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

    // 初始化
    checkEnabled();
})();
