// 测试字体切换功能
console.log('开始测试字体切换功能...');

// 字体列表和路径
const fonts = [
    { family: 'LXGWWenKaiGB-Regular', url: 'LXGWWenKaiGB-Regular.woff2' },
    { family: 'LXGWWenKaiTC-Regular', url: 'LXGWWenKaiTC-Regular.woff2' },
    { family: 'KleeOne-Regular', url: 'KleeOne-Regular.woff2' }
];

// 模拟字体映射
const fontMap = {
    'zh_CN': 'LXGWWenKaiGB-Regular',
    'zh_TW': 'LXGWWenKaiTC-Regular',
    'ko': 'LXGWWenKaiGB-Regular',
    'ja': 'KleeOne-Regular',
    'en': 'KleeOne-Regular',
    'ms': 'KleeOne-Regular'
};

// 加载字体函数
function loadFonts() {
    const fontPromises = fonts.map(font => {
        return new Promise((resolve, reject) => {
            const fontFace = new FontFace(font.family, `url(${font.url})`);
            fontFace.load()
                .then(() => {
                    document.fonts.add(fontFace);
                    console.log(`✓ 字体 ${font.family} 加载成功`);
                    resolve();
                })
                .catch(error => {
                    console.error(`✗ 字体 ${font.family} 加载失败:`, error);
                    reject(error);
                });
        });
    });

    return Promise.allSettled(fontPromises);
}

// 测试函数
function testFontSwitch() {
    // 使用document.body而不是创建新元素
    const body = document.body;
    
    // 测试不同语言的字体切换
    Object.keys(fontMap).forEach(language => {
        // 应用语言
        updateFontFamily(language);
        
        // 检查字体是否正确应用
        const computedFont = window.getComputedStyle(body).fontFamily;
        const expectedFont = fontMap[language];
        
        // 由于字体可能有回退，我们检查期望的字体是否在计算的字体列表中
        if (computedFont.includes(expectedFont)) {
            console.log(`✓ 语言 ${language} 字体测试通过: ${computedFont}`);
        } else {
            console.error(`✗ 语言 ${language} 字体测试失败: 期望 ${expectedFont}, 实际 ${computedFont}`);
        }
    });
}

// 模拟updateFontFamily函数
function updateFontFamily(language) {
    const body = document.body;
    
    // 获取当前语言对应的字体
    const font = fontMap[language] || 'KleeOne-Regular';
    
    // 设置body的字体
    body.style.fontFamily = `${font}, sans-serif`;
}

// 加载字体后运行测试
loadFonts().then(results => {
    // 检查是否有字体加载失败
    const failedFonts = results.filter(result => result.status === 'rejected');
    if (failedFonts.length > 0) {
        console.warn(`有 ${failedFonts.length} 种字体加载失败，测试可能不准确`);
    }
    
    // 延迟运行测试，确保字体完全应用
    setTimeout(testFontSwitch, 500);
});