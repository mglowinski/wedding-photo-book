'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // When the pathname changes, trigger the transition
    if (pathname) {
      setIsTransitioning(true);
      // After the fade-out animation, update the children
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 400); // Match this with the CSS transition duration
      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isTransitioning 
          ? 'opacity-0 transform translate-x-4' 
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      {displayChildren}
    </div>
  );
} 