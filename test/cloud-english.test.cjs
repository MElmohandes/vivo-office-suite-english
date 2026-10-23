const {test}=require('node:test'),assert=require('node:assert/strict');
const {translateLabel,allowedLocation,installCloudEnglish}=require('../src/cloud/cloud-english-engine.cjs');
const config=require('../src/cloud/compiled-config.json');
test('only reviewed HTTPS cloud routes are eligible',()=>{
 for(const u of ['https://yun.vivo.com.cn/contacts','https://yun.vivo.com.cn/browser','https://yun.vivo.com.cn/messageIntercept','https://yun.vivo.com.cn/clouddisk/all','https://find.vivo.com.cn/findphone/bound'])assert.equal(allowedLocation(new URL(u)),true,u);
 for(const u of ['https://passport.vivo.com.cn/login','https://yun.vivo.com.cn/login','https://yun.vivo.com.cn/contactsFake','http://yun.vivo.com.cn/contacts','https://yun.vivo.com.cn.evil.example/contacts','https://example.com/contacts','file:///contacts'])assert.equal(allowedLocation(new URL(u)),false,u);
});
test('preload waits for document readiness before checking a redirect origin',()=>{
 let handler;const win={document:{readyState:'loading',addEventListener:(name,fn,options)=>{assert.equal(name,'DOMContentLoaded');assert.equal(options.once,true);handler=fn;}},location:new URL('https://passport.vivo.com.cn/transfer')};
 let checks=0;installCloudEnglish(win,config,translateLabel,()=>{checks++;return false;});assert.equal(checks,0);assert.equal(typeof handler,'function');win.document.readyState='interactive';handler();assert.equal(checks,1);
});
test('fixed labels and counts translate without changing whitespace or numbers',()=>{
 assert.equal(translateLabel('  所有联系人（123）\n',config.labels),'  All contacts (123)\n');
 assert.equal(translateLabel('搜索联系人',config.labels),'Search contacts');
 assert.equal(translateLabel('已选择 12 项',config.labels),'12 selected');
 assert.equal(translateLabel('正在加载...',config.labels),'Loading...');
});
test('unknown text is preserved and no substring translation is performed',()=>{
 for(const text of ['我的联系人','删除我的文件.txt','联系人 会议纪要','https://example.com/删除','小王（123）','my file.pdf'])assert.equal(translateLabel(text,config.labels),text);
});
test('all translations preserve source placeholders and have English targets',()=>{
 for(const [source,target]of Object.entries(config.labels)){
  assert.equal(typeof target,'string');
  assert.deepEqual((source.match(/\{\d+\}|%[sd]/g)||[]).sort(),(target.match(/\{\d+\}|%[sd]/g)||[]).sort(),source);
 }
});

