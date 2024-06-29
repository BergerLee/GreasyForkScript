// ==UserScript==
// @name        123Pan去广告
// @namespace   http://tampermonkey.net/
// @match       https://www.123pan.com/
// @match       https://www.123pan.com/*
// @grant       unsafeWindow
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.1
// @license     MIT
// @author      Berger
// @description 去广告、修改会员[仅供娱乐使用]

// @note         1.1 [新增]手机端去广告
// @note         1.0 [新增]PC去广告 [新增]会员修改
// ==/UserScript==


(function () {
        'use strict';
        const store = {
            modifiedUserInfo: null, path: null,
        };

        const originOpen = XMLHttpRequest.prototype.open;
        store.path = new URLSearchParams(new URL(location.href).search).get('path');

        function modifyUserInfoResponse(originalResponse) {
            try {
                const modifiedUserInfoResponse = originalResponse
                modifiedUserInfoResponse.data.SpacePermanent = 500 * 1024 * 1024 * 1024 //总容量
                modifiedUserInfoResponse.data.SpaceTempExpr = "2099-01-01T00:00:00+00:00" //容量过期时间
                modifiedUserInfoResponse.data.Vip = true // 是否为VIP
                modifiedUserInfoResponse.data.VipLevel = 2 // VIP等级
                modifiedUserInfoResponse.data.VipExpire = "2099-01-01 08:00:00" // VIP过期时间
                modifiedUserInfoResponse.data.SpaceBuy = true // 是否购买容量
                modifiedUserInfoResponse.data.GrowSpaceAddCount = 128 // 容量等级
                modifiedUserInfoResponse.data.IsAuthentication = true
                modifiedUserInfoResponse.data.SignType = 1

                store.modifiedUserInfo = modifiedUserInfoResponse.data.user
                return modifiedUserInfoResponse
            } catch (error) {
                console.log(error)
                return originalResponse // 返回原始响应内容
            }
        }

        function responseInterceptors() {
            XMLHttpRequest.prototype.open = function (method, url) {
                if (url.indexOf('/info') !== -1) {
                    this.addEventListener('readystatechange', function () {
                        if (this.readyState === 4) {
                            const res = JSON.parse(this.responseText)
                            const modifiedUserInfoResponse = modifyUserInfoResponse(res)
                            Object.defineProperty(this, "responseText", {
                                writable: true,
                            });
                            this.responseText = modifiedUserInfoResponse
                        }
                    })
                }


                originOpen.apply(this, arguments);
            }
        }


        // 移除电脑端广告
        function removeAdForPC() {
            // 顶部广告
            const topAD = document.querySelector('div[class="mfy-main-layout__head"]')
            topAD.remove()

            // 右下角广告
            const rightBottomAD = document.querySelectorAll('.layout-dom > div:not([class])')
            rightBottomAD.forEach(divADItem => {
                divADItem.remove()
            })

            //产品商城
            const asideAD = document.querySelector('div[class="sider-member-btn"]')
            asideAD.remove()

            // 其他网盘转入
            const specialAD = document.querySelector('div[class="special-menu-item-container"]')
            specialAD.remove()
        }


        // 移除手机端广告
        function removeAdForMobile(){
            GM_addStyle('.banner-container-h5{display:none !important}');//右侧登录提示栏
        }


        let main = {
            init() {
                if (window.innerWidth <= 768) {
                    removeAdForMobile()
                } else {
                    removeAdForPC()
                }
                responseInterceptors()
            },
        }

        window.addEventListener('DOMContentLoaded', main.init);
    }
)()

