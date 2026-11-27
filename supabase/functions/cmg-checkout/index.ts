import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ── Crafty Mouse Gifts — Stripe Checkout Edge Function ──────────────
// Lives in the CLPeasy Supabase project but handles CMG payments only.
// Uses the CRAFTYMOUSE_STRIPE_SECRET_KEY secret (separate from CLPeasy).
// Free delivery automatically applied for orders >= £30.
// ────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = ['https://craftymousegifts.com', 'https://www.craftymousegifts.com', 'https://craftymousegifts.netlify.app'];
const SALE_START = Date.parse('2026-11-27T00:00:00Z');
const SALE_END = Date.parse('2026-12-01T00:00:00Z');
const CMG_CLASSIC_CANDLE_PRICES = new Set([
  'price_1TizjiQpAVWZATGhr6BBDNsF',
  'price_1TizjjQpAVWZATGhh7ePcWgj',
  'price_1TizjkQpAVWZATGhuNg9ZC0S',
  'price_1TizjlQpAVWZATGhsQ6b4ljE',
  'price_1TizjlQpAVWZATGhbxTNpelA',
  'price_1TizjmQpAVWZATGhUX38EXSj',
  'price_1TizjnQpAVWZATGhDJRlYLf1',
  'price_1TizjoQpAVWZATGhm7AA2ALS',
  'price_1TizjoQpAVWZATGhPwdKVSCH',
  'price_1TizjpQpAVWZATGhvJvVs2t9',
  'price_1TizjqQpAVWZATGhHRTq54Sj',
  'price_1TizjrQpAVWZATGhAlnTIndW',
  'price_1TizjsQpAVWZATGhkaq4Mybg',
  'price_1TizjsQpAVWZATGhCKC1yWSZ',
]);

function cmgSaleUnitPence(pricePence: number, priceId: string) {
  return Math.ceil(pricePence / (CMG_CLASSIC_CANDLE_PRICES.has(priceId) ? 4 : 2));
}

const FREE_DELIVERY_THRESHOLD = 3000; // £30 in pence

// ── Mix-and-match bundle discount, recomputed here (not trusted from the
// client). Any 3 items whose price_id is in a group's set get discounted to
// that group's flat set price.
//
// Preferred display: keep every line item at its full price and apply the
// discount as a separate Stripe Coupon (shows as a red "-£0.50" line on the
// Stripe payment page). If coupon creation fails for any reason (e.g. API
// key permissions), we fall back to folding the discount directly into one
// line item's price so the customer is never overcharged — just without the
// pretty discount line — and log the real Stripe error either way.
interface BundleGroupConfig {
  setSize: number;
  setPricePence: number;
  unitPence: number;
  priceIds: Set<string>;
  names: Record<string, string>;
}

const BUNDLE_GROUPS: BundleGroupConfig[] = [
  {
    setSize: 3,
    setPricePence: 1000, // £10 for any 3
    unitPence: 350,      // normal single-item price
    priceIds: new Set([
      'price_1TizjdQpAVWZATGhRqPPieqi',
      'price_1TizjeQpAVWZATGhKKnnvDmv',
      'price_1TizjfQpAVWZATGhGxX6aIxQ',
      'price_1TizjcQpAVWZATGhm9xuDp25',
      'price_1TizjdQpAVWZATGhXMxWy5ls',
    ]),
    names: {
      'price_1TizjdQpAVWZATGhRqPPieqi': 'Passionfruit Martini & Coconut Wax Melt',
      'price_1TizjeQpAVWZATGhKKnnvDmv': 'Passionfruit Martini Wax Melt',
      'price_1TizjfQpAVWZATGhGxX6aIxQ': 'Cosmic Plum & Saffron Wax Melt',
      'price_1TizjcQpAVWZATGhm9xuDp25': 'Champagne Toast Wax Melt',
      'price_1TizjdQpAVWZATGhXMxWy5ls': 'Champagne Grapes & Roses Wax Melt',
    },
  },
];

function findGroup(priceId: string): BundleGroupConfig | null {
  for (const g of BUNDLE_GROUPS) {
    if (g.priceIds.has(priceId)) return g;
  }
  return null;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // Temporary CMG-only ordering pause, 14 Nov 2026.
  // Return before reading payment credentials or creating any Stripe session.
  if (req.method === 'POST' && Deno.env.get('CMG_ORDERING_ENABLED') !== 'true') {
    return new Response(JSON.stringify({ error: 'Online ordering is temporarily unavailable. Please check back soon.', code: 'CMG_ORDERING_PAUSED' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const STRIPE_SECRET = Deno.env.get('CRAFTYMOUSE_STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET) throw new Error('Stripe key not configured');

    const { items } = await req.json();
    type Item = { price_id: string; quantity: number; variant?: string };
    const validItem = (item: Item) => item && typeof item.price_id === 'string' &&
      /^price_[A-Za-z0-9]+$/.test(item.price_id) &&
      Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99 &&
      (item.variant === undefined || (typeof item.variant === 'string' && item.variant.length <= 100));

    if (!Array.isArray(items) || items.length === 0 || items.length > 100 || !items.every(validItem)) {
      return new Response(JSON.stringify({ error: 'Please check the items in your basket.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const typedItems = items as Item[];
    const priceIds = [...new Set(typedItems.map(item => item.price_id))];
    const prices = new Map(await Promise.all(priceIds.map(async id => {
      const response = await fetch('https://api.stripe.com/v1/prices/' + id, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
      });
      const price = await response.json();
      if (!response.ok || !price.active || price.currency !== 'gbp' ||
          price.type !== 'one_time' || !Number.isSafeInteger(price.unit_amount) ||
          typeof price.product !== 'string') {
        throw new Error('A product in your basket is unavailable. Please refresh the shop.');
      }
      return [id, { unit: price.unit_amount as number, product: price.product as string }] as const;
    })));
    const now = Date.now();
    const sale = now >= SALE_START && now < SALE_END;
    const subtotal = typedItems.reduce((total, item) => {
      const unit = prices.get(item.price_id)!.unit;
      return total + (sale ? cmgSaleUnitPence(unit, item.price_id) : unit) * item.quantity;
    }, 0);
    const params: Record<string, string> = {
      mode: 'payment',
      success_url: 'https://craftymousegifts.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://craftymousegifts.com/shop.html',
      'shipping_address_collection[allowed_countries][0]': 'GB',
      'payment_method_types[0]': 'card',
      'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
      'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'gbp',
    };

    let lineIndex = 0;
    const variantNotesList: string[] = [];

    const picksByGroup = new Map<BundleGroupConfig, { price_id: string; variant?: string }[]>();
    const normalItems: Item[] = [];

    typedItems.forEach((item) => {
      const group = findGroup(item.price_id);
      if (!sale && group) {
        if (!picksByGroup.has(group)) picksByGroup.set(group, []);
        const picks = picksByGroup.get(group)!;
        for (let i = 0; i < item.quantity; i++) {
          picks.push({ price_id: item.price_id, variant: item.variant });
        }
      } else {
        normalItems.push(item);
      }
      if (item.variant) variantNotesList.push(item.variant);
    });

    // Total bundle discount across all groups (used for the coupon attempt).
    let totalDiscountPence = 0;
    picksByGroup.forEach((picks, group) => {
      const completeSets = Math.floor(picks.length / group.setSize);
      const discountPerSet = Math.max(0, group.setSize * group.unitPence - group.setPricePence);
      totalDiscountPence += completeSets * discountPerSet;
    });

    // Try the coupon route first so Stripe shows a clean "-£0.50" discount
    // line with every item kept at its normal price.
    let couponId: string | null = null;
    if (totalDiscountPence > 0) {
      try {
        const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount_off: String(totalDiscountPence),
            currency: 'gbp',
            duration: 'once',
            name: 'Mix & Match Wax Melt Discount',
          }).toString(),
        });
        const couponData = await couponRes.json();
        if (couponRes.ok && couponData.id) {
          couponId = couponData.id;
          console.log('Bundle discount coupon created:', couponData.id, 'amount_off:', totalDiscountPence);
        } else {
          console.error('Coupon creation failed, falling back to per-item pricing. Stripe response:', JSON.stringify(couponData));
        }
      } catch (couponErr) {
        console.error('Coupon creation threw an error, falling back to per-item pricing:', couponErr);
      }
    }

    // Bundle picks: if we have a working coupon, every pick is priced at the
    // full unit price (the coupon does the discounting). Otherwise, fall back
    // to discounting the first pick of each complete set directly so the
    // total is still correct even without the coupon.
    picksByGroup.forEach((picks, group) => {
      for (let i = 0; i < picks.length; i += group.setSize) {
        const chunk = picks.slice(i, i + group.setSize);
        const isCompleteSet = chunk.length === group.setSize;
        const discountPerSet = (!couponId && isCompleteSet) ? Math.max(0, group.setSize * group.unitPence - group.setPricePence) : 0;
        chunk.forEach((pick, idx) => {
          const unitAmount = (discountPerSet > 0 && idx === 0) ? group.unitPence - discountPerSet : group.unitPence;
          const name = group.names[pick.price_id] || 'Wax Melt';
          params[`line_items[${lineIndex}][price_data][currency]`] = 'gbp';
          params[`line_items[${lineIndex}][price_data][product_data][name]`] = name;
          params[`line_items[${lineIndex}][price_data][unit_amount]`] = String(Math.max(0, unitAmount));
          params[`line_items[${lineIndex}][quantity]`] = '1';
          if (pick.variant) {
            params[`metadata[item_${lineIndex}_variant]`] = pick.variant;
          }
          lineIndex++;
        });
      }
    });

    normalItems.forEach((item) => {
      if (sale) {
        const price = prices.get(item.price_id)!;
        params[`line_items[${lineIndex}][price_data][currency]`] = 'gbp';
        params[`line_items[${lineIndex}][price_data][product]`] = price.product;
        params[`line_items[${lineIndex}][price_data][unit_amount]`] = String(cmgSaleUnitPence(price.unit, item.price_id));
      } else {
        params[`line_items[${lineIndex}][price]`] = item.price_id;
      }
      params[`line_items[${lineIndex}][quantity]`] = String(item.quantity);
      if (item.variant) {
        params[`line_items[${lineIndex}][adjustable_quantity][enabled]`] = 'false';
        params[`metadata[item_${lineIndex}_variant]`] = item.variant;
      }
      lineIndex++;
    });

    if (couponId) {
      params['discounts[0][coupon]'] = couponId;
    } else if (!sale) {
      // No bundle coupon on this order — Stripe doesn't allow combining
      // `discounts` with `allow_promotion_codes`, so we only enable the
      // promo code box when there's no bundle discount already applied.
      params['allow_promotion_codes'] = 'true';
    }

    const freeDelivery = subtotal - totalDiscountPence >= FREE_DELIVERY_THRESHOLD;
    params['shipping_options[0][shipping_rate_data][display_name]'] = freeDelivery
      ? 'Free UK Delivery'
      : 'Standard UK Delivery (£3.95)';
    params['shipping_options[0][shipping_rate_data][fixed_amount][amount]'] = freeDelivery ? '0' : '395';
    if (sale) {
      params['metadata[offer]'] = 'Black Friday and Cyber Monday';
      params['expires_at'] = String(Math.floor(Math.min(now + 3600000, Math.max(SALE_END, now + 31 * 60000)) / 1000));
    }

    if (variantNotesList.length) {
      params['metadata[scent_choices]'] = variantNotesList.map((v, idx) => `Item ${idx + 1}: ${v}`).join(' | ');
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    const session = await response.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('CMG checkout error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});