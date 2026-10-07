import React, { useEffect, useState } from 'react';
import { formatElapsed } from '../utils/elapsed';

/** Tempo da sessão, atualizado a cada segundo. Só este span re-renderiza (#267). */
export const SessionClock: React.FC<{ startIso: string }> = ({ startIso }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  return <span>{formatElapsed(startIso, now)}</span>;
};

export default SessionClock;
