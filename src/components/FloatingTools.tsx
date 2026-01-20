import React from 'react';
import './AnimatedBackground.css';

interface FloatingToolProps {
  className?: string;
  delay?: number;
  speed?: number;
}

const NailPolishBottle: React.FC<FloatingToolProps> = ({ className = '', delay = 0, speed = 1 }) => {
  const uniqueId = `bottle-${delay}`;
  return (
    <div className={`floating-tool tool-nail-polish ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: `${8 / speed}s` }}>
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`bottleGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6E8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF9F70" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Bottle cap */}
        <rect x="15" y="5" width="10" height="8" rx="2" fill="#FFC8A8" opacity="0.7" />
        {/* Bottle neck */}
        <rect x="17" y="13" width="6" height="5" rx="1" fill={`url(#bottleGradient-${uniqueId})`} />
        {/* Bottle body */}
        <rect x="10" y="18" width="20" height="25" rx="3" fill={`url(#bottleGradient-${uniqueId})`} />
        {/* Brush handle */}
        <rect x="18" y="43" width="4" height="7" rx="1" fill="#FFC8A8" opacity="0.6" />
      </svg>
    </div>
  );
};

const NailFile: React.FC<FloatingToolProps> = ({ className = '', delay = 0, speed = 1 }) => {
  const uniqueId = `file-${delay}`;
  return (
    <div className={`floating-tool tool-nail-file ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: `${10 / speed}s` }}>
      <svg width="45" height="8" viewBox="0 0 45 8" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`fileGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E4B7FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C0D8FF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* File handle */}
        <rect x="0" y="2" width="8" height="4" rx="1" fill="#FFC8A8" opacity="0.6" />
        {/* File body */}
        <rect x="8" y="1" width="37" height="6" rx="1" fill={`url(#fileGradient-${uniqueId})`} />
      </svg>
    </div>
  );
};

const NailBrush: React.FC<FloatingToolProps> = ({ className = '', delay = 0, speed = 1 }) => {
  const uniqueId = `brush-${delay}`;
  return (
    <div className={`floating-tool tool-brush ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: `${12 / speed}s` }}>
      <svg width="35" height="40" viewBox="0 0 35 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`brushGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9F70" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF6E8A" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Brush handle */}
        <rect x="12" y="5" width="11" height="20" rx="2" fill="#FFC8A8" opacity="0.6" />
        {/* Brush bristles */}
        <rect x="8" y="25" width="19" height="12" rx="2" fill={`url(#brushGradient-${uniqueId})`} />
        {/* Brush tip */}
        <rect x="10" y="37" width="15" height="3" rx="1" fill="#FF6E8A" opacity="0.6" />
      </svg>
    </div>
  );
};

const CuticlePusher: React.FC<FloatingToolProps> = ({ className = '', delay = 0, speed = 1 }) => {
  const uniqueId = `cuticle-${delay}`;
  return (
    <div className={`floating-tool tool-cuticle ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: `${9 / speed}s` }}>
      <svg width="30" height="35" viewBox="0 0 30 35" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`cuticleGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C0D8FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E4B7FF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x="10" y="5" width="10" height="15" rx="2" fill="#FFC8A8" opacity="0.6" />
        {/* Shaft */}
        <rect x="13" y="20" width="4" height="8" rx="1" fill={`url(#cuticleGradient-${uniqueId})`} />
        {/* Tip */}
        <path d="M 15 28 L 10 35 L 20 35 Z" fill={`url(#cuticleGradient-${uniqueId})`} />
      </svg>
    </div>
  );
};

const NailArtBrush: React.FC<FloatingToolProps> = ({ className = '', delay = 0, speed = 1 }) => {
  const uniqueId = `artBrush-${delay}`;
  return (
    <div className={`floating-tool tool-art-brush ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: `${11 / speed}s` }}>
      <svg width="25" height="45" viewBox="0 0 25 45" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`artBrushGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6E8A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF9F70" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x="8" y="5" width="9" height="25" rx="2" fill="#FFC8A8" opacity="0.6" />
        {/* Brush tip */}
        <ellipse cx="12.5" cy="35" rx="6" ry="8" fill={`url(#artBrushGradient-${uniqueId})`} />
      </svg>
    </div>
  );
};

interface FloatingToolsProps {
  containerRef?: React.RefObject<HTMLDivElement>;
}

const FloatingTools: React.FC<FloatingToolsProps> = ({ containerRef }) => {
  return (
    <div ref={containerRef} className="floating-tools-container">
      <NailPolishBottle delay={0} speed={1.2} />
      <NailFile delay={1.5} speed={0.9} />
      <NailBrush delay={3} speed={1.1} />
      <CuticlePusher delay={2} speed={1} />
      <NailArtBrush delay={4} speed={0.95} />
      <NailPolishBottle delay={5.5} speed={1.3} />
      <NailFile delay={6.5} speed={1} />
    </div>
  );
};

export default FloatingTools;

