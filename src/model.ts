export type User = { id:string; name:string; role:'member'|'admin'; active:boolean };
export type Area = { id:string; name:string; type:string; size:string; active:boolean; image:string };
export type Booking = { id:string; area:string; user:string; date:string; start:string; end:string; note:string; kind:'booking'|'closure' };
export const users:User[]=[{id:'anna',name:'Anna Nováková',role:'member',active:true},{id:'petr',name:'Petr Dvořák',role:'member',active:true},{id:'klara',name:'Klára Svobodová',role:'member',active:true},{id:'admin',name:'Tereza Malá',role:'admin',active:true}];
export const initialAreas:Area[]=[{id:'hala',name:'Krytá hala',type:'Celoroční ježdění za každého počasí',size:'20 × 60 m',active:true,image:'/images/horse.webp'},{id:'kolbiste',name:'Venkovní kolbiště',type:'Prostor pro trénink i skokovou přípravu',size:'40 × 70 m',active:true,image:'/images/horse.webp'},{id:'trava',name:'Travnatá plocha',type:'Přírodní povrch pod otevřeným nebem',size:'50 × 80 m',active:true,image:'/images/horse.webp'}];
export const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const shiftDay=(day:string,n:number)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dayKey(d)};
export const initialBookings:Booking[]=[{id:'1',area:'hala',user:'anna',date:today,start:'09:00',end:'10:00',note:'Drezurní trénink s Bellou',kind:'booking'},{id:'2',area:'hala',user:'petr',date:today,start:'11:00',end:'12:30',note:'Individuální trénink',kind:'booking'},{id:'3',area:'hala',user:'admin',date:today,start:'14:00',end:'15:00',note:'Údržba povrchu',kind:'closure'},{id:'4',area:'kolbiste',user:'klara',date:today,start:'10:00',end:'11:30',note:'Skoková příprava',kind:'booking'},{id:'5',area:'hala',user:'anna',date:shiftDay(today,1),start:'16:00',end:'17:00',note:'Odpolední trénink',kind:'booking'},{id:'6',area:'trava',user:'petr',date:today,start:'15:00',end:'16:00',note:'Práce ze země',kind:'booking'}];
export const minutes=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
export function validateBooking(b:Booking,all:Booking[],areas:Area[],people:User[],actor:User):string|null {
 if(!actor.active)return 'Tento ukázkový účet je deaktivovaný.';
 const old=all.find(x=>x.id===b.id);
 if(actor.role!=='admin'&&(b.user!==actor.id||b.kind!=='booking'||(old&&(old.user!==actor.id||old.kind==='closure'))))return 'Tuto rezervaci může upravovat pouze její autor nebo administrátor.';
 if(!areas.find(a=>a.id===b.area)?.active)return 'Tato plocha je momentálně uzavřená. Vyberte jinou plochu.';
 if(!people.find(u=>u.id===b.user)?.active)return 'Vybraný uživatel není aktivní.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date+'T12:00:00Z'))||new Date(b.date+'T12:00:00Z').toISOString().slice(0,10)!==b.date||b.date<today)return 'Vyberte dnešní nebo budoucí datum.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.end)||minutes(b.start)<360||minutes(b.end)>1260||minutes(b.end)<=minutes(b.start))return 'Zvolte platný čas mezi 6:00 a 21:00. Konec musí být po začátku.';
 const conflict=all.find(x=>x.id!==b.id&&x.area===b.area&&x.date===b.date&&b.start<x.end&&b.end>x.start);
 return conflict?`Termín se překrývá s ${conflict.kind==='closure'?'uzavřením plochy':'rezervací'} ${conflict.start}–${conflict.end}. Zvolte prosím jiný čas.`:null;
}
export const initialRules=[{title:'Pravidla rezervací',text:'Rezervujte si plochu před začátkem tréninku. Jedna rezervace je určena pro celou vybranou plochu.'},{title:'Bezpečnost při jízdě',text:'Při jízdě používejte ochrannou přilbu a respektujte ostatní jezdce i pokyny trenéra.'},{title:'Povinnosti jezdců',text:'Po skončení tréninku ukliďte použité pomůcky a zanechte plochu v čistém stavu.'},{title:'Používání jízdárenských ploch',text:'Používejte pouze otevřené plochy. Při údržbě nebo nepříznivém počasí respektujte uzavření.'},{title:'Rušení rezervací',text:'Pokud nemůžete dorazit, zrušte rezervaci co nejdříve, aby mohl čas využít někdo další.'}];
