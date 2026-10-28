/**
 * shadcn.io's hero letter field (their engine, ported with permission): a
 * WebGL2 grid of small mono letters that drift in slow cloudy shapes, keep
 * clear of the hero text, and are stirred by the pointer through a tiny
 * fluid simulation, which leaves a wake of letters behind it. No GPU (or a
 * software one) means no field at all, as on their site.
 */

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const RGBA = /rgba?\(([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/;
const FALLBACK_INK = "#5b6cf0";
const IDLE_STEP = 1000 / 30;
const BUSY_STEP = 1000 / 60;

let probe: CanvasRenderingContext2D | null | undefined;
/** Any CSS colour as 0–1 RGB, by letting a 1px canvas parse it. */
function toRgb(color: string): [number, number, number] | null {
  probe ??= Object.assign(document.createElement("canvas"), { height: 1, width: 1 }).getContext("2d", {
    willReadFrequently: true,
  });
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

const MARKS = [" ", "·", ":", "+"];
const LETTERS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#-");
const SCRAMBLE = Array.from("#%&*=/<>?$@");
const GLYPHS = [...MARKS, ...LETTERS, ...SCRAMBLE];

const CELLS = `#version 300 es
precision highp float;
uniform vec2 uResolution,uCell;
uniform float uTime,uClock,uScale,uTrailOn,uReveal,uIntro,uWordLength;
uniform vec4 uClear;
uniform ivec4 uWord[16];
uniform sampler2D uTrail;
out vec4 outCell;
const float SCRAMBLE=${SCRAMBLE.length}.,SCRAMBLE_AT=${MARKS.length + LETTERS.length}.;
const float FEATHER=.14,FADE=0.16,STRENGTH=0.9;
const float BAYER[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
float trail(vec2 uv){
  ivec2 size=textureSize(uTrail,0),last=size-1;
  vec2 p=uv*vec2(size)-.5,f=fract(p);
  ivec2 i=ivec2(floor(p));
  float a=texelFetch(uTrail,clamp(i,ivec2(0),last),0).a,b=texelFetch(uTrail,clamp(i+ivec2(1,0),ivec2(0),last),0).a;
  float c=texelFetch(uTrail,clamp(i+ivec2(0,1),ivec2(0),last),0).a,d=texelFetch(uTrail,clamp(i+ivec2(1),ivec2(0),last),0).a;
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
void main(){
  vec2 cell=floor(gl_FragCoord.xy);
  vec2 uv=(cell+.5)*uCell/uResolution;
  float aspect=uResolution.x/uResolution.y;
  vec2 p=(uv-.5)*vec2(aspect,1.)*uScale;
  float t=uTime*.05;
  vec2 q=vec2(fbm(p*1.1+vec2(0.,t)),fbm(p*1.1+vec2(5.2,1.3-t)));
  float tone=smoothstep(.32,.68,fbm(p*1.4+q*1.5+vec2(t*.7,-t*.4)))*uReveal;
  float k=0.;
  if(uTrailOn>.5){
    k=clamp(trail(uv)*STRENGTH/.38,0.,1.);
    k=k*k*(3.-2.*k);
    tone+=(1.-tone)*k*.92;
  }
  float keep=smoothstep(0.,FADE,uv.y)*smoothstep(0.,FADE,1.-uv.y);
  if(uClear.z>0.){
    vec2 half_=uClear.zw*.5*vec2(aspect,1.),c=(uv-uClear.xy-uClear.zw*.5)*vec2(aspect,1.);
    keep*=smoothstep(0.,FEATHER,(length(c/max(half_,vec2(1e-4)))-1.)*min(half_.x,half_.y));
  }
  tone*=keep;
  k*=keep;
  ivec2 b=ivec2(mod(cell,4.));
  float level=tone*7.;
  float tier=level>=3.5?4.:clamp(floor(level+(BAYER[b.x+b.y*4]+.5)/16.),0.,3.);
  float row=cell.y,column=cell.x;
  int letter=int(mod(column+floor(hash(vec2(row,7.13))*uWordLength),uWordLength));
  float index=tier<4.?tier:float(uWord[letter/4][letter%4]);
  if(tier>=4.&&hash(cell+vec2(3.1,8.7))<max(k*.9-.2,uIntro)){
    index=SCRAMBLE_AT+floor(hash(cell+floor(uClock*10.)*vec2(.71,.37))*SCRAMBLE);
  }
  float strength=tier<4.?.32+tier*.07:.58+.32*tone;
  outCell=vec4(mix(strength,1.,k),0.,0.,index/255.);
}`;

const GLYPHS_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uAtlas,uCells;
uniform vec2 uResolution,uCell;
uniform vec3 uInk;
uniform float uOpacity;
out vec4 outColor;
void main(){
  vec2 frag=vec2(gl_FragCoord.x,uResolution.y-gl_FragCoord.y);
  vec2 cell=floor(frag/uCell);
  vec4 c=texelFetch(uCells,ivec2(cell),0);
  float index=floor(c.a*255.+.5);
  if(index<.5){outColor=vec4(0.);return;}
  ivec2 texel=ivec2(int(index)*int(uCell.x),0)+ivec2(frag-cell*uCell);
  float a=texelFetch(uAtlas,texel,0).a*c.r*uOpacity;
  outColor=vec4(uInk*a,a);
}`;

const SIM = `#version 300 es
precision highp float;
uniform sampler2D uState,uCurl,uPressure;
uniform vec2 uGrid;
uniform float uDt,uFirst;
out vec4 outColor;
ivec2 here(){return ivec2(gl_FragCoord.xy);}
bool edge(ivec2 c){return c.x<1||c.y<1||c.x>int(uGrid.x)-2||c.y>int(uGrid.y)-2;}
vec4 at(ivec2 c){return texelFetch(uState,c,0);}
float cu(ivec2 c){return texelFetch(uCurl,c,0).x;}
float pr(ivec2 c){return uFirst>.5?0.:texelFetch(uPressure,c,0).x;}
const ivec2 X=ivec2(1,0),Y=ivec2(0,1);
`;

const SPLAT = `${SIM}
uniform vec4 uFrom[8],uShape[8];
uniform int uCount;
void main(){
  ivec2 c=here();
  vec4 s=at(c);
  if(edge(c)){outColor=vec4(0.);return;}
  vec2 x=vec2(c);
  for(int k=0;k<8;k++){
    if(k>=uCount)break;
    vec2 a=uFrom[k].xy,ab=uFrom[k].zw;
    float l=length(ab),f=uShape[k].x,m=uShape[k].y,push=uShape[k].z,d=uShape[k].w;
    vec2 g=ab/l;
    float along=dot(x-a,g),sum=0.;
    vec2 dv=vec2(0.);
    float reach=(3.*f+1.)*1.415;
    float lo=max(0.,floor((along-reach)/l*d-.5)),hi=min(d-1.,ceil((along+reach)/l*d-.5));
    for(float n=lo;n<=hi;n++){
      vec2 o=a+ab*((n+.5)/d),e=x-o;
      if(any(lessThan(x,floor(o-3.*f)))||any(greaterThan(x,ceil(o+3.*f))))continue;
      float u=dot(e,g)/f,r=(e.y*g.x-e.x*g.y)/f,w=exp(-u*u*.65-r*r*1.7);
      float side=1.-r*r*.55,twist=u*r*.7;
      sum+=w;
      dv+=vec2(g.x*side-g.y*twist,g.y*side+g.x*twist)*w*push;
    }
    s.z=1.-(1.-s.z)*exp(-sum*m);
    s.xy=clamp(s.xy+dv,-80.,80.);
  }
  outColor=s;
}`;

const ADVECT = `${SIM}
void main(){
  ivec2 c=here();
  if(edge(c)){outColor=vec4(0.);return;}
  vec2 p=clamp(vec2(c)-at(c).xy*uDt,vec2(.5),uGrid-1.5);
  ivec2 i=ivec2(p);
  vec2 f=p-vec2(i);
  vec4 s=mix(mix(at(i),at(i+X),f.x),mix(at(i+Y),at(i+X+Y),f.x),f.y);
  outColor=vec4(s.xy*exp(-1.9*uDt),s.z*exp(-3.2*uDt),0.);
}`;

const CURL = `${SIM}
void main(){
  ivec2 c=here();
  outColor=vec4(edge(c)?0.:.5*(at(c+X).y-at(c-X).y-at(c+Y).x+at(c-Y).x),0.,0.,0.);
}`;

const CONFINE = `${SIM}
void main(){
  ivec2 c=here();
  if(edge(c)){outColor=vec4(0.);return;}
  vec4 s=at(c);
  vec2 o=vec2(abs(cu(c+X))-abs(cu(c-X)),abs(cu(c+Y))-abs(cu(c-Y)));
  float l=length(o)+1e-4,k=cu(c)*uDt*10.,speed=length(s.xy);
  vec2 v=s.xy+vec2(o.y,-o.x)/l*k;
  outColor=vec4(v*min(1.,speed/(length(v)+1e-6)),s.z,0.);
}`;

const PRESSURE = `${SIM}
void main(){
  ivec2 c=here();
  if(edge(c)){outColor=vec4(0.);return;}
  float div=-.5*(at(c+X).x-at(c-X).x+at(c+Y).y-at(c-Y).y);
  outColor=vec4(.25*(div+pr(c-X)+pr(c+X)+pr(c-Y)+pr(c+Y)),0.,0.,0.);
}`;

const PROJECT = `${SIM}
void main(){
  ivec2 c=here();
  if(edge(c)){outColor=vec4(0.);return;}
  vec4 s=at(c);
  vec2 v=clamp(s.xy-.5*vec2(pr(c+X)-pr(c-X),pr(c+Y)-pr(c-Y)),-80.,80.);
  outColor=vec4(v,s.z,1.-exp(-.06*length(v)-.16*s.z));
}`;

type Program = { program: WebGLProgram; uniform: (name: string) => WebGLUniformLocation | null };
type Target = { buffer: WebGLFramebuffer; texture: WebGLTexture };
type Segment = { ax: number; ay: number; bx: number; by: number; count: number; ink: number; push: number; width: number };

function isDark(host: HTMLElement) {
  const style = getComputedStyle(host);
  const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const bg = RGBA.exec(style.backgroundColor);
  if (bg) {
    const [, r = "0", g = "0", b = "0", alpha] = bg;
    const a = alpha ? Number.parseFloat(alpha) : 1;
    if ((alpha?.endsWith("%") ? a / 100 : a) >= 0.5) return luma(+r, +g, +b) < 128;
  }
  const text = toRgb(style.color);
  return text ? luma(255 * text[0], 255 * text[1], 255 * text[2]) > 140 : matchMedia("(prefers-color-scheme: dark)").matches;
}

function drawAtlas(width: number, height: number) {
  const canvas = Object.assign(document.createElement("canvas"), { height, width: width * GLYPHS.length });
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${Math.max(1, 0.74 * height)}px ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;
  const m = ctx.measureText("M");
  const ascent = m.actualBoundingBoxAscent || 0.74 * height * 0.7;
  const baseline = (height + ascent - (m.actualBoundingBoxDescent || 0)) / 2;
  GLYPHS.forEach((glyph, i) => {
    const x = i * width + width / 2;
    const w = ctx.measureText(glyph).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - width / 2, 0, width, height);
    ctx.clip();
    ctx.translate(x, baseline);
    if (w > 0.96 * width) ctx.scale((0.96 * width) / w, 1);
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
  });
  return canvas;
}

class Field {
  canvas = document.createElement("canvas");
  gl: WebGL2RenderingContext;
  lost = false;
  float: 16 | 32 | null;
  host: HTMLElement | null = null;
  text: HTMLElement | null = null;
  stop: (() => void) | null = null;
  programs!: Record<"advect" | "cells" | "confine" | "curl" | "glyphs" | "pressure" | "project" | "splat", Program>;
  atlas: WebGLTexture | null = null;
  atlasKey = "";
  cells: Target | null = null;
  state: Target[] = [];
  curl: Target | null = null;
  pressure: Target[] = [];
  grid = { height: 0, width: 0 };
  width = 0;
  height = 0;
  ratio = 1;
  cell = { height: 0, width: 0 };
  clear: [number, number, number, number] = [0, 0, 0, 0];
  ink: [number, number, number] = [0, 0, 0];
  dark = false;
  narrow = false;
  reduced = false;
  visible = false;
  strain = 0;
  slow = 0;
  slowCount = 0;
  time = 0;
  clock = 0;
  reveal: number;
  word = new Int32Array(64);
  wordLength = 0;
  wordText = "";
  swap = 1;
  tickAt = 0;
  simDt = 0;
  raf = 0;
  timer = 0;
  dirty = true;
  trailUntil = 0;
  trailOn = false;
  previous: { time: number; x: number; y: number } | null = null;
  segments: Segment[] = [];

  constructor(intro: boolean) {
    const gl = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      premultipliedAlpha: true,
      stencil: false,
    });
    if (!gl) throw new Error("No GPU for the hero field.");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (SOFTWARE_GPU.test(String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "")))
      throw new Error("No GPU for the hero field.");
    this.gl = gl;
    this.reveal = intro ? 0 : 1;
    this.float = gl.getExtension("EXT_color_buffer_float") ? 32 : gl.getExtension("EXT_color_buffer_half_float") ? 16 : null;
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1");
    this.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.lost = true;
      cancelAnimationFrame(this.raf);
      clearTimeout(this.timer);
      this.raf = 0;
      this.timer = 0;
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.lost = false;
      this.build();
      this.resize();
      this.request();
    });
    this.build();
  }

  build() {
    const { gl } = this;
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    if (!vertex) throw new Error("No vertex shader.");
    gl.shaderSource(
      vertex,
      "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}",
    );
    gl.compileShader(vertex);
    const make = (source: string, samplers: Record<string, number>): Program => {
      const shader = gl.createShader(gl.FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!(shader && program)) throw new Error("No program.");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, vertex);
      gl.attachShader(program, shader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unlinked program.");
      gl.deleteShader(shader);
      const found = new Map<string, WebGLUniformLocation | null>();
      const uniform = (name: string) => {
        if (!found.has(name)) found.set(name, gl.getUniformLocation(program, name));
        return found.get(name) ?? null;
      };
      gl.useProgram(program);
      for (const [name, unit] of Object.entries(samplers)) gl.uniform1i(uniform(name), unit);
      return { program, uniform };
    };
    const sim = { uCurl: 1, uPressure: 2, uState: 0 };
    this.programs = {
      advect: make(ADVECT, sim),
      cells: make(CELLS, { uTrail: 0 }),
      confine: make(CONFINE, sim),
      curl: make(CURL, sim),
      glyphs: make(GLYPHS_SHADER, { uAtlas: 3, uCells: 4 }),
      pressure: make(PRESSURE, sim),
      project: make(PROJECT, sim),
      splat: make(SPLAT, sim),
    };
    gl.deleteShader(vertex);
    this.atlas = null;
    this.atlasKey = "";
    this.cells = null;
    this.state = [];
    this.pressure = [];
    this.curl = null;
    this.grid = { height: 0, width: 0 };
    this.width = 0;
    this.height = 0;
  }

  target(width: number, height: number, kind: "r" | "rgba" | "rgba8", filter: number): Target {
    const { gl } = this;
    const full = this.float === 32;
    const formats = { r: full ? gl.R32F : gl.R16F, rgba: full ? gl.RGBA32F : gl.RGBA16F, rgba8: gl.RGBA8 };
    const texture = gl.createTexture();
    const buffer = gl.createFramebuffer();
    if (!(texture && buffer)) throw new Error("No target.");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, formats[kind], width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return { buffer, texture };
  }

  release(targets: (Target | null | undefined)[]) {
    for (const t of targets) {
      if (!t) continue;
      this.gl.deleteTexture(t.texture);
      this.gl.deleteFramebuffer(t.buffer);
    }
  }

  mount(host: HTMLElement, text: HTMLElement, word: string) {
    if (this.host) this.unmount(this.host);
    this.host = host;
    this.text = text;
    host.prepend(this.canvas);
    const wide = matchMedia("(min-width: 40rem)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = motion.matches;
    this.spell(word);
    const onResize = () => {
      this.resize();
      this.measure(wide.matches);
      this.request();
    };
    const onTheme = () => {
      this.theme();
      this.request();
    };
    const onMotion = () => {
      this.reduced = motion.matches;
      this.request();
    };
    const sizes = new ResizeObserver(onResize);
    sizes.observe(host);
    sizes.observe(text);
    const seen = new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
      if (this.visible) this.request();
    });
    seen.observe(host);
    const themes = new MutationObserver(onTheme);
    for (const el of [document.documentElement, document.body])
      themes.observe(el, { attributeFilter: ["class", "data-theme", "data-mode", "style", "data-sc-theme", "data-sc-base"], attributes: true });
    const onPoint = (event: PointerEvent) => this.point(event);
    const onLeave = () => {
      this.previous = null;
    };
    host.addEventListener("pointermove", onPoint, { passive: true });
    host.addEventListener("pointerdown", onPoint, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointercancel", onLeave);
    wide.addEventListener("change", onResize);
    motion.addEventListener("change", onMotion);
    addEventListener("resize", onResize);
    const box = host.getBoundingClientRect();
    this.visible = box.width > 0 && box.bottom > 0 && box.top < innerHeight && !this.lost;
    this.theme();
    this.resize();
    this.measure(wide.matches);
    this.dirty = true;
    if (this.visible) {
      const now = performance.now();
      this.tickAt = now - IDLE_STEP;
      this.frame(now);
    }
    this.stop = () => {
      sizes.disconnect();
      seen.disconnect();
      themes.disconnect();
      host.removeEventListener("pointermove", onPoint);
      host.removeEventListener("pointerdown", onPoint);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      wide.removeEventListener("change", onResize);
      motion.removeEventListener("change", onMotion);
      removeEventListener("resize", onResize);
    };
  }

  unmount(host: HTMLElement) {
    if (this.host !== host) return;
    this.stop?.();
    this.stop = null;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
    this.raf = 0;
    this.timer = 0;
    this.canvas.remove();
    this.host = null;
    this.text = null;
    this.visible = false;
    this.previous = null;
    this.segments = [];
  }

  spell(word: string) {
    if (word === this.wordText) return;
    const first = this.wordText === "";
    this.wordText = word;
    this.word.fill(0);
    const chars = Array.from(word).slice(0, 64);
    chars.forEach((ch, i) => {
      const at = LETTERS.indexOf(ch);
      this.word[i] = at < 0 ? 0 : MARKS.length + at;
    });
    this.wordLength = Math.max(1, chars.length);
    this.swap = first || this.reduced || this.reveal < 1 ? 1 : 0;
    this.dirty = true;
  }

  theme() {
    if (!this.host) return;
    const primary = getComputedStyle(this.host).getPropertyValue("--primary").trim();
    this.ink = toRgb(primary || FALLBACK_INK) ?? toRgb(FALLBACK_INK) ?? [0.36, 0.42, 0.94];
    this.dark = isDark(this.host);
    this.dirty = true;
  }

  resize() {
    const { gl, host } = this;
    if (!host || this.lost) return;
    this.narrow = innerWidth < 760;
    const w = host.clientWidth;
    const h = host.clientHeight;
    const ratio = Math.min(globalThis.devicePixelRatio || 1, this.strain >= 1 ? 1 : 2, Math.sqrt(8294400 / Math.max(1, w * h)));
    const width = Math.max(1, Math.round(w * ratio));
    const height = Math.max(1, Math.round(h * ratio));
    if (width === this.width && height === this.height && ratio === this.ratio) return;
    const reshaped = !this.width || Math.abs(width / height - this.width / this.height) > 0.01;
    this.width = width;
    this.height = height;
    this.ratio = ratio;
    this.canvas.width = width;
    this.canvas.height = height;
    const cellH = Math.max(2, Math.round(11 * ratio));
    const cellW = Math.max(2, Math.round(0.62 * cellH));
    this.cell = { height: cellH, width: cellW };
    const key = `${cellW}x${cellH}`;
    if (key !== this.atlasKey) {
      if (this.atlas) gl.deleteTexture(this.atlas);
      this.atlas = gl.createTexture();
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawAtlas(cellW, cellH));
      this.atlasKey = key;
    }
    this.release([this.cells]);
    this.cells = this.target(Math.ceil(width / cellW - 1e-4), Math.ceil(height / cellH - 1e-4), "rgba8", gl.NEAREST);
    if (this.float && reshaped) {
      const aspect = width / height;
      this.grid = {
        height: Math.round(aspect >= 1 ? 128 / aspect : 128),
        width: Math.round(aspect >= 1 ? 128 : 128 * aspect),
      };
      this.release([...this.state, this.curl, ...this.pressure]);
      const { height: gh, width: gw } = this.grid;
      this.state = [0, 1].map(() => this.target(gw, gh, "rgba", gl.NEAREST));
      this.curl = this.target(gw, gh, "r", gl.NEAREST);
      this.pressure = [0, 1].map(() => this.target(gw, gh, "r", gl.NEAREST));
      this.trailOn = false;
      this.trailUntil = 0;
      this.previous = null;
    }
    this.dirty = true;
  }

  measure(wide: boolean) {
    if (!(this.host && this.text)) return;
    const hostBox = this.host.getBoundingClientRect();
    const textBox = this.text.getBoundingClientRect();
    const pad = wide ? 0 : 40;
    this.clear =
      hostBox.width > 0 && hostBox.height > 0
        ? [
            (textBox.left - pad - hostBox.left) / hostBox.width,
            (textBox.top - pad - hostBox.top) / hostBox.height,
            (textBox.width + 2 * pad) / hostBox.width,
            (textBox.height + 2 * pad) / hostBox.height,
          ]
        : [0, 0, 0, 0];
    this.dirty = true;
  }

  point(event: PointerEvent) {
    if (!(this.float && this.visible && this.grid.width)) return;
    const box = this.canvas.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width;
    const py = (event.clientY - box.top) / box.height;
    if (px < -0.05 || px > 1.05 || py < -0.05 || py > 1.05) {
      this.previous = null;
      return;
    }
    const x = Math.max(0, Math.min(1, px));
    const y = Math.max(0, Math.min(1, py));
    const now = performance.now();
    const prev = this.previous;
    this.previous = { time: now, x, y };
    if (!prev) return;
    const { height: gh, width: gw } = this.grid;
    const dx = (x - prev.x) * (gw - 1);
    const dy = (y - prev.y) * (gh - 1);
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;
    const size = Math.min(gw, gh);
    const elapsed = now > prev.time ? Math.max(1 / 240, (now - prev.time) / 1000) : 1 / 60;
    const speed = 1 - Math.exp(-Math.min(12, dist / size / elapsed) / 2.2);
    const width = 0.0445 * size * (0.65 + 0.95 * speed);
    const count = Math.min(128, Math.max(1, Math.ceil(dist / (0.4 * width))));
    this.segments.push({
      ax: prev.x * (gw - 1),
      ay: prev.y * (gh - 1),
      bx: dx,
      by: dy,
      count,
      ink: ((dist / width) * (0.32 + 0.22 * speed)) / count,
      push: (dist * (2 + 18 * speed)) / count,
      width,
    });
    this.trailUntil = now + 6000;
    this.run();
  }

  request() {
    this.dirty = true;
    this.run();
  }

  run() {
    if (this.raf || !this.visible || this.lost || !this.host) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    } else this.tickAt = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pace(ms: number) {
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      this.raf = requestAnimationFrame(this.tick);
    }, ms - 6);
  }

  tick = (now: number) => {
    this.raf = 0;
    if (this.visible && this.host && !this.lost) this.frame(now);
  };

  frame(now: number) {
    const gap = (now - this.tickAt) / 1000;
    const dt = Math.min(0.05, Math.max(1 / 480, gap));
    this.tickAt = now;
    this.watchStrain(gap);
    const moving = !this.reduced && this.strain < 2;
    if (moving) this.time += dt;
    const trailing = this.trailUntil > now;
    const decoding = this.decode(dt);
    if (trailing) this.simDt += dt;
    if ((trailing || decoding) && !this.reduced) this.clock += dt;
    if (this.dirty || moving || trailing || this.trailOn || decoding) {
      this.draw(trailing);
      this.dirty = false;
    }
    if (trailing || this.trailOn || decoding) this.pace(BUSY_STEP);
    else if (moving) this.pace(IDLE_STEP);
  }

  watchStrain(gap: number) {
    this.slow = 0.9 * this.slow + 0.1 * Math.min(gap, 0.25);
    this.slowCount = this.slow > 1 / 24 ? this.slowCount + 1 : 0;
    if (this.slowCount > 45 && this.strain < 2) {
      this.slowCount = 0;
      this.strain = this.strain === 0 && this.ratio > 1 ? 1 : 2;
      this.resize();
    }
  }

  decode(dt: number) {
    const revealing = this.reveal < 1;
    const swapping = this.swap < 1;
    if (revealing) this.reveal = Math.min(1, this.reveal + (1000 * dt) / (this.reduced ? 500 : 1400));
    if (swapping) this.swap = this.reduced ? 1 : Math.min(1, this.swap + (1000 * dt) / 900);
    return revealing || swapping;
  }

  draw(trailing: boolean) {
    const { gl } = this;
    if (!(this.cells && this.atlas)) return;
    if (trailing) {
      this.simulate();
      this.trailOn = true;
    } else if (this.trailOn) this.settle();
    const cols = Math.ceil(this.width / this.cell.width - 1e-4);
    const rows = Math.ceil(this.height / this.cell.height - 1e-4);
    const { cells, glyphs } = this.programs;
    const left = 1 - this.reveal;
    const shown = 1 - left ** 3;
    const intro = Math.max(left * left, (1 - this.swap) ** 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cells.buffer);
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(cells.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.state[0]?.texture ?? null);
    gl.uniform2f(cells.uniform("uResolution"), this.width, this.height);
    gl.uniform2f(cells.uniform("uCell"), this.cell.width, this.cell.height);
    gl.uniform1f(cells.uniform("uTime"), this.time);
    gl.uniform1f(cells.uniform("uClock"), this.clock);
    gl.uniform1f(cells.uniform("uScale"), this.narrow ? 1.6 : 1);
    gl.uniform1f(cells.uniform("uTrailOn"), this.trailOn ? 1 : 0);
    gl.uniform1f(cells.uniform("uReveal"), this.reduced ? 1 : shown);
    gl.uniform1f(cells.uniform("uIntro"), this.reduced ? 0 : intro);
    gl.uniform4iv(cells.uniform("uWord"), this.word);
    gl.uniform1f(cells.uniform("uWordLength"), this.wordLength);
    gl.uniform4f(cells.uniform("uClear"), ...this.clear);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(glyphs.program);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.cells.texture);
    gl.uniform2f(glyphs.uniform("uResolution"), this.width, this.height);
    gl.uniform2f(glyphs.uniform("uCell"), this.cell.width, this.cell.height);
    gl.uniform3f(glyphs.uniform("uInk"), ...this.ink);
    gl.uniform1f(glyphs.uniform("uOpacity"), (this.dark ? 0.92 : 0.9) * (this.reduced ? shown : 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  settle() {
    const { gl } = this;
    gl.clearColor(0, 0, 0, 0);
    for (const t of this.state) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.buffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this.trailOn = false;
  }

  pass(program: Program, into: Target | undefined | null, set: () => void) {
    const { gl } = this;
    if (!into) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, into.buffer);
    gl.useProgram(program.program);
    gl.uniform2f(program.uniform("uGrid"), this.grid.width, this.grid.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.state[0]?.texture ?? null);
    set();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  flip() {
    this.state.reverse();
  }

  simulate() {
    const { gl, programs: p } = this;
    if (!(this.state[1] && this.curl)) return;
    gl.viewport(0, 0, this.grid.width, this.grid.height);
    while (this.segments.length) {
      const batch = this.segments.splice(0, 8);
      const from = new Float32Array(32);
      const shape = new Float32Array(32);
      batch.forEach((s, i) => {
        from.set([s.ax, s.ay, s.bx, s.by], 4 * i);
        shape.set([s.width, s.ink, s.push, s.count], 4 * i);
      });
      this.pass(p.splat, this.state[1], () => {
        gl.uniform4fv(p.splat.uniform("uFrom"), from);
        gl.uniform4fv(p.splat.uniform("uShape"), shape);
        gl.uniform1i(p.splat.uniform("uCount"), batch.length);
      });
      this.flip();
    }
    let remaining = Math.min(0.05, this.simDt);
    this.simDt = 0;
    while (remaining > 1e-7) {
      const dt = Math.min(1 / 60, remaining);
      remaining -= dt;
      const step = (program: Program, into: Target | null | undefined, extra?: () => void) =>
        this.pass(program, into, () => {
          gl.uniform1f(program.uniform("uDt"), dt);
          extra?.();
        });
      step(p.advect, this.state[1]);
      this.flip();
      step(p.curl, this.curl, () => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);
      });
      step(p.confine, this.state[1], () => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.curl?.texture ?? null);
      });
      this.flip();
      for (let i = 0; i < 4; i += 1) {
        const [read, write] = this.pressure;
        step(p.pressure, write, () => {
          gl.uniform1f(p.pressure.uniform("uFirst"), i === 0 ? 1 : 0);
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, read?.texture ?? null);
        });
        this.pressure.reverse();
      }
      step(p.project, this.state[1], () => {
        gl.uniform1f(p.project.uniform("uFirst"), 0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.pressure[0]?.texture ?? null);
      });
      this.flip();
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

const fields: Record<"band" | "hero", Field | null> = { band: null, hero: null };
const shown: Record<"band" | "hero", boolean> = { band: false, hero: false };
let unsupported = false;

function mount(kind: "band" | "hero", host: HTMLElement, text: HTMLElement, word: string) {
  if (unsupported) return () => undefined;
  let field = fields[kind];
  if (!field || field.lost) {
    try {
      field = new Field(!shown[kind]);
    } catch {
      unsupported = true;
      return () => undefined;
    }
    fields[kind] = field;
  }
  shown[kind] = true;
  field.mount(host, text, word);
  const mounted = field;
  return () => mounted.unmount(host);
}

/** The hero's field: `host` is the hero box, `text` the block the letters keep clear of. */
export const mountHeroField = (host: HTMLElement, text: HTMLElement, word: string) => mount("hero", host, text, word);
/** The same field behind the closing call to action. */
export const mountBandField = (host: HTMLElement, text: HTMLElement, word: string) => mount("band", host, text, word);
