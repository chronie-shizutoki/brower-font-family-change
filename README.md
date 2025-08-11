# Chrome浏览器字体强制插件

这是一个Chrome浏览器插件，可以强制所有网页使用LXGWWenKaiGB-Regular字体。

## 功能特点

- 🎨 强制所有网页使用LXGWWenKaiGB-Regular字体
- 🔄 实时监听页面变化，确保动态加载的内容也使用指定字体
- 🎛️ 可通过插件图标开启/关闭字体强制功能
- 💪 使用!important规则确保字体优先级最高
- 🚀 支持所有网站，包括输入框、按钮等表单元素

## 安装方法

### 方法一：开发者模式安装（推荐）

1. 打开Chrome浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择包含插件文件的文件夹（即当前文件夹）
6. 插件安装完成，会在扩展程序列表中显示

### 方法二：打包安装

1. 在Chrome扩展程序页面点击"打包扩展程序"
2. 选择插件文件夹，生成.crx文件
3. 将.crx文件拖拽到Chrome扩展程序页面进行安装

## 使用方法

1. 安装插件后，浏览器工具栏会出现插件图标
2. 访问任意网页，字体会自动被强制设置为LXGWWenKaiGB-Regular
3. 点击插件图标可以打开控制面板
4. 在控制面板中可以开启或关闭字体强制功能

## 文件结构

```
├── manifest.json          # 插件配置文件
├── content.css            # 字体样式文件
├── content.js             # 内容脚本
├── popup.html             # 弹出窗口界面
├── popup.js               # 弹出窗口逻辑
├── LXGWWenKaiGB-Regular.woff2  # 字体文件
└── README.md              # 说明文档
```

## 技术实现

- 使用Manifest V3规范
- 通过content scripts注入CSS和JavaScript
- 使用MutationObserver监听DOM变化
- 支持动态开启/关闭功能
- 使用Chrome Storage API保存设置

## 注意事项

- 插件会强制覆盖所有网页的字体设置
- 某些特殊网站可能需要刷新页面才能完全生效
- 如果遇到字体显示问题，可以通过插件图标关闭功能

## 兼容性

- 支持Chrome 88+版本
- 支持基于Chromium的浏览器（如Edge、Opera等）

## 许可证

本项目仅供学习和个人使用。