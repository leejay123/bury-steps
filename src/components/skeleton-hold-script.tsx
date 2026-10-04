/**
 * Grey placeholders never just flash. If one appears and the real content
 * replaces it within HOLD ms, the content's lists and tables (only — headings,
 * buttons, tabs and filters show at once) are kept under matching grey shapes
 * (one bar per line of text, the right size for pictures, avatars, fields
 * and buttons) until HOLD is up, then the grey fades into the content from
 * a soft blur — the Members list's look. Placeholders shown longer than
 * that fade straight into the content when it arrives.
 *
 * An inline script at the very top of <body>, because on a fresh load React
 * swaps the streamed content in before the site's own code has started.
 * Browser animations only (no attributes touched, so nothing for React to
 * trip over when it takes over the page); the grey layers are plain divs at
 * the end of <body>, removed when done.
 */
const SCRIPT = `(function(){try{
if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var HOLD=600,REVEAL=400,BLUR="blur(2px)",MAX=220;
var MEDIA="img,svg,video,canvas,input,textarea,select,button,[data-slot='avatar']";
var shownAt=performance.now();
function isSkel(n){return n.nodeType===1&&(n.matches('[data-slot="skeleton"]')||!!n.querySelector('[data-slot="skeleton"]'));}
function inMain(n){var p=n.nodeType===1?n:n.parentElement;return !!(p&&p.closest&&p.closest("main"));}
function shapes(parts){
  var layer=document.createElement("div");layer.setAttribute("aria-hidden","true");
  layer.style.cssText="position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:40";
  var covered=[],budget=MAX,range=document.createRange(),sx=window.scrollX,sy=window.scrollY,limit=window.innerHeight*1.5;
  function add(l,t,w,h,r){var d=document.createElement("div");d.className="bg-accent animate-pulse";d.style.cssText="position:absolute;left:"+(l+sx)+"px;top:"+(t+sy)+"px;width:"+w+"px;height:"+h+"px;border-radius:"+r;layer.appendChild(d);}
  parts.forEach(function(part){
    var all=[part].concat([].slice.call(part.querySelectorAll("*")));
    all.forEach(function(el){
      if(budget<=0)return;
      for(var i=0;i<covered.length;i++)if(covered[i].contains(el))return;
      var r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.top>limit)return;
      if(el.matches(MEDIA)){var rad=el.matches("[data-slot='avatar']")?"9999px":(getComputedStyle(el).borderRadius||"6px");add(r.left,r.top,r.width,r.height,rad==="0px"?"6px":rad);covered.push(el);budget--;return;}
      var texts=[].filter.call(el.childNodes,function(n){return n.nodeType===3&&n.textContent.trim();});
      if(!texts.length)return;
      texts.forEach(function(t){range.selectNodeContents(t);[].forEach.call(range.getClientRects(),function(ln){if(ln.width<2||budget<=0)return;add(ln.left,ln.top+ln.height*0.18,ln.width,Math.max(8,ln.height*0.64),"4px");budget--;});});
      covered.push(el);
    });
  });
  return {layer:layer,covered:covered};
}
function reveal(nodes,hold){
  var total=hold+REVEAL,h=hold/total;
  if(hold>30){
    var s=shapes(nodes);
    if(s.layer.childElementCount){
      document.body.appendChild(s.layer);
      s.covered.forEach(function(n){n.animate([{opacity:0,filter:BLUR,offset:0},{opacity:0,filter:BLUR,offset:h},{opacity:1,filter:"blur(0)",offset:1}],{duration:total,easing:"ease-in-out"});});
      s.layer.animate([{opacity:1,filter:"blur(0)",offset:0},{opacity:1,filter:"blur(0)",offset:h},{opacity:0,filter:BLUR,offset:1}],{duration:total,easing:"ease-in-out",fill:"forwards"});
      setTimeout(function(){s.layer.remove();},total+60);
      return;
    }
  }
  nodes.forEach(function(n){n.animate([{opacity:0,filter:BLUR},{opacity:1,filter:"blur(0)"}],{duration:REVEAL,easing:"ease-in-out"});});
}
function keep(gone,list,hold){
  var src=null;
  var LISTISH="[data-reveal-list],table";
  for(var i=0;i<gone.length&&!src;i++){var g=gone[i];src=g.matches(LISTISH)?g:g.querySelector(LISTISH);}
  if(!src)return false;
  var r=list.getBoundingClientRect();if(r.width<2||r.height<2)return false;
  var layer=document.createElement("div");layer.setAttribute("aria-hidden","true");
  layer.style.cssText="position:absolute;left:"+(r.left+window.scrollX)+"px;top:"+(r.top+window.scrollY)+"px;width:"+r.width+"px;height:"+r.height+"px;overflow:hidden;pointer-events:none;z-index:40;background:var(--background)";
  var copy=src.cloneNode(true);copy.style.width="100%";copy.style.margin="0";
  layer.appendChild(copy);document.body.appendChild(layer);
  var total=hold+REVEAL,h=hold/total;
  list.animate([{opacity:0,filter:BLUR,offset:0},{opacity:0,filter:BLUR,offset:h},{opacity:1,filter:"blur(0)",offset:1}],{duration:total,easing:"ease-in-out"});
  layer.animate([{opacity:1,filter:"blur(0)",offset:0},{opacity:1,filter:"blur(0)",offset:h},{opacity:0,filter:BLUR,offset:1}],{duration:total,easing:"ease-in-out",fill:"forwards"});
  setTimeout(function(){layer.remove();},total+60);
  return true;
}
new MutationObserver(function(records){
  var removedSkel=false,addedSkel=false,added=[],gone=[];
  records.forEach(function(rec){
    if(!inMain(rec.target))return;
    [].forEach.call(rec.removedNodes,function(n){if(isSkel(n)){removedSkel=true;gone.push(n);}});
    [].forEach.call(rec.addedNodes,function(n){
      if(n.nodeType!==1||n.matches("script,style,template"))return;
      if(isSkel(n)){addedSkel=true;return;}
      added.push(n);
    });
  });
  if(addedSkel&&!removedSkel){shownAt=performance.now();return;}
  if(!removedSkel||!added.length)return;
  var outer=added.filter(function(n){return n.isConnected&&!added.some(function(o){return o!==n&&o.contains(n);});});
  if(!outer.length)return;
  // Only lists and tables are held and revealed (the shared list, History,
  // any list of data-stagger-item rows, real tables) — headings, buttons,
  // tabs and filters show straight away. Lists with their own reveal
  // (Members, .t-skel) are left alone.
  var lists=[];
  outer.forEach(function(n){
    var found=[].slice.call(n.querySelectorAll("[data-reveal-list],table"));
    if(n.matches("[data-reveal-list],table"))found.push(n);
    [].forEach.call(n.querySelectorAll("[data-stagger-item]"),function(row){if(row.parentElement)found.push(row.parentElement);});
    found.forEach(function(el){if(lists.indexOf(el)<0&&el.getClientRects().length&&!el.closest(".t-skel"))lists.push(el);});
  });
  lists=lists.filter(function(el){return !lists.some(function(o){return o!==el&&o.contains(el);});});
  if(!lists.length)return;
  var wait=Math.max(0,HOLD-(performance.now()-shownAt));
  // Keep the page's own placeholder on screen (a copy, over the new list)
  // rather than swapping to different grey shapes — one placeholder that
  // never changes shape, then a fade into the real list.
  if(wait>30&&gone.length&&keep(gone,lists[0],wait)){
    if(lists.length>1)reveal(lists.slice(1),0);
    return;
  }
  reveal(lists,wait);
}).observe(document.documentElement,{childList:true,subtree:true});
}catch(e){}})();`;

export function SkeletonHoldScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
