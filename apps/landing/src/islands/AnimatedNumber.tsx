import { lazy, Suspense } from 'react';
import { useMotionAllowed } from '../lib/media';
import { formatNumber } from '../lib/format';

// reactbits CountUp depende de `motion`; só é baixado em desktop sem reduced-motion
// (regra de perf da spec). No servidor e no mobile renderiza o número formatado.
const CountUp = lazy(() => import('../components/reactbits/CountUp'));

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({ value, decimals = 2, className }: AnimatedNumberProps) {
  const motionAllowed = useMotionAllowed();
  const plain = <span className={className}>{formatNumber(value, decimals)}</span>;

  if (!motionAllowed || !Number.isFinite(value)) return plain;

  return (
    <Suspense fallback={plain}>
      <CountUp to={value} from={0} duration={1.2} decimals={decimals} locale="pt-BR" className={className} />
    </Suspense>
  );
}
