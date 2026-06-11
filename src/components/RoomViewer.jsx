/* eslint-disable react-hooks/immutability */
import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec2 vScreenUv;

void main() {
  vUv = uv;
  vec4 projected = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  
  // Tọa độ Màn Hình Tuyệt Đối (Screen-Space UV) cho mặt nạ xé giấy
  vScreenUv = (projected.xy / projected.w) * 0.5 + 0.5;
  
  gl_Position = projected;
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec2 vScreenUv;
uniform sampler2D uDiffuse;
uniform sampler2D uDrawMap;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uTime;
uniform vec2 uMouseOffset;
uniform float uEntryProgress;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  
  // CHỐNG MÉO VÀ LẤP ĐẦY KHUNG (Object-Fit Cover Nguyên Bản)
  // Đưa ảnh về trạng thái bình thường nhất, vừa vặn với mọi màn hình mà không bị méo.
  float screenAspect = uResolution.x / uResolution.y;
  float imageAspect = uImageResolution.x / uImageResolution.y;
  vec2 scale = vec2(1.0);
  if (screenAspect > imageAspect) {
      scale.y = imageAspect / screenAspect;
  } else {
      scale.x = screenAspect / imageAspect;
  }
  
  // Trạng thái bình thường: không zoom nhỏ, không đẩy lệch tâm, không viền mờ.
  vec2 frameUv = (uv - 0.5) * scale + 0.5;

  // PARALLAX QUANG HỌC (Tương tác chuột)
  float dist = distance(frameUv, vec2(0.5));
  float depthMultiplier = smoothstep(0.0, 0.8, dist);
  vec2 parallaxOffset = uMouseOffset * depthMultiplier * 0.025;
  vec2 shiftedTexUv = frameUv + parallaxOffset;
  
  // Lấy màu gốc từ ảnh của bạn
  vec4 original = texture2D(uDiffuse, shiftedTexUv);

  // Áp dụng lớp vẽ chì + sơn dầu
  vec2 texel = 1.0 / uResolution;
  float c11 = length(texture2D(uDiffuse, shiftedTexUv).rgb);
  float c01 = length(texture2D(uDiffuse, shiftedTexUv + vec2(-texel.x, 0.0)).rgb);
  float c21 = length(texture2D(uDiffuse, shiftedTexUv + vec2(texel.x, 0.0)).rgb);
  float c10 = length(texture2D(uDiffuse, shiftedTexUv + vec2(0.0, -texel.y)).rgb);
  float c12 = length(texture2D(uDiffuse, shiftedTexUv + vec2(0.0, texel.y)).rgb);
  float edge = abs(c01 - c21) + abs(c10 - c12);
  float sketchLine = 1.0 - smoothstep(0.05, 0.3, edge * 1.5);
  float paperGrain = snoise(shiftedTexUv * 300.0) * 0.1;
  vec3 sketchColor = vec3(sketchLine - paperGrain); 

  float threadGrainX = sin(shiftedTexUv.x * 1500.0) * 0.5 + 0.5;
  float threadGrainY = sin(shiftedTexUv.y * 1500.0) * 0.5 + 0.5;
  float bump = mix(threadGrainX, threadGrainY, 0.5) * 0.15;
  vec3 paintColor = original.rgb * (1.0 + bump); 

  // Ánh sáng chuột
  vec2 normalizedMouse = uMouseOffset * 0.5 + 0.5;
  float lightDistance = distance(shiftedTexUv, normalizedMouse);
  float lightIntensity = smoothstep(0.6, 0.0, lightDistance) * 0.25;
  paintColor += vec3(1.0, 0.9, 0.7) * lightIntensity * original.r;

  // Lớp mặt nạ vết xé (khi cạo)
  float grunge = snoise(vScreenUv * 15.0 + uTime * 0.05);
  float fineGrunge = snoise(vScreenUv * 50.0);
  vec2 offsetUv = vScreenUv + (grunge * 0.7 + fineGrunge * 0.3) * 0.05; 
  float drawMask = smoothstep(0.4, 0.45, texture2D(uDrawMap, offsetUv).r);

  // Kết quả bình thường, sạch sẽ (kết hợp nháp vẽ và ảnh màu dựa trên tiến trình cào và hiệu ứng vào cửa)
  float finalMask = clamp(drawMask + uEntryProgress, 0.0, 1.0);
  vec3 finalColor = mix(sketchColor, paintColor, finalMask);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const Scene = ({ imageSrc, drawCanvasRef, onDraw, mousePos, isEntering }) => {
  const diffuseTex = useTexture(imageSrc);
  const { viewport, size } = useThree();
  const [drawTex, setDrawTex] = useState(null);
  const meshRef = useRef();

  useEffect(() => {
    if (diffuseTex) {
      diffuseTex.wrapS = THREE.ClampToEdgeWrapping;
      diffuseTex.wrapT = THREE.ClampToEdgeWrapping;
      diffuseTex.needsUpdate = true;
    }
  }, [diffuseTex]);

  useEffect(() => {
    if (drawCanvasRef.current) {
      const tex = new THREE.CanvasTexture(drawCanvasRef.current);
      tex.minFilter = THREE.LinearFilter;
      setDrawTex(tex);
    }
  }, [drawCanvasRef]);

  const uniforms = useMemo(() => ({
    uDiffuse: { value: diffuseTex },
    uDrawMap: { value: drawTex },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uImageResolution: { value: new THREE.Vector2(1024, 1024) }, 
    uTime: { value: 0 },
    uMouseOffset: { value: new THREE.Vector2(0, 0) },
    uEntryProgress: { value: 0 }
  }), [diffuseTex, drawTex, size]);

  useEffect(() => {
    if (diffuseTex && diffuseTex.image) {
      uniforms.uImageResolution.value.set(diffuseTex.image.width, diffuseTex.image.height);
    }
  }, [diffuseTex, uniforms]);

  useFrame((state, delta) => {
    // eslint-disable-next-line react-hooks/immutability
    if (uniforms.uDrawMap.value) uniforms.uDrawMap.value.needsUpdate = true;
    // eslint-disable-next-line react-hooks/immutability
    uniforms.uTime.value = state.clock.elapsedTime;

    // Hiệu ứng tan biến tranh vẽ chì khi bắt đầu bay vào trong
    if (isEntering) {
      uniforms.uEntryProgress.value = THREE.MathUtils.damp(uniforms.uEntryProgress.value, 1.0, 3.5, delta);
    } else {
      uniforms.uEntryProgress.value = THREE.MathUtils.damp(uniforms.uEntryProgress.value, 0.0, 3.5, delta);
    }
    
    if (!isEntering) {
      uniforms.uMouseOffset.value.x = THREE.MathUtils.damp(uniforms.uMouseOffset.value.x, mousePos.current.x, 4, delta);
      uniforms.uMouseOffset.value.y = THREE.MathUtils.damp(uniforms.uMouseOffset.value.y, mousePos.current.y, 4, delta);
    }

    if (meshRef.current) {
      if (isEntering) {
        // Precise UV center of the door from handleDraw coordinates
        const doorUvX = 0.49;  // (0.43 + 0.55) / 2
        const doorUvY = 0.255; // (0.10 + 0.41) / 2
        
        const planeWidth = viewport.width * 1.08;
        const planeHeight = viewport.height * 1.08;
        const doorX = (doorUvX - 0.5) * planeWidth;
        const doorY = (doorUvY - 0.5) * planeHeight;

        const targetScale = 6;
        // Counter-translate the mesh so the door center ends up at screen center (0,0)
        const targetPosX = -doorX * targetScale;
        const targetPosY = -doorY * targetScale;
        
        meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, targetPosX, 2, delta);
        meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetPosY, 2, delta);
        
        // Exponential scale up
        meshRef.current.scale.x = THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 2, delta);
        meshRef.current.scale.y = THREE.MathUtils.damp(meshRef.current.scale.y, targetScale, 2, delta);
        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, 0, 4, delta);
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, 0, 4, delta);
      } else {
        const targetPosX = mousePos.current.x * (viewport.width * 0.02);
        const targetPosY = mousePos.current.y * (viewport.height * 0.02);
        
        const targetRotX = mousePos.current.y * 0.04; 
        const targetRotY = mousePos.current.x * 0.04;

        meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, targetPosX, 4, delta);
        meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetPosY, 4, delta);
        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotX, 4, delta);
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotY, 4, delta);
      }
    }
  });

  if (!drawTex) return null;

  return (
    <mesh
      ref={meshRef}
      onPointerDown={(e) => { e.stopPropagation(); onDraw(e.uv, 'down'); }}
      onPointerMove={(e) => { e.stopPropagation(); onDraw(e.uv, 'move'); }}
      onPointerUp={(e) => { e.stopPropagation(); onDraw(e.uv, 'up'); }}
      onPointerOut={(e) => { e.stopPropagation(); onDraw(e.uv, 'up'); }}
    >
      <planeGeometry args={[viewport.width * 1.08, viewport.height * 1.08]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
};

const RoomViewer = ({ imageSrc, onDoorClick }) => {
  const drawCanvasRef  = useRef(null);
  const paintCanvasRef = useRef(null);   // visible paint overlay
  const containerRef   = useRef(null);
  const lastPos        = useRef(null);
  const isDrawingRef   = useRef(false);
  const mousePos       = useRef({ x: 0, y: 0 });
  const isPainting     = useRef(false);
  const lastPaintPos   = useRef(null);
  const paintHue       = useRef(0); // initialize properly without Math.random during render
  const particles      = useRef([]);          // live paint drops
  const rafRef         = useRef(null);        // animation frame id
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [isEntering, setIsEntering]     = useState(false);


  // Fix: when component mounts after scene transition, R3F may have captured
  // wrong viewport size due to AnimatePresence scale animation.
  // Dispatch resize after animation settles (~900ms) to force R3F to recalculate.
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Block R3F from overriding our custom cursor on the canvas element
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'style') {
          const el = m.target;
          if (el.style.cursor && el.style.cursor !== 'inherit') {
            el.style.cursor = 'inherit';
          }
        }
      });
    });
    // Observe all canvas children inside container
    observer.observe(container, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleResize = () => {
      const oldData = ctx.getImageData(0,0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.putImageData(oldData, 0, 0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Paint particle canvas + animation loop ───────────────────────────────────
  useEffect(() => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // ── Particle render loop ──────────────────────────────────────────────────
    const tick = () => {
      const ctx = canvas.getContext('2d');
      // Clear entire canvas every frame → no permanent marks
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const list = particles.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];

        // Physics
        p.vy  += 0.45;          // gravity
        p.vx  *= 0.97;          // air friction
        p.vy  *= 0.97;
        p.x   += p.vx;
        p.y   += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) { list.splice(i, 1); continue; }

        // Draw elongated teardrop in velocity direction
        const spd   = Math.hypot(p.vx, p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        const len   = p.r * (1 + spd * 0.4);  // stretch by speed

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.scale(len / p.r, 1);

        // Outer glow
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h}, 90%, 65%, ${p.life * 0.25})`;
        ctx.fill();

        // Core drop
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h}, 95%, 58%, ${p.life * 0.9})`;
        ctx.fill();

        // Bright specular
        ctx.beginPath();
        ctx.arc(-p.r * 0.3, -p.r * 0.3, p.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h}, 80%, 90%, ${p.life * 0.5})`;
        ctx.fill();

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const checkDoorCoverage = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Door in image UV: x 0.43–0.55, y 0.28–0.45 (from bottom)
    // In canvas coords (y flipped): x same, y = (1 - uv_y) * height
    // Cover shader maps image UV y to plane UV y:
    //   plane_uv_y = (img_uv_y - 0.5) / 0.5625 + 0.5
    // Door plane UV y: 0.109 to 0.411
    // In canvas: y1 = (1 - 0.411) * h, y2 = (1 - 0.109) * h
    const x1 = Math.floor(0.43 * canvas.width);
    const x2 = Math.floor(0.55 * canvas.width);
    const y1 = Math.floor((1 - 0.411) * canvas.height);
    const y2 = Math.floor((1 - 0.109) * canvas.height);
    const data = ctx.getImageData(x1, y1, x2 - x1, y2 - y1);
    let paintedPx = 0;
    for (let i = 0; i < data.data.length; i += 4) {
      if (data.data[i] > 128) paintedPx++;
    }
    const coverage = paintedPx / ((x2 - x1) * (y2 - y1));
    if (coverage >= 0.30) setDoorUnlocked(true);
  };

  // Cleanup body class on unmount
  useEffect(() => {
    return () => document.body.classList.remove('door-hover');
  }, []);

  const handleDraw = (uv, action) => {
    if (!uv) {
      document.body.classList.remove('door-hover');
      return;
    }

    // Door plane UV: x 0.43–0.55, y 0.10–0.41 (after cover shader math for 1:1 image on 16:9)
    const isOverDoor = uv.x > 0.43 && uv.x < 0.55 && uv.y > 0.10 && uv.y < 0.41;

    if (isOverDoor && doorUnlocked) {
      document.body.classList.add('door-hover');
    } else {
      document.body.classList.remove('door-hover');
    }

    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const x = uv.x * canvas.width;
    const y = (1.0 - uv.y) * canvas.height;

    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 150;
    ctx.shadowBlur = 40; 
    ctx.shadowColor = 'white';

    if (action === 'down') {
      // Only enter store if door is unlocked by painting
      if (isOverDoor && doorUnlocked && onDoorClick) {
        if (!isEntering) {
          setIsEntering(true);
          // Vibrate / haptic feedback if supported
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => {
            onDoorClick();
          }, 1400); // 1.4s zoom + flash duration
        }
        return;
      }
      // Otherwise paint
      isDrawingRef.current = true;
      lastPos.current = { x, y };
      ctx.beginPath();
      ctx.arc(x, y, 75, 0, Math.PI * 2);
      ctx.fill();
      checkDoorCoverage();
    } else if (action === 'up') {
      isDrawingRef.current = false;
      lastPos.current = null;
    } else if (action === 'move') {
      if (!isDrawingRef.current) return;
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastPos.current = { x, y };
      checkDoorCoverage();
    }
  };

  // ── Paint particle emitters ──────────────────────────────────────────────────
  const spawnDrop = (x, y, vx, vy, big = false) => {
    paintHue.current = (paintHue.current + 2.5) % 360;
    const spread = big ? 0.9 : 0.5;
    const count  = big ? 1 : 1;
    for (let i = 0; i < count; i++) {
      const a   = Math.atan2(vy, vx) + (Math.random() - 0.5) * spread * Math.PI;
      const spd = Math.hypot(vx, vy) * (0.6 + Math.random() * 0.8) + (big ? 6 : 2);
      particles.current.push({
        x, y,
        vx:   Math.cos(a) * spd,
        vy:   Math.sin(a) * spd - (big ? 4 : 1),  // slight upward burst
        h:    (paintHue.current + Math.random() * 50 - 25 + 360) % 360,
        r:    big ? Math.random() * 8 + 5 : Math.random() * 5 + 2,
        life: 1.0,
        decay: big ? 0.022 + Math.random() * 0.015
                   : 0.032 + Math.random() * 0.020,
      });
    }
  };

  // Big burst on click (radial splatter)
  const spawnSplatter = (x, y) => {
    const N = 40;
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i / N) + Math.random() * 0.4;
      const spd   = Math.random() * 14 + 3;
      paintHue.current = (paintHue.current + 9) % 360;
      particles.current.push({
        x, y,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd - 3,
        h:    (paintHue.current + Math.random() * 60 - 30 + 360) % 360,
        r:    Math.random() * 7 + 3,
        life: 1.0,
        decay: 0.018 + Math.random() * 0.018,
      });
    }
  };

  const handleContainerPointerDown = (e) => {
    isPainting.current   = true;
    lastPaintPos.current = { x: e.clientX, y: e.clientY };
    spawnSplatter(e.clientX, e.clientY);
  };

  const handleContainerPointerUp = () => {
    isPainting.current   = false;
    lastPaintPos.current = null;
  };

  const handleContainerPointerMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mousePos.current.x = (e.clientX / innerWidth)  *  2 - 1;
    mousePos.current.y = -(e.clientY / innerHeight) *  2 + 1;

    if (isPainting.current) {
      const prev = lastPaintPos.current;
      if (prev) {
        const dx   = e.clientX - prev.x;
        const dy   = e.clientY - prev.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2) return; // ignore micro-movements

        // Normalize direction → fixed speed regardless of how fast mouse moves
        const nx  = dx / dist;
        const ny  = dy / dist;
        const spd = 6; // constant ejection speed

        // Max 5 drops per event, min 1 — ignore raw pixel distance
        const MAX_TOTAL = 120;
        const count = Math.min(5, Math.max(1, Math.floor(dist / 12)));

        if (particles.current.length < MAX_TOTAL) {
          for (let i = 0; i < count; i++) {
            const t = i / count;
            spawnDrop(
              prev.x + dx * t,
              prev.y + dy * t,
              nx * spd + (Math.random() - 0.5) * 3,
              ny * spd + (Math.random() - 0.5) * 3,
            );
          }
        }
      }
      lastPaintPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#040404',
        cursor: "url('/paintbrush_cursor.png') 120 8, auto",
        touchAction: 'none'
      }}
      onPointerMove={handleContainerPointerMove}
      onPointerDown={handleContainerPointerDown}
      onPointerUp={handleContainerPointerUp}
      onPointerLeave={handleContainerPointerUp}
    >
      <canvas
        ref={drawCanvasRef}
        style={{ display: 'none' }}
      />
      <Canvas
        onCreated={() => {
          // Force R3F to recalculate viewport right after renderer is ready
          window.dispatchEvent(new Event('resize'));
        }}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}>
        <Suspense fallback={null}>
          <Scene 
            imageSrc={imageSrc} 
            drawCanvasRef={drawCanvasRef} 
            onDraw={handleDraw}
            mousePos={mousePos}
            isEntering={isEntering}
          />
        </Suspense>
      </Canvas>

      {/* Visible colorful paint overlay */}
      <canvas
        ref={paintCanvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
          mixBlendMode: 'screen',
        }}
      />

      {/* Blinding white flash overlay for entering the door */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: '#fff',
        pointerEvents: 'none',
        zIndex: 50,
        opacity: isEntering ? 1 : 0,
        transition: 'opacity 1.3s cubic-bezier(0.5, 0, 1, 1)'
      }} />

    </div>
  );
};

export default RoomViewer;
