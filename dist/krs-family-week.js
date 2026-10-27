/* KRS Family Week v0.1 */
class KrsFamilyWeek extends HTMLElement {
  setConfig(config) {
    this.config=config;
    this.offset=0;
    this.loadedKey="";
    this.events={};
    this.attachShadow({mode:"open"});
  }
  set hass(hass) {
    this._hass=hass;
    const monday=this.monday();
    const calendars=this.resolve();
    const key=this.dateKey(monday)+"|"+calendars.map(c=>c.id).join(",");
    if(key!==this.loadedKey){this.loadedKey=key;this.load(calendars,monday,key);}
    this.render(calendars,monday);
  }
  getCardSize(){return 12;}
  monday(){
    const d=new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-((d.getDay()+6)%7)+this.offset*7);
    return d;
  }
  dateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  resolve(){
    const states=this._hass?.states||{};
    const configs=[...(this.config.calendars||[]).map(c=>({...c,meal:false})),...(this.config.meal?[{...this.config.meal,meal:true}]:[])];
    return configs.map(c=>{
      const target=(c.match||c.name||"").toLocaleLowerCase("de");
      const id=c.entity_id||Object.keys(states).find(k=>k.startsWith("calendar.")&&(states[k].attributes.friendly_name||"").toLocaleLowerCase("de")===target);
      return {...c,id:id&&states[id]?id:null};
    });
  }
  async load(calendars,monday,key){
    const ids=calendars.map(c=>c.id).filter(Boolean);
    if(!ids.length){this.events={};this.render(calendars,monday);return;}
    const end=new Date(monday);end.setDate(end.getDate()+7);
    const f=d=>this.dateKey(d)+" 00:00:00";
    try{
      const ws=await this._hass.callWS({type:"call_service",domain:"calendar",service:"get_events",service_data:{start_date_time:f(monday),end_date_time:f(end)},target:{entity_id:ids},return_response:true});
      const result=ws.response||{};
      if(this.loadedKey===key){this.events=result||{};this.error="";this.render(this.resolve(),this.monday());}
    }catch(e){
      if(this.loadedKey===key){this.error=String(e.message||e);this.render(this.resolve(),this.monday());}
    }
  }
  esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  date(v){if(!v)return null;return new Date(String(v).length===10?v+"T00:00:00":String(v).replace(" ","T"));}
  dayEvents(day,calendars){
    const next=new Date(day);next.setDate(next.getDate()+1);
    const out=[];
    for(const c of calendars){
      for(const e of this.events[c.id]?.events||[]){
        const a=this.date(e.start),b=this.date(e.end);
        if(!a||!b||!Number.isFinite(a.getTime())||!(a<next&&b>day))continue;
        const allDay=String(e.start).length===10;
        out.push({title:e.summary||"Ohne Titel",name:c.name,color:c.color||"#5796d2",meal:c.meal,time:allDay?"":a.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),sort:a.getTime()});
      }
    }
    return out.sort((a,b)=>a.sort-b.sort);
  }
  render(calendars,monday){
    if(!this.shadowRoot)return;
    const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d;});
    const weekDate=new Date(Date.UTC(monday.getFullYear(),monday.getMonth(),monday.getDate()));
    weekDate.setUTCDate(weekDate.getUTCDate()+4-(weekDate.getUTCDay()||7));
    const yearStart=new Date(Date.UTC(weekDate.getUTCFullYear(),0,1));
    const week=Math.ceil((((weekDate-yearStart)/86400000)+1)/7);
    const missing=calendars.filter(c=>!c.id);
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;color:var(--primary-text-color)}ha-card{padding:18px;border-radius:18px}
      header{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}h2{margin:0;font-size:24px}
      .sub,.dim{opacity:.65;font-size:12px}button{border:0;color:inherit;background:var(--secondary-background-color);border-radius:9px;padding:8px 12px;cursor:pointer}
      .legend{display:flex;flex-wrap:wrap;gap:6px;margin:15px 0}.chip{font-size:12px;padding:5px 8px;border-radius:15px;background:var(--secondary-background-color)}
      .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}
      .day{display:grid;grid-template-columns:56px minmax(0,1fr);gap:8px;margin:7px 0}.date{text-align:center;border-radius:9px;background:var(--secondary-background-color);padding:10px 3px}
      .date.today{outline:2px solid var(--primary-color)}.number{font-size:22px;font-weight:700}
      .body{border:1px solid var(--divider-color);border-radius:9px;padding:8px;min-height:52px}
      .events{display:flex;flex-wrap:wrap;gap:5px}.event{border-left:3px solid var(--accent);background:var(--secondary-background-color);border-radius:5px;padding:5px 8px;font-size:13px}
      .event small{display:block;opacity:.6}.meal{border-top:1px solid var(--divider-color);padding-top:7px;margin-top:8px;font-size:13px}.warning{color:var(--error-color);font-size:12px}
    </style><ha-card>
    <header><div><h2>${this.esc(this.config.title||"KRS Family")}</h2><div class="sub">KW ${week} · ${days[0].toLocaleDateString("de-DE")} – ${days[6].toLocaleDateString("de-DE")}</div></div>
    <div><button data-nav="-1">‹</button> <button data-nav="0">Heute</button> <button data-nav="1">›</button></div></header>
    <div class="legend">${calendars.filter(c=>!c.meal).map(c=>`<span class="chip"><span class="dot" style="background:${this.esc(c.color||"#5796d2")}"></span>${this.esc(c.name)}</span>`).join("")}</div>
    ${missing.length?`<div class="warning">Nicht zugeordnet: ${missing.map(c=>this.esc(c.name)).join(", ")}. Bitte entity_id konfigurieren.</div>`:""}
    ${this.error?`<div class="warning">${this.esc(this.error)}</div>`:""}
    ${days.map(d=>{const events=this.dayEvents(d,calendars);const general=events.filter(e=>!e.meal),meals=events.filter(e=>e.meal);
      return `<div class="day"><div class="date ${this.dateKey(d)===this.dateKey(new Date())?"today":""}"><div class="dim">${d.toLocaleDateString("de-DE",{weekday:"short"})}</div><div class="number">${d.getDate()}</div></div>
      <div class="body"><div class="events">${general.length?general.map(e=>`<div class="event" style="--accent:${this.esc(e.color)}">${e.time?`<b>${e.time}</b> · `:""}${this.esc(e.title)}<small>${this.esc(e.name)}</small></div>`).join(""):'<span class="dim">Keine Termine</span>'}</div>
      <div class="meal">🍽️ ${meals.length?meals.map(e=>this.esc(e.title)).join(", "):'<span class="dim">Noch nichts geplant</span>'}</div></div></div>`}).join("")}
    </ha-card>`;
    this.shadowRoot.querySelectorAll("button[data-nav]").forEach(b=>b.onclick=()=>{
      const val=Number(b.dataset.nav);this.offset=val===0?0:this.offset+val;this.loadedKey="";this.hass=this._hass;
    });
  }
}
customElements.define("krs-family-week",KrsFamilyWeek);
window.customCards=window.customCards||[];
window.customCards.push({type:"krs-family-week",name:"KRS Family Week",description:"Wochenübersicht und Essensplan"});
