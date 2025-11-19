/* pets.js — micro build */
(function(){
const K="landrPets_v1",SWF="http://petswf.bunnyherolabs.com/adopt/swf/bunny",A="https://bunnyherolabs.com/adopt/";
let S=load();
function el(t,a={},c=[]){let d=document.createElement(t);for(let k in a){if(k==="style")d.style.cssText=a[k];else if(k==="html")d.innerHTML=a[k];else d.setAttribute(k,a[k]);}c.forEach(x=>d.appendChild(x));return d;}
function load(){try{let r=localStorage.getItem(K);return r?JSON.parse(r):{enabled:!0,instances:[]}}catch(e){return{enabled:!0,instances:[]}}}
function save(){localStorage.setItem(K,JSON.stringify(S))}
function msg(t){window.LandrAPI&&LandrAPI.showNotification(t,"info")}
function vars(o){let p=[];if(o.pet)p.push("cn="+encodeURIComponent(o.pet));if(o.adopter)p.push("an="+encodeURIComponent(o.adopter));if(o.clr)p.push("clr="+o.clr.replace("#","0x"));if(o.tc)p.push("tc="+o.tc.replace("#","0x"));return p.join("&")}
function card(o){
let w=el("div",{class:"widget",style:"padding:12px"}),c=el("div",{style:"display:flex;flex-direction:column;gap:8px;align-items:center"});
let s=el("div",{style:`width:${o.w}px;height:${o.h}px`});
let e=document.createElement("embed");
e.src=SWF;e.width=o.w;e.height=o.h;e.type="application/x-shockwave-flash";
e.setAttribute("flashvars",vars(o));
e.setAttribute("wmode",o.transparent?"transparent":"window");
s.appendChild(e);
let l=el("div",{html:`<b>${o.pet}</b> ${o.adopter?("— "+o.adopter):""}`,style:"opacity:.9;font-size:.9rem"});
let a=el("a",{href:A,target:"_blank",style:"font-size:.75rem;opacity:.7;text-decoration:underline"});a.textContent="Adopt your own!";
let r=el("button",{style:"padding:6px 12px;border:none;background:#e11;color:#fff;border-radius:8px"});r.textContent="Remove";
r.onclick=()=>{w.remove();S.instances=S.instances.filter(i=>i.id!==o.id);save();msg("Pet removed")};
c.append(s,l,a,r);w.appendChild(c);return w;
}
function panel(){
if(document.getElementById("petsWidget"))return;
let g=document.querySelector(".content-grid");if(!g)return;
let b=el("div",{class:"widget",id:"petsWidget",style:"padding:12px"});
b.appendChild(el("h2",{html:"🐰 BunnyHero Pets"}));
let n=el("input",{type:"text",placeholder:"Pet name",style:"width:100%;padding:8px"}),
o=el("input",{type:"text",placeholder:"Adopter name",style:"width:100%;padding:8px"}),
w=el("input",{type:"number",value:"250",style:"width:100%;padding:8px"}),
h=el("input",{type:"number",value:"300",style:"width:100%;padding:8px"}),
c=el("input",{type:"text",placeholder:"#e8e8e8 bg",style:"width:100%;padding:8px"}),
t=el("input",{type:"text",placeholder:"#ffffff text",style:"width:100%;padding:8px"}),
tr=el("input",{type:"checkbox"}),
btn=el("button",{style:"padding:8px 12px;background:var(--accent-color);color:white;border:none;border-radius:8px"});
btn.textContent="Insert Pet";
btn.onclick=()=>{if(!S.enabled){msg("Pets disabled");return;}
let O={id:Date.now(),pet:n.value||"pet",adopter:o.value,w:parseInt(w.value)||250,h:parseInt(h.value)||300,clr:c.value,tc:t.value,transparent:tr.checked};
S.instances.push(O);save();g.appendChild(card(O));msg("Pet added!")};
b.append(n,o,w,h,c,t,el("label",{html:"Transparent"},[tr]),btn);
g.appendChild(b);
S.instances.forEach(i=>g.appendChild(card(i)));
}
function toggle(){
let s=document.getElementById("settingsPanel");if(!s)return;
if(document.getElementById("petsToggle"))return;
let r=el("div",{class:"setting-item"});
r.innerHTML=`<label class="setting-label">BunnyHero Pets</label>`;
let t=el("div",{id:"petsToggle",class:"toggle-switch"}),sl=el("div",{class:"toggle-slider"});
t.appendChild(sl);
if(S.enabled)t.classList.add("active");
t.onclick=()=>{t.classList.toggle("active");S.enabled=t.classList.contains("active");save();msg("Pet widget "+(S.enabled?"enabled":"disabled"))};
r.appendChild(t);s.appendChild(r);
}
document.addEventListener("DOMContentLoaded",()=>{panel();toggle();msg("Pets addon loaded")});
})();
