/**
 * main.js — all behaviour for the Sirius HIM site.
 * No frameworks, no trackers, no network calls except what the browser makes
 * for embedded players. Everything degrades to a working page without JS.
 */

/* --- Mobile navigation --------------------------------------------------- */

const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

const setNav = (open) => {
  if (!navToggle || !nav) return;
  navToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
};

navToggle?.addEventListener('click', () => {
  setNav(navToggle.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setNav(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setNav(false);
});

/* --- Header shadow on scroll -------------------------------------------- */

const header = document.querySelector('[data-header]');
if (header) {
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

/* --- Scroll reveals ------------------------------------------------------ */

const revealables = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealables.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    observer.observe(el);
  });
}

/* --- Footer year --------------------------------------------------------- */

document.querySelectorAll('[data-current-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

/* --- Contact form --------------------------------------------------------
 * With no backend by design: the form composes a mailto: link and hands it to
 * the visitor's email app. If the contact address is not configured yet it
 * says so honestly instead of silently doing nothing.
 */

const contactForm = document.querySelector('[data-contact-form]');

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = contactForm.querySelector('[data-form-status]');
  const dest = (contactForm.getAttribute('data-dest') || '').trim();

  const show = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };

  if (!dest) {
    show('Contact is not open yet — check back soon.', true);
    return;
  }

  const data = new FormData(contactForm);
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();

  if (!name || !email || !message) {
    show('Please fill in your name, email and message.', true);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    show('Please enter a valid email address.', true);
    return;
  }

  const subject = encodeURIComponent(`Website enquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
  show('Opening your email app…');
  window.location.href = `mailto:${dest}?subject=${subject}&body=${body}`;
});

/* --- Dev notice dismissal (local previews only) --------------------------- */

document.querySelector('[data-dismiss-notice]')?.addEventListener('click', (event) => {
  event.target.closest('[data-dev-notice]')?.remove();
});
