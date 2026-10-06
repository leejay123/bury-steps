import {
  AVATAR_BOX_CLASS,
  AVATAR_IMAGE_CLASS,
  BELL_BADGE_CLASS,
  BELL_BADGE_COUNT_CLASS,
  BELL_BUTTON_CLASS,
  BELL_CLAPPER_PATH,
  BELL_DOME_PATH,
  BELL_ICON_SIZE,
  BELL_MAX,
  CLERK_IMAGE_URL,
  HEADER_NAV_COLUMN_CLASS,
  HEADER_TOOLS_CLASS,
  NAV_ACTIVE_PILL_CLASS,
  NAV_ICON_CLASS,
  NAV_ICON_SVG,
  NAV_LINK_LABEL_CLASS,
  NAV_ROW_CLASS,
  NAV_ROW_WRAPPER_CLASS,
  SEARCH_BUTTON_CLASS,
  SEARCH_ICON_CLASS,
  SEARCH_ICON_SVG,
  SEARCH_KBD_FULL_CLASS,
  SEARCH_LABEL_CLASS,
  lucideSvg,
  navLinkClass,
} from "@/components/header-chrome";
import { AVATAR_COOKIE, AVATAR_IMAGE_COOKIE, NAV_COOKIE, UNREAD_COOKIE } from "@/lib/remembered-nav";

/**
 * Paints the signed-in header from the last visit's cookies while the parser
 * is still in the header, before the session check: the menu with its icons,
 * search, the bell with last visit's unread count and the avatar picture.
 * Every piece comes from header-chrome.ts, like the real header's, so the
 * two look the same. The real header replaces it (it carries data-nav-ready)
 * so this never sits beside the live menu.
 *
 * React streams the real header into a hidden holding <div> at the end of
 * the page and moves it into the header a little later (it reveals several
 * loaded parts together), so "is the real header here?" only counts a
 * data-nav-ready inside the header. Counting the hidden copy blanked the menu
 * until React moved it in.
 */
const CONFIG = {
  nav: NAV_COOKIE,
  initial: AVATAR_COOKIE,
  image: AVATAR_IMAGE_COOKIE,
  unread: UNREAD_COOKIE,
  imageRe: CLERK_IMAGE_URL.source,
  icons: Object.fromEntries(
    Object.entries(NAV_ICON_SVG).map(([label, inner]) => [label, lucideSvg(inner, `lucide ${NAV_ICON_CLASS}`)]),
  ),
  linkActive: navLinkClass(true),
  linkIdle: navLinkClass(false),
  pill: NAV_ACTIVE_PILL_CLASS,
  label: NAV_LINK_LABEL_CLASS,
  navColumn: HEADER_NAV_COLUMN_CLASS,
  rowWrapper: NAV_ROW_WRAPPER_CLASS,
  row: NAV_ROW_CLASS,
  tools: HEADER_TOOLS_CLASS,
  search: SEARCH_BUTTON_CLASS,
  searchIcon: lucideSvg(SEARCH_ICON_SVG, `lucide ${SEARCH_ICON_CLASS}`),
  searchLabel: SEARCH_LABEL_CLASS,
  kbd: SEARCH_KBD_FULL_CLASS,
  bell: BELL_BUTTON_CLASS,
  bellIcon: `<svg fill="none" height="${BELL_ICON_SIZE}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="${BELL_ICON_SIZE}"><path d="${BELL_DOME_PATH}"></path><path d="${BELL_CLAPPER_PATH}"></path></svg>`,
  badge: BELL_BADGE_CLASS,
  badgeCount: BELL_BADGE_COUNT_CLASS,
  max: BELL_MAX,
  avatar: AVATAR_BOX_CLASS,
  avatarImage: AVATAR_IMAGE_CLASS,
};

const SCRIPT = `(function(c){try{
var parts=("; "+document.cookie).split("; ");
function val(name){for(var i=0;i<parts.length;i++)if(parts[i].indexOf(name+"=")===0)return decodeURIComponent(parts[i].slice(name.length+1));return "";}
var uat=[];for(var i=0;i<parts.length;i++)if(/^__client_uat(_[^=]*)?=/.test(parts[i]))uat.push(parts[i].slice(parts[i].indexOf("=")+1));
if(uat.length&&uat.every(function(v){return v===""||v==="0";}))return;
var raw=val(c.nav);if(!raw)return;
var items=JSON.parse(raw);if(!items||!items.length)return;
var initial=(val(c.initial)||"").slice(0,1);
var unread=val(c.unread);unread=/^\\d{1,2}$/.test(unread)?+unread:0;
var img=val(c.image);img=img.slice(img.indexOf("|")+1);
if(img.length>2048||!new RegExp(c.imageRe).test(img))img="";
var path=location.pathname;
function on(href){
  if(href==="/")return path==="/";
  if(href==="/walks")return path==="/walks"||path.indexOf("/w/")===0;
  if(href==="/admin/walks")return path==="/admin/walks"||path.indexOf("/admin/walks/")===0||path.indexOf("/w/")===0;
  if(href==="/admin/settings")return path.indexOf("/admin/settings")===0;
  return path===href||path.indexOf(href+"/")===0;
}
function esc(s){return String(s).replace(/[&<>"]/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch];});}
function sized(w){var u=new URL(img);u.searchParams.append("width",String(w));return u.href;}
var links="";
for(var j=0;j<items.length&&j<16;j++){
  var item=items[j];if(!item||typeof item.href!=="string"||typeof item.label!=="string")continue;
  if(item.href.charAt(0)!=="/"||item.href.charAt(1)==="/"||item.label.length>40)continue;
  var active=on(item.href);
  links+='<a '+(active?'aria-current="page" ':"")+'class="'+(active?c.linkActive:c.linkIdle)+'" href="'+esc(item.href)+'">'+(active?'<span class="'+c.pill+'"></span>':"")+'<span class="'+c.label+'">'+(c.icons[item.label]||"")+esc(item.label)+"</span></a>";
}
if(!links)return;
var slot=document.getElementById("bs-header-boot");if(!slot)return;
var header=(slot.closest&&slot.closest("header"))||slot.parentNode;if(!header)return;
document.documentElement.setAttribute("data-remembered-in","");
var apple=/mac|iphone|ipad|ipod/i.test(navigator.platform||navigator.userAgent);
var bell='<span aria-hidden="true" class="'+c.bell+'"><span class="inline-flex">'+c.bellIcon+"</span>"
+(unread>0?'<span class="'+c.badge+'"><span class="'+c.badgeCount+'"><span class="inline-block">'+(unread>c.max?c.max+"+":unread)+"</span></span></span>":"")+"</span>";
var avatar='<span aria-hidden="true" class="'+c.avatar+'">'+(img?'<img alt="" class="'+c.avatarImage+'" crossorigin="anonymous" src="'+esc(sized(160))+'" srcset="'+esc(sized(80)+" 1x,"+sized(160)+" 2x")+'">':esc(initial))+"</span>";
var html='<div class="'+c.navColumn+'"><div class="'+c.rowWrapper+'"><nav class="'+c.row+'">'+links+"</nav></div></div>"
+'<div class="'+c.tools+'"><button type="button" aria-label="Search the site" class="'+c.search+'">'+c.searchIcon+'<span class="'+c.searchLabel+'">Search the site\\u2026</span><kbd class="'+c.kbd+'">'+(apple?"\\u2318K":"Ctrl K")+"</kbd></button>"+bell+avatar+"</div>";
var kept=0;
function paint(){
  if(header.querySelector("[data-nav-ready]")){
    obs.disconnect();
    var live=header.querySelector("[data-nav-ready] nav");
    if(live&&kept)live.scrollLeft=kept;
    slot.textContent="";return;
  }
  if(slot.childElementCount)return;
  slot.innerHTML=html;
  var nav=slot.querySelector("nav"),current=nav&&nav.querySelector('[aria-current="page"]');
  if(!current)return;
  var row=nav.getBoundingClientRect(),link=current.getBoundingClientRect();
  nav.scrollLeft=Math.max(0,nav.scrollLeft+(link.left-row.left)-(row.width-link.width)/2);
  kept=nav.scrollLeft;
}
var obs=new MutationObserver(paint);
obs.observe(header,{childList:true,subtree:true});
paint();
}catch(e){}})(${JSON.stringify(CONFIG).replace(/</g, "\\u003c")});`;

export function HeaderBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
