/* WebGL aurora background: domain-warped fbm curtains, green -> pink,
   sparse twinkling stars. Composited with CSS mix-blend-mode: screen.
   - one shared rAF loop, capped at 30 fps, DPR <= 1.5
   - instances pause when offscreen (IntersectionObserver) or tab hidden
   - prefers-reduced-motion: a single static frame, no loop
   - no WebGL / context loss: CSS gradient fallback on the canvas itself */
(function () {
  "use strict";

  var canvases = Array.prototype.slice.call(document.querySelectorAll(".aurora-canvas"));
  if (!canvases.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FRAME_MS = 1000 / 30;
  var DPR_CAP = 1.5;

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res;",
    "uniform float u_time;",
    "uniform float u_intensity;",
    "uniform float u_top;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}",
    "float noise(vec2 p){",
    " vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);",
    " return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);",
    "}",
    "float fbm(vec2 p){",
    " float v=0.0,a=0.5;",
    " for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+vec2(19.7,7.3);a*=0.5;}",
    " return v;",
    "}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/u_res;",
    " float t=u_time*0.35;",
    " vec2 q=vec2(uv.x*2.8+t*0.09,t*0.14);",
    " float w=fbm(q);",
    " float n=fbm(q+vec2(w*1.5,w*0.7));",
    " float band=pow(smoothstep(0.18,0.88,n),1.6)*1.5;",
    " float rays=0.55+0.45*fbm(vec2(uv.x*8.0+w*5.0,t*0.25));",
    " band*=rays;",
    " float edge=0.40+0.28*(fbm(vec2(uv.x*3.4+t*0.06,7.7))-0.5)*2.0;",
    " float vert=smoothstep(edge+0.42,edge,uv.y)*smoothstep(1.02,0.60,uv.y);",
    " if(u_top<0.5){vert=smoothstep(0.80,0.34,uv.y)*smoothstep(0.02,0.28,uv.y);}",
    " float a=band*vert;",
    " float hue=clamp(smoothstep(0.2,0.8,fbm(vec2(uv.x*1.6-t*0.05,3.3)))*0.75+uv.y*0.25,0.0,1.0);",
    " vec3 col=mix(vec3(0.16,0.85,0.55),vec3(0.95,0.40,0.80),hue);",
    " col=mix(col,vec3(0.38,0.65,0.95),smoothstep(0.62,1.0,n)*0.22);",
    " float star=0.0;",
    " if(u_top>0.5){",
    "  vec2 sp=gl_FragCoord.xy/vec2(3.0);",
    "  star=step(0.9990,hash(floor(sp)))*(1.0-a)*smoothstep(0.45,0.62,uv.y);",
    "  star*=0.22+0.26*sin(u_time*1.2+hash(floor(sp))*6.2831);",
    " }",
    " vec3 outC=col*a*u_intensity+vec3(star*0.9);",
    " gl_FragColor=vec4(outC,1.0);",
    "}"
  ].join("\n");

  function makeInstance(canvas) {
    var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return null;
    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
      }
      return s;
    }
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("program link failed");
    } catch (e) {
      return null;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      canvas.classList.add("aurora-fallback");
    });
    return {
      canvas: canvas, gl: gl,
      uRes: gl.getUniformLocation(prog, "u_res"),
      uTime: gl.getUniformLocation(prog, "u_time"),
      uInt: gl.getUniformLocation(prog, "u_intensity"),
      uTop: gl.getUniformLocation(prog, "u_top"),
      intensity: parseFloat(canvas.getAttribute("data-intensity") || "0.6"),
      topMode: canvas.getAttribute("data-mode") === "curtain" ? 1 : 0,
      visible: true, w: 0, h: 0
    };
  }

  var instances = [];
  canvases.forEach(function (c) {
    var inst = null;
    try { inst = makeInstance(c); } catch (e) { inst = null; }
    if (inst) instances.push(inst); else c.classList.add("aurora-fallback");
  });
  if (!instances.length) return;

  function resize() {
    instances.forEach(function (inst) {
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      var w = Math.round(inst.canvas.clientWidth * dpr);
      var h = Math.round(inst.canvas.clientHeight * dpr);
      if (w && h && (inst.canvas.width !== w || inst.canvas.height !== h)) {
        inst.canvas.width = w;
        inst.canvas.height = h;
        inst.gl.viewport(0, 0, w, h);
      }
      inst.w = w;
      inst.h = h;
    });
  }
  resize();
  window.addEventListener("resize", resize);

  function draw(inst, t) {
    if (!inst.w || !inst.h) return;
    inst.gl.uniform2f(inst.uRes, inst.w, inst.h);
    inst.gl.uniform1f(inst.uTime, t);
    inst.gl.uniform1f(inst.uInt, inst.intensity);
    inst.gl.uniform1f(inst.uTop, inst.topMode);
    inst.gl.drawArrays(inst.gl.TRIANGLES, 0, 3);
  }

  if (reducedMotion) {
    instances.forEach(function (inst) { draw(inst, 12.3); });
    return;
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        instances.forEach(function (inst) {
          if (inst.canvas === en.target) inst.visible = en.isIntersecting;
        });
      });
    }, { rootMargin: "80px" });
    instances.forEach(function (inst) { io.observe(inst.canvas); });
  }

  var paused = false;
  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
  });

  var last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (paused || document.hidden) return;
    if (ts - last < FRAME_MS) return;
    last = ts;
    var t = ts / 1000;
    instances.forEach(function (inst) {
      if (inst.visible) draw(inst, t);
    });
  }
  requestAnimationFrame(frame);
})();
