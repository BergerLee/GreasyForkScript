// ==UserScript==
// @name        网页转二维码
// @namespace   http://tampermonkey.net/
// @match       *://*/*
// @grant       unsafeWindow
// @run-at      document-start
// @version     1.0
// @license     MIT
// @author      Berger
// @require     https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js
// @description 展示网页二维码，供手机扫描
// @grant       GM_registerMenuCommand
// ==/UserScript==
(function () {
    'use strict';

    function registerMenuCommand() {
        GM_registerMenuCommand('⚙️ 生成二维码 快捷键:Alt + S', () => {
            showQRDialog(location.href)
        });
    }

    function registerShortcut() {
        window.addEventListener('keydown', (event) => {
            if (event.altKey && event.key === 's') {
                event.preventDefault(); // 阻止默认行为
                showQRDialog(location.href); // 弹出二维码窗口
            }
        });
    }

    function showQRDialog(url) {
        // 创建画布元素
        const canvas = document.createElement('canvas');
        const qr = new QRious({
            element: canvas,
            value: url,
            size: 200 // 设置二维码大小
        });

        // 将画布转换为图像URL
        const imgSrc = canvas.toDataURL();
        Swal.fire({
            title: '本网站二维码',
            html: `<img src="${imgSrc}" alt="二维码" />`, // 使用图像源
            showConfirmButton: false,
            showCloseButton: true,
            footer: `tips：本项目由 <a target="_blank" href="https://github.com/BergerLee" style="font-weight: bold">BergerLee</a> 提供技术支持`
        });
    }

    let main = {
        init() {
            registerMenuCommand()
            registerShortcut()
        },
    }
    window.addEventListener('DOMContentLoaded', main.init.bind(main));
})();
