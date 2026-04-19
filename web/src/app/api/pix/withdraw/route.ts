import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const BRL_PER_SOL = 800;

function mockPixId() {
  return 'E' + Array.from({ length: 31 }, () =>
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
  ).join('');
}

export async function POST(request: NextRequest) {
  let body: { solAmount?: unknown; pixKey?: unknown; signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { solAmount, pixKey, signature } = body;

  if (typeof solAmount !== 'number' || solAmount <= 0) {
    return Response.json({ error: 'solAmount (number > 0) required' }, { status: 400 });
  }
  if (typeof pixKey !== 'string' || pixKey.trim().length < 3) {
    return Response.json({ error: 'pixKey required' }, { status: 400 });
  }

  const brlGross = solAmount * BRL_PER_SOL;
  const cifraFeeBrl = 0;
  const pixFeeBrl = 0;
  const brlNet = brlGross - cifraFeeBrl - pixFeeBrl;

  return Response.json({
    pixId: mockPixId(),
    solAmount,
    brlGross,
    brlNet,
    pixKey,
    rate: BRL_PER_SOL,
    signature: signature ?? null,
    fees: {
      pix: { brl: pixFeeBrl, label: 'PIX' },
      cifra: { brl: cifraFeeBrl, label: 'Cifra (spread)' },
      totalBrl: pixFeeBrl + cifraFeeBrl,
    },
    timestamp: Date.now(),
  });
}
