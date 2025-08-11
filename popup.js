document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
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
    
    // 获取当前状态
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const isEnabled = result.fontForceEnabled !== false; // 默认启用
        updateUI(isEnabled);
    });
    
    // 切换按钮点击事件
    toggleBtn.addEventListener('click', function(event) {
        // 添加点击波纹效果
        addRippleEffect(this, event);
        
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
    });
    
    // 键盘支持
    toggleBtn.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.click();
        }
    });
    
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
        if (statusDot && statusText) {
            if (isEnabled) {
                statusDot.classList.remove('inactive');
                statusText.textContent = '字体强制已启用';
            } else {
                statusDot.classList.add('inactive');
                statusText.textContent = '字体强制已禁用';
            }
        }
        
        // 添加无障碍属性
        toggleBtn.setAttribute('role', 'switch');
        toggleBtn.setAttribute('tabindex', '0');
        toggleBtn.setAttribute('aria-label', isEnabled ? '禁用字体强制' : '启用字体强制');
    }
    
    // 检测系统主题变化
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        function handleThemeChange(e) {
            // 可以在这里添加主题切换的额外逻辑
            console.log('系统主题已切换到:', e.matches ? '深色模式' : '浅色模式');
        }
        
        darkModeQuery.addListener(handleThemeChange);
        
        // 初始检测
        handleThemeChange(darkModeQuery);
    }
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.3s ease';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 50);
});