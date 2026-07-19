import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  amount: z.number().positive(), // in BRL, decimal (e.g., 45.90)
  customer: z.object({
    name: z.string().min(2).max(150),
    email: z.string().email().max(255),
    document: z.string().min(11).max(14), // CPF (digits only or formatted)
    phone: z.string().min(10).max(15),
  }),
  address: z.object({
    zipCode: z.string().min(8).max(9),
    street: z.string().min(1).max(200),
    number: z.string().min(1).max(20),
    complement: z.string().max(100).optional().default(''),
    neighborhood: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    state: z.string().length(2),
  }).optional(),
  items: z.array(z.object({
    title: z.string().min(1).max(200),
    unitPrice: z.number().positive(), // BRL decimal
    quantity: z.number().int().positive(),
  })).min(1),
});

const ZUCKPAY_URL = 'https://api.zuckpay.com.br/v1/transactions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const secret = Deno.env.get('ZUCKPAY_SECRET_KEY');
    if (!secret) {
      return new Response(JSON.stringify({ error: 'ZUCKPAY_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { amount, customer, address, items } = parsed.data;

    const cpfDigits = customer.document.replace(/\D/g, '');
    const phoneDigits = customer.phone.replace(/\D/g, '');
    const amountCents = Math.round(amount * 100);

    const payload = {
      amount: amountCents,
      paymentMethod: 'pix',
      customer: {
        name: customer.name,
        email: customer.email,
        document: { number: cpfDigits, type: 'cpf' },
        phone: phoneDigits,
      },
      ...(address && {
        shipping: {
          address: {
            zipCode: address.zipCode.replace(/\D/g, ''),
            street: address.street,
            streetNumber: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            country: 'BR',
          },
        },
      }),
      items: items.map((it) => ({
        title: it.title,
        unitPrice: Math.round(it.unitPrice * 100),
        quantity: it.quantity,
        tangible: false,
      })),
    };

    console.log('Creating PIX with Zuckpay for amount', amountCents);

    const resp = await fetch(ZUCKPAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
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
    // Normalize response shape for the frontend
    const pixCode = data?.pix?.qrcode || data?.pix?.code || data?.pix?.payload || data?.qrcode || data?.qr_code || '';
    const pixQrImage = data?.pix?.qrcode_image || data?.pix?.qrCodeImage || data?.qr_code_base64 || '';
    const transactionId = data?.id || data?.transactionId || data?.transaction_id || '';
    const status = data?.status || 'pending';

    return new Response(JSON.stringify({ transactionId, pixCode, pixQrImage, status, raw: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('create-pix error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
