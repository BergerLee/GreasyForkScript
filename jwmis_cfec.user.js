// ==UserScript==
// @name        重庆财经学院教务系统小工具
// @namespace   http://tampermonkey.net/
// @match       http://jwmis.cfec.edu.cn/jwglxt/xspjgl/xspj_cxXspjIndex.html?doType=details&gnmkdm=N401605&layout=default
// @match       http://jwmis.cfec.edu.cn/jwglxt/wjdcgl/wjdc_cxWjdcIndex.html?gnmkdm=N402505&layout=default
// @run-at      document-start
// @version     1.0
// @license     MIT
// @author      Berger
// @description 一键评教、一键完成调查问卷
// ==/UserScript==

(function () {
    'use strict';

    const utils = {
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        showSuccess(message) {
            $.success(message)
        },

        showError(message) {
            $.error(message)
        },

        showInfo(message) {
            $.alert(message)
        },
    };


    // 创建相关按钮
    function createEvaluateButton() {
        let innerButton = document.createElement('div');
        innerButton.style.overflow = 'auto'; // Clear the floats

        let handleBox = document.querySelectorAll('.panel-default > .panel-heading');

        const currentUrl = window.location.href

        if (currentUrl.indexOf('N402505') !== -1){
            // 问卷调查
            if (handleBox.length > 0) {
                innerButton.innerHTML = '<button type="button" class="btn btn-default btn_sq" style="float: right;"><i class="bigger-100 glyphicon glyphicon-heart-empty"></i> 一键完成问卷调查</button>';
                handleBox[handleBox.length - 1].appendChild(innerButton);
                innerButton.addEventListener('click',function (){
                    competeInvestigation()
                })
            }
        }

        //TODO 教学评价
    }

    // 自动完成问卷调查
    async function competeInvestigation(){
        const tableFormGroup = document.querySelectorAll('.panel-body > table > tbody > tr > td > .form-group')
        if (tableFormGroup.length <= 0){
            return utils.showInfo('请先等待数据加载完成！')
        }

        const lastIndex = tableFormGroup.length - 1;

        tableFormGroup.forEach(function(element, index) {
            const checkBoxAll = index === lastIndex ? element.querySelectorAll('div')[1].querySelectorAll('label > input') : element.querySelectorAll('div')[0].querySelectorAll('label > input');
            checkBoxAll.forEach(function(checkbox) {
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        });

        await utils.sleep(1000)

        // 点击提交按钮
        const submitBtn = document.querySelectorAll('button[type="button"][id="btn_xspj_tj"]')
        if (submitBtn){
            submitBtn[0].dataset.enter = "true" // 反检测脚本
            submitBtn[0].click()
            await utils.sleep(1500)
            utils.showSuccess("问卷填写完成，请等待系统自动刷新页面！")
        }else {
            return utils.showError("调查问卷完成失败，请联系开发者！")
        }
    }

    let main = {
        init() {
            createEvaluateButton()
        }

    }

    window.addEventListener('load', main.init);
})();
