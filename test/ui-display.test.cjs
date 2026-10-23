const {test}=require('node:test');
const assert=require('node:assert/strict');
const {label,calendarLabel,weekday,albumFolder}=require('../src/runtime/ui-display.cjs');
test('fixed labels and server feedback categories translate without altering unknown content',()=>{
  assert.equal(label('原子笔记'),'Notes');
  assert.equal(label('手机投屏相关'),'Phone mirroring');
  assert.equal(label('当天/09:00'),'On the day/09:00');
  assert.equal(label('我的照片.jpg'),'我的照片.jpg');
  assert.equal(label(null),null);
});
test('Gregorian and Chinese lunar dates are readable without changing source algorithms',()=>{
  assert.equal(calendarLabel('2026年10月22日 周四'),'2026-10-22 Thu');
  assert.equal(calendarLabel('二〇二六年正月初一'),'2026 L1/1');
  assert.equal(calendarLabel('闰六月廿三'),'Leap L6/23');
  assert.equal(calendarLabel('星期四'),'Thursday');
  assert.equal(calendarLabel('霜降'),'Frost Descent');
});
test('recurrence and relative reminder text preserves numbers and times',()=>{
  assert.equal(calendarLabel('每月(第二个周三)'),'Monthly(2nd Wed)');
  assert.equal(calendarLabel('3天前'),'3 days before');
  assert.equal(calendarLabel('今天 周四 09:00至10:00'),'Today Thu 09:00 to 10:00');
});
test('birthday names and rich-text tags stay intact',()=>{
  assert.equal(calendarLabel('小王的26岁生日'),"小王's 26th birthday");
  assert.equal(calendarLabel('开始: 2026年10月22日<br/>结束: 2026年10月23日'),'Start: 2026-10-22<br/>End: 2026-10-23');
  assert.equal(calendarLabel('<b data-info="原始">星期四</b>'),'<b data-info="原始">Thursday</b>');
});

test('weekday and lunar cells use different render contexts',()=>{
 assert.equal(weekday('四'),'Thu');
 assert.equal(calendarLabel('四'),'L4');
 assert.equal(label('查看'),'view');
});
test('only built-in album folders are localized',()=>{
 assert.equal(albumFolder({folderName:'全部项目',navType:1,changeable:false}),'All items');
 assert.equal(albumFolder({folderName:'全部项目',navType:4,changeable:true}),'全部项目');
 assert.equal(albumFolder({folderName:'我的照片',navType:4,changeable:true}),'我的照片');
});

