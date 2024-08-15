// ==UserScript==
// @name        CFEC统一身份认证(自用)
// @namespace   http://tampermonkey.net/
// @match       http://uia.cfec.edu.cn/
// @match       http://uia.cfec.edu.cn/*
// @run-at      document-start
// @version     1
// @license     MIT
// @author      Berger
// @description 越权提供更多权限
// ==/UserScript==


(function () {
    'use strict';

    const originOpen = XMLHttpRequest.prototype.open;

    function createNavItem(index, url, icon, name) {
        const navItem = document.createElement('li');
        navItem.id = index;
        navItem.innerHTML = `
        <a onclick="chgCss('${index}'); leo.redirectPage('${url}')" href="javascript:void(0);">
            <i class="menu-icon fa ${icon}"></i>
            <span class="menu-text">${name}</span>
        </a>
        <b class="arrow"></b>
    `;
        // console.log(navItem);
        return navItem;
    }

    function initNav() {
        const navList = document.querySelector('#main-container > #sidebar > ul');

        if (window.location.href.indexOf('/mng/profile.jsp') !== -1) {
            const navItems = [
                {index: 'a_1', url: 'spring:acp/zhzx/qxcd/viewGridPage', icon: 'fa-user', name: '账号列表'},
                {index: 'a_4', url: 'spring:acp/zhgl/dzhgl/viewGirdPage', icon: 'fa-user', name: '单账号管理'},
                {index: 'a_5', url: 'spring:acp/rzgl/rzyy/viewGirdPage', icon: 'fa-key', name: '认证应用'},
                {index: 'a_6', url: 'spring:acp/zhgl/plcz/viewGirdPage', icon: 'fa-reorder', name: '批量操作'},
                {index: 'a_7', url: 'spring:acp/zhgl/zhrq/viewGirdPage', icon: 'fa-reorder', name: '账号容器'},
                {
                    index: 'a_8',
                    url: 'spring:acp/rzgl/rzyy/viewGirdPage?fromPage=HBMDGL',
                    icon: 'fa-list-alt',
                    name: '黑白名单管理'
                },
                {index: 'a_9', url: 'spring:acp/rzgl/yyqx/viewGirdPage', icon: 'fa-bell-o', name: '应用权限'},
                {index: 'a_10', url: 'spring:acp/rzgl/gzgl/viewGirdPage', icon: 'fa-balance-scale', name: '规则管理'}
            ];

            navItems.forEach(item => {
                const navItem = createNavItem(item.index, item.url, item.icon, item.name);
                navList.appendChild(navItem);
            });
        }
    }

    function initTable() {
        XMLHttpRequest.prototype.open = function (method, url) {
            if (url.indexOf('/subsystem/acp/zhzx/_qxcd_Grid.js') !== -1) {
                this.addEventListener('readystatechange', function () {
                    if (this.readyState === 4 && this.status === 200) {
                        let modifiedResponse = this.responseText;
                        // 修改 colNames
                        modifiedResponse = modifiedResponse.replace("colNames:['账号', '姓名', '状态', '过期时间', '密码强度', '容器', '来源']",
                            "colNames:['账号', '姓名', '状态', '密码', '身份证', '邮箱', '来源']");

                        // 逐个删除 colModel 中的指定数据项
                        modifiedResponse = modifiedResponse.replaceAll('ACPLIFETIME', 'ACPEXT1');
                        modifiedResponse = modifiedResponse.replaceAll('ACPCURRPWDSTRATEGY', 'ACPIDCARD');
                        modifiedResponse = modifiedResponse.replaceAll(', formatter: "select", editoptions:{value:sysDict["SYSTEM.PWDSTRENGTH"]}', '');
                        modifiedResponse = modifiedResponse.replaceAll('CONTAINERID', 'ACPEMAIL');
                        modifiedResponse = modifiedResponse.replaceAll(', formatter: "select", editoptions:{value:constContainer}', '');

                        Object.defineProperty(this, 'responseText', {value: modifiedResponse});
                    }
                })
            }

            // 调用原始的 open 方法
            originOpen.apply(this, arguments);
        };
    }


    function createMenuTreeItem(idName,url,name) {
        const menuItem = document.createElement('li');
        menuItem.id = idName;
        menuItem.innerHTML = `
           <a href="javascript:void(0);"
                               onClick="chgCss('${idName}');leo.redirectPage('${url}')"
                               class="dropdown-toggle"><i class="menu-icon  fa  fa-bar-chart-o"></i><span
            class="menu-text">${name}</span></a><b class="arrow"></b>
    `;
        return menuItem;
    }

    function initMenuTree() {
        const menuTree = document.querySelector('ul[id="leftMenuTree"]')

        if (menuTree){
            const authenticateStatistics = createMenuTreeItem('menu_dzhgl','spring:acp/rzgl/rztj/viewGirdPage','认证统计')
            const accountStatistics = createMenuTreeItem('menu_zhtj','spring:acp/zhgl/zhtj/viewGirdPage','帐号统计')

            menuTree.appendChild(authenticateStatistics)
            menuTree.appendChild(accountStatistics)
        }
    }


    let main = {
        init() {
            initNav()
            initTable()
            initMenuTree()
        }

    }

    window.addEventListener('load', main.init)

})()
