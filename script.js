/* ══════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   1. Nav — mobile menu toggle
   2. Hero — phone rotation carousel (6 phones)
   3. Advantages — sliding card carousel (with drag/scroll/trackpad)
   4. Showcase — tab switcher
   5. Timeline — scroll-triggered fade-in
   6. Contact Form — validation + API submission
══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   CONFIGURATION
────────────────────────────────────────────── */
const API_BASE = "https://api.moait.me";

/* ──────────────────────────────────────────────
   1. NAV — Mobile menu toggle (with hamburger animation)
────────────────────────────────────────────── */
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  const hamburger = document.querySelector(".hamburger");
  menu.classList.toggle("open");
  hamburger.classList.toggle("active");

  // Lock/unlock body scroll
  if (menu.classList.contains("open")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

// Close mobile menu when screen is resized to desktop width
window.addEventListener("resize", () => {
  if (window.innerWidth > 960) {
    document.getElementById("mobileMenu").classList.remove("open");
    document.querySelector(".hamburger").classList.remove("active");
    document.body.style.overflow = "";
  }
});

/* ──────────────────────────────────────────────
   2. HERO — Phone rotation (6 phones, 6 positions)
────────────────────────────────────────────── */
(function () {
  const POSITIONS = [
    "pos-far-hidden-left",
    "pos-hidden-left",
    "pos-left",
    "pos-center",
    "pos-right",
    "pos-hidden-right",
  ];

  const phones = document.querySelectorAll(".phone");
  let state = [0, 1, 2, 3, 4, 5];

  function rotate() {
    state = state.map((s) => (s + 1) % 6);
    phones.forEach((phone, i) => {
      const loaded = phone.classList.contains("loaded") ? " loaded" : "";
      phone.className = "phone " + POSITIONS[state[i]] + loaded;
    });
  }

  setInterval(rotate, 3000);
})();

/* ──────────────────────────────────────────────
   2b. HERO — Image load shimmer
   Fade in each phone image once it's loaded
────────────────────────────────────────────── */
(function () {
  document.querySelectorAll(".phone").forEach((phone) => {
    const img = phone.querySelector("img");
    if (!img) return;

    function markLoaded() {
      phone.classList.add("loaded");
    }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded);
      img.addEventListener("error", markLoaded); // remove shimmer even on error
    }
  });
})();

/* ──────────────────────────────────────────────
   3. ADVANTAGES — Sliding card carousel
   - 3 cards visible on desktop, 2 tablet, 1 mobile
   - Auto-advances every 4s, pauses on hover/drag
   - Touch swipe + mouse drag + trackpad scroll support
────────────────────────────────────────────── */
(function () {
  const outer = document.querySelector(".carousel-outer");
  const track = document.getElementById("carouselTrack");
  const dotsContainer = document.getElementById("carouselDots");
  const cards = Array.from(track.querySelectorAll(".adv-card"));
  const total = cards.length;
  const GAP = 20;

  let currentIndex = 0;
  let visibleCount = getVisibleCount();
  let maxIndex = total - visibleCount;

  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
  }

  function buildDots() {
    dotsContainer.innerHTML = "";
    visibleCount = getVisibleCount();
    maxIndex = total - visibleCount;

    for (let i = 0; i <= maxIndex; i++) {
      const btn = document.createElement("button");
      btn.className = "dot" + (i === currentIndex ? " active" : "");
      btn.setAttribute("aria-label", "Go to slide " + (i + 1));
      btn.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(btn);
    }
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));

    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset = currentIndex * (cardWidth + GAP);
    track.style.transform = `translateX(-${offset}px)`;

    document.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("active", i === currentIndex);
    });
  }

  function onResize() {
    const newVisible = getVisibleCount();
    if (newVisible !== visibleCount) {
      visibleCount = newVisible;
      maxIndex = total - visibleCount;
      currentIndex = Math.min(currentIndex, maxIndex);
      buildDots();
      goTo(currentIndex);
    }
  }

  // Auto-advance
  let autoInterval = setInterval(() => {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  }, 4000);

  function pauseAuto() {
    clearInterval(autoInterval);
  }
  function resumeAuto() {
    clearInterval(autoInterval);
    autoInterval = setInterval(() => {
      goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }, 4000);
  }

  // Pause on hover
  outer.addEventListener("mouseenter", pauseAuto);
  outer.addEventListener("mouseleave", resumeAuto);

  // ── Mouse drag support ──
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let trackStartOffset = 0;

  function getTrackOffset() {
    const cardWidth = cards[0].getBoundingClientRect().width;
    return currentIndex * (cardWidth + GAP);
  }

  outer.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragCurrentX = e.clientX;
    trackStartOffset = getTrackOffset();
    outer.classList.add("dragging");
    pauseAuto();
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    dragCurrentX = e.clientX;
    const diff = dragStartX - dragCurrentX;
    const newOffset = trackStartOffset + diff;
    track.style.transform = `translateX(-${newOffset}px)`;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    outer.classList.remove("dragging");

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
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isTouching = false;
  let touchDirection = null; // 'horizontal' | 'vertical' | null

  outer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchCurrentX = touchStartX;
      trackStartOffset = getTrackOffset();
      isTouching = true;
      touchDirection = null;
      outer.classList.add("dragging");
      pauseAuto();
    },
    { passive: true },
  );

  outer.addEventListener(
    "touchmove",
    (e) => {
      if (!isTouching) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      // Decide direction on first significant movement
      if (!touchDirection) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          touchDirection =
            Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        }
        return;
      }

      // Let the browser handle vertical scrolls normally
      if (touchDirection === "vertical") return;

      // Horizontal swipe — prevent page scroll and move carousel
      e.preventDefault();
      touchCurrentX = e.touches[0].clientX;
      const diff = touchStartX - touchCurrentX;
      const newOffset = trackStartOffset + diff;
      track.style.transform = `translateX(-${newOffset}px)`;
    },
    { passive: false },
  );

  outer.addEventListener("touchend", () => {
    if (!isTouching) return;
    isTouching = false;
    touchDirection = null;
    outer.classList.remove("dragging");

    const diff = touchStartX - touchCurrentX;
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    } else {
      goTo(currentIndex);
    }
    resumeAuto();
  });

  // Prevent link/image drag interference
  track.addEventListener("dragstart", (e) => e.preventDefault());

  window.addEventListener("resize", onResize);

  buildDots();
  goTo(0);
})();

/* ──────────────────────────────────────────────
   4. SHOWCASE — Tab switcher
────────────────────────────────────────────── */
(function () {
  const tabs = document.querySelectorAll(".showcase-tab");
  const panels = document.querySelectorAll(".showcase-panel");

  function activateTab(tabId) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));

    panels.forEach((p) => {
      if (p.dataset.panel === tabId) {
        p.classList.add("active");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => p.classList.add("visible"));
        });
      } else {
        p.classList.remove("active", "visible");
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document
        .querySelector(".showcase-panel.active")
        ?.classList.add("visible");
    });
  });
})();

/* ──────────────────────────────────────────────
   5. TIMELINE — Scroll-triggered fade-in
────────────────────────────────────────────── */
(function () {
  const items = document.querySelectorAll(".timeline-item");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("visible"), i * 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  items.forEach((item) => observer.observe(item));
})();

/* ──────────────────────────────────────────────
   POPUP — open / close
────────────────────────────────────────────── */
function openPopup() {
  document.getElementById("popupOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  clearAllErrors();
}

function closePopup() {
  document.getElementById("popupOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("popupOverlay").addEventListener("click", function (e) {
  if (e.target === this) closePopup();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePopup();
});

document.querySelectorAll(".btn-primary").forEach((btn) => {
  // Don't attach popup opener to the submit button inside the form
  if (btn.classList.contains("popup-submit")) return;
  btn.addEventListener("click", openPopup);
});

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.remove("open");
    document.querySelector(".hamburger").classList.remove("active");
    document.body.style.overflow = "";
  });
});

/* ══════════════════════════════════════════════════════════
   6. CONTACT FORM — Validation + API Submission
══════════════════════════════════════════════════════════ */
(function () {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const LIMITS = {
    full_name: 100,
    email: 150,
    phone: 30,
    message: 2000,
  };

  // ── Character counters ──
  // Add live counters to fields with limits
  function setupCounters() {
    const messageField = document.querySelector(
      '.popup-field textarea[name="message"]',
    );
    if (messageField) {
      addCounter(messageField, LIMITS.message);
    }
  }

  function addCounter(field, max) {
    const counter = document.createElement("span");
    counter.className = "field-counter";
    counter.textContent = `0 / ${max}`;
    field.parentElement.appendChild(counter);

    field.addEventListener("input", () => {
      const len = field.value.length;
      counter.textContent = `${len} / ${max}`;
      if (len > max) {
        counter.classList.add("over-limit");
      } else {
        counter.classList.remove("over-limit");
      }
    });
  }

  // ── Enforce maxlength on input ──
  function enforceMaxLengths() {
    const fields = {
      'input[name="full_name"]': LIMITS.full_name,
      'input[name="email"]': LIMITS.email,
      'input[name="phone"]': LIMITS.phone,
      'textarea[name="message"]': LIMITS.message,
    };

    Object.entries(fields).forEach(([selector, max]) => {
      const el = document.querySelector(`.popup-field ${selector}`);
      if (el) el.setAttribute("maxlength", max);
    });
  }

  // ── Error display helpers ──
  function showFieldError(field, message) {
    clearFieldError(field);
    const err = document.createElement("span");
    err.className = "field-error";
    err.textContent = message;
    field.parentElement.appendChild(err);
    field.classList.add("input-error");
  }

  function clearFieldError(field) {
    const existing = field.parentElement.querySelector(".field-error");
    if (existing) existing.remove();
    field.classList.remove("input-error");
  }

  function clearAllErrors() {
    document.querySelectorAll(".field-error").forEach((e) => e.remove());
    document
      .querySelectorAll(".input-error")
      .forEach((e) => e.classList.remove("input-error"));
    const statusMsg = document.querySelector(".popup-status");
    if (statusMsg) statusMsg.remove();
  }

  // ── Validate individual field ──
  function validateField(field, name) {
    const value = field.value.trim();

    switch (name) {
      case "full_name":
        if (!value) return "Full name is required";
        if (value.length > LIMITS.full_name)
          return `Maximum ${LIMITS.full_name} characters`;
        return null;

      case "email":
        if (!value) return "Email is required";
        if (value.length > LIMITS.email)
          return `Maximum ${LIMITS.email} characters`;
        if (!EMAIL_REGEX.test(value))
          return "Please enter a valid email address";
        return null;

      case "phone":
        if (value && value.length > LIMITS.phone)
          return `Maximum ${LIMITS.phone} characters`;
        return null;

      case "message":
        if (!value) return "Message is required";
        if (value.length > LIMITS.message)
          return `Maximum ${LIMITS.message} characters`;
        return null;

      default:
        return null;
    }
  }

  // ── Live validation on blur ──
  function setupLiveValidation() {
    const fieldNames = ["full_name", "email", "phone", "message"];
    fieldNames.forEach((name) => {
      const selector = name === "message" ? "textarea" : "input";
      const field = document.querySelector(
        `.popup-field ${selector}[name="${name}"]`,
      );
      if (!field) return;

      field.addEventListener("blur", () => {
        const error = validateField(field, name);
        if (error) {
          showFieldError(field, error);
        } else {
          clearFieldError(field);
        }
      });

      // Clear error on input
      field.addEventListener("input", () => {
        clearFieldError(field);
      });
    });
  }

  // ── Full form validation ──
  function validateForm() {
    const fields = {
      full_name: document.querySelector('.popup-field input[name="full_name"]'),
      email: document.querySelector('.popup-field input[name="email"]'),
      phone: document.querySelector('.popup-field input[name="phone"]'),
      message: document.querySelector('.popup-field textarea[name="message"]'),
    };

    let firstError = null;
    let isValid = true;

    Object.entries(fields).forEach(([name, field]) => {
      if (!field) return;
      const error = validateField(field, name);
      if (error) {
        showFieldError(field, error);
        if (!firstError) firstError = field;
        isValid = false;
      } else {
        clearFieldError(field);
      }
    });

    if (firstError) firstError.focus();
    return isValid;
  }

  // ── Status message ──
  function showStatus(type, text) {
    const existing = document.querySelector(".popup-status");
    if (existing) existing.remove();

    const msg = document.createElement("div");
    msg.className = `popup-status popup-status-${type}`;
    msg.textContent = text;
    msg.setAttribute("role", "alert");

    const submitBtn = document.querySelector(".popup-submit");
    submitBtn.parentElement.insertBefore(msg, submitBtn.nextSibling);

    if (type === "success") {
      setTimeout(() => msg.remove(), 10000);
    }
  }

  // ── Submit handler ──
  async function handleSubmit() {
    clearAllErrors();

    if (!validateForm()) return;

    const fullName = document
      .querySelector('.popup-field input[name="full_name"]')
      .value.trim();
    const email = document
      .querySelector('.popup-field input[name="email"]')
      .value.trim();
    const phone = document
      .querySelector('.popup-field input[name="phone"]')
      .value.trim();
    const message = document
      .querySelector('.popup-field textarea[name="message"]')
      .value.trim();
    const honeypot =
      document.querySelector('.popup-field input[name="website_url"]')?.value ||
      "";
    const turnstileToken =
      document.querySelector('input[name="cf-turnstile-response"]')?.value ||
      "";

    // Check Turnstile
    if (!turnstileToken) {
      showStatus("error", "Please complete the CAPTCHA verification.");
      return;
    }

    const submitBtn = document.querySelector(".popup-submit");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone: phone,
          message: message,
          website_url: honeypot,
          cf_turnstile_response: turnstileToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Something went wrong. Please try again.",
        );
      }

      // Success
      showStatus(
        "success",
        "Thank you! We'll get back to you within 24 hours.",
      );

      // Reset form fields
      document.querySelector('.popup-field input[name="full_name"]').value = "";
      document.querySelector('.popup-field input[name="email"]').value = "";
      document.querySelector('.popup-field input[name="phone"]').value = "";
      document.querySelector('.popup-field textarea[name="message"]').value =
        "";

      // Reset counter
      const counter = document.querySelector(".field-counter");
      if (counter) counter.textContent = `0 / ${LIMITS.message}`;

      // Reset Turnstile
      if (window.turnstile) {
        turnstile.reset();
      }
    } catch (error) {
      showStatus("error", error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // ── Initialize on DOM ready ──
  function init() {
    enforceMaxLengths();
    setupCounters();
    setupLiveValidation();

    const submitBtn = document.querySelector(".popup-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
