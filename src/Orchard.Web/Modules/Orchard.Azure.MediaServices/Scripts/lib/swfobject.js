/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzd2ZvYmplY3QuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcdFNXRk9iamVjdCB2Mi4yIDxodHRwOi8vY29kZS5nb29nbGUuY29tL3Avc3dmb2JqZWN0Lz4gXHJcblx0aXMgcmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIDxodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocD4gXHJcbiovXHJcbnZhciBzd2ZvYmplY3Q9ZnVuY3Rpb24oKXt2YXIgRD1cInVuZGVmaW5lZFwiLHI9XCJvYmplY3RcIixTPVwiU2hvY2t3YXZlIEZsYXNoXCIsVz1cIlNob2Nrd2F2ZUZsYXNoLlNob2Nrd2F2ZUZsYXNoXCIscT1cImFwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoXCIsUj1cIlNXRk9iamVjdEV4cHJJbnN0XCIseD1cIm9ucmVhZHlzdGF0ZWNoYW5nZVwiLE89d2luZG93LGo9ZG9jdW1lbnQsdD1uYXZpZ2F0b3IsVD1mYWxzZSxVPVtoXSxvPVtdLE49W10sST1bXSxsLFEsRSxCLEo9ZmFsc2UsYT1mYWxzZSxuLEcsbT10cnVlLE09ZnVuY3Rpb24oKXt2YXIgYWE9dHlwZW9mIGouZ2V0RWxlbWVudEJ5SWQhPUQmJnR5cGVvZiBqLmdldEVsZW1lbnRzQnlUYWdOYW1lIT1EJiZ0eXBlb2Ygai5jcmVhdGVFbGVtZW50IT1ELGFoPXQudXNlckFnZW50LnRvTG93ZXJDYXNlKCksWT10LnBsYXRmb3JtLnRvTG93ZXJDYXNlKCksYWU9WT8vd2luLy50ZXN0KFkpOi93aW4vLnRlc3QoYWgpLGFjPVk/L21hYy8udGVzdChZKTovbWFjLy50ZXN0KGFoKSxhZj0vd2Via2l0Ly50ZXN0KGFoKT9wYXJzZUZsb2F0KGFoLnJlcGxhY2UoL14uKndlYmtpdFxcLyhcXGQrKFxcLlxcZCspPykuKiQvLFwiJDFcIikpOmZhbHNlLFg9IStcIlxcdjFcIixhZz1bMCwwLDBdLGFiPW51bGw7aWYodHlwZW9mIHQucGx1Z2lucyE9RCYmdHlwZW9mIHQucGx1Z2luc1tTXT09cil7YWI9dC5wbHVnaW5zW1NdLmRlc2NyaXB0aW9uO2lmKGFiJiYhKHR5cGVvZiB0Lm1pbWVUeXBlcyE9RCYmdC5taW1lVHlwZXNbcV0mJiF0Lm1pbWVUeXBlc1txXS5lbmFibGVkUGx1Z2luKSl7VD10cnVlO1g9ZmFsc2U7YWI9YWIucmVwbGFjZSgvXi4qXFxzKyhcXFMrXFxzK1xcUyskKS8sXCIkMVwiKTthZ1swXT1wYXJzZUludChhYi5yZXBsYWNlKC9eKC4qKVxcLi4qJC8sXCIkMVwiKSwxMCk7YWdbMV09cGFyc2VJbnQoYWIucmVwbGFjZSgvXi4qXFwuKC4qKVxccy4qJC8sXCIkMVwiKSwxMCk7YWdbMl09L1thLXpBLVpdLy50ZXN0KGFiKT9wYXJzZUludChhYi5yZXBsYWNlKC9eLipbYS16QS1aXSsoLiopJC8sXCIkMVwiKSwxMCk6MH19ZWxzZXtpZih0eXBlb2YgTy5BY3RpdmVYT2JqZWN0IT1EKXt0cnl7dmFyIGFkPW5ldyBBY3RpdmVYT2JqZWN0KFcpO2lmKGFkKXthYj1hZC5HZXRWYXJpYWJsZShcIiR2ZXJzaW9uXCIpO2lmKGFiKXtYPXRydWU7YWI9YWIuc3BsaXQoXCIgXCIpWzFdLnNwbGl0KFwiLFwiKTthZz1bcGFyc2VJbnQoYWJbMF0sMTApLHBhcnNlSW50KGFiWzFdLDEwKSxwYXJzZUludChhYlsyXSwxMCldfX19Y2F0Y2goWil7fX19cmV0dXJue3czOmFhLHB2OmFnLHdrOmFmLGllOlgsd2luOmFlLG1hYzphY319KCksaz1mdW5jdGlvbigpe2lmKCFNLnczKXtyZXR1cm59aWYoKHR5cGVvZiBqLnJlYWR5U3RhdGUhPUQmJmoucmVhZHlTdGF0ZT09XCJjb21wbGV0ZVwiKXx8KHR5cGVvZiBqLnJlYWR5U3RhdGU9PUQmJihqLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXXx8ai5ib2R5KSkpe2YoKX1pZighSil7aWYodHlwZW9mIGouYWRkRXZlbnRMaXN0ZW5lciE9RCl7ai5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLGYsZmFsc2UpfWlmKE0uaWUmJk0ud2luKXtqLmF0dGFjaEV2ZW50KHgsZnVuY3Rpb24oKXtpZihqLnJlYWR5U3RhdGU9PVwiY29tcGxldGVcIil7ai5kZXRhY2hFdmVudCh4LGFyZ3VtZW50cy5jYWxsZWUpO2YoKX19KTtpZihPPT10b3ApeyhmdW5jdGlvbigpe2lmKEope3JldHVybn10cnl7ai5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoXCJsZWZ0XCIpfWNhdGNoKFgpe3NldFRpbWVvdXQoYXJndW1lbnRzLmNhbGxlZSwwKTtyZXR1cm59ZigpfSkoKX19aWYoTS53ayl7KGZ1bmN0aW9uKCl7aWYoSil7cmV0dXJufWlmKCEvbG9hZGVkfGNvbXBsZXRlLy50ZXN0KGoucmVhZHlTdGF0ZSkpe3NldFRpbWVvdXQoYXJndW1lbnRzLmNhbGxlZSwwKTtyZXR1cm59ZigpfSkoKX1zKGYpfX0oKTtmdW5jdGlvbiBmKCl7aWYoSil7cmV0dXJufXRyeXt2YXIgWj1qLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXS5hcHBlbmRDaGlsZChDKFwic3BhblwiKSk7Wi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKFopfWNhdGNoKGFhKXtyZXR1cm59Sj10cnVlO3ZhciBYPVUubGVuZ3RoO2Zvcih2YXIgWT0wO1k8WDtZKyspe1VbWV0oKX19ZnVuY3Rpb24gSyhYKXtpZihKKXtYKCl9ZWxzZXtVW1UubGVuZ3RoXT1YfX1mdW5jdGlvbiBzKFkpe2lmKHR5cGVvZiBPLmFkZEV2ZW50TGlzdGVuZXIhPUQpe08uYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIixZLGZhbHNlKX1lbHNle2lmKHR5cGVvZiBqLmFkZEV2ZW50TGlzdGVuZXIhPUQpe2ouYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIixZLGZhbHNlKX1lbHNle2lmKHR5cGVvZiBPLmF0dGFjaEV2ZW50IT1EKXtpKE8sXCJvbmxvYWRcIixZKX1lbHNle2lmKHR5cGVvZiBPLm9ubG9hZD09XCJmdW5jdGlvblwiKXt2YXIgWD1PLm9ubG9hZDtPLm9ubG9hZD1mdW5jdGlvbigpe1goKTtZKCl9fWVsc2V7Ty5vbmxvYWQ9WX19fX19ZnVuY3Rpb24gaCgpe2lmKFQpe1YoKX1lbHNle0goKX19ZnVuY3Rpb24gVigpe3ZhciBYPWouZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdO3ZhciBhYT1DKHIpO2FhLnNldEF0dHJpYnV0ZShcInR5cGVcIixxKTt2YXIgWj1YLmFwcGVuZENoaWxkKGFhKTtpZihaKXt2YXIgWT0wOyhmdW5jdGlvbigpe2lmKHR5cGVvZiBaLkdldFZhcmlhYmxlIT1EKXt2YXIgYWI9Wi5HZXRWYXJpYWJsZShcIiR2ZXJzaW9uXCIpO2lmKGFiKXthYj1hYi5zcGxpdChcIiBcIilbMV0uc3BsaXQoXCIsXCIpO00ucHY9W3BhcnNlSW50KGFiWzBdLDEwKSxwYXJzZUludChhYlsxXSwxMCkscGFyc2VJbnQoYWJbMl0sMTApXX19ZWxzZXtpZihZPDEwKXtZKys7c2V0VGltZW91dChhcmd1bWVudHMuY2FsbGVlLDEwKTtyZXR1cm59fVgucmVtb3ZlQ2hpbGQoYWEpO1o9bnVsbDtIKCl9KSgpfWVsc2V7SCgpfX1mdW5jdGlvbiBIKCl7dmFyIGFnPW8ubGVuZ3RoO2lmKGFnPjApe2Zvcih2YXIgYWY9MDthZjxhZzthZisrKXt2YXIgWT1vW2FmXS5pZDt2YXIgYWI9b1thZl0uY2FsbGJhY2tGbjt2YXIgYWE9e3N1Y2Nlc3M6ZmFsc2UsaWQ6WX07aWYoTS5wdlswXT4wKXt2YXIgYWU9YyhZKTtpZihhZSl7aWYoRihvW2FmXS5zd2ZWZXJzaW9uKSYmIShNLndrJiZNLndrPDMxMikpe3coWSx0cnVlKTtpZihhYil7YWEuc3VjY2Vzcz10cnVlO2FhLnJlZj16KFkpO2FiKGFhKX19ZWxzZXtpZihvW2FmXS5leHByZXNzSW5zdGFsbCYmQSgpKXt2YXIgYWk9e307YWkuZGF0YT1vW2FmXS5leHByZXNzSW5zdGFsbDthaS53aWR0aD1hZS5nZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiKXx8XCIwXCI7YWkuaGVpZ2h0PWFlLmdldEF0dHJpYnV0ZShcImhlaWdodFwiKXx8XCIwXCI7aWYoYWUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikpe2FpLnN0eWxlY2xhc3M9YWUuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIil9aWYoYWUuZ2V0QXR0cmlidXRlKFwiYWxpZ25cIikpe2FpLmFsaWduPWFlLmdldEF0dHJpYnV0ZShcImFsaWduXCIpfXZhciBhaD17fTt2YXIgWD1hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcmFtXCIpO3ZhciBhYz1YLmxlbmd0aDtmb3IodmFyIGFkPTA7YWQ8YWM7YWQrKyl7aWYoWFthZF0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKS50b0xvd2VyQ2FzZSgpIT1cIm1vdmllXCIpe2FoW1hbYWRdLmdldEF0dHJpYnV0ZShcIm5hbWVcIildPVhbYWRdLmdldEF0dHJpYnV0ZShcInZhbHVlXCIpfX1QKGFpLGFoLFksYWIpfWVsc2V7cChhZSk7aWYoYWIpe2FiKGFhKX19fX19ZWxzZXt3KFksdHJ1ZSk7aWYoYWIpe3ZhciBaPXooWSk7aWYoWiYmdHlwZW9mIFouU2V0VmFyaWFibGUhPUQpe2FhLnN1Y2Nlc3M9dHJ1ZTthYS5yZWY9Wn1hYihhYSl9fX19fWZ1bmN0aW9uIHooYWEpe3ZhciBYPW51bGw7dmFyIFk9YyhhYSk7aWYoWSYmWS5ub2RlTmFtZT09XCJPQkpFQ1RcIil7aWYodHlwZW9mIFkuU2V0VmFyaWFibGUhPUQpe1g9WX1lbHNle3ZhciBaPVkuZ2V0RWxlbWVudHNCeVRhZ05hbWUocilbMF07aWYoWil7WD1afX19cmV0dXJuIFh9ZnVuY3Rpb24gQSgpe3JldHVybiAhYSYmRihcIjYuMC42NVwiKSYmKE0ud2lufHxNLm1hYykmJiEoTS53ayYmTS53azwzMTIpfWZ1bmN0aW9uIFAoYWEsYWIsWCxaKXthPXRydWU7RT1afHxudWxsO0I9e3N1Y2Nlc3M6ZmFsc2UsaWQ6WH07dmFyIGFlPWMoWCk7aWYoYWUpe2lmKGFlLm5vZGVOYW1lPT1cIk9CSkVDVFwiKXtsPWcoYWUpO1E9bnVsbH1lbHNle2w9YWU7UT1YfWFhLmlkPVI7aWYodHlwZW9mIGFhLndpZHRoPT1EfHwoIS8lJC8udGVzdChhYS53aWR0aCkmJnBhcnNlSW50KGFhLndpZHRoLDEwKTwzMTApKXthYS53aWR0aD1cIjMxMFwifWlmKHR5cGVvZiBhYS5oZWlnaHQ9PUR8fCghLyUkLy50ZXN0KGFhLmhlaWdodCkmJnBhcnNlSW50KGFhLmhlaWdodCwxMCk8MTM3KSl7YWEuaGVpZ2h0PVwiMTM3XCJ9ai50aXRsZT1qLnRpdGxlLnNsaWNlKDAsNDcpK1wiIC0gRmxhc2ggUGxheWVyIEluc3RhbGxhdGlvblwiO3ZhciBhZD1NLmllJiZNLndpbj9cIkFjdGl2ZVhcIjpcIlBsdWdJblwiLGFjPVwiTU1yZWRpcmVjdFVSTD1cIitPLmxvY2F0aW9uLnRvU3RyaW5nKCkucmVwbGFjZSgvJi9nLFwiJTI2XCIpK1wiJk1NcGxheWVyVHlwZT1cIithZCtcIiZNTWRvY3RpdGxlPVwiK2oudGl0bGU7aWYodHlwZW9mIGFiLmZsYXNodmFycyE9RCl7YWIuZmxhc2h2YXJzKz1cIiZcIithY31lbHNle2FiLmZsYXNodmFycz1hY31pZihNLmllJiZNLndpbiYmYWUucmVhZHlTdGF0ZSE9NCl7dmFyIFk9QyhcImRpdlwiKTtYKz1cIlNXRk9iamVjdE5ld1wiO1kuc2V0QXR0cmlidXRlKFwiaWRcIixYKTthZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShZLGFlKTthZS5zdHlsZS5kaXNwbGF5PVwibm9uZVwiOyhmdW5jdGlvbigpe2lmKGFlLnJlYWR5U3RhdGU9PTQpe2FlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYWUpfWVsc2V7c2V0VGltZW91dChhcmd1bWVudHMuY2FsbGVlLDEwKX19KSgpfXUoYWEsYWIsWCl9fWZ1bmN0aW9uIHAoWSl7aWYoTS5pZSYmTS53aW4mJlkucmVhZHlTdGF0ZSE9NCl7dmFyIFg9QyhcImRpdlwiKTtZLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKFgsWSk7WC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChnKFkpLFgpO1kuc3R5bGUuZGlzcGxheT1cIm5vbmVcIjsoZnVuY3Rpb24oKXtpZihZLnJlYWR5U3RhdGU9PTQpe1kucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChZKX1lbHNle3NldFRpbWVvdXQoYXJndW1lbnRzLmNhbGxlZSwxMCl9fSkoKX1lbHNle1kucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZyhZKSxZKX19ZnVuY3Rpb24gZyhhYil7dmFyIGFhPUMoXCJkaXZcIik7aWYoTS53aW4mJk0uaWUpe2FhLmlubmVySFRNTD1hYi5pbm5lckhUTUx9ZWxzZXt2YXIgWT1hYi5nZXRFbGVtZW50c0J5VGFnTmFtZShyKVswXTtpZihZKXt2YXIgYWQ9WS5jaGlsZE5vZGVzO2lmKGFkKXt2YXIgWD1hZC5sZW5ndGg7Zm9yKHZhciBaPTA7WjxYO1orKyl7aWYoIShhZFtaXS5ub2RlVHlwZT09MSYmYWRbWl0ubm9kZU5hbWU9PVwiUEFSQU1cIikmJiEoYWRbWl0ubm9kZVR5cGU9PTgpKXthYS5hcHBlbmRDaGlsZChhZFtaXS5jbG9uZU5vZGUodHJ1ZSkpfX19fX1yZXR1cm4gYWF9ZnVuY3Rpb24gdShhaSxhZyxZKXt2YXIgWCxhYT1jKFkpO2lmKE0ud2smJk0ud2s8MzEyKXtyZXR1cm4gWH1pZihhYSl7aWYodHlwZW9mIGFpLmlkPT1EKXthaS5pZD1ZfWlmKE0uaWUmJk0ud2luKXt2YXIgYWg9XCJcIjtmb3IodmFyIGFlIGluIGFpKXtpZihhaVthZV0hPU9iamVjdC5wcm90b3R5cGVbYWVdKXtpZihhZS50b0xvd2VyQ2FzZSgpPT1cImRhdGFcIil7YWcubW92aWU9YWlbYWVdfWVsc2V7aWYoYWUudG9Mb3dlckNhc2UoKT09XCJzdHlsZWNsYXNzXCIpe2FoKz0nIGNsYXNzPVwiJythaVthZV0rJ1wiJ31lbHNle2lmKGFlLnRvTG93ZXJDYXNlKCkhPVwiY2xhc3NpZFwiKXthaCs9XCIgXCIrYWUrJz1cIicrYWlbYWVdKydcIid9fX19fXZhciBhZj1cIlwiO2Zvcih2YXIgYWQgaW4gYWcpe2lmKGFnW2FkXSE9T2JqZWN0LnByb3RvdHlwZVthZF0pe2FmKz0nPHBhcmFtIG5hbWU9XCInK2FkKydcIiB2YWx1ZT1cIicrYWdbYWRdKydcIiAvPid9fWFhLm91dGVySFRNTD0nPG9iamVjdCBjbGFzc2lkPVwiY2xzaWQ6RDI3Q0RCNkUtQUU2RC0xMWNmLTk2QjgtNDQ0NTUzNTQwMDAwXCInK2FoK1wiPlwiK2FmK1wiPC9vYmplY3Q+XCI7TltOLmxlbmd0aF09YWkuaWQ7WD1jKGFpLmlkKX1lbHNle3ZhciBaPUMocik7Wi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIscSk7Zm9yKHZhciBhYyBpbiBhaSl7aWYoYWlbYWNdIT1PYmplY3QucHJvdG90eXBlW2FjXSl7aWYoYWMudG9Mb3dlckNhc2UoKT09XCJzdHlsZWNsYXNzXCIpe1ouc2V0QXR0cmlidXRlKFwiY2xhc3NcIixhaVthY10pfWVsc2V7aWYoYWMudG9Mb3dlckNhc2UoKSE9XCJjbGFzc2lkXCIpe1ouc2V0QXR0cmlidXRlKGFjLGFpW2FjXSl9fX19Zm9yKHZhciBhYiBpbiBhZyl7aWYoYWdbYWJdIT1PYmplY3QucHJvdG90eXBlW2FiXSYmYWIudG9Mb3dlckNhc2UoKSE9XCJtb3ZpZVwiKXtlKFosYWIsYWdbYWJdKX19YWEucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoWixhYSk7WD1afX1yZXR1cm4gWH1mdW5jdGlvbiBlKFosWCxZKXt2YXIgYWE9QyhcInBhcmFtXCIpO2FhLnNldEF0dHJpYnV0ZShcIm5hbWVcIixYKTthYS5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLFkpO1ouYXBwZW5kQ2hpbGQoYWEpfWZ1bmN0aW9uIHkoWSl7dmFyIFg9YyhZKTtpZihYJiZYLm5vZGVOYW1lPT1cIk9CSkVDVFwiKXtpZihNLmllJiZNLndpbil7WC5zdHlsZS5kaXNwbGF5PVwibm9uZVwiOyhmdW5jdGlvbigpe2lmKFgucmVhZHlTdGF0ZT09NCl7YihZKX1lbHNle3NldFRpbWVvdXQoYXJndW1lbnRzLmNhbGxlZSwxMCl9fSkoKX1lbHNle1gucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChYKX19fWZ1bmN0aW9uIGIoWil7dmFyIFk9YyhaKTtpZihZKXtmb3IodmFyIFggaW4gWSl7aWYodHlwZW9mIFlbWF09PVwiZnVuY3Rpb25cIil7WVtYXT1udWxsfX1ZLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoWSl9fWZ1bmN0aW9uIGMoWil7dmFyIFg9bnVsbDt0cnl7WD1qLmdldEVsZW1lbnRCeUlkKFopfWNhdGNoKFkpe31yZXR1cm4gWH1mdW5jdGlvbiBDKFgpe3JldHVybiBqLmNyZWF0ZUVsZW1lbnQoWCl9ZnVuY3Rpb24gaShaLFgsWSl7Wi5hdHRhY2hFdmVudChYLFkpO0lbSS5sZW5ndGhdPVtaLFgsWV19ZnVuY3Rpb24gRihaKXt2YXIgWT1NLnB2LFg9Wi5zcGxpdChcIi5cIik7WFswXT1wYXJzZUludChYWzBdLDEwKTtYWzFdPXBhcnNlSW50KFhbMV0sMTApfHwwO1hbMl09cGFyc2VJbnQoWFsyXSwxMCl8fDA7cmV0dXJuKFlbMF0+WFswXXx8KFlbMF09PVhbMF0mJllbMV0+WFsxXSl8fChZWzBdPT1YWzBdJiZZWzFdPT1YWzFdJiZZWzJdPj1YWzJdKSk/dHJ1ZTpmYWxzZX1mdW5jdGlvbiB2KGFjLFksYWQsYWIpe2lmKE0uaWUmJk0ubWFjKXtyZXR1cm59dmFyIGFhPWouZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdO2lmKCFhYSl7cmV0dXJufXZhciBYPShhZCYmdHlwZW9mIGFkPT1cInN0cmluZ1wiKT9hZDpcInNjcmVlblwiO2lmKGFiKXtuPW51bGw7Rz1udWxsfWlmKCFufHxHIT1YKXt2YXIgWj1DKFwic3R5bGVcIik7Wi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsXCJ0ZXh0L2Nzc1wiKTtaLnNldEF0dHJpYnV0ZShcIm1lZGlhXCIsWCk7bj1hYS5hcHBlbmRDaGlsZChaKTtpZihNLmllJiZNLndpbiYmdHlwZW9mIGouc3R5bGVTaGVldHMhPUQmJmouc3R5bGVTaGVldHMubGVuZ3RoPjApe249ai5zdHlsZVNoZWV0c1tqLnN0eWxlU2hlZXRzLmxlbmd0aC0xXX1HPVh9aWYoTS5pZSYmTS53aW4pe2lmKG4mJnR5cGVvZiBuLmFkZFJ1bGU9PXIpe24uYWRkUnVsZShhYyxZKX19ZWxzZXtpZihuJiZ0eXBlb2Ygai5jcmVhdGVUZXh0Tm9kZSE9RCl7bi5hcHBlbmRDaGlsZChqLmNyZWF0ZVRleHROb2RlKGFjK1wiIHtcIitZK1wifVwiKSl9fX1mdW5jdGlvbiB3KFosWCl7aWYoIW0pe3JldHVybn12YXIgWT1YP1widmlzaWJsZVwiOlwiaGlkZGVuXCI7aWYoSiYmYyhaKSl7YyhaKS5zdHlsZS52aXNpYmlsaXR5PVl9ZWxzZXt2KFwiI1wiK1osXCJ2aXNpYmlsaXR5OlwiK1kpfX1mdW5jdGlvbiBMKFkpe3ZhciBaPS9bXFxcXFxcXCI8PlxcLjtdLzt2YXIgWD1aLmV4ZWMoWSkhPW51bGw7cmV0dXJuIFgmJnR5cGVvZiBlbmNvZGVVUklDb21wb25lbnQhPUQ/ZW5jb2RlVVJJQ29tcG9uZW50KFkpOll9dmFyIGQ9ZnVuY3Rpb24oKXtpZihNLmllJiZNLndpbil7d2luZG93LmF0dGFjaEV2ZW50KFwib251bmxvYWRcIixmdW5jdGlvbigpe3ZhciBhYz1JLmxlbmd0aDtmb3IodmFyIGFiPTA7YWI8YWM7YWIrKyl7SVthYl1bMF0uZGV0YWNoRXZlbnQoSVthYl1bMV0sSVthYl1bMl0pfXZhciBaPU4ubGVuZ3RoO2Zvcih2YXIgYWE9MDthYTxaO2FhKyspe3koTlthYV0pfWZvcih2YXIgWSBpbiBNKXtNW1ldPW51bGx9TT1udWxsO2Zvcih2YXIgWCBpbiBzd2ZvYmplY3Qpe3N3Zm9iamVjdFtYXT1udWxsfXN3Zm9iamVjdD1udWxsfSl9fSgpO3JldHVybntyZWdpc3Rlck9iamVjdDpmdW5jdGlvbihhYixYLGFhLFope2lmKE0udzMmJmFiJiZYKXt2YXIgWT17fTtZLmlkPWFiO1kuc3dmVmVyc2lvbj1YO1kuZXhwcmVzc0luc3RhbGw9YWE7WS5jYWxsYmFja0ZuPVo7b1tvLmxlbmd0aF09WTt3KGFiLGZhbHNlKX1lbHNle2lmKFope1ooe3N1Y2Nlc3M6ZmFsc2UsaWQ6YWJ9KX19fSxnZXRPYmplY3RCeUlkOmZ1bmN0aW9uKFgpe2lmKE0udzMpe3JldHVybiB6KFgpfX0sZW1iZWRTV0Y6ZnVuY3Rpb24oYWIsYWgsYWUsYWcsWSxhYSxaLGFkLGFmLGFjKXt2YXIgWD17c3VjY2VzczpmYWxzZSxpZDphaH07aWYoTS53MyYmIShNLndrJiZNLndrPDMxMikmJmFiJiZhaCYmYWUmJmFnJiZZKXt3KGFoLGZhbHNlKTtLKGZ1bmN0aW9uKCl7YWUrPVwiXCI7YWcrPVwiXCI7dmFyIGFqPXt9O2lmKGFmJiZ0eXBlb2YgYWY9PT1yKXtmb3IodmFyIGFsIGluIGFmKXthalthbF09YWZbYWxdfX1hai5kYXRhPWFiO2FqLndpZHRoPWFlO2FqLmhlaWdodD1hZzt2YXIgYW09e307aWYoYWQmJnR5cGVvZiBhZD09PXIpe2Zvcih2YXIgYWsgaW4gYWQpe2FtW2FrXT1hZFtha119fWlmKFomJnR5cGVvZiBaPT09cil7Zm9yKHZhciBhaSBpbiBaKXtpZih0eXBlb2YgYW0uZmxhc2h2YXJzIT1EKXthbS5mbGFzaHZhcnMrPVwiJlwiK2FpK1wiPVwiK1pbYWldfWVsc2V7YW0uZmxhc2h2YXJzPWFpK1wiPVwiK1pbYWldfX19aWYoRihZKSl7dmFyIGFuPXUoYWosYW0sYWgpO2lmKGFqLmlkPT1haCl7dyhhaCx0cnVlKX1YLnN1Y2Nlc3M9dHJ1ZTtYLnJlZj1hbn1lbHNle2lmKGFhJiZBKCkpe2FqLmRhdGE9YWE7UChhaixhbSxhaCxhYyk7cmV0dXJufWVsc2V7dyhhaCx0cnVlKX19aWYoYWMpe2FjKFgpfX0pfWVsc2V7aWYoYWMpe2FjKFgpfX19LHN3aXRjaE9mZkF1dG9IaWRlU2hvdzpmdW5jdGlvbigpe209ZmFsc2V9LHVhOk0sZ2V0Rmxhc2hQbGF5ZXJWZXJzaW9uOmZ1bmN0aW9uKCl7cmV0dXJue21ham9yOk0ucHZbMF0sbWlub3I6TS5wdlsxXSxyZWxlYXNlOk0ucHZbMl19fSxoYXNGbGFzaFBsYXllclZlcnNpb246RixjcmVhdGVTV0Y6ZnVuY3Rpb24oWixZLFgpe2lmKE0udzMpe3JldHVybiB1KFosWSxYKX1lbHNle3JldHVybiB1bmRlZmluZWR9fSxzaG93RXhwcmVzc0luc3RhbGw6ZnVuY3Rpb24oWixhYSxYLFkpe2lmKE0udzMmJkEoKSl7UChaLGFhLFgsWSl9fSxyZW1vdmVTV0Y6ZnVuY3Rpb24oWCl7aWYoTS53Myl7eShYKX19LGNyZWF0ZUNTUzpmdW5jdGlvbihhYSxaLFksWCl7aWYoTS53Myl7dihhYSxaLFksWCl9fSxhZGREb21Mb2FkRXZlbnQ6SyxhZGRMb2FkRXZlbnQ6cyxnZXRRdWVyeVBhcmFtVmFsdWU6ZnVuY3Rpb24oYWEpe3ZhciBaPWoubG9jYXRpb24uc2VhcmNofHxqLmxvY2F0aW9uLmhhc2g7aWYoWil7aWYoL1xcPy8udGVzdChaKSl7Wj1aLnNwbGl0KFwiP1wiKVsxXX1pZihhYT09bnVsbCl7cmV0dXJuIEwoWil9dmFyIFk9Wi5zcGxpdChcIiZcIik7Zm9yKHZhciBYPTA7WDxZLmxlbmd0aDtYKyspe2lmKFlbWF0uc3Vic3RyaW5nKDAsWVtYXS5pbmRleE9mKFwiPVwiKSk9PWFhKXtyZXR1cm4gTChZW1hdLnN1YnN0cmluZygoWVtYXS5pbmRleE9mKFwiPVwiKSsxKSkpfX19cmV0dXJuXCJcIn0sZXhwcmVzc0luc3RhbGxDYWxsYmFjazpmdW5jdGlvbigpe2lmKGEpe3ZhciBYPWMoUik7aWYoWCYmbCl7WC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChsLFgpO2lmKFEpe3coUSx0cnVlKTtpZihNLmllJiZNLndpbil7bC5zdHlsZS5kaXNwbGF5PVwiYmxvY2tcIn19aWYoRSl7RShCKX19YT1mYWxzZX19fX0oKTsiXSwiZmlsZSI6InN3Zm9iamVjdC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
