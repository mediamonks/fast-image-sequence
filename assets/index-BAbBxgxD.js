var P=Object.defineProperty;var O=(n,e,t)=>e in n?P(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var r=(n,e,t)=>O(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();class x{constructor(e){r(this,"index");r(this,"images",[]);r(this,"priority",0);this.index=e}get image(){var e;return(e=this.images.find(t=>t.image!==void 0))==null?void 0:e.image}async getImage(){return new Promise(async(e,t)=>{if(this.image!==void 0)e(this.image);else{const i=this.images[this.images.length-1];i?i.fetchImage().then(s=>e(s)).catch(()=>t()):t()}})}async fetchImage(){var e;return(e=this.images.find(t=>t.available))==null?void 0:e.fetchImage()}releaseImage(){this.images.forEach(e=>e.releaseImage())}reset(){this.images.forEach(e=>e.reset())}}function z(){const n=document.createElement("pre");return Object.assign(n.style,{position:"absolute",top:"0",left:"0",backgroundColor:"rgba(0, 0, 0, 0.5)",color:"white",padding:"8px",fontSize:"12px",zIndex:"1000",lineHeight:"20px",margin:0,width:"calc(100% - 16px)"}),n}function $(n,e){n.textContent=`${e}`}class W{constructor(e,t){r(this,"available",!0);r(this,"loading",!1);r(this,"frame");r(this,"_image");r(this,"context");this.context=e,this.frame=t}get image(){if(this._image!==void 0&&!this.loading)return this._image}set image(e){e!==this._image&&(this.releaseImage(),this._image=e)}get imageURL(){return this.context.getImageURL(this.frame.index)}reset(){this.releaseImage(),this._image=void 0}async fetchImage(){return this.context.fetchImage(this)}releaseImage(){this._image&&(this._image instanceof ImageBitmap&&this._image.close(),this._image=void 0),this.loading=!1}}const E=0,A=1,C=2,v=class v{constructor(e,t,i){r(this,"options");r(this,"index",-0);r(this,"initialized",!1);r(this,"context");this.context=e,this.index=t,this.options={...v.defaultOptions,...i},this.initFrames()}initFrames(){this.context.frames.forEach(e=>{var t,i;return(t=e.images)[i=this.index]||(t[i]=new W(this,e))})}get type(){return C}get maxCachedImages(){const e=this.initialized?this.images.filter(t=>t.available).length:this.context.options.frames;return F(Math.floor(this.options.maxCachedImages),1,e)}get images(){return this.context.frames.map(e=>e.images[this.index])}setMaxCachedImages(e,t){return this.options.maxCachedImages=e,this.context.onLoadProgress(t)}getImageURL(e){}checkImageAvailability(){var e,t;for(const i of this.images)i.available=this.available(i,i.available);if(!((e=this.images[0])!=null&&e.available))throw new Error(`No image available for index 0 in ImageSource${this.index} (${(t=this.images[0])==null?void 0:t.imageURL})`)}async loadResources(){this.checkImageAvailability(),this.initialized=!0}process(e){var d;e();let{numLoading:t,numLoaded:i}=this.getLoadStatus();const s=this.options.maxConnectionLimit,a=this.images.filter(h=>h.available&&h.image===void 0&&!h.loading&&h.frame.priority).sort((h,c)=>h.frame.priority-c.frame.priority),l=((d=this.images.filter(h=>h.available&&h.image!==void 0&&!h.loading).sort((h,c)=>c.frame.priority-h.frame.priority).shift())==null?void 0:d.frame.priority)??1e10;for(;t<s&&a.length>0;){const h=a.shift();(h.frame.priority<l||i<this.maxCachedImages-t)&&(h.loading=!0,this.fetchImage(h).then(c=>{h.loading&&(h.loading=!1,h.image=c,e(),this.releaseImageWithLowestPriority())}).catch(c=>{h.reset(),console.error(c)})),t++}}getLoadStatus(){const e=this.images.filter(a=>a.loading).length,t=this.images.filter(a=>a.image!==void 0).length,i=this.maxCachedImages;return{progress:Math.max(0,t-e)/Math.max(1,i),numLoading:e,numLoaded:t,maxLoaded:i}}async fetchImage(e){return this.options.image?this.options.image(e.frame.index):new Promise((t,i)=>{i("Not implemented")})}destruct(){this.images.forEach(e=>e.reset())}available(e,t=!0){return this.options.available?t&&this.options.available(e.frame.index):t}releaseImageWithLowestPriority(){const e=this.images.filter(t=>t.image!==void 0&&!t.loading);if(e.length>this.maxCachedImages){const t=e.sort((i,s)=>i.frame.priority-s.frame.priority).pop();t&&t.releaseImage()}}};r(v,"defaultOptions",{tarURL:void 0,imageURL:void 0,useWorker:!X(),maxCachedImages:32,maxConnectionLimit:4,available:void 0,image:void 0,timeout:-1});let u=v;function T(n,e){return new Promise((t,i)=>{const s=new XMLHttpRequest;s.open("GET",n,!0),s.responseType="arraybuffer",s.onprogress=function(a){if(a.lengthComputable&&e){const o=a.loaded/a.total;e(o)}},s.onload=function(){s.status===200?(e&&e(1),t(s.response)):i(new Error(`Error ${s.status}: ${s.statusText}`))},s.onerror=function(){i(new Error("Request failed"))},s.send()})}function D(n,e){return new Promise((t,i)=>{n.onerror=s=>i(s),n.decoding="async",n.src=e,n.decode().then(()=>{t(n)}).catch(s=>{console.error(s),i(s)})})}const q=`let buffer;

self.onmessage = async (e) => {
    if (e.data.cmd === 'init') {
        buffer = e.data.buffer;
    } else if (e.data.cmd === 'load') {
        loadImage(e.data.offset, e.data.size, e.data.index);
    }
};

async function loadImage(offset, size, index) {
    const view = new Uint8Array(buffer, offset, size);
    const blob = new Blob([view], {});
    const imageBitmap = await createImageBitmap(blob);
    postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
}`;class N{constructor(e,t={}){r(this,"fileInfo",[]);r(this,"buffer");r(this,"options");r(this,"worker");r(this,"resolve",[]);r(this,"defaultOptions",{useWorker:!0});this.buffer=e,this.options={...this.defaultOptions,...t};let i=0;for(;i<this.buffer.byteLength-512;){const s=this.readFileName(i);if(s.length==0)break;const a=this.readFileSize(i);this.fileInfo.push({name:s,size:a,header_offset:i}),i+=512+512*Math.trunc(a/512),a%512&&(i+=512)}}getInfo(e){return this.fileInfo.find(t=>t.name.includes(e))}getImage(e,t){return this.options.useWorker?(this.worker||(this.worker=this.createWorker()),new Promise((i,s)=>{const a=this.getInfo(e);a&&!this.resolve[t]?(this.resolve[t]=i,this.worker.postMessage({cmd:"load",offset:a.header_offset+512,size:a.size,index:t})):s("Image already loading from tar")})):new Promise((i,s)=>{const a=this.getBlob(e,"image");a!==void 0?createImageBitmap(a).then(o=>{i(o)}).catch(()=>{s()}):s()})}destruct(){this.worker&&this.worker.terminate(),this.resolve=[]}readFileName(e){const t=new Uint8Array(this.buffer,e,100),i=t.indexOf(0);return new TextDecoder().decode(t.slice(0,i))}readFileSize(e){const t=new Uint8Array(this.buffer,e+124,12);let i="";for(let s=0;s<11;s++)i+=String.fromCharCode(t[s]);return parseInt(i,8)}getBlob(e,t=""){const i=this.getInfo(e);if(i){const s=new Uint8Array(this.buffer,i.header_offset+512,i.size);return new Blob([s],{type:t})}}createWorker(){const e=new Blob([q],{type:"application/javascript"}),t=new Worker(URL.createObjectURL(e));return t.addEventListener("message",i=>{const s=this.resolve[i.data.index];this.resolve[i.data.index]=void 0,s?s(i.data.imageBitmap):i.data.imageBitmap.close()}),t.postMessage({cmd:"init",buffer:this.buffer},[this.buffer]),t}}class _ extends u{constructor(){super(...arguments);r(this,"tarball");r(this,"tarLoadProgress",0)}get type(){return A}async loadResources(){if(this.options.tarURL!==void 0){const t=await T(this.options.tarURL,i=>{this.tarLoadProgress=i});this.tarball=new N(t,{useWorker:this.options.useWorker}),this.context.log("Tarball",this.tarball)}return super.loadResources()}getImageURL(t){return this.options.imageURL?this.options.imageURL(t):void 0}getLoadStatus(){const t=super.getLoadStatus();return t.progress=this.tarLoadProgress/2+t.progress/2,t}async fetchImage(t){return new Promise((i,s)=>{var a;t.available?(a=this.tarball)==null||a.getImage(t.imageURL||"",t.frame.index).then(o=>{i(o)}).catch(o=>{s(o)}):s(`Image not available or already loading ${t.imageURL} ${t.loading}`)})}destruct(){var t;super.destruct(),(t=this.tarball)==null||t.destruct(),this.tarball=void 0}available(t,i=!0){var s;return i=i&&t.imageURL!==void 0&&((s=this.tarball)==null?void 0:s.getInfo(t.imageURL))!==void 0,super.available(t,i)}}const j=`self.onmessage = async (e) => {
    if (e.data.cmd === 'load') {
        await loadImage(e.data.url, e.data.index);
    }
};

async function loadImage(url, index) {
    const response = await fetch(url);
    if (!response.ok) throw "network error";
    const imageBitmap = await createImageBitmap(await response.blob());
    postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
}`;class V{constructor(){r(this,"index",-1e10);r(this,"worker");r(this,"resolve");const e=new Blob([j],{type:"application/javascript"}),t=new Worker(URL.createObjectURL(e));t.addEventListener("message",i=>{this.resolve&&i.data.index===this.index?this.resolve(i.data.imageBitmap):i.data.imageBitmap.close()}),this.worker=t}load(e,t){return this.index=e,new Promise((i,s)=>{this.resolve=i,this.worker.postMessage({cmd:"load",url:t,index:e})})}abort(){this.index=-1e10,this.resolve=void 0}}const b=[];function H(){return b.length===0&&b.push(new V),b.shift()}function G(n){n.abort(),b.push(n)}class K extends u{get type(){return E}getImageURL(e){return this.options.imageURL?new URL(this.options.imageURL(e),window.location.href).href:void 0}async fetchImage(e){return new Promise((t,i)=>{if(e.imageURL)if(this.options.useWorker){const s=H();s.load(this.index,e.imageURL).then(a=>{t(a),G(s)}).catch(a=>i(a))}else{const s=new Image;D(s,e.imageURL).then(()=>{t(s)}).catch(a=>i(a))}else i("Image url not set or image already loading")})}}function X(){return typeof navigator<"u"&&/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function F(n,e,t){return Math.min(Math.max(n,e),t)}const I=class I{constructor(e,t){r(this,"canvas");r(this,"options");r(this,"width",0);r(this,"height",0);r(this,"frame",0);r(this,"log");r(this,"frames",[]);r(this,"sources",[]);r(this,"context");r(this,"tickFunctions",[]);r(this,"startTime",-1);r(this,"animationRequestId",0);r(this,"container");r(this,"resizeObserver");r(this,"mutationObserver");r(this,"inViewportObserver");r(this,"forceRedraw",!0);r(this,"speed",0);r(this,"prevFrame",0);r(this,"direction",1);r(this,"lastFrameDrawn",-1);r(this,"destructed",!1);r(this,"logElement");r(this,"initialized",!1);r(this,"posterImage");r(this,"timeFrameVisible",0);r(this,"lastImageDrawn");r(this,"inViewport",!1);r(this,"containerWidth",0);r(this,"containerHeight",0);if(this.options={...I.defaultOptions,...t},this.options.frames<=0)throw new Error("FastImageSequence: frames must be greater than 0");this.container=e,this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.context.fillStyle=this.options.fillStyle,this.context.clearRect(0,0,this.canvas.width,this.canvas.height),Object.assign(this.canvas.style,{inset:"0",width:"100%",height:"100%",margin:"0",display:"block"}),this.container.appendChild(this.canvas),this.resizeObserver=new ResizeObserver(()=>{this.forceRedraw=!0,this.containerWidth=e.offsetWidth,this.containerHeight=e.offsetHeight,this.lastFrameDrawn<0&&this.posterImage&&this.drawImage(this.posterImage)}),this.resizeObserver.observe(this.canvas),this.mutationObserver=new MutationObserver(()=>{this.container.isConnected||(console.error("FastImageSequence: container is not connected to the DOM, fast image sequence will be destroyed"),this.destruct())}),this.mutationObserver.observe(e,{childList:!0}),this.inViewportObserver=new IntersectionObserver(s=>{for(const a of s)this.inViewport=a.isIntersecting}),this.inViewportObserver.observe(this.canvas),this.frames=Array.from({length:this.options.frames},(s,a)=>new x(a)),this.log=this.options.showDebugInfo?console.log:()=>{};const i=this.options.src instanceof Array?this.options.src:[this.options.src];this.sources=i.map((s,a)=>s.tarURL!==void 0?new _(this,a,s):s.imageURL!==void 0?new K(this,a,s):new u(this,a,s)),this.loadResources().then(()=>{this.initialized=!0,this.log("Frames",this.frames),this.log("Options",this.options),this.options.showDebugInfo&&(this.logElement=z(),this.container.appendChild(this.logElement),this.tick(()=>this.logDebugStatus(this.logElement))),this.drawingLoop(-1)})}get playing(){return this.speed!==0}get paused(){return!this.playing}get loadProgress(){return this.sources.reduce((e,t)=>e+t.getLoadStatus().progress,0)/this.sources.length}get progress(){return this.index/(this.options.frames-1)}set progress(e){this.frame=(this.options.frames-1)*e}set scale(e){this.forceRedraw=this.options.scale!==e,this.options.scale=e}get scale(){return this.options.scale}set horizontalAlign(e){this.forceRedraw=this.options.scale!==e,this.options.horizontalAlign=e}get horizontalAlign(){return this.options.horizontalAlign}set verticalAlign(e){this.forceRedraw=this.options.scale!==e,this.options.verticalAlign=e}get verticalAlign(){return this.options.verticalAlign}get src(){return this.sources[0]}set frameCount(e){for(const i of this.frames)i.reset();this.forceRedraw=!0;const t=Math.max(1,e|0);this.options.frames=t,t<this.frames.length?this.frames=Array.from({length:t},(i,s)=>new x(s)):t>this.frames.length&&(this.frames=this.frames.concat(Array.from({length:t-this.frames.length},(i,s)=>new x(s+this.frames.length))));for(const i of this.sources)i.initFrames(),i.checkImageAvailability()}get frameCount(){return this.options.frames}get index(){return this.wrapIndex(this.frame)}ready(){return new Promise(e=>{const t=()=>{this.sources.every(i=>i.initialized)?e():setTimeout(t,16)};t()})}tick(e){this.tickFunctions.push(e)}play(e=30){this.speed=e}stop(){this.speed=0}async getFrameImage(e){return await this.frames[this.wrapIndex(e)].fetchImage()}async onLoadProgress(e){let t=this.loadProgress;return new Promise(i=>{const s=()=>{this.loadProgress>=1?(e&&e(1),i(!0)):(e&&t!==this.loadProgress&&(e(this.loadProgress),t=this.loadProgress),setTimeout(s,16))};s()})}destruct(){this.destructed||(this.destructed=!0,this.animationRequestId&&cancelAnimationFrame(this.animationRequestId),this.resizeObserver.disconnect(),this.mutationObserver.disconnect(),this.inViewportObserver.disconnect(),this.container.removeChild(this.canvas),this.logElement&&(this.container.removeChild(this.logElement),this.logElement=void 0),this.canvas.replaceWith(this.canvas.cloneNode(!0)),this.sources.forEach(e=>e.destruct()),this.frames.forEach(e=>e.releaseImage()))}setDisplayOptions(e){this.options={...this.options,...e},this.forceRedraw=!0}setLoadingPriority(){const e=this.index;for(const t of this.frames)t.priority=Math.abs(t.index+.25-e),this.options.loop&&(t.priority=Math.min(t.priority,this.options.frames-t.priority))}async loadResources(){if(this.options.poster){this.log("Poster image",this.options.poster);const e=new Image;e.src=this.options.poster,await e.decode().then(()=>{this.posterImage=e,this.lastFrameDrawn<0&&this.drawImage(this.posterImage)}).catch(t=>this.log(t))}await Promise.all(this.sources.map(e=>e.loadResources())),await this.getFrameImage(0)}wrapIndex(e){const t=e|0;return this.wrapFrame(t)}wrapFrame(e){return this.options.loop?(e%this.options.frames+this.options.frames)%this.options.frames:F(e,0,this.options.frames-1)}async drawingLoop(e=0){if(this.destructed)return;e/=1e3;const t=this.initialized?this.startTime<0?1/60:Math.min(e-this.startTime,1/30):0;if(this.startTime=e>0?e:-1,this.frame-this.prevFrame<0&&(this.direction=-1),this.frame-this.prevFrame>0&&(this.direction=1),this.frame+=this.speed*t,this.frame=this.wrapFrame(this.frame),this.inViewport){const i=this.index;for(const a of this.frames){a.priority=Math.abs(a.index-i);let o=Math.sign(this.frame-this.prevFrame);if(this.options.loop){const l=this.options.frames-a.priority;l<a.priority&&(a.priority=l)}a.priority+=this.direction*o===-1?this.frames.length:0}this.frames.sort((a,o)=>o.priority-a.priority);const s=this.frames.filter(a=>a.image!==void 0).pop();s&&this.drawFrame(s)}this.wrapIndex(this.frame)===this.wrapIndex(this.prevFrame)?this.timeFrameVisible+=t:this.timeFrameVisible=0,this.process(),this.tickFunctions.forEach(i=>i(t)),this.prevFrame=this.frame,this.animationRequestId=requestAnimationFrame(i=>this.drawingLoop(i))}drawFrame(e){const t=e.image;!t||e.index>=this.options.frames||(this.lastFrameDrawn=e.index,this.drawImage(t))}drawImage(e){const t=e.naturalWidth||e.width||e.videoWidth,i=e.naturalHeight||e.height||e.videoHeight,s=this.containerWidth/this.containerHeight,a=t/i;if(this.width=Math.max(this.width,t),this.height=Math.max(this.height,i),this.options.objectFit==="contain"){const h=(s>a?this.height*s:this.width)|0,c=(s>a?this.height:this.width/s)|0;(this.canvas.width!==h||this.canvas.height!==c)&&(this.canvas.width=h,this.canvas.height=c)}else{const h=(s>a?this.width:this.height*s)|0,c=(s>a?this.width/s:this.height)|0;(this.canvas.width!==h||this.canvas.height!==c)&&(this.canvas.width=h,this.canvas.height=c)}const o=this.options.scale,l=(this.canvas.width-this.width*o)*this.options.horizontalAlign,d=(this.canvas.height-this.height*o)*this.options.verticalAlign;(this.forceRedraw||this.options.clearCanvas)&&this.context.clearRect(0,0,this.canvas.width,this.canvas.height),(this.forceRedraw||this.options.clearCanvas||this.lastImageDrawn!==e)&&(this.context.drawImage(e,0,0,t,i,l,d,this.width*o,this.height*o),this.lastImageDrawn=e),this.forceRedraw=!1}process(){for(const e of this.sources)this.timeFrameVisible>=e.options.timeout/1e3&&e.process(()=>this.setLoadingPriority())}logDebugStatus(e){const t=s=>`${Math.abs(s*100).toFixed(1).padStart(5," ")}%`;let i=`${this.options.name} - frames: ${this.frames.length}, loop: ${this.options.loop}, objectFit: ${this.options.objectFit}
 loadProgress ${t(this.loadProgress)}, last frame drawn ${this.lastFrameDrawn}/${this.index}
`;for(const s of this.sources){const{progress:a,numLoading:o,numLoaded:l,maxLoaded:d}=s.getLoadStatus();i+=` src[${s.index}] ${s.type===E?"image:":s.type===C?"code: ":"tar:  "} ${t(a)}, numLoading: ${o}, numLoaded: ${l}/${d}${s.options.useWorker?", use worker":""}
`}$(e,i)}};r(I,"defaultOptions",{frames:1,src:[],loop:!1,poster:void 0,fillStyle:"#00000000",objectFit:"cover",clearCanvas:!1,showDebugInfo:!1,name:"FastImageSequence",horizontalAlign:.5,verticalAlign:.5,scale:1});let m=I;const J=document.getElementById("prev-button-1"),Q=document.getElementById("next-button-1"),p=document.getElementById("slider-input-1");async function Y(n){const e=new m(n,{name:"PlayWithControlTest",frames:89,src:[{imageURL:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,maxCachedImages:8},{tarURL:"lowrespreviews.tar",imageURL:t=>`${(""+(t+1)).padStart(4,"0")}.jpg`}],loop:!0,objectFit:"contain",fillStyle:"#00000000",clearCanvas:!1,showDebugInfo:!0});await e.ready(),e.progress=0,e.tick(t=>{e.playing&&(p.value=e.progress)}),J.addEventListener("click",()=>{e.play(-30)}),Q.addEventListener("click",()=>{e.play(30)}),p.addEventListener("mousedown",t=>{e.stop()}),p.addEventListener("input",()=>{e.paused&&(e.progress=p.value)}),e.play(30)}async function Z(n){const e=new m(n,{name:"PlayBackwardsTest at 200fps",frames:120,src:{imageURL:t=>`${(""+(t+1)).padStart(3,"0")}.jpg`},loop:!0,objectFit:"contain",fillStyle:"#00000000",clearCanvas:!1,showDebugInfo:!0});await e.ready(),e.progress=0,e.play(-200)}async function ee(n){const e=new m(n,{name:"StillImageTest",frames:89,src:{imageURL:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,maxCachedImages:1,useWorker:!0},loop:!0,objectFit:"cover",fillStyle:"#00000000",clearCanvas:!1,showDebugInfo:!0});await e.ready(),console.log("fastImageSequence loaded"),setTimeout(()=>{e.src.setMaxCachedImages(89,t=>console.log("preload progress:",t)).then(()=>{console.log("all frames preloaded")})},2e3)}function te(n){let e=k(n);setInterval(()=>{console.log("destructing"),e.destruct(),console.log("constructing"),e=k(n)},3e3)}function k(n){const e=[],t={imageURL:o=>`${(""+(o+1)).padStart(4,"0")}.webp`,useWorker:Math.random()>.5,maxCachedImages:1+Math.random()*32|0},i={tarURL:"lowrespreviews.tar",imageURL:o=>`${(""+(o+1)).padStart(4,"0")}.jpg`,useWorker:Math.random()>.5,maxCachedImages:1+Math.random()*32|0},s=Math.random()*3|0;s===0?e.push(t):s===1?e.push(i):e.push(t,i);const a=new m(n,{name:"ConstructDestructTest",frames:89,src:e,loop:Math.random()>.5,objectFit:Math.random()>.5?"cover":"contain",fillStyle:"#00000000",clearCanvas:Math.random()>.5,showDebugInfo:!0,poster:"0001.webp"});return a.ready().then(()=>{a.tick(()=>a.progress=Math.random())}),a}const se=document.getElementById("prev-button-2"),ie=document.getElementById("next-button-2"),w=document.getElementById("slider-input-2");function ae(n){return new Promise((e,t)=>{const i=new FileReader;i.onload=s=>e(i.result),i.onerror=s=>t(i.error),i.onabort=s=>t(new Error("Read aborted")),i.readAsDataURL(n)})}async function re(n){fetch("lowrespreviews.tar").then(async e=>{const t=await e.blob(),i=await ae(t),s=new m(n,{name:"LoadTar",frames:89,src:[{tarURL:i,imageURL:a=>`${(""+(a+1)).padStart(4,"0")}.jpg`}],loop:!0,objectFit:"contain",fillStyle:"#00000000",clearCanvas:!1,showDebugInfo:!0});await s.ready(),s.tick(a=>{s.playing&&(w.value=s.progress)}),se.addEventListener("click",()=>{s.play(-30)}),ie.addEventListener("click",()=>{s.play(30)}),w.addEventListener("mousedown",a=>{s.stop()}),w.addEventListener("input",()=>{s.paused&&(s.progress=w.value)}),s.play(30)})}const ne=document.getElementById("prev-button-3"),oe=document.getElementById("next-button-3"),y=document.getElementById("slider-input-3");function he(n,e){const t=document.createElement("canvas");t.width=512,t.height=512;const i=t.getContext("2d");i.fillStyle="#000000",i.fillRect(0,0,t.width,t.height);const s=n/e*Math.PI/2,a=128,o=t.width/2,l=t.height/2,d=[[-128,-128,-128],[a,-128,-128],[a,a,-128],[-128,a,-128],[-128,-128,a],[a,-128,a],[a,a,a],[-128,a,a]],h=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];i.strokeStyle="#ffffff",i.beginPath();for(const c of h){const g=d[c[0]],f=d[c[1]],L=1e3/(1e3+g[0]*Math.sin(s)+g[2]*Math.cos(s)),R=1e3/(1e3+f[0]*Math.sin(s)+f[2]*Math.cos(s)),S=o+(g[0]*Math.cos(s)-g[2]*Math.sin(s))*L,M=l+g[1]*L,U=o+(f[0]*Math.cos(s)-f[2]*Math.sin(s))*R,B=l+f[1]*R;i.moveTo(S,M),i.lineTo(U,B)}return i.stroke(),t}async function ce(n){const t=new m(n,{name:"CustomCanvas",frames:100,src:[{image:i=>he(i,100),maxCachedImages:100}],loop:!0,objectFit:"contain",fillStyle:"#00000000",clearCanvas:!1,showDebugInfo:!0});await t.ready(),t.progress=0,t.tick(i=>{t.playing&&(y.value=t.progress)}),ne.addEventListener("click",()=>{t.play(-30)}),oe.addEventListener("click",()=>{t.play(30)}),y.addEventListener("mousedown",i=>{t.stop()}),y.addEventListener("input",()=>{t.paused&&(t.progress=y.value)}),t.play(30)}Y(document.getElementsByClassName("grid-item")[0]);Z(document.getElementsByClassName("grid-item")[1]);re(document.getElementsByClassName("grid-item")[2]);ee(document.getElementsByClassName("grid-item")[3]);ce(document.getElementsByClassName("grid-item")[4]);te(document.getElementsByClassName("grid-item")[5]);
