import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateBooking,initialAreas,users,today} from '../src/model.ts';
const anna=users[0],admin=users[3];
const base={id:'a',area:'hala',user:'anna',date:today,start:'09:00',end:'10:00',note:'',kind:'booking'};
const check=(b,all=[base],actor=anna,areas=initialAreas)=>validateBooking(b,all,areas,users,actor);
test('rejects all partial, containing and equal overlaps',()=>{
 for(const [start,end] of [['08:30','09:30'],['09:30','10:30'],['08:00','11:00'],['09:15','09:45'],['09:00','10:00']])assert.match(check({...base,id:'b',start,end}),/překrývá/);
});
test('permits adjacent times and different areas/dates',()=>{
 assert.equal(check({...base,id:'b',start:'10:00',end:'11:00'}),null);
 assert.equal(check({...base,id:'b',start:'08:00',end:'09:00'}),null);
 assert.equal(check({...base,id:'b',area:'trava'}),null);
 assert.equal(check({...base,id:'b',date:'2099-01-01'}),null);
});
test('edit excludes itself but detects other bookings',()=>{
 assert.equal(check(base),null);
 assert.match(check({...base,start:'10:30',end:'11:30'},[base,{...base,id:'b',start:'11:00',end:'12:00'}]),/překrývá/);
});
test('members cannot change other members bookings, owners or closures',()=>{
 assert.match(check({...base,user:'petr'}),/pouze/);
 assert.match(check(base,[{...base,user:'petr'}]),/pouze/);
 assert.match(check({...base,kind:'closure'}),/pouze/);
 assert.equal(check({...base,user:'petr'},[base],admin),null);
});
test('maintenance also blocks all overlapping bookings',()=>{
 assert.match(check({...base,id:'b'},[{...base,kind:'closure'}]),/uzavřením/);
});
test('closed area and inactive account cannot book',()=>{
 assert.match(check(base,[],anna,initialAreas.map(a=>({...a,active:false}))),/uzavřená/);
 assert.match(check(base,[],{...anna,active:false}),/deaktivovaný/);
});
test('rejects backwards, out-of-hours and past booking',()=>{
 for(const [start,end] of [['10:00','09:00'],['10:00','10:00'],['05:00','08:00'],['20:00','22:00']])assert.match(check({...base,start,end},[]),/platný čas/);
 assert.match(check({...base,date:'2020-01-01'},[]),/datum/);
});
