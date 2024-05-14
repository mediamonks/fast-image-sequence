var v=Object.defineProperty;var b=(n,e,t)=>e in n?v(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var o=(n,e,t)=>(b(n,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(a){if(a.ep)return;a.ep=!0;const s=t(a);fetch(a.href,s)}})();const y=`let buffer;

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
}`;class L{constructor(e,t={}){o(this,"fileInfo",[]);o(this,"buffer");o(this,"options");o(this,"worker");o(this,"resolve",[]);o(this,"defaultOptions",{useWorker:!0});this.buffer=e,this.options={...this.defaultOptions,...t};let i=0;for(;i<this.buffer.byteLength-512;){const a=this.readFileName(i);if(a.length==0)break;const s=this.readFileSize(i);this.fileInfo.push({name:a,size:s,header_offset:i}),i+=512+512*Math.trunc(s/512),s%512&&(i+=512)}}getInfo(e){return this.fileInfo.find(t=>t.name==e)}getImage(e,t){return this.options.useWorker?(this.worker||(this.worker=this.createWorker()),new Promise((i,a)=>{const s=this.getInfo(e);s&&!this.resolve[t]?(this.resolve[t]=i,this.worker.postMessage({cmd:"load",offset:s.header_offset+512,size:s.size,index:t})):a()})):new Promise((i,a)=>{const s=this.getBlob(e,"image");s!==void 0?createImageBitmap(s).then(r=>{i(r)}).catch(()=>{a()}):a()})}readFileName(e){const t=new Uint8Array(this.buffer,e,100),i=t.indexOf(0);return new TextDecoder().decode(t.slice(0,i))}readFileSize(e){const t=new Uint8Array(this.buffer,e+124,12);let i="";for(let a=0;a<11;a++)i+=String.fromCharCode(t[a]);return parseInt(i,8)}getBlob(e,t=""){const i=this.getInfo(e);if(i){const a=new Uint8Array(this.buffer,i.header_offset+512,i.size);return new Blob([a],{type:t})}}createWorker(){const e=new Blob([y],{type:"application/javascript"}),t=new Worker(URL.createObjectURL(e));return t.addEventListener("message",i=>{const a=this.resolve[i.data.index];this.resolve[i.data.index]=void 0,a?a(i.data.imageBitmap):i.data.imageBitmap.close()}),t.postMessage({cmd:"init",buffer:this.buffer},[this.buffer]),t}}const x=`self.onmessage = async (e) => {
    if (e.data.cmd === 'load') {
        await loadImage(e.data.url, e.data.index);
    }
};

async function loadImage(url, index) {
    const response = await fetch(url);
    if (!response.ok) throw "network error";
    const imageBitmap = await createImageBitmap(await response.blob());
    postMessage({msg: 'done', imageBitmap, index}, [imageBitmap]);
}`;class C{constructor(){o(this,"index",-1e10);o(this,"worker");o(this,"resolve");const e=new Blob([x],{type:"application/javascript"}),t=new Worker(URL.createObjectURL(e));t.addEventListener("message",i=>{this.resolve&&i.data.index===this.index?this.resolve(i.data.imageBitmap):i.data.imageBitmap.close()}),this.worker=t}load(e,t){return this.index=e,new Promise((i,a)=>{this.resolve=i,this.worker.postMessage({cmd:"load",url:t,index:e})})}abort(){this.index=-1e10,this.resolve=void 0}}const p=[];function T(){return p.length===0&&p.push(new C),p.shift()}function k(n){n.abort(),p.push(n)}class F{constructor(e,t){o(this,"index");o(this,"priority",0);o(this,"tarImageAvailable",!1);o(this,"loading",!1);o(this,"loadingTarImage",!1);o(this,"context");o(this,"_image");o(this,"_tarImage");this.index=t,this.context=e}get tarImage(){if(this._tarImage!==void 0&&!this.loadingTarImage)return this._tarImage}set tarImage(e){this.releaseTarImage(),this._tarImage=e}get image(){if(this._image!==void 0&&!this.loading)return this._image}set image(e){this.releaseImage(),this._image=e}get tarImageURL(){if(this.context.options.tarImageURLCallback)return this.context.options.tarImageURLCallback(this.index)}get imageURL(){if(this.context.options.imageURLCallback)return new URL(this.context.options.imageURLCallback(this.index),window.location.href).href}reset(){this._image=void 0,this._tarImage=void 0,this.priority=0}async getImage(){return new Promise(async(e,t)=>{this.image!==void 0?e(this.image):this.tarImage!==void 0?e(this.tarImage):this.fetchTarImage().then(i=>e(i)).catch(()=>t())})}async fetchImage(){return new Promise((e,t)=>{if(this.imageURL){this.loading=!0;const i=s=>{this.loading&&(this.image=s,e(s))},a=s=>{this.reset(),t(s)};if(this.context.options.useWorkerForImage){const s=T();s.load(this.index,this.imageURL).then(r=>{i(r),k(s)}).catch(r=>a(r))}else{const s=new Image;this.loadImage(s,this.imageURL).then(()=>{i(s)}).catch(r=>a(r))}}else t()})}async fetchTarImage(){return new Promise((e,t)=>{this.tarImage!==void 0?e(this.tarImage):this.tarImageAvailable&&!this.loadingTarImage?(this.loadingTarImage=!0,this.context.tarball.getImage(this.tarImageURL,this.index).then(i=>{this.loadingTarImage&&(this.tarImage=i,e(i))}).catch(i=>{this.loadingTarImage=!1,this.reset(),t(i)})):(this.reset(),t())})}releaseImage(){this._image&&(this._image instanceof ImageBitmap&&this._image.close(),this._image=void 0),this.loading=!1}releaseTarImage(){this.tarImage&&(this.tarImage instanceof ImageBitmap&&this.tarImage.close(),this._tarImage=void 0),this.loadingTarImage=!1}loadImage(e,t){return new Promise((i,a)=>{e.onerror=s=>a(s),e.decoding="async",e.src=t,e.decode().then(()=>{i(e)}).catch(s=>{console.error(s),a(s),this.reset()})})}}function P(){const n=document.createElement("div");return Object.assign(n.style,{position:"absolute",top:"0",left:"0",backgroundColor:"rgba(0, 0, 0, 0.5)",color:"white",padding:"8px",fontSize:"12px",zIndex:"1000",lineHeight:"20px"}),n}function R(n,e){n.innerHTML=`<pre>${e}</pre>`}function S(n,e){return new Promise((t,i)=>{const a=new XMLHttpRequest;a.open("GET",n,!0),a.responseType="arraybuffer",a.onprogress=function(s){if(s.lengthComputable&&e){const r=s.loaded/s.total;e(r)}},a.onload=function(){a.status===200?t(a.response):i(new Error(`Error ${a.status}: ${a.statusText}`))},a.onerror=function(){i(new Error("Request failed"))},a.send()})}function E(){return typeof navigator<"u"&&/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function I(n,e,t){return Math.min(Math.max(n,e),t)}const u=class u{constructor(e,t){o(this,"canvas");o(this,"options");o(this,"width",0);o(this,"height",0);o(this,"frame",0);o(this,"tarball");o(this,"context");o(this,"tickFuncs",[]);o(this,"frames",[]);o(this,"startTime",-1);o(this,"animationRequestId",0);o(this,"container");o(this,"resizeObserver");o(this,"mutationOberver");o(this,"clearCanvas",!0);o(this,"speed",0);o(this,"prevFrame",0);o(this,"direction",1);o(this,"lastFrameDrawn",-1);o(this,"destructed",!1);o(this,"logElement");o(this,"initialized",!1);o(this,"log");o(this,"tarLoadProgress",0);if(this.options={...u.defaultOptions,...t},this.options.frames<=0)throw new Error("FastImageSequence: frames must be greater than 0");this.options.maxCachedImages=Math.floor(this.options.maxCachedImages),this.options.maxCachedImages=I(this.options.frames,1,this.options.maxCachedImages),this.container=e,this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.context.fillStyle=this.options.fillStyle,this.context.clearRect(0,0,this.canvas.width,this.canvas.height),Object.assign(this.canvas.style,{inset:"0",width:"100%",height:"100%",margin:"0",display:"block"}),this.container.appendChild(this.canvas),this.resizeObserver=new ResizeObserver(()=>{this.clearCanvas=!0}),this.resizeObserver.observe(this.canvas),this.mutationOberver=new MutationObserver(()=>{this.container.isConnected||(console.error("FastImageSequence: container is not connected to the DOM, fast image sequence will be destroyed"),this.destruct())}),this.mutationOberver.observe(e,{childList:!0});for(let i=0;i<this.options.frames;i++)this.frames.push(new F(this,i));this.log=this.options.showDebugInfo?console.log:()=>{},this.loadResources().then(()=>{this.initialized=!0,this.log("Frames",this.frames),this.log("Options",this.options),this.options.showDebugInfo&&(this.logElement=P(),this.container.appendChild(this.logElement),this.tick(()=>this.logDebugStatus(this.logElement))),this.drawingLoop(-1)})}get playing(){return this.speed!==0}get paused(){return!this.playing}get loadProgress(){const{used:e,numLoaded:t,numLoading:i,maxLoaded:a}=this.getLoadStatus(),{used:s,numLoading:r,numLoaded:d,maxLoaded:l,tarLoadProgress:c}=this.getTarStatus();return((e?Math.max(t-i,0):0)+(s?Math.max(d-r,0)/2+c:0))/((e?a:0)+(s?l/2+1:0))}get progress(){return this.index/(this.options.frames-1)}set progress(e){this.frame=(this.options.frames-1)*e}get ready(){return new Promise(e=>{const t=()=>{this.lastFrameDrawn!==-1?e():setTimeout(t,16)};t()})}tick(e){this.tickFuncs.push(e)}play(e=30){this.speed=e}stop(){this.speed=0}async getFrameImage(e){const t=this.frames[this.wrapIndex(e)];try{return await t.fetchImage()}catch{return await t.fetchTarImage()}}setMaxCachedImages(e,t){this.options.maxCachedImages=I(e,1,this.options.frames);let i=this.loadProgress;return new Promise(a=>{const s=()=>{this.loadProgress>=1?a(!0):(t&&i!==this.loadProgress&&(t(this.loadProgress),i=this.loadProgress),setTimeout(s,16))};s()})}destruct(){this.destructed||(this.destructed=!0,this.animationRequestId&&cancelAnimationFrame(this.animationRequestId),this.resizeObserver.disconnect(),this.mutationOberver.disconnect(),this.container.removeChild(this.canvas),this.logElement&&(this.container.removeChild(this.logElement),this.logElement=void 0),this.canvas.replaceWith(this.canvas.cloneNode(!0)),this.frames.forEach(e=>{e.releaseImage(),e.releaseTarImage()}))}setDisplayOptions(e){this.options={...this.options,...e},this.clearCanvas=!0}get index(){return this.wrapIndex(this.frame)}get spread(){return this.options.loop?Math.floor(this.options.maxCachedImages/2):this.options.maxCachedImages}async loadResources(){if(this.options.tarURL!==void 0){const e=await S(this.options.tarURL,t=>{this.tarLoadProgress=t});this.tarball=new L(e,{useWorker:this.options.useWorkerForTar}),this.log("Tarball",this.tarball),this.frames.forEach(t=>{var i;return t.tarImageAvailable=t.tarImageURL!==void 0&&((i=this.tarball)==null?void 0:i.getInfo(t.tarImageURL))!==void 0}),this.options.preloadAllTarImages&&await Promise.all(this.frames.map(t=>t.fetchTarImage()))}await this.getFrameImage(0)}wrapIndex(e){const t=e|0;return this.wrapFrame(t)}wrapFrame(e){return this.options.loop?(e%this.options.frames+this.options.frames)%this.options.frames:I(e,0,this.options.frames-1)}async drawingLoop(e=0){if(this.destructed)return;e/=1e3;const t=this.initialized?this.startTime<0?1/60:Math.min(e-this.startTime,1/30):0;this.startTime=e>0?e:-1,this.frame-this.prevFrame<0&&(this.direction=-1),this.frame-this.prevFrame>0&&(this.direction=1),this.frame+=this.speed*t,this.frame=this.wrapFrame(this.frame);const i=this.index,a=this.canvas.getBoundingClientRect();if(a.top<window.innerHeight&&a.bottom>0){this.frames.forEach(l=>{l.priority=Math.abs(l.index-i);let c=Math.sign(this.frame-this.prevFrame);if(this.options.loop){const h=this.options.frames-l.priority;h<l.priority&&(l.priority=h)}l.priority+=this.direction*c===-1?this.frames.length:0}),this.frames.sort((l,c)=>c.priority-l.priority);const r=this.frames.filter(l=>l.image!==void 0).pop();r&&r.image&&this.drawFrame(r);const d=this.frames.filter(l=>l.tarImage!==void 0).pop();d&&d.tarImage&&(r&&r.image&&r.priority<=d.priority||this.drawFrame(d))}this.process(t),this.tickFuncs.forEach(r=>r(t)),this.prevFrame=this.frame,this.animationRequestId=requestAnimationFrame(r=>this.drawingLoop(r))}drawFrame(e){const t=e.image||e.tarImage;if(!t)return;this.lastFrameDrawn=e.index;const i=this.container.offsetWidth/this.container.offsetHeight,a=t.width/t.height;if(this.width=Math.max(this.width,t.width),this.height=Math.max(this.height,t.height),this.options.objectFit==="contain"){const d=i>a?this.height*i:this.width,l=i>a?this.height:this.width/i;(this.canvas.width!==d||this.canvas.height!==this.height)&&(this.canvas.width=d,this.canvas.height=l)}else{const d=i>a?this.width:this.height*i,l=i>a?this.width/i:this.height;(this.canvas.width!==d||this.canvas.height!==this.height)&&(this.canvas.width=d,this.canvas.height=l)}const s=(this.canvas.width-this.width)*this.options.horizontalAlign,r=(this.canvas.height-this.height)*this.options.verticalAlign;(this.clearCanvas||this.options.clearCanvas)&&(this.context.clearRect(0,0,this.canvas.width,this.canvas.height),this.clearCanvas=!1),this.context.drawImage(t,0,0,t.width,t.height,s,r,this.width,this.height)}setLoadingPriority(){const e=this.index;this.frames.forEach(t=>{t.priority=Math.abs(t.index+.25-e),this.options.loop&&(t.priority=Math.min(t.priority,this.options.frames-t.priority))})}process(e){var t,i;if(this.setLoadingPriority(),!this.options.preloadAllTarImages&&this.options.tarURL!==void 0&&this.tarball){let{numLoading:a,numLoaded:s}=this.getTarStatus();const r=this.options.maxConnectionLimit,d=this.frames.filter(h=>h.tarImage===void 0&&h.tarImageAvailable&&!h.loadingTarImage).sort((h,m)=>h.priority-m.priority),c=((t=this.frames.filter(h=>h.tarImage!==void 0&&h.tarImageAvailable&&!h.loadingTarImage).sort((h,m)=>m.priority-h.priority).shift())==null?void 0:t.priority)??1e10;for(;a<r&&d.length>0;){const h=d.shift();(h.priority<c||s<this.options.maxCachedImages-a)&&h.fetchTarImage().then(()=>{this.releaseTarImageWithLowestPriority()}).catch(m=>{console.error(m)}),a++}}if(this.options.imageURLCallback){let{numLoading:a,numLoaded:s}=this.getLoadStatus();const r=this.options.maxConnectionLimit,d=this.frames.filter(h=>h.image===void 0&&!h.loading&&h.priority).sort((h,m)=>h.priority-m.priority),c=((i=this.frames.filter(h=>h.image!==void 0&&!h.loading).sort((h,m)=>m.priority-h.priority).shift())==null?void 0:i.priority)??1e10;for(;a<r&&d.length>0;){const h=d.shift();(h.priority<c||s<this.options.maxCachedImages-a)&&h.fetchImage().then(()=>{this.releaseImageWithLowestPriority()}).catch(m=>{console.error(m)}),a++}}}getLoadStatus(){const e=this.options.imageURLCallback!==void 0,t=this.frames.filter(r=>r.loading).length,i=this.frames.filter(r=>r.image!==void 0).length,a=this.options.maxCachedImages,s=Math.max(0,i-t)/a;return{used:e,progress:s,numLoading:t,numLoaded:i,maxLoaded:a}}getTarStatus(){const e=this.options.tarURL!==void 0,t=this.tarball!==void 0&&this.initialized,i=this.frames.filter(l=>l.loadingTarImage).length,a=this.frames.filter(l=>l.tarImage!==void 0).length,s=this.options.preloadAllTarImages?this.frames.length:this.options.maxCachedImages,r=this.tarLoadProgress,d=a/s;return{used:e,tarLoaded:t,progress:d,numLoading:i,numLoaded:a,maxLoaded:s,tarLoadProgress:r}}logDebugStatus(e){const t=a=>`${Math.abs(a*100).toFixed(1).padStart(5," ")}%`;let i=`${this.options.name} - frames: ${this.frames.length}, maxCache: ${this.options.maxCachedImages}, wrap: ${this.options.loop}, size: ${this.options.objectFit}
- loadProgress ${t(this.loadProgress)}, last frame drawn ${this.lastFrameDrawn}/${this.index}
`;{const{used:a,progress:s,numLoading:r,numLoaded:d,maxLoaded:l}=this.getLoadStatus();i+=`- images: ${a?`${t(s)}, numLoading: ${r}, numLoaded: ${d}/${l}`:"not used"} 
`}{const{used:a,tarLoaded:s,progress:r,numLoading:d,numLoaded:l,maxLoaded:c}=this.getTarStatus();i+=`- tar:    ${a?`${t(r)}, numLoading: ${d}, numLoaded: ${l}/${c}`:"not used"}`}R(e,i)}releaseImageWithLowestPriority(){this.setLoadingPriority();const e=this.frames.filter(t=>t.image!==void 0&&!t.loading);if(e.length>this.options.maxCachedImages){const t=e.sort((i,a)=>i.priority-a.priority).pop();t&&t.releaseImage()}}releaseTarImageWithLowestPriority(){if(!this.options.preloadAllTarImages){this.setLoadingPriority();const e=this.frames.filter(t=>t.tarImage!==void 0&&!t.loadingTarImage);if(e.length>this.options.maxCachedImages){const t=e.sort((i,a)=>i.priority-a.priority).pop();t&&t.releaseTarImage()}}}};o(u,"defaultOptions",{frames:1,imageURLCallback:void 0,tarURL:void 0,tarImageURLCallback:void 0,loop:!1,fillStyle:"#00000000",objectFit:"cover",preloadAllTarImages:!1,clearCanvas:!1,useWorkerForTar:!0,useWorkerForImage:!E(),maxCachedImages:32,showDebugInfo:!1,name:"FastImageSequence",maxConnectionLimit:4,horizontalAlign:.5,verticalAlign:.5});let g=u;const M=document.getElementById("prev-button"),U=document.getElementById("next-button"),f=document.getElementById("slider-input");async function B(n){const e=new g(n,{name:"PlayWithControlTest",frames:89,imageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,tarURL:"lowrespreviews.tar",tarImageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.jpg`,loop:!0,objectFit:"contain",fillStyle:"#00000000",preloadAllTarImages:!1,useWorkerForTar:!0,maxCachedImages:32,clearCanvas:!1,showDebugInfo:!0});await e.ready,e.progress=0,e.tick(t=>{e.playing&&(f.value=e.progress)}),M.addEventListener("click",()=>{e.play(-30)}),U.addEventListener("click",()=>{e.play(30)}),f.addEventListener("mousedown",t=>{e.stop()}),f.addEventListener("input",()=>{e.paused&&(e.progress=f.value)}),e.play(30)}async function W(n){const e=new g(n,{name:"PlayBackwardsTest at 200fps",frames:89,imageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,loop:!0,objectFit:"cover",fillStyle:"#00000000",preloadAllTarImages:!1,useWorkerForTar:!0,maxCachedImages:32,clearCanvas:!1,showDebugInfo:!0});await e.ready,e.progress=0,e.play(-200)}async function O(n){const e=new g(n,{name:"StillImageTest",frames:89,imageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,loop:!0,objectFit:"cover",fillStyle:"#00000000",preloadAllTarImages:!1,useWorkerForTar:!0,maxCachedImages:1,clearCanvas:!1,showDebugInfo:!0});await e.ready,console.log("fastImageSequence loaded"),setTimeout(()=>{e.setMaxCachedImages(89,t=>console.log("preload progress:",t)).then(()=>{console.log("all frames preloaded")})},2e3)}function A(n){let e=w(n);setInterval(()=>{console.log("destructing"),e.destruct(),console.log("constructing"),e=w(n)},3e3)}function w(n){const e=new g(n,{name:"ConstructDestructTest",frames:89,imageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.webp`,tarURL:Math.random()>.5?"lowrespreviews.tar":void 0,tarImageURLCallback:t=>`${(""+(t+1)).padStart(4,"0")}.jpg`,loop:Math.random()>.5,objectFit:Math.random()>.5?"cover":"contain",fillStyle:"#00000000",preloadAllTarImages:Math.random()>.5,useWorkerForTar:Math.random()>.5,maxCachedImages:1+Math.random()*32|0,clearCanvas:Math.random()>.5,showDebugInfo:!0});return e.ready.then(()=>{e.tick(()=>e.progress=Math.random())}),e}B(document.getElementsByClassName("grid-item")[0]);W(document.getElementsByClassName("grid-item")[1]);O(document.getElementsByClassName("grid-item")[2]);A(document.getElementsByClassName("grid-item")[3]);
