/* pets.js — BunnyHero Pets Widget for Landr (safe compact build, no truncation) */
(function() {
    const KEY="landrPets_v1";
    const SWF="http://petswf.bunnyherolabs.com/adopt/swf/bunny";
    const ADOPT="https://bunnyherolabs.com/adopt/";
    let S=load();

    function el(t,a={},c=[]){const d=document.createElement(t);for(const k in a){
        if(k==="style")d.style.cssText=a[k];
        else if(k==="html")d.innerHTML=a[k];
        else d.setAttribute(k,a[k]);
    } c.forEach(x=>d.appendChild(x)); return d; }

    function load(){ try{let r=localStorage.getItem(KEY); return r?JSON.parse(r):{enabled:true,instances:[]}; } catch(e){return{enabled:true,instances:[]};} }
    function save(){localStorage.setItem(KEY,JSON.stringify(S));}
    function msg(t){ if(window.LandrAPI) LandrAPI.showNotification(t,"info"); }

    function flashvars(o){
        let p=[];
        if(o.pet)p.push("cn="+encodeURIComponent(o.pet));
        if(o.adopter)p.push("an="+encodeURIComponent(o.adopter));
        if(o.clr)p.push("clr="+o.clr.replace("#","0x"));
        if(o.tc)p.push("tc="+o.tc.replace("#","0x"));
        return p.join("&");
    }

    function petCard(o){
        const wrap=el("div",{class:"widget",style:"padding:12px"});
        const c=el("div",{style:"display:flex;flex-direction:column;gap:8px;align-items:center"});
        const sw=el("div",{style:`width:${o.w}px;height:${o.h}px`});
        const em=document.createElement("embed");
        em.src=SWF; em.width=o.w; em.height=o.h; 
        em.setAttribute("flashvars",flashvars(o));
        em.setAttribute("wmode",o.transparent?"transparent":"window");
        em.type="application/x-shockwave-flash";
        sw.appendChild(em);
        const lbl=el("div",{html:`<b>${o.pet}</b> ${o.adopter?("— "+o.adopter):""}`,style:"opacity:.9;font-size:.9rem"});
        const link=el("a",{href:ADOPT,target:"_blank",style:"font-size:.75rem;opacity:.7;text-decoration:underline"});
        link.textContent="Adopt your own!";
        const rm=el("button",{style:"padding:6px 12px;border:none;background:#e11;color:white;border-radius:8px"});
        rm.textContent="Remove";
        rm.onclick=()=>{wrap.remove(); S.instances=S.instances.filter(i=>i.id!==o.id); save(); msg("Pet removed");};
        c.append(sw,lbl,link,rm);
        wrap.appendChild(c);
        return wrap;
    }

    function buildPanel(){
        if(document.getElementById("petsWidget"))return;
        const grid=document.querySelector(".content-grid"); if(!grid)return;

        const box=el("div",{class:"widget",id:"petsWidget",style:"padding:12px"});
        box.appendChild(el("h2",{html:"🐰 BunnyHero Pets"}));

        const name=el("input",{type:"text",placeholder:"Pet name",style:"width:100%;padding:8px"});
        const owner=el("input",{type:"text",placeholder:"Adopter name",style:"width:100%;padding:8px"});
        const w=el("input",{type:"number",value:"250",style:"width:100%;padding:8px"});
        const h=el("input",{type:"number",value:"300",style:"width:100%;padding:8px"});
        const clr=el("input",{type:"text",placeholder:"#e8e8e8 bg color",style:"width:100%;padding:8px"});
        const tc=el("input",{type:"text",placeholder:"#ffffff text color",style:"width:100%;padding:8px"});
        const tr=el("input",{type:"checkbox"});

        const add=el("button",{style:"padding:8px 12px;background:var(--accent-color);color:white;border:none;border-radius:8px"});
        add.textContent="Insert Pet";

        add.onclick=()=>{
            if(!S.enabled){msg("Pets disabled in settings"); return;}
            const o={
                id:Date.now(),
                pet:name.value||"pet",
                adopter:owner.value,
                w:parseInt(w.value)||250,
                h:parseInt(h.value)||300,
                clr:clr.value,
                tc:tc.value,
                transparent:tr.checked
            };
            S.instances.push(o); save();
            grid.appendChild(petCard(o));
            msg("Pet added!");
        };

        box.append(
            name,owner,w,h,clr,tc,
            el("label",{html:"Transparent"},[tr]),
            add
        );
        grid.appendChild(box);

        S.instances.forEach(o=>grid.appendChild(petCard(o)));
    }

    function settingsToggle(){
        const s=document.getElementById("settingsPanel"); if(!s)return;

        if(document.getElementById("petsToggle"))return;

        const row=el("div",{class:"setting-item"});
        row.innerHTML=`<label class="setting-label">BunnyHero Pets</label>`;
        const t=el("div",{id:"petsToggle",class:"toggle-switch"});
        const slider=el("div",{class:"toggle-slider"});
        t.appendChild(slider);
        if(S.enabled)t.classList.add("active");
        t.onclick=()=>{t.classList.toggle("active"); S.enabled=t.classList.contains("active"); save(); msg("Pet widget "+(S.enabled?"enabled":"disabled"));};
        row.appendChild(t);
        s.appendChild(row);
    }

    document.addEventListener("DOMContentLoaded",()=>{
        buildPanel();
        settingsToggle();
        msg("Pets addon loaded");
    });
})();
