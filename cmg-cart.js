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

// ── Add to Cart ───────────────────────────────────────────────────────────────
function cmgAddToCart(priceId, qty, variant, nameOverride, imgOverride) {
  qty = qty || 1;
  variant = variant || '';
  const cart = getCart();
  const key = priceId + (variant ? '|' + variant : '');
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    let name = nameOverride || '';
    let img = imgOverride || '';
    if (!name) {
      document.querySelectorAll('.product-card').forEach(card => {
        const btn = card.querySelector('[onclick*="' + priceId + '"]');
        if (btn) {
          const h3 = card.querySelector('h3');
          if (h3) name = h3.textContent.trim();
          const imgEl = card.querySelector('img');
          if (imgEl) img = imgEl.src;
        }
      });
    }
    if (!name) name = priceId;
    cart.push({ key, priceId, name, variant, qty, img });
  }
  saveCart(cart);
  renderCart();
  openCart();
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
  cmgAddToCart(priceId, 1, variant);
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

  const subtotalPence = cart.reduce((sum, item) => {
    // We don't store prices client-side — subtotal is estimated from qty
    return sum + item.qty;
  }, 0);

  container.innerHTML = cart.map((item, idx) => `
    <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #f0e8e6;align-items:flex-start;">
      ${item.img ? `<img src="${item.img}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.display='none'">` : ''}
      <div style="flex:1;min-width:0;">
        <p style="font-size:13px;font-weight:700;color:#1e1e1e;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
        ${item.variant ? `<p style="font-size:11px;color:#888;margin-bottom:4px;">Scent: ${item.variant}</p>` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
          <button onclick="cmgUpdateQty(${idx},-1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">−</button>
          <span style="font-size:13px;min-width:20px;text-align:center;">${item.qty}</span>
          <button onclick="cmgUpdateQty(${idx},1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">+</button>
          <button onclick="cmgRemoveItem(${idx})" style="margin-left:auto;background:none;border:none;color:#aaa;cursor:pointer;font-size:18px;line-height:1;padding:0;">×</button>
        </div>
      </div>
    </div>
  `).join('');

  // Delivery nudge
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const deliveryMsg = document.getElementById('cmg-delivery-msg');
  if (deliveryMsg) {
    // We can't know exact subtotal without prices, so show generic free delivery message
    deliveryMsg.textContent = totalQty > 0 ? 'Free UK delivery on orders over £30 🎁' : '';
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
    // Calculate subtotal in pence — we need prices
    // Pass items to edge function; it handles shipping
    const items = cart.map(item => ({
      price_id: item.priceId,
      quantity: item.qty,
      variant: item.variant || ''
    }));

    // Estimate subtotal — we don't store prices so pass 0 and let Stripe decide shipping
    const res = await fetch(CMG_CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, subtotal: 0 })
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
