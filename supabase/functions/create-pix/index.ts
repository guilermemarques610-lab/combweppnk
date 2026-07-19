import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  amount: z.number().positive(),
  customer: z.object({
    name: z.string().min(2).max(150),
    email: z.string().email().max(255),
    document: z.string().min(11).max(14),
    phone: z.string().min(8).max(20),
  }),
  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  items: z.array(z.object({
    title: z.string(),
    unitPrice: z.number(),
    quantity: z.number(),
  })).optional(),
  externalId: z.string().optional(),
});

const ZUCKPAY_URL = 'https://www.zuckpay.com.br/conta/v3/pix/qrcode';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('ZUCKPAY_CLIENT_ID');
    const clientSecret = Deno.env.get('ZUCKPAY_SECRET_KEY');
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'ZuckPay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { amount, customer, items, externalId } = parsed.data;

    const cpfDigits = customer.document.replace(/\D/g, '');
    const phoneDigits = customer.phone.replace(/\D/g, '');

    const descricao = items && items.length
      ? items.map((it) => `${it.quantity}x ${it.title}`).join(', ').slice(0, 200)
      : 'Compra online';

    const payload: Record<string, unknown> = {
      nome: customer.name,
      cpf: cpfDigits,
      valor: Number(amount.toFixed(2)),
      email: customer.email,
      telefone: phoneDigits,
      descricao,
    };
    if (externalId) payload.external_id_client = externalId;

    console.log('Creating PIX with Zuckpay for amount', payload.valor);

    const basic = btoa(`${clientId}:${clientSecret}`);
    const resp = await fetch(ZUCKPAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error(`Zuckpay error [${resp.status}]:`, text);
      return new Response(JSON.stringify({ error: 'Zuckpay request failed', status: resp.status, details: text }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = JSON.parse(text);
    const pixCode = data?.pix_code || data?.qrcode || '';
    const pixQrImage = data?.qrcode_image || '';
    const transactionId = data?.transactionId || '';
    const status = data?.status || 'PENDING';

    return new Response(JSON.stringify({ transactionId, pixCode, pixQrImage, status, raw: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('create-pix error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
