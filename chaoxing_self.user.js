// ==UserScript==
// @name                超星学习小助手(娱乐bate版)|适配新版界面|聚合题库|(视频、测验、考试)
// @namespace           nawlgzs@gmail.com
// @version             1.3.3
// @description         毕生所学，随缘更新，BUG巨多，推荐使用ScriptCat运行此脚本，仅以此献给我所热爱的事情，感谢wyn665817、道总、一之哥哥、unrival等大神，感谢油猴中文网，学油猴脚本来油猴中文网就对了。实现功能：开放自定义设置、新版考试、视频倍速\秒过、文档秒过、答题、收录答案、作业、收录作业答案、读书秒过。
// @author              Ne-21
// @match               *://*.chaoxing.com/*
// @match               *://*.edu.cn/*
// @match               *://*.nbdlib.cn/*
// @match               *://*.hnsyu.net/*
// @connect             api.gocos.cn
// @run-at              document-end
// @grant               unsafeWindow
// @grant               GM_xmlhttpRequest
// @grant               GM_setValue
// @grant               GM_getValue
// @grant               GM_info
// @require             https://lib.baomitu.com/jquery/2.0.0/jquery.min.js
// @supportURL          https://script.521daigua.cn/UserGuide/faq.html
// @homepage            https://script.521daigua.cn
// @license             MIT
// ==/UserScript==

var setting = {
    task: 1,        // 只处理任务点任务，0为关闭，1为开启

    video: 1,       // 处理视频，0为关闭，1为开启
    rate: 1,        // 视频倍速，0为秒过，1为正常速率，最高16倍
    review: 0,      // 复习模式，0为关闭，1为开启可以补挂视频时长

    work: 1,        // 测验自动处理，0为关闭，1为开启，开启将会处理测验，关闭会跳过测验
    sub: 1,         // 测验自动提交，0为关闭,1为开启，当没答案时测验将不会提交，如需提交请设置force：1
    force: 0,       // 测验强制提交，0为关闭，1为开启，开启此功能将会强制提交测验（无论作答与否）

    autoLogin: 0,   // 自动登录，0为关闭，1为开启，开启此功能请配置登陆配置项
    phone: '',      // 登录配置项：登录手机号/超星号
    password: ''    // 登录配置项：登录密码
}



var _w = unsafeWindow,
    _l = location,
    _d = _w.document,
    $ = _w.jQuery || top.jQuery,
    UE = _w.UE,
    _host = "https://api.gocos.cn";

var _mlist, _defaults, _domList, $subBtn, $saveBtn, $frame_c;

if (_l.hostname == 'i.mooc.chaoxing.com' || _l.hostname == "i.chaoxing.com") {
    showTips();
} else if (_l.pathname == '/login' && setting.autoLogin) {
    showBox()
    setTimeout(() => { autoLogin() }, 3000)
} else if (_l.pathname == '/mycourse/stu') {

} else if (_l.pathname == '/mycourse/studentstudy') {
    showBox()
} else if (_l.pathname == '/knowledge/cards') {
    showBox()
    if ($("html").html().indexOf("章节未开放！") != -1 && _l.href.indexOf("ut=s") != -1) {
        _l.href = _l.href.replace("ut=s", "ut=t");
    }
    $('#ne-21log').html('')
    let cur_title = $('#mainid > div.prev_title_pos > div').text()
    logger('当前页面：' + cur_title, 'black')
    var params = getTaskParams()
    if (params == null || params == '$mArg' || $.parseJSON(params)['attachments'].length <= 0) {
        logger('无任务点可处理，即将跳转页面', 'red')
        toNext()
    } else {
        setTimeout(() => {
            _domList = []
            _mlist = $.parseJSON(params)['attachments']
            _defaults = $.parseJSON(params)['defaults']
            $.each($('#iframe').contents().find('.wrap .ans-attach-ct'), (i, t) => {
                if (!setting.task || $(t).find('.ans-job-icon')[0] != undefined) {
                    _domList.push($(t).find('iframe'))
                }
            })
            missonStart()
        }, 3000)
    }
} else if (_l.pathname == '/exam/test/reVersionTestStartNew') {
    showBox()
    setTimeout(() => { missonExam() }, 3000)
} else if (_l.pathname == '/mooc2/work/dowork') {
    showBox()
    setTimeout(() => { missonHomeWork() }, 3000)
} else if (_l.pathname == '/mooc2/work/view') {
    showBox()
    setTimeout(() => { uploadHomeWork() }, 3000)
} else if (_l.pathname == '/mycourse/studentcourse') {
    // 强制体验新版，防止出现一些睿智问题
    $('.navshow').find('a:contains(体验新版)')[0] ? $('.navshow').find('a:contains(体验新版)')[0].click() : '';
} else {
    console.log(_l.pathname)
}

function parseUrlParams() {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    let _p = {}
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        _p[pair[0]] = pair[1]
    }
    return _p
}

function showTips() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: _host + '/index.php/cxapi/cxtimu/hello',
        timeout: 5000,
        onload: function (xhr) {
            if (xhr.status == 200) {
                var obj = $.parseJSON(xhr.responseText) || {};
                var _msg = obj.msg;
                _w.layui.use('layer', function () {
                    this.layer.open({ content: _msg, title: '超星学习小助手提示', btn: '我已知悉', offset: 't', closeBtn: 0 });
                });
            }
        },
        ontimeout: function () {
            var _msg = "拖动进度条、倍速播放、秒过会导致不良记录！题库在慢慢补充，搜不到的题目系统会尽快进行自动补充，最新脚本更新发布官网：http://521daigua.cn";
            _w.layui.use('layer', function () {
                this.layer.open({ content: _msg, title: '超星学习小助手提示', btn: '我已知悉', offset: 't', closeBtn: 0 });
            });
        }
    });
}

function showBox() {
    if ($('#ne-21notice')[0] == undefined) {
        var box_html = `<div style="border: 2px dashed rgb(0, 85, 68); width: 330px; position: fixed; top: 5%; right: 20%; z-index: 99999; background-color: rgba(184, 247, 255, 1); overflow-x: auto;">
        <h3 style="text-align: center;">超星学习小助手 By Ne-21</h3>
        <div id="ne-21notice" style="border-top: 1px solid #000;border-bottom: 1px solid #000;margin: 4px 0px;overflow: hidden;"></div>
        <div id="ne-21log" style="max-height:100px;"></div>
    </div>`;
        $(box_html).appendTo('body');
    }
    let _u = getCk('_uid') || getCk('UID')
    GM_xmlhttpRequest({
        method: 'GET',
        url: _host + '/index.php/cxapi/cxtimu/notice?u=' + _u + '&v=' + GM_info['script']['version'],
        timeout: 3000,
        onload: function (xhr) {
            if (xhr.status == 200) {
                var obj = $.parseJSON(xhr.responseText) || {};
                var notice = obj.injection;
                $('#ne-21notice').html(notice);
            }
        },
        ontimeout: function () {
            $('#ne-21notice').html("欢迎使用，获取服务器公告超时！");
        }
    });
}

function logger(str, color) {
    var _time = new Date().toLocaleTimeString()
    $('#ne-21log').prepend('<p style="color: ' + color + ';">[' + _time + ']' + str + '</p>')
}

function getStr(str, start, end) {
    let res = str.match(new RegExp(`${start}(.*?)${end}`))
    return res ? res[1] : null
}

function getTaskParams() {
    try {
        var _iframeScripts = $('#iframe')[0].contentDocument.scripts,
            _p = null;
        for (let i = 0; i < _iframeScripts.length; i++) {
            if (_iframeScripts[i].innerHTML.indexOf('mArg = "";') != -1 && _iframeScripts[i].innerHTML.indexOf('==UserScript==') == -1) {
                _p = getStr(_iframeScripts[i].innerHTML.replace(/\s/g, ""), 'try{mArg=', ';}catch');
                return _p
            }
        }
        return _p
    } catch (e) {
        return null
    }

}

function getCk(name) {
    return document.cookie.match(`[;\s+]?${name}=([^;]*)`)?.pop();
}

function autoLogin() {
    logger('用户已设置自动登录', 'green')
    if (setting.phone.length <= 0 || setting.password.length <= 0) {
        logger('用户未设置登录信息', 'red')
        return
    }
    setTimeout(() => {
        $('#phone').val(setting.phone)
        $('#pwd').val(setting.password)
        $('#loginBtn').click()
    }, 3000)
}

function getEnc(a, b, c, d, e, f, g) {
    return new Promise((resolve, reject) => {
        try {
            GM_xmlhttpRequest({
                url: _host + "/index.php/cxapi/out/enc?a=" + a + '&b=' + b + '&c=' + c + '&d=' + d + '&e=' + e + '&f=' + f + '&g=' + g,
                method: 'GET',
                timeout: 3000,
                onload: function (xhr) {
                    let res = $.parseJSON(xhr.responseText)
                    if (res['code'] == 1) {
                        enc = res['enc']
                        if (enc.length != 32) {
                            logger('获取enc出错！' + enc, 'red')
                            reject()
                        } else {
                            resolve(enc)
                        }
                    }
                }
            })
        } catch (e) {
            logger('获取enc出错！' + e, 'red')
            reject()
        }
    })
}

function toNext() {
    refreshCourseList().then((res) => {
        if (setting.review || !setting.work) {
            setTimeout(() => {
                $('#mainid > .prev_next.next').click()
            }, 5000)
            return
        }
        let _t = []
        $.each($(res).find('li'), (_, t) => {
            let curid = $(t).find('.posCatalog_select').attr('id'),
                status = $(t).find('.prevHoverTips').text(),
                name = $(t).find('.posCatalog_name').attr('title')
            if (curid.indexOf('cur') != -1) {
                _t.push({ 'curid': curid, 'status': status, 'name': name })
            }
        })
        let _curChaterId = $('#coursetree').find('.posCatalog_active').attr('id')
        let _curIndex = _t.findIndex((item) => item['curid'] == _curChaterId)
        for (_curIndex; _curIndex < _t.length - 1; _curIndex++) {
            if (_t[_curIndex]['status'].indexOf('待完成') != -1) {
                setTimeout(() => {
                    $('#mainid > .prev_next.next').click()
                }, 5000)
                return
            }
            let t = _t[_curIndex + 1]
            if (t['status'].indexOf('待完成') != -1) {
                setTimeout(() => {
                    $('#mainid > .prev_next.next').click()
                    showBox()
                }, 5000)
                return
            } else if (t['status'].indexOf('闯关模式') != -1) {
                logger('当前为闯关模式，请完成之前的章节', 'red')
                return
            } else if (t['status'].indexOf('开放时间') != -1) {
                logger('章节未开放', 'red')
            } else {
                //  console.log(t)
            }
        }
        logger('此课程处理完毕 By Ne-21', 'green')
        return
    })
}

function missonStart() {
    if (_mlist.length <= 0) {
        logger('此页面任务处理完毕，准备跳转页面', 'green')
        return toNext()
    }
    let _type = _mlist[0]['type'],
        _dom = _domList[0],
        _task = _mlist[0];
    if (_type == undefined) {
        _type = _mlist[0]['property']["module"]
    }
    switch (_type) {
        case "video":
            logger('开始处理视频', 'purple')
            missonVideo(_dom, _task)
            break
        case "workid":
            logger('开始处理测验', 'purple')
            missonWork(_dom, _task)
            break
        case "document":
            logger('开始处理文档', 'purple')
            missonDoucument(_dom, _task)
            break
        case "read":
            logger('开始处理阅读', 'purple')
            missonRead(_dom, _task)
            break
        case "insertbook":
            logger('开始处理读书', 'purple')
            missonBook(_dom, _task)
            break
        default:
            let GarbageTasks = ['insertimage']
            if (GarbageTasks.indexOf(_type) != -1) {
                logger('发现无需处理任务，跳过。', 'red')
                switchMission()
            } else {
                logger('暂不支持处理此类型:' + _type + '，跳过。', 'red')
                switchMission()
            }

    }
}

function missonVideo(dom, obj) {
    if (!setting.video) {
        logger('用户设置不处理视频任务，准备开始下一个任务。', 'red')
        setTimeout(() => { switchMission() }, 3000)
        return
    }
    let isDo;
    if (setting.task) {
        logger("当前只处理任务点任务", 'red')
        if (obj['jobid'] == undefined ? false : true) {
            isDo = true
        } else {
            isDo = false
        }
    } else {
        logger("当前默认处理所有任务（包括非任务点任务）", 'red')
        isDo = true
    }
    if (isDo) {
        let classId = _defaults['clazzId'],
            userId = _defaults['userid'],
            fid = _defaults['fid'],
            reportUrl = _defaults['reportUrl'],
            isPassed = obj['isPassed'],
            otherInfo = obj['otherInfo'],
            jobId = obj['property']['_jobid'],
            name = obj['property']['name'],
            objectId = obj['property']['objectid'];
        let ifs = $(dom).attr('style');
        $(dom).contents().find('body').find('.main').attr('style', 'visibility:hidden;')
        $(dom).contents().find('body').prepend('<img src="https://pic.521daigua.cn/bg.jpg!/format/webp" style="' + ifs + 'display:block;width:100%;"/>')
        if (!setting.review && isPassed == true) {
            logger('视频：' + name + '检测已完成，准备处理下一个任务', 'green')
            switchMission()
            return
        } else if (setting.review) {
            logger('已开启复习模式，开始处理视频：' + name, 'pink')
        }
        $.ajax({
            url: _l.protocol + '//' + _l.host + "/ananas/status/" + objectId + '?k=' + fid + '&flag=normal&_dc=' + String(Math.round(new Date())),
            type: "GET",
            success: function (res) {
                try {
                    let duration = res['duration'],
                        dtoken = res['dtoken'],
                        clipTime = '0_' + duration,
                        playingTime = 0,
                        isdrag = 0;
                    if (setting.rate == 0) {
                        logger('已开启视频秒过，可能会导致进度重置、挂科等问题。', 'red')
                    } else if (setting.rate > 1 && setting.rate <= 16) {
                        logger('已开启视频倍速，当前倍速：' + setting.rate + ',可能会导致进度重置、挂科等问题。', 'red')
                    } else if (setting.rate > 16) {
                        setting.rate = 1
                        logger('超过允许设置的最大倍数，已重置为1倍速。', 'red')
                    }
                    logger("视频：" + name + "开始播放")
                    let _loop = setInterval(() => {
                        playingTime += 40 * setting.rate
                        if (playingTime >= duration || setting.rate == 0) {
                            clearInterval(_loop)
                            playingTime = duration
                            isdrag = 4
                        }
                        updateVideo(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag).then((status) => {
                            switch (status) {
                                case 0:
                                    playingTime -= 40
                                    break
                                case 1:
                                    logger("视频：" + res['filename'] + "已播放" + String((playingTime / duration) * 100).slice(0, 4) + '%', 'purple')
                                    break
                                case 2:
                                    clearInterval(_loop)
                                    logger("视频：" + res['filename'] + "检测播放完毕，准备处理下一个任务。", 'green')
                                    switchMission()
                                    break
                                default:
                                    console.log(status)
                            }
                        })
                    }, 40000)
                } catch (e) {
                    logger('发生错误：' + e, 'red')
                }
            }
        });
    } else {
        logger('用户设置只处理属于任务点的视频，准备处理下一个任务', 'green')
        switchMission()
        return
    }
}

function missonBook(dom, obj) {
    let jobId = obj['property']['jobid'],
        name = obj['property']['bookname'],
        jtoken = obj['jtoken'],
        knowledgeId = _defaults['knowledgeid'],
        courseId = _defaults['courseid'],
        clazzId = _defaults['clazzId'];
    if (obj['job'] == undefined) {
        logger('读书：' + name + '检测已完成，准备执行下一个任务。', 'green')
        switchMission()
        return
    }
    $.ajax({
        url: _l.protocol + "//" + _l.host + '/ananas/job?jobid=' + jobId + '&knowledgeid=' + knowledgeId + '&courseid=' + courseId + '&clazzid=' + clazzId + '&jtoken=' + jtoken + '&_dc=' + String(Math.round(new Date())),
        method: 'GET',
        success: function (res) {
            if (res.status) {
                logger('读书：' + name + res.msg + ',准备执行下一个任务。', 'green')
            } else {
                logger('读书：' + name + '处理异常,跳过。', 'red')
            }
            switchMission()
            return
        },
    })
}

function missonLive(dom, obj) {

}

function missonDoucument(dom, obj) {
    let jobId = obj['property']['jobid'],
        name = obj['property']['name'],
        jtoken = obj['jtoken'],
        knowledgeId = _defaults['knowledgeid'],
        courseId = _defaults['courseid'],
        clazzId = _defaults['clazzId'];
    if (obj['job'] == undefined) {
        logger('文档：' + name + '检测已完成，准备执行下一个任务。', 'green')
        switchMission()
        return
    }
    $.ajax({
        url: _l.protocol + "//" + _l.host + '/ananas/job/document?jobid=' + jobId + '&knowledgeid=' + knowledgeId + '&courseid=' + courseId + '&clazzid=' + clazzId + '&jtoken=' + jtoken + '&_dc=' + String(Math.round(new Date())),
        method: 'GET',
        success: function (res) {
            if (res.status) {
                logger('文档：' + name + res.msg + ',准备执行下一个任务。', 'green')
            } else {
                logger('文档：' + name + '处理异常,跳过。', 'red')
            }
            switchMission()
            return
        },
    })

}

function missonRead(dom, obj) {
    let jobId = obj['property']['jobid'],
        name = obj['property']['title'],
        jtoken = obj['jtoken'],
        knowledgeId = _defaults['knowledgeid'],
        courseId = _defaults['courseid'],
        clazzId = _defaults['clazzId'];
    if (obj['job'] == undefined) {
        logger('阅读：' + name + ',检测已完成，准备执行下一个任务。', 'green')
        switchMission()
        return
    }
    $.ajax({
        url: _l.protocol + '//' + _l.host + '/ananas/job/readv2?jobid=' + jobId + '&knowledgeid=' + knowledgeId + '&courseid=' + courseId + '&clazzid=' + clazzId + '&jtoken=' + jtoken + '&_dc=' + String(Math.round(new Date())),
        method: 'GET',
        success: function (res) {
            if (res.status) {
                logger('阅读：' + name + res.msg + ',准备执行下一个任务。', 'green')
            } else {
                logger('阅读：' + name + '处理异常,跳过。', 'red')
            }
            switchMission()
            return
        }
    })
}

function missonWork(dom, obj) {
    if (!setting.work) {
        logger('用户设置不自动处理测验，准备处理下一个任务', 'green')
        switchMission()
        return
    }
    let isDo;
    if (setting.task) {
        logger("当前只处理任务点任务", 'red')
        if (obj['jobid'] == undefined ? false : true) {
            isDo = true
        } else {
            isDo = false
        }
    } else {
        logger("当前默认处理所有任务（包括非任务点任务）", 'red')
        isDo = true
    }
    if (isDo) {
        let workIframe = $(dom).contents().find('iframe')
        $(workIframe).ready(() => {
            logger('等待测验框架加载...', 'purple')
            if (workIframe.length == 0) { return setTimeout(() => { missonWork(dom, obj) }, 3000) }
            let workStatus = $(workIframe).contents().find('.CeYan .ZyTop h3 span:nth-child(1)').text().trim()
            if (workStatus.indexOf("已完成") != -1) {
                logger('检测到此测验已完成，准备收录答案。', 'green')
                upLoadWork(workIframe)
            } else if (workStatus.indexOf("待做") != -1) {
                logger('准备处理此测验...', 'purple')
                doWork(workIframe)
            } else if (workStatus.indexOf('待批阅') != -1) {
                switchMission()
            } else {
                return setTimeout(() => { missonWork(dom, obj) }, 3000)
            }
        })
    } else {
        logger('用户设置只处理属于任务点的视频，准备处理下一个任务', 'green')
        switchMission()
        return
    }
}

function missonHomeWork() {
    logger('开始处理作业', 'green')
    let $_homeworktable = $('.mark_table').find('form')
    let TimuList = $_homeworktable.find('.questionLi')
    doHomeWork(0, TimuList)
}

function doHomeWork(index, TiMuList) {
    if (index == TiMuList.length) {
        logger('作业题目已全部完成', 'green')
        return
    }
    let _type = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3 })[$(TiMuList[index]).attr('typename')]
    let _questionFull = $(TiMuList[index]).find('.mark_name').html()
    let _question = tidyStr(_questionFull).replace(/^[(].*?[)]/, '').trim()
    let _a = []
    let _answerTmpArr
    switch (_type) {
        case 0:
            _answerTmpArr = $(TiMuList[index]).find('.stem_answer').find('.answer_p')
            getExamAnswer(_type, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    _a.push(tidyStr($(t).html()))
                })
                let _i = _a.findIndex((item) => item == agrs)
                if (_i == -1) {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                } else {
                    setTimeout(() => {
                        $(_answerTmpArr[_i]).parent().click()
                        logger('自动答题成功，准备切换下一题', 'green')
                        setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                    }, 300)
                }
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                }
            })
            break
        case 1:
            _answerTmpArr = $(TiMuList[index]).find('.stem_answer').find('.answer_p')
            getExamAnswer(_type, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    if (agrs.indexOf(tidyStr($(t).html())) != -1) {
                        setTimeout(() => { $(_answerTmpArr[i]).parent().click() }, 300)
                    }
                })
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                }
            })
            break
        case 2:
            let _textareaList = $(TiMuList[index]).find('.stem_answer').find('.Answer .divText .textDIV textarea')
            getExamAnswer(_type, _question).then((agrs) => {
                let _answerTmpArr = agrs.split('#')
                $.each(_textareaList, (i, t) => {
                    let _id = $(t).attr('id')
                    setTimeout(() => { UE.getEditor(_id).setContent(_answerTmpArr[i]) }, 300)
                })
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                }
            })
            break
        case 3:
            let _true = '正确|是|对|√|T|ri'
            let _false = '错误|否|错|×|F|wr'
            let _i = 0
            _answerTmpArr = $(TiMuList[index]).find('.stem_answer').find('.answer_p')
            $.each(_answerTmpArr, (i, t) => {
                _a.push($(t).text().trim())
            })
            getExamAnswer(_qType, _question).then((agrs) => {
                if (_true.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _true.indexOf(item) != -1)
                } else if (_false.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _false.indexOf(item) != -1)
                } else {
                    logger('答案匹配出错，准备切换下一题', 'green')
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
                    return
                }
                setTimeout(() => { $(_answerTmpArr[_i]).parent().click() }, 300)
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
            })
            break
        default:
            logger('暂不支持处理此题型：' + $(TiMuList[index]).attr('typename') + ',跳过。', 'red')
            setTimeout(() => { doHomeWork(index + 1, TiMuList) }, 5000)
    }
}

function missonExam() {
    let $_examtable = $('.mark_table').find('.whiteDiv')
    let _questionFull = tidyStr($_examtable.find('h3.mark_name').html().trim())
    let _qType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3 })[_questionFull.match(/[(](.*?),.*?分[)]|$/)[1]]
    let _question = tidyStr(_questionFull.replace(/[(].*?分[)]/, '').replace(/^\s*/, ''))
    let $_ansdom = $_examtable.find('#submitTest').find('.stem_answer')
    let _answerTmpArr;
    let _a = []
    switch (_qType) {
        case 0:
            _answerTmpArr = $_ansdom.find('.clearfix.answerBg .fl.answer_p')
            getExamAnswer(_qType, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    _a.push(tidyStr($(t).html()))
                })
                let _i = _a.findIndex((item) => item == agrs)
                if (_i == -1) {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setTimeout(toNextExam, 5000)
                } else {
                    setTimeout(() => {
                        if ($(_answerTmpArr[_i]).parent().find('span').attr('class').indexOf('check_answer') == -1) {
                            $(_answerTmpArr[_i]).parent().click()
                            logger('自动答题成功，准备切换下一题', 'green')
                            toNextExam()
                        } else {
                            logger('此题已作答，准备切换下一题', 'green')
                            toNextExam()
                        }
                    }, 300)
                }
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    toNextExam()
                }
            })
            break
        case 1:
            _answerTmpArr = $_ansdom.find('.clearfix.answerBg .fl.answer_p')
            getExamAnswer(_qType, _question).then((agrs) => {
                if ($_ansdom.find('.clearfix.answerBg span.check_answer_dx').length > 0) {
                    logger('此题已作答，准备切换下一题', 'green')
                    toNextExam()
                } else {
                    $.each(_answerTmpArr, (i, t) => {
                        if (agrs.indexOf(tidyStr($(t).html())) != -1) {
                            setTimeout(() => { $(_answerTmpArr[i]).parent().click() }, 300)
                        }
                    })
                    logger('自动答题成功，准备切换下一题', 'green')
                    toNextExam()
                }
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    toNextExam()
                }
            })
            break
        case 2:
            let _textareaList = $_ansdom.find('.Answer .divText .subEditor textarea')
            getExamAnswer(_qType, _question).then((agrs) => {
                let _answerTmpArr = agrs.split('#')
                $.each(_textareaList, (i, t) => {
                    let _id = $(t).attr('id')
                    setTimeout(() => { UE.getEditor(_id).setContent(_answerTmpArr[i]) }, 300)
                })
                logger('自动答题成功，准备切换下一题', 'green')
                toNextExam()
            }).catch((agrs) => {
                if (agrs['c'] = 0) {
                    toNextExam()
                }
            })
            break
        case 3:
            let _true = '正确|是|对|√|T|ri'
            let _false = '错误|否|错|×|F|wr'
            let _i = 0
            _answerTmpArr = $_ansdom.find('.clearfix.answerBg .fl.answer_p')
            $.each(_answerTmpArr, (i, t) => {
                _a.push($(t).text().trim())
            })
            getExamAnswer(_qType, _question).then((agrs) => {
                if (_true.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _true.indexOf(item) != -1)
                } else if (_false.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _false.indexOf(item) != -1)
                } else {
                    logger('答案匹配出错，准备切换下一题', 'green')
                    toNextExam()
                    return
                }
                if ($(_answerTmpArr[_i]).parent().find('span').attr('class').indexOf('check_answer') == -1) {
                    setTimeout(() => { $(_answerTmpArr[_i]).parent().click() }, 300)
                    logger('自动答题成功，准备切换下一题', 'green')
                    toNextExam()
                } else {
                    logger('此题已作答，准备切换下一题', 'green')
                    toNextExam()
                }
            })
            break
        default:
            break
    }
}

function toNextExam() {
    let $_examtable = $('.mark_table').find('.whiteDiv')
    let $nextbtn = $_examtable.find('.nextDiv a')
    setTimeout(() => {
        $nextbtn.click()
    }, 2000)
}


function getExamAnswer(_type, _question) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: _host + '/index.php/cxapi/cxtimu/getanswer?v=2',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
            },
            data: 'question=' + encodeURIComponent(_question),
            timeout: 5000,
            onload: function (xhr) {
                if (xhr.status == 200) {
                    var obj = $.parseJSON(xhr.responseText) || {},
                        _answer = obj.data;
                    if (obj.code) {
                        logger('题目：' + _question + " | 答案：" + _answer, 'purple')
                        resolve(_answer)
                    } else {
                        logger('题目：' + _question + "暂无答案", 'purple')
                        reject({ 'c': 0 })
                    }
                } else if (xhr.status == 403) {
                    logger('请求过于频繁，请稍后再试', 'red')
                    reject({ 'c': 403 })
                } else if (xhr.status == 500) {
                    logger('题库程序异常,请过一会再试', 'red')
                    reject({ 'c': 500 })
                } else if (xhr.status == 444) {
                    logger('IP异常，已被拉入服务器黑名单，请过几个小时再试', 'red')
                    reject({ 'c': 444 })
                } else {
                    logger('题库异常,可能被恶意攻击了...请等待恢复', 'red')
                    reject({ 'c': 555 })
                }
            },
            ontimeout: function () {
                logger('题库异常,可能被恶意攻击了...请等待恢复', 'red')
                reject({ 'c': 666 })
            }
        });
    })
}

function refreshCourseList() {
    let _p = parseUrlParams()
    return new Promise((resolve, reject) => {
        $.ajax({
            url: _l.protocol + '//' + _l.host + '/mycourse/studentstudycourselist?courseId=' + _p['courseid'] + '&chapterId=' + _p['knowledgeid'] + '&clazzid=' + _p['clazzid'] + '&mooc2=1',
            type: 'GET',
            dateType: 'html',
            success: function (res) {
                resolve(res)
            }
        })
    })

}

function updateVideo(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag) {
    return new Promise((resolve, reject) => {
        getEnc(classId, userId, jobId, objectId, playingTime, duration, clipTime).then((enc) => {
            $.ajax({
                url: reportUrl + '/' + dtoken + '?clazzId=' + classId + '&playingTime=' + playingTime + '&duration=' + duration + '&clipTime=' + clipTime + '&objectId=' + objectId + '&otherInfo=' + otherInfo + '&jobid=' + jobId + '&userid=' + userId + '&isdrag=' + isdrag + '&view=pc&enc=' + enc + '&rt=0.9&dtype=Video&_t=' + String(Math.round(new Date())),
                type: 'GET',
                success: function (res) {
                    console.log(res)
                    try {
                        if (res['isPassed']) {
                            if (setting.review && playingTime != duration) {
                                resolve(1)
                            } else {
                                resolve(2)
                            }
                        } else {
                            if (setting.rate == 0 && playingTime == duration) {
                                resolve(2)
                            } else {
                                resolve(1)
                            }
                        }
                    } catch (e) {
                        logger('发生错误：' + e, 'red')
                        resolve(0)
                    }
                }
            })
        })
    })
}

function upLoadWork(dom) {
    let $CyHtml = $(dom).contents().find('.CeYan')
    let TiMuList = $CyHtml.find('.TiMu')
    let data = []
    for (let i = 0; i < TiMuList.length; i++) {
        let _a = {}
        let questionFull = $(TiMuList[i]).find('.Zy_TItle.clearfix > div > div:nth-child(1)').html().trim()
        let _question = tidyStr(questionFull)
        let _TimuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3 })[questionFull.match(/^【(.*?)】|$/)[1]]
        _a['question'] = _question
        _a['type'] = _TimuType
        let _selfAnswerCheck = $(TiMuList[i]).find('.Py_answer.clearfix > i').attr('class')
        switch (_TimuType) {
            case 0:
                if (_selfAnswerCheck == "fr dui") {
                    let _selfAnswer = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[$(TiMuList[i]).find('.Py_answer.clearfix > span').html().trim().replace(/我的答案：/, '')]
                    let _answerForm = $(TiMuList[i]).find('.Zy_ulTop li')
                    let _answer = $(_answerForm[_selfAnswer]).find('a.fl').html()
                    _a['answer'] = tidyStr(_answer)
                }
                break
            case 1:
                let _answerArr = $(TiMuList[i]).find('.Py_answer.clearfix > span').html().trim().replace(/我的答案：/, '').split("")
                let _answerForm = $(TiMuList[i]).find('.Zy_ulTop li')
                let _answer = []
                if (_selfAnswerCheck == "fr dui" || _selfAnswerCheck == "fr bandui") {
                    $.each(_answerArr, (_, item) => {
                        let _answerIndex = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[item]
                        _answer.push($(_answerForm[_answerIndex]).find('a.fl').html())
                    })
                } else {
                    break
                }
                _a['answer'] = tidyStr(_answer.join('#'))
                break
            case 2:
                let _TAnswerArr = $(TiMuList[i]).find('.Py_answer.clearfix .clearfix')
                let _TAnswer = []
                $.each(_TAnswerArr, (_, item) => {
                    if ($(item).find('i').attr('class') == 'fr dui') {
                        _TAnswer.push($(item).find('p').html())
                    }
                })
                if (_TAnswer.length <= 0) { break }
                _a['answer'] = tidyStr(_TAnswer.join('#'))
                break
            case 3:
                if (_selfAnswerCheck == "fr dui") {
                    let _answer = $(TiMuList[i]).find('.Py_answer.clearfix > span > i').html().trim().replace(/我的答案：/, '')
                    _a['answer'] = tidyStr(_answer)
                } else {
                    let _answer = $(TiMuList[i]).find('.Py_answer.clearfix > span > i').html().trim().replace(/我的答案：/, '')
                    _a['answer'] = (tidyStr(_answer) == '√' ? 'x' : '√')
                }
                break
        }
        if (_a['answer'] != undefined) {
            data.push(_a)
        } else {
            continue
        }
    }
    GM_xmlhttpRequest({
        url: _host + '/index.php/cxapi/upload/newup',
        data: 'data=' + JSON.stringify(data),
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (xhr) {
            let res = $.parseJSON(xhr.responseText)
            if (res['code'] == 1) {
                logger('答案收录成功！！准备处理下一个任务。', 'green')
            } else {
                logger('答案收录失败了，请向作者反馈，准备处理下一个任务。', 'red')
            }
            switchMission()
        }
    })
}


function uploadHomeWork() {
    logger('开始收录答案', 'green')
    let $_homeworktable = $('.mark_table')
    let TiMuList = $_homeworktable.find('.mark_item').find('.questionLi')
    let data = []
    $.each(TiMuList, (i, t) => {
        let _a = {}
        let _answer
        let _answerTmpArr, _answerList = []
        let TiMuFull = tidyStr($(t).find('h3.mark_name').html())
        let TiMuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3 })[TiMuFull.match(/[(](.*?)[)]|$/)[1]]
        let TiMu = TiMuFull.replace(/^[(].*?[)]|$/, '').trim()
        let _rightAns = $(t).find('.mark_answer').find('.colorGreen').text().replace(/正确答案[:：]/, '').trim()
        switch (TiMuType) {
            case 0:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    if (_isTrue == 'marking_dui') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        return
                    }
                }
                _answerTmpArr = $(t).find('.mark_letter li')
                $.each(_answerTmpArr, (a, b) => {
                    _answerList.push(tidyStr($(b).html()).replace(/[A-Z].\s*/, ''))
                })
                let _i = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[_rightAns]
                _answer = _answerList[_i]
                _a['question'] = TiMu
                _a['type'] = TiMuType
                _a['answer'] = _answer
                data.push(_a)
                break
            case 1:
                _answer = []
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    if (_isTrue == 'marking_dui' || _isTrue == 'marking_bandui') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        return
                    }
                }
                _answerTmpArr = $(t).find('.mark_letter li')
                $.each(_answerTmpArr, (a, b) => {
                    _answerList.push(tidyStr($(b).html()).replace(/[A-Z].\s*/, ''))
                })
                $.each(_rightAns.split(''), (c, d) => {
                    let _i = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[d]
                    _answer.push(_answerList[_i])
                })
                _a['question'] = TiMu
                _a['type'] = TiMuType
                _a['answer'] = _answer.join("#")
                data.push(_a)
                break
            case 2:
                _answer = []
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    if (_isTrue == 'marking_dui' || _isTrue == 'marking_bandui') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        return
                    }
                }
                break
            case 3:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    if (_isTrue == 'marking_dui') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        let _true = '正确|是|对|√|T|ri'
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                        if (_true.indexOf(_rightAns) != -1) {
                            _rightAns = '错'
                        } else {
                            _rightAns = '对'
                        }
                    }
                }
                _a['question'] = TiMu
                _a['type'] = TiMuType
                _a['answer'] = _rightAns
                data.push(_a)
                break
        }
    })
    GM_xmlhttpRequest({
        url: _host + '/index.php/cxapi/upload/newup',
        data: 'data=' + JSON.stringify(data),
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (xhr) {
            let res = $.parseJSON(xhr.responseText)
            if (res['code'] == 1) {
                logger('答案收录成功！！准备处理下一个任务。', 'green')
            } else {
                logger('答案收录失败了，请向作者反馈，准备处理下一个任务。', 'red')
            }
        }
    })
}


function doWork(dom) {
    let $CyHtml = $(dom).contents().find('.CeYan')
    let TiMuList = $CyHtml.find('.TiMu')
    let index = 0
    $frame_c = $(dom).contents()
    $subBtn = $CyHtml.find('.ZY_sub').find('.Btn_blue_1')
    $saveBtn = $CyHtml.find('.ZY_sub').find('.btnGray_1')
    getAnswer(index, TiMuList).then((args) => {
        setTimeout(() => { resolveCallback(args) }, 5000)
    }).catch((args) => {
        setTimeout(() => { rejectCallback(args) }, 5000)
    })
}

function resolveCallback(args) {
    if (args == undefined) {
        if (setting.sub) {
            logger('测验处理完成，准备自动提交。', 'green')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    $frame_c.find('#confirmSubWin > div > div > a.bluebtn').click()
                    logger('提交成功，准备切换下一个任务。', 'green')
                    switchMission()
                }, 3000)
            }, 5000)
        } else if (setting.force) {
            logger('测验处理完成，存在无答案题目,由于用户设置了强制提交，准备自动提交。', 'red')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    $frame_c.find('#confirmSubWin > div > div > a.bluebtn').click()
                    logger('提交成功，准备切换下一个任务。', 'green')
                    switchMission()
                }, 3000)
            }, 5000)
        } else {
            logger('测验处理完成，存在无答案题目或用户设置不自动提交。', 'green')
        }
    } else {
        getAnswer(args['index'] + 1, args['TiMuList']).then((args) => {
            setTimeout(() => { resolveCallback(args) }, 5000)
        })
    }
}

function rejectCallback(args) {
    if (args['c'] == 0) {
        setting.sub = 0
        setTimeout(() => { resolveCallback(args) }, 5000)
    } else {
        getAnswer(args['index'], args['TiMuList']).then((args) => {
            setTimeout(() => { resolveCallback(args) }, 5000)
        })
    }
}

function getAnswer(index, TiMuList) {
    return new Promise((resolve, reject) => {
        if (index + 1 == TiMuList.length) { resolve() } {
            let questionFull = $(TiMuList[index]).find('.Zy_TItle.clearfix > div').html()
            let _question = tidyStr(questionFull)
            let _TimuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3 })[questionFull.match(/^【(.*?)】|$/)[1]]
            GM_xmlhttpRequest({
                method: 'POST',
                url: _host + '/index.php/cxapi/cxtimu/getanswer?v=2',
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                },
                data: 'question=' + encodeURIComponent(_question),
                timeout: 5000,
                onload: function (xhr) {
                    if (xhr.status == 200) {
                        var obj = $.parseJSON(xhr.responseText) || {},
                            _answer = obj.data;
                        if (obj.code) {
                            logger('题目' + (index + 1) + '：' + _question + " | 答案：" + _answer, 'purple')
                            fillAnswer(TiMuList[index], { index, _TimuType, _answer })
                            resolve({ index, TiMuList })
                        } else {
                            logger('题目' + (index + 1) + '：' + _question + "暂无答案", 'purple')
                            reject({ index, 'c': 0, TiMuList })
                        }
                    } else if (xhr.status == 403) {
                        logger('请求过于频繁，请稍后再试', 'red')
                        reject({ index, 'c': 403, TiMuList })
                    } else if (xhr.status == 500) {
                        logger('题库程序异常,请过一会再试', 'red')
                        reject({ index, 'c': 500, TiMuList })
                    } else if (xhr.status == 444) {
                        logger('IP异常，已被拉入服务器黑名单，请过几个小时再试', 'red')
                        reject({ index, 'c': 444, TiMuList })
                    } else {
                        logger('题库异常,可能被恶意攻击了...请等待恢复', 'red')
                        reject({ index, 'c': 555, TiMuList })
                    }
                },
                ontimeout: function () {
                    logger('题库异常,可能被恶意攻击了...请等待恢复', 'red')
                    reject({ index, 'c': 666, TiMuList })
                }
            });
        }
    })
}

function fillAnswer(dom, obj) {
    let _answerTmpArr;
    let _a = []
    switch (obj['_TimuType']) {
        case 0:
            _answerTmpArr = $(dom).find('.Zy_ulTop li').find('a')
            $.each(_answerTmpArr, (i, t) => {
                _a.push(tidyStr($(t).html()))
            })
            let _i = _a.findIndex((item) => item == obj['_answer'])
            if (_i == -1) { return setting.sub = 0 }
            $(_answerTmpArr[_i]).parent().find('input').attr('checked', 'checked')
            break
        case 1:
            _answerTmpArr = $(dom).find('.Zy_ulTop li').find('a')
            $.each(_answerTmpArr, (i, t) => {
                if (obj['_answer'].indexOf(tidyStr($(t).html())) != -1) {
                    $(_answerTmpArr[i]).parent().find('input').attr('checked', 'checked')
                    _a.push(['A', 'B', 'C', 'D', 'E', 'F', 'G'][i])
                } else {

                }
            })
            let id = getStr($(dom).find('.Zy_ulTop li:nth-child(1)').attr('onclick'), 'addcheck(', ');').replace('(', '').replace(')', '')
            if (_a.length <= 0) { return setting.sub = 0 }
            $(dom).find('.Zy_ulTop').parent().find('#answer' + id).val(_a.join(""))
            break
        case 2:
            let _textareaList = $(dom).find('.Zy_ulTk .XztiHover1')
            let _answerList = obj['_answer'].split("#")
            $.each(_textareaList, (i, t) => {
                setTimeout(() => {
                    $(t).find('#ueditor_' + i).contents().find('.view p').html(_answerList[i]);
                    $(t).find('textarea').html('<p>' + _answerList[i] + '</p>')
                }, 300)
            })
            break
        case 3:
            _answerTmpArr = $(dom).find('.Zy_ulBottom li')
            let _true = '正确|是|对|√|T|ri'
            let _false = '错误|否|错|×|F|wr'
            if (_true.indexOf(obj['_answer']) != -1) {
                $(dom).find('.Zy_ulBottom li').find('.ri').parent().find('input').attr('checked', 'checked')
            } else if (_false.indexOf(obj['_answer']) != -1) {
                $(dom).find('.Zy_ulBottom li').find('.wr').parent().find('input').attr('checked', 'checked')
            } else {
                return setting.sub = 0
            }
            break
    }
}

function switchMission() {
    _mlist.splice(0, 1)
    _domList.splice(0, 1)
    setTimeout(missonStart, 5000)
}

function tidyStr(s) {
    let str = s.replace(/<(?!img).*?>/g, "").replace(/^【.*?】\s*/, '').replace(/\s*（\d+\.\d+分）$/, '').replace(/^\d+[\.、]/, '').trim().replace(/&nbsp;/g, '')
    return str
}


