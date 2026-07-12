import { afterEach, describe, expect, it, vi } from 'vitest';
import { login } from './authApi';

const mockResponse = (body: unknown, status: number): Response => new Response(
  typeof body === 'string' ? body : JSON.stringify(body),
  {
    status,
    headers: { 'Content-Type': 'application/json' },
  },
);

describe('authApi — mensagens de erro', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('repassa mensagem amigável quando o código pertence ao contrato da API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Informe um e-mail válido.',
    }, 400)));

    await expect(login('invalido', '')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Informe um e-mail válido.',
    });
  });

  it('não exibe mensagem técnica sem um código conhecido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({
      statusCode: 400,
      code: 'FST_ERR_VALIDATION',
      message: 'body/email Invalid email',
    }, 400)));

    await expect(login('invalido', '')).rejects.toMatchObject({
      status: 400,
      message: 'Não foi possível concluir a solicitação. Revise os dados e tente novamente.',
    });
  });

  it('usa mensagem específica para excesso de tentativas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('Too Many Requests', 429)));

    await expect(login('teste@example.com', 'senha')).rejects.toMatchObject({
      status: 429,
      message: 'Muitas tentativas. Aguarde um momento e tente novamente.',
    });
  });

  it('não expõe detalhes de configuração quando a resposta de sucesso é inválida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('resposta inválida', 200)));

    await expect(login('teste@example.com', 'senha')).rejects.toMatchObject({
      status: 200,
      message: 'O servidor retornou uma resposta inesperada. Tente novamente.',
    });
  });
});
