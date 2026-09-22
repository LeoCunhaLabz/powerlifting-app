import { formatNumber } from '../lib/format';
import { useCountUp } from './useCountUp';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({ value, decimals = 2, className }: AnimatedNumberProps) {
  const display = useCountUp(value);
  return <span className={className}>{formatNumber(display, decimals)}</span>;
}
