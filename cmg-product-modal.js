// CMG Product & Package Modal — v5 — 202606171839
// CMG Product & Package Modal — v3
// Usage: cmgOpenProductModal(product) | cmgOpenPackageModal(pkg)

(function() {

  // ── Shared styles ───────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cmg-modal-styles')) return;
    const s = document.createElement('style');
    s.id = 'cmg-modal-styles';
    s.textContent = `
      #cmg-product-modal-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,.55);
        z-index:99999;display:flex;align-items:center;justify-content:center;
        padding:20px;animation:cmgFadeIn .2s ease;
      }
      @keyframes cmgFadeIn{from{opacity:0}to{opacity:1}}
      #cmg-product-modal {
        background:#fff;border-radius:16px;max-width:640px;width:100%;
        max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.25);
        animation:cmgSlideUp .25s ease;
      }
      @keyframes cmgSlideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
      #cmg-product-modal .pm-img{width:100%;height:260px;object-fit:cover;border-radius:16px 16px 0 0;display:block;}
      #cmg-product-modal .pm-close{position:absolute;top:12px;right:14px;background:rgba(255,255,255,.9);border:none;border-radius:50%;width:36px;height:36px;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}
      #cmg-product-modal .pm-body{padding:24px 28px 28px;}
      #cmg-product-modal .pm-cat{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e46d69;margin-bottom:8px;}
      #cmg-product-modal .pm-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.8rem;font-weight:400;color:#1e1e1e;margin-bottom:6px;line-height:1.2;}
      #cmg-product-modal .pm-price{font-size:1.4rem;font-weight:700;color:#1e1e1e;margin-bottom:16px;}
      #cmg-product-modal .pm-desc{font-size:.9rem;color:#555;line-height:1.8;margin-bottom:20px;white-space:pre-line;}
      #cmg-product-modal .pm-btn{display:block;width:100%;background:#e46d69;color:#fff;border:none;border-radius:8px;padding:14px 24px;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .2s;text-align:center;margin-top:8px;}
      #cmg-product-modal .pm-btn:hover{background:#c4524e;}
      #cmg-product-modal .pm-btn-back{background:#888;}
      #cmg-product-modal .pm-btn-back:hover{background:#555;}
      #cmg-product-modal .pm-contents h4{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:400;margin-bottom:12px;color:#1e1e1e;}
      #cmg-product-modal .pm-contents-list{list-style:none;padding:0;margin:0 0 16px;display:flex;flex-direction:column;gap:8px;}
      #cmg-product-modal .pm-contents-list li{display:flex;align-items:center;gap:10px;font-size:.9rem;color:#555;padding:8px 12px;background:#fdf8f7;border-radius:8px;border-left:3px solid #e46d69;}
      #cmg-product-modal .pm-ribbon{background:#f3e8e6;border-radius:8px;padding:10px 14px;font-size:.82rem;color:#e46d69;font-weight:600;margin-bottom:16px;text-align:center;}
      @media(max-width:480px){#cmg-product-modal .pm-img{height:200px;}#cmg-product-modal .pm-body{padding:18px 20px 22px;}#cmg-product-modal .pm-title{font-size:1.4rem;}}
    `;
    document.head.appendChild(s);
  }

  function removeOverlay() {
    document.getElementById('cmg-product-modal-overlay')?.remove();
  }

  function makeOverlay() {
    removeOverlay();
    injectStyles();
    const overlay = document.createElement('div');
    overlay.id = 'cmg-product-modal-overlay';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) removeOverlay(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { removeOverlay(); document.removeEventListener('keydown', esc); }
    });
    return overlay;
  }

  // ── Product Modal ───────────────────────────────────────────────────────────
  window.cmgOpenProductModal = function(product) {
    const overlay = makeOverlay();
    const price = typeof product.price === 'number' ? '\u00a3' + product.price.toFixed(2) : (product.price || '');
    const desc = (product.description || '').replace(/\s{3,}/g, '\n\n').trim();

    const modal = document.createElement('div');
    modal.id = 'cmg-product-modal';
    modal.innerHTML = `
      <div style="position:relative;">
        ${product.image ? `<img class="pm-img" src="${product.image}" alt="${product.title}">` : ''}
        <button class="pm-close" onclick="document.getElementById('cmg-product-modal-overlay').remove()">&#x2715;</button>
      </div>
      <div class="pm-body">
        <p class="pm-cat">${product.category || 'Handmade Gift'}</p>
        <h2 class="pm-title">${product.title}</h2>
        <p class="pm-price">${price}</p>
        <p class="pm-desc">${desc}</p>
        <div id="cmg-modal-basket-area"></div>
      </div>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add to Basket button
    const basketArea = modal.querySelector('#cmg-modal-basket-area');
    if (basketArea) {
      if (product.backFn) {
        // "Back to Package" mode
        const btn = document.createElement('button');
        btn.className = 'pm-btn pm-btn-back';
        btn.textContent = '\u2190 Back to Package';
        btn.addEventListener('click', function() { removeOverlay(); product.backFn(); });
        basketArea.appendChild(btn);
      } else {
        // Find matching Add to Basket button on page
        let addBtn = null;
        document.querySelectorAll('.product-card').forEach(function(card) {
          const h3 = card.querySelector('h3');
          if (h3 && h3.textContent.trim().toLowerCase() === (product.title || '').trim().toLowerCase()) {
            const orig = card.querySelector('.btn-cart');
            if (orig) addBtn = orig;
          }
        });
        if (addBtn) {
          const btn = document.createElement('button');
          btn.className = 'pm-btn';
          btn.textContent = 'Add to Basket';
          btn.addEventListener('click', function() { removeOverlay(); addBtn.click(); });
          basketArea.appendChild(btn);
        }
      }
    }
  };

  // ── Package Modal ───────────────────────────────────────────────────────────
  window.cmgOpenPackageModal = function(pkg) {
    const overlay = makeOverlay();
    const modal = document.createElement('div');
    modal.id = 'cmg-product-modal';

    // Build contents list
    let contentsHtml = '';
    if (pkg.contents && pkg.contents.length) {
      const items = pkg.contents.map(function(name) {
        const found = window.cmgProductLookup && window.cmgProductLookup.find(function(p) { return p.title.trim() === name.trim(); });
        const price = found ? ' \u2014 \u00a3' + found.price.toFixed(2) : '';
        return '<li>' + name + price + '</li>';
      }).join('');
      contentsHtml = `
        <div class="pm-contents">
          <h4>What's Inside</h4>
          <ul class="pm-contents-list">${items}</ul>
          <p class="pm-ribbon">\u2728 Presented with love: shredded tissue, luxury gift box and branded ribbon</p>
        </div>`;
    }

    const desc = (pkg.description || '').replace(/\n/g, '<br>');

    modal.innerHTML = `
      <div style="position:relative;">
        ${pkg.image ? `<img class="pm-img" src="${pkg.image}" alt="${pkg.title}">` : ''}
        <button class="pm-close" onclick="document.getElementById('cmg-product-modal-overlay').remove()">&#x2715;</button>
      </div>
      <div class="pm-body">
        <p class="pm-cat">Gift Package</p>
        <h2 class="pm-title">${pkg.title}</h2>
        <p class="pm-price">${pkg.price}</p>
        <p class="pm-desc">${desc}</p>
        ${contentsHtml}
        <div id="cmg-pkg-basket-area"></div>
      </div>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add Gift Package to Basket button
    const basketArea = modal.querySelector('#cmg-pkg-basket-area');
    if (basketArea) {
      const btn = document.createElement('button');
      btn.className = 'pm-btn';
      btn.textContent = 'Add Gift Package to Basket';
      btn.addEventListener('click', function() {
        removeOverlay();
        if (pkg.priceId && typeof cmgAddToCart === 'function') {
          cmgAddToCart(pkg.priceId);
        } else if (pkg.addBtn) {
          pkg.addBtn.click();
        }
      });
      basketArea.appendChild(btn);
    }
  };

  // ── cmgViewPkg helper (called from shop.html View Items buttons) ────────────
  window.cmgViewPkg = function(slug, btn) {
    var card = btn.closest('.product-card');
    var img = card && card.querySelector('img') ? card.querySelector('img').src : '';
    var p = window.cmgPackageData && window.cmgPackageData[slug];
    if (!p) { console.warn('No package data for slug:', slug); return; }
    window.cmgOpenPackageModal({
      title: p.title,
      description: p.description,
      price: p.price,
      image: img,
      contents: p.contents,
      priceId: p.priceId,
      addBtn: card ? card.querySelector('.btn-cart') : null
    });
  };

})();
