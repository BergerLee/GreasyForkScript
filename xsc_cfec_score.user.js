// ==UserScript==
// @name        辅导员一键打分
// @namespace   http://tampermonkey.net/
// @match       http://xsc.cfec.edu.cn/cqrzxg/Sys/SystemForm/main.htm
// @match       http://xsc.cfec.edu.cn/*
// @run-at      document-start
// @version     1.0
// @license     MIT
// @author      Berger
// @description 重庆财经学院学工系统辅导员打分
// ==/UserScript==

(function () {
    'use strict';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 创建清除小红点按钮
    function createScoreButton() {
        let scoreButton = document.createElement('tr');
        scoreButton.innerHTML = '<td height="22" style="margin: 10px;float: right" bgcolor="#DBDBDB"><button>一键打分</button></td>';

        let handleBox = document.querySelectorAll('#Content table tbody');

        if (handleBox[0]) {
            if (handleBox[0].firstChild) {
                handleBox[0].insertBefore(scoreButton, handleBox[0].firstChild);
            } else {
                handleBox[0].appendChild(scoreButton);
            }
        }

        scoreButton.addEventListener("click", async function (event) {

            event.preventDefault();

            const trCount = document.querySelectorAll('#Content > table > tbody > tr').length
            const checkBoxCount = (trCount - 1) / 2
            // 选中复选框
            for (let i = 1; i <= checkBoxCount; i++) {
                const checkBoxId = "checkbox" + i + "1"
                const checkbox = document.getElementById(checkBoxId);
                if (checkbox){
                    checkbox.checked = true
                }
            }

            await sleep(900)

            // 点击提交按钮
            const submitBtn = document.querySelectorAll('input[type="submit"][name="But"]')
            if (submitBtn){
                submitBtn[0].click()
            }else {
                alert("辅导员打分失败，请联系开发者！")
            }
        })
    }

    let main = {
        init() {
            createScoreButton()
        }

    }

    window.addEventListener('load', main.init);


})();
