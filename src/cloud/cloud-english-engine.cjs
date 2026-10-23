'use strict';
function translateLabel(value, labels) {
 if(typeof value!=='string')return value;
 const key=value.trim();if(!key)return value;
 let translated=Object.hasOwn(labels,key)?labels[key]:null;
 if(translated===null){
  const count=key.match(/^(.*?)[（(]\s*(\d+)\s*[）)]$/);
  if(count&&Object.hasOwn(labels,count[1].trim()))translated=labels[count[1].trim()]+' ('+count[2]+')';
 }
 if(translated===null){
  const selected=key.match(/^(?:已选中|已选择)\s*(\d+)\s*(?:个|项)$/);
  if(selected)translated=selected[1]+' selected';
 }
 if(translated===null)return value;
 const leading=value.slice(0,value.indexOf(key)),trailing=value.slice(value.indexOf(key)+key.length);
 return leading+translated+trailing;
}
function allowedLocation(location){
 if(location.protocol!=='https:')return false;
 if(location.hostname==='yun.vivo.com.cn')return /^\/(contacts|browser|bookmark|messageIntercept|blacklist|clouddisk)(\/|$)/.test(location.pathname);
 return location.hostname==='find.vivo.com.cn'&&/^\/findphone(\/|$)/.test(location.pathname);
}
function installCloudEnglish(win,config,translate,allowed){
 // Electron's guest preload can run while a redirect still has a provisional URL.
 // Check the final document origin when DOMContentLoaded fires.
 if(win.document.readyState==='loading'){
  win.document.addEventListener('DOMContentLoaded',()=>installCloudEnglish(win,config,translate,allowed),{once:true});
  return;
 }
 if(!allowed(win.location)||win.__vivoCloudEnglish)return;
 const doc=win.document;
 const isFind=win.location.hostname==='find.vivo.com.cn';
 const scopes=isFind?config.find:win.location.pathname.startsWith('/clouddisk')?config.drive:config.services;
 const safe=scopes.safeSelectors.join(',');
 const excluded=['script','style','noscript','svg','canvas','iframe','textarea','[contenteditable]:not([contenteditable="false"])',...scopes.excludeSelectors].join(',');
 const stats={version:config.version,flushes:0,nodesVisited:0,textEdits:0,attributeEdits:0};
 Object.defineProperty(win,'__vivoCloudEnglish',{value:stats,configurable:true});
 const ignored=el=>!el||!!el.closest(excluded);
 const eligible=el=>!!el&&!ignored(el)&&!!el.closest(safe);
 const attributes=['placeholder','title','aria-label','alt'];
 const ownText=new WeakMap(),ownAttributes=new WeakMap();
 function text(node){
  const el=node.parentElement;if(!eligible(el)||!/[\u3400-\u9fff]/.test(node.nodeValue))return;
  let next=translate(node.nodeValue,config.labels);
  for(const context of scopes.contextualTranslations||[])if(el.closest(context.selectors.join(',')))next=translate(next,context.translations);
  if(next===node.nodeValue){
   const trimmed=next.trim();let replacement=null;
   if(el.closest('.device-open')){
    let m=trimmed.match(/^(\d+)台设备可远程开启查找$/);if(m)replacement=m[1]+' devices support remotely enabling Find Device';
    m=trimmed.match(/^(\d+)台设备(已|未)开启查找功能$/);if(m)replacement='Find Device '+(m[2]==='已'?'enabled':'disabled')+' on '+m[1]+' devices';
   }
   if(el.closest('.timeago')){const m=trimmed.match(/^(\d+)(分钟前|小时前|天前|周前|个月前)$/);if(m)replacement=m[1]+' '+({'分钟前':'min','小时前':'hour','天前':'day','周前':'week','个月前':'month'}[m[2]])+(m[1]!=='1'&&m[2]!=='分钟前'?'s':'')+' ago';}
   if(replacement!==null)next=next.replace(trimmed,replacement);
  }
  if(next!==node.nodeValue){ownText.set(node,next);node.nodeValue=next;stats.textEdits++;}
 }
 function attrs(el){
  if(!el.getAttribute)return;
  for(const name of attributes){
   if(!el.hasAttribute(name))continue;
   // Placeholders describe controls; their values are never read or changed.
   const placeholder=name==='placeholder'&&el.matches('input,textarea')&&!el.closest('[contenteditable="true"]');
   if(!placeholder&&!eligible(el))continue;
   const old=el.getAttribute(name),next=translate(old,config.labels);if(next!==old){let cache=ownAttributes.get(el);if(!cache){cache={};ownAttributes.set(el,cache);}cache[name]=next;el.setAttribute(name,next);stats.attributeEdits++;}
  }
 }
 function walk(root){
  if(root.nodeType===3){stats.nodesVisited++;text(root);return;}
  if(root.nodeType!==1&&root.nodeType!==9)return;
  if(root.nodeType===1){attrs(root);if(ignored(root))return;}
  const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT,{acceptNode(node){if(node.nodeType===1&&ignored(node)){attrs(node);return win.NodeFilter.FILTER_REJECT;}return win.NodeFilter.FILTER_ACCEPT;}});
  let node;while((node=walker.nextNode())){stats.nodesVisited++;if(node.nodeType===3)text(node);else attrs(node);}
 }
 const roots=new Set();let queued=false;
 const observer=new win.MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData'){if(ownText.get(record.target)===record.target.nodeValue)continue;roots.add(record.target);}
   else if(record.type==='attributes'){if(ownAttributes.get(record.target)?.[record.attributeName]===record.target.getAttribute(record.attributeName))continue;roots.add(record.target);}
   else for(const node of record.addedNodes)roots.add(node);
  }
  if(roots.size&&!queued){queued=true;win.queueMicrotask(flush);}
 });
 const observe=()=>observer.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
 function specialLabels(){
  const pageTitles={'联系人':'Contacts','浏览器':'Browser','骚扰拦截':'Spam blocking','云盘':'Cloud Drive','vivo云服务':'vivo Cloud Services','vivo备份文件':'Cloud Drive','vivo查找手机':'Find Device'};
  if(Object.hasOwn(pageTitles,doc.title))doc.title=pageTitles[doc.title];
  // Hosted source always inserts the fixed root first; later breadcrumb names are user data.
  const root=doc.querySelector('#clouddisk .bread-wrap .el-breadcrumb__inner[role="link"]');
  if(root){for(const node of root.childNodes)if(node.nodeType===3&&node.nodeValue.trim()==='全部文件'){const next=translate(node.nodeValue,config.labels);ownText.set(node,next);node.nodeValue=next;stats.textEdits++;}if(root.getAttribute('title')==='全部文件')root.setAttribute('title','All files');}
  // Format only the generated date, preserving every numeric field and the displayed time.
  if(isFind)for(const el of doc.querySelectorAll('.device-wrapper .number.ellipsis'))for(const node of el.childNodes)if(node.nodeType===3){const next=node.nodeValue.replace(/^(\s*)(\d{4})年(\d{1,2})月(\d{1,2})日(\s+\d{1,2}:\d{2}\s*)$/,(_,space,y,m,d,time)=>space+y+'-'+m.padStart(2,'0')+'-'+d.padStart(2,'0')+time);if(next!==node.nodeValue){ownText.set(node,next);node.nodeValue=next;stats.textEdits++;}}
 }
 function flush(){queued=false;stats.flushes++;observer.disconnect();try{for(const root of roots)if(root.isConnected)walk(root);roots.clear();specialLabels();}finally{observe();}}
 function start(){if(!doc.body)return;walk(doc.body);specialLabels();const title=translate(doc.title,config.labels);if(title!==doc.title)doc.title=title;observe();}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
module.exports={translateLabel,allowedLocation,installCloudEnglish};
