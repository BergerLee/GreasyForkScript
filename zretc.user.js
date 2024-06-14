// ==UserScript==
// @name        智云枢多功能插件
// @namespace   http://tampermonkey.net/
// @match       https://online.zretc.net/
// @match       https://online.zretc.net/*
// @run-at      document-start
// @version     2.92
// @license     MIT
// @author      Berger
// @description 智云枢一键清除红点提示、一键签到、一键完成作业、一键考试、提前查看考试/作业分数
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @require     https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.min.js
// @require     https://registry.npmmirror.com/hotkeys-js/3.13.3/files/dist/hotkeys.min.js
// @resource    sweetalert2CSS https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.min.css
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(GM_getResourceText("sweetalert2CSS"));

    const originOpen = XMLHttpRequest.prototype.open;

    const utils = {
        getValue(name) {
            return GM_getValue(name);
        },

        setValue(name, value) {
            GM_setValue(name, value);
        },

        // 响应拦截器
        responseInterceptor(apiUrl) {
            return new Promise((resolve, reject) => {
                // 修改 open 方法
                XMLHttpRequest.prototype.open = function (method, url) {
                    // 检查 URL 是否包含指定的 apiUrl
                    if (url.indexOf(apiUrl) !== -1) {
                        // 监听 readystatechange 事件
                        this.addEventListener('readystatechange', function () {
                            if (this.readyState === 4) { // 请求完成
                                // 获取响应体
                                const res = JSON.parse(this.responseText);
                                resolve(res); // 解析 Promise 并返回响应数据
                            }
                        });
                    }

                    // 调用原始的 open 方法
                    originOpen.apply(this, arguments);
                };
            });
        },

        modifyResponse(apiUrl, key, value) {
            XMLHttpRequest.prototype.open = function (method, url) {
                // 检查 URL 是否包含指定的 apiUrl
                if (url.indexOf(apiUrl) !== -1) {
                    // 监听 readystatechange 事件
                    this.addEventListener('readystatechange', function () {
                        if (this.readyState === 4) { // 请求完成
                            alert(1)
                            // 获取响应体
                            // const res = JSON.parse(this.responseText);
                            // Object.defineProperty(this, "response", {
                            //     writable: true,
                            // });
                            // res['data'][key] = value
                            // console.log(res)
                        }
                    });
                }

                // 调用原始的 open 方法
                originOpen.apply(this, arguments);
            };
        },

        async sendApi(apiUrl, options) {
            return await (await fetch(apiUrl, { // 修改为实际请求的URL
                method: options,
                headers: {
                    'Content-Type': 'application/json',
                    "zretc-token": localStorage.getItem("zretc-token")
                }
            })).json()
        },

        async sendApiWithBody(apiUrl, options, body) {
            return await (await fetch(apiUrl, { // 修改为实际请求的URL
                method: options,
                headers: {
                    'Content-Type': 'application/json',
                    "zretc-token": localStorage.getItem("zretc-token")
                },
                body: JSON.stringify(body)
            })).json()
        },

        showSuccess(message) {
            Swal.fire({
                icon: "success",
                title: message,
                showConfirmButton: false,
                timer: 1300
            }).then(() => {
                location.reload()
            });
        },

        showSuccessNotReload(message) {
            Swal.fire({
                icon: "success",
                title: message,
                showConfirmButton: false,
                timer: 1300
            })
        },

        showError(message) {
            Swal.fire({
                icon: "error",
                title: message,
                showConfirmButton: false,
                timer: 1300
            })
        },

        showInfo(message) {
            Swal.fire({
                icon: "info",
                title: message,
                showConfirmButton: false,
                timer: 1500
            })
        },

        showLoad(msg) {
            Swal.fire({
                title: "请等待...",
                html: msg,
                didOpen: () => {
                    Swal.showLoading();
                },
            })
        },

        showDialog(title, text) {
            Swal.fire({
                title: title,
                html: text,
                icon: "question"
            });
        },

        async getStudentId(courseId) {
            let studentId = 0;
            try {
                const response = await this.sendApi(urlConstants.STUDENT_ID.replace('{}', courseId), 'GET');
                studentId = response['data']['studentId'];
            } catch (error) {
                console.error('Error fetching student ID:', error);
            }
            return studentId;
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },


        // Levenshtein距离算法
        levenshtein(a, b) {
            const matrix = [];

            // 初始化矩阵
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }

            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }

            // 填充矩阵
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1, // 替换
                            Math.min(matrix[i][j - 1] + 1, // 插入
                                matrix[i - 1][j] + 1) // 删除
                        );
                    }
                }
            }

            return matrix[b.length][a.length];
        },

    }

    // 创建清除小红点按钮
    function createClearButton() {
        let clearButton = document.createElement('div');
        clearButton.innerHTML = '<button class="el-button el-button--danger el-button--small">清除小红点</button>';

        let handleBox = document.querySelectorAll('.handle-box');

        handleBox.forEach(function (divElement) {
            divElement.appendChild(clearButton);
            clearButton.addEventListener("click", async function () {
                utils.showLoad("正在清理中，请等待！")

                const response = await utils.sendApi(urlConstants.CLASS_LIST, 'GET')
                const data = response['data']

                for (let i = 0; i < data.length; i++) {
                    const instanceId = data[i]['id']
                    for (let j = 0; j < data[i]['backlogDTOS'].length; j++) {
                        const messageId = data[i]['backlogDTOS'][j]['id']
                        const handle_clear_url = urlConstants.CLEAR_MSG.replace('{}', instanceId).replace('{}', messageId)
                        // 清除消息功能
                        const clearResponse = await utils.sendApi(handle_clear_url, 'PUT')
                        if (clearResponse['code'] !== "1") {
                            return utils.showError("未知错误，请联系开发者!")
                        }

                    }
                }
                Swal.close(); // 关闭加载提示
                utils.showSuccess("清除成功，即将刷新页面！")

            })
        });
    }

    // 创建一键签到按钮
    function createSignButton() {
        let signButton = document.createElement('div');
        signButton.innerHTML = '<button class="el-button el-button--danger el-button--small" style="margin-left: 10px">一键签到</button>';
        let illustrate = document.createElement('div')
        illustrate.innerHTML = '<button class="el-button el-button--primary el-button--small" style="margin-left: 10px">签到说明</button>';

        let intervalId = setInterval(function () {
            let signBox = document.querySelectorAll('.sign-box .header');
            if (signBox.length > 0) {
                clearInterval(intervalId); // 停止定时器
                signBox.forEach(function (divElement) {
                    divElement.appendChild(signButton)
                    divElement.appendChild(illustrate)
                    signButton.addEventListener("click", async function () {
                        utils.showInfo('正在签到中...')
                        const response = await utils.sendApi(urlConstants.SIGN_LIST.replace('{}', utils.getValue('courseId')), 'GET')
                        const signData = response['data'][0]
                        const signId = signData['id']
                        const courseId = utils.getValue('courseId')
                        const studentId = await utils.getStudentId(courseId)
                        urlConstants.SIGN_BODY.signInId = signId
                        urlConstants.SIGN_BODY.studentId = studentId
                        console.log(signId)
                        // 执行签到
                        const signResponse = await utils.sendApiWithBody(urlConstants.SIGN.replace('{}', courseId).replace('{}', signId), 'PATCH', urlConstants.SIGN_BODY)
                        if (signResponse['code'] === '1') {
                            utils.showSuccess('签到成功！即将刷新页面。')
                            await utils.sleep(1000)
                            window.location.reload()
                        }
                    })

                    illustrate.addEventListener("click", function () {
                        const illustrateText = `<p>1.签到结束了也可以签到</p><p>2.无需签到码</p><p>3.请低调使用</p>`
                        utils.showDialog('一键签到须知', illustrateText)
                    })
                })
            }
        }, 1000); // 每隔 1 秒检查一次

    }

    // 创建一键完成视频任务按钮
    function createCompleteVideoButton() {
        let completeVideoButton = document.createElement('div');
        completeVideoButton.innerHTML = '<button class="el-button el-button--danger el-button--small" style="margin: 20px 0 0 20px">一键完成所有视频任务</button>';

        let intervalId = setInterval(function () {
            let videoBox = document.querySelectorAll('.study-container');
            if (videoBox.length > 0) {
                clearInterval(intervalId); // 停止定时器
                console.log(videoBox)
                if (videoBox[0].firstChild) {
                    videoBox[0].insertBefore(completeVideoButton, videoBox[0].firstChild);
                } else {
                    videoBox[0].appendChild(completeVideoButton);
                }

                completeVideoButton.addEventListener("click", async function () {
                    utils.showInfo("正在开发，请耐心等待！")
                    // utils.showLoad("正在完成视频，请耐心等待...")
                    // //获取当前url
                    // let currentURL = window.location.href;
                    // let parts = currentURL.split('/');
                    // let courseId = parts[parts.length - 2];
                    // const response = await utils.sendApi(urlConstants.VIDEO_LIST.replace("{}", courseId), 'GET')
                    // const data = response['data']
                    //
                    // for (let i = 0; i < data.length; i++) {
                    //     const instanceChapterId = data[i]['instanceChapterId']
                    //     const instanceId = data[i]['instanceId']
                    //     const resourceId = data[i]['resourceId']
                    //     const sendBody = urlConstants.COMPLETE_VIDEO_BODY
                    //     sendBody.instanceId = instanceId
                    //     sendBody.instanceChapterId = instanceChapterId
                    //     sendBody.resourceId = resourceId
                    //
                    //     // console.log(sendBody)
                    //
                    //     const clearResponse = await utils.sendApiWithBody(urlConstants.VIDEO_LIST.replace("{}", instanceId), 'POST', sendBody)
                    //     if (clearResponse['code'] !== "1") {
                    //         return utils.showError("未知错误，请联系开发者!")
                    //     }
                    //
                    // }
                    // Swal.close(); // 关闭加载提示
                    // utils.showSuccess("清除成功，即将刷新页面！")

                })
            }


        }, 1000); // 每隔 1 秒检查一次

    }


    // 作业答题页面创建按钮
    function createCompleteHomeWorkButton() {
        let completeHomeworkDiv = document.createElement('div');
        completeHomeworkDiv.style.display = 'block'
        completeHomeworkDiv.innerHTML = `<div style="background-color: #FFFFFF;margin-bottom: 10px">
<button class="el-button el-button--danger el-button--small" style="margin: 10px">一键完成</button>
<span style="font-size: 12px">H键自动隐藏/显示本窗口 </span>
</div>`

        // 添加快捷键
        document.addEventListener('keydown', function (event) {
            if (event.key === 'h' || event.key === 'H') {
                if (completeHomeworkDiv.style.display === 'none') {
                    completeHomeworkDiv.style.display = 'block';
                } else {
                    completeHomeworkDiv.style.display = 'none';
                }
            }
        });


        let intervalId = setInterval(async function () {
            const currentUrl = window.location.href
            let homeworkBox = document.querySelectorAll('.right-box');
            if (homeworkBox.length > 0 && ((currentUrl.indexOf('&homeworkId=') !== -1) || (currentUrl.indexOf('/exams/') !== -1))) {
                clearInterval(intervalId); // 停止定时器
                if (homeworkBox[0].firstChild) {
                    homeworkBox[0].insertBefore(completeHomeworkDiv, homeworkBox[0].firstChild);
                } else {
                    homeworkBox[0].appendChild(completeHomeworkDiv);
                }
                let completeHomeworkDivButton = completeHomeworkDiv.querySelector('.el-button')

                completeHomeworkDivButton.addEventListener("click", async function () {

                    utils.showLoad("正在完成作业，请耐心等待....")
                    const urlObj = new URL(currentUrl);
                    let homeworkDetail = ''

                    if ((currentUrl.indexOf('/exams/') !== -1)) {
                        // // 获取当前页面的URL
                        // const currentURL = window.location.href;
                        const regex = /\/exams\/(\d+)\?/;
                        const match = currentUrl.match(regex);
                        // alert(match[1])
                        homeworkDetail = await utils.sendApi(urlConstants.HOMEWORK_DETAIL.replace("{}", match[1]), 'GET')
                    } else {
                        const homeworkId = urlObj.searchParams.get("homeworkId");
                        homeworkDetail = await utils.sendApi(urlConstants.HOMEWORK_DETAIL.replace("{}", homeworkId), 'GET')
                    }
                    const contentObjDTOList = homeworkDetail['data']['contentObjDTOList']
                    console.log(contentObjDTOList)


                    // 循环后端返回来的题目
                    contentObjDTOList.forEach(function (contentObjDTO, index) {
                        // 题目类型
                        const questionType = contentObjDTO['queType']
                        // 答案选项
                        const answersOptionByResponse = contentObjDTO['answer']
                        // 答案选项列表 如A、B、C、D
                        const questionOptionsListByResponse = contentObjDTO['questionOptions']

                        let temptDivResponse = document.createElement('div')
                        // 后端返回来的题目
                        temptDivResponse.innerHTML = contentObjDTO['content']
                        const questionByResponseHandle = temptDivResponse.textContent
                        // console.log(questionByResponseHandle)

                        // 页面上的题目DIV
                        const questionDivByPageList = document.querySelectorAll(".question")
                        for (let i = 0; i < questionDivByPageList.length; i++) {
                            //题目内容
                            const questionByPageList = questionDivByPageList[i].querySelector('.que-title > .title-box >.ck-content')
                            const questionByPageHandle = questionByPageList.textContent


                            // 计算Levenshtein距离
                            const distance = utils.levenshtein(questionByResponseHandle, questionByPageHandle);
                            const maxLength = Math.max(questionByResponseHandle.length, questionByPageHandle.length);
                            const similarity = 1 - (distance / maxLength);

                            let answerContent = ''
                            let answerContentHandle = ''
                            // 检查相似度 校验页面题目和后端题目
                            if (similarity > 0.7) { // 0.8为相似度阈值，可以调整
                                if (questionType === 1 || questionType === 3) {
                                    for (let j = 0; j < questionOptionsListByResponse.length; j++) {
                                        if (answersOptionByResponse === questionOptionsListByResponse[j]['optKey']) {
                                            answerContent = questionOptionsListByResponse[j]['content']
                                            let answerDivTempt = document.createElement('div')
                                            answerDivTempt.innerHTML = answerContent
                                            answerContentHandle = answerDivTempt.textContent
                                            // console.log(answerContentHandle)
                                            break
                                        }
                                    }

                                    // 页面选项
                                    const optionsListByPage = questionDivByPageList[i].querySelector('.option-list')
                                    const optionItem = optionsListByPage.querySelectorAll('.ck-content')
                                    for (let optionIndex = 0; optionIndex < optionItem.length; optionIndex++) {
                                        // console.log(optionItem[optionIndex].textContent)
                                        if (answerContentHandle === optionItem[optionIndex].textContent) {
                                            optionItem[optionIndex].click()
                                            break
                                        }
                                    }
                                } else if (questionType === 4) {
                                    // 填空题
                                    //获取input
                                    const inputList = questionDivByPageList[i].querySelectorAll(".el-input__inner")
                                    // console.log(answersOptionByResponse)
                                    const answer = JSON.parse(answersOptionByResponse).map(item => item.answer);

                                    inputList.forEach(function (inputElement) {
                                        const inputEvent = document.createEvent('Event');
                                        inputEvent.initEvent('input', true, true);
                                        inputElement.value = answer;
                                        inputElement.dispatchEvent(inputEvent);
                                        const changeEvent = document.createEvent('Event');
                                        changeEvent.initEvent('change', true, true);
                                        inputElement.dispatchEvent(changeEvent);
                                    })
                                } else if (questionType === 2) {
                                    // 多选题
                                    console.log(questionOptionsListByResponse)
                                    console.log(answersOptionByResponse)

                                    let answerHandleArray = new Set()
                                    for (let j = 0; j < answersOptionByResponse.length; j++) {
                                        for (let k = 0; k < questionOptionsListByResponse.length; k++) {
                                            if (answersOptionByResponse.charAt(j) === questionOptionsListByResponse[k]['optKey']) {
                                                // 包含 HTML 实体编码的文本
                                                // const encodedText = '<p><span style="background-color:rgb(253,253,254);color:rgb(5,7,59);">&lt;result&gt;</span></p>';
                                                const tempDiv = document.createElement('div');
                                                tempDiv.innerHTML = questionOptionsListByResponse[k]['content'];
                                                // const decodedText = tempDiv.innerHTML;
                                                // console.log(tempDiv.textContent)
                                                answerHandleArray.add(tempDiv.textContent)
                                            }
                                        }
                                    }

                                    // console.log(answerHandleArray)
                                    // console.log("================================")

                                    // 页面选项
                                    const optionsListByPage = questionDivByPageList[i].querySelector('.option-list')
                                    const optionItem = optionsListByPage.querySelectorAll('.ck-content')
                                    for (let optionIndex = 0; optionIndex < optionItem.length; optionIndex++) {
                                        // console.log(optionItem[optionIndex].textContent)
                                        answerHandleArray.forEach(function (answerItem) {
                                            const answerHandlePage = optionItem[optionIndex].textContent || optionItem[optionIndex].innerText;
                                            // console.log(answerItem)
                                            if (answerItem === answerHandlePage) {
                                                optionItem[optionIndex].click()
                                            }
                                        })
                                    }
                                }
                                break

                            }
                        }
                    })
                    utils.showSuccessNotReload("自动答题成功，请检查！")

                })


            }
        }, 1000); // 每隔 1 秒检查一次
    }

    function createCompulsiveFinishWorkButton() {
        let finishBtnDiv = document.createElement('div');
        finishBtnDiv.className = 'finish-compulsive-div'
        finishBtnDiv.innerHTML = '<button class="el-button el-button--danger el-button--small" style="margin-right: 10px; border: 1px solid rgb(243, 245, 248); ">强制答题</button>'

        let btnBox = document.querySelectorAll('.list-bg > div');
        let startBtn = btnBox[2].querySelector("button[disabled='disabled'][type='button']");

        const isExistCompulsiveBtn = document.querySelector("div[class='finish-compulsive-div']")

        utils.responseInterceptor('homework-submit-info').then((response) => {
            console.log(response)
            if (response['data']) {
                const resData = response['data']
                switch (resData['status']) {
                    case 1:// 已提交
                        startBtn.style.display = 'block'
                        if (isExistCompulsiveBtn) {
                            isExistCompulsiveBtn.remove()
                        }
                        break
                    case 2: // 错过提交
                        utils.setValue('homeworkId', resData['homeworkId'])
                        if (startBtn && isExistCompulsiveBtn == null) {
                            startBtn.style.display = 'none'
                            btnBox[2].insertBefore(finishBtnDiv, btnBox[2].firstChild);
                        }
                        break
                }
            }
        })

        isExistCompulsiveBtn.addEventListener('click', function () {
            console.log(utils.getValue('homeworkId'))
        })

    }

    function createQueryScoreInfo() {
        let queryScoreButton = document.createElement('div');

        utils.responseInterceptor('/submit-score').then(scoreResponse => {
            let score = scoreResponse['data'][0]['score']
            if (score) {
                queryScoreButton.innerHTML = `<div data-v-439af87f="" class="instruction update-score"><p>
        当前试卷得分：${score} 分</p></div>`;
            }
        })

        let intervalId = setInterval(function () {
            let videoBox = document.querySelectorAll('.list-bg');
            if (videoBox.length > 0) {
                clearInterval(intervalId); // 停止定时器
                const scoreDiv = document.querySelectorAll('.update-score')
                if (scoreDiv.length > 0) {
                    scoreDiv[0].remove()
                }
                videoBox[2].appendChild(queryScoreButton)


            }


        }, 1000); // 每隔 1 秒检查一次

    }

    function modifyEndTime() {
        // utils.modifyResponse('/work/do', 'endTime', 4102329600000)
        XMLHttpRequest.prototype.open = function (method, url) {
            console.log(url)
            // alert(url.indexOf('/homework/homeworks/') !== -1)
            // if (url.indexOf('/questions') !== -1) {
            //     console.log(url)
            //     // this.addEventListener('readystatechange', function () {
            //     //     if (this.readyState === 4) {
            //     //         alert(1)
            //     //         // const modifiedQuotaResponse = modifyQuotaResponse(this.response)
            //     //         // Object.defineProperty(this, "response", {
            //     //         //     writable: true,
            //     //         // });
            //     //         // this.response = JSON.stringify(modifiedQuotaResponse)
            //     //     }
            //     // })
            // }

            originOpen.apply(this, arguments);
        }
    }

    // modifyEndTime()


    let main = {
        init() {
            createSignButton()
            createClearButton()
            createCompleteVideoButton()
            createCompleteHomeWorkButton()

            const currentUrl = window.location.href
            if (currentUrl.indexOf('/course/student/courses') !== -1) {
                const strings = currentUrl.split('/');
                strings.forEach(function (key, index) {
                    if (key.length > 14 && key > 3) {
                        utils.setValue("courseId", key)
                        console.log("courseId", key)
                    }
                })

            }
        },
    }

    window.addEventListener('load', main.init);

    window.addEventListener('load', function () {
        // 监听 Vue 实例的创建
        const vueInstanceObserver = new MutationObserver(function (mutationsList, observer) {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].__vue__) {
                    createQueryScoreInfo()
                    // createCompulsiveFinishWorkButton()
                }
            });
        });

        vueInstanceObserver.observe(document.body, {childList: true, subtree: true});
    })

    class urlConstants {
        static CLASS_LIST = "https://api.zretc.net/instances/instances/stu/my-instance?pageSize=10&pageNum=1&instanceStatus&orderBy=1&orderByWay=DESC"
        static CLEAR_MSG = "https://api.zretc.net/instances/instances/{}/backlog-message/stu/{}"

        // 签到列表
        static SIGN_LIST = "https://api.zretc.net/instances/instances/{}/sign/stu/page?signInName=&stuSignInType=&pageSize=20&pageNum=1"
        // 签到
        static SIGN = "https://api.zretc.net/instances/instances/{}/sign/{}/edit-stu-sign"
        // 签到请求体
        static SIGN_BODY = {
            "signInId": "",
            "studentId": "",
            "remark": "", // 备注
            "stuSignInType": 1 // 签到状态 4=请假 2=迟到 1=签到成功 3=早退 0=未签到
        }

        // 作业列表
        static HOMEWORK_LIST = "https://api.zretc.net/instances/instances/{}/stu/homework-list"

        // 获取作业答案
        static HOMEWORK_DETAIL = "https://api.zretc.net/homework/homeworks/{}/detail-objective-list"

        //作业提交
        static HOMEWORK_SUBMIT = "https://online.zretc.net/api/homework/submits?submitType=1"

        // 获取studentId url
        static STUDENT_ID = "https://api.zretc.net/instances/instances/stu/my-progress/{}"

        static VIDEO_LIST = "https://api.zretc.net/instances/instances/{}/student-study-record"
        static COMPLETE_VIDEO_BODY = {
            "status": 2,
            "instanceChapterId": "1795336607034122241", //
            "instanceId": "1760130398605942786", //
            "resourceCategory": 1,
            "resourceId": "1795336675761987585", //
            "resourceLocation": 9999999,
            "resourceTotal": 9999999
        }

        /**
         * resourceCategory分类
         * 附件 6
         * 视频 1
         * 作业 3
         */

    }

})();
