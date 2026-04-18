@echo off
cd /d "%~dp0"
echo 正在启动纯净阅读...
start http://localhost:3000
node server.js
