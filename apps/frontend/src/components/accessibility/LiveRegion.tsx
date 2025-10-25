import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  id?: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion = ({ 
  id = 'live-region', 
  priority = 'polite', 
  atomic = true,
  className = 'sr-only'
}: LiveRegionProps) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the live region is properly set up
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.setAttribute('aria-atomic', atomic.toString());
    }
  }, [priority, atomic]);

  return (
    <div
      ref={regionRef}
      id={id}
      className={className}
      aria-live={priority}
      aria-atomic={atomic}
    />
  );
};