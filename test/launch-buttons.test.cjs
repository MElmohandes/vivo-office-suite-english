'use strict';
const vm=require('node:vm');
const {test}=require('node:test'),assert=require('node:assert/strict');
const {protectedLocalizationNodes}=require('../tools/protected-localization-nodes.cjs');
const {fixedSource,brokenSource,stockSource,actionEnum,guardAst}=require('./fixtures/launch-dispatch.json');
function fixture(source,{connected=true,disabled=false,connecting=false,cancelled=false}={}){
 const calls=[],logs=[];
 const context={D:{APPLY_NAME:actionEnum,APPLY_NAME_DESC:Object.fromEntries([1,2,3,5,6,7].map(id=>[id,()=>String(id)]))},window:{_log:{info:message=>logs.push(message)}},s:{CONNECT_STATE:{SUCCESS:1}},n:{sendTask(){}},a:{CONNECT_DATA_ANALYTICS_SINGLE_EVENT:{}},I:{getStorageItem(){return true;}},localStorage:{},setTimeout(fn){fn();return 1;}};
 const method=vm.runInNewContext('({'+source+'}).clickAppBtn',context);
 const instance={btnDisabled:disabled,phoneReadytoConnect:{},deviceInfo:{pre:{},deviceType:'phone',connectFlag:'wifi'},deviceDesc:'phone',device:{connectState:connected?1:0},isAutoConnecting(){return connecting;},$t(key){return key;},debounceMirrorScreenClick(){calls.push('mirror');},toFileManager(){calls.push('files');},debounceExtendedScreenClick(){calls.push('extend');},clickStartRelay(){calls.push('keyboard');},albumCardClickHandle(){calls.push('backup');},debouncePCModeClick(){calls.push('desktop');},startConnect(fileMode,callback){calls.push('connect:'+fileMode);callback(0,cancelled);}};
 return{calls,logs,click:id=>method.call(instance,id)};
}
const actions=[[1,'mirror'],[2,'keyboard'],[3,'backup'],[5,'files'],[6,'extend'],[7,'desktop']];
test('released 1.0.0 reproduces silent no-op for mirroring and file manager',()=>{for(const id of [1,5]){const f=fixture(brokenSource);f.click(id);assert.deepEqual(f.calls,[]);assert.ok(f.logs.some(s=>s.includes('not found app')));}});
test('corrected dispatch method exactly matches the original vendor method',()=>assert.equal(fixedSource,stockSource));
for(const[id,expected]of actions){
 test('connected action '+id+' dispatches '+expected,()=>{const f=fixture(fixedSource);f.click(id);assert.deepEqual(f.calls,[expected]);assert.ok(!f.logs.some(s=>s.includes('not found app')));});
 test('disconnected action '+id+' connects before '+expected,()=>{const f=fixture(fixedSource,{connected:false});f.click(id);assert.deepEqual(f.calls,['connect:'+(id===5),expected]);});
}
test('disabled and auto-connecting devices retain the original no-dispatch guards',()=>{for(const opts of[{disabled:true},{connecting:true}]){const f=fixture(fixedSource,opts);f.click(1);f.click(5);assert.deepEqual(f.calls,[]);}});
test('cancelled connection does not launch either feature',()=>{for(const id of [1,5]){const f=fixture(fixedSource,{connected:false,cancelled:true});f.click(id);assert.deepEqual(f.calls,['connect:'+(id===5)]);}});
test('unknown action retains the original rejection',()=>{const f=fixture(fixedSource);f.click(99);assert.deepEqual(f.calls,[]);assert.ok(f.logs.some(s=>s.includes('not found app')));});
test('translation guard protects lookup/property keys while permitting display values',()=>{
 const source='const x={"内部键":"显示文字"};const y=x["内部键"];const z=x?.["内部键"];show("显示文字");';const ast=guardAst;const protectedNodes=protectedLocalizationNodes(ast);const literals=[];function visit(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(visit);return;}if(n.type==='StringLiteral')literals.push(n);for(const[k,v]of Object.entries(n))if(k!=='loc')visit(v);}visit(ast);assert.equal(literals.filter(n=>protectedNodes.has(n.start+":"+n.end)).length,3);assert.ok(literals.filter(n=>n.value==='显示文字').every(n=>!protectedNodes.has(n.start+":"+n.end)));
});
