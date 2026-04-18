#!/bin/bash
# 这个脚本用于在 Glitch 上快速部署
echo "准备部署到 Glitch..."
echo "1. 打开 https://glitch.com/edit/#!/new/project"
echo "2. 选择 'hello-node' 模板"
echo "3. 复制以下内容到对应文件："
echo ""
echo "package.json:"
cat package.json
echo ""
echo "server.js:"
cat server.js
echo ""
echo "public/index.html, styles.css, app.js, manifest.json, sw.js"
echo ""
echo "4. 点击 'Share' -> 复制 Live URL"
echo "5. 完成！"
