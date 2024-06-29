// ==UserScript==
// @name        自用去广告插件
// @namespace   http://tampermonkey.net/
// @match       https://applnn.cc/
// @match       https://applnn.cc/*
// @match       https://www.applnn.cc/
// @match       https://www.applnn.cc/*
// @grant       unsafeWindow
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.1
// @license     MIT
// @author      Berger
// ==/UserScript==

(function () {
    'use strict';

    function app_lnn_AD_normal() {
        const noticeBoard = document.querySelector('div[id="gong-box"]');
        if (noticeBoard) {
            noticeBoard.remove()
        }
        const homeTopAd_1 = document.querySelector('div[id="home-row-dhsj"]');
        if (homeTopAd_1) {
            homeTopAd_1.remove()
        }
        const homeTopAd_2 = document.querySelector('div[id="home-row-gd1"]');
        if (homeTopAd_2) {
            homeTopAd_2.remove()
        }
    }

    function app_lnn_AD_special() {
        const iframes = document.querySelector('iframe:not([src])');
        if (iframes) {
            iframes.style.setProperty('visibility', 'hidden', 'important');
        }
    }


    let main = {
        initNormal() {
            app_lnn_AD_normal()
        },

        initSpecial() {
            app_lnn_AD_special()
        }
    }

    window.addEventListener('DOMContentLoaded', main.initNormal);
    window.addEventListener('load', main.initSpecial);
})();
