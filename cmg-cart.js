/**
 * Crafty Mouse Gifts — Cart Drawer
 * Include this script on every CMG page.
 * Requires a cart icon trigger with id="cmg-cart-btn" in your nav.
 */

const CMG_CHECKOUT_URL = 'https://qvkosdqcryrcfbjtaxic.supabase.co/functions/v1/cmg-checkout';
const CMG_BRAND = '#e46d69';

// ── Product catalogue (generated from Stripe bulk import) ────────────
const CMG_PRODUCTS = [
  { id: 'price_1TizjOQpAVWZATGhbuWSBndO', name: 'Sacral Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888021/427x640.png' },
  { id: 'price_1TizjPQpAVWZATGhhMTCTIQL', name: 'The Wax Melt Treat', price: 1898, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888821/784x1176.JPG' },
  { id: 'price_1TizjQQpAVWZATGhwRJQwjWc', name: 'The Relaxation Box', price: 4699, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888819/784x1176.JPG' },
  { id: 'price_1TizjQQpAVWZATGhDMWQs4XY', name: 'The Luxury Home Spa', price: 5999, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888818/784x1176.JPG' },
  { id: 'price_1TizjRQpAVWZATGhoIRgWEG2', name: 'The Grand Occasion Gift Box', price: 5999, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888816/784x1176.JPG' },
  { id: 'price_1TizjSQpAVWZATGhWPcBdmMJ', name: 'The Eco Gifting Set', price: 4199, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888814/784x1176.JPG' },
  { id: 'price_1TizjTQpAVWZATGhWVSs7WsZ', name: "The Dad's Treat Box", price: 1898, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888812/784x1176.JPG' },
  { id: 'price_1TizjTQpAVWZATGh4CmdKhgQ', name: "The Candle Lover's Collection", price: 3699, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21888811/784x1176.JPG' },
  { id: 'price_1TizjUQpAVWZATGhMwjfNr6t', name: 'Clearance Collection – 5 Cell Wax Melt Bars', price: 150, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/6/21869983/1448x1086.png' },
  { id: 'price_1TizjVQpAVWZATGhgykZxsNa', name: 'Seashell Keyring', price: 499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/5/21859451/1024x1536.png' },
  { id: 'price_1TizjVQpAVWZATGh9cTfhm5s', name: 'Cylinder Style Wax Melt Warmer', price: 1698, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/2/21820499/1024x1536.png' },
  { id: 'price_1TizjWQpAVWZATGhaLKukUh0', name: 'Nordic Style Wax Melt Warmer', price: 1698, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/2/21820498/1024x1536.png' },
  { id: 'price_1TizjXQpAVWZATGh6BDvbvav', name: 'Handmade Arch Jesmonite Wax Melt Warmer', price: 1698, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/2/21820491/1024x1024.png' },
  { id: 'price_1TizjYQpAVWZATGhlRlqbD4x', name: 'Eco Resin Hamsa Tealight Holder', price: 1998, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/2/21820500/1536x1024.png' },
  { id: 'price_1TizjZQpAVWZATGhKaaFwLV9', name: "Mother's Day Bouquet", price: 2999, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21815487/360x359.jpg' },
  { id: 'price_1TizjaQpAVWZATGhHzLuPxhq', name: 'Eco-Friendly Jesmonite Candle', price: 2699, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/2/21820888/1024x1536.png' },
  { id: 'price_1TizjaQpAVWZATGhfGSdqY54', name: 'Celtic & Pagan Symbol Fridge Magnets', price: 399, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21811018/1025x1024.png' },
  { id: 'price_1TizjbQpAVWZATGhDSBnHfYU', name: 'Moon Face Fridge Magnets', price: 499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21811012/1363x1024.png' },
  { id: 'price_1TizjcQpAVWZATGhm9xuDp25', name: 'Champagne Toast (Snap Bar)', price: 299, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761156/1922x1134.jpeg' },
  { id: 'price_1TizjdQpAVWZATGhXMxWy5ls', name: 'Champagne Grapes & Roses (Snap Bar)', price: 299, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761152/1922x1134.jpeg' },
  { id: 'price_1TizjdQpAVWZATGhRqPPieqi', name: 'Passionfruit Martini & Coconut', price: 350, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761144/1024x1280.PNG' },
  { id: 'price_1TizjeQpAVWZATGhKKnnvDmv', name: 'Passionfruit Martini', price: 350, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761138/1024x1280.PNG' },
  { id: 'price_1TizjfQpAVWZATGhGxX6aIxQ', name: 'Cosmic Plum & Saffron (Wax Melt)', price: 350, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761132/1024x1280.PNG' },
  { id: 'price_1TizjgQpAVWZATGhgPwKnoNp', name: 'Champagne Toast (Clamshell)', price: 350, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761129/1600x2000.PNG' },
  { id: 'price_1TizjhQpAVWZATGhahzQ0sfg', name: 'Champagne Grapes & Roses (Clamshell)', price: 350, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/6/21761128/1024x1280.PNG' },
  { id: 'price_1TizjhQpAVWZATGha7x7TT89', name: 'Rose Floral Bouquet', price: 2999, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/7/4/21743326/1500x2000.jpg' },
  { id: 'price_1TizjiQpAVWZATGhr6BBDNsF', name: 'Autumn Emporium Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21677047/1369x1825.png' },
  { id: 'price_1TizjjQpAVWZATGhh7ePcWgj', name: 'Snowflake Kisses Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21677030/1369x1825.png' },
  { id: 'price_1TizjkQpAVWZATGhuNg9ZC0S', name: 'Cinnamon Bark & White Ginger Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21677026/1369x1825.png' },
  { id: 'price_1TizjlQpAVWZATGhsQ6b4ljE', name: 'Cosmic Plum & Saffron Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21677017/1825x1369.png' },
  { id: 'price_1TizjlQpAVWZATGhbxTNpelA', name: 'Crimson Berry & Clementine Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21677015/1825x1369.png' },
  { id: 'price_1TizjmQpAVWZATGhUX38EXSj', name: 'Meditation Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676959/1825x1369.png' },
  { id: 'price_1TizjnQpAVWZATGhDJRlYLf1', name: 'Me Time Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676956/1825x1369.png' },
  { id: 'price_1TizjoQpAVWZATGhm7AA2ALS', name: 'Recharge Black Pepper Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676941/1825x1369.png' },
  { id: 'price_1TizjoQpAVWZATGhPwdKVSCH', name: 'Birthday Cake Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676938/1825x1369.png' },
  { id: 'price_1TizjpQpAVWZATGhvJvVs2t9', name: 'Pink Rhubarb Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676935/1825x1369.png' },
  { id: 'price_1TizjqQpAVWZATGhHRTq54Sj', name: 'Shimmering Star Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676920/1825x1369.png' },
  { id: 'price_1TizjrQpAVWZATGhAlnTIndW', name: 'Charming Oasis Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676907/1825x1369.png' },
  { id: 'price_1TizjsQpAVWZATGhkaq4Mybg', name: 'Intergalactic Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21676904/1825x1369.png' },
  { id: 'price_1TizjsQpAVWZATGhCKC1yWSZ', name: 'Amethyst Candle', price: 1600, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/6/7/21675978/2000x1500.png' },
  { id: 'price_1TizjtQpAVWZATGhQoKq1exn', name: 'Root Chakra Candle', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21811439/1024x1023.png' },
  { id: 'price_1TizjuQpAVWZATGhMvNzAXne', name: 'Solar Plexus Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21814462/427x426.png' },
  { id: 'price_1TizjvQpAVWZATGh1SAiyZaN', name: 'Heart Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21814460/427x426.png' },
  { id: 'price_1TizjwQpAVWZATGhPYvXgctA', name: 'Throat Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21814465/427x426.png' },
  { id: 'price_1TizjwQpAVWZATGhr5D6gcLO', name: 'Third Eye Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/1/21814463/427x426.png' },
  { id: 'price_1TizjxQpAVWZATGhyi67MCAB', name: 'Crown Chakra', price: 2499, image: 'https://sites.create-cdn.net/siteimages/74/7/9/747971/21/8/8/21887975/427x640.png' },
];

// ── Cart State ───────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('cmg_cart') || '[]');

function saveCart() {
  localStorage.setItem('cmg_cart', JSON.stringify(cart));
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function fmtPrice(pence) {
  return '£' + (pence / 100).toFixed(2);
}

// ── Add to Cart ──────────────────────────────────────────────────────
function cmgAddToCart(priceId, qty = 1, variant = '') {
  const product = CMG_PRODUCTS.find(p => p.id === priceId);
  if (!product) { console.warn('CMG: product not found', priceId); return; }

  // If same product with different variant, add as separate item
  const existing = cart.find(i => i.id === priceId && i.variant === variant);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: priceId, name: product.name, price: product.price, image: product.image, qty, variant });
  }

  saveCart();
  updateCartBadge();
  openCart();
  plausible && plausible('Add to Cart', { props: { product: product.name } });
}

// ── Remove / Update ──────────────────────────────────────────────────
function cmgRemoveFromCart(priceId, variant) {
  cart = cart.filter(i => !(i.id === priceId && i.variant === variant));
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function cmgUpdateQty(priceId, qty) {
  qty = parseInt(qty);
  if (qty < 1) { cmgRemoveFromCart(priceId); return; }
  const item = cart.find(i => i.id === priceId);
  if (item) { item.qty = qty; saveCart(); updateCartBadge(); renderCartItems(); }
}

// ── Badge ────────────────────────────────────────────────────────────
function updateCartBadge() {
  const badge = document.getElementById('cmg-cart-badge');
  const count = cartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ── Drawer ───────────────────────────────────────────────────────────
function openCart() {
  document.getElementById('cmg-cart-drawer').classList.add('open');
  document.getElementById('cmg-cart-overlay').classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cmg-cart-drawer').classList.remove('open');
  document.getElementById('cmg-cart-overlay').classList.remove('open');
}

function renderCartItems() {
  const container = document.getElementById('cmg-cart-items');
  const footer = document.getElementById('cmg-cart-footer');

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#999;">
        <div style="font-size:48px;margin-bottom:16px;">🛒</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:8px;">Your basket is empty</div>
        <div style="font-size:13px;">Add something lovely from the shop!</div>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  const FREE_DELIVERY_THRESHOLD = 3000; // £30
  const DELIVERY_COST = 395; // £3.95
  const subtotal = cartTotal();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
  const total = subtotal + delivery;

  container.innerHTML = cart.map(item => `
    <div style="display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #f0e8e7;align-items:flex-start;">
      <img src="${item.image}" alt="${item.name}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex-shrink:0;" onerror="this.style.display='none'">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:#1e1e1e;margin-bottom:4px;line-height:1.4;">${item.name}</div>
        <div style="font-size:13px;color:#e46d69;font-weight:700;">${fmtPrice(item.price)}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <button onclick="cmgUpdateQty('${item.id}', ${item.qty - 1})" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #e0d0cf;background:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;">−</button>
          <span style="font-size:14px;font-weight:600;min-width:20px;text-align:center;">${item.qty}</span>
          <button onclick="cmgUpdateQty('${item.id}', ${item.qty + 1})" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #e0d0cf;background:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;">+</button>
          <button onclick="cmgRemoveFromCart('${item.id}','${item.variant || ''}')" style="margin-left:auto;font-size:11px;color:#999;background:none;border:none;cursor:pointer;padding:4px;">Remove</button>
        </div>
      </div>
    </div>`).join('');

  footer.style.display = 'block';
  footer.innerHTML = `
    <div style="padding:16px 20px;border-top:1px solid #f0e8e7;background:white;">
      ${subtotal < FREE_DELIVERY_THRESHOLD ? `
        <div style="background:#fdf3f2;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#e46d69;text-align:center;">
          Add ${fmtPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for <strong>free delivery</strong> 🎁
        </div>` : `
        <div style="background:#f0fdf4;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#16a34a;text-align:center;">
          🎉 You've got <strong>free delivery!</strong>
        </div>`}
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:6px;">
        <span>Subtotal</span><span>${fmtPrice(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:14px;">
        <span>Delivery</span><span>${delivery === 0 ? '<span style="color:#16a34a;">Free</span>' : fmtPrice(delivery)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1e1e1e;margin-bottom:16px;">
        <span>Total</span><span>${fmtPrice(total)}</span>
      </div>
      <button onclick="cmgCheckout()" id="cmg-checkout-btn" style="width:100%;background:#e46d69;color:white;border:none;padding:15px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s;">
        Checkout securely →
      </button>
      <div style="text-align:center;margin-top:10px;font-size:11px;color:#999;">🔒 Secure payment via Stripe</div>
    </div>`;
}

// ── Checkout ─────────────────────────────────────────────────────────
async function cmgCheckout() {
  const btn = document.getElementById('cmg-checkout-btn');
  if (btn) { btn.textContent = 'Preparing checkout…'; btn.disabled = true; }

  plausible && plausible('Checkout Started', { props: { items: cartCount(), value: cartTotal() } });

  try {
    const res = await fetch(CMG_CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ price_id: i.id, quantity: i.qty, variant: i.variant || '' })),
        subtotal: cartTotal(),
      }),
    });

    const data = await res.json();
    if (data.url) {
      // Clear cart on redirect
      cart = [];
      saveCart();
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Checkout failed');
    }
  } catch (e) {
    alert('Sorry, checkout failed: ' + e.message + '\nPlease try again or contact us.');
    if (btn) { btn.textContent = 'Checkout securely →'; btn.disabled = false; }
  }
}

// ── Inject Drawer HTML + CSS ─────────────────────────────────────────
function cmgInjectCart() {
  // CSS
  const style = document.createElement('style');
  style.textContent = `
    #cmg-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;opacity:0;pointer-events:none;transition:opacity .3s;}
    #cmg-cart-overlay.open{opacity:1;pointer-events:all;}
    #cmg-cart-drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,100vw);background:white;z-index:9999;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.15);}
    #cmg-cart-drawer.open{transform:translateX(0);}
    #cmg-cart-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid #f0e8e7;flex-shrink:0;}
    #cmg-cart-items{flex:1;overflow-y:auto;padding:0 20px;}
    #cmg-cart-footer{flex-shrink:0;}
    #cmg-cart-btn{position:relative;cursor:pointer;background:none;border:none;padding:8px;}
    #cmg-cart-badge{position:absolute;top:0;right:0;background:#e46d69;color:white;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;display:none;}
  `;
  document.head.appendChild(style);

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'cmg-cart-overlay';
  overlay.onclick = closeCart;
  document.body.appendChild(overlay);

  // Drawer
  const drawer = document.createElement('div');
  drawer.id = 'cmg-cart-drawer';
  drawer.innerHTML = `
    <div id="cmg-cart-header">
      <div style="font-size:18px;font-weight:800;color:#1e1e1e;">🛒 Your Basket</div>
      <button onclick="closeCart()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;padding:4px;">×</button>
    </div>
    <div id="cmg-cart-items"></div>
    <div id="cmg-cart-footer"></div>
  `;
  document.body.appendChild(drawer);

  // Update badge on load
  updateCartBadge();
}

// ── Init ─────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmgInjectCart);
} else {
  cmgInjectCart();
}
