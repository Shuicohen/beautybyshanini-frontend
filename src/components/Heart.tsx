import React from 'react';
import './AnimatedBackground.css';

interface HeartProps {
  className?: string;
}

const Heart = React.forwardRef<SVGSVGElement, HeartProps>(
  ({ className = '' }, ref) => {
    return (
      <svg
        ref={ref}
        className={`heart ${className}`}
        width="120"
        height="110"
        viewBox="0 0 120 110"
        xmlns="http://www.w3.org/2000/svg"
      >
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9F70" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FF6E8A" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFC8A8" stopOpacity="0.7" />
        </linearGradient>
        <filter id="heartBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>
      <path
        d="M 60 95 C 50 85, 20 60, 20 40 C 20 25, 32 15, 45 15 C 52 15, 60 20, 60 20 C 60 20, 68 15, 75 15 C 88 15, 100 25, 100 40 C 100 60, 70 85, 60 95 Z"
        fill="url(#heartGradient)"
        filter="url(#heartBlur)"
        opacity="0.85"
      />
      </svg>
    );
  }
);

Heart.displayName = 'Heart';

export default Heart;

