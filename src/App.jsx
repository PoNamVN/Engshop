import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoomViewer from './components/RoomViewer';
import StoreInside from './components/StoreInside';
import './App.css';

function App() {
  const [scene, setScene] = useState('CITY');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>


      {/* Main Scene Manager */}
      <AnimatePresence mode="wait">
        {scene === 'CITY' ? (
          <motion.div
            key="city"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
          >
            <RoomViewer imageSrc="/image/mixed_media_city_wide16x9.png" onDoorClick={() => setScene('STORE')} />
          </motion.div>
        ) : (
          <motion.div
            key="store"
            initial={{ filter: 'brightness(3) contrast(0.8)', opacity: 0 }}
            animate={{ filter: 'brightness(1) contrast(1)', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
          >
            <StoreInside imageSrc="/image/Inside Shop.png" onBack={() => setScene('CITY')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay - only run once on initial load */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#040404',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, pointerEvents: 'none' }}
        transition={{ duration: 1, delay: 1 }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: '40px', height: '40px', border: '3px solid var(--accent-color)', borderRadius: '50%', borderTopColor: 'transparent' }}
        />
      </motion.div>
    </div>
  );
}

export default App;
