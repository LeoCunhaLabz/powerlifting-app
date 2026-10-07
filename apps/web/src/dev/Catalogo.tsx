import type { ReactNode } from 'react';
import styles from './Catalogo.module.css';

const COLORS = [
  '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--line',
  '--text-1', '--text-2', '--text-3', '--text-off',
  '--now', '--now-ink', '--danger', '--danger-ink',
] as const;
const NUMBERS = [['--num-xl', '522,5'], ['--num-lg', '1:48'], ['--num-md', '150'], ['--num-sm', '182,5']] as const;
const TITLES = ['--title-1', '--title-2', '--title-3'] as const;
const TEXTS = ['--fs-body', '--fs-sm', '--fs-xs', '--fs-caption', '--fs-label'] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.items}>{children}</div>
    </section>
  );
}

/** Catálogo dos componentes base em todos os estados. Só existe no `npm run dev` (ver main.tsx). */
export default function Catalogo() {
  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Catálogo ONYX</h1>
      <p className={styles.intro}>Tokens e componentes base em todos os estados. Só existe no npm run dev.</p>

      <Section title="Cores">
        <div className={styles.swatches}>
          {COLORS.map((c) => (
            <span key={c} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${c})` }} />
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Números (Barlow Condensed)">
        {NUMBERS.map(([token, sample]) => (
          <div key={token} className={styles.typeSample}>
            <span className={styles.typeName}>{token}</span>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: `var(${token})`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sample}</span>
          </div>
        ))}
      </Section>

      <Section title="Títulos e texto">
        {TITLES.map((t) => (
          <div key={t} className={styles.typeSample}>
            <span className={styles.typeName}>{t}</span>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: `var(${t})`, lineHeight: 1.1 }}>Agachamento pesado</span>
          </div>
        ))}
        {TEXTS.map((t) => (
          <div key={t} className={styles.typeSample}>
            <span className={styles.typeName}>{t}</span>
            <span style={{ fontSize: `var(${t})` }}>Bloco de força, semana 3 de 4</span>
          </div>
        ))}
      </Section>

      {/* fim das seções */}
    </main>
  );
}
