import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const secret = Deno.env.get('ZUCKPAY_SECRET_KEY');
    if (!secret) {
      return new Response(JSON.stringify({ error: 'ZUCKPAY_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { transactionId } = await req.json();
    if (!transactionId || typeof transactionId !== 'string') {
      return new Response(JSON.stringify({ error: 'transactionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resp = await fetch(`https://api.zuckpay.com.br/v1/transactions/${encodeURIComponent(transactionId)}`, {
      headers: {
        'Authorization': `Bearer ${secret}`,
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
    const status: string = data?.status || 'pending';
    // Common paid statuses across Brazilian PSPs
    const paid = ['paid', 'approved', 'completed', 'confirmed'].includes(status.toLowerCase());

    return new Response(JSON.stringify({ status, paid, raw: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('check-pix error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
