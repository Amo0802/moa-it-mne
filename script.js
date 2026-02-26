/* ══════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   1. Nav — mobile menu toggle
   2. Hero — phone rotation carousel
   3. Advantages — sliding card carousel (with drag/scroll)
   4. Showcase — tab switcher
   5. Timeline — scroll-triggered fade-in
══════════════════════════════════════════════════════════ */


/* ──────────────────────────────────────────────
   1. NAV — Mobile menu toggle (with hamburger animation)
────────────────────────────────────────────── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const hamburger = document.querySelector('.hamburger');
  menu.classList.toggle('open');
  hamburger.classList.toggle('active');

  // Lock/unlock body scroll
  if (menu.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Close mobile menu when screen is resized to desktop width
window.addEventListener('resize', () => {
  if (window.innerWidth > 960) {
    document.getElementById('mobileMenu').classList.remove('open');
    document.querySelector('.hamburger').classList.remove('active');
    document.body.style.overflow = '';
  }
});


/* ──────────────────────────────────────────────
   2. HERO — Phone rotation
────────────────────────────────────────────── */
(function () {
  const POSITIONS = [
    'pos-hidden-left',
    'pos-left',
    'pos-center',
    'pos-right',
    'pos-hidden-right'
  ];

  const phones = document.querySelectorAll('.phone');
  let state = [0, 1, 2, 3, 4];

  function rotate() {
    state = state.map(s => (s + 1) % 5);
    phones.forEach((phone, i) => {
      phone.className = 'phone ' + POSITIONS[state[i]];
    });
  }

  setInterval(rotate, 3000);
})();


/* ──────────────────────────────────────────────
   3. ADVANTAGES — Sliding card carousel
   - 3 cards visible on desktop, 2 tablet, 1 mobile
   - Auto-advances every 4s, pauses on hover/drag
   - Touch swipe + mouse drag support
────────────────────────────────────────────── */
(function () {
  const outer         = document.querySelector('.carousel-outer');
  const track         = document.getElementById('carouselTrack');
  const dotsContainer = document.getElementById('carouselDots');
  const cards         = Array.from(track.querySelectorAll('.adv-card'));
  const total         = cards.length;
  const GAP           = 20;

  let currentIndex = 0;
  let visibleCount = getVisibleCount();
  let maxIndex     = total - visibleCount;

  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    visibleCount = getVisibleCount();
    maxIndex     = total - visibleCount;

    for (let i = 0; i <= maxIndex; i++) {
      const btn = document.createElement('button');
      btn.className = 'dot' + (i === currentIndex ? ' active' : '');
      btn.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      btn.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(btn);
    }
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));

    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset    = currentIndex * (cardWidth + GAP);
    track.style.transform = `translateX(-${offset}px)`;

    document.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentIndex);
    });
  }

  function onResize() {
    const newVisible = getVisibleCount();
    if (newVisible !== visibleCount) {
      visibleCount = newVisible;
      maxIndex     = total - visibleCount;
      currentIndex = Math.min(currentIndex, maxIndex);
      buildDots();
      goTo(currentIndex);
    }
  }

  // Auto-advance
  let autoInterval = setInterval(() => {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  }, 4000);

  function pauseAuto() { clearInterval(autoInterval); }
  function resumeAuto() {
    clearInterval(autoInterval);
    autoInterval = setInterval(() => {
      goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }, 4000);
  }

  // Pause on hover
  outer.addEventListener('mouseenter', pauseAuto);
  outer.addEventListener('mouseleave', resumeAuto);

  // ── Mouse drag support ──
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let trackStartOffset = 0;

  function getTrackOffset() {
    const cardWidth = cards[0].getBoundingClientRect().width;
    return currentIndex * (cardWidth + GAP);
  }

  outer.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragCurrentX = e.clientX;
    trackStartOffset = getTrackOffset();
    outer.classList.add('dragging');
    pauseAuto();
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragCurrentX = e.clientX;
    const diff = dragStartX - dragCurrentX;
    const newOffset = trackStartOffset + diff;
    track.style.transform = `translateX(-${newOffset}px)`;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    outer.classList.remove('dragging');

    const diff = dragStartX - dragCurrentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    } else {
      goTo(currentIndex); // snap back
    }
    resumeAuto();
  });

  // ── Touch swipe support ──
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isTouching = false;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    trackStartOffset = getTrackOffset();
    isTouching = true;
    outer.classList.add('dragging');
    pauseAuto();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isTouching) return;
    touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX - touchCurrentX;
    const newOffset = trackStartOffset + diff;
    track.style.transform = `translateX(-${newOffset}px)`;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!isTouching) return;
    isTouching = false;
    outer.classList.remove('dragging');

    const diff = touchStartX - touchCurrentX;
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    } else {
      goTo(currentIndex);
    }
    resumeAuto();
  });

  // Prevent link/image drag interference
  track.addEventListener('dragstart', (e) => e.preventDefault());

  window.addEventListener('resize', onResize);

  buildDots();
  goTo(0);
})();


/* ──────────────────────────────────────────────
   4. SHOWCASE — Tab switcher
────────────────────────────────────────────── */
(function () {
  const tabs   = document.querySelectorAll('.showcase-tab');
  const panels = document.querySelectorAll('.showcase-panel');

  function activateTab(tabId) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));

    panels.forEach(p => {
      if (p.dataset.panel === tabId) {
        p.classList.add('active');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => p.classList.add('visible'));
        });
      } else {
        p.classList.remove('active', 'visible');
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelector('.showcase-panel.active')?.classList.add('visible');
    });
  });
})();


/* ──────────────────────────────────────────────
   5. TIMELINE — Scroll-triggered fade-in
────────────────────────────────────────────── */
(function () {
  const items = document.querySelectorAll('.timeline-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(item => observer.observe(item));
})();

/* ──────────────────────────────────────────────
   POPUP — open / close
────────────────────────────────────────────── */
function openPopup() {
  document.getElementById('popupOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  document.getElementById('popupOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('popupOverlay').addEventListener('click', function (e) {
  if (e.target === this) closePopup();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePopup();
});

document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', openPopup);
});


document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('open');
    document.querySelector('.hamburger').classList.remove('active');
    document.body.style.overflow = '';
  });
});