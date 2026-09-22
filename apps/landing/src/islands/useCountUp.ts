import { useEffect, useRef, useState } from 'react';
import { useMotionAllowed } from '../lib/media';

/**
 * Anima um número até `value` com requestAnimationFrame (sem dependência de
 * animação). Fora do desktop ou com `prefers-reduced-motion`, devolve o valor
 * final direto — o mesmo gate que a landing usa para todo movimento.
 */
export function useCountUp(value: number, durationMs = 450): number {
  const motionAllowed = useMotionAllowed();
  const animate = motionAllowed && Number.isFinite(value);
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (!animate) {
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic: rápido no começo, assenta no fim
      setDisplay(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    });

    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, animate]);

  return animate ? display : value;
}
