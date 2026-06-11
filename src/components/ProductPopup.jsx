import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ProductPopup = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="product-popup-backdrop"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="vintage-paper product-popup-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          borderRadius: '4px',
          padding: '30px 40px',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'default',
          position: 'relative',
          boxSizing: 'border-box',
          overflowY: 'auto' // Fallback for extremely small viewports
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="vintage-border"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="product-popup-close"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#2b251f',
            zIndex: 10
          }}
        >
          <X size={28} strokeWidth={1.5} />
        </button>

        <h2 className="vintage-title" style={{ fontSize: '24px', marginTop: '10px', wordBreak: 'break-word' }}>
          {product.title}
        </h2>

        {/* Content Container */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '30px', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            marginTop: '10px'
          }}
        >
          {/* Left Side: Image */}
          <div 
            style={{ 
              flex: '1 1 300px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              maxHeight: '300px'
            }}
          >
            <img 
              src={product.imageSrc} 
              alt={product.title} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                objectFit: 'contain',
                filter: 'drop-shadow(10px 15px 12px rgba(0,0,0,0.3))'
              }} 
            />
          </div>

          {/* Right Side: Details Box */}
          <div 
            style={{ 
              flex: '1 1 300px', 
              display: 'flex', 
              flexDirection: 'column', 
              boxSizing: 'border-box'
            }}
          >
            <div 
              style={{ 
                border: '1px solid rgba(43, 37, 31, 0.4)', 
                padding: '20px 25px', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', fontStyle: 'italic', color: 'rgba(43, 37, 31, 0.7)' }}>Color:</strong>
                <div style={{ fontSize: '17px', fontWeight: '500', wordBreak: 'break-word' }}>{product.colors}</div>
              </div>

              <div>
                <strong style={{ fontSize: '15px', fontStyle: 'italic', color: 'rgba(43, 37, 31, 0.7)' }}>Sizes:</strong>
                <div style={{ fontSize: '17px', fontWeight: '500', wordBreak: 'break-word' }}>{product.sizes}</div>
              </div>

              <div>
                <strong style={{ fontSize: '15px', fontStyle: 'italic', color: 'rgba(43, 37, 31, 0.7)' }}>Material:</strong>
                <div style={{ fontSize: '17px', fontWeight: '500', wordBreak: 'break-word' }}>{product.material}</div>
              </div>

              <div style={{ borderTop: '1px dashed rgba(43, 37, 31, 0.3)', paddingTop: '12px', marginTop: '5px' }}>
                <strong style={{ fontSize: '15px', fontStyle: 'italic', color: 'rgba(43, 37, 31, 0.7)' }}>Price:</strong>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1b1713' }}>{product.price}</div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductPopup;
