(function () {
  window.wechatAuthorization = function(wx_oauth) {

    // 招行APP
    if(window.cmb_auth && window.cmb_auth['cmb_auth']){
      // 没有设置授权信息则正常打开，不走授权机制
      if(window.cmb_auth['cmb_auth']==''){
        return;
      }
      var tp = 'tplogin://';
      if(window.location.protocol=='https:') tp = 'tplogins://';
      var url = tp + window.location.host + window.cmb_auth['cmb_redirect_uri'] + '?param=' +window.cmb_auth['params']+'&corpno='+window.cmb_auth['cmb_corpno']+'&auth='+window.cmb_auth['cmb_auth'];

      if(!window.epub360_userinfo.hasOwnProperty('openid')){
        window.location.href = url;
      }else if (window.epub360_userinfo.status == 0){
        url += '&snt=Y';
        window.location.href = url;
      }
      return;
    }

    if (window.location.search.indexOf('notweixin=1') === -1) {
      /**
      * 保留测试功能，可以不依赖微信环境，依然可以让作品正常打开进行播放
      */
      var ua = navigator.userAgent.toLowerCase();
      var isWeixin = (/micromessenger/.test(ua));
      if(!isWeixin && typeof window.e_Debug_weixin!="undefined"){
        if(!window.epub360_userinfo) window.epub360_userinfo = {};
        window.epub360_userinfo.portrait = window.epub360_userinfo.portrait | "" ;
        window.epub360_userinfo.nickname = window.epub360_userinfo.nickname || "Jason";
        return ;
      }
      // 判断 url 中是否含有 notweixin=1 从而判断跳转与否
      if ((wx_oauth.auth_mode === 1 && !window.epub360_userinfo.openid) || (wx_oauth.auth_mode === 2 && !window.epub360_userinfo.nickname)) {


          // 根据参数判断是否跳转
          if (window.wx_config && window.redirect_uri) {
            // 验证是否含有如上，防止报错

            var authStr = Object.entries(wx_oauth.auth_params).map(function (e) {
              return '&' + e[0] + '=' + e[1];
            }).join('');
            var url = wx_oauth.auth_url +
                      "?appid=" + window.wx_config.appId +
                      "&redirect_uri=" + window.encodeURIComponent(window.redirect_uri) +
                      authStr +
                      "#wechat_redirectRI";
            // * --------------------------------  阻止出现微信底部导航条

            if(window.location.replace) window.location.replace(url);
            else window.location.href = url;
          }
      }
    }
  }
})()
