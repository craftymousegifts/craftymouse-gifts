// CMG Nav — injects Wellness dropdown CSS on all pages
(function() {
  if (document.getElementById('cmg-nav-css')) return;
  const s = document.createElement('style');
  s.id = 'cmg-nav-css';
  s.textContent = `
    .nav-list > li.has-dropdown { position: relative; }
    .nav-list > li.has-dropdown .sub-nav { display: none; position: absolute; top: 100%; left: 0; background: #fff; border-top: 2px solid var(--rose, #e46d69); min-width: 180px; z-index: 200; list-style: none; padding: 0; margin: 0; box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    .nav-list > li.has-dropdown:hover .sub-nav { display: block; }
    .nav-list > li.has-dropdown .sub-nav li a { display: block; padding: 10px 18px; font-size: 13px; color: #555; border-bottom: 1px solid #f3e8e6; text-decoration: none; white-space: nowrap; text-transform: uppercase; letter-spacing: .08em; }
    .nav-list > li.has-dropdown .sub-nav li:last-child a { border-bottom: none; }
    .nav-list > li.has-dropdown .sub-nav li a:hover { background: #fdf8f7; color: var(--rose, #e46d69); }
  `;
  document.head.appendChild(s);
})();
