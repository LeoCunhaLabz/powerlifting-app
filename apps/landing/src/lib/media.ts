import { useEffect, useState } from 'react';

/** Query única usada em toda a landing para liberar movimento (gsap/motion). */
export const MOTION_MEDIA = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

/**
 * `true` só no cliente, em desktop e sem prefers-reduced-motion. No servidor e no
 * primeiro render devolve `false`, então o HTML estático nunca depende de animação.
 */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOTION_MEDIA);
    const update = () => setAllowed(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return allowed;
}
