import { describe, it, expect } from 'vitest';
import { decodeStrengthPayload, encodeStrengthPayload, type StrengthPayload } from '@powerlifting/shared';
import {
  buildFullModePath,
  buildShareQuery,
  buildShareUrl,
  buildSignupUrl,
  parseShareQuery,
  type ShareInput,
} from './strengthShare';

const BENCH: ShareInput = { sex: 'm', bodyweight: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] };

describe('buildShareQuery', () => {
  it('monta o link do modo compacto com o par do lift escolhido', () => {
    expect(buildShareQuery(BENCH)).toBe('?s=m&bw=82&bp=110&rbp=5');
  });

  it('omite reps quando é 1 (o padrão)', () => {
    expect(buildShareQuery({ sex: 'f', bodyweight: 63, lifts: [{ lift: 'squat', kg: 120, reps: 1 }] })).toBe(
      '?s=f&bw=63&sq=120',
    );
  });

  it('mantém a ordem agacho · supino · terra e ignora lift sem carga', () => {
    const query = buildShareQuery({
      sex: 'm',
      bodyweight: 82.5,
      lifts: [
        { lift: 'deadlift', kg: 200, reps: 1 },
        { lift: 'bench', kg: 0, reps: 3 },
        { lift: 'squat', kg: 160, reps: 3 },
      ],
    });
    expect(query).toBe('?s=m&bw=82.5&sq=160&rsq=3&dl=200');
  });
});

describe('parseShareQuery', () => {
  it('faz o round-trip do link de compartilhamento', () => {
    expect(parseShareQuery(buildShareQuery(BENCH))).toEqual({
      sex: 'm',
      bodyweight: 82,
      lifts: [{ lift: 'bench', kg: 110, reps: 5 }],
    });
  });

  it('assume 1 rep quando a chave está ausente ou fora do segmentado', () => {
    expect(parseShareQuery('?s=m&bw=82&bp=110')?.lifts[0].reps).toBe(1);
    expect(parseShareQuery('?s=m&bw=82&bp=110&rbp=7')?.lifts[0].reps).toBe(1);
    expect(parseShareQuery('?s=m&bw=82&bp=110&rbp=abc')?.lifts[0].reps).toBe(1);
  });

  it('devolve null sem sexo, sem peso corporal ou sem nenhum lift', () => {
    expect(parseShareQuery('?bw=82&bp=110')).toBeNull();
    expect(parseShareQuery('?s=x&bw=82&bp=110')).toBeNull();
    expect(parseShareQuery('?s=m&bp=110')).toBeNull();
    expect(parseShareQuery('?s=m&bw=0&bp=110')).toBeNull();
    expect(parseShareQuery('?s=m&bw=82')).toBeNull();
    expect(parseShareQuery('?s=m&bw=82&bp=-10')).toBeNull();
  });

  it('aceita a query sem a interrogação', () => {
    expect(parseShareQuery('s=m&bw=82&dl=200')?.lifts).toEqual([{ lift: 'deadlift', kg: 200, reps: 1 }]);
  });
});

describe('buildShareUrl e buildFullModePath', () => {
  it('apontam para /quao-forte-voce-e', () => {
    expect(buildShareUrl(BENCH)).toBe('https://onyxtreino.com.br/quao-forte-voce-e?s=m&bw=82&bp=110&rbp=5');
    expect(buildFullModePath(BENCH)).toBe('/quao-forte-voce-e?s=m&bw=82&bp=110&rbp=5');
  });
});

describe('buildSignupUrl', () => {
  it('leva o payload no fragmento do cadastro do app', () => {
    const url = buildSignupUrl(BENCH);
    expect(url.startsWith('https://app.onyxtreino.com.br/registro#forca=')).toBe(true);

    const payload = decodeStrengthPayload(url.split('#')[1]);
    expect(payload).toEqual({ v: 1, sex: 'M', bw: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] });
  });

  it('usa base64url: sem +, / ou = no fragmento', () => {
    const fragment = buildSignupUrl({
      sex: 'f',
      bodyweight: 63.5,
      lifts: [
        { lift: 'squat', kg: 122.5, reps: 3 },
        { lift: 'bench', kg: 70, reps: 1 },
        { lift: 'deadlift', kg: 150.5, reps: 8 },
      ],
    }).split('#forca=')[1];
    expect(fragment).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeStrengthPayload(fragment)?.lifts).toHaveLength(3);
  });
});

describe('decodeStrengthPayload', () => {
  const valid: StrengthPayload = { v: 1, sex: 'M', bw: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] };

  it('aceita com ou sem o prefixo forca=', () => {
    const encoded = encodeStrengthPayload(valid);
    expect(decodeStrengthPayload(encoded)).toEqual(valid);
    expect(decodeStrengthPayload(`forca=${encoded}`)).toEqual(valid);
  });

  it('recusa versão desconhecida', () => {
    const encoded = encodeStrengthPayload({ ...valid, v: 2 } as unknown as StrengthPayload);
    expect(decodeStrengthPayload(encoded)).toBeNull();
  });

  it('recusa lixo, vazio e base64 que não é JSON', () => {
    expect(decodeStrengthPayload('')).toBeNull();
    expect(decodeStrengthPayload('###')).toBeNull();
    expect(decodeStrengthPayload(btoa('não é json'))).toBeNull();
  });

  it('recusa campos fora da faixa', () => {
    const cases: unknown[] = [
      { ...valid, sex: 'X' },
      { ...valid, bw: 0 },
      { ...valid, bw: 500 },
      { ...valid, lifts: [] },
      { ...valid, lifts: [{ lift: 'press', kg: 60, reps: 1 }] },
      { ...valid, lifts: [{ lift: 'bench', kg: 110, reps: 11 }] },
      { ...valid, lifts: [{ lift: 'bench', kg: 110, reps: 2.5 }] },
      { ...valid, lifts: [{ lift: 'bench', kg: -1, reps: 1 }] },
      { ...valid, lifts: [{ lift: 'bench', kg: 110 }] },
    ];
    for (const payload of cases) {
      expect(decodeStrengthPayload(encodeStrengthPayload(payload as StrengthPayload))).toBeNull();
    }
  });

  it('recusa o mesmo lift repetido', () => {
    const encoded = encodeStrengthPayload({
      ...valid,
      lifts: [
        { lift: 'bench', kg: 110, reps: 5 },
        { lift: 'bench', kg: 120, reps: 1 },
      ],
    });
    expect(decodeStrengthPayload(encoded)).toBeNull();
  });
});
