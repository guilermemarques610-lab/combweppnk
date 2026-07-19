import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('ZUCKPAY_CLIENT_ID');
    const clientSecret = Deno.env.get('ZUCKPAY_SECRET_KEY');
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'ZuckPay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { transactionId } = await req.json();
    if (!transactionId || typeof transactionId !== 'string') {
      return new Response(JSON.stringify({ error: 'transactionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = `https://www.zuckpay.com.br/conta/v3/pix/status?transactionId=${encodeURIComponent(transactionId)}`;
    const basic = btoa(`${clientId}:${clientSecret}`);
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Basic ${basic}`,
        'Accept': 'application/json',
      },
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

    return new Response(JSON.stringify({ status, paid, raw: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('check-pix error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
