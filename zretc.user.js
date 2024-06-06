// ==UserScript==
// @name        智云枢多功能插件
// @namespace   http://tampermonkey.net/
// @match       https://online.zretc.net/
// @match       https://online.zretc.net/*
// @run-at      document-start
// @version     1.0
// @license     MIT
// @author      Berger
// @description 智云枢一键清除红点提示、一键签到、一键完成作业
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @require     https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.min.js
// @require     https://registry.npmmirror.com/hotkeys-js/3.13.3/files/dist/hotkeys.min.js
// @resource    https://registry.npmmirror.com/sweetalert2/10.16.6/files/dist/sweetalert2.min.css
// ==/UserScript==

(function () {
    'use strict';
    const classList = []

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
                XMLHttpRequest.prototype.open = function (method, url) {
                    if (url.indexOf(apiUrl) !== -1) {
                        this.addEventListener('readystatechange', function () {
                            if (this.readyState === 4) {
                                console.log(this.response)
                                // const res = JSON.parse(this.responseText)
                                // const modifiedProfileInfoResponse = modifyProfileInfoResponse(res)
                                // Object.defineProperty(this, "responseText", {
                                //     writable: true,
                                // });
                                // this.responseText = modifiedProfileInfoResponse
                            }
                        })
                    }

                    originOpen.apply(this, arguments);
                }
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


        }
    ;

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
        completeHomeworkDiv.innerHTML = `<div style="background-color: #FFFFFF;margin-bottom: 10px">
<button class="el-button el-button--danger el-button--small" style="margin: 10px">一键完成</button>
<div role="switch" class="el-switch">
<span style="margin-right: 5px">自动提交 </span>
<input type="checkbox" class="el-switch__input"><span class="el-switch__core" style="width: 40px;"></span></div>
</div>`


        let intervalId = setInterval(async function () {
            const currentUrl = window.location.href
            let homeworkBox = document.querySelectorAll('.right-box');
            if (homeworkBox.length > 0 && (currentUrl.indexOf('&homeworkId=') !== -1)) {
                clearInterval(intervalId); // 停止定时器
                if (homeworkBox[0].firstChild) {
                    homeworkBox[0].insertBefore(completeHomeworkDiv, homeworkBox[0].firstChild);
                } else {
                    homeworkBox[0].appendChild(completeHomeworkDiv);
                }

                let autoSubmitSwitch = completeHomeworkDiv.querySelector('.el-switch')
                autoSubmitSwitch.addEventListener("click", function () {
                    utils.showDialog("自动提交风险提示", "本项目只适配了<选择题、填空题>，其他题型暂未适配，为保证答题安全，暂时不允许开放此项，请检查后手动提交作业！")
                })

                let completeHomeworkDivButton = completeHomeworkDiv.querySelector('.el-button')

                completeHomeworkDivButton.addEventListener("click", async function () {


                    utils.showLoad("正在完成作业，请耐心等待....")
                    const urlObj = new URL(currentUrl);
                    const homeworkId = urlObj.searchParams.get("homeworkId");
                    const homeworkDetail = await utils.sendApi(urlConstants.HOMEWORK_DETAIL.replace("{}", homeworkId), 'GET')
                    const contentObjDTOList = homeworkDetail['data']['contentObjDTOList']
                    // console.log(contentObjDTOList)
                    contentObjDTOList.forEach(function (contentObjDTO, index) {
                        const questionType = contentObjDTO['queType']
                        const answers = contentObjDTO['answer']

                        const questionDiv = document.querySelectorAll(".question")[index]

                        if (questionType === 1 || questionType === 3) {
                            //单选题 or 判断题
                            const optionItem = questionDiv.querySelectorAll(".option-list .option .item")
                            // console.log(index,optionItem)
                            optionItem.forEach(function (item) {
                                // console.log(item.textContent)
                                if (answers === item.textContent) {
                                    // item.click()
                                    // 创建一个点击事件
                                    const clickEvent = document.createEvent('MouseEvent');

                                    // 初始化事件类型为 'click'，并且冒泡和可取消
                                    clickEvent.initEvent('click', true, true);

                                    // 触发点击事件
                                    item.dispatchEvent(clickEvent);
                                }
                            })
                        } else if (questionType === 4) {
                            //填空题
                            const answer = JSON.parse(answers).map(item => item.answer);
                            console.log(answer)

                            const inputList = questionDiv.querySelectorAll(".el-input__inner")

                            inputList.forEach(function (inputElement, index) {
                                console.log(index, inputElement)
                                const inputEvent = document.createEvent('Event');
                                inputEvent.initEvent('input', true, true);
                                inputElement.value = answer[index];
                                inputElement.dispatchEvent(inputEvent);
                                const changeEvent = document.createEvent('Event');
                                changeEvent.initEvent('change', true, true);
                                inputElement.dispatchEvent(changeEvent);
                            })

                        }
                    })
                    utils.showSuccessNotReload("自动答题成功，请检查！")

                })


            }
        }, 1000); // 每隔 1 秒检查一次
    }

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
                        // console.log(key)
                        utils.setValue("courseId", key)
                    }
                })

            }
        }

    }

    window.addEventListener('load', main.init);


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