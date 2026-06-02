(function () {
  'use strict';

  /* ── Tab System ──────────────────────────────────────────────────── */
  const tabs   = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  const rendered = new Set();

  function openTab(panelId, updateHash) {
    const target = document.getElementById('panel-' + panelId);
    if (!target) return;

    tabs.forEach(t => {
      const active = t.dataset.panel === panelId;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
      t.classList.toggle('active', active);
    });
    panels.forEach(p => p.classList.toggle('is-active', p.id === 'panel-' + panelId));

    // Restart reveal animations
    target.querySelectorAll('.reveal').forEach(el => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    });

    if (updateHash) history.replaceState(null, '', '#' + panelId);

    if (!rendered.has(panelId)) {
      rendered.add(panelId);
      if (panelId === 'publications') renderPublications();
      if (panelId === 'supervision')  renderSupervision();
      if (panelId === 'teaching')     renderLectures();
      if (panelId === 'gallery')      renderGallery();
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      openTab(tab.dataset.panel, true);
      tab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft')  next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End')  next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tab.click(); }
    });
  });

  // [data-tab] links inside panels (e.g. profile contact links)
  document.querySelectorAll('[data-tab]').forEach(btn =>
    btn.addEventListener('click', e => {
      e.preventDefault();
      openTab(btn.dataset.tab, true);
      document.querySelector('.site-header').scrollIntoView({ behavior: 'smooth' });
    })
  );

  const hash = location.hash.replace('#', '');
  const valid = tabs.map(t => t.dataset.panel);
  const start = (hash && valid.includes(hash)) ? hash : 'about';
  openTab(start, false);

  /* ── Publications ────────────────────────────────────────────────── */
  function boldName(str) {
    return str.replace(/El-Ghaish, H\./g,
      '<strong style="color:var(--text-muted)">El-Ghaish, H.</strong>');
  }

  function pubCard(p) {
    const link = p.link
      ? `<a href="${p.link}" class="pub-link" target="_blank" rel="noopener">DOI <i class="fas fa-external-link-alt" style="font-size:.65em"></i></a>`
      : '';
    return `<div class="pub-item">
      <div class="pub-top">
        <p class="pub-title">"${p.title}"</p>
        <span class="pub-badge badge-${p.badgeClass}">${p.badge}</span>
      </div>
      <p class="pub-authors">${boldName(p.authors)}</p>
      <p class="pub-venue"><em>${p.venue}</em>, <span style="color:var(--text-light)">${p.detail}</span></p>
      <div class="pub-bottom">${link}<span class="pub-year">${p.year}</span></div>
    </div>`;
  }

  function pubSection(container, items, label, type) {
    if (!items?.length) return;
    const sec = document.createElement('div');
    sec.className = 'pub-section';
    sec.dataset.type = type;
    sec.innerHTML = `<p class="pub-section-head">${label} <span style="opacity:.5">(${items.length})</span></p>
      <div class="pub-list">${items.map(pubCard).join('')}</div>`;
    container.appendChild(sec);
  }

  function renderPublications() {
    const d = window.PUBLICATIONS;
    if (!d) return;
    const el = document.getElementById('pub-list');
    if (!el) return;
    el.innerHTML = '';
    pubSection(el, d.journals,    'Journal Articles', 'journal');
    pubSection(el, d.conferences, 'Conference Papers', 'conference');
    pubSection(el, d.underReview, 'Under Review / Revision', 'review');

    document.querySelectorAll('.seg-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.pub-section').forEach(s => {
          s.style.display = (f === 'all' || s.dataset.type === f) ? '' : 'none';
        });
      })
    );
  }

  /* ── Supervision ─────────────────────────────────────────────────── */
  function renderSupervision() {
    const d = window.SUPERVISION;
    if (!d) return;
    const el = document.getElementById('supervision-content');
    if (!el) return;

    const menteeHtml = (d.mentoring || []).map(m => {
      const phd = m.role.toLowerCase().includes('ph.d');
      return `<div class="mentee-card">
        <p class="mentee-name">${m.name}</p>
        <div class="mentee-row">
          <span class="role-badge ${phd ? 'phd' : 'ms'}">${m.role}</span>
          <span class="mentee-years">${m.years}</span>
        </div>
        <p class="mentee-topic">${m.topic}</p>
      </div>`;
    }).join('');

    const thesisHtml = (d.theses || []).map(t => {
      const done = t.status === 'completed';
      return `<div class="thesis-item ${done ? 'completed' : ''}">
        <div class="thesis-head">
          <p class="thesis-title">${t.title}</p>
          <span class="thesis-status ${done ? 'status-done' : 'status-ip'}">${done ? 'Completed' : 'In Progress'}</span>
        </div>
        <div class="thesis-meta">
          <span>${t.degree} · ${t.years}</span>
          <span>${t.student}</span>
        </div>
        <p style="font-size:.72rem;color:var(--text-light);font-style:italic">${t.dept}</p>
        ${t.note ? `<p class="thesis-note">${t.note}</p>` : ''}
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="reveal">
        <h3 class="sub-heading" style="margin-top:0;border-top:none;padding-top:0">Current Researchers</h3>
        <div class="mentee-grid">${menteeHtml}</div>
      </div>
      <div class="reveal">
        <h3 class="sub-heading">Thesis Supervision</h3>
        <div class="thesis-list">${thesisHtml}</div>
      </div>`;
  }

  /* ── Lectures ────────────────────────────────────────────────────── */
  function renderLectures() {
    const list = window.LECTURES || [];
    const el = document.getElementById('lecture-grid');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<div class="empty-state">
        <i class="fab fa-youtube"></i>
        <p>Video lectures coming soon.</p>
      </div>`;
      return;
    }
    el.innerHTML = `<div class="lecture-grid">${list.map(l => `
      <a href="https://www.youtube.com/watch?v=${l.id}" class="lecture-card" target="_blank" rel="noopener noreferrer">
        <div class="lec-thumb">
          <img src="https://img.youtube.com/vi/${l.id}/hqdefault.jpg" alt="${l.title}" loading="lazy">
          <div class="lec-play"><i class="fab fa-youtube"></i></div>
        </div>
        <div class="lec-info">
          <p class="lec-title">${l.title}</p>
          ${l.desc ? `<p class="lec-desc">${l.desc}</p>` : ''}
        </div>
      </a>`).join('')}</div>`;
  }

  /* ── Gallery + Lightbox ──────────────────────────────────────────── */
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lb-img');
  const lbCap   = document.getElementById('lb-caption');
  let lbItems = [], lbIdx = 0, lbOpener = null;

  function lbOpen(items, idx, opener) {
    lbItems = items; lbIdx = idx; lbOpener = opener;
    lbUpdate();
    lb.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }
  function lbClose() {
    lb.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lbOpener?.focus();
  }
  function lbUpdate() {
    const it = lbItems[lbIdx];
    lbImg.src = it.src; lbImg.alt = it.caption || '';
    lbCap.textContent = it.caption || '';
    document.getElementById('lb-prev').style.display = lbItems.length > 1 ? '' : 'none';
    document.getElementById('lb-next').style.display = lbItems.length > 1 ? '' : 'none';
  }

  document.getElementById('lb-close').addEventListener('click', lbClose);
  document.getElementById('lb-backdrop').addEventListener('click', lbClose);
  document.getElementById('lb-prev').addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; lbUpdate(); });
  document.getElementById('lb-next').addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbItems.length; lbUpdate(); });

  document.addEventListener('keydown', e => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft')  { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; lbUpdate(); }
    if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbItems.length; lbUpdate(); }
  });

  lb.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(lb.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])'));
    const [first, last] = [focusable[0], focusable[focusable.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  let currentAlbum = 'projects';

  function buildGrid(items) {
    const el = document.getElementById('gallery-grid');
    if (!el) return;
    if (!items?.length) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-images"></i><p>Photos coming soon.</p></div>`;
      return;
    }
    el.innerHTML = `<div class="gallery-grid">${items.map((it, i) =>
      `<div class="gal-item" tabindex="0" role="button" aria-label="${it.caption || 'Photo ' + (i+1)}">
        <img src="${it.src}" alt="${it.caption || ''}" loading="lazy">
        <div class="gal-cap">${it.caption || ''}</div>
      </div>`
    ).join('')}</div>`;
    el.querySelectorAll('.gal-item').forEach((node, i) => {
      const open = () => lbOpen(items, i, node);
      node.addEventListener('click', open);
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function renderGallery() {
    const data = window.GALLERY || { projects: [], graduations: [] };
    document.querySelectorAll('.album-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('.album-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAlbum = btn.dataset.album;
        buildGrid(data[currentAlbum]);
      })
    );
    buildGrid(data[currentAlbum]);
  }

})();
