import { useState, type ReactNode } from 'react';
import type { SetState } from '@powerlifting/shared';
import { SetRow, SetRowHeader } from '../components/workout/SetRow/SetRow';
import { SetTypeSheet } from '../components/workout/SetTypeSheet/SetTypeSheet';
import { RestBarView } from '../components/workout/RestBar/RestBar';
import { RestDefaultSetting } from '../components/RestDefaultSetting/RestDefaultSetting';
import { currentSetIndex, setLabel } from '../utils/workoutSets';
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

const SAMPLE_SETS: SetState[] = [
  { id: 'a', type: 'W', weight: 60, reps: 5, completed: true },
  { id: 'b', type: 'W', weight: 100, reps: 3, completed: true },
  { id: 'c', type: 'N', weight: 150, reps: 4, rpe: 7.5, completed: true },
  { id: 'd', type: 'N', weight: 112.5, reps: 4, completed: false },
  { id: 'e', type: 'N', weight: 150, reps: 4, completed: false },
  { id: 'f', type: 'D', weight: 0, reps: 0, completed: false },
];
const LONG_SETS: SetState[] = [{ id: 'g', type: 'N', weight: 1102.5, reps: 1, rpe: 9.5, completed: false }];

/** Séries de exemplo com estado local, para testar toque e digitação no catálogo. */
function SetRowSample({ initial, units }: { initial: SetState[]; units: 'kg' | 'lbs' }) {
  const [sets, setSets] = useState(initial);
  const [typeIdx, setTypeIdx] = useState<number | null>(null);
  const current = currentSetIndex(sets.map((s) => s.completed));
  const update = (i: number, fields: Partial<SetState>) =>
    setSets((prev) => prev.map((s, j) => (j === i ? { ...s, ...fields } : s)));
  return (
    <Block>
      <div>
        <SetRowHeader units={units} />
        {sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            label={setLabel(sets, i)}
            current={i === current}
            units={units}
            previous={i === current ? '147,5 × 4' : null}
            onChange={(fields) => update(i, fields)}
            onTypePress={() => setTypeIdx(i)}
          />
        ))}
      </div>
      {typeIdx !== null && sets[typeIdx] && (
        <SetTypeSheet
          exerciseName="Agachamento"
          set={sets[typeIdx]}
          label={setLabel(sets, typeIdx)}
          units={units}
          canRemove={sets.length > 1}
          onChangeType={(type) => update(typeIdx, { type })}
          onRemove={() => setSets((prev) => prev.filter((_, j) => j !== typeIdx))}
          onClose={() => setTypeIdx(null)}
        />
      )}
    </Block>
  );
}

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
  const [restDefault, setRestDefault] = useState(120);
  const next = { exercise: 'Agachamento', set: 'série 3', load: '150 kg × 4' };
  const noop = () => undefined;

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

      <Section title="SetRow (treino)">
        <SetRowSample initial={SAMPLE_SETS} units="kg" />
        <SetRowSample initial={LONG_SETS} units="lbs" />
      </Section>

      <Section title="RestBar (treino)">
        <RestBarView status={{ remaining: 108, overtime: 0, ended: false, total: 180 }} exercise="Agachamento" next={next}
          open={false} onOpen={noop} onCollapse={noop} onAdjust={noop} onSkip={noop} />
        <RestBarView status={{ remaining: 108, overtime: 0, ended: false, total: 180 }} exercise="Agachamento" next={next}
          open onOpen={noop} onCollapse={noop} onAdjust={noop} onSkip={noop} />
        <RestBarView status={{ remaining: 0, overtime: 42, ended: true, total: 180 }} exercise="Agachamento"
          next={{ exercise: 'Levantamento Terra com déficit e pausa', set: 'série 1', load: '1.102,5 lbs × 1' }}
          open={false} onOpen={noop} onCollapse={noop} onAdjust={noop} onSkip={noop} />
        <RestBarView status={{ remaining: 0, overtime: 605, ended: true, total: 90 }} next={null}
          open={false} onOpen={noop} onCollapse={noop} onAdjust={noop} onSkip={noop} />
        <RestDefaultSetting seconds={restDefault} onChange={setRestDefault} />
      </Section>

      {/* fim das seções */}
    </main>
  );
}
