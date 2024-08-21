// ==UserScript==
// @name        自用小工具
// @namespace   http://tampermonkey.net/
// @match       https://applnn.cc/
// @match       https://applnn.cc/*
// @match       https://www.applnn.cc/
// @match       https://www.applnn.cc/*
// @match       https://*.lanzout.com/
// @match       https://*.lanzout.com/*
// @match       https://m.775sy.com/*
// @match       https://www.775sy.com/*
// @match       https://mobapp.277sy.com/*
// @grant       unsafeWindow
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.91
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

    const handleResponse = {
        handleUserInfoResponse(userInfoResponse) {
            console.log(userInfoResponse['data'])
            userInfoResponse['data']['vip_level'] = 13
            userInfoResponse['data']['member_days'] = 3650
            userInfoResponse['data']['member_valid_days'] = 3650
            userInfoResponse['data']['member_status'] = 1
            userInfoResponse['data']['end_time'] = '2035-12-31'
            return userInfoResponse
        },

        handleInitResponse(initResponse) {
            initResponse['data']['website_data']['app_show'] = '0'
            return initResponse
        },
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

    // 提前下载游戏
    function nw_game_previous_download() {
        const observer = new MutationObserver(function (mutationsList, observer) {
            const download_box = document.querySelector('.three_btn_box');
            if (download_box) {
                if (download_box.children.length === 0) {
                    download_box.innerHTML =
                        `
                        <uni-view data-v-6267e90e="" class="three_btn_box__item down" style="background: rgb(1, 143, 255);">
                        <uni-view>提前下载（插件）</uni-view>
                        </uni-view>
                        `
                }

                const downloadButton = download_box.querySelector('.three_btn_box__item.down');
                if (downloadButton) {
                    downloadButton.addEventListener('click', function () {
                        const hash = window.location.hash;
                        const queryString = hash.split('?')[1]; // 仅获取 ? 后的部分
                        const params = new URLSearchParams(queryString);
                        const gameId = params.get('id');
                        if (gameId) {
                            window.location.href = `https://oss.775sy.com/android/game_package${gameId}.apk`
                        } else {
                            console.log('未找到 id 参数');
                            return null
                        }
                    });//https://bhres.39bh.com/android/game_package18486.apk
                }
                observer.disconnect();
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    function nw_game_ad_normal() {
        const observer = new MutationObserver(function (mutationsList, observer) {
            const tabbarItemArrays = document.querySelectorAll('.u-tabbar__content__item-wrapper > .u-tabbar-item');

            const accountTran = document.querySelector('.accountTran');
            utils.removeElement(accountTran)

            if (tabbarItemArrays.length > 0) {
                utils.removeElement(tabbarItemArrays[2])
                utils.removeElement(tabbarItemArrays[3])
                observer.disconnect();
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }

    class game277sy {
        static removeAD() {
            if (url.indexOf('home') !== -1) {
                utils.checkElement('.home', function (element) {
                    // 首页弹窗
                    utils.removeElement(element.children[5])

                    // 客服悬浮图标
                    utils.removeElement(element.querySelector('div[class="icons-container"]'))

                    // 首页多余信息
                    const swipeContent = element.querySelector('.content_scroll')
                    utils.removeElement(swipeContent.children[5])
                    utils.removeElement(swipeContent.children[4])
                    utils.checkElementDIY('.introduction', swipeContent, function (element) {
                        utils.removeElement(element)
                    })
                    utils.checkElementDIY('.notice-swipe', swipeContent, function (element) {
                        utils.removeElement(element.parentElement)
                    })

                    swipeContent.lastChild.style.height = '100px'
                    utils.removeElement(element.querySelector('.toDesktop'))
                })
            }

            // 除去底部Tab
            utils.removeElement(document.querySelector('.tab-bar').children[3])
        }

        static androidDownload() {
            const downloadBtnCSS = {
                position: 'absolute',
                right: '0',
                width: '145px',
                height: '82px',
                background: '#5879fe',
                borderRadius: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
            if (url.indexOf('gameinfo') !== -1) {
                utils.checkElement('.bottom-bar', function (element) {
                    const downloadNormalBtnDiv = element.querySelector('.enterprise_cloud_game')
                    utils.removeElement(downloadNormalBtnDiv.children[2])
                    const enterpriseRightDiv = document.createElement('div')
                    enterpriseRightDiv.className = 'enterprise_right'
                    Object.assign(enterpriseRightDiv.style, downloadBtnCSS);
                    enterpriseRightDiv.innerHTML = `<div data-v-8de7bd1e="" class="enterprise-right"><span data-v-8de7bd1e="">安卓下载</span></div>`
                    downloadNormalBtnDiv.appendChild(enterpriseRightDiv)
                    downloadNormalBtnDiv.addEventListener('click', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        const urlObject = new URL(url);
                        const match = urlObject.hash.match(/gameid\/(\d+)/);
                        if (match) {
                            const gameId = match[1];
                            window.location.href = `https://download.277sy.com/index.php/Index/down/?gameid=${gameId}`
                        }
                    })
                })
            }
        }
    }


    let main = {
        initNormal() {
            if (url.indexOf('applnn.cc') !== -1) {
                app_lnn_AD_normal()
            } else if (url.indexOf('lanzout.com') !== -1) {
                lan_z_out_AD_normal()
            } else if (url.indexOf('775sy.com') !== -1) {
                nw_game_previous_download()
                nw_game_ad_normal()
                main.responseInterceptor()
            } else if (url.indexOf('277sy.com') !== -1) {
                game277sy.removeAD()
                game277sy.androidDownload()
            }
        },

        initSpecial() {
            if (url.indexOf('applnn.cc') !== -1) {
                app_lnn_AD_special()
            }
        },

        responseInterceptor() {
            utils.responseInterceptors('/userinfo', handleResponse.handleUserInfoResponse)
            utils.responseInterceptors('/index/init', handleResponse.handleInitResponse)
        }
    }

    window.addEventListener('DOMContentLoaded', main.initNormal);
    window.addEventListener('load', main.initSpecial);
})();
