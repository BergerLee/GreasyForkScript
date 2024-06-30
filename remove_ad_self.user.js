// ==UserScript==
// @name        自用去广告插件
// @namespace   http://tampermonkey.net/
// @match       https://applnn.cc/
// @match       https://applnn.cc/*
// @match       https://www.applnn.cc/
// @match       https://www.applnn.cc/*
// @match       https://*.lanzout.com/
// @match       https://*.lanzout.com/*
// @grant       unsafeWindow
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.3
// @license     MIT
// @author      Berger
// ==/UserScript==

(function () {
    'use strict';

    const url = window.location.href;

    const utils = {
        removeElementArrays(elementList){
            if (elementList.length > 0) {
                elementList.forEach(element => {
                    element.remove()
                })
            }
        }
    }

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

        const singleTopAd = document.querySelector('div[class="single-top-html"]');
        if (singleTopAd) {
            singleTopAd.remove()
        }

        const essayBottomAd = document.querySelector('.single-bottom-html');
        if (essayBottomAd) {
            essayBottomAd.remove()
        }

        const downloadAd = document.querySelectorAll('div[class="n_banner_inner"]');
        utils.removeElementArrays(downloadAd)
    }

    function app_lnn_AD_special() {
        GM_addStyle('iframe:not([src]){visibility:hidden !important}');
    }

    function lan_z_out_AD_normal(){
        const downloadAD = document.querySelectorAll('div[class="appad"]');
        utils.removeElementArrays(downloadAD)
    }


    let main = {
        initNormal() {
            if (url.indexOf('applnn.cc') !== -1){
                app_lnn_AD_normal()
            }else if (url.indexOf('lanzout.com') !== -1){
                lan_z_out_AD_normal()
            }
        },

        initSpecial() {
            if (url.indexOf('applnn.cc') !== -1){
                app_lnn_AD_special()
            }
        }
    }



    window.addEventListener('DOMContentLoaded', main.initNormal);
    window.addEventListener('load', main.initSpecial);
})();
