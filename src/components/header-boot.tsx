/**
 * Paints last visit's header, icons, bell and phone bar while the parser is
 * still in the header, before the session check. The live header and bar
 * carry data-nav-ready / data-bottom-nav, and the stylesheet hides this
 * copy once they arrive.
 */

import { BELL_CLAPPER_PATH, BELL_DOME_PATH } from "@/components/header-placeholders";
import { Button } from "@/components/ui/button";
import { JoinGroupButton } from "@/components/join-group-button";
import { RIGHT_CLUSTER } from "@/components/site-nav";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";

/** Same as BellPlaceholder: the real bell's shape and colour, so nothing changes when it arrives. */
const BELL_HTML = `<span aria-hidden="true" class="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground"><svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16"><path d="${BELL_DOME_PATH}"></path><path d="${BELL_CLAPPER_PATH}"></path></svg></span>`;

const ICON_INNER: Record<string, string> = {
  Home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  Walks:
    '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  Notices:
    '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  Progress: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  History:
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  Members:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  Messages: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  Reports:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 18v-2"/><path d="M12 18v-4"/><path d="M16 18v-6"/>',
  Settings:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  Guide:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  "Contact us": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  "Facebook group": '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  More: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
};

function bootScript(facebookUrl: string) {
  return `(function(){try{
var ICONS=${JSON.stringify(ICON_INNER)};
var FACEBOOK=${JSON.stringify(facebookUrl)};
var BELL=${JSON.stringify(BELL_HTML)};
var parts=("; "+document.cookie).split("; ");
function val(name){for(var i=0;i<parts.length;i++)if(parts[i].indexOf(name+"=")===0)return decodeURIComponent(parts[i].slice(name.length+1));return "";}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function icon(label,size,stroke){var inner=ICONS[label];if(!inner)return "";return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+stroke+'" stroke-linecap="round" stroke-linejoin="round" class="'+size+' shrink-0" aria-hidden="true">'+inner+"</svg>";}
var path=location.pathname;
function on(href){
  if(href==="/")return path==="/";
  if(href==="/walks")return path==="/walks"||path.indexOf("/w/")===0;
  if(href==="/admin/walks")return path==="/admin/walks"||path.indexOf("/admin/walks/")===0||path.indexOf("/w/")===0;
  if(href==="/admin/settings")return path.indexOf("/admin/settings")===0||path.indexOf("/admin/homepage")===0;
  return path===href||path.indexOf(href+"/")===0;
}
function itemsFrom(raw){
  if(!raw)return [];
  try{var items=JSON.parse(raw);if(!items||!items.length)return [];
  var out=[];
  for(var i=0;i<items.length&&i<16;i++){var item=items[i];if(!item||typeof item.href!=="string"||typeof item.label!=="string")continue;if(item.href.charAt(0)!=="/"&&item.href.indexOf("https://")!==0&&item.href.indexOf("http://")!==0)continue;if(item.href.indexOf("//")===0||item.label.length>40)continue;out.push(item);}
  return out;}catch(e){return [];}
}
var items=itemsFrom(val("bs-nav"));
if(items.length){
  var initial=(val("bs-av")||"").slice(0,1);
  var photo=val("bs-avimg");
  if(!/^https:\\/\\/img\\.clerk\\.com\\/[A-Za-z0-9._~=\\-]+$/.test(photo))photo="";
  var avatar=photo?'<img alt="" aria-hidden="true" class="size-7 shrink-0 rounded-full object-cover" src="'+photo+'?width=160">':'<span aria-hidden="true" class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase">'+esc(initial)+"</span>";
  var links="";
  for(var i=0;i<items.length;i++){
    var item=items[i];
    if(item.href.charAt(0)!=="/")continue;
    var active=on(item.href);
    links+='<a class="relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[14px] '+(active?"text-foreground":"text-muted-foreground")+'" href="'+esc(item.href)+'">'+(active?'<span class="absolute inset-0 rounded-md bg-muted"></span>':"")+'<span class="relative z-10 inline-flex items-center gap-1.5">'+icon(item.label,"size-4","2")+esc(item.label)+"</span></a>";
  }
  var slot=document.getElementById("bs-header-boot");
  if(slot&&links){
    document.documentElement.setAttribute("data-remembered-in","");
    var html='<div class="hidden min-w-0 items-center justify-center md:flex"><div class="relative hidden min-w-0 md:block"><nav class="flex max-w-full items-center justify-center-safe gap-1 overflow-x-auto overscroll-x-contain text-[14px] [scrollbar-width:none] [-ms-overflow-style:none]">'+links+"</nav></div></div>"
    +'<div class="flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 md:min-w-[7.75rem] lg:min-w-[20.5rem]">'
    +(val("bs-search")==="1"?'<button type="button" aria-label="Search the site" class="flex size-9 shrink-0 items-center justify-center gap-2 rounded-full text-sm text-muted-foreground md:h-8 md:w-44 md:justify-start md:rounded-md md:border md:bg-background md:px-2.5 md:shadow-xs lg:w-60"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0 max-md:text-foreground" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><span class="truncate max-md:hidden">Search the site…</span><kbd class="pointer-events-none ml-auto hidden h-5 min-w-5 select-none items-center justify-center rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground lg:inline-flex">'+(/mac|iphone|ipad|ipod/i.test(navigator.platform||navigator.userAgent)?"⌘K":"Ctrl K")+'</kbd></button>':"")
    +BELL+avatar+"</div>";
    function paint(){if(document.querySelector("[data-nav-ready]:not([hidden] *)")){obs.disconnect();slot.textContent="";return;}if(!slot.childElementCount)slot.innerHTML=html;}
    var obs=new MutationObserver(paint);
    if(slot.parentNode)obs.observe(slot.parentNode,{childList:true,subtree:true});
    paint();
  }
}
// The phone bar's slot is at the end of the page, not parsed yet when this
// runs in the header, so this part is kept for BottomBarBootScript to call
// right after the slot (calling it here too is harmless).
window.__bsBottomBoot=function(){try{
if(document.documentElement.getAttribute("data-phone-menu")!=="bottom")return;
var barSlot=document.getElementById("bs-bottom-boot");if(!barSlot||barSlot.childElementCount)return;
var tabs=items.length?itemsFrom(val("bs-bar")):[];
if(!tabs.length&&!items.length){
  tabs=[{href:"/",label:"Home"},{href:"/contact",label:"Contact us"}];
  if(FACEBOOK)tabs.push({href:FACEBOOK,label:"Facebook group"});
}
if(!tabs.length)return;
var cols=tabs.length+1;
var cells="";
for(var t=0;t<tabs.length;t++){
  var tab=tabs[t];
  var tabOn=tab.href.charAt(0)==="/"&&on(tab.href);
  var hrefAttr=tab.href.charAt(0)==="/"?esc(tab.href):esc(tab.href);
  var extra=tab.href.charAt(0)!=="/"?' rel="noopener noreferrer" target="_blank"':"";
  cells+='<li class="flex"><a class="relative flex flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-[11px] font-medium '+(tabOn?"text-foreground":"text-muted-foreground")+'" href="'+hrefAttr+'"'+extra+'>'
    +'<span class="relative flex h-7 w-14 items-center justify-center">'+(tabOn?'<span class="absolute inset-0 rounded-full bg-muted"></span>':"")+'<span class="relative">'+icon(tab.label,"size-5",tabOn?"2.25":"1.75")+'</span></span>'
    +'<span class="max-w-full truncate px-1">'+esc(tab.label)+"</span></a></li>";
}
cells+='<li class="flex"><span class="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"><span class="relative flex h-7 w-14 items-center justify-center"><span class="relative">'+icon("More","size-5","1.75")+'</span></span><span class="max-w-full truncate px-1">More</span></span></li>';
function paintBar(){if(document.querySelector("[data-bottom-nav]:not([hidden] *)")){barObs.disconnect();barSlot.textContent="";return;}if(!barSlot.childElementCount)barSlot.innerHTML='<div aria-hidden="true" class="h-[var(--bottom-nav-offset,0px)] md:hidden"></div><nav aria-label="Main" class="fixed inset-x-0 bottom-0 z-[57] border-t bg-background/85 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-xl md:hidden"><ul class="mx-auto grid h-15 max-w-md" style="grid-template-columns:repeat('+cols+',minmax(0,1fr))">'+cells+"</ul></nav>";}
var barObs=new MutationObserver(paintBar);
if(barSlot.parentNode)barObs.observe(barSlot.parentNode,{childList:true,subtree:true});
paintBar();
}catch(e){}};
window.__bsBottomBoot();
}catch(e){}})();`;
}

/** Right after the phone bar's slot (layout.tsx): draws last visit's bar into it before the first paint. */
export function BottomBarBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: "window.__bsBottomBoot&&window.__bsBottomBoot();" }} />;
}

export function HeaderBootScript({ facebookUrl = "" }: { facebookUrl?: string }) {
  const afterAuth = `${appUrl()}${AFTER_AUTH_PATH}`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootScript(facebookUrl) }} />
      {/* Signed-out header, in the ready-made page so Sign in and Join are
          there on the first paint instead of arriving with the session check.
          The same parts as SiteNav's signed-out branch, so nothing changes when
          that arrives. Hidden for remembered members (data-guest-home, set by
          the script just above) and once the real header is on screen. */}
      <div className="contents" data-guest-home="" id="bs-guest-boot">
        <div className="hidden min-w-0 items-center justify-center md:flex" />
        <div
          className={`flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3 ${RIGHT_CLUSTER}`}
        >
          <Button asChild size="sm" variant="outline">
            <a href={accountPortalHref("sign-in", afterAuth)}>Sign in</a>
          </Button>
          <JoinGroupButton href={accountPortalHref("sign-up", afterAuth)} />
        </div>
      </div>
    </>
  );
}
