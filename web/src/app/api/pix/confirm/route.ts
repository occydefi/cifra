import { NextRequest } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

export const runtime = 'nodejs';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
const BRL_PER_SOL = 800;

function loadTreasury(): Keypair {
  const secret = process.env.TREASURY_PRIVATE_KEY;
  if (!secret) throw new Error('TREASURY_PRIVATE_KEY not configured');
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export async function POST(request: NextRequest) {
  let body: { recipient?: unknown; brlAmount?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { recipient, brlAmount } = body;

  if (typeof recipient !== 'string' || typeof brlAmount !== 'number' || brlAmount <= 0) {
    return Response.json(
      { error: 'recipient (string) and brlAmount (number > 0) required' },
      { status: 400 }
    );
  }

  let recipientPubkey: PublicKey;
  try {
    recipientPubkey = new PublicKey(recipient);
  } catch {
    return Response.json({ error: 'Invalid Solana pubkey' }, { status: 400 });
  }

  const solAmount = brlAmount / BRL_PER_SOL;
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const treasury = loadTreasury();
  const connection = new Connection(RPC, 'confirmed');

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const tx = new Transaction({
    feePayer: treasury.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: recipientPubkey,
      lamports,
    })
  );

  tx.sign(treasury);

  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed'
  );

  // Real Solana fee is 5000 lamports (base) per signature; treasury pays it
  const networkFeeSol = 5000 / LAMPORTS_PER_SOL;

  return Response.json({
    signature,
    solAmount,
    brlAmount,
    rate: BRL_PER_SOL,
    fees: {
      pix: { brl: 0, label: 'PIX' },
      network: { sol: networkFeeSol, label: 'Rede Solana' },
      cifra: { brl: 0, label: 'Cifra (spread)' },
      totalBrl: 0,
    },
    timestamp: Date.now(),
  });
}
