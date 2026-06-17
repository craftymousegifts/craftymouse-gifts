// CMG Product Detail Modal — shared across shop.html and gift-builder-app.html
// Usage: cmgOpenProductModal({ title, price, description, image, category })

(function() {
  function buildModal() {
    if (document.getElementById('cmg-product-modal-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      #cmg-product-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.55);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: cmgFadeIn .2s ease;
      }
      @keyframes cmgFadeIn { from{opacity:0} to{opacity:1} }
      #cmg-product-modal {
        background: #fff; border-radius: 16px; max-width: 640px; width: 100%;
        max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,.25);
        animation: cmgSlideUp .25s ease;
      }
      @keyframes cmgSlideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      #cmg-product-modal .pm-header {
        position: relative; padding: 0;
      }
      #cmg-product-modal .pm-img {
        width: 100%; height: 280px; object-fit: cover;
        border-radius: 16px 16px 0 0; display: block;
      }
      #cmg-product-modal .pm-close {
        position: absolute; top: 12px; right: 14px;
        background: rgba(255,255,255,.9); border: none; border-radius: 50%;
        width: 36px; height: 36px; font-size: 1.1rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: background .2s;
      }
      #cmg-product-modal .pm-close:hover { background: #fff; }
      #cmg-product-modal .pm-body { padding: 24px 28px 28px; }
      #cmg-product-modal .pm-cat {
        font-size: 11px; font-weight: 700; letter-spacing: .12em;
        text-transform: uppercase; color: #e46d69; margin-bottom: 8px;
      }
      #cmg-product-modal .pm-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.8rem; font-weight: 400; color: #1e1e1e;
        margin-bottom: 6px; line-height: 1.2;
      }
      #cmg-product-modal .pm-price {
        font-size: 1.4rem; font-weight: 700; color: #1e1e1e; margin-bottom: 16px;
      }
      #cmg-product-modal .pm-desc {
        font-size: .9rem; color: #555; line-height: 1.8;
        margin-bottom: 24px; white-space: pre-line;
      }
      #cmg-product-modal .pm-btn {
        display: block; width: 100%; background: #e46d69; color: #fff;
        border: none; border-radius: 8px; padding: 14px 24px;
        font-family: inherit; font-size: 14px; font-weight: 700;
        letter-spacing: .08em; text-transform: uppercase; cursor: pointer;
        transition: background .2s; text-align: center;
      }
      #cmg-product-modal .pm-btn:hover { background: #c4524e; }
      @media (max-width: 480px) {
        #cmg-product-modal .pm-img { height: 200px; }
        #cmg-product-modal .pm-body { padding: 18px 20px 22px; }
        #cmg-product-modal .pm-title { font-size: 1.4rem; }
      }
    `;
    document.head.appendChild(style);
  }

  window.cmgOpenProductModal = function(product) {
    buildModal();

    // Remove existing
    const existing = document.getElementById('cmg-product-modal-overlay');
    if (existing) existing.remove();

    const price = typeof product.price === 'number'
      ? '£' + product.price.toFixed(2)
      : product.price;

    // Clean up description — replace multiple spaces with line breaks
    const desc = (product.description || '')
      .replace(/\s{2,}/g, '\n\n')
      .replace(/&#\d+;/g, c => {
        const el = document.createElement('textarea');
        el.innerHTML = c; return el.value;
      })
      .trim();

    const overlay = document.createElement('div');
    overlay.id = 'cmg-product-modal-overlay';
    overlay.innerHTML = `
      <div id="cmg-product-modal">
        <div class="pm-header">
          ${product.image ? `<img class="pm-img" src="${product.image}" alt="${product.title}">` : ''}
          <button class="pm-close" onclick="document.getElementById('cmg-product-modal-overlay').remove()">✕</button>
        </div>
        <div class="pm-body">
          <p class="pm-cat">${product.category || ''}</p>
          <h2 class="pm-title">${product.title}</h2>
          <p class="pm-price">${price}</p>
          <p class="pm-desc">${desc}</p>
          <div id="cmg-modal-basket-area"></div>
        </div>
      </div>`;

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    // Close on Escape
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });

    document.body.appendChild(overlay);

    // Try to find matching Add to Basket button on the page
    const basketArea = overlay.querySelector('#cmg-modal-basket-area');
    if (basketArea) {
      // Find the product card on the page by title match
      let addBtn = null;
      document.querySelectorAll('.product-card').forEach(function(card) {
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent.trim().toLowerCase() === product.title.trim().toLowerCase()) {
          const orig = card.querySelector('.btn-cart');
          if (orig) addBtn = orig;
        }
      });
      if (addBtn) {
        // Clone the original add to basket button behaviour
        const btn = document.createElement('button');
        btn.className = 'pm-btn';
        btn.textContent = 'Add to Basket';
        btn.addEventListener('click', function() {
          overlay.remove();
          addBtn.click();
        });
        basketArea.appendChild(btn);
      } else {
        // Fallback to Shop Now if no matching card found (e.g. from gift builder)
        const btn = document.createElement('button');
        btn.className = 'pm-btn';
        btn.textContent = 'Shop Now →';
        btn.addEventListener('click', function() {
          overlay.remove();
          window.location = '/shop.html';
        });
        basketArea.appendChild(btn);
      }
    }
  };
})();

// ── PACKAGE MODAL ─────────────────────────────────────────────────────────────
window.cmgOpenPackageModal = function(pkg) {
  const existing = document.getElementById('cmg-product-modal-overlay');
  if (existing) existing.remove();

  const style = document.createElement('style');
  if (!document.getElementById('cmg-modal-style')) {
    style.id = 'cmg-modal-style';
    style.textContent = `
      .pm-contents { margin: 16px 0 20px; }
      .pm-contents h4 { font-family:'Cormorant Garamond',Georgia,serif; font-size:1.1rem; font-weight:400; margin-bottom:12px; color:#1e1e1e; }
      .pm-contents-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
      .pm-contents-list li { display:flex; align-items:center; gap:10px; font-size:.9rem; color:#555; padding:8px 12px; background:#fdf8f7; border-radius:8px; border-left:3px solid #e46d69; }
      .pm-contents-list li::before { content:'🕯️'; font-size:1rem; }
      .pm-save { background:#f3e8e6; border-radius:8px; padding:10px 14px; font-size:.85rem; color:#e46d69; font-weight:700; margin-bottom:16px; text-align:center; }
    `;
    document.head.appendChild(style);
  }

  // Build contents list with product lookup
  let contentsHtml = '';
  if (pkg.contents && pkg.contents.length) {
    const items = pkg.contents.map(name => {
      const found = window.cmgProductLookup && window.cmgProductLookup.find(p => p.title.trim() === name.trim());
      const price = found ? ` — £${found.price.toFixed(2)}` : '';
      return `<li>${name}${price}</li>`;
    }).join('');
    contentsHtml = `
      <div class="pm-contents">
        <h4>What's Inside</h4>
        <ul class="pm-contents-list">${items}</ul>
      </div>`;
  }

  const desc = (pkg.description || '').replace(/\n/g, '<br>');

  const overlay = document.createElement('div');
  overlay.id = 'cmg-product-modal-overlay';
  overlay.innerHTML = `
    <div id="cmg-product-modal">
      <div class="pm-header">
        ${pkg.image ? `<img class="pm-img" src="${pkg.image}" alt="${pkg.title}">` : ''}
        <button class="pm-close" onclick="document.getElementById('cmg-product-modal-overlay').remove()">✕</button>
      </div>
      <div class="pm-body">
        <p class="pm-cat">Gift Package</p>
        <h2 class="pm-title">${pkg.title}</h2>
        <p class="pm-price">${pkg.price}</p>
        <p class="pm-desc">${desc}</p>
        ${contentsHtml}
        <div id="cmg-pkg-basket-area"></div>
      </div>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(overlay);

  // Add to Basket button
  const basketArea = overlay.querySelector('#cmg-pkg-basket-area');
  if (basketArea && pkg.addBtn) {
    const btn = document.createElement('button');
    btn.className = 'pm-btn';
    btn.textContent = 'Add Gift Package to Basket';
    btn.addEventListener('click', function() {
      overlay.remove();
      pkg.addBtn.click();
    });
    basketArea.appendChild(btn);
  }
};
