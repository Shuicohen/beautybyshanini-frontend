import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';
import Starburst from './Starburst';
import Heart from './Heart';
import FloatingTools from './FloatingTools';

const AnimatedBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const blob4Ref = useRef<HTMLDivElement>(null);
  const blob5Ref = useRef<HTMLDivElement>(null);
  const starburstRef = useRef<SVGSVGElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        // Update CSS custom property on container for elements that use it
        if (containerRef.current) {
          containerRef.current.style.setProperty('--parallax-y', scrollY.toString());
        }

        // Apply parallax transforms directly to elements
        // Blobs use 0.02 multiplier
        const blobParallax = scrollY * 0.02;
        if (blob1Ref.current) blob1Ref.current.style.setProperty('--parallax-offset', `${blobParallax}px`);
        if (blob2Ref.current) blob2Ref.current.style.setProperty('--parallax-offset', `${blobParallax}px`);
        if (blob3Ref.current) blob3Ref.current.style.setProperty('--parallax-offset', `${blobParallax}px`);
        if (blob4Ref.current) blob4Ref.current.style.setProperty('--parallax-offset', `${blobParallax}px`);
        if (blob5Ref.current) blob5Ref.current.style.setProperty('--parallax-offset', `${blobParallax}px`);

        // Starburst uses 0.01 multiplier
        if (starburstRef.current) {
          starburstRef.current.style.transform = `translateY(${scrollY * 0.01}px)`;
        }

        // Heart uses 0.03 multiplier
        if (heartRef.current) {
          heartRef.current.style.transform = `translateY(${scrollY * 0.03}px)`;
        }

        // Floating tools use 0.015 multiplier (subtle parallax)
        const toolParallax = scrollY * 0.015;
        if (toolsContainerRef.current) {
          toolsContainerRef.current.style.setProperty('--parallax-offset-tool', `${toolParallax}px`);
        }
      });
    };

    // Initial call to set initial parallax value
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="animated-bg">
      {/* Gradient Blobs */}
      <div ref={blob1Ref} className="blob blob-1"></div>
      <div ref={blob2Ref} className="blob blob-2"></div>
      <div ref={blob3Ref} className="blob blob-3"></div>
      <div ref={blob4Ref} className="blob blob-4"></div>
      <div ref={blob5Ref} className="blob blob-5"></div>
      
      {/* SVG Elements */}
      <Starburst ref={starburstRef} />
      <Heart ref={heartRef} />
      
      {/* Floating Nail Tools */}
      <FloatingTools containerRef={toolsContainerRef} />
    </div>
  );
};

export default AnimatedBackground;

