'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../src/runtime');
const {reminderLabel,calendarCategory,todoCategory,timeZoneLabel}=require('../src/runtime/ui-display.cjs');
const bindings=require('./fixtures/calendar-form-bindings.json');
function evaluate(expression,context){return vm.runInNewContext('('+expression+')',{require,__dirname:root,...context});}
test('calendar form reminders translate while unknown text is retained',()=>{
 for(const [source,target]of [['当天09:00','On the day at 09:00'],['当天/09:00','On the day at 09:00'],['2天前09:00','2 days before at 09:00'],['5分钟前','5 min before'],['无提醒','No reminder']])assert.equal(reminderLabel(source),target);
 assert.equal(reminderLabel('给小王的提醒'),'给小王的提醒');
});
test('release readonly reminder binding displays English without changing the model',()=>{for(const name of ['当天09:00','5分钟前']){const e={value:{hasAlarm:true,relativeTime:'original serialized data'},name};const before=JSON.stringify(e);assert.equal(evaluate(bindings.reminderInput,{e}),reminderLabel(name));assert.equal(JSON.stringify(e),before);}});
test('built-in calendar categories display in English',()=>{for(const[accountName,title,target]of[['Local account','个人','Personal'],['vivo Default','工作','Work'],['Birthday','生日','Birthdays'],['bbknotes','笔记','Notes']])assert.equal(calendarCategory(Object.freeze({accountName,title,id:'preserved-id'})),target);});
test('calendar names matching dictionary keys stay unchanged for custom calendars',()=>{assert.equal(calendarCategory({accountName:'Custom',title:'个人'}),'个人');assert.equal(calendarCategory({accountName:'Local account',title:'我的自定义日历'}),'我的自定义日历');});
test('only the built-in default to-do list is renamed for display',()=>{assert.equal(todoCategory({defaultType:6,name:'待办列表',guid:'builtin'}),'To-do list');assert.equal(todoCategory({defaultType:0,name:'待办列表',guid:'custom'}),'待办列表');assert.equal(todoCategory({defaultType:6,name:'我的待办',guid:'builtin'}),'我的待办');});
test('release category getter retains GUIDs, colors and custom labels',()=>{
 const getter=evaluate('{'+bindings.categoryOptionsGetter+'}',{p:{hasTodoForCategory:()=>true},f:{getBgColorByCategoryGuid:()=>0}});
 const items=[{defaultType:6,name:'待办列表',guid:'builtin-id',colorValue:'#abc',visible:1},{defaultType:0,name:'待办列表',guid:'user-id',colorValue:'#def',visible:1}],before=JSON.stringify(items);
 const options=Object.getOwnPropertyDescriptor(getter,'categoryOptions').get.call({todoCategories:items});assert.equal(options[0].label,'To-do list');assert.equal(options[1].label,'待办列表');assert.equal(options[0].value,'builtin-id');assert.equal(options[1].value,'user-id');assert.equal(options[0].colorValue,'#abc');assert.equal(JSON.stringify(items),before);
});
test('time-zone display preserves offsets and rejects unknown identifiers',()=>{assert.equal(timeZoneLabel({timeZoneID:'Asia/Shanghai',label:'北京/(GMT+08:00)'}),'Beijing (GMT+08:00)');assert.equal(timeZoneLabel({timeZoneID:'America/New_York',label:'纽约/(GMT-04:00)'}),'New York (GMT-04:00)');assert.equal(timeZoneLabel({timeZoneID:'invalid/custom',label:'自定义'}),'自定义');});
for(const[file,variable]of[['128.js','t'],['130.js','e'],['app-modules.js','t']])test('release '+file+' time-zone binding preserves data',()=>{const zone={id:0,timeZoneID:'Asia/Shanghai',cityTimeZone:'北京',summerTime:'GMT+08:00'},before=JSON.stringify(zone);assert.equal(evaluate(bindings.timeZoneBindings[file],{[variable]:zone}),'Beijing (GMT+08:00)');assert.equal(JSON.stringify(zone),before);});
for(const[file,variable]of[['128.js','t'],['130.js','e']])test('release '+file+' category binding preserves custom names',()=>{for(const item of [{accountName:'Local account',title:'个人',id:'default-id'},{accountName:'custom',title:'个人',id:'custom-id'}]){const before=JSON.stringify(item);assert.equal(evaluate(bindings.calendarCategoryBindings[file],{[variable]:item}),item.accountName==='Local account'?'Personal':'个人');assert.equal(JSON.stringify(item),before);}});
