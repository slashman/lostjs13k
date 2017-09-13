/* jshint node: true, loopfunc: true */
//"use strict";

// Pasted SFXR
function SfxrParams(){this.setSettings=function(t){for(var r=0;24>r;r++)this[String.fromCharCode(97+r)]=t[r]||0;this.c<.01&&(this.c=.01);var e=this.b+this.c+this.e;if(.18>e){var a=.18/e;this.b*=a,this.c*=a,this.e*=a}}}function SfxrSynth(){this.a=new SfxrParams;var t,r,e,a,s,n,i,h,f,c,o,v;this.reset=function(){var t=this.a;a=100/(t.f*t.f+.001),s=100/(t.g*t.g+.001),n=1-t.h*t.h*t.h*.01,i=-t.i*t.i*t.i*1e-6,t.a||(o=.5-t.n/2,v=5e-5*-t.o),h=1+t.l*t.l*(t.l>0?-.9:10),f=0,c=1==t.m?0:(1-t.m)*(1-t.m)*2e4+32},this.totalReset=function(){this.reset();var a=this.a;return t=a.b*a.b*1e5,r=a.c*a.c*1e5,e=a.e*a.e*1e5+12,3*((t+r+e)/3|0)},this.synthWave=function(u,b){var w=this.a,y=1024,g=1!=w.s||w.v,k=w.v*w.v*.1,S=1+3e-4*w.w,l=w.s*w.s*w.s*.1,m=1+1e-4*w.t,d=1!=w.s,x=w.x*w.x,A=w.g,q=w.q||w.r,M=w.r*w.r*w.r*.2,p=w.q*w.q*(w.q<0?-1020:1020),U=w.p?((1-w.p)*(1-w.p)*2e4|0)+32:0,j=w.d,C=w.j/2,P=w.k*w.k*.01,R=w.a,W=t,z=1/t,B=1/r,D=1/e,E=5/(1+w.u*w.u*20)*(.01+l);E>.8&&(E=.8),E=1-E;var F,G,H,I,J,K,L,N=!1,O=0,Q=0,T=0,V=0,X=0,Y=0,Z=0,$=0,_=0,tt=0,rt=new Array(y),et=new Array(32);for(L=rt.length;L--;)rt[L]=0;for(L=et.length;L--;)et[L]=2*Math.random()-1;for(L=0;b>L;L++){if(N)return L;if(U&&++_>=U&&(_=0,this.reset()),c&&++f>=c&&(c=0,a*=h),n+=i,a*=n,a>s&&(a=s,A>0&&(N=!0)),G=a,C>0&&(tt+=P,G*=1+Math.sin(tt)*C),G|=0,8>G&&(G=8),R||(o+=v,0>o?o=0:o>.5&&(o=.5)),++Q>W)switch(Q=0,++O){case 1:W=r;break;case 2:W=e}switch(O){case 0:T=Q*z;break;case 1:T=1+2*(1-Q*B)*j;break;case 2:T=1-Q*D;break;case 3:T=0,N=!0}q&&(p+=M,H=0|p,0>H?H=-H:H>y-1&&(H=y-1)),g&&S&&(k*=S,1e-5>k?k=1e-5:k>.1&&(k=.1)),K=0;for(var at=8;at--;){if(Z++,Z>=G&&(Z%=G,3==R))for(var st=et.length;st--;)et[st]=2*Math.random()-1;switch(R){case 0:J=o>Z/G?.5:-.5;break;case 1:J=1-Z/G*2;break;case 2:I=Z/G,I=6.28318531*(I>.5?I-1:I),J=1.27323954*I+.405284735*I*I*(0>I?1:-1),J=.225*((0>J?-1:1)*J*J-J)+J;break;case 3:J=et[Math.abs(32*Z/G|0)]}g&&(F=Y,l*=m,0>l?l=0:l>.1&&(l=.1),d?(X+=(J-Y)*l,X*=E):(Y=J,X=0),Y+=X,V+=Y-F,V*=1-k,J=V),q&&(rt[$%y]=J,J+=rt[($-H+y)%y],$++),K+=J}K*=.125*T*x,u[L]=K>=1?32767:-1>=K?-32768:32767*K|0}return b}}var synth=new SfxrSynth;window.jsfxr=function(t){synth.a.setSettings(t);var r=synth.totalReset(),e=new Uint8Array(4*((r+1)/2|0)+44),a=2*synth.synthWave(new Uint16Array(e.buffer,44),r),s=new Uint32Array(e.buffer,0,44);s[0]=1179011410,s[1]=a+36,s[2]=1163280727,s[3]=544501094,s[4]=16,s[5]=65537,s[6]=44100,s[7]=88200,s[8]=1048578,s[9]=1635017060,s[10]=a,a+=44;for(var n=0,i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",h="data:audio/wav;base64,";a>n;n+=3){var f=e[n]<<16|e[n+1]<<8|e[n+2];h+=i[f>>18]+i[f>>12&63]+i[f>>6&63]+i[63&f]}return h};

// Holds last iteration timestamp.
var t = 0;

function raf(fn) {
  return window.requestAnimationFrame(function() {
    var n = Date.now();
    var e = n - t;
    if (e > 999) {
      e = 1 / 60;
    } else {
      e /= 1000;
    }
    t = n;
    fn(e);
  });
}

function start(fn) {
	return raf(function tick(e) {
	  fn(e);
	  raf(tick);
	});
}

var ui = require('./ui');
var world = require('./world');

//--- Injected input module

/* jshint node: true */
//"use strict";

var pressed = {};
var typedCallbacks = {};

function keyPress(e){
  if (typedCallbacks[e.which]){
    typedCallbacks[e.which]();
  }
}

function init(){
    window.onkeydown = e => pressed[e.which] = true;
    window.onkeyup = e => pressed[e.which] = false;
    window.addEventListener("keypress", keyPress);
  };

function isDown(keyCode){
    return pressed[keyCode];
};

function typed(keyCode, callback){
    typedCallbacks[keyCode] = callback;   
}



var ui = require('./ui');
var rand = require('./rng')();
var sound = require('./sound');

init();

let player = false;
//let active = false;

/*key.typed(90, function(){
  if (ui.camera.zoom >= 1)
    ui.camera.zoom = 0.3;
  else
    ui.camera.zoom += 0.1;
});

typed(122, function(){
  if (ui.camera.zoom >= 1)
    ui.camera.zoom = 0.3;
  else
    ui.camera.zoom += 0.1;
});*/

typed(122, function(){
  //sound.play(3);
  sound.play(0);
  world.sonicBoom(player.flipped ? - 1 : 1);
});

typed(13, ()=>{
  if (ui.t){
    ui.t = false;
    setTimeout(()=>player.lt = true, 10000);
    //setTimeout(()=>active = true, 15000);
  } 
});

var baseVar = {
  left: function(){
    return {
      x: player.x-11,
      y: player.y+16+8,
      dx: -3
    };
  },
  right: function(){
    return {
      x: player.x+24+3,
      y: player.y+16+8,
      dx: 3
    };
  },
  top: function(){
    return {
      x: player.x+8,
      y: player.y+8,
      dx: 0
    };
  },
};

function addBubbles(place, q){
  if (q === undefined){
    q = 5;
  }
  if (q === 0){
    return;
  }
  var basePosition = baseVar[place]();
  for (var i = 0; i < 1; i++){
    world.bubbles.push({
      x: rand.range(basePosition.x-5, basePosition.x+5),
      y: rand.range(basePosition.y-5, basePosition.y+5),
      dx: rand.range(basePosition.dx-5, basePosition.dx+5),
      dy: rand.range(-200, 0),
      life:  rand.range(15, 100),
    });
  }
  setTimeout(function(){
    addBubbles(place, q-1);
  },
  100);
}

function initInput (w){
    player = w.player;
};

function keyboard(){
    if (ui.t) return;
    if (isDown(38)){ // Rise
      sound.play(0);
      player.dy -= 10;
      if (player.dy < -120){
        player.dy = -120;
      }
      addBubbles("left");
      addBubbles("right");
    } else if (isDown(40)){ // Sink
      sound.play(0);
      if (player.dy < 60){
        player.dy += 10;
      }
      addBubbles("top");
    } 
    if (isDown(37)){
      sound.play(0);
      player.flipped = true;
      if (player.dx > -120){
        player.dx -= 15;
      }
      // Generate some lift
      player.dy -= 5;
      addBubbles("right");
    } else if (isDown(39)){
      sound.play(0);
      player.flipped = false;
      if (player.dx < 120){
        player.dx += 15;
      }
      player.dy -= 5;
      addBubbles("left");
    }
  }


function beep(){
  sound.play(1);
  setTimeout(beep, 10000);
}
beep();

// -- end of input module


ui.init(world);
initInput(world);
world.start();

start(function(elapsed) {
	// Safety toogle
	if (elapsed > 1){
		return;
	}
	keyboard();
	//TODO: Framerate limiter?
	world.update(elapsed);
	ui.draw();
});