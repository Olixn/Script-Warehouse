// ==UserScript==
// @name                超星学习小助手(娱乐bate版)|适配新版界面|聚合题库|(视频、测验、考试)
// @namespace           nawlgzs@gmail.com
// @version             1.6.0
// @description         推荐使用edge+ScriptCat运行此脚本，感谢油猴中文网的各位大神，学油猴脚本来油猴中文网就对了。实现功能：开放自定义设置、新版考试\考试答案收录、视频倍速\秒过、文档秒过、章节测验答题、收录答案、作业、收录作业答案、读书秒过。
// @author              Ne-21
// @match               *://*.chaoxing.com/*
// @match               *://*.edu.cn/*
// @match               *://*.nbdlib.cn/*
// @match               *://*.hnsyu.net/*
// @connect             api.gocos.cn
// @connect             api-cx.gocos.cn
// @run-at              document-end
// @grant               unsafeWindow
// @grant               GM_xmlhttpRequest
// @grant               GM_setValue
// @grant               GM_getValue
// @grant               GM_info
// @grant               GM_getResourceText
// @require             https://cdn.staticfile.org/limonte-sweetalert2/11.0.1/sweetalert2.all.min.js
// @require             https://cdn.staticfile.org/jquery/3.6.0/jquery.min.js
// @resource            Table https://www.forestpolice.org/ttf/2.0/table.json
// @icon                https://cdn.521daigua.cn/logo.ico
// @supportURL          https://script.521daigua.cn/UserGuide/faq.html
// @homepage            https://script.521daigua.cn
// @contributionURL     https://afdian.net/@Ne_21
// @antifeature         payment
// @license             MIT
// ==/UserScript==


/*********************************自定义配置区******************************************************** */
var setting = {
    showBox: 1,     // 显示脚本浮窗，0为关闭，1为开启，不建议关闭

    task: 0,        // 只处理任务点任务，0为关闭，1为开启

    video: 1,       // 处理视频，0为关闭，1为开启
    audio: 1,       // 处理音频，0为关闭，1为开启
    rate: 1,        // 视频/音频倍速，0为秒过，1为正常速率，最高16倍
    review: 0,      // 复习模式，0为关闭，1为开启可以补挂视频时长

    work: 1,        // 测验自动处理，0为关闭，1为开启，开启将会处理测验，关闭会跳过测验
    // decrypt: 0,     // 解密加密字体，0为关闭，1为开启，目前好像cx取消加密了
    time: 5000,     // 答题时间间隔，默认5s=5000ms
    sub: 1,         // 测验自动提交，0为关闭,1为开启，当没答案时测验将不会提交，如需提交请设置force：1
    force: 0,       // 测验强制提交，0为关闭，1为开启，开启此功能将会强制提交测验（无论作答与否）

    examTurn: 1,     // 考试自动跳转下一题，0为关闭，1为开启

    autoLogin: 0,   // 自动登录，0为关闭，1为开启，开启此功能请配置登陆配置项
    phone: '',      // 登录配置项：登录手机号/超星号
    password: ''    // 登录配置项：登录密码
}
/************************************************************************************************** */
/**
 * 感谢wyn665817、道总、一之哥哥、unrival、cxxjackie等大神！
 * 
**/
/************************************************************************************************** */
/*
      quu..__
       $$$n  `---.__
        "$$n        `--.                          ___.---uuudP
         `$$n           `.__.------.__     __.---'      e$$$"              .
           "$n          -'            `-.-'            e$$"              .'|
             ".                                       e$"             _.'  |
               `.   /                              ..."             .'     |
                 `./                           ..::-'            _.'       |
                  /                         .:::-'            .-'         .'
                 :                          ::''\          _.'            |
                .' .-.             .-.           `.      .'               |
                : /'$$|           .@"$\           `.   .'              _.-'
               .'|$u$$|          |$$,$$|           |  <            _.-'
               | `:$$:'          :$$$$$:           `.  `.       .-'
               :                  `"--'             |    `-.     \
              :##.       ==             .###.       `.      `.    `\
              |##:                      :###:        |        >     >
              |#'     `..'`..'          `###'        x:      /     /
               \                                   xXX|     /    ./
                \                                xXXX'|    /   ./
                /`-.                                  `.  /   /
               :    `-  ...........,                   | /  .'
               |         ``:::::::'       .            |<    `.
               |             ```          |           x| \ `.:``.
               |                         .'    /'   xXX|  `:`M`M':.
               |    |                    ;    /:' xXXX'|  -'MM11M:'
               `.  .'                   :    /:'       |-'M22M.-'
                |  |                   .'   /'        .'MMM.-'
                `'`'                   :  ,'          |MMM<
                  |                     `'            |ne21\
                   \                                  :MM.-'
                    \                 |              .''
                     \.               `.            /
                      /     .:::::::.. :           /
                     |     .:::::::::::`.         /
                     |   .:::------------\       /
                    /   .''               >::'  /
                    `',:                 :    .'
                                         `:.:'
                    Author Ne-21
      */
/************************************************************************************************** */


var _w = unsafeWindow,
    _l = location,
    _d = _w.document,
    $ = _w.jQuery || top.jQuery,
    UE = _w.UE,
    // Typr = Typr || window.Typr,
    // md5 = md5 || window.md5,
    Swal = Swal || window.Swal,
    _host = "https://api.gocos.cn",
    _cxhost = "https://api-cx.gocos.cn";

var _mlist, _defaults, _domList, $subBtn, $saveBtn, $frame_c;

// 强制体验新版，防止出现一些睿智问题
$('.navshow').find('a:contains(体验新版)')[0] ? $('.navshow').find('a:contains(体验新版)')[0].click() : '';

if (_l.hostname == 'i.mooc.chaoxing.com' || _l.hostname == "i.chaoxing.com") {
    showTips();
} else if (_l.pathname == '/login' && setting.autoLogin) {
    showBox()
    setTimeout(() => { autoLogin() }, 3000)
} else if (_l.pathname == '/knowledge/cards') {
    showBox()
    if ($("html").html().indexOf("章节未开放！") != -1 && _l.href.indexOf("ut=s") != -1) {
        _l.href = _l.href.replace("ut=s", "ut=t");
    }
    $('#ne-21log').html('')
    let cur_title = $('#mainid > div.prev_title_pos > div').text()
    if (cur_title == '') {
        logger('Tips:检测当前页面为旧版学习通界面，请使用新版界面的学习通！！！！！！！！！！！！！！！', 'red')
        logger('Tips:如果不使用新版界面的学习通，可能会出现各种睿智问题！！！！！！！！！！！！！！！！', 'red')
    } else {
        logger('当前页面：' + cur_title, 'black')
    }
    var params = getTaskParams()
    if (params == null || params == '$mArg' || $.parseJSON(params)['attachments'].length <= 0) {
        logger('无任务点可处理，即将跳转页面', 'red')
        toNext()
    } else {
        setTimeout(() => {
            _domList = []
            _mlist = $.parseJSON(params)['attachments']
            _defaults = $.parseJSON(params)['defaults']
            $.each($('#iframe').contents().find('.wrap .ans-cc .ans-attach-ct'), (i, t) => {
                _domList.push($(t).find('iframe'))
            })
            missonStart()
        }, 3000)
    }
} else if (_l.pathname == '/exam/test/reVersionTestStartNew') {
    showBox()
    setTimeout(() => { missonExam() }, 3000)
} else if (_l.pathname == '/exam/test/reVersionPaperMarkContentNew') {
    showBox()
    setTimeout(() => { uploadExam() }, 3000)
} else if (_l.pathname == '/mooc2/work/dowork') {
    showBox()
    setTimeout(() => { missonHomeWork() }, 3000)
} else if (_l.pathname == '/mooc2/work/view') {
    showBox()
    setTimeout(() => { uploadHomeWork() }, 3000)
} else if (_l.pathname == '/work/phone/doHomeWork') {
    // FUCK ALERT
    _oldal = _w.alert
    _w.alert = function (msg) {
        if (msg == '保存成功') {
            return;
        }
        return _oldal(msg)
    }
    // FUCK CONFIRM ALERT
    _oldcf = _w.confirm
    _w.confirm = function (msg) {
        if (msg == '确认提交？' || msg.includes('未做完')) {
            return true
        }
        return _oldcf(msg)
    }
} else if (_l.pathname == '/mooc2/exam/exam-list') {
    Swal.fire('注意：专业课可能会存在答案不全或无答案，请谨慎使用脚本考试，开始考试之前请确保该账号已激活脚本。')
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
            logger('Tips:连接服务器失败！！！！！！！！！！！', 'red')
            var _msg = "拖动进度条、倍速播放、秒过会导致不良记录！题库在慢慢补充，搜不到的题目系统会尽快进行自动补充，最新脚本更新发布官网：http://521daigua.cn";
            _w.layui.use('layer', function () {
                this.layer.open({ content: _msg, title: '超星学习小助手提示', btn: '我已知悉', offset: 't', closeBtn: 0 });
            });
        }
    });
}

function showBox() {
    if (setting.showBox && $('#ne-21notice')[0] == undefined) {
        var box_html = `<div id="ne-21box" style="border: 2px dashed rgb(0, 85, 68); width: 330px; position: fixed; top: 5%; right: 20%; z-index: 99999; background-color: rgba(184, 247, 255, 1); overflow-x: auto;">
        <h3 style="text-align: center;">超星学习小助手 By Ne-21<span style="color:red;">(K键隐藏面板)</span></h3>
        <div id="ne-21notice" style="border-top: 1px solid #000;border-bottom: 1px solid #000;margin: 4px 0px;overflow: hidden;"></div>
        <div id="ne-21log" style="max-height:100px;"></div>
    </div>`;
        $(box_html).appendTo('body');
    }
    $(document).keydown(function (e) {
        if (e.keyCode == 75) {
            let show = $('#ne-21box').css('display');
            $('#ne-21box').css('display', show == 'block' ? 'none' : 'block');
        }
    })
    let _u = getCk('_uid') || getCk('UID')
    GM_xmlhttpRequest({
        method: 'GET',
        url: _cxhost + '/notice?u=' + _u + '&v=' + GM_info['script']['version'],
        timeout: 3000,
        onload: function (xhr) {
            if (xhr.status == 200) {
                var obj = $.parseJSON(xhr.responseText) || {};
                var notice = obj.injection;
                localStorage.setItem('token', obj.token ? obj.token : '')
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
    showBox()
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
            if (_mlist[0]['property']['module'] == 'insertvideo') {
                logger('开始处理视频', 'purple')
                missonVideo(_dom, _task)
                break
            } else if (_mlist[0]['property']['module'] == 'insertaudio') {
                logger('开始处理音频', 'purple')
                missonAudio(_dom, _task)
                break
            } else {
                logger('未知类型任务，请联系作者，跳过', 'red')
                switchMission()
                break
            }
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


function missonAudio(dom, obj) {
    if (!setting.audio) {
        logger('用户设置不处理音频任务，准备开始下一个任务。', 'red')
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
            logger('音频：' + name + '检测已完成，准备处理下一个任务', 'green')
            switchMission()
            return
        } else if (setting.review) {
            logger('已开启复习模式，开始处理音频：' + name, 'pink')
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
                        isdrag = 3;
                    var _rt = 0.9;
                    if (setting.rate == 0) {
                        logger('已开启音频秒过，99.9%会导致进度重置、挂科等问题。', 'red')
                        logger('已开启音频秒过，请等待5秒！！！', 'red')
                    } else if (setting.rate > 1 && setting.rate <= 16) {
                        logger('已开启音频倍速，当前倍速：' + setting.rate + ',99.9%会导致进度重置、挂科等问题。', 'red')
                        logger('已开启音频倍速，进度40秒更新一次，请等待！', 'red')
                    } else if (setting.rate > 16) {
                        setting.rate = 1
                        logger('超过允许设置的最大倍数，已重置为1倍速。', 'red')
                    } else {
                        logger("音频进度每隔40秒更新一次，请等待耐心等待...", 'blue')
                    }
                    logger("音频：" + name + "开始播放")
                    updateAudio(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt).then((status) => {
                        switch (status) {
                            case 1:
                                logger("音频：" + name + "已播放" + String((playingTime / duration) * 100).slice(0, 4) + '%', 'purple')
                                isdrag = 0
                                break
                            case 3:
                                _rt = 1
                                break
                            default:
                                console.log(status)
                        }
                    })
                    let _loop = setInterval(() => {
                        playingTime += 40 * setting.rate
                        if (playingTime >= duration || setting.rate == 0) {
                            clearInterval(_loop)
                            playingTime = duration
                            isdrag = 4
                        } else if (rt = 1 && playingTime == 40 * setting.rate) {
                            isdrag = 3
                        } else {
                            isdrag = 0
                        }
                        updateAudio(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt).then((status) => {
                            switch (status) {
                                case 0:
                                    playingTime -= 40
                                    break
                                case 1:
                                    logger("音频：" + name + "已播放" + String((playingTime / duration) * 100).slice(0, 4) + '%', 'purple')
                                    break
                                case 2:
                                    clearInterval(_loop)
                                    logger("音频：" + name + "检测播放完毕，准备处理下一个任务。", 'green')
                                    switchMission()
                                    break
                                case 3:
                                    playingTime -= 40
                                    _rt = Number(_rt) == 1 ? 0.9 : 1
                                    break
                                default:
                                    console.log(status)
                            }
                        })
                    }, setting.rate == 0 ? 5000 : 40000)
                } catch (e) {
                    logger('发生错误：' + e, 'red')
                }
            }
        });
    } else {
        logger('用户设置只处理属于任务点的任务，准备处理下一个任务', 'green')
        switchMission()
        return
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
                        isdrag = 3;
                    var _rt = 0.9;
                    if (setting.rate == 0) {
                        logger('已开启视频秒过，99.9%会导致进度重置、挂科等问题。', 'red')
                        logger('已开启视频秒过，请等待5秒！！！', 'red')
                    } else if (setting.rate > 1 && setting.rate <= 16) {
                        logger('已开启视频倍速，当前倍速：' + setting.rate + ',99.9%会导致进度重置、挂科等问题。', 'red')
                        logger('已开启视频倍速，进度40秒更新一次，请等待！', 'red')
                    } else if (setting.rate > 16) {
                        setting.rate = 1
                        logger('超过允许设置的最大倍数，已重置为1倍速。', 'red')
                    } else {
                        logger("视频进度每隔40秒更新一次，请等待耐心等待...", 'blue')
                    }
                    logger("视频：" + name + "开始播放")
                    updateVideo(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt).then((status) => {
                        switch (status) {
                            case 1:
                                logger("视频：" + name + "已播放" + String((playingTime / duration) * 100).slice(0, 4) + '%', 'purple')
                                isdrag = 0
                                break
                            case 3:
                                _rt = 1
                                break
                            default:
                                console.log(status)
                        }
                    })
                    let _loop = setInterval(() => {
                        playingTime += 40 * setting.rate
                        if (playingTime >= duration || setting.rate == 0) {
                            clearInterval(_loop)
                            playingTime = duration
                            isdrag = 4
                        } else if (rt = 1 && playingTime == 40 * setting.rate) {
                            isdrag = 3
                        } else {
                            isdrag = 0
                        }
                        updateVideo(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt).then((status) => {
                            switch (status) {
                                case 0:
                                    playingTime -= 40
                                    break
                                case 1:
                                    logger("视频：" + name + "已播放" + String((playingTime / duration) * 100).slice(0, 4) + '%', 'purple')
                                    break
                                case 2:
                                    clearInterval(_loop)
                                    logger("视频：" + name + "检测播放完毕，准备处理下一个任务。", 'green')
                                    switchMission()
                                    break
                                case 3:
                                    playingTime -= 40
                                    _rt = Number(_rt) == 1 ? 0.9 : 1
                                    break
                                default:
                                    console.log(status)
                            }
                        })
                    }, setting.rate == 0 ? 5000 : 40000)
                } catch (e) {
                    logger('发生错误：' + e, 'red')
                }
            }
        });
    } else {
        logger('用户设置只处理属于任务点的任务，准备处理下一个任务', 'green')
        switchMission()
        return
    }
}

function missonBook(dom, obj) {
    if (setting.task) {
        if (obj['jobid'] == undefined) {
            logger("当前只处理任务点任务,跳过", 'red')
            switchMission()
            return
        }
    }
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
    if (setting.task) {
        if (obj['jobid'] == undefined) {
            logger("当前只处理任务点任务,跳过", 'red')
            switchMission()
            return
        }
    }
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
    if (setting.task) {
        if (obj['jobid'] == undefined) {
            logger("当前只处理任务点任务,跳过", 'red')
            switchMission()
            return
        }
    }
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
        showBox()
        if (obj['jobid'] !== undefined) {
            var phoneWeb = _l.protocol + '//' + _l.host + '/work/phone/work?workId=' + obj['jobid'].replace('work-', '') + '&courseId=' + _defaults['courseid'] + '&clazzId=' + _defaults['clazzId'] + '&knowledgeId=' + _defaults['knowledgeid'] + '&jobId=' + obj['jobid'] + '&enc=' + obj['enc']
            // setTimeout(() => { startDoCyWork(0, dom) }, 3000)
            setTimeout(() => { startDoPhoneCyWork(0, dom, phoneWeb) }, 3000)
        } else {
            setTimeout(() => { startDoCyWork(0, dom) }, 3000)
        }
    } else {
        logger('用户设置只处理属于任务点的任务，准备处理下一个任务', 'green')
        switchMission()
        return
    }
}

function doPhoneWork($dom) {
    let $cy = $dom.find('.Wrappadding form')
    $subBtn = $cy.find('.zquestions .zsubmit .btn-ok-bottom')
    $saveBtn = $cy.find('.zquestions .zsubmit .btn-save')
    let TimuList = $cy.find('.zquestions .Py-mian1')
    startDoPhoneTimu(0, TimuList)
}

function startDoPhoneTimu(index, TimuList) {
    if (index == TimuList.length) {
        if (setting.sub) {
            logger('测验处理完成，准备自动提交。', 'green')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    logger('提交成功，准备切换下一个任务。', 'green')
                    _mlist.splice(0, 1)
                    _domList.splice(0, 1)
                    setTimeout(() => { switchMission() }, 3000)
                }, 3000)
            }, 5000)
        } else if (setting.force) {
            logger('测验处理完成，存在无答案题目,由于用户设置了强制提交，准备自动提交。', 'red')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    logger('提交成功，准备切换下一个任务。', 'green')
                    _mlist.splice(0, 1)
                    _domList.splice(0, 1)
                    setTimeout(() => { switchMission() }, 3000)
                }, 3000)
            }, 5000)
        } else {
            logger('测验处理完成，存在无答案题目或用户设置不自动提交，自动保存！', 'green')
            setTimeout(() => {
                $saveBtn.click()
                setTimeout(() => {
                    logger('保存成功，准备切换下一个任务。', 'green')
                    _mlist.splice(0, 1)
                    _domList.splice(0, 1)
                    setTimeout(() => { switchMission() }, 3000)
                }, 3000)
            }, 5000)
        }
        return
    }
    let questionFull = $(TimuList[index]).find('.Py-m1-title').html()
    let _question = tidyStr(questionFull).replace(/.*?\[.*?题\]\s*\n\s*/, '').trim()
    let _type = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4, 选择题: 5 })[questionFull.match(/.*?\[(.*?)]|$/)[1]]
    let _a = []
    let _answerTmpArr
    switch (_type) {
        case 0:
            getAnswer(_type, _question).then((agrs) => {
                _answerTmpArr = $(TimuList[index]).find('.answerList.singleChoice li')
                $.each(_answerTmpArr, (i, t) => {
                    _a.push(tidyStr($(t).html()).replace(/^[A-Z]\s*\n\s*/, '').trim())
                })
                let _i = _a.findIndex((item) => item == agrs)
                if (_i == -1) {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setting.sub = 0
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                } else {
                    $(_answerTmpArr[_i]).click()
                    logger('自动答题成功，准备切换下一题', 'green')
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            })
            break
        case 1:
            getAnswer(_type, _question).then((agrs) => {
                if (agrs == '暂无答案') {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setting.sub = 0
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                } else {
                    _answerTmpArr = $(TimuList[index]).find('.answerList.multiChoice li')
                    $.each(_answerTmpArr, (i, t) => {
                        let _tt = tidyStr($(t).html()).replace(/^[A-Z]\s*\n\s*/, '').trim()
                        if (agrs.indexOf(_tt) != -1) {
                            setTimeout(() => { $(_answerTmpArr[i]).click() }, 300)
                        }
                    })
                    let check = 0
                    setTimeout(() => {
                        $.each(_answerTmpArr, (i, t) => {
                            if ($(t).attr('class').indexOf('cur') != -1) {
                                check = 1
                            }
                        })
                        if (check) {
                            logger('自动答题成功，准备切换下一题', 'green')
                        } else {
                            logger('未能正确选择答案，请手动选择，跳过此题', 'red')
                            setting.sub = 0
                        }
                        setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                    }, 1000)
                }
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            })
            break
        case 2:
            getAnswer(_type, _question).then((agrs) => {
                if (agrs == '暂无答案') {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setting.sub = 0
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                    return
                }
                let answers = agrs.split('#')
                let tkList = $(TimuList[index]).find('.blankList2 input')
                $.each(tkList, (i, t) => {
                    setTimeout(() => { $(t).val(answers[i]) }, 200)
                })
                setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            })
            break
        case 3:
            getAnswer(_type, _question).then((agrs) => {
                if (agrs == '暂无答案') {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setting.sub = 0
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                } else {
                    let _true = '正确|是|对|√|T|ri'
                    _answerTmpArr = $(TimuList[index]).find('.answerList.panduan li')
                    if (_true.indexOf(agrs) != -1) {
                        $.each(_answerTmpArr, (i, t) => {
                            if ($(t).attr('val-param') == 'true') {
                                $(t).click()
                            }
                        })
                    } else {
                        $.each(_answerTmpArr, (i, t) => {
                            if ($(t).attr('val-param') == 'false') {
                                $(t).click()
                            }
                        })
                    }
                    logger('自动答题成功，准备切换下一题', 'green')
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            })
            break
        case 5:
            getAnswer(_type, _question).then((agrs) => {
                setting.sub = 0
                logger('此类型题目无法区分单/多选，请手动选择答案', 'red')
                setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
                }
            })
            break
        default:
            logger('暂不支持处理此类型题目：' + questionFull.match(/.*?\[(.*?)]|$/)[1] + ',跳过！请手动作答。', 'red')
            setting.sub = 0
            setTimeout(() => { startDoPhoneTimu(index + 1, TimuList) }, setting.time)
            break
    }
}

function startDoPhoneCyWork(index, doms, phoneWeb) {
    if (index == doms.length) {
        logger('此页面全部测验已处理完毕！准备进行下一项任务')
        setTimeout(missonStart, 5000)
        return
    }
    logger('等待测验框架加载...', 'purple')
    getElement($(doms[index]).contents()[0], 'iframe').then(element => {
        let workIframe = element
        if (workIframe.length == 0) {
            setTimeout(() => { startDoPhoneCyWork(index, doms) }, 5000)
        }
        let workStatus = $(workIframe).contents().find('.CeYan .ZyTop h3 span:nth-child(1)').text().trim()
        if (workStatus.indexOf("已完成") != -1) {
            logger('测验：' + (index + 1) + ',检测到此测验已完成,准备收录答案。', 'green')
            setTimeout(() => { upLoadWork(index, doms, workIframe) }, 2000)
        } else if (workStatus.indexOf("待做") != -1) {
            logger('测验：' + (index + 1) + ',准备处理此测验...', 'purple')
            $(workIframe).attr('src', phoneWeb)
            getElement($(doms[index]).contents()[0], 'iframe[src="' + phoneWeb + '"]').then((element) => {
                setTimeout(() => { doPhoneWork($(element).contents()) }, 3000)
            })
        } else if (workStatus.indexOf('待批阅') != -1) {
            _mlist.splice(0, 1)
            _domList.splice(0, 1)
            logger('测验：' + (index + 1) + ',测验待批阅,跳过', 'red')
            setTimeout(() => { startDoPhoneCyWork(index + 1, doms, phoneWeb) }, 5000)
        } else {
            _mlist.splice(0, 1)
            _domList.splice(0, 1)
            logger('测验：' + (index + 1) + ',未知状态,跳过', 'red')
            setTimeout(() => { startDoPhoneCyWork(index + 1, doms, phoneWeb) }, 5000)
        }
    })
}

function startDoCyWork(index, doms) {
    if (index == doms.length) {
        logger('此页面全部测验已处理完毕！准备进行下一项任务')
        setTimeout(missonStart, 5000)
        return
    }
    logger('等待测验框架加载...', 'purple')
    getElement($(doms[index]).contents()[0], 'iframe').then(element => {
        let workIframe = element
        if (workIframe.length == 0) {
            setTimeout(() => { startDoCyWork(index, doms) }, 5000)
        }
        let workStatus = $(workIframe).contents().find('.CeYan .ZyTop h3 span:nth-child(1)').text().trim()
        if (workStatus.indexOf("已完成") != -1) {
            logger('测验：' + (index + 1) + ',检测到此测验已完成,准备收录答案。', 'green')
            setTimeout(() => { upLoadWork(index, doms, workIframe) }, 2000)
        } else if (workStatus.indexOf("待做") != -1) {
            logger('测验：' + (index + 1) + ',准备处理此测验...', 'purple')
            setTimeout(() => { doWork(index, doms, workIframe) }, 5000)
        } else if (workStatus.indexOf('待批阅') != -1) {
            _mlist.splice(0, 1)
            _domList.splice(0, 1)
            logger('测验：' + (index + 1) + ',测验待批阅,跳过', 'red')
            setTimeout(() => { startDoCyWork(index + 1, doms) }, 5000)
        } else {
            _mlist.splice(0, 1)
            _domList.splice(0, 1)
            logger('测验：' + (index + 1) + ',未知状态,跳过', 'red')
            setTimeout(() => { startDoCyWork(index + 1, doms) }, 5000)
        }
    })
}


function getElement(parent, selector, timeout = 0) {
    /**
     * Author   cxxjackie
     * From     https://bbs.tampermonkey.net.cn
     */
    return new Promise(resolve => {
        let result = parent.querySelector(selector);
        if (result) return resolve(result);
        let timer;
        const mutationObserver = window.MutationObserver || window.WebkitMutationObserver || window.MozMutationObserver;
        if (mutationObserver) {
            const observer = new mutationObserver(mutations => {
                for (let mutation of mutations) {
                    for (let addedNode of mutation.addedNodes) {
                        if (addedNode instanceof Element) {
                            result = addedNode.matches(selector) ? addedNode : addedNode.querySelector(selector);
                            if (result) {
                                observer.disconnect();
                                timer && clearTimeout(timer);
                                return resolve(result);
                            }
                        }
                    }
                }
            });
            observer.observe(parent, {
                childList: true,
                subtree: true
            });
            if (timeout > 0) {
                timer = setTimeout(() => {
                    observer.disconnect();
                    return resolve(null);
                }, timeout);
            }
        } else {
            const listener = e => {
                if (e.target instanceof Element) {
                    result = e.target.matches(selector) ? e.target : e.target.querySelector(selector);
                    if (result) {
                        parent.removeEventListener('DOMNodeInserted', listener, true);
                        timer && clearTimeout(timer);
                        return resolve(result);
                    }
                }
            };
            parent.addEventListener('DOMNodeInserted', listener, true);
            if (timeout > 0) {
                timer = setTimeout(() => {
                    parent.removeEventListener('DOMNodeInserted', listener, true);
                    return resolve(null);
                }, timeout);
            }
        }
    });
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
    let _type = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4 })[$(TiMuList[index]).attr('typename')]
    let _questionFull = $(TiMuList[index]).find('.mark_name').html()
    let _question = tidyStr(_questionFull).replace(/^[(].*?[)]/, '').trim()
    let _a = []
    let _answerTmpArr, _textareaList
    switch (_type) {
        case 0:
            _answerTmpArr = $(TiMuList[index]).find('.stem_answer').find('.answer_p')
            getAnswer(_type, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    _a.push(tidyStr($(t).html()))
                })
                let _i = _a.findIndex((item) => item == agrs)
                if (_i == -1) {
                    logger('未匹配到正确答案，跳过此题', 'red')
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                } else {
                    setTimeout(() => {
                        let check = $(_answerTmpArr[_i]).parent().find('span').attr('class')
                        if (check.indexOf('check_answer') == -1) {
                            $(_answerTmpArr[_i]).parent().click()
                        }
                        logger('自动答题成功，准备切换下一题', 'green')
                        setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                    }, 300)
                }
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                }
            })
            break
        case 1:
            _answerTmpArr = $(TiMuList[index]).find('.stem_answer').find('.answer_p')
            getAnswer(_type, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    if (agrs.indexOf(tidyStr($(t).html())) != -1) {
                        setTimeout(() => {
                            let check = $(_answerTmpArr[i]).parent().find('span').attr('class')
                            if (check.indexOf('check_answer_dx') == -1) {
                                $(_answerTmpArr[i]).parent().click()
                            }
                        }, 300)
                    }
                })
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                }
            })
            break
        case 2:
            _textareaList = $(TiMuList[index]).find('.stem_answer').find('.Answer .divText .textDIV textarea')
            getAnswer(_type, _question).then((agrs) => {
                let _answerTmpArr = agrs.split('#')
                $.each(_textareaList, (i, t) => {
                    let _id = $(t).attr('id')
                    setTimeout(() => { UE.getEditor(_id).setContent(_answerTmpArr[i]) }, 300)
                })
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
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
            getAnswer(_type, _question).then((agrs) => {
                if (_true.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _true.indexOf(item) != -1)
                } else if (_false.indexOf(agrs) != -1) {
                    _i = _a.findIndex((item) => _false.indexOf(item) != -1)
                } else {
                    logger('答案匹配出错，准备切换下一题', 'green')
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                    return
                }
                setTimeout(() => {
                    let check = $(_answerTmpArr[_i]).parent().find('span').attr('class')
                    if (check.indexOf('check_answer') == -1) {
                        $(_answerTmpArr[_i]).parent().click()
                    }
                }, 300)
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                }
            })
            break
        case 4:
            _textareaList = $(TiMuList[index]).find('.stem_answer').find('.eidtDiv textarea')
            getAnswer(_type, _question).then((agrs) => {
                $.each(_textareaList, (i, t) => {
                    let _id = $(t).attr('id')
                    setTimeout(() => { UE.getEditor(_id).setContent(agrs) }, 300)
                })
                logger('自动答题成功，准备切换下一题', 'green')
                setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
                }
            })
            break
        default:
            logger('暂不支持处理此题型：' + $(TiMuList[index]).attr('typename') + ',跳过。', 'red')
            setTimeout(() => { doHomeWork(index + 1, TiMuList) }, setting.time)
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
            getAnswer(_qType, _question).then((agrs) => {
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
                if (agrs['c'] == 0) {
                    toNextExam()
                }
            })
            break
        case 1:
            _answerTmpArr = $_ansdom.find('.clearfix.answerBg .fl.answer_p')
            getAnswer(_qType, _question).then((agrs) => {
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
                if (agrs['c'] == 0) {
                    toNextExam()
                }
            })
            break
        case 2:
            let _textareaList = $_ansdom.find('.Answer .divText .subEditor textarea')
            getAnswer(_qType, _question).then((agrs) => {
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
            getAnswer(_qType, _question).then((agrs) => {
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
            }).catch((agrs) => {
                if (agrs['c'] == 0) {
                    toNextExam()
                }
            })
            break
        default:
            break
    }
}

function toNextExam() {
    if (setting.examTurn) {
        let $_examtable = $('.mark_table').find('.whiteDiv')
        let $nextbtn = $_examtable.find('.nextDiv a')
        setTimeout(() => {
            $nextbtn.click()
        }, 2000)
    } else {
        logger('用户设置不自动跳转下一题，请手动点击', 'blue')
    }
}

function uploadExam() {
    logger('考试答案收录功能处于bate阶段，遇到bug请及时反馈!!', 'red')
    logger('考试答案收录功能处于bate阶段，遇到bug请及时反馈!!', 'red')
    logger('开始收录考试答案', 'green')
    let TimuList = $('.mark_table .mark_item .questionLi')
    let data = []
    $.each(TimuList, (i, t) => {
        let _a = {}
        let _answer
        let _answerTmpArr, _answerList = []
        let TiMuFull = tidyStr($(t).find('h3').html())
        let _type = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4 })[TiMuFull.match(/[(](.*?)[)]|$/)[1].replace(/,.*?分/, '')]
        let _question = TiMuFull.replace(/^[(].*?[)]|$/, '').trim()
        let _rightAns = $(t).find('.mark_answer').find('.colorGreen').text().replace(/正确答案[:：]/, '').trim()
        switch (_type) {
            case 0:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isZero != '0') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        break
                    }
                }
                _answerTmpArr = $(t).find('.mark_letter li')
                $.each(_answerTmpArr, (a, b) => {
                    _answerList.push(tidyStr($(b).html()).replace(/[A-Z].\s*/, ''))
                })
                let _i = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[_rightAns]
                _answer = _answerList[_i]
                _a['question'] = _question
                _a['type'] = _type
                _a['answer'] = _answer
                data.push(_a)
                break
            case 1:
                _answer = []
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isTrue == 'marking_bandui' || _isZero != '0') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        break
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
                _a['question'] = _question
                _a['type'] = _type
                _a['answer'] = _answer.join("#")
                data.push(_a)
                break
            case 2:
                _answerTmpArr = []
                let answers = $(t).find('.mark_answer').find('.colorDeep').find('dd')
                if (_rightAns.length <= 0) {
                    $.each(answers, (i, t) => {
                        _isTrue = $(t).find('span:eq(1)').attr('class')
                        if (_isTrue == 'marking_dui') {
                            _rightAns = $(t).find('span:eq(0)').html()
                            _answerTmpArr.push(_rightAns.replace(/[(][0-9].*?[)]/, '').replace(/第.*?空:/, '').trim())
                        } else {
                            return
                        }
                    })
                    _answer = _answerTmpArr.join('#')
                } else {
                    _answer = _rightAns.replace(/\s/g, '').replace(/[(][0-9].*?[)]/g, '#').replace(/第.*?空:/g, '#').replace(/^#*/,'')
                }
                if (_answer.length != 0) {
                    _a['question'] = _question
                    _a['type'] = _type
                    _a['answer'] = _answer
                    data.push(_a)
                }
                break
            case 3:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isZero != '0') {
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
                _a['question'] = _question
                _a['type'] = _type
                _a['answer'] = _rightAns
                data.push(_a)
                break
            case 4:
                if (_rightAns.length <= 0) {
                    break
                }
                _a['question'] = _question
                _a['type'] = _type
                _a['answer'] = _rightAns
                data.push(_a)
                break
            default:
                break
        }
    })
    setTimeout(() => { uploadAnswer(data) }, 1500)

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

function updateAudio(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt) {
    return new Promise((resolve, reject) => {
        getEnc(classId, userId, jobId, objectId, playingTime, duration, clipTime).then((enc) => {
            $.ajax({
                url: reportUrl + '/' + dtoken + '?clazzId=' + classId + '&playingTime=' + playingTime + '&duration=' + duration + '&clipTime=' + clipTime + '&objectId=' + objectId + '&otherInfo=' + otherInfo + '&jobid=' + jobId + '&userid=' + userId + '&isdrag=' + isdrag + '&view=pc&enc=' + enc + '&rt=' + Number(_rt) + '&dtype=Audio&_t=' + String(Math.round(new Date())),
                type: 'GET',
                success: function (res) {
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
                },
                error: function (xhr) {
                    if (xhr.status == 403) {
                        logger('超星返回错误信息，尝试更换参数，40s后将重试，请等待...', 'red')
                        resolve(3)
                    } else {
                        logger('超星返回错误信息，请联系作者', 'red')
                    }
                }
            })
        })
    })
}

function updateVideo(reportUrl, dtoken, classId, playingTime, duration, clipTime, objectId, otherInfo, jobId, userId, isdrag, _rt) {
    return new Promise((resolve, reject) => {
        getEnc(classId, userId, jobId, objectId, playingTime, duration, clipTime).then((enc) => {
            $.ajax({
                url: reportUrl + '/' + dtoken + '?clazzId=' + classId + '&playingTime=' + playingTime + '&duration=' + duration + '&clipTime=' + clipTime + '&objectId=' + objectId + '&otherInfo=' + otherInfo + '&jobid=' + jobId + '&userid=' + userId + '&isdrag=' + isdrag + '&view=pc&enc=' + enc + '&rt=' + Number(_rt) + '&dtype=Video&_t=' + String(Math.round(new Date())),
                type: 'GET',
                success: function (res) {
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
                },
                error: function (xhr) {
                    if (xhr.status == 403) {
                        logger('超星返回错误信息，尝试更换参数，40s后将重试，请等待...', 'red')
                        resolve(3)
                    } else {
                        logger('超星返回错误信息，请联系作者', 'red')
                    }
                }
            })
        })
    })
}

function upLoadWork(index, doms, dom) {
    let $CyHtml = $(dom).contents().find('.CeYan')
    let TiMuList = $CyHtml.find('.TiMu')
    let data = []
    for (let i = 0; i < TiMuList.length; i++) {
        let _a = {}
        let questionFull = $(TiMuList[i]).find('.Zy_TItle.clearfix > div > div:nth-child(1)').html().trim()
        let _question = tidyStr(questionFull)
        let _TimuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4 })[questionFull.match(/^【(.*?)】|$/)[1]]
        _a['question'] = _question
        _a['type'] = _TimuType
        let _selfAnswerCheck = $(TiMuList[i]).find('.Py_answer.clearfix > i').attr('class')
        let fuckFont = $(TiMuList[i]).find('.Zy_TItle.clearfix > div').attr('class')
        if (fuckFont != 'clearfix') {
            logger('题目检测可能存在加密乱码，暂停录入!!!!!!!!', 'red')
            logger('获取的题目：' + _question, 'red')
            return
        }
        switch (_TimuType) {
            case 0:
                if (_selfAnswerCheck == "fr dui") {
                    let _selfAnswer = ({ A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6 })[$(TiMuList[i]).find('.Py_answer.clearfix > span').html().trim().replace(/正确答案[:：]/, '').replace(/我的答案[:：]/, '').trim()]
                    let _answerForm = $(TiMuList[i]).find('.Zy_ulTop li')
                    let _answer = $(_answerForm[_selfAnswer]).find('a.fl').html()
                    _a['answer'] = tidyStr(_answer)
                }
                break
            case 1:
                let _answerArr = $(TiMuList[i]).find('.Py_answer.clearfix > span').html().trim().replace(/正确答案[:：]/, '').replace(/我的答案[:：]/, '').trim()
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
                    let _answer = $(TiMuList[i]).find('.Py_answer.clearfix > span > i').html().replace(/正确答案[:：]/, '').replace(/我的答案[:：]/, '').trim()
                    _a['answer'] = tidyStr(_answer)
                } else {
                    if ($(TiMuList[i]).find('.Py_answer.clearfix > span > i').html()) {
                        let _answer = $(TiMuList[i]).find('.Py_answer.clearfix > span > i').html().replace(/正确答案[:：]/, '').replace(/我的答案[:：]/, '').trim()
                        _a['answer'] = (tidyStr(_answer) == '√' ? 'x' : '√')
                    } else {
                        break
                    }
                }
                break
            case 4:
                break
        }
        if (_a['answer'] != undefined) {
            data.push(_a)
        } else {
            continue
        }
    }
    uploadAnswer(data).then(() => {
        _mlist.splice(0, 1)
        _domList.splice(0, 1)
        setTimeout(() => { startDoCyWork(index + 1, doms) }, 3000)
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
        let TiMuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4 })[TiMuFull.match(/[(](.*?)[)]|$/)[1].replace(/, .*?分/, '')]
        let TiMu = TiMuFull.replace(/^[(].*?[)]|$/, '').trim()
        let _rightAns = $(t).find('.mark_answer').find('.colorGreen').text().replace(/正确答案[:：]/, '').trim()
        switch (TiMuType) {
            case 0:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isZero != '0') {
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
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isTrue == 'marking_bandui' || _isZero != '0') {
                        _rightAns = $(t).find('.mark_answer').find('.colorDeep').text().replace(/我的答案[:：]/, '').trim()
                    } else {
                        break
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
                _answerTmpArr = []
                let answers = $(t).find('.mark_answer').find('.colorDeep').find('dd')
                if (_rightAns.length <= 0) {
                    $.each(answers, (i, t) => {
                        _isTrue = $(t).find('span:eq(1)').attr('class')
                        if (_isTrue == 'marking_dui') {
                            _rightAns = $(t).find('span:eq(0)').html()
                            _answerTmpArr.push(_rightAns.replace(/[(][0-9].*?[)]/, '').replace(/第.*?空:/, '').trim())
                        } else {
                            return
                        }
                    })
                    _answer = _answerTmpArr.join('#')
                } else {
                    _answer = _rightAns.replace(/\s/g, '').replace(/[(][0-9].*?[)]/g, '#').replace(/第.*?空:/g, '#').replace(/^#*/,'')
                }
                if (_answer.length != 0) {
                    _a['question'] = TiMu
                    _a['type'] = TiMuType
                    _a['answer'] = _answer
                    data.push(_a)
                }
                break
            case 3:
                if (_rightAns.length <= 0) {
                    _isTrue = $(t).find('.mark_answer').find('.mark_score span').attr('class')
                    _isZero = $(t).find('.mark_answer').find('.mark_score .totalScore.fr i').text()
                    if (_isTrue == 'marking_dui' || _isZero != '0') {
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
            case 4:
                if (_rightAns.length <= 0) {
                    break
                }
                _a['question'] = TiMu
                _a['type'] = TiMuType
                _a['answer'] = _rightAns
                data.push(_a)
                break
        }
    })
    setTimeout(() => { uploadAnswer(data) }, 1500)
}

function getEnc(a, b, c, d, e, f, g) {
    return new Promise((resolve, reject) => {
        try {
            GM_xmlhttpRequest({
                url: _cxhost + "/cx/encode?a=" + a + '&b=' + b + '&c=' + c + '&d=' + d + '&e=' + e + '&f=' + f + '&g=' + g + '&v=' + GM_info['script']['version'],
                method: 'GET',
                timeout: 3000,
                headers: {
                    'Authorization': localStorage.getItem('token')
                },
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
                    } else {
                        logger(res['msg'], 'red')
                        reject()
                    }
                }
            })
        } catch (e) {
            logger('获取enc出错！' + e, 'red')
            reject()
        }
    })
}


function getAnswer(_t, _q) {
    return new Promise((resolve, reject) => {
        let _u = getCk('_uid') || getCk('UID')
        GM_xmlhttpRequest({
            method: 'POST',
            url: _cxhost + '/cx/getanswer',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                'Authorization': localStorage.getItem('token')
            },
            data: 'question=' + encodeURIComponent(_q) + '&u=' + _u,
            timeout: setting.time,
            onload: function (xhr) {
                if (xhr.status == 200) {
                    var obj = $.parseJSON(xhr.responseText) || {},
                        _answer = obj.data;
                    if (obj.code) {
                        logger('题目:' + _q + "|答案:" + _answer, 'purple')
                        resolve(_answer)
                    } else if (obj.msg) {
                        logger(obj.msg, 'red')
                        setting.sub = 0
                        reject({ 'c': 0 })
                    } else {
                        logger('题目:' + _q + "|暂无答案", 'red')
                        setting.sub = 0
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

// function fuckCxFontByWyn($dom) {
//     /**
//      * Author wyn665817
//      * https://scriptcat.org/script-show-page/432
//      */
//     logger('开始解析网页加密字体...(方法来自wyn665817大神)', 'red')
//     var $tip = $frame_c.find('style:contains(font-cxsecret)');
//     if (!$tip.length) return;

//     var font = $tip.text().match(/base64,([\w\W]+?)'/)[1];
//     font = Typr.parse(base64ToUint8Array(font))[0];

//     var table = JSON.parse(GM_getResourceText('Table'));
//     var match = {};
//     for (var i = 19968; i < 40870; i++) {
//         $tip = Typr.U.codeToGlyph(font, i);
//         if (!$tip) continue;
//         $tip = Typr.U.glyphToPath(font, $tip);
//         $tip = md5(JSON.stringify($tip)).slice(24);
//         match[i] = table[$tip];
//     }

//     $frame_c.find('.font-cxsecret').html(function (index, html) {
//         $.each(match, function (key, value) {
//             key = String.fromCharCode(key);
//             value = String.fromCharCode(value);
//             html = html.replaceAll(key, value);
//         });
//         return html;
//     }).removeClass('font-cxsecret');
//     logger('解析网页加密字体成功。(方法来自wyn665817大神)', 'red')
// }

// function base64ToUint8Array(base64) {
//     var data = window.atob(base64);
//     var buffer = new Uint8Array(data.length);
//     for (var i = 0; i < data.length; ++i) {
//         buffer[i] = data.charCodeAt(i);
//     }
//     return buffer;
// }

function doWork(index, doms, dom) {
    $frame_c = $(dom).contents();
    // if (setting.decrypt) {
    //     fuckCxFontByWyn()
    // }
    let $CyHtml = $frame_c.find('.CeYan')
    let TiMuList = $CyHtml.find('.TiMu')
    $subBtn = $CyHtml.find('.ZY_sub').find('.Btn_blue_1')
    $saveBtn = $CyHtml.find('.ZY_sub').find('.btnGray_1')
    startDoWork(index, doms, 0, TiMuList)
}

function startDoWork(index, doms, c, TiMuList) {
    if (c == TiMuList.length) {
        if (setting.sub) {
            logger('测验处理完成，准备自动提交。', 'green')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    $frame_c.find('#confirmSubWin > div > div > a.bluebtn').click()
                    logger('提交成功，准备切换下一个任务。', 'green')
                    _mlist.splice(0, 1)
                    _domList.splice(0, 1)
                    setTimeout(() => { startDoCyWork(index + 1, doms) }, 3000)
                }, 3000)
            }, 5000)
        } else if (setting.force) {
            logger('测验处理完成，存在无答案题目,由于用户设置了强制提交，准备自动提交。', 'red')
            setTimeout(() => {
                $subBtn.click()
                setTimeout(() => {
                    $frame_c.find('#confirmSubWin > div > div > a.bluebtn').click()
                    logger('提交成功，准备切换下一个任务。', 'green')
                    _mlist.splice(0, 1)
                    _domList.splice(0, 1)
                    setTimeout(() => { startDoCyWork(index + 1, doms) }, 3000)
                }, 3000)
            }, 5000)
            // } else if (!setting.task) {
            //     logger('此测验不属于任务点，准备跳过。', 'red')
            //     _mlist.splice(0, 1)
            //     _domList.splice(0, 1)
            //     setTimeout(() => { startDoCyWork(index + 1, doms) }, 3000)
        } else {
            logger('测验处理完成，存在无答案题目或者用户设置不提交。', 'red')
        }
        return
    }
    let questionFull = $(TiMuList[c]).find('.Zy_TItle.clearfix > div').html()
    let _question = tidyStr(questionFull)
    let _TimuType = ({ 单选题: 0, 多选题: 1, 填空题: 2, 判断题: 3, 简答题: 4 })[questionFull.match(/^【(.*?)】|$/)[1]]
    let _a = []
    let _answerTmpArr
    switch (_TimuType) {
        case 0:
            _answerTmpArr = $(TiMuList[c]).find('.Zy_ulTop li').find('a')
            $.each(_answerTmpArr, (i, t) => {
                _a.push(tidyStr($(t).html()))
            })
            getAnswer(_TimuType, _question).then((agrs) => {
                let _i = _a.findIndex((item) => item == agrs)
                if (_i == -1) {
                    logger('未匹配到正确答案，跳过', 'red')
                    setting.sub = 0
                } else {
                    $(_answerTmpArr[_i]).parent().find('input').attr('checked', 'checked')
                }
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            })
            break
        case 1:
            _answerTmpArr = $(TiMuList[c]).find('.Zy_ulTop li').find('a')
            getAnswer(_TimuType, _question).then((agrs) => {
                $.each(_answerTmpArr, (i, t) => {
                    if (agrs.indexOf(tidyStr($(t).html())) != -1) {
                        $(_answerTmpArr[i]).parent().find('input').attr('checked', 'checked')
                        _a.push(['A', 'B', 'C', 'D', 'E', 'F', 'G'][i])
                    }
                })
                let id = getStr($(TiMuList[c]).find('.Zy_ulTop li:nth-child(1)').attr('onclick'), 'addcheck(', ');').replace('(', '').replace(')', '')
                if (_a.length <= 0) {
                    logger('未匹配到正确答案，跳过', 'red')
                    setting.sub = 0
                } else {
                    $(TiMuList[c]).find('.Zy_ulTop').parent().find('#answer' + id).val(_a.join(""))
                }
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            })
            break
        case 2:
            let _textareaList = $(TiMuList[c]).find('.Zy_ulTk .XztiHover1')
            getAnswer(_TimuType, _question).then((agrs) => {
                let _answerList = agrs.split("#")
                $.each(_textareaList, (i, t) => {
                    setTimeout(() => {
                        $(t).find('#ueditor_' + i).contents().find('.view p').html(_answerList[i]);
                        $(t).find('textarea').html('<p>' + _answerList[i] + '</p>')
                    }, 300)
                })
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            })
            break
        case 3:
            _answerTmpArr = $(TiMuList[c]).find('.Zy_ulBottom li')
            let _true = '正确|是|对|√|T|ri'
            let _false = '错误|否|错|×|F|wr'
            getAnswer(_TimuType, _question).then((agrs) => {
                if (_true.indexOf(agrs) != -1) {
                    $(TiMuList[c]).find('.Zy_ulBottom li').find('.ri').parent().find('input').attr('checked', 'checked')
                } else if (_false.indexOf(agrs) != -1) {
                    $(TiMuList[c]).find('.Zy_ulBottom li').find('.wr').parent().find('input').attr('checked', 'checked')
                } else {
                    logger('未匹配到正确答案，跳过', 'red')
                    setting.sub = 0
                }
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            })
            break
        case 4:
            let _textareaLista = $(TiMuList[c]).find('.Zy_ulTk .XztiHover1')
            getAnswer(_TimuType, _question).then((agrs) => {
                if (agrs == '暂无答案') {
                    setting.sub = 0
                }
                let _answerList = agrs.split("#")
                $.each(_textareaLista, (i, t) => {
                    setTimeout(() => {
                        $(t).find('#ueditor_' + i).contents().find('.view p').html(_answerList[i]);
                        $(t).find('textarea').html('<p>' + _answerList[i] + '</p>')
                    }, 300)
                })
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            }).catch((agrs) => {
                setTimeout(() => { startDoWork(index, doms, c + 1, TiMuList) }, setting.time)
            })
            break
    }
}

function uploadAnswer(data) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url: _host + '/index.php/cxapi/upload/newup',
            data: 'data=' + encodeURIComponent(JSON.stringify(data)),
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function (xhr) {
                let res = $.parseJSON(xhr.responseText)
                if (res['code'] == 1) {
                    logger('答案收录成功！！此次收录' + res['t'] + '道题目，准备处理下一个任务。', 'green')
                    resolve()
                } else {
                    logger('答案收录失败了，请向作者反馈，准备处理下一个任务。', 'red')
                    resolve()
                }
            }
        })
    })

}

function switchMission() {
    _mlist.splice(0, 1)
    _domList.splice(0, 1)
    setTimeout(missonStart, 5000)
}

function tidyStr(s) {
    if (s) {
        let str = s.replace(/<(?!img).*?>/g, "").replace(/^【.*?】\s*/, '').replace(/\s*（\d+\.\d+分）$/, '').replace(/^\d+[\.、]/, '').trim().replace(/&nbsp;/g, '').replace('javascript:void(0);', '').replace(new RegExp("&nbsp;", ("gm")), '').replace(/^\s+/, '').replace(/\s+$/, '');
        return str
    } else {
        return null
    }
}


