// 如果是微信内打开 from=... ，
//    则根据是否带有指定页信息 pageid=进行页面定位设置
//    否则从第一页开始
// 如果不是微信内打开，不做处理
// TODO 该文件部分结构较为凌乱后面将统一优化  // garrygu 2019/11/04
/* *********************************************************************************/
var ua = navigator.userAgent.toLowerCase();
var _find = function(needle) {
  return ua.indexOf(needle) !== -1;
};
var isWindowsWechat = (/windowswechat/.test(ua));
var isWeixin = (/micromessenger/.test(ua));
var isQQ = (/qq/.test(ua));
var isAndroid = _find('android');
var is7_0_8 = (/micromessenger\/7\.0\.8/.test(ua));
var page_v, page_h, page_query_string, page_id, loop, autostart=false;
/********************************************************************************  END */

/**
 *  在微信下，还原字体默认大小
 */
function recoverWeixinAndroidFontSize() {
  // 设置网页字体为默认大小
  WeixinJSBridge.invoke("setFontSizeCallback", { "fontSize" : 0 });
  // 重写设置网页字体大小的事件
  WeixinJSBridge.on("menu:setfont", function() {
      WeixinJSBridge.invoke("setFontSizeCallback", { "fontSize" : 0 });
  });
}

/**
 * *统一功能函数处理音频因为自动播放的promise reject 的问题
 * @param {promise} playPromise
 */
function mediaPromise(playPromise) {
    /**
     * 处理 media promise 的报错
     */
    if (playPromise !== undefined) {
      playPromise.then(function () {
        // Automatic playback started!
      }).catch(function (error) {
        // Automatic playback failed.
        // Show a UI element to let the user manually start playback.
      });
    }
}

// 需要排除在window weixin上的播放问题
if (isWeixin && !isWindowsWechat){

  page_v = window.message_link.match(/&pageid=page_(\w*)/);
  page_h = window.message_hash.match(/page\/page_(\w*)/);

  if(window.message_link.indexOf('return=1')!=-1){

      // 打开新网页后返回的处理,避免因为带有from参数而无法定位
      window.message_link = window.message_link.replace('return=1', '');

  }else if(window.message_link.indexOf('disableHistoryStart=1')===-1 && page_v && page_v.length){

      // 设置了指定分享页的
      page_query_string = page_v[0];
      page_id = 'page_' + page_v[1];
      // message_link = message_link.replace(page_query_string,'');
      window.location.hash = '#page/'+page_id;

  }else{

    // 来自朋友圈分享／转发消息
    if ( window.location.search.indexOf('from=')>0){
      if (page_h && page_h.length){
        window.location.hash = window.message_hash.replace(page_h[0],'');
      }
    }
  }
}

// 背景音乐文件处理
if ( window.bgsound_id && window.location.search.indexOf(window.bgsound_id) >= 0 ){

    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0; i<vars.length; i++ ) {
        var pair = vars[i].split("=");
        if(pair[0] === window.bgsound_id){
            window.bgsound_src = pair[1];
            break;
        }
    }
}

// 严格依照微信JS-SDK说明文档开发 http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html

var wxConfigReady = true;
var audioPreloadFinished = false;  //
function shareSuccess(){
    $('#epub360-ad').addClass('show');
    if(window.epub360ShareEvent){
      window.epub360ShareEvent();
    }
}
var audioelement;

// * 针对非微信环境  // garrygu 2019/11/04
function playbgsound(){
    if(window.config_player){
        return false; //如果是应用配置,则不自动播放
    }
       if(window.bgsound_id && window.bgsound_src && window.bgsound_id && window.bgsound_src){
            if( window.bgsound_repeat!== undefined && window.bgsound_repeat===false){
                loop="";
            }
            else{
                loop='loop="loop"';
            }
            if(window.bgsound_autostart){


                autostart=true;
            }
            var d = new Date(), h = d.getHours();
            if (h>=20 && h<=23){
              if(window.wx_config['countnum']>30000 && window.clear_loading_progress_waiting > 200) autostart=false;
            }
            var newElement = document.createElement('div');
            newElement.id='soundcontainer';
            document.body.appendChild(newElement);
            var audiocontainer=document.getElementById('soundcontainer');
            var gSound=window.bgsound_src;
            var patch_QQ = 'preload ';
            if(isQQ) patch_QQ = ' preload="none" ';
            audiocontainer.innerHTML = '<audio id="bgsound" ' + patch_QQ + loop + '> <source src="' + gSound + '" /> </audio>';
            window.audio = document.getElementById('bgsound');
            window.audio.src = gSound;
            window.bgsoundEl = window.audio;
            if(autostart) {
                //audio.play();
               // audio.pause();
                //audio.play();
                try {
                    var isPlaying = window.audio.currentTime > 0 && !window.audio.paused && !window.audio.ended
                        && window.audio.readyState > 2;
                    if (!isPlaying) {
                      var playPromise = window.audio.play();
                      mediaPromise(playPromise);
                    }
                }catch(e){}
            }
           if(!audioelement) ;
           else window.interaction_view.playbgsound();
       }
}
// 微信ios 首页视频自动播放
function playVideo() {

        if(typeof $==="undefined") return ;
        if($('.video_auto_play').length){
            //window.document.title = '视频自动播放';
            //console.log('自动播放');
            try{
                var elm = $('.video_auto_play').eq(0).data('element');
                window.interaction_view.media.play(elm);
                //elm.media.play();
                $('.video_auto_play').removeClass('video_auto_play');
            }catch(e){
            }

        }

}
var do_audio_prload = function(_audio){

    try {
        var isPlaying = _audio.currentTime > 0 && !_audio.paused && !_audio.ended
            && _audio.readyState > 2;
        if (!isPlaying) {
            var playPromise = _audio.play();
            mediaPromise(playPromise);
        }
        if (!_audio.paused && !_audio.autoplay) {
            _audio.pause();
        }
    }catch(e){}
}
var playPreloadAudios = function(){
    for(var i in window.preload_audios){
        var _audio = window.preload_audios[i];
        do_audio_prload(_audio);
    }
    audioPreloadFinished = true; // 标记音频预加载结束
}
window.wx_permissions = {};
function load_wx(){
    if(!window.wx.config || !window.wx.ready) return ;
    window.weixin_initial = 1;

    window.wx.config({
      debug: window.wx_config['debug'],
      appId: window.wx_config['appId'],
      timestamp: window.wx_config['timestamp'],
      nonceStr: window.wx_config['nonceStr'],
      signature: window.wx_config['signature'],
      jsApiList: [
                'chooseImage', 'previewImage', 'uploadImage', 'downloadImage',
                'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo',
                'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems','showMenuItems',
                'translateVoice', 'startRecord', 'stopRecord', 'onRecordEnd',
                'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice','downloadVoice','scanQRCode'
          ],
      openTagList: [
        'wx-open-launch-weapp'
      ]
    });
    window.wx.ready(function () {
        console.log('wx_ready');
        if (wxConfigReady){
            window.wx.checkJsApi({
              jsApiList: [
                'chooseImage',
                'previewImage',
                'uploadImage',
                'downloadImage',
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'openLocation',
                'getLocation',
                'hideOptionMenu',
                'showOptionMenu',
                'hideMenuItems',
                'showMenuItems',
                'translateVoice',
                'startRecord',
                'stopRecord',
                'onRecordEnd',
                'playVoice',
                'pauseVoice',
                'stopVoice',
                'uploadVoice',
                'downloadVoice',
                'scanQRCode'
              ],
              success: function (res) {
                  try {
                      window.wx_permissions = typeof(res['checkResult']) === "string" ? JSON.parse(res['checkResult']) : res['checkResult'];
                  }catch(e){
                      window.wx_permissions = {};
                  }
                  window.interaction_view.weixin.share();
              }
            });
        }

        // 预览模式下屏蔽右上角菜单
        if (window.preview_mode){
            // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录3
            window.wx.hideMenuItems({
              menuList: [
                "menuItem:share:appMessage", "menuItem:share:timeline", "menuItem:share:qq", "menuItem:share:weiboApp",
                "menuItem:share:facebook", "menuItem:share:QZone"
              ],
              fail: function(res){
                window.wx.hideOptionMenu();
              }
            });
        }
        //微信全局推送触发事件(测试代码)
        //playbgsound();
        playPreloadAudios();
        if(window.message_link.indexOf('notpiwik=1')===-1){
            if (window.load_analytics && typeof window.load_analytics === 'function'){ window.load_analytics(); }
        }
        if(window.onweixinready){
            window.onweixinready && window.onweixinready();
        }
        playVideo();
    });
}
if(window.wx.error) window.wx.error(function (res) {
  wxConfigReady = false;
  window._gaq.push(['_trackEvent', 'error', 'weixinjsapi', 'initial', res.errMsg, 'false']);
});

// 预览模式下屏蔽右上角菜单
if (window.preview_mode){
    // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录3
    window.wx.hideMenuItems({
      menuList: [
        "menuItem:share:appMessage", "menuItem:share:timeline", "menuItem:share:qq", "menuItem:share:weiboApp",
        "menuItem:share:facebook", "menuItem:share:QZone"
      ],
      fail: function(res){
        window.wx.hideOptionMenu();
      }
    });
}
/*
   * 注意：
   * 1. 所有的JS接口只能在公众号绑定的域名下调用，公众号开发者需要先登录微信公众平台进入“公众号设置”的“功能设置”里填写“JS接口安全域名”。
   * 2. 如果发现在 Android 不能分享自定义内容，请到官网下载最新的包覆盖安装，Android 自定义分享接口需升级至 6.0.2.58 版本及以上。
   * 3. 完整 JS-SDK 文档地址：http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html
   *
   * 如有问题请通过以下渠道反馈：
   * 邮箱地址：weixin-open@qq.com
   * 邮件主题：【微信JS-SDK反馈】具体问题
   * 邮件内容说明：用简明的语言描述问题所在，并交代清楚遇到该问题的场景，可附上截屏图片，微信团队会尽快处理你的反馈。
*/

window._gaq.push(['_setAccount', 'UA-8828452-4']);
window._gaq.push(['_setDomainName', 'epub360.com']);
window._gaq.push(['_trackPageview']);
var _bdhmProtocol = (("https:" === document.location.protocol) ? " https://" : " http://");
window.loadAnalytics = function(){
        console.log("DOM fully loaded and parsed");

        (function() {
            if(!window.Analytics_loaded) { //防止重复加载

                var s = document.getElementsByTagName('script')[0];

                // 播放模式下暂不进行谷歌统计
                // var ga = document.createElement('script');
                // ga.type = 'text/javascript';
                // ga.async = true;
                // ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                // s.parentNode.insertBefore(ga, s);

                // 去除百度统计
                // var ba = document.createElement('script'); ba.type = 'text/javascript';
                // ba.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + "hm.baidu.com/h.js?8f8817ff462f173893d1e1118c2a0ab8";
                // s.parentNode.insertBefore(ba, s);

                // if (typeof Ta == 'undefined') {
                //     var qa = document.createElement('script');
                //     qa.type = 'text/javascript';
                //     qa.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + "tajs.qq.com/stats?sId=46837630";
                //     s.parentNode.insertBefore(qa, s);
                // }

                // initila pwiki analytics
                // var u = "//piwik.epub360.com/";
                // _paq.push(['setTrackerUrl', u + 'piwik.php']);
                // _paq.push(['setSiteId', 1]);
                // var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
                // g.type = 'text/javascript';
                // g.async = true;
                // g.defer = true;
                // g.src = 'http://v2.static.epub360.com/thirdparty/piwik/piwik.js';
                // s.parentNode.insertBefore(g, s);

                window.Analytics_loaded = true;
            }
        })();
}

//处理不是微信的情况下音频的播放
// var ua = navigator.userAgent.toLowerCase();
if(!(/micromessenger/.test(ua))){
  if(window.location.search.indexOf('autoplay=false')==-1){
    playbgsound();
  }
}

function _patchAndroidWeixinAudioPlay(audio){
  // 适用的情况，针对微信android ，背景音乐无法自动播放的情况
  var URL = audio.src;

  var context = new AudioContext();


  var yodelBuffer;
  var source;

  window
  .fetch(URL)
  .then(function(response) {
    return response.arrayBuffer();
  })
  .then(function(arrayBuffer) {
    return context.decodeAudioData(arrayBuffer);
  })
  .then(function(audioBuffer) {
    yodelBuffer = audioBuffer;
    play(yodelBuffer);
  });

  //  playButton.onclick = () => play(yodelBuffer);

  function play(audioBuffer) {
    source = context.createBufferSource();
    source.loop = audio.loop;
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start();
  }
  var audioElement = {
    getSource:function(){
      return source;
    },
    play: function(){
      if(yodelBuffer && !source) {
        try{
          play(yodelBuffer);
        }catch(e){}
      }
      audioElement.paused = false;
    },
    pause: function(){
      try{
        source.stop();
        source = null;
      }catch(e){}
      audioElement.paused = true;
    },
    stop: function(){
      try{
        source.stop();
        source = null;
      }catch(e){}
      audioElement.paused = true;
    },
    paused: false
  }
  return audioElement;
}
