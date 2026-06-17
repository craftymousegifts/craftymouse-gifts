
// ── Scent/Variant validation wrapper ─────────────────────────────────────────
function cmgAddToCartWithScent(btn, priceId, productName) {
  const card = btn.closest('.product-card');
  const select = card ? card.querySelector('.scent-select') : null;

  if (select && !select.value) {
    // Shake and show error
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

    setTimeout(() => {
      select.classList.remove('cmg-shake');
    }, 500);
    return;
  }

  const variant = select ? select.value : '';
  // Hide any error
  const msg = card ? card.querySelector('.scent-required-msg') : null;
  if (msg) msg.style.display = 'none';

  cmgAddToCart(priceId, 1, variant);
}

// Add shake keyframes if not already present
if (!document.getElementById('cmg-shake-style')) {
  const st = document.createElement('style');
  st.id = 'cmg-shake-style';
  st.textContent = '@keyframes cmg-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}.cmg-shake{animation:cmg-shake 0.4s ease;border-color:#e46d69!important;}';
  document.head.appendChild(st);
}
