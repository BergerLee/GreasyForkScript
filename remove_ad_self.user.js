// ==UserScript==
// @name        自用小工具
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
// @version     1.94
// @license     MIT
// @author      Berger
// ==/UserScript==

(function () {
    'use strict';

    const url = window.location.href;

    const utils = {
        removeElementArrays(elementList) {
            if (elementList.length > 0) {
                elementList.forEach(element => {
                    element.remove()
                })
            }
        },

        removeElement(element) {
            if (element) {
                element.remove()
            }
        },

        responseInterceptors(fetchUrl, handleFunction) {
            const originOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function (method, url) {
                if (url.indexOf(fetchUrl) !== -1) {
                    this.addEventListener('readystatechange', function () {
                        if (this.readyState === 4) {
                            const response = JSON.parse(this.responseText)
                            const modifiedResponse = handleFunction(response)
                            Object.defineProperty(this, "responseText", {
                                writable: true,
                            });
                            this.responseText = JSON.stringify(modifiedResponse)
                        }
                    })
                }


                originOpen.apply(this, arguments);
            }
        },

        checkElement(className, callback) {
            const observer = new MutationObserver(function (mutationsList, observer) {
                const element = document.querySelector(className);
                if (element) {
                    observer.disconnect();
                    callback(element)
                }
            });

            observer.observe(document.body, {childList: true, subtree: true});
        },

        checkElementDIY(className, parentElement, callback) {
            const observer = new MutationObserver(function (mutationsList, observer) {
                const element = parentElement.querySelector(className);
                if (element) {
                    observer.disconnect();
                    callback(element)
                }
            });

            observer.observe(document.body, {childList: true, subtree: true});
        }
    }

    function app_lnn_AD_normal() {
        const noticeBoard = document.querySelector('div[id="gong-box"]');
        utils.removeElement(noticeBoard)

        const homeTopAd_1 = document.querySelector('div[id="home-row-dhsj"]');
        utils.removeElement(homeTopAd_1)

        const homeTopAd_2 = document.querySelector('div[id="home-row-gd1"]');
        utils.removeElement(homeTopAd_2)

        const singleTopAd = document.querySelector('div[class="single-top-html"]');
        utils.removeElement(singleTopAd)

        const essayBottomAd = document.querySelector('.single-bottom-html');
        utils.removeElement(essayBottomAd)

        const downloadAd = document.querySelectorAll('div[class="n_banner_inner"]');
        utils.removeElementArrays(downloadAd)

        const downloadBanner = document.querySelector('.download-page-info')
        utils.removeElement(downloadBanner.nextElementSibling)
    }

    function app_lnn_AD_special() {
        GM_addStyle('iframe:not([src]){visibility:hidden !important}');
    }

    function lan_z_out_AD_normal() {
        const downloadAD = document.querySelectorAll('div[class="appad"]');
        utils.removeElementArrays(downloadAD)

        const downloadBottomAd = document.querySelectorAll('div:not([class]):not([id])');
        utils.removeElementArrays(downloadBottomAd)
        console.log(downloadBottomAd)
    }


    let main = {
        initNormal() {
            if (url.indexOf('applnn.cc') !== -1) {
                app_lnn_AD_normal()
            } else if (url.indexOf('lanzout.com') !== -1) {
                lan_z_out_AD_normal()
            }
        },

        initSpecial() {
            if (url.indexOf('applnn.cc') !== -1) {
                app_lnn_AD_special()
            }
        },
    }

    window.addEventListener('DOMContentLoaded', main.initNormal);
    window.addEventListener('load', main.initSpecial);
})();
