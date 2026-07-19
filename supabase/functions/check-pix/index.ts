import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TRACKR_WEBHOOK = 'https://trackr-br.lovable.app/api/public/webhook/orders?secret=c7076459f0c8601a3c4e009ed7d867c7e54825c1dcda0216';
const notified = new Set<string>();

async function fireTrackrWebhook(transactionId: string, raw: Record<string, unknown>, order?: Record<string, unknown>) {
  if (notified.has(transactionId)) return;
  notified.add(transactionId);
  try {
    const payload = {
      event: 'order.paid',
      transactionId,
      status: 'PAID',
      paidAt: new Date().toISOString(),
      customer: order?.customer ?? null,
      address: order?.address ?? null,
      items: order?.items ?? null,
      amount: order?.amount ?? raw?.valor ?? null,
      gateway: 'zuckpay',
      raw,
    };
    const resp = await fetch(TRACKR_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Trackr webhook status', resp.status);
    if (!resp.ok) {
      const t = await resp.text();
      console.error('Trackr webhook failed:', t);
      notified.delete(transactionId); // allow retry
    }
  } catch (e) {
    console.error('Trackr webhook error:', e);
    notified.delete(transactionId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('ZUCKPAY_CLIENT_ID');
    const clientSecret = Deno.env.get('ZUCKPAY_SECRET_KEY');
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'ZuckPay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { transactionId, order } = body as { transactionId?: string; order?: Record<string, unknown> };
    if (!transactionId || typeof transactionId !== 'string') {
      return new Response(JSON.stringify({ error: 'transactionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = `https://www.zuckpay.com.br/conta/v3/pix/status?transactionId=${encodeURIComponent(transactionId)}`;
    const basic = btoa(`${clientId}:${clientSecret}`);
    const resp = await fetch(url, {
      headers: { 'Authorization': `Basic ${basic}`, 'Accept': 'application/json' },
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error(`Zuckpay check error [${resp.status}]:`, text);
      return new Response(JSON.stringify({ error: 'Zuckpay request failed', status: resp.status, details: text }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = JSON.parse(text);
    const status: string = (data?.status || 'PENDING').toString();
    const paid = status.toUpperCase() === 'PAID';

    if (paid) {
      // fire-and-forget so the response is not delayed
      fireTrackrWebhook(transactionId, data, order);
    }

    return new Response(JSON.stringify({ status, paid, raw: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('check-pix error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
