/**
 * templates.mjs — page templates for the Sirius HIM site.
 * Every page is assembled as: head + skip-link + dev notice + header + main + footer.
 * All copy comes from the editable JSON in /content — nothing is hardcoded here
 * except structure. Keep markup semantic: exactly one <h1> per page.
 */

const e = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const ARROW =
  '<svg class="icon icon--arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const PLAY =
  '<svg class="icon icon--play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.5 6.2v11.6L18.4 12 8.5 6.2Z" fill="currentColor"/></svg>';

const PENDING_ATTR = 'title="Link coming soon"';

const stripTrailing = (s) => String(s || '').replace(/\/+$/, '');

const absoluteUrl = (site, path) => {
  const base = stripTrailing(site.siteUrl) || 'https://example.com';
  if (!path) return base;
  return `${base}/${String(path).replace(/^\/+/, '')}`;
};

const canonicalFor = (site, file) =>
  file === 'index.html' ? `${stripTrailing(site.siteUrl)}/` : absoluteUrl(site, file);

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
};

const publicList = (items) =>
  (items ?? []).filter((item) => item && !String(item.id ?? item.label ?? item.title ?? '').startsWith('_'));

/* ------------------------------------------------------------------ *
 * Shared chrome
 * ------------------------------------------------------------------ */

const NAV = [
  ['index.html', 'Home'],
  ['music.html', 'Music'],
  ['about.html', 'About'],
  ['videos.html', 'Videos'],
  ['connect.html', 'Connect'],
];

const header = (site, active) => `
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="wordmark" href="index.html" aria-label="${e(site.artistName)} — home">${e(site.artistName)}</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
      <span class="nav-toggle-box" aria-hidden="true"><span></span><span></span></span>
      <span class="sr-only">Menu</span>
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Primary" data-nav>
      <ul class="nav-list">
        ${NAV.map(
          ([href, label]) =>
            `<li><a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a></li>`,
        ).join('\n        ')}
      </ul>
    </nav>
  </div>
</header>`;

const socialPills = (site) =>
  publicList(site.socials)
    .map((s) =>
      s.url
        ? `<a class="pill pill--link" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)}${ARROW}<span class="sr-only"> (opens in a new tab)</span></a>`
        : `<span class="pill pill--pending" ${PENDING_ATTR}>${e(s.label)}<span class="sr-only"> — link coming soon</span></span>`,
    )
    .join('\n      ');

const footer = (site) => `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="wordmark wordmark--footer" href="index.html">${e(site.artistName)}</a>
      <p class="footer-tagline">${e(site.tagline)}</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <h2 class="footer-heading">Explore</h2>
      <ul>
        ${NAV.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    <div class="footer-social">
      <h2 class="footer-heading">Follow</h2>
      <div class="pill-row">
      ${socialPills(site)}
      </div>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>&copy; <span data-current-year>2026</span> ${e(site.artistName)}. All rights reserved.</p>
    <p class="footer-locale">Independent artist &middot; ${e(site.location)}</p>
  </div>
</footer>`;

const devNotice = (isDev) =>
  isDev
    ? `
<div class="dev-notice" data-dev-notice>
  <div class="container dev-notice-inner">
    <p><strong>Local preview:</strong> draft content is visible. Edit <code>content/site.json</code>, <code>content/releases.json</code> and <code>content/videos.json</code> to publish real releases, links and videos &mdash; see README.md.</p>
    <button type="button" class="dev-notice-close" data-dismiss-notice aria-label="Dismiss notice">&times;</button>
  </div>
</div>`
    : '';

const head = ({ site, title, description, file, jsonLd }) => {
  const canonical = canonicalFor(site, file);
  const image = absoluteUrl(site, site.ogImage || '/og.svg');
  const ld = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${e(canonical)}">
  <meta name="theme-color" content="#0a0a0c">
  <meta name="author" content="${e(site.artistName)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${e(site.artistName)}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(canonical)}">
  <meta property="og:image" content="${e(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(description)}">
  <meta name="twitter:image" content="${e(image)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <script type="application/ld+json">${ld}</script>
</head>`;
};

const document = ({ site, active, main, isDev, jsonLd, title, description, file, bodyClass }) => `
${head({ site, title, description, file, jsonLd })}
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
  <a class="skip-link" href="#main">Skip to content</a>
  ${devNotice(isDev).trim()}
  ${header(site, active)}
  <main id="main">
${main}
  </main>
  ${footer(site)}
  <script type="module" src="/assets/js/main.js"></script>
</body>
</html>
`;

/* ------------------------------------------------------------------ *
 * Components
 * ------------------------------------------------------------------ */

const linkPills = (release) => {
  const links = (release.links ?? []).filter((l) => l && l.service);
  if (!links.length) return '';
  return `
      <div class="pill-row release-links">
        ${links
          .map((l) =>
            l.url
              ? `<a class="pill pill--link" href="${e(l.url)}" target="_blank" rel="noopener noreferrer">Listen on ${e(l.service)}${ARROW}<span class="sr-only"> (opens in a new tab)</span></a>`
              : `<span class="pill pill--pending" ${PENDING_ATTR}>${e(l.service)}<span class="sr-only"> — link coming soon</span></span>`,
          )
          .join('\n        ')}
      </div>`;
};

const releaseMetaLine = (release) =>
  [release.releaseType, formatDate(release.releaseDate)].filter(Boolean).map(e).join(' &middot; ');

const releaseCard = (release) => {
  const meta = releaseMetaLine(release);
  return `
      <article class="release-card" data-reveal>
        <div class="release-art">
          <img src="${e(release.artwork)}" alt="${e(
            release.artworkAlt || `${release.title} cover artwork`,
          )}" width="1000" height="1000" loading="lazy" decoding="async">
          ${release.placeholder ? '<span class="badge badge--draft">Coming soon</span>' : ''}
        </div>
        <div class="release-body">
          ${meta ? `<p class="release-meta">${meta}</p>` : ''}
          <h3 class="release-title">${e(release.title)}</h3>
          ${release.description ? `<p class="release-desc">${e(release.description)}</p>` : ''}
          ${linkPills(release)}
        </div>
      </article>`;
};

const featuredRelease = (release) => {
  const meta = releaseMetaLine(release);
  return `
      <article class="featured-card" data-reveal>
        <div class="featured-art">
          <img src="${e(release.artwork)}" alt="${e(
            release.artworkAlt || `${release.title} cover artwork`,
          )}" width="1000" height="1000" decoding="async">
          ${release.placeholder ? '<span class="badge badge--draft">Coming soon</span>' : ''}
        </div>
        <div class="featured-body">
          <p class="eyebrow">Featured release</p>
          ${meta ? `<p class="release-meta">${meta}</p>` : ''}
          <h3 class="featured-title">${e(release.title)}</h3>
          ${release.description ? `<p class="featured-desc">${e(release.description)}</p>` : ''}
          ${linkPills(release)}
          <a class="text-link" href="music.html">All music${ARROW}</a>
        </div>
      </article>`;
};

const videoCard = (video) => {
  const id = String(video.youtubeId ?? '').trim();
  const valid = /^[A-Za-z0-9_-]{6,20}$/.test(id);
  if (valid) {
    return `
        <article class="video-card" data-reveal>
          <div class="video-frame">
            <iframe src="https://www.youtube-nocookie.com/embed/${e(id)}" title="${e(video.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          </div>
          <h3 class="video-title">${e(video.title)}</h3>
          ${video.description ? `<p class="video-desc">${e(video.description)}</p>` : ''}
        </article>`;
  }
  return `
        <article class="video-card" data-reveal>
          <div class="video-frame video-frame--pending">
            <div class="pending-glyph">${PLAY}</div>
            <p class="pending-label">Video coming soon</p>
          </div>
          <h3 class="video-title">${e(video.title)}</h3>
          ${video.description ? `<p class="video-desc">${e(video.description)}</p>` : ''}
        </article>`;
};

const shortCard = (short) => {
  const id = String(short.youtubeId ?? '').trim();
  const valid = /^[A-Za-z0-9_-]{6,20}$/.test(id);
  if (valid) {
    return `
        <a class="short-card" href="https://www.youtube.com/shorts/${e(id)}" target="_blank" rel="noopener noreferrer" data-reveal>
          <img src="https://i.ytimg.com/vi/${e(id)}/hqdefault.jpg" alt="${e(short.title)}" width="480" height="360" loading="lazy" decoding="async">
          <span class="short-overlay"><span class="short-play">${PLAY}</span><span class="short-title">${e(short.title)}</span></span>
          <span class="sr-only">Watch on YouTube (opens in a new tab)</span>
        </a>`;
  }
  return `
        <div class="short-card short-card--pending" data-reveal>
          <div class="short-pending-inner"><span class="short-play">${PLAY}</span><span class="short-title">${e(short.title)}</span><span class="short-note">Coming soon</span></div>
        </div>`;
};

const pageHero = ({ eyebrow, title, lede }) => `
  <section class="page-hero">
    <div class="container">
      ${eyebrow ? `<p class="eyebrow" data-reveal>${eyebrow}</p>` : ''}
      <h1 class="page-title" data-reveal>${title}</h1>
      ${lede ? `<p class="page-lede" data-reveal>${lede}</p>` : ''}
    </div>
  </section>`;

const webpageLd = ({ site, title, description, file }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonicalFor(site, file),
  isPartOf: { '@type': 'WebSite', name: site.artistName, url: stripTrailing(site.siteUrl) },
});

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

const homePage = (ctx) => {
  const { site, releases, isDev } = ctx;
  const featured = releases.find((r) => r.featured) ?? releases[0];
  const words = [...(site.genres ?? []), site.location, 'Independent artist'].filter(Boolean);
  const run = words
    .map((w) => `<span>${e(w)}</span>`)
    .join('<span class="marquee-dot" aria-hidden="true">&middot;</span>');

  const featuredSection = featured
    ? `<section class="section" aria-labelledby="featured-heading">
      <div class="container">
        <h2 class="section-title" id="featured-heading" data-reveal>Latest drop</h2>
        ${featuredRelease(featured)}
      </div>
    </section>`
    : `<section class="section" aria-labelledby="featured-heading">
      <div class="container">
        <h2 class="section-title" id="featured-heading" data-reveal>Latest drop</h2>
        <p class="empty-state" data-reveal>New music is on the way. <a class="text-link" href="connect.html">Stay close${ARROW}</a></p>
      </div>
    </section>`;

  const main = `
    <section class="hero">
      <div class="hero-scene" aria-hidden="true">
        <span class="hero-sun"></span>
        <span class="hero-glow"></span>
        <span class="hero-horizon"></span>
      </div>
      <div class="container hero-inner">
        <p class="eyebrow hero-eyebrow" data-reveal>${e(site.location)}</p>
        <h1 class="hero-title" data-reveal>Sirius <em>HIM</em></h1>
        <p class="hero-lede" data-reveal>${e(site.tagline)}</p>
        <p class="hero-intro" data-reveal>${e(site.bioShort)}</p>
        <div class="hero-actions" data-reveal>
          <a class="btn btn--primary" href="music.html">Explore Music</a>
          <a class="btn btn--ghost" href="about.html">The story</a>
        </div>
      </div>
      <div class="hero-scroll" aria-hidden="true"><span></span></div>
    </section>

    <div class="marquee" aria-hidden="true">
      <div class="marquee-track">${run}<span class="marquee-dot">&middot;</span>${run}<span class="marquee-dot">&middot;</span>${run}<span class="marquee-dot">&middot;</span></div>
    </div>

    ${featuredSection}

    <section class="section section--band" aria-labelledby="home-band-heading">
      <div class="container band-inner">
        <h2 class="band-title" id="home-band-heading" data-reveal>Built in Runaway Bay.<br><em>Made for everywhere.</em></h2>
        <div class="band-actions" data-reveal>
          <a class="btn btn--ghost" href="videos.html">Watch videos</a>
          <a class="btn btn--ghost" href="connect.html">Connect</a>
        </div>
      </div>
    </section>`;

  return document({
    ...ctx,
    active: 'index.html',
    bodyClass: 'page-home',
    title: `${site.artistName} — Melodic Dancehall & R&B from Runaway Bay, Jamaica`,
    description: site.bioShort,
    file: 'index.html',
    main,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: site.artistName, url: stripTrailing(site.siteUrl) },
        {
          '@type': 'MusicGroup',
          name: site.artistName,
          description: site.bioShort,
          genre: (site.genres ?? []).join(', '),
          area: { '@type': 'Place', name: site.location },
          url: stripTrailing(site.siteUrl),
          ...(publicList(site.socials).some((s) => s.url)
            ? { sameAs: publicList(site.socials).filter((s) => s.url).map((s) => s.url) }
            : {}),
        },
      ],
    },
  });
};

const musicPage = (ctx) => {
  const { site, releases, isDev } = ctx;
  const description = `Releases by ${site.artistName} — melodic dancehall and R&B from Runaway Bay, Jamaica. Listen on your favourite streaming service.`;

  const main = `
    ${pageHero({
      eyebrow: 'Discography',
      title: 'Music',
      lede: 'Melodic dancehall and R&B, straight from Runaway Bay. New releases land here first.',
    })}
    <section class="section section--tight" aria-labelledby="releases-heading">
      <div class="container">
        <h2 class="sr-only" id="releases-heading">Releases</h2>
        <div class="release-grid">
          ${releases.map(releaseCard).join('\n')}
        </div>
        ${
          releases.length
            ? ''
            : `<p class="empty-state" data-reveal>The first release is on the way. <a class="text-link" href="connect.html">Stay close${ARROW}</a></p>`
        }
      </div>
    </section>

    <section class="section section--band" aria-labelledby="music-band-heading">
      <div class="container band-inner">
        <h2 class="band-title" id="music-band-heading" data-reveal>Don&rsquo;t miss the next drop.</h2>
        <div class="band-actions" data-reveal>
          <a class="btn btn--primary" href="connect.html">Follow Sirius HIM</a>
        </div>
      </div>
    </section>`;

  return document({
    ...ctx,
    active: 'music.html',
    bodyClass: 'page-music',
    title: `Music — ${site.artistName}`,
    description,
    file: 'music.html',
    main,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'MusicAlbum',
      byArtist: { '@type': 'MusicGroup', name: site.artistName, url: stripTrailing(site.siteUrl) },
      name: `${site.artistName} — releases`,
      description,
      url: canonicalFor(site, 'music.html'),
    },
  });
};

const aboutPage = (ctx) => {
  const { site, about = {}, isDev } = ctx;
  const description = `The story of ${site.artistName} — an independent melodic dancehall and R&B artist from Runaway Bay, Jamaica.`;

  const main = `
    ${pageHero({
      eyebrow: site.location,
      title: `About <em>${e(site.artistName)}</em>`,
      lede: e(about.lede || ''),
    })}

    <section class="section section--tight" aria-labelledby="story-heading">
      <div class="container story-grid">
        <div class="story-portrait" data-reveal>
          <img src="${e(about.portrait || 'assets/img/portrait.svg')}" alt="${e(about.portraitAlt || site.artistName)}" width="900" height="1200" loading="lazy" decoding="async">
        </div>
        <div class="story-body">
          <h2 class="sr-only" id="story-heading">The story</h2>
          ${(about.paragraphs ?? [])
            .filter(Boolean)
            .map((paragraph) => `<p data-reveal>${e(paragraph)}</p>`)
            .join('\n          ')}
          <blockquote class="pull-quote" data-reveal>
            <p class="pull-quote-text">${e(about.pullQuote?.text || '')}</p>
            ${about.pullQuote?.cite ? `<cite class="pull-quote-cite">&mdash; ${e(about.pullQuote.cite)}</cite>` : ''}
          </blockquote>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="sound-heading">
      <div class="container">
        <h2 class="section-title" id="sound-heading" data-reveal>The sound</h2>
        <div class="facts-grid">
          ${(about.facts ?? [])
            .filter((fact) => fact && fact.label && fact.value)
            .map(
              (fact) => `
          <div class="fact" data-reveal>
            <h3 class="fact-label">${e(fact.label)}</h3>
            <p class="fact-value">${e(fact.value)}</p>
          </div>`,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="section section--band" aria-labelledby="about-band-heading">
      <div class="container band-inner">
        <h2 class="band-title" id="about-band-heading" data-reveal>Hear where it&rsquo;s going.</h2>
        <div class="band-actions" data-reveal>
          <a class="btn btn--primary" href="music.html">Explore Music</a>
          <a class="btn btn--ghost" href="connect.html">Connect</a>
        </div>
      </div>
    </section>`;

  return document({
    ...ctx,
    active: 'about.html',
    bodyClass: 'page-about',
    title: `About — ${site.artistName}`,
    description,
    file: 'about.html',
    main,
    jsonLd: webpageLd({ site, title: `About — ${site.artistName}`, description, file: 'about.html' }),
  });
};

const videosPage = (ctx) => {
  const { site, videos, shorts, isDev } = ctx;
  const description = `Music videos and short-form content from ${site.artistName} — melodic dancehall and R&B from Runaway Bay, Jamaica.`;

  const main = `
    ${pageHero({
      eyebrow: 'On screen',
      title: 'Videos',
      lede: 'Music videos, visualisers and short-form drops. New footage lands here and on the official channel.',
    })}

    <section class="section section--tight" aria-labelledby="videos-heading">
      <div class="container">
        <h2 class="section-title" id="videos-heading" data-reveal>Music videos</h2>
        <div class="video-grid">
          ${videos.map(videoCard).join('\n')}
        </div>
        ${videos.length ? '' : '<p class="empty-state" data-reveal>Videos are on the way.</p>'}
      </div>
    </section>

    <section class="section" aria-labelledby="shorts-heading">
      <div class="container">
        <h2 class="section-title" id="shorts-heading" data-reveal>Shorts</h2>
        <div class="shorts-row">
          ${shorts.map(shortCard).join('\n')}
        </div>
        ${shorts.length ? '' : '<p class="empty-state" data-reveal>Short-form clips are on the way.</p>'}
      </div>
    </section>`;

  return document({
    ...ctx,
    active: 'videos.html',
    bodyClass: 'page-videos',
    title: `Videos — ${site.artistName}`,
    description,
    file: 'videos.html',
    main,
    jsonLd: webpageLd({ site, title: `Videos — ${site.artistName}`, description, file: 'videos.html' }),
  });
};

const connectPage = (ctx) => {
  const { site, isDev } = ctx;
  const description = `Connect with ${site.artistName} — official social profiles and contact for booking and press. Runaway Bay, Jamaica.`;
  const email = String(site.contactEmail ?? '').trim();

  const contactBlock = email
    ? `
          <p class="contact-direct">Or email directly: <a class="text-link" href="mailto:${e(email)}">${e(email)}</a></p>
          <form class="contact-form" data-contact-form data-dest="${e(email)}" novalidate>
            <div class="field">
              <label for="contact-name">Name</label>
              <input id="contact-name" name="name" type="text" autocomplete="name" required>
            </div>
            <div class="field">
              <label for="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" autocomplete="email" required>
            </div>
            <div class="field">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows="5" required></textarea>
            </div>
            <p class="form-note">Opens in your own email app &mdash; nothing is stored on this site.</p>
            <button class="btn btn--primary" type="submit">Send message</button>
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>`
    : `
          <p class="contact-pending">Booking and press contact is opening soon. Follow the official profiles above &mdash; they&rsquo;ll be first with every announcement.</p>
          <form class="contact-form contact-form--locked" data-contact-form data-dest="" novalidate>
            <div class="field">
              <label for="contact-name">Name</label>
              <input id="contact-name" name="name" type="text" autocomplete="name" disabled>
            </div>
            <div class="field">
              <label for="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" autocomplete="email" disabled>
            </div>
            <div class="field">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows="5" disabled></textarea>
            </div>
            <button class="btn btn--ghost" type="button" disabled aria-disabled="true">Contact coming soon</button>
          </form>`;

  const main = `
    ${pageHero({
      eyebrow: 'Say hello',
      title: 'Connect',
      lede: 'Follow the journey, or reach out for bookings, press and collaborations.',
    })}

    <section class="section section--tight" aria-labelledby="socials-heading">
      <div class="container connect-grid">
        <div class="connect-socials">
          <h2 class="section-title" id="socials-heading" data-reveal>Official profiles</h2>
          <ul class="social-list">
            ${publicList(site.socials)
              .map((s) =>
                s.url
                  ? `<li data-reveal><a class="social-row" href="${e(s.url)}" target="_blank" rel="noopener noreferrer"><span class="social-name">${e(s.label)}</span><span class="social-cta">Open${ARROW}<span class="sr-only"> ${e(s.label)} profile (opens in a new tab)</span></span></a></li>`
                  : `<li data-reveal><span class="social-row social-row--pending"><span class="social-name">${e(s.label)}</span><span class="social-cta">${PENDING_ATTR}>Coming soon</span></span></li>`,
              )
              .join('\n            ')}
          </ul>
        </div>
        <div class="connect-contact" data-reveal>
          <h2 class="section-title">Get in touch</h2>
          ${contactBlock}
        </div>
      </div>
    </section>`;

  return document({
    ...ctx,
    active: 'connect.html',
    bodyClass: 'page-connect',
    title: `Connect — ${site.artistName}`,
    description,
    file: 'connect.html',
    main,
    jsonLd: webpageLd({ site, title: `Connect — ${site.artistName}`, description, file: 'connect.html' }),
  });
};

/* ------------------------------------------------------------------ *
 * Build outputs
 * ------------------------------------------------------------------ */

export const renderPages = (ctx) => ({
  'index.html': homePage(ctx),
  'music.html': musicPage(ctx),
  'about.html': aboutPage(ctx),
  'videos.html': videosPage(ctx),
  'connect.html': connectPage(ctx),
});

export const renderRobots = (site) =>
  ['User-agent: *', 'Allow: /', '', `Sitemap: ${absoluteUrl(site, 'sitemap.xml')}`, ''].join('\n');

export const renderSitemap = (site) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['index.html', 'music.html', 'about.html', 'videos.html', 'connect.html']
    .map((file) => {
      const loc = file === 'index.html' ? `${stripTrailing(site.siteUrl)}/` : absoluteUrl(site, file);
      return `  <url>\n    <loc>${e(loc)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};
