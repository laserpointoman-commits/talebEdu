import { useRef, useEffect } from 'react';

interface MagneticHoverOptions {
  strength?: number;
  radius?: number;
}

export const useMagneticHover = (options: MagneticHoverOptions = {}) => {
  const { strength = 0.3, radius = 100 } = options;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < radius) {
        const force = (radius - distance) / radius;
        const moveX = deltaX * strength * force;
        const moveY = deltaY * strength * force;

        element.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
      } else {
        element.style.transform = 'translate(0, 0) scale(1)';
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0) scale(1)';
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, radius]);

  return ref;
};
