// ── Crafty Mouse Gifts — Cart Drawer ─────────────────────────────────────────
// Handles add to basket, cart drawer UI, and Stripe checkout

const CMG_CHECKOUT_URL = 'https://qvkosdqcryrcfbjtaxic.supabase.co/functions/v1/cmg-checkout';
const CMG_FREE_DELIVERY = 3000; // £30 in pence
const CMG_DELIVERY_COST = 395;  // £3.95 in pence

// ── Cart State ────────────────────────────────────────────────────────────────
function getCart() {
  try { return JSON.parse(localStorage.getItem('cmg_cart') || '[]'); }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cmg_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cmg-cart-badge');
  if (badge) {
    badge.textContent = total > 0 ? String(total) : '';
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

// ── Price parsing helper ─────────────────────────────────────────────────────
// Reads a price string like "£16.00" or "£3.50" and returns pence (1600, 350).
// Returns null if it can't confidently parse a price.
function cmgParsePriceToPence(text) {
  if (!text) return null;
  const match = String(text).match(/[\d,]+\.\d{2}|\d+/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ''));
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

// ── Add to Cart ───────────────────────────────────────────────────────────────
function cmgAddToCart(priceId, qty, variant, nameOverride, imgOverride, pricePenceOverride, isBundle, bundleUnits) {
  qty = qty || 1;
  variant = variant || '';
  const cart = getCart();
  const key = priceId + (variant ? '|' + variant : '');
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
    // Backfill price on existing items if we're able to and it's missing
    if ((existing.pricePence === undefined || existing.pricePence === null)) {
      const found = cmgFindPriceForId(priceId);
      if (found !== null) existing.pricePence = found;
    }
  } else {
    let name = nameOverride || '';
    let img = imgOverride || '';
    let pricePence = (typeof pricePenceOverride === 'number') ? pricePenceOverride : null;

    // Only fall back to scanning the page when something is still missing —
    // but always try to fill in the image, even if name/price were already
    // supplied by the caller (e.g. cmgAddToCartWithScent), since a missing
    // image was previously silently skipped whenever name+price were known.
    if (!name || pricePence === null || !img) {
      document.querySelectorAll('.product-card').forEach(card => {
        const btn = card.querySelector('[onclick*="' + priceId + '"]');
        if (btn) {
          if (!name) {
            const h3 = card.querySelector('h3');
            if (h3) name = h3.textContent.trim();
          }
          const imgEl = card.querySelector('img');
          if (!img && imgEl) img = imgEl.src;
          if (pricePence === null) {
            const priceEl = card.querySelector('.price');
            if (priceEl) pricePence = cmgParsePriceToPence(priceEl.textContent);
          }
        }
      });
    }
    if (!name) name = priceId;
    if (pricePence === null) pricePence = cmgFindPriceForId(priceId);

    cart.push({ key, priceId, name, variant, qty, img, pricePence, isBundle: !!isBundle, bundleUnits: bundleUnits || 1 });
  }
  saveCart(cart);
  renderCart();
  openCart();
}

// Fallback lookup: scan the whole document (not just visible cards) for any
// element referencing this priceId, in case the product-card structure
// differs on a given page (e.g. gift bundles, product detail modals).
function cmgFindPriceForId(priceId) {
  const btn = document.querySelector('[onclick*="' + priceId + '"]');
  if (!btn) return null;
  const card = btn.closest('.product-card') || btn.parentElement;
  if (!card) return null;
  const priceEl = card.querySelector('.price');
  if (!priceEl) return null;
  return cmgParsePriceToPence(priceEl.textContent);
}

// Detects "N for £X" style bundle-deal variant text (e.g. "3 for £10 bundle")
// and returns { units, totalPence } — the number of physical items included
// and the flat total price in pence — or null if the variant text isn't a
// bundle deal. Generalised so any future "X for £Y" option anywhere on the
// site is handled automatically, not just this one product.
function cmgParseBundleDeal(variantText) {
  if (!variantText) return null;
  const match = String(variantText).match(/(\d+)\s*for\s*£\s*([\d,]+(?:\.\d{2})?)/i);
  if (!match) return null;
  const units = parseInt(match[1], 10);
  const pounds = parseFloat(match[2].replace(/,/g, ''));
  if (!units || isNaN(pounds)) return null;
  return { units: units, totalPence: Math.round(pounds * 100) };
}

// ── Scent/Variant wrapper ─────────────────────────────────────────────────────
function cmgAddToCartWithScent(btn, priceId, productName) {
  const card = btn.closest('.product-card');
  const select = card ? card.querySelector('.scent-select') : null;

  if (select && !select.value) {
    select.classList.remove('cmg-shake');
    void select.offsetWidth;
    select.classList.add('cmg-shake');
    select.style.borderColor = '#e46d69';

    let msg = card.querySelector('.scent-required-msg');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'scent-required-msg';
      msg.style.cssText = 'color:#e46d69;font-size:12px;margin-top:4px;';
      select.parentNode.insertBefore(msg, select.nextSibling);
    }
    msg.textContent = 'Please select a scent first';
    msg.style.display = 'block';
    setTimeout(() => select.classList.remove('cmg-shake'), 500);
    return;
  }

  const variant = select ? select.value : '';
  const msg = card ? card.querySelector('.scent-required-msg') : null;
  if (msg) msg.style.display = 'none';

  const bundle = cmgParseBundleDeal(variant);
  const isBundle = !!bundle;

  let pricePence = bundle ? bundle.totalPence : null;
  let img = '';
  if (card) {
    const imgEl = card.querySelector('img');
    if (imgEl) img = imgEl.src;
    if (pricePence === null) {
      const priceEl = card.querySelector('.price');
      if (priceEl) pricePence = cmgParsePriceToPence(priceEl.textContent);
    }
  }

  cmgAddToCart(priceId, 1, variant, productName || '', img, pricePence, isBundle, bundle ? bundle.units : 1);
}

// ── Mix-and-match bundle wrapper ─────────────────────────────────────────────
// Used by "Build Your Bundle" cards where the customer picks 3 DIFFERENT
// products for one flat price, rather than 3 of the same item (that's
// cmgAddToCartWithScent's job). Adds a single cart line representing all 3
// chosen items together.
function cmgAddBundleToCart(btn) {
  const card = btn.closest('.product-card');
  if (!card) return;
  const selects = Array.from(card.querySelectorAll('.bundle-scent-select'));

  let allChosen = true;
  selects.forEach(sel => {
    if (!sel.value) {
      allChosen = false;
      sel.classList.remove('cmg-shake');
      void sel.offsetWidth;
      sel.classList.add('cmg-shake');
      sel.style.borderColor = '#e46d69';
      setTimeout(() => sel.classList.remove('cmg-shake'), 500);
    }
  });

  let msg = card.querySelector('.scent-required-msg');
  if (!allChosen) {
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'scent-required-msg';
      msg.style.cssText = 'color:#e46d69;font-size:12px;margin-top:4px;';
      const lastSelect = selects[selects.length - 1];
      if (lastSelect) lastSelect.parentNode.insertBefore(msg, lastSelect.nextSibling);
    }
    msg.textContent = 'Please choose all 3 scents';
    msg.style.display = 'block';
    return;
  }
  if (msg) msg.style.display = 'none';

  const chosen = selects.map(sel => sel.value);
  const priceEl = card.querySelector('.price');
  const pricePence = priceEl ? cmgParsePriceToPence(priceEl.textContent) : 1000;
  const imgEl = card.querySelector('img');
  const img = imgEl ? imgEl.src : '';

  const name = 'Wax Melt Bundle (3 for £10)';
  const variant = chosen.join(', ');
  // Stable synthetic price ID per distinct scent combo, so the same combo
  // stacks as one cart line while a different combo becomes a new line —
  // this isn't a real Stripe Price; the checkout builds an inline price for
  // bundle items instead (see cmgCheckout below).
  const priceId = 'cmg-bundle-' + chosen.slice().sort().join('|').toLowerCase().replace(/[^a-z0-9|]+/g, '');

  cmgAddToCart(priceId, 1, variant, name, img, pricePence, true, 3);
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function openCart() {
  const drawer = document.getElementById('cmg-cart-drawer');
  const overlay = document.getElementById('cmg-cart-overlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  renderCart();
}

function closeCart() {
  const drawer = document.getElementById('cmg-cart-drawer');
  const overlay = document.getElementById('cmg-cart-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function cmgFormatPence(pence) {
  return '£' + (pence / 100).toFixed(2);
}

function renderCart() {
  const container = document.getElementById('cmg-cart-items');
  const footer = document.getElementById('cmg-cart-footer');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:32px 16px;font-size:14px;">Your basket is empty 🛒</p>';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  // Real subtotal — sum of stored per-item prices. If an item is missing a
  // price (e.g. an older cart saved before this fix, or a product whose
  // price couldn't be found on the page), we flag it rather than silently
  // undercounting.
  let subtotalPence = 0;
  let hasUnknownPrice = false;
  cart.forEach(item => {
    if (typeof item.pricePence === 'number' && !isNaN(item.pricePence)) {
      subtotalPence += item.pricePence * item.qty;
    } else {
      hasUnknownPrice = true;
    }
  });

  container.innerHTML = cart.map((item, idx) => `
    <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f0e8e6;align-items:flex-start;">
      ${item.img ? `<img src="${item.img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
      <div style="flex:1;min-width:0;">
        <p style="font-size:13px;font-weight:700;color:#1e1e1e;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
        ${item.variant ? `<p style="font-size:11px;color:#888;margin-bottom:4px;">Scent: ${item.variant}</p>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <button onclick="cmgUpdateQty(${idx},-1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="${item.bundleUnits > 1 ? 'Remove 1 bundle (' + item.bundleUnits + ' items)' : ''}">−</button>
            <span style="font-size:13px;min-width:20px;text-align:center;">${item.qty * (item.bundleUnits || 1)}</span>
            <button onclick="cmgUpdateQty(${idx},1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" title="${item.bundleUnits > 1 ? 'Add 1 more bundle (' + item.bundleUnits + ' items)' : ''}">+</button>
            <button onclick="cmgRemoveItem(${idx})" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:18px;line-height:1;padding:0;">×</button>
          </div>
          <span style="font-size:13px;font-weight:700;color:#1e1e1e;white-space:nowrap;">${typeof item.pricePence === 'number' ? cmgFormatPence(item.pricePence * item.qty) : '—'}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Subtotal line
  let subtotalEl = document.getElementById('cmg-cart-subtotal');
  if (!subtotalEl && footer) {
    subtotalEl = document.createElement('div');
    subtotalEl.id = 'cmg-cart-subtotal';
    subtotalEl.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:700;color:#1e1e1e;margin-bottom:10px;';
    footer.insertBefore(subtotalEl, footer.firstChild);
  }
  if (subtotalEl) {
    subtotalEl.innerHTML = hasUnknownPrice
      ? `<span>Subtotal</span><span>${cmgFormatPence(subtotalPence)}+</span>`
      : `<span>Subtotal</span><span>${cmgFormatPence(subtotalPence)}</span>`;
  }

  // Delivery nudge — based on the real subtotal, not just "cart has items"
  const deliveryMsg = document.getElementById('cmg-delivery-msg');
  if (deliveryMsg) {
    if (hasUnknownPrice) {
      // We couldn't price every item confidently — don't claim a threshold we can't verify
      deliveryMsg.textContent = 'Free UK delivery on orders over £30 🎁';
    } else if (subtotalPence >= CMG_FREE_DELIVERY) {
      deliveryMsg.textContent = "🎉 You've unlocked free UK delivery!";
    } else {
      const remaining = CMG_FREE_DELIVERY - subtotalPence;
      deliveryMsg.textContent = `Add ${cmgFormatPence(remaining)} more for free UK delivery 🎁`;
    }
  }
}

function cmgUpdateQty(idx, delta) {
  const cart = getCart();
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

function cmgRemoveItem(idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

// ── Checkout ──────────────────────────────────────────────────────────────────
async function cmgCheckout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const btn = document.getElementById('cmg-checkout-btn');
  if (btn) { btn.textContent = 'Preparing checkout…'; btn.disabled = true; }

  try {
    const items = cart.map(item => {
      const base = {
        price_id: item.priceId,
        quantity: item.qty,
        variant: item.variant || ''
      };
      // Bundle deals (e.g. "3 for £10") aren't a real Stripe Price — the
      // catalogue price ID is still the single-item price. Send the flat
      // bundle amount + a name so the edge function can build an inline
      // Stripe price instead of charging quantity × single-item price.
      if (item.isBundle && typeof item.pricePence === 'number') {
        base.unit_amount = item.pricePence;
        base.name = item.name + (item.variant ? ' — ' + item.variant : '');
      }
      return base;
    });

    // Real subtotal in pence, computed from the prices we tracked when items
    // were added. Falls back to 0 only if every item is missing a price
    // (e.g. a very old cart from before this fix) — the edge function/Stripe
    // remains the source of truth for the actual charge either way.
    const subtotal = cart.reduce((sum, item) => {
      return sum + (typeof item.pricePence === 'number' ? item.pricePence * item.qty : 0);
    }, 0);

    const res = await fetch(CMG_CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, subtotal })
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Checkout failed');
    }
  } catch(e) {
    alert('Sorry, checkout failed: ' + e.message + '\nPlease try again or contact us.');
    if (btn) { btn.textContent = 'Checkout'; btn.disabled = false; }
  }
}

// ── Inject Cart UI ────────────────────────────────────────────────────────────
function cmgInjectCart() {
  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #cmg-cart-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9000;opacity:0;pointer-events:none;transition:opacity .3s; }
    #cmg-cart-overlay.open { opacity:1;pointer-events:auto; }
    #cmg-cart-drawer { position:fixed;top:0;right:0;bottom:0;width:min(380px,100vw);background:#fff;z-index:9001;transform:translateX(100%);transition:transform .3s;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.12); }
    #cmg-cart-drawer.open { transform:translateX(0); }
    #cmg-cart-header { padding:20px;border-bottom:1px solid #f0e8e6;display:flex;align-items:center;justify-content:space-between; }
    #cmg-cart-header h3 { font-family:'Cormorant Garamond',Georgia,serif;font-size:1.3rem;font-weight:400;margin:0; }
    #cmg-cart-close { background:none;border:none;font-size:1.6rem;cursor:pointer;color:#888;padding:0;line-height:1; }
    #cmg-cart-items { flex:1;overflow-y:auto;padding:0 20px; }
    #cmg-cart-footer { padding:16px 20px;border-top:1px solid #f0e8e6; }
    #cmg-delivery-msg { font-size:12px;color:#e46d69;text-align:center;margin-bottom:10px;font-weight:600; }
    #cmg-checkout-btn { width:100%;background:#e46d69;color:#fff;border:none;padding:15px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s; }
    #cmg-checkout-btn:hover { background:#c4524e; }
    #cmg-checkout-btn:disabled { opacity:.6;cursor:not-allowed; }
    @keyframes cmg-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    .cmg-shake { animation:cmg-shake 0.4s ease;border-color:#e46d69!important; }
  `;
  document.head.appendChild(style);

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'cmg-cart-overlay';
  overlay.addEventListener('click', closeCart);
  document.body.appendChild(overlay);

  // Drawer
  const drawer = document.createElement('div');
  drawer.id = 'cmg-cart-drawer';
  drawer.innerHTML = `
    <div id="cmg-cart-header">
      <h3>🛒 Your Basket</h3>
      <button id="cmg-cart-close" onclick="closeCart()">×</button>
    </div>
    <div id="cmg-cart-items"></div>
    <div id="cmg-cart-footer" style="display:none;">
      <p id="cmg-delivery-msg"></p>
      <button id="cmg-checkout-btn" onclick="cmgCheckout()">Checkout</button>
    </div>
  `;
  document.body.appendChild(drawer);

  updateCartBadge();
}

// ── Init ──────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmgInjectCart);
} else {
  cmgInjectCart();
}
