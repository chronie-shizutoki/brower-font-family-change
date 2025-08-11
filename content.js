// 强制字体设置脚本
(function() {
    'use strict';
    
    let isEnabled = true;
    let observer = null;
    let checkInterval = null;
    
    // 检查插件是否启用
    function checkEnabled() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['fontForceEnabled'], function(result) {
                isEnabled = result.fontForceEnabled !== false; // 默认启用
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
    }
    
    // 应用字体强制
    function applyFontForce() {
        if (!isEnabled) return;
        
        // 创建样式元素
        let style = document.getElementById('force-font-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'force-font-style';
        }
        
        style.textContent = `
            * {
                font-family: 'LXGWWenKaiGB-Regular', sans-serif !important;
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
                            // 对新添加的元素应用字体
                            node.style.fontFamily = 'LXGWWenKaiGB-Regular, sans-serif';
                            // 对其子元素也应用字体
                            const children = node.querySelectorAll('*');
                            children.forEach(function(child) {
                                child.style.fontFamily = 'LXGWWenKaiGB-Regular, sans-serif';
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
                if (isEnabled && !document.getElementById('force-font-style')) {
                    applyFontForce();
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
            }
        });
    }
    
    // 初始化
    checkEnabled();
    
})();