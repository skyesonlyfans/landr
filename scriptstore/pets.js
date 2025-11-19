/* pets.js — BunnyHero Pets Widget (Ruffle + Images + Dropdown + HTTPS + All Pets)
   Compact build, safe for Landr Addon Store
*/
(function(){
const KEY="landrPets_v2";
const ADOPT="https://bunnyherolabs.com/adopt/";
const PET_API="https://raw.githubusercontent.com/skyesonlyfans/bunnyhero-mirror/main/pets.json"; 
// this JSON contains: [{id:"bunny",name:"Bunny",image:"https://.../bunny.png",swf:"https://.../bunny.swf"}, ...]

let S=load();
let PETS=[];

function el(t,a={},c=[]){let d=document.createElement(t);for(let k in a){
 if(k==="style")d.style.cssText=a[k]; else if(k==="html")d.innerHTML=a[k]; else d.setAttribute(k,a[k]);
} c.forEach(x=>d.appendChild(x)); return d;}

function load(){try{let r=localStorage.getItem(KEY);return r?JSON.parse(r):{enabled:true,instances:[]}}catch(e){return{enabled:true,instances:[]}}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function msg(t){window.LandrAPI&&LandrAPI.showNotification(t,"info")}

function safeSWF(url){return url.replace("http://","https://")}

function flashvars(o){
 let p=[];
 if(o.pet)p.push("cn="+encodeURIComponent(o.pet));
 if(o.adopter)p.push("an="+encodeURIComponent(o.adopter));
 if(o.clr)p.push("clr="+o.clr.replace("#","0x"));
 if(o.tc)p.push("tc="+o.tc.replace("#","0x"));
 return p.join("&");
}

function ensureRuffle(cb){
 if(window.RufflePlayer)return cb();
 if(document.getElementById("ruffle-js")){setTimeout(()=>cb(),400);return;}
 let s=document.createElement("script");
 s.id="ruffle-js"; s.src="https://unpkg.com/@ruffle-rs/ruffle";
 s.onload=()=>setTimeout(()=>cb(),300);
 document.head.appendChild(s);
}

function swfElement(o){
 let wrap=el("div",{style:`width:${o.w}px;height:${o.h}px;display:flex;align-items:center;justify-content:center;background:#0001;border-radius:8px`});

 ensureRuffle(()=>{
   try{
    let r=window.RufflePlayer.newest(),p=r.createPlayer();
    p.style.width=o.w+"px"; p.style.height=o.h+"px";
    wrap.innerHTML=""; wrap.appendChild(p);
    p.load(o.swf);
   }catch(e){
    let em=document.createElement("embed");
    em.src=o.swf; em.width=o.w; em.height=o.h;
    em.type="application/x-shockwave-flash";
    em.setAttribute("flashvars",flashvars(o));
    wrap.innerHTML=""; wrap.appendChild(em);
   }
 });

 return wrap;
}

function card(o){
 let w=el("div",{class:"widget",style:"padding:12px"});
 let c=el("div",{style:"display:flex;flex-direction:column;gap:8px;align-items:center"});

 if(o.img){
   let img=el("img",{src:o.img,style:`width:${o.w}px;height:auto;border-radius:6px`});
   c.appendChild(img);
 }

 c.appendChild(swfElement(o));

 let l=el("div",{html:`<b>${o.pet}</b> ${o.adopter?("— "+o.adopter):""}`,style:"opacity:.9"});
 let a=el("a",{href:ADOPT,target:"_blank",style:"font-size:.8rem;opacity:.7;text-decoration:underline"});
 a.textContent="Adopt this pet!";
 let rm=el("button",{style:"padding:6px 10px;border:none;background:#e11;color:#fff;border-radius:8px"});
 rm.textContent="Remove";
 rm.onclick=()=>{w.remove();S.instances=S.instances.filter(i=>i.id!==o.id);save();msg("Removed")};

 c.append(l,a,rm);
 w.appendChild(c);
 return w;
}

function panel(){
 if(document.getElementById("petsWidget"))return;
 let grid=document.querySelector(".content-grid"); if(!grid)return;

 let box=el("div",{class:"widget",id:"petsWidget",style:"padding:12px"});
 box.appendChild(el("h2",{html:"🐰 BunnyHero Pets"}));

 let sel=el("select",{style:"width:100%;padding:8px"});
 PETS.forEach(p=>{
   let op=el("option",{value:p.id,html:p.name});
   sel.appendChild(op);
 });

 let name=el("input",{type:"text",placeholder:"Pet name",style:"width:100%;padding:8px"});
 let own=el("input",{type:"text",placeholder:"Adopter",style:"width:100%;padding:8px"});
 let W=el("input",{type:"number",value:"250",style:"width:100%;padding:8px"});
 let H=el("input",{type:"number",value:"300",style:"width:100%;padding:8px"});
 let clr=el("input",{type:"text",placeholder:"#e8e8e8",style:"width:100%;padding:8px"});
 let tc=el("input",{type:"text",placeholder:"#ffffff",style:"width:100%;padding:8px"});
 let tr=el("input",{type:"checkbox"});

 let btn=el("button",{style:"padding:8px 12px;background:var(--accent-color);color:white;border:none;border-radius:8px"});
 btn.textContent="Insert Pet";

 btn.onclick=()=>{
   let p=PETS.find(x=>x.id===sel.value);
   if(!p)return;
   let o={
    id:Date.now(),
    pet:name.value||p.name,
    adopter:own.value,
    w:parseInt(W.value)||250,
    h:parseInt(H.value)||300,
    clr:clr.value,
    tc:tc.value,
    transparent:tr.checked,
    swf:safeSWF(p.swf),
    img:p.image
   };
   S.instances.push(o); save();
   grid.appendChild(card(o));
   msg("Pet added");
 };

 box.append(sel,name,own,W,H,clr,tc,el("label",{html:"Transparent"},[tr]),btn);
 grid.appendChild(box);

 S.instances.forEach(o=>grid.appendChild(card(o)));
}

function toggle(){
 let s=document.getElementById("settingsPanel"); if(!s)return;
 if(document.getElementById("petsToggle"))return;

 let row=el("div",{class:"setting-item"});
 row.innerHTML=`<label class="setting-label">BunnyHero Pets</label>`;
 let t=el("div",{id:"petsToggle",class:"toggle-switch"}),sl=el("div",{class:"toggle-slider"});
 t.appendChild(sl);
 if(S.enabled)t.classList.add("active");
 t.onclick=()=>{t.classList.toggle("active");S.enabled=t.classList.contains("active");save();msg("Pets "+(S.enabled?"enabled":"disabled"))}
 row.appendChild(t); s.appendChild(row);
}

fetch(PET_API).then(r=>r.json()).then(json=>{
 PETS=json;
 document.addEventListener("DOMContentLoaded",()=>{panel();toggle();msg("Pets addon loaded")});
});
})();
