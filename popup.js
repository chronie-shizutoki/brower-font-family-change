document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const btnText = document.getElementById('btnText');
    
    // 获取当前状态
    chrome.storage.sync.get(['fontForceEnabled'], function(result) {
        const isEnabled = result.fontForceEnabled !== false; // 默认启用
        updateUI(isEnabled);
    });
    
    // 切换按钮点击事件
    toggleBtn.addEventListener('click', function() {
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
    
    function updateUI(isEnabled) {
        if (isEnabled) {
            toggleBtn.classList.remove('disabled');
            btnText.textContent = '禁用字体强制';
        } else {
            toggleBtn.classList.add('disabled');
            btnText.textContent = '启用字体强制';
        }
    }
});