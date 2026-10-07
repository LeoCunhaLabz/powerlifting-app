import { useState, type ReactNode } from 'react';
import { Block, Button, EmptyState, Field, IconButton, ListRow, ScreenHeader, SegmentedControl, Segments, Sheet, Stat, Toast } from '../ui';
import { countdownFilled } from '../ui/Segments/segmentStates';
import { AlertTriangle, ClipboardList, CloudCheck, MoreHorizontal, Play, Plus, X } from 'lucide-react';
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
  const [metric, setMetric] = useState<'e1rm' | 'rel'>('e1rm');
  const [sheetOpen, setSheetOpen] = useState(false);

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

      <Section title="Segments">
        <Segments total={17} filled={5} label="5 de 17 séries concluídas" />
        <Segments total={18} filled={countdownFilled(108, 180, 18)} mode="countdown" label="1:48 de descanso restantes" />
        <div className={styles.narrow}>
          <Segments total={4} filled={2} size="sm" label="Semana 3 de 4 do bloco" />
        </div>
        <Segments total={40} filled={12} label="12 de 40 séries concluídas" />
        <Segments total={0} filled={0} label="Sem séries" />
      </Section>

      <Section title="Button">
        <Button variant="primary" size="lg" block icon={<Play size={18} fill="currentColor" />}>Começar treino</Button>
        <Button variant="link">Treino avulso</Button>
        <div className={styles.row}>
          <Button variant="secondary">Registrar</Button>
          <Button variant="secondary" disabled>Desabilitado</Button>
          <Button variant="secondary" loading>Salvando</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary">Concluir série</Button>
          <Button variant="danger">Descartar treino</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <div className={styles.row}>
          <IconButton aria-label="Registrar peso" icon={<Plus size={20} />} />
          <IconButton aria-label="Mais opções" variant="plain" icon={<MoreHorizontal size={20} />} />
          <IconButton aria-label="Desabilitado" disabled icon={<Plus size={20} />} />
        </div>
      </Section>

      <Section title="Block e ListRow">
        <Block label="Depois" aside="3 exercícios">
          <div>
            <ListRow title="Supino pausado" meta="4 séries, 102,5 kg" onClick={() => undefined} />
            <ListRow title="Stiff" meta="3 séries, 120 kg" onClick={() => undefined} />
            <ListRow title="Remada curvada com nome bem longo para testar o corte" meta="3 séries, 80 kg" onClick={() => undefined} />
          </div>
        </Block>
        <Block>
          <ListRow title="Linha sem toque" meta="só informação" />
        </Block>
      </Section>

      <Section title="Stat">
        <Stat size="xl" value={522.5} decimals={1} unit="kg" label="Total estimado" delta="+7,5 kg nas últimas 4 semanas" />
        <Stat size="xl" value={1102.5} decimals={1} unit="lbs" label="Total em lbs (número grande)" />
        <div className={styles.row}>
          <Stat size="md" value={83.4} unit="kg" label="Peso corporal" />
          <Stat size="sm" value={NaN} unit="kg" label="Sem registro" />
        </div>
      </Section>

      <Section title="Field">
        <Field label="Peso de hoje (kg)" inputMode="decimal" placeholder="83,4" />
        <Field label="E-mail" defaultValue="nome@" error="Digite um e-mail completo." />
        <Field label="Observação" hint="Opcional. Aparece no histórico." />
        <div className={styles.pair}>
          <Field label="Peso em kg" hideLabel variant="set" defaultValue="150" inputMode="decimal" />
          <Field label="Repetições" hideLabel variant="set" defaultValue="4" inputMode="numeric" />
        </div>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          label="Métrica da evolução"
          value={metric}
          onChange={setMetric}
          options={[{ value: 'e1rm', label: 'e1RM' }, { value: 'rel', label: 'Força relativa' }]}
        />
      </Section>

      <Section title="ScreenHeader">
        <ScreenHeader title="Biblioteca" actions={<Button variant="secondary" icon={<Plus size={16} />}>Nova rotina</Button>} />
        <ScreenHeader title="Exercícios" meta="Crie exercícios reutilizáveis. Eles aparecem na busca ao montar rotinas e durante o treino." />
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>Abrir folha de finalizar</Button>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Finalizar treino?"
          actions={
            <>
              <Button variant="primary" size="lg" block onClick={() => setSheetOpen(false)}>Finalizar treino</Button>
              <Button variant="danger" block onClick={() => setSheetOpen(false)}>Descartar treino</Button>
              <Button variant="link" block onClick={() => setSheetOpen(false)}>Voltar</Button>
            </>
          }
        >
          5 de 17 séries concluídas. As séries sem check não entram no histórico.
        </Sheet>
      </Section>

      <Section title="Toast">
        <Toast icon={<CloudCheck size={16} />} message="Sincronizado" />
        <Toast
          tone="danger"
          icon={<AlertTriangle size={16} />}
          message="Não foi possível salvar no aparelho. Libere espaço e tente de novo."
          action={<IconButton aria-label="Dispensar aviso" variant="plain" icon={<X size={16} />} />}
        />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Nenhuma rotina ainda"
          description="Crie uma rotina ou comece por um treino avulso."
          action={<Button variant="primary">Criar rotina</Button>}
        />
      </Section>

      {/* fim das seções */}
    </main>
  );
}
