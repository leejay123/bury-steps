/**
 * Grey placeholders never just flash. If one appears and the real content
 * replaces it within HOLD ms, the content's lists, tables and value cards
 * (only — headings, buttons, tabs, search and filters show at once) are kept
 * under matching grey shapes
 * (one bar per line of text, the right size for pictures, avatars, fields
 * and buttons) until HOLD is up, then the grey fades into the content from
 * a soft blur — the Members list's look. Placeholders shown longer than
 * that fade straight into the content when it arrives.
 *
 * HOLD matches ContentReveal's hold, so a page that loads quickly takes the
 * same time to settle as one that was already there (it was 600ms, which
 * kept Messages and Reports grey for a second when the data took 50ms).
 *
 * An inline script at the very top of <body>, because on a fresh load React
 * swaps the streamed content in before the site's own code has started.
 * Browser animations only (no attributes touched, so nothing for React to
 * trip over when it takes over the page); the grey layers are plain divs at
 * the end of <body>, removed when done.
 */
const SCRIPT = `(function(){try{
if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var HOLD=320,REVEAL=400,BLUR="blur(2px)",MAX=220;
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
function keepOne(src,list,hold){
  if(!src||!list.isConnected)return false;
  // A card that is still a placeholder is already on screen. Copying it
  // paints a second one (the Progress totals card on refresh).
  if(list.querySelector('[data-slot="skeleton"]'))return false;
  list.style.opacity="0";
  requestAnimationFrame(function(){
    if(!list.isConnected)return;
    var r=list.getBoundingClientRect();
    list.style.opacity="";
    if(r.width<2||r.height<2)return;
    var layer=document.createElement("div");layer.setAttribute("aria-hidden","true");
    layer.style.cssText="position:absolute;left:"+(r.left+window.scrollX)+"px;top:"+(r.top+window.scrollY)+"px;width:"+r.width+"px;height:"+r.height+"px;overflow:hidden;pointer-events:none;z-index:40;background:var(--background)";
    var copy=src.cloneNode(true);copy.style.width="100%";copy.style.margin="0";
    layer.appendChild(copy);document.body.appendChild(layer);
    var total=hold+REVEAL,h=hold/total;
    list.animate([{opacity:0,filter:BLUR,offset:0},{opacity:0,filter:BLUR,offset:h},{opacity:1,filter:"blur(0)",offset:1}],{duration:total,easing:"ease-in-out"});
    layer.animate([{opacity:1,filter:"blur(0)",offset:0},{opacity:1,filter:"blur(0)",offset:h},{opacity:0,filter:BLUR,offset:1}],{duration:total,easing:"ease-in-out",fill:"forwards"});
    setTimeout(function(){layer.remove();},total+60);
  });
  return true;
}
function collect(nodes,sel,live){
  var out=[];
  function add(el){
    if(!el||el.nodeType!==1||out.indexOf(el)>=0)return;
    if(el.closest(".t-skel"))return;
    if(live&&!el.getClientRects().length)return;
    out.push(el);
  }
  nodes.forEach(function(n){
    if(n.nodeType!==1)return;
    if(n.matches(sel))add(n);
    [].forEach.call(n.querySelectorAll(sel),add);
  });
  return out.filter(function(el){return !out.some(function(o){return o!==el&&o.contains(el);});});
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
  // A new placeholder replacing an old one is already the card. Copying the
  // old one as well stacks a second card (Progress totals on refresh).
  if(addedSkel){shownAt=performance.now();return;}
  if(!removedSkel||!added.length)return;
  var outer=added.filter(function(n){return n.isConnected&&!added.some(function(o){return o!==n&&o.contains(n);});});
  if(!outer.length)return;
  // Lists, tables and value cards are held in place (the shared list,
  // History, walk rows, the Progress stats card). Headings, buttons, tabs,
  // search and filters show straight away. A card placeholder is only laid
  // over the matching card, never over a list. Lists with their own reveal
  // (Members, .t-skel) are left alone.
  function valueCard(el){
    if(!el||el.nodeType!==1||el.closest(".t-skel,form"))return false;
    if(el.querySelector("input,textarea,select,form"))return false;
    return el.matches("[data-reveal-card],[data-slot='card'],section.rounded-xl.border");
  }
  function collectCards(nodes,live){
    var out=[];
    function add(el){
      if(!valueCard(el)||out.indexOf(el)>=0)return;
      if(live&&!el.getClientRects().length)return;
      out.push(el);
    }
    nodes.forEach(function(n){
      if(n.nodeType!==1)return;
      add(n);
      [].forEach.call(n.querySelectorAll("[data-reveal-card],[data-slot='card'],section.rounded-xl.border"),add);
    });
    return out.filter(function(el){return !out.some(function(o){return o!==el&&o.contains(el);});});
  }
  var lists=collect(outer,"[data-reveal-list],table",true);
  outer.forEach(function(n){
    [].forEach.call(n.querySelectorAll("[data-stagger-item]"),function(row){
      var parent=row.parentElement;
      if(!parent||parent.closest(".t-skel"))return;
      var kids=[].filter.call(parent.children,function(c){return c.nodeType===1;});
      var pure=kids.length>0&&kids.every(function(c){return c.hasAttribute("data-stagger-item");});
      // A card sitting beside search or filters reveals on its own. A row
      // inside a plain list reveals with that list, the way the Walks table does.
      if(!pure)return;
      if(lists.indexOf(parent)<0&&parent.getClientRects().length)lists.push(parent);
    });
  });
  lists=lists.filter(function(el){return !lists.some(function(o){return o!==el&&o.contains(el);});});
  var cards=collectCards(outer,true).filter(function(el){return !lists.some(function(list){return list===el||list.contains(el);});});
  var listSrc=collect(gone,"[data-reveal-list],table",false);
  var cardSrc=collectCards(gone,false).filter(function(el){return !listSrc.some(function(list){return list===el||list.contains(el);});});
  if(!lists.length&&!cards.length)return;
  var wait=Math.max(0,HOLD-(performance.now()-shownAt));
  // Keep each placeholder on top of the block it matches, at that block's
  // own size, so the page does not jump and the grey fades into the values.
  function holdAll(targets,sources){
    targets.forEach(function(target,i){
      if(wait>30&&sources[i]&&keepOne(sources[i],target,wait))return;
      reveal([target],sources[i]?0:wait);
    });
  }
  holdAll(cards,cardSrc);
  holdAll(lists,listSrc);
}).observe(document.documentElement,{childList:true,subtree:true});
}catch(e){}})();`;

export function SkeletonHoldScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
