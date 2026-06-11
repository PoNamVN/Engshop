import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence } from 'framer-motion';
import ProductPopup from './ProductPopup';

const BRITISH_JACKET = {
  id: 'british_jacket',
  title: 'THE BRITISH TWEED JACKET',
  imageSrc: '/image/product_jacket_clean.png',
  colors: 'Olive Brown Tweed',
  sizes: '38R, 40R, 42R, 44R (International Sizes)',
  material: '100% Virgin Wool Tweed (Made in UK)',
  price: '$450 USD'
};

const BRITISH_HAT = {
  id: 'british_hat',
  title: 'THE CLASSIC TWEED FLAT CAP',
  imageSrc: '/image/product_hat_clean.png',
  colors: 'Brown Herringbone Tweed',
  sizes: 'S, M, L, XL',
  material: '100% British Wool Tweed',
  price: '$85 USD'
};

const BRITISH_SHOES = {
  id: 'british_shoes',
  title: 'THE VINTAGE LEATHER BROGUES',
  imageSrc: '/image/product_shoes_clean.png',
  colors: 'Tan / Chestnut Brown',
  sizes: 'US 8, 9, 10, 11 (EU 41 - 45)',
  material: 'Full-Grain Calfskin Leather',
  price: '$210 USD'
};

const Hotspot = ({ position, label, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef();
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
    ringRef.current.scale.set(scale, scale, 1);
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.classList.add('door-hover');
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.classList.remove('door-hover');
  };

  return (
    <group position={position}>
      <mesh 
        visible={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <planeGeometry args={[1.5, 1.5]} />
      </mesh>

      <mesh>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[0.25, 0.45, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {hovered && (
        <Html distanceFactor={15} position={[0, 0.8, 0]} center>
          <div style={{
            background: 'rgba(27, 23, 19, 0.95)',
            border: '1px solid rgba(214, 198, 167, 0.5)',
            color: '#d6c6a7',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: "'Playfair Display', serif",
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transform: 'translateY(-10px)',
            transition: 'all 0.2s ease',
            letterSpacing: '1px'
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
};

const Scene = ({ 
  imageSrc, 
  onProductClick, 
  jacketCartesian, 
  hatCartesian, 
  shoesCartesian, 
  exitCartesian,
  isExiting, 
  showEditor,
  activeItem,
  onExitClick 
}) => {
  const diffuseTex = useTexture(imageSrc);
  const [exitHovered, setExitHovered] = useState(false);

  // Animate camera zoom into the exit portal painting when exiting
  useFrame((state, delta) => {
    if (isExiting) {
      // Target position slightly in front of the exit portal coordinates
      const targetCamPos = new THREE.Vector3(
        exitCartesian[0] * 0.9,
        exitCartesian[1],
        exitCartesian[2] * 0.9
      );
      state.camera.position.lerp(targetCamPos, 0.08);
      
      // Look directly at the center of the exit portal
      const targetLookAt = new THREE.Vector3(...exitCartesian);
      const currentLookAt = new THREE.Vector3(0, 0, 0);
      state.camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(state.camera.position);
      currentLookAt.lerp(targetLookAt, 0.08);
      state.camera.lookAt(currentLookAt);

      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, 12, 0.08);
      state.camera.updateProjectionMatrix();
    }
  });

  const handleExitOver = (e) => {
    e.stopPropagation();
    if (isExiting) return;
    setExitHovered(true);
    document.body.classList.add('door-hover');
  };

  const handleExitOut = (e) => {
    e.stopPropagation();
    setExitHovered(false);
    document.body.classList.remove('door-hover');
  };

  // Compute rotation to face the center
  const angleToCenter = Math.atan2(exitCartesian[0], exitCartesian[2]);

  return (
    <group>
      {/* Background Cylinder */}
      <mesh position={[0, 5, 0]} scale={[-1, 1, 1]}>
        <cylinderGeometry args={[20, 20, 40, 64, 1, true, 0.94, 4.4]} />
        <meshBasicMaterial map={diffuseTex} side={THREE.DoubleSide} />
      </mesh>

      {/* Render Hotspots (hidden during transition) */}
      {!isExiting && (
        <group>
          <Hotspot 
            position={jacketCartesian} 
            label="British Tweed Jacket" 
            onClick={() => onProductClick(BRITISH_JACKET)} 
          />
          <Hotspot 
            position={hatCartesian} 
            label="Classic Flat Cap" 
            onClick={() => onProductClick(BRITISH_HAT)} 
          />
          <Hotspot 
            position={shoesCartesian} 
            label="Vintage Leather Brogues" 
            onClick={() => onProductClick(BRITISH_SHOES)} 
          />
        </group>
      )}

      {/* Invisible Exit Portal (Aligned with the background image painting) */}
      <group 
        position={exitCartesian}
        rotation={[0, angleToCenter, 0]}
      >
        {/* Clickable Area (Requires double click to prevent accidental exit) */}
        <mesh 
          onPointerOver={handleExitOver}
          onPointerOut={handleExitOut}
          onDoubleClick={(e) => { e.stopPropagation(); onExitClick(); }}
        >
          <planeGeometry args={[11, 7]} />
          {/* Semi-transparent green guide box shown ONLY in Editor Mode to help align */}
          <meshBasicMaterial 
            color="#2ecc71" 
            transparent={true} 
            opacity={showEditor && activeItem === 'exit' ? 0.35 : 0} 
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Simple thin wireframe border shown in Editor Mode to see boundaries */}
        {showEditor && activeItem === 'exit' && (
          <mesh>
            <planeGeometry args={[11.1, 7.1]} />
            <meshBasicMaterial color="#ffffff" wireframe={true} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
};

const StoreInside = ({ imageSrc, onBack }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  // Load initial cylindrical positions from localStorage or defaults
  const [jacketCyl, setJacketCyl] = useState(() => {
    const saved = localStorage.getItem('jacketCyl');
    return saved ? JSON.parse(saved) : [-0.74, 3.0, 17.5];
  });
  const [hatCyl, setHatCyl] = useState(() => {
    const saved = localStorage.getItem('hatCyl');
    return saved ? JSON.parse(saved) : [-0.34, 1.8, 17.5];
  });
  const [shoesCyl, setShoesCyl] = useState(() => {
    const saved = localStorage.getItem('shoesCyl');
    return saved ? JSON.parse(saved) : [0.58, -2.5, 17.5];
  });
  
  // Invisible Exit Portal Position (default straight ahead, slightly up)
  const [exitCyl, setExitCyl] = useState(() => {
    const saved = localStorage.getItem('exitCyl');
    return saved ? JSON.parse(saved) : [0.0, 3.0, 18.0];
  });

  // Editor Panel (hidden by default, can be toggled using 'E' key)
  const [showEditor, setShowEditor] = useState(false);
  const [activeItem, setActiveItem] = useState('jacket'); // jacket | hat | shoes | exit

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage so they persist
  useEffect(() => {
    localStorage.setItem('jacketCyl', JSON.stringify(jacketCyl));
  }, [jacketCyl]);

  useEffect(() => {
    localStorage.setItem('hatCyl', JSON.stringify(hatCyl));
  }, [hatCyl]);

  useEffect(() => {
    localStorage.setItem('shoesCyl', JSON.stringify(shoesCyl));
  }, [shoesCyl]);

  useEffect(() => {
    localStorage.setItem('exitCyl', JSON.stringify(exitCyl));
  }, [exitCyl]);

  // Keyboard shortcut listener to toggle coordinate editor ('e' key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        setShowEditor(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cylToCartesian = (cyl) => {
    const [angle, y, r] = cyl;
    const x = Math.sin(angle) * r;
    const z = -Math.cos(angle) * r;
    return [x, y, z];
  };

  const getActiveCyl = () => {
    if (activeItem === 'jacket') return jacketCyl;
    if (activeItem === 'hat') return hatCyl;
    if (activeItem === 'shoes') return shoesCyl;
    return exitCyl;
  };

  const handleCylChange = (index, val) => {
    const floatVal = parseFloat(val);
    if (activeItem === 'jacket') {
      const newCyl = [...jacketCyl];
      newCyl[index] = floatVal;
      setJacketCyl(newCyl);
    } else if (activeItem === 'hat') {
      const newCyl = [...hatCyl];
      newCyl[index] = floatVal;
      setHatCyl(newCyl);
    } else if (activeItem === 'shoes') {
      const newCyl = [...shoesCyl];
      newCyl[index] = floatVal;
      setShoesCyl(newCyl);
    } else {
      const newCyl = [...exitCyl];
      newCyl[index] = floatVal;
      setExitCyl(newCyl);
    }
  };

  const handleExitClick = () => {
    if (isExiting) return;
    setIsExiting(true);
    document.body.classList.remove('door-hover');
    if (navigator.vibrate) navigator.vibrate(150);
    
    // Call parent transition after animations finish
    setTimeout(() => {
      onBack();
    }, 1200);
  };

  const currentCyl = getActiveCyl();
  const jacketCartesian = cylToCartesian(jacketCyl);
  const hatCartesian = cylToCartesian(hatCyl);
  const shoesCartesian = cylToCartesian(shoesCyl);
  const exitCartesian = cylToCartesian(exitCyl);
  const activeCartesian = cylToCartesian(currentCyl);

  return (
    <>
      <div 
        className="store-inside"
        style={{
          width: '100%', height: '100%',
          overflow: 'hidden', position: 'relative',
          backgroundColor: '#040404',
          cursor: 'grab'
        }}
        onPointerDown={(e) => e.target.style.cursor = 'grabbing'}
        onPointerUp={(e) => e.target.style.cursor = 'grab'}
      >
        {/* White blinding flash overlay when zooming into exit portal */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: '#fff',
          pointerEvents: 'none',
          zIndex: 200,
          opacity: isExiting ? 1 : 0,
          transition: 'opacity 1.1s cubic-bezier(0.5, 0, 1, 1)'
        }} />

        {/* ── CYLINDRICAL HOTSPOT COORDINATES EDITOR PANEL (Press E to show/hide) ── */}
        {showEditor && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 150,
            background: 'rgba(20, 18, 16, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(214, 198, 167, 0.3)',
            padding: '20px',
            borderRadius: '8px',
            color: '#d6c6a7',
            width: '280px',
            fontFamily: "'Playfair Display', serif",
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(214, 198, 167, 0.2)', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' }}>Hotspot Editor</h4>
              <button onClick={() => setShowEditor(false)} style={{ background: 'none', border: 'none', color: '#d6c6a7', cursor: 'pointer', fontSize: '12px' }}>Hide</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>Target Item:</label>
              <select 
                value={activeItem} 
                onChange={(e) => setActiveItem(e.target.value)}
                style={{
                  width: '100%',
                  background: '#2b251f',
                  border: '1px solid rgba(214, 198, 167, 0.4)',
                  color: '#d6c6a7',
                  padding: '6px',
                  borderRadius: '4px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <option value="jacket">British Tweed Jacket</option>
                <option value="hat">Classic Flat Cap</option>
                <option value="shoes">Vintage Leather Brogues</option>
                <option value="exit">Exit Portal (Background Painting)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span>Horizontal (Left/Right)</span>
                <span>{currentCyl[0].toFixed(2)} rad</span>
              </div>
              <input 
                type="range" min="-2.0" max="2.0" step="0.01" 
                value={currentCyl[0]} 
                onChange={(e) => handleCylChange(0, e.target.value)}
                style={{ width: '100%', accentColor: '#d6c6a7' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span>Vertical (Up/Down)</span>
                <span>{currentCyl[1].toFixed(1)}</span>
              </div>
              <input 
                type="range" min="-10" max="10" step="0.1" 
                value={currentCyl[1]} 
                onChange={(e) => handleCylChange(1, e.target.value)}
                style={{ width: '100%', accentColor: '#d6c6a7' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span>Distance to Wall</span>
                <span>{currentCyl[2].toFixed(1)} / 20</span>
              </div>
              <input 
                type="range" min="5" max="19.5" step="0.1" 
                value={currentCyl[2]} 
                onChange={(e) => handleCylChange(2, e.target.value)}
                style={{ width: '100%', accentColor: '#d6c6a7' }}
              />
            </div>

            <div style={{ background: '#1c1815', padding: '10px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(214, 198, 167, 0.2)' }}>
              <div style={{ color: 'rgba(214, 198, 167, 0.6)', marginBottom: '5px' }}>Copy-Paste Coordinates:</div>
              <code style={{ color: '#fff', fontSize: '12px', display: 'block', wordBreak: 'break-all' }}>
                [{activeCartesian[0].toFixed(1)}, {activeCartesian[1].toFixed(1)}, {activeCartesian[2].toFixed(1)}]
              </code>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(214, 198, 167, 0.5)', textAlign: 'center' }}>
              Press 'E' to show/hide this panel anytime.
            </div>
          </div>
        )}

        <Canvas
          camera={{ position: [0, 0, 0.01], fov: 45 }}
          onCreated={() => window.dispatchEvent(new Event('resize'))}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, display: 'block' }}>
          <Suspense fallback={null}>
            <Scene 
              imageSrc={imageSrc} 
              onProductClick={setSelectedProduct} 
              jacketCartesian={jacketCartesian}
              hatCartesian={hatCartesian}
              shoesCartesian={shoesCartesian}
              exitCartesian={exitCartesian}
              isExiting={isExiting}
              showEditor={showEditor}
              activeItem={activeItem}
              onExitClick={handleExitClick}
            />
            <OrbitControls 
              enabled={!isExiting}
              enableZoom={false} 
              enablePan={false} 
              rotateSpeed={-0.3} 
              target={[0, 0, 0]}
              minPolarAngle={Math.PI / 2 - 0.1} 
              maxPolarAngle={Math.PI / 2 + 0.5}
              minAzimuthAngle={-1.2} 
              maxAzimuthAngle={1.2}
            />
          </Suspense>
        </Canvas>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductPopup 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default StoreInside;
