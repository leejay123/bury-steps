/**
 * Paints the signed-in header from the last visit's cookie while the parser
 * is still in the header, before the session check. The real header replaces
 * it (it carries data-nav-ready) so this never sits beside the live menu.
 */
const SCRIPT = `(function(){try{
var parts=("; "+document.cookie).split("; ");
function val(name){for(var i=0;i<parts.length;i++)if(parts[i].indexOf(name+"=")===0)return decodeURIComponent(parts[i].slice(name.length+1));return "";}
var raw=val("bs-nav");if(!raw)return;
var items=JSON.parse(raw);if(!items||!items.length)return;
var initial=(val("bs-av")||"").slice(0,1);
var path=location.pathname;
function on(href){
  if(href==="/")return path==="/";
  if(href==="/walks")return path==="/walks"||path.indexOf("/w/")===0;
  if(href==="/admin/walks")return path==="/admin/walks"||path.indexOf("/admin/walks/")===0;
  if(href==="/admin/settings")return path.indexOf("/admin/settings")===0||path.indexOf("/admin/homepage")===0;
  return path===href||path.indexOf(href+"/")===0;
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
var links="";
for(var i=0;i<items.length&&i<16;i++){
  var item=items[i];if(!item||typeof item.href!=="string"||typeof item.label!=="string")continue;
  if(item.href.charAt(0)!=="/"||item.href.charAt(1)==="/"||item.label.length>40)continue;
  var active=on(item.href);
  links+='<a class="relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[14px] '+(active?"text-foreground":"text-muted-foreground")+'" href="'+esc(item.href)+'">'+(active?'<span class="absolute inset-0 rounded-md bg-muted"></span>':"")+'<span class="relative z-10 inline-flex items-center gap-1.5"><span class="inline-block size-4 shrink-0"></span>'+esc(item.label)+"</span></a>";
}
if(!links)return;
var slot=document.getElementById("bs-header-boot");if(!slot)return;
document.documentElement.setAttribute("data-remembered-in","");
var html='<div class="hidden min-w-0 items-center justify-center md:flex"><div class="relative hidden min-w-0 md:block"><nav class="flex max-w-full items-center justify-center-safe gap-1 overflow-x-auto overscroll-x-contain text-[14px] [scrollbar-width:none] [-ms-overflow-style:none]">'+links+"</nav></div></div>"
+'<div class="flex min-w-0 items-center justify-end gap-1.5 justify-self-end max-md:col-start-3 max-md:min-w-max md:gap-3">'
+'<button type="button" aria-label="Search the site" class="flex size-9 shrink-0 items-center justify-center gap-2 rounded-full text-sm text-muted-foreground md:h-8 md:w-44 md:justify-start md:rounded-md md:border md:bg-background md:px-2.5 md:shadow-xs lg:w-60"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0 max-md:text-foreground" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><span class="truncate max-md:hidden">Search the site…</span><kbd class="pointer-events-none ml-auto hidden h-5 min-w-5 select-none items-center justify-center rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground lg:inline-flex">⌘K</kbd></button>'
+'<span aria-hidden="true" class="inline-flex size-9 shrink-0 rounded-full border border-border bg-background"></span>'
+'<span aria-hidden="true" class="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase">'+esc(initial)+"</span></div>";
function paint(){if(document.querySelector("[data-nav-ready]")){obs.disconnect();slot.textContent="";return;}if(!slot.childElementCount)slot.innerHTML=html;}
var obs=new MutationObserver(paint);
if(slot.parentNode)obs.observe(slot.parentNode,{childList:true,subtree:true});
paint();
}catch(e){}})();`;

export function HeaderBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
