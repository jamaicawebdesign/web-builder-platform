import {
  BackgroundVariant,
  ContactFormField,
  ExportOptions,
  PaddingSize,
  SiteBlock,
  SitePage,
  SiteProject,
  SiteTheme,
} from '../types/builder';
import {
  getEffectiveBookingSlots,
  getEffectiveContactFields,
} from './contactForm';
import {
  ensureProjectPages,
  formatPageFileName,
  normalizePagePath,
} from './sitePages';
import { resolveVideoSource } from './videoEmbed';

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeCssColor(val: string, fallback: string): string {
  return /^#[0-9a-fA-F]{3,8}$|^rgba?\([^)]+\)$/.test(val.trim()) ? val.trim() : fallback;
}

function safeFontName(val: string, fallback: string): string {
  const clean = val.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  return clean || fallback;
}

function getGoogleFontsUrl(theme: SiteTheme): string {
  const fonts = Array.from(
    new Set([
      safeFontName(theme.displayFont, 'Plus Jakarta Sans'),
      safeFontName(theme.bodyFont, 'DM Sans'),
    ])
  );
  const query = fonts
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

function sectionBgClass(variant: BackgroundVariant, p: string): string {
  if (variant === 'surface') return `${p}bg-surface`;
  if (variant === 'contrast') return `${p}bg-contrast`;
  return `${p}bg-canvas`;
}

function sectionPadClass(pad: PaddingSize, p: string): string {
  if (pad === 'compact') return `${p}py-compact`;
  if (pad === 'spacious') return `${p}py-spacious`;
  return `${p}py-normal`;
}

function renderBlockHtml(block: SiteBlock, p: string): string {
  const bgCls = sectionBgClass(block.backgroundVariant, p);
  const padCls = sectionPadClass(block.paddingY, p);

  switch (block.type) {
    case 'navbar': {
      const linksHtml = block.props.links
        .map(
          (l) =>
            `<a href="${escapeHtml(l.href)}" class="${p}nav-link">${escapeHtml(l.label)}</a>`
        )
        .join('\n          ');
      return `  <header class="${p}navbar ${bgCls}">
    <div class="${p}container ${p}navbar-inner">
      <a href="/" class="${p}brand">${escapeHtml(block.props.brandName)}</a>
      <nav class="${p}nav-links" aria-label="Primary navigation">
          ${linksHtml}
      </nav>
      <div class="${p}nav-actions">
        <a href="${escapeHtml(block.props.ctaHref)}" class="${p}btn ${p}btn-primary ${p}btn-sm">${escapeHtml(
        block.props.ctaLabel
      )}</a>
        <button type="button" class="${p}menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">Menu</button>
      </div>
    </div>
  </header>`;
    }

    case 'hero': {
      const heroLayout = block.props.layout || 'split';
      const isCentered = heroLayout === 'centered';
      const isSplitLeft = heroLayout === 'split-left';
      const isBanner = heroLayout === 'banner' && Boolean(block.props.imageUrl);
      if (isBanner) {
        return `  <section class="${p}section ${p}hero ${p}hero-banner-wrap ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}hero-banner">
        <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
          block.props.imageAlt || block.props.headline
        )}" class="${p}hero-banner-bg" loading="eager" />
        <div class="${p}hero-banner-scrim" aria-hidden="true"></div>
        <div class="${p}hero-banner-content">
          ${
            block.props.kicker
              ? `<p class="${p}kicker ${p}kicker-on-dark">${escapeHtml(block.props.kicker)}</p>`
              : ''
          }
          <h1 class="${p}hero-title">${escapeHtml(block.props.headline)}</h1>
          <p class="${p}hero-subtitle">${escapeHtml(block.props.subtitle)}</p>
          <div class="${p}btn-group">
            <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
          block.props.primaryCtaLabel
        )}</a>
            ${
              block.props.secondaryCtaLabel
                ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary-on-dark">${escapeHtml(
                    block.props.secondaryCtaLabel
                  )}</a>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>
  </section>`;
      }
      const heroWrapCls = isCentered
        ? `${p}hero-centered`
        : isSplitLeft
          ? `${p}hero-split ${p}hero-split-left`
          : `${p}hero-split`;
      return `  <section class="${p}section ${p}hero ${bgCls} ${padCls}">
    <div class="${p}container ${heroWrapCls}">
      <div class="${p}hero-copy">
        ${
          block.props.kicker
            ? `<p class="${p}kicker">${escapeHtml(block.props.kicker)}</p>`
            : ''
        }
        <h1 class="${p}hero-title">${escapeHtml(block.props.headline)}</h1>
        <p class="${p}hero-subtitle">${escapeHtml(block.props.subtitle)}</p>
        <div class="${p}btn-group">
          <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
        block.props.primaryCtaLabel
      )}</a>
          ${
            block.props.secondaryCtaLabel
              ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary">${escapeHtml(
                  block.props.secondaryCtaLabel
                )}</a>`
              : ''
          }
        </div>
      </div>
      ${
        block.props.imageUrl
          ? `<div class="${p}hero-media">
        <div class="${p}media-frame">
          <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
              block.props.imageAlt || block.props.headline
            )}" class="${p}media-img" loading="eager" />
        </div>
      </div>`
          : ''
      }
    </div>
  </section>`;
    }

    case 'stats': {
      const statsLayout = block.props.layout || 'strip';
      const statsWrapCls =
        statsLayout === 'cards'
          ? `${p}stats-cards`
          : statsLayout === 'grid-2'
            ? `${p}stats-grid-2`
            : `${p}stats-grid`;
      const itemsHtml = block.props.items
        .map(
          (item) => `      <div class="${p}stat-item ${p}reveal">
        <div class="${p}stat-value">${escapeHtml(item.value)}</div>
        <div class="${p}stat-label">${escapeHtml(item.label)}</div>
        <div class="${p}stat-context">${escapeHtml(item.context)}</div>
      </div>`
        )
        .join('\n');
      return `  <section id="metrics" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      ${
        block.props.heading
          ? `<h2 class="${p}eyebrow ${p}mb-sm ${p}reveal">${escapeHtml(block.props.heading)}</h2>`
          : ''
      }
      <div class="${statsWrapCls}">
${itemsHtml}
      </div>
    </div>
  </section>`;
    }

    case 'features': {
      const featLayout = block.props.layout || 'cards';
      const colsCls =
        block.props.columns === 4
          ? `${p}grid-4`
          : block.props.columns === 2
            ? `${p}grid-2`
            : `${p}grid-3`;
      let contentHtml = '';
      if (featLayout === 'numbered') {
        const rowsHtml = block.props.items
          .map(
            (item, idx) => `      <div class="${p}feat-numbered-row ${p}reveal">
        <div class="${p}feat-numbered-lead">
          <span class="${p}feat-num">${String(idx + 1).padStart(2, '0')}.</span>
          <div>
            <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
            ${item.meta ? `<p class="${p}feat-numbered-meta">${escapeHtml(item.meta)}</p>` : ''}
          </div>
        </div>
        <p class="${p}card-body">${escapeHtml(item.description)}</p>
      </div>`
          )
          .join('\n');
        contentHtml = `      <div class="${p}feat-numbered-list">\n${rowsHtml}\n      </div>`;
      } else if (featLayout === 'minimal') {
        const itemsHtml = block.props.items
          .map(
            (item, idx) => `      <article class="${p}feat-minimal ${idx === 0 ? `${p}feat-minimal-lead` : ''} ${p}reveal">
        ${item.meta ? `<p class="${p}feat-minimal-meta">${escapeHtml(item.meta)}</p>` : ''}
        <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
        <p class="${p}card-body">${escapeHtml(item.description)}</p>
      </article>`
          )
          .join('\n');
        contentHtml = `      <div class="${colsCls} ${p}feat-minimal-grid">\n${itemsHtml}\n      </div>`;
      } else if (featLayout === 'bento') {
        const itemsHtml = block.props.items
          .map(
            (item, idx) => `      <article class="${p}card ${
              idx % 4 === 0 || idx % 4 === 3 ? `${p}bento-wide` : ''
            } ${idx === 0 ? `${p}bento-featured` : ''} ${p}reveal">
        ${item.meta ? `<p class="${p}card-meta">${escapeHtml(item.meta)}</p>` : ''}
        <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
        <p class="${p}card-body">${escapeHtml(item.description)}</p>
      </article>`
          )
          .join('\n');
        contentHtml = `      <div class="${p}bento-grid">\n${itemsHtml}\n      </div>`;
      } else {
        const itemsHtml = block.props.items
          .map(
            (item) => `      <article class="${p}card ${p}reveal">
        ${item.meta ? `<p class="${p}card-meta">${escapeHtml(item.meta)}</p>` : ''}
        <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
        <p class="${p}card-body">${escapeHtml(item.description)}</p>
      </article>`
          )
          .join('\n');
        contentHtml = `      <div class="${colsCls}">\n${itemsHtml}\n      </div>`;
      }
      return `  <section id="approach" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
${contentHtml}
    </div>
  </section>`;
    }

    case 'showcase': {
      const showLayout = block.props.layout || 'split';
      const layoutCls =
        showLayout === 'stacked'
          ? `${p}split-stacked`
          : showLayout === 'wide-media'
            ? `${p}split ${p}split-wide-media ${
                block.props.imagePosition === 'left' ? `${p}split-reverse` : ''
              }`
            : `${p}split ${block.props.imagePosition === 'left' ? `${p}split-reverse` : ''}`;
      const bulletsHtml = block.props.bullets
        .map((b) => `          <li>${escapeHtml(b)}</li>`)
        .join('\n');
      return `  <section id="work" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${layoutCls}">
      <div class="${p}split-copy ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        <p class="${p}section-intro">${escapeHtml(block.props.body)}</p>
        ${bulletsHtml ? `<ul class="${p}check-list">\n${bulletsHtml}\n        </ul>` : ''}
        ${
          block.props.ctaLabel
            ? `<div class="${p}mt-md"><a href="${escapeHtml(
                block.props.ctaHref
              )}" class="${p}btn ${p}btn-secondary">${escapeHtml(block.props.ctaLabel)}</a></div>`
            : ''
        }
      </div>
      <div class="${p}split-media ${p}reveal">
        <div class="${p}media-frame">
          <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
        block.props.imageAlt || block.props.heading
      )}" class="${p}media-img" loading="lazy" />
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'pricing': {
      const pricingLayout = block.props.layout || 'cards';
      let bodyHtml = '';
      if (pricingLayout === 'rows') {
        const rowsHtml = block.props.tiers
          .map((tier) => {
            const featuresHtml = tier.features
              .map((f) => `          <li>${escapeHtml(f)}</li>`)
              .join('\n');
            return `      <div class="${p}pricing-row ${tier.highlighted ? `${p}pricing-featured` : ''} ${p}reveal">
        <div class="${p}pricing-row-lead">
          ${tier.highlighted ? `<p class="${p}pricing-kicker">Recommended</p>` : ''}
          <h3 class="${p}card-title">${escapeHtml(tier.name)}</h3>
          <p class="${p}pricing-audience">${escapeHtml(tier.audience)}</p>
          <div class="${p}pricing-price-row">
            <span class="${p}pricing-amount">${escapeHtml(tier.price)}</span>
            <span class="${p}pricing-cadence">${escapeHtml(tier.cadence)}</span>
          </div>
        </div>
        <div class="${p}pricing-row-features">
          <p class="${p}card-body">${escapeHtml(tier.description)}</p>
          <ul class="${p}pricing-list ${p}pricing-list-2col">\n${featuresHtml}\n          </ul>
        </div>
        <div class="${p}pricing-row-cta">
          <a href="#contact" class="${p}btn ${
              tier.highlighted ? `${p}btn-primary` : `${p}btn-secondary`
            } ${p}btn-full">${escapeHtml(tier.ctaLabel)}</a>
        </div>
      </div>`;
          })
          .join('\n');
        bodyHtml = `      <div class="${p}pricing-rows">\n${rowsHtml}\n      </div>`;
      } else {
        const tiersHtml = block.props.tiers
          .map((tier) => {
            const featuresHtml = tier.features
              .map((f) => `          <li>${escapeHtml(f)}</li>`)
              .join('\n');
            return `      <div class="${p}pricing-card ${tier.highlighted ? `${p}pricing-featured` : ''} ${p}reveal">
        <div class="${p}pricing-header">
          ${
            tier.highlighted
              ? `<p class="${p}pricing-kicker">Recommended</p>`
              : ''
          }
          <h3 class="${p}card-title">${escapeHtml(tier.name)}</h3>
          <p class="${p}pricing-audience">${escapeHtml(tier.audience)}</p>
        </div>
        <div class="${p}pricing-price-row">
          <span class="${p}pricing-amount">${escapeHtml(tier.price)}</span>
          <span class="${p}pricing-cadence">${escapeHtml(tier.cadence)}</span>
        </div>
        <p class="${p}card-body">${escapeHtml(tier.description)}</p>
        <div class="${p}pricing-divider"></div>
        <ul class="${p}pricing-list">
${featuresHtml}
        </ul>
        <a href="#contact" class="${p}btn ${
              tier.highlighted ? `${p}btn-primary` : `${p}btn-secondary`
            } ${p}btn-full">${escapeHtml(tier.ctaLabel)}</a>
      </div>`;
          })
          .join('\n');
        const gridCls = pricingLayout === 'compact' ? `${p}grid-2` : `${p}pricing-grid`;
        bodyHtml = `      <div class="${gridCls}">\n${tiersHtml}\n      </div>`;
      }
      return `  <section id="pricing" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
${bodyHtml}
    </div>
  </section>`;
    }

    case 'testimonial': {
      const tLayout = block.props.layout || 'editorial';
      const layoutCls =
        tLayout === 'centered'
          ? `${p}quote-centered`
          : tLayout === 'card'
            ? `${p}quote-card`
            : '';
      return `  <section class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}quote-wrap ${layoutCls} ${p}reveal">
      <div class="${p}quote-mark" aria-hidden="true">“</div>
      <blockquote class="${p}quote-text">${escapeHtml(block.props.quote)}</blockquote>
      <div class="${p}quote-footer">
        <div class="${p}quote-meta">
          <strong>${escapeHtml(block.props.authorName)}</strong>
          <span>${escapeHtml(block.props.authorRole)} · ${escapeHtml(block.props.company)}</span>
        </div>
        ${
          block.props.outcome
            ? `<p class="${p}quote-outcome">${escapeHtml(block.props.outcome)}</p>`
            : ''
        }
      </div>
    </div>
  </section>`;
    }

    case 'faq': {
      const faqLayout = block.props.layout || 'single';
      if (faqLayout === 'split') {
        const faqHtml = block.props.items
          .map(
            (item) => `      <details class="${p}faq-item ${p}reveal">
        <summary class="${p}faq-question"><span>${escapeHtml(item.question)}</span></summary>
        <p class="${p}faq-answer">${escapeHtml(item.answer)}</p>
      </details>`
          )
          .join('\n');
        return `  <section id="faq" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}faq-split">
      <div class="${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
      </div>
      <div class="${p}faq-list">
${faqHtml}
      </div>
    </div>
  </section>`;
      }
      if (faqLayout === 'grid-2') {
        const faqCardsHtml = block.props.items
          .map(
            (item) => `      <article class="${p}card ${p}reveal">
        <h3 class="${p}card-title">${escapeHtml(item.question)}</h3>
        <p class="${p}card-body">${escapeHtml(item.answer)}</p>
      </article>`
          )
          .join('\n');
        return `  <section id="faq" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
      </div>
      <div class="${p}grid-2">
${faqCardsHtml}
      </div>
    </div>
  </section>`;
      }
      const faqHtml = block.props.items
        .map(
          (item) => `      <details class="${p}faq-item ${p}reveal">
        <summary class="${p}faq-question"><span>${escapeHtml(item.question)}</span></summary>
        <p class="${p}faq-answer">${escapeHtml(item.answer)}</p>
      </details>`
        )
        .join('\n');
      return `  <section id="faq" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}narrow">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
      </div>
      <div class="${p}faq-list">
${faqHtml}
      </div>
    </div>
  </section>`;
    }

    case 'cta': {
      const ctaLayout = block.props.layout || 'panel';
      const panelCls =
        ctaLayout === 'centered'
          ? `${p}cta-panel ${p}cta-centered`
          : ctaLayout === 'minimal'
            ? `${p}cta-panel ${p}cta-minimal`
            : `${p}cta-panel`;
      return `  <section class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${panelCls} ${p}reveal">
        <div class="${p}cta-copy">
          <h2 class="${p}section-title">${escapeHtml(block.props.headline)}</h2>
          <p class="${p}section-intro">${escapeHtml(block.props.description)}</p>
        </div>
        <div class="${p}btn-group">
          <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
        block.props.primaryCtaLabel
      )}</a>
          ${
            block.props.secondaryCtaLabel
              ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary">${escapeHtml(
                  block.props.secondaryCtaLabel
                )}</a>`
              : ''
          }
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'contact': {
      const contactLayout = block.props.layout || 'split';
      const formMode = block.props.formMode || 'standard';
      const fields = getEffectiveContactFields(block.props);
      const bookingSlots = getEffectiveBookingSlots(block.props);
      const durationLabel = block.props.booking?.durationLabel || '30 min';
      const timezoneLabel = block.props.booking?.timezone || 'EST (UTC-5)';
      const bookingHeading =
        block.props.booking?.stepHeading || 'Select a Consultation Date & Time';
      const extUrl = block.props.booking?.externalBookingUrl?.trim() || '';
      const extLabel =
        block.props.booking?.externalBookingLabel?.trim() || 'Prefer Cal.com? Open live calendar';
      const successMsg =
        block.props.successMessage?.trim() ||
        (formMode === 'booking'
          ? 'Thank you — your consultation slot and inquiry are confirmed.'
          : 'Thank you — your inquiry was received.');
      const redirectUrl = block.props.redirectUrl?.trim() || '';

      const renderFieldHtml = (f: ContactFormField): string => {
        const reqAttr = f.required ? ' required' : '';
        const starHtml = f.required ? ' <span aria-hidden="true">*</span>' : '';
        const safeName = escapeHtml(f.name);
        const safeLabel = escapeHtml(f.label);
        const placeholderAttr = escapeHtml(
          f.placeholder ||
            (f.type === 'email'
              ? 'alex@company.com'
              : f.type === 'tel'
                ? '+1 (555) 234-5678'
                : f.type === 'textarea'
                  ? 'Share scope, timeline, and goals...'
                  : '')
        );

        if (f.type === 'checkbox') {
          return `        <label class="${p}checkbox-field">
          <input type="checkbox" name="${safeName}" data-af-field-label="${safeLabel}"${reqAttr} />
          <span>${safeLabel}${starHtml}</span>
        </label>`;
        }
        if (f.type === 'textarea') {
          return `        <label class="${p}field">
          <span>${safeLabel}${starHtml}</span>
          <textarea name="${safeName}" data-af-field-label="${safeLabel}" rows="4" placeholder="${placeholderAttr}"${reqAttr}></textarea>
        </label>`;
        }
        if (f.type === 'select') {
          const optsHtml = (f.options && f.options.length > 0 ? f.options : ['Option A', 'Option B'])
            .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
            .join('');
          return `        <label class="${p}field">
          <span>${safeLabel}${starHtml}</span>
          <select name="${safeName}" data-af-field-label="${safeLabel}"${reqAttr}>
            <option value="">Select an option...</option>
            ${optsHtml}
          </select>
        </label>`;
        }
        const inputType = f.type === 'email' || f.type === 'tel' ? f.type : 'text';
        return `        <label class="${p}field">
          <span>${safeLabel}${starHtml}</span>
          <input type="${inputType}" name="${safeName}" data-af-field-label="${safeLabel}" placeholder="${placeholderAttr}"${reqAttr} />
        </label>`;
      };

      const step1Fields = fields.filter((f) => (f.step || 1) === 1);
      const step2Fields = fields.filter((f) => f.step === 2);
      const effectiveStep1 = step1Fields.length > 0 ? step1Fields : fields;
      const effectiveStep2 = step2Fields.length > 0 ? step2Fields : [];

      const bookingHtml =
        formMode === 'booking'
          ? `      <div class="${p}booking-panel" data-af-booking-picker data-af-duration="${escapeHtml(durationLabel)}" data-af-timezone="${escapeHtml(timezoneLabel)}">
        <div class="${p}booking-head">
          <span class="${p}booking-title">${escapeHtml(bookingHeading)}</span>
          <span class="${p}booking-meta">${escapeHtml(durationLabel)} · ${escapeHtml(timezoneLabel)}</span>
        </div>
        <div class="${p}booking-dates" data-af-booking-dates role="group" aria-label="Available dates"></div>
        <div class="${p}booking-slots" role="group" aria-label="Available times">
          ${bookingSlots
            .map(
              (slot, sIdx) =>
                `<button type="button" class="${p}booking-slot-btn${sIdx === 0 ? ` ${p}booking-active` : ''}" data-af-booking-slot="${escapeHtml(slot)}" aria-pressed="${sIdx === 0 ? 'true' : 'false'}">${escapeHtml(slot)}</button>`
            )
            .join('\n          ')}
        </div>
        <input type="hidden" name="bookingDate" value="" data-af-booking-date-input />
        <input type="hidden" name="bookingTime" value="${escapeHtml(bookingSlots[0] || '10:30 AM')}" data-af-booking-time-input />
        <div class="${p}booking-foot">
          <span class="${p}booking-summary" data-af-booking-summary>Select a date and time above</span>
          ${
            extUrl
              ? `<a href="${escapeHtml(extUrl)}" target="_blank" rel="noopener noreferrer" class="${p}booking-ext-link">${escapeHtml(extLabel)}</a>`
              : ''
          }
        </div>
      </div>\n`
          : '';

      const formFieldsHtml =
        formMode === 'multistep' && effectiveStep2.length > 0
          ? `      <div class="${p}form-steps" data-af-step-header>
        <span class="${p}form-step-label" data-af-step-text>Step 1 of 2 · Your Details</span>
        <div class="${p}form-step-dots">
          <span class="${p}step-dot ${p}step-dot-active" data-af-dot="1"></span>
          <span class="${p}step-dot" data-af-dot="2"></span>
        </div>
      </div>
      <div class="${p}form-step-group" data-af-step="1">
${effectiveStep1.map(renderFieldHtml).join('\n')}
        <button type="button" class="${p}btn ${p}btn-primary ${p}btn-full" data-af-step-next>Continue to Step 2</button>
      </div>
      <div class="${p}form-step-group" data-af-step="2" hidden>
${effectiveStep2.map(renderFieldHtml).join('\n')}
        <div class="${p}step-actions">
          <button type="button" class="${p}btn ${p}btn-secondary" data-af-step-prev>Back</button>
          <button type="submit" class="${p}btn ${p}btn-primary" style="flex:1">${escapeHtml(block.props.submitLabel)}</button>
        </div>
      </div>`
          : `${bookingHtml}${fields.map(renderFieldHtml).join('\n')}
        <button type="submit" class="${p}btn ${p}btn-primary ${p}btn-full">${escapeHtml(block.props.submitLabel)}</button>`;

      const wrapCls =
        contactLayout === 'centered'
          ? `${p}contact-centered`
          : contactLayout === 'split-reverse'
            ? `${p}split ${p}contact-split ${p}contact-reverse`
            : `${p}split ${p}contact-split`;
      return `  <section id="contact" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${wrapCls}">
      <div class="${p}split-copy ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        <p class="${p}section-intro">${escapeHtml(block.props.description)}</p>
        <dl class="${p}contact-details">
          <div>
            <dt>Email</dt>
            <dd><a href="mailto:${escapeHtml(block.props.email)}">${escapeHtml(block.props.email)}</a></dd>
          </div>
          <div>
            <dt>Studio</dt>
            <dd>${escapeHtml(block.props.location)}</dd>
          </div>
        </dl>
      </div>
      <form class="${p}contact-form ${p}reveal" data-af-contact-form data-af-form-mode="${escapeHtml(formMode)}" data-af-success-msg="${escapeHtml(successMsg)}" data-af-redirect-url="${escapeHtml(redirectUrl)}">
${formFieldsHtml}
        <p class="${p}form-status" aria-live="polite"></p>
      </form>
    </div>
  </section>`;
    }

    case 'footer': {
      const footerLayout = block.props.layout || 'columns';
      if (footerLayout === 'centered') {
        const flatLinks = block.props.columns
          .flatMap((c) => c.links)
          .map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`)
          .join('\n        ');
        return `  <footer class="${p}footer ${bgCls} ${padCls}">
    <div class="${p}container ${p}footer-centered ${p}reveal">
      <div class="${p}brand">${escapeHtml(block.props.brandName)}</div>
      <p class="${p}footer-summary">${escapeHtml(block.props.summary)}</p>
      <nav class="${p}footer-inline-links" aria-label="Footer navigation">
        ${flatLinks}
      </nav>
    </div>
    <div class="${p}container ${p}footer-bottom ${p}footer-bottom-centered">
      <p>${escapeHtml(block.props.copyright)}</p>
    </div>
  </footer>`;
      }
      const colsHtml = block.props.columns
        .map(
          (col) => `      <div class="${p}footer-col ${p}reveal">
        <h3 class="${p}footer-heading">${escapeHtml(col.heading)}</h3>
        <ul>
          ${col.links
            .map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`)
            .join('\n          ')}
        </ul>
      </div>`
        )
        .join('\n');
      return `  <footer class="${p}footer ${bgCls} ${padCls}">
    <div class="${p}container ${p}footer-grid">
      <div class="${p}footer-brand ${p}reveal">
        <div class="${p}brand">${escapeHtml(block.props.brandName)}</div>
        <p class="${p}footer-summary">${escapeHtml(block.props.summary)}</p>
      </div>
${colsHtml}
    </div>
    <div class="${p}container ${p}footer-bottom">
      <p>${escapeHtml(block.props.copyright)}</p>
    </div>
  </footer>`;
    }

    case 'logocloud': {
      const logoLayout = block.props.layout || 'row';
      const itemsHtml = block.props.items
        .map((partner, idx) => {
          const svg =
            idx % 3 === 0
              ? `<rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.8" />`
              : idx % 3 === 1
                ? `<circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.8" />`
                : `<polygon points="9,2 16,15 2,15" stroke="currentColor" stroke-width="1.8" fill="none" />`;
          return `      <div class="${p}logo-item ${p}reveal">
        <div class="${p}logo-mark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">${svg}</svg>
          <span>${escapeHtml(partner.name)}</span>
        </div>
        ${partner.sector ? `<span class="${p}logo-sector">${escapeHtml(partner.sector)}</span>` : ''}
      </div>`;
        })
        .join('\n');

      const layoutCls =
        logoLayout === 'grid'
          ? `${p}logo-grid`
          : logoLayout === 'cards'
            ? `${p}logo-cards`
            : logoLayout === 'compact'
              ? `${p}logo-compact-grid`
              : `${p}logo-row`;
      return `  <section class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${logoLayout === 'compact' ? `${p}logo-compact-wrap` : ''}">
      <div class="${p}logo-head ${p}reveal">
        <h2 class="${p}eyebrow">${escapeHtml(block.props.heading)}</h2>
        ${block.props.caption ? `<p class="${p}logo-caption">${escapeHtml(block.props.caption)}</p>` : ''}
      </div>
      <div class="${layoutCls}">
${itemsHtml}
      </div>
    </div>
  </section>`;
    }

    case 'portfolio': {
      const pLayout = block.props.layout || 'grid';
      const colsCls =
        pLayout === 'rows'
          ? `${p}case-rows`
          : pLayout === 'bento'
            ? `${p}grid-3`
            : block.props.columns === 2
              ? `${p}grid-2`
              : `${p}grid-3`;
      const cats = Array.from(
        new Set(block.props.items.map((it) => it.category.trim()).filter(Boolean))
      );
      const filterBar =
        cats.length > 1
          ? `<div class="${p}filter-bar" role="tablist" aria-label="Filter case studies">
        <button type="button" class="${p}filter-btn ${p}filter-active" data-af-filter="All">All</button>
        ${cats
          .map(
            (c) =>
              `<button type="button" class="${p}filter-btn" data-af-filter="${escapeHtml(c)}">${escapeHtml(c)}</button>`
          )
          .join('\n        ')}
      </div>`
          : '';

      const cardsHtml = block.props.items
        .map(
          (item, idx) => `      <article class="${p}case-card ${
            pLayout === 'rows' ? `${p}case-card-row` : pLayout === 'bento' && idx === 0 ? `${p}bento-wide` : ''
          } ${p}reveal" data-af-category="${escapeHtml(
            item.category.trim()
          )}" data-af-case-title="${escapeHtml(item.title)}" data-af-case-category="${escapeHtml(
            item.category
          )}" data-af-case-client="${escapeHtml(item.client)}" data-af-case-metric="${escapeHtml(
            item.metric
          )}" data-af-case-summary="${escapeHtml(item.summary)}" data-af-case-challenge="${escapeHtml(
            item.challenge || ''
          )}" data-af-case-outcome="${escapeHtml(item.outcome || '')}" data-af-case-img="${escapeHtml(
            item.imageUrl
          )}" data-af-case-alt="${escapeHtml(item.imageAlt || item.title)}" data-af-case-cta="${escapeHtml(
            item.linkLabel || ''
          )}" data-af-case-href="${escapeHtml(item.linkHref || '#contact')}">
        <div class="${p}case-media">
          <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(
            item.imageAlt || item.title
          )}" loading="lazy" />
        </div>
        <div class="${p}case-body">
          <div class="${p}case-meta">
            <span>${escapeHtml(item.category)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(item.client)}</span>
          </div>
          <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
          <p class="${p}case-metric">${escapeHtml(item.metric)}</p>
          <p class="${p}card-body">${escapeHtml(item.summary)}</p>
          <button type="button" class="${p}case-link" data-af-open-case>
            <span>Inspect Case Study</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </article>`
        )
        .join('\n');

      return `  <section id="portfolio" class="${p}section ${bgCls} ${padCls}" data-af-portfolio>
    <div class="${p}container">
      <div class="${p}portfolio-head ${p}reveal">
        <div class="${p}section-head">
          ${
            block.props.eyebrow
              ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
              : ''
          }
          <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
          ${
            block.props.intro
              ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
              : ''
          }
        </div>
        ${filterBar}
      </div>
      <div class="${colsCls}">
${cardsHtml}
      </div>
    </div>
    <div class="${p}case-modal" data-af-case-modal hidden role="dialog" aria-modal="true" aria-label="Case study details">
      <div class="${p}case-modal-card">
        <div class="${p}case-modal-top">
          <span class="${p}case-modal-kicker" data-af-modal-meta></span>
          <button type="button" class="${p}case-modal-close" data-af-modal-close aria-label="Close case study">×</button>
        </div>
        <div class="${p}case-modal-scroll">
          <img src="" alt="" class="${p}case-modal-img" data-af-modal-img />
          <p class="${p}case-metric" data-af-modal-metric></p>
          <h3 class="${p}case-modal-title" data-af-modal-title></h3>
          <p class="${p}case-modal-summary" data-af-modal-summary></p>
          <div class="${p}case-modal-grid" data-af-modal-details>
            <div>
              <div class="${p}case-modal-subhead">Challenge</div>
              <p data-af-modal-challenge></p>
            </div>
            <div>
              <div class="${p}case-modal-subhead">Outcome</div>
              <p data-af-modal-outcome></p>
            </div>
          </div>
        </div>
        <div class="${p}case-modal-foot">
          <button type="button" class="${p}btn ${p}btn-secondary ${p}btn-sm" data-af-modal-close>Close</button>
          <a href="#contact" class="${p}btn ${p}btn-primary ${p}btn-sm" data-af-modal-cta></a>
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'video': {
      const videoSource = resolveVideoSource(block.props.videoUrl);
      const vLayout = block.props.layout || 'split-right';
      const splitCls =
        vLayout === 'centered'
          ? `${p}video-centered`
          : vLayout === 'split-left'
            ? `${p}video-split ${p}video-split-left`
            : `${p}video-split`;
      const highlightsHtml = block.props.highlights
        .map((h) => `          <li>${escapeHtml(h)}</li>`)
        .join('\n');
      return `  <section id="demo" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${splitCls}">
      <div class="${p}video-copy ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        <p class="${p}section-intro">${escapeHtml(block.props.description)}</p>
        ${highlightsHtml ? `<ul class="${p}check-list">\n${highlightsHtml}\n        </ul>` : ''}
        ${
          block.props.ctaLabel
            ? `<div class="${p}mt-md"><a href="${escapeHtml(
                block.props.ctaHref
              )}" class="${p}btn ${p}btn-primary">${escapeHtml(block.props.ctaLabel)}</a></div>`
            : ''
        }
      </div>
      <div class="${p}video-stage-wrap ${p}reveal">
        <div class="${p}video-stage" data-af-video-stage data-video-kind="${escapeHtml(
          videoSource.kind
        )}" data-video-src="${escapeHtml(videoSource.src)}" data-video-title="${escapeHtml(
        block.props.heading
      )}" data-poster-url="${escapeHtml(block.props.posterUrl)}">
          <button type="button" class="${p}video-poster-btn" data-af-video-play aria-label="Play video walkthrough">
            ${
              block.props.posterUrl
                ? `<img src="${escapeHtml(block.props.posterUrl)}" alt="${escapeHtml(
                    block.props.posterAlt || block.props.heading
                  )}" class="${p}video-poster-img" loading="lazy" />`
                : ''
            }
            <span class="${p}video-scrim" aria-hidden="true"></span>
            <span class="${p}video-play-center">
              <span class="${p}video-play-circle" aria-hidden="true">▶</span>
              <span class="${p}video-duration">${escapeHtml(
        block.props.durationLabel || 'Watch Interactive Walkthrough'
      )} · ${escapeHtml(videoSource.provider)}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'team': {
      const tLayout = block.props.layout || 'cards';
      const colsCls =
        tLayout === 'horizontal'
          ? `${p}grid-2`
          : block.props.columns === 4
            ? `${p}grid-4`
            : block.props.columns === 2
              ? `${p}grid-2`
              : `${p}grid-3`;
      const cardCls =
        tLayout === 'horizontal'
          ? `${p}team-card ${p}team-card-row`
          : tLayout === 'minimal'
            ? `${p}team-card ${p}team-card-minimal`
            : `${p}team-card`;
      const membersHtml = block.props.members
        .map((m) => {
          const socials: string[] = [];
          if (m.linkedinUrl) {
            socials.push(
              `<a href="${escapeHtml(m.linkedinUrl)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`
            );
          }
          if (m.xUrl) {
            socials.push(
              `<a href="${escapeHtml(m.xUrl)}" target="_blank" rel="noopener noreferrer">X ↗</a>`
            );
          }
          if (m.websiteUrl) {
            socials.push(
              `<a href="${escapeHtml(m.websiteUrl)}" target="_blank" rel="noopener noreferrer">Portfolio ↗</a>`
            );
          }
          return `      <article class="${cardCls} ${p}reveal">
        <div class="${p}team-media">
          <img src="${escapeHtml(m.imageUrl)}" alt="${escapeHtml(
            m.imageAlt || m.name
          )}" loading="lazy" />
        </div>
        <div class="${p}team-body">
          <h3 class="${p}card-title">${escapeHtml(m.name)}</h3>
          <p class="${p}team-role">${escapeHtml(m.role)}</p>
          <p class="${p}card-body">${escapeHtml(m.bio)}</p>
          ${socials.length > 0 ? `<div class="${p}team-socials">${socials.join('\n          ')}</div>` : ''}
        </div>
      </article>`;
        })
        .join('\n');

      return `  <section id="team" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
      <div class="${colsCls}">
${membersHtml}
      </div>
    </div>
  </section>`;
    }

    case 'calculator': {
      const calcLayout = block.props.layout || 'split';
      const calcWrapCls =
        calcLayout === 'stacked'
          ? `${p}calc-grid ${p}calc-stacked`
          : calcLayout === 'split-reverse'
            ? `${p}calc-grid ${p}calc-reverse`
            : `${p}calc-grid`;
      const cur = block.props.currencySymbol || '$';
      const grossValue =
        block.props.primaryDefault * block.props.secondaryDefault * block.props.hourlyRate;
      const monthlyCost =
        block.props.baseMonthlyFee +
        block.props.primaryDefault * block.props.monthlyPlatformCostPerPrimary;
      const netMonthly = Math.max(0, grossValue - monthlyCost);
      const annualNet = netMonthly * 12;
      const roiMult =
        monthlyCost > 0 ? Math.max(1, grossValue / monthlyCost) : 1;
      const annualHours =
        block.props.primaryDefault * block.props.secondaryDefault * 12;

      return `  <section id="calculator" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
      <div class="${calcWrapCls} ${p}reveal" data-af-calc data-cur="${escapeHtml(
        cur
      )}" data-rate="${block.props.hourlyRate}" data-base="${
        block.props.baseMonthlyFee
      }" data-unit-cost="${block.props.monthlyPlatformCostPerPrimary}" data-u1="${escapeHtml(
        block.props.primaryUnitLabel
      )}" data-u2="${escapeHtml(block.props.secondaryUnitLabel)}">
        <div class="${p}calc-controls">
          <div class="${p}calc-slider-group">
            <div class="${p}calc-slider-top">
              <label for="af-calc-p-${block.id}">${escapeHtml(block.props.primaryInputLabel)}</label>
              <span class="${p}calc-slider-val" data-af-out-primary>${block.props.primaryDefault.toLocaleString()} ${escapeHtml(
        block.props.primaryUnitLabel
      )}</span>
            </div>
            <input id="af-calc-p-${block.id}" type="range" min="${block.props.primaryMin}" max="${
        block.props.primaryMax
      }" step="${block.props.primaryStep}" value="${
        block.props.primaryDefault
      }" data-af-calc-primary />
            <div class="${p}calc-range-limits"><span>${block.props.primaryMin}</span><span>${
        block.props.primaryMax
      }</span></div>
          </div>
          <div class="${p}calc-slider-group">
            <div class="${p}calc-slider-top">
              <label for="af-calc-s-${block.id}">${escapeHtml(block.props.secondaryInputLabel)}</label>
              <span class="${p}calc-slider-val" data-af-out-secondary>${block.props.secondaryDefault.toLocaleString()} ${escapeHtml(
        block.props.secondaryUnitLabel
      )}</span>
            </div>
            <input id="af-calc-s-${block.id}" type="range" min="${
        block.props.secondaryMin
      }" max="${block.props.secondaryMax}" step="${block.props.secondaryStep}" value="${
        block.props.secondaryDefault
      }" data-af-calc-secondary />
            <div class="${p}calc-range-limits"><span>${block.props.secondaryMin}</span><span>${
        block.props.secondaryMax
      }</span></div>
          </div>
          <div class="${p}calc-assumptions">
            <div><span>Assumed Hourly Rate</span><strong>${escapeHtml(cur)}${
        block.props.hourlyRate
      }/hr</strong></div>
            <div><span>Estimated Plan Cost</span><strong data-af-out-cost>${escapeHtml(
              cur
            )}${monthlyCost.toLocaleString()}/mo</strong></div>
            <div><span>Hours Reclaimed / Yr</span><strong data-af-out-hours>${annualHours.toLocaleString()} hrs</strong></div>
          </div>
        </div>
        <div class="${p}calc-output">
          <div>
            <p class="${p}calc-kicker">${escapeHtml(block.props.roiHeadlineLabel)}</p>
            <div class="${p}calc-big-val"><span data-af-out-net>${escapeHtml(
              cur
            )}${netMonthly.toLocaleString()}</span><span class="${p}calc-per"> / mo</span></div>
          </div>
          <div class="${p}calc-metrics">
            <div><span>Annualized Net Impact</span><strong data-af-out-annual>${escapeHtml(
              cur
            )}${annualNet.toLocaleString()} / yr</strong></div>
            <div><span>Gross Output Value</span><strong data-af-out-gross>${escapeHtml(
              cur
            )}${grossValue.toLocaleString()} / mo</strong></div>
            <div><span>Projected Return Multiple</span><strong data-af-out-roi>${roiMult.toFixed(
              1
            )}x ROI</strong></div>
          </div>
          ${
            block.props.ctaLabel
              ? `<a href="${escapeHtml(block.props.ctaHref)}" class="${p}btn ${p}btn-primary ${p}btn-full">${escapeHtml(
                  block.props.ctaLabel
                )}</a>`
              : ''
          }
        </div>
      </div>
    </div>
  </section>`;
    }
  }
}

export function generateCleanCss(theme: SiteTheme, options: ExportOptions): string {
  const p = (options.prefix || 'af-').replace(/[^a-zA-Z0-9_-]/g, '');
  const primary = safeCssColor(theme.primaryColor, '#1D4ED8');
  const accentText = safeCssColor(theme.accentTextColor, '#FFFFFF');
  const bg = safeCssColor(theme.backgroundColor, '#FFFFFF');
  const surface = safeCssColor(theme.surfaceColor, '#F4F6F8');
  const contrastBg = safeCssColor(theme.contrastBgColor, '#0F172A');
  const ink = safeCssColor(theme.textColor, '#000000');
  const muted = safeCssColor(theme.mutedTextColor, '#000000');
  const border = safeCssColor(theme.borderColor, '#E2E8F0');
  const displayFont = `"${safeFontName(theme.displayFont, 'Plus Jakarta Sans')}", system-ui, sans-serif`;
  const bodyFont = `"${safeFontName(theme.bodyFont, 'DM Sans')}", system-ui, sans-serif`;
  const radius = theme.radius;
  const rhythmMult = theme.spacing === 'compact' ? 0.78 : theme.spacing === 'airy' ? 1.25 : 1;
  const motionMode = theme.motion || 'editorial';

  const v = (varName: string, fallback: string) =>
    options.useCssVariables ? `var(${varName})` : fallback;

  const rawCss = `
${
  options.useCssVariables
    ? `:root {
  --${p}primary: ${primary};
  --${p}primary-ink: ${accentText};
  --${p}bg: ${bg};
  --${p}surface: ${surface};
  --${p}contrast: ${contrastBg};
  --${p}ink: ${ink};
  --${p}muted: ${muted};
  --${p}border: ${border};
  --${p}radius: ${radius};
  --${p}font-display: ${displayFont};
  --${p}font-body: ${bodyFont};
  --${p}container: 1200px;
}
`
    : ''
}
${
  options.includeReset
    ? `*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  font-family: ${v(`--${p}font-body`, bodyFont)};
  color: ${v(`--${p}ink`, ink)};
  background-color: ${v(`--${p}bg`, bg)};
  line-height: 1.65;
  font-size: 17px;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}
`
    : ''
}
.${p}container {
  width: 100%;
  max-width: ${options.useCssVariables ? `var(--${p}container)` : '1200px'};
  margin-inline: auto;
  padding-inline: 28px;
}

.${p}narrow {
  max-width: 820px;
}

.${p}bg-canvas {
  background-color: ${v(`--${p}bg`, bg)};
  color: ${v(`--${p}ink`, ink)};
}

.${p}bg-surface {
  background-color: ${v(`--${p}surface`, surface)};
  color: ${v(`--${p}ink`, ink)};
}

.${p}bg-contrast {
  background-color: ${v(`--${p}contrast`, contrastBg)};
  color: #FFFFFF;
}

.${p}bg-contrast .${p}section-intro,
.${p}bg-contrast .${p}hero-subtitle,
.${p}bg-contrast .${p}card-body,
.${p}bg-contrast .${p}eyebrow,
.${p}bg-contrast .${p}kicker,
.${p}bg-contrast .${p}stat-context,
.${p}bg-contrast .${p}pricing-audience,
.${p}bg-contrast .${p}pricing-cadence,
.${p}bg-contrast .${p}faq-answer,
.${p}bg-contrast .${p}footer-summary,
.${p}bg-contrast .${p}footer-bottom,
.${p}bg-contrast .${p}footer-col a {
  color: rgba(255, 255, 255, 0.88);
}

.${p}py-compact { padding-block: ${Math.round(38 * rhythmMult)}px; }
.${p}py-normal { padding-block: ${Math.round(80 * rhythmMult)}px; }
.${p}py-spacious { padding-block: ${Math.round(108 * rhythmMult)}px; }
.${p}mb-sm { margin-bottom: 16px; }
.${p}mt-md { margin-top: 28px; }

/* Navigation */
.${p}navbar {
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(12px);
}

.${p}bg-contrast.${p}navbar {
  border-bottom-color: rgba(255, 255, 255, 0.14);
}

.${p}navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  min-height: 74px;
}

.${p}brand {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  white-space: nowrap;
}

.${p}nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.${p}nav-link {
  position: relative;
  font-size: 0.96875rem;
  font-weight: 500;
  white-space: nowrap;
  padding-block: 4px;
  transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}nav-link:hover::after {
  transform: scaleX(1);
}

.${p}nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.${p}menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid ${v(`--${p}border`, border)};
  color: inherit;
  border-radius: ${v(`--${p}radius`, radius)};
  padding: 8px 14px;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
}

/* Typography & Buttons */
.${p}kicker,
.${p}eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: ${v(`--${p}muted`, muted)};
}

.${p}kicker::before,
.${p}eyebrow::before {
  content: "";
  width: 22px;
  height: 1.5px;
  background-color: ${v(`--${p}primary`, primary)};
  flex-shrink: 0;
}

.${p}kicker-on-dark {
  color: rgba(255, 255, 255, 0.92);
}

.${p}hero-title {
  margin: 0 0 20px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(2.4rem, 4.3vw, 3.85rem);
  line-height: 1.06;
  letter-spacing: -0.03em;
  font-weight: 700;
  text-wrap: balance;
}

.${p}hero-subtitle {
  margin: 0 0 30px;
  font-size: 1.1875rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
  max-width: 56ch;
}

.${p}section-head {
  max-width: 68ch;
  margin-bottom: 48px;
}

.${p}section-title {
  margin: 0 0 14px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(1.95rem, 3.1vw, 2.75rem);
  line-height: 1.13;
  letter-spacing: -0.025em;
  font-weight: 700;
  text-wrap: balance;
}

.${p}section-intro {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
}

.${p}btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.${p}btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
  border-radius: ${v(`--${p}radius`, radius)};
  font-family: ${v(`--${p}font-body`, bodyFont)};
  font-size: 0.96875rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.${p}btn-sm {
  padding: 10px 20px;
  font-size: 0.9375rem;
}

.${p}btn:hover {
  transform: translateY(-1px);
}

.${p}btn:focus-visible {
  outline: 2px solid ${v(`--${p}primary`, primary)};
  outline-offset: 2px;
}

.${p}btn-primary {
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
  box-shadow: 0 10px 24px -10px color-mix(in srgb, ${v(`--${p}primary`, primary)} 65%, transparent);
}

.${p}btn-primary:hover {
  opacity: 0.94;
}

.${p}btn-secondary {
  background-color: transparent;
  color: inherit;
  border-color: ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}btn-secondary,
.${p}btn-secondary-on-dark {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.36);
  backdrop-filter: blur(8px);
}

.${p}btn-secondary:hover,
.${p}btn-secondary-on-dark:hover {
  opacity: 0.88;
}

.${p}btn-full {
  width: 100%;
}

/* Hero Layouts */
.${p}hero:not(.${p}hero-banner-wrap) {
  background-image:
    radial-gradient(circle at 86% 14%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 11%, transparent) 0%, transparent 48%),
    radial-gradient(circle at 12% 92%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 6%, transparent) 0%, transparent 45%);
}

.${p}hero-split {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 52px;
  align-items: center;
}

.${p}hero-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.${p}hero-centered .${p}kicker {
  justify-content: center;
}

.${p}hero-centered .${p}hero-subtitle,
.${p}hero-centered .${p}btn-group {
  margin-inline: auto;
  justify-content: center;
}

.${p}hero-centered .${p}hero-media {
  margin-top: 48px;
  width: 100%;
  max-width: 1040px;
}

.${p}hero-banner {
  position: relative;
  border-radius: ${v(`--${p}radius`, radius)};
  overflow: hidden;
  min-height: 540px;
  display: flex;
  align-items: flex-end;
  padding: 56px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 28px 60px -28px rgba(15, 23, 42, 0.45);
}

.${p}hero-banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.${p}hero-banner-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(104deg, rgba(13, 15, 20, 0.94) 0%, rgba(13, 15, 20, 0.72) 52%, rgba(13, 15, 20, 0.24) 100%);
}

.${p}hero-banner-content {
  position: relative;
  z-index: 2;
  max-width: 680px;
  color: #FFFFFF;
}

.${p}hero-banner-content .${p}hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
}

.${p}media-frame {
  border-radius: ${v(`--${p}radius`, radius)};
  overflow: hidden;
  border: 1px solid ${v(`--${p}border`, border)};
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05), 0 28px 56px -24px rgba(15, 23, 42, 0.25);
}

.${p}bg-contrast .${p}media-frame {
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 32px 64px -24px rgba(0, 0, 0, 0.6);
}

.${p}media-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

/* Stats */
.${p}stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid ${v(`--${p}border`, border)};
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}stats-grid {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}stat-item {
  padding: 28px 24px;
}

.${p}stat-item + .${p}stat-item {
  border-left: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}stat-item + .${p}stat-item {
  border-left-color: rgba(255, 255, 255, 0.16);
}

.${p}stat-item:first-child {
  padding-left: 0;
}

.${p}stat-value {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(2rem, 2.9vw, 2.65rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.${p}stat-label {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.${p}stat-context {
  margin-top: 4px;
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

/* Feature Grids */
.${p}grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.${p}grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

.${p}card {
  padding: 32px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 30px -18px rgba(15, 23, 42, 0.11);
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease, box-shadow 180ms ease;
}

.${p}card:hover {
  transform: translateY(-2px);
}

.${p}bg-contrast .${p}card {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}

.${p}card-meta {
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}card-meta {
  border-bottom-color: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
}

.${p}card-title {
  margin: 0 0 10px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.3125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.${p}card-body {
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
}

/* Split Showcase */
.${p}split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 52px;
  align-items: center;
}

.${p}split-reverse .${p}split-media {
  order: -1;
}

.${p}check-list {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
  color: ${v(`--${p}muted`, muted)};
}

.${p}check-list li {
  position: relative;
  padding-left: 32px;
  line-height: 1.55;
}

.${p}check-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  background-color: color-mix(in srgb, ${v(`--${p}primary`, primary)} 13%, transparent);
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}check-list li::before {
  background-color: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
}

/* Pricing */
.${p}pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: stretch;
}

.${p}pricing-card {
  display: flex;
  flex-direction: column;
  padding: 34px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -18px rgba(15, 23, 42, 0.1);
}

.${p}bg-contrast .${p}pricing-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.${p}pricing-featured {
  border-color: ${v(`--${p}primary`, primary)};
  border-top: 3px solid ${v(`--${p}primary`, primary)};
  background-image: radial-gradient(circle at 100% 0%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 10%, transparent), transparent 55%);
  box-shadow: 0 24px 48px -22px color-mix(in srgb, ${v(`--${p}primary`, primary)} 28%, rgba(15, 23, 42, 0.22));
}

.${p}pricing-kicker {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${v(`--${p}primary`, primary)};
}

.${p}pricing-audience {
  margin: 4px 0 0;
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}pricing-price-row {
  margin: 22px 0 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.${p}pricing-amount {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}

.${p}pricing-cadence {
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}pricing-divider {
  height: 1px;
  background-color: ${v(`--${p}border`, border)};
  margin: 22px 0;
}

.${p}bg-contrast .${p}pricing-divider {
  background-color: rgba(255, 255, 255, 0.15);
}

.${p}pricing-list {
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 11px;
  font-size: 0.96875rem;
  flex: 1;
}

.${p}pricing-list li {
  position: relative;
  padding-left: 28px;
}

.${p}pricing-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  background-color: color-mix(in srgb, ${v(`--${p}primary`, primary)} 13%, transparent);
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}pricing-list li::before {
  background-color: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
}

/* Testimonial */
.${p}quote-wrap {
  max-width: 900px;
}

.${p}quote-mark {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 3.5rem;
  line-height: 0.8;
  margin-bottom: 12px;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}quote-mark {
  color: rgba(255, 255, 255, 0.5);
}

.${p}quote-text {
  margin: 0 0 28px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(1.65rem, 3vw, 2.35rem);
  line-height: 1.32;
  letter-spacing: -0.02em;
  font-weight: 500;
}

.${p}quote-footer {
  padding-top: 20px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.${p}bg-contrast .${p}quote-footer {
  border-top-color: rgba(255, 255, 255, 0.18);
}

.${p}quote-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 1rem;
}

.${p}quote-outcome {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
}

/* FAQ */
.${p}faq-list {
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}faq-list,
.${p}bg-contrast .${p}faq-item {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}faq-item {
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  padding-block: 22px;
}

.${p}faq-question {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.${p}faq-question::-webkit-details-marker {
  display: none;
}

.${p}faq-question::after {
  content: "+";
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1;
  flex-shrink: 0;
}

.${p}faq-item[open] .${p}faq-question::after {
  content: "−";
}

.${p}faq-answer {
  margin: 14px 0 0;
  font-size: 1rem;
  color: ${v(`--${p}muted`, muted)};
  line-height: 1.68;
  max-width: 66ch;
}

/* CTA Panel */
.${p}cta-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 52px;
  border-radius: ${v(`--${p}radius`, radius)};
  border: 1px solid ${v(`--${p}border`, border)};
  background-image: radial-gradient(circle at 92% 18%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 12%, transparent) 0%, transparent 54%);
  box-shadow: 0 20px 48px -28px rgba(15, 23, 42, 0.14);
}

.${p}bg-contrast .${p}cta-panel {
  border-color: rgba(255, 255, 255, 0.16);
  background-color: rgba(255, 255, 255, 0.04);
  background-image: radial-gradient(circle at 92% 18%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 22%, transparent) 0%, transparent 56%);
  box-shadow: none;
}

.${p}cta-copy {
  max-width: 58ch;
}

/* Contact */
.${p}contact-split {
  align-items: start;
}

.${p}contact-details {
  margin: 30px 0 0;
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}contact-details,
.${p}bg-contrast .${p}contact-details > div {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}contact-details > div {
  padding-block: 16px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}contact-details dt {
  font-size: 0.875rem;
  font-weight: 600;
  color: ${v(`--${p}muted`, muted)};
}

.${p}contact-details dd {
  margin: 4px 0 0;
  font-size: 1.0625rem;
  font-weight: 500;
}

.${p}contact-form {
  display: grid;
  gap: 18px;
  padding: 32px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 20px 44px -26px rgba(15, 23, 42, 0.16);
}

.${p}bg-contrast .${p}contact-form {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.18);
}

.${p}field {
  display: grid;
  gap: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.${p}field input,
.${p}field select,
.${p}field textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  font: inherit;
  color: #000000;
  background: #FFFFFF;
}

.${p}field input:focus,
.${p}field select:focus,
.${p}field textarea:focus {
  outline: 2px solid ${v(`--${p}primary`, primary)};
  outline-offset: 1px;
}

.${p}checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
}

.${p}checkbox-field input[type="checkbox"] {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  accent-color: ${v(`--${p}primary`, primary)};
  cursor: pointer;
}

.${p}form-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}form-step-label {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${v(`--${p}muted`, muted)};
}

.${p}form-step-dots {
  display: flex;
  gap: 6px;
}

.${p}step-dot {
  width: 28px;
  height: 7px;
  border-radius: 999px;
  background: ${v(`--${p}border`, border)};
  transition: background-color 150ms ease;
}

.${p}step-dot-active {
  background: ${v(`--${p}primary`, primary)};
}

.${p}form-step-group {
  display: grid;
  gap: 16px;
}

.${p}form-step-group[hidden] {
  display: none !important;
}

.${p}step-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.${p}booking-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}surface`, surface)};
}

.${p}bg-contrast .${p}booking-panel {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}booking-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.${p}booking-title {
  font-size: 0.9375rem;
  font-weight: 600;
}

.${p}booking-meta {
  font-size: 0.8125rem;
  color: ${v(`--${p}muted`, muted)};
  font-variant-numeric: tabular-nums;
}

.${p}booking-dates {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}

@media (max-width: 640px) {
  .${p}booking-dates {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.${p}booking-date-btn,
.${p}booking-slot-btn {
  padding: 8px 6px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background: #FFFFFF;
  color: #000000;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

.${p}booking-date-btn {
  display: grid;
  gap: 2px;
  text-align: center;
}

.${p}booking-date-btn span {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.78;
}

.${p}booking-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.${p}booking-slot-btn {
  padding: 7px 11px;
  font-variant-numeric: tabular-nums;
}

.${p}booking-active {
  background: ${v(`--${p}primary`, primary)};
  border-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}accent-text`, accentText)};
}

.${p}booking-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.8125rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}booking-ext-link {
  text-decoration: underline;
  font-weight: 600;
}

.${p}form-status {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${v(`--${p}primary`, primary)};
}

/* Footer */
.${p}footer {
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast.${p}footer {
  border-top-color: rgba(255, 255, 255, 0.14);
}

.${p}footer-grid {
  display: grid;
  grid-template-columns: 1.6fr repeat(2, 1fr);
  gap: 44px;
}

.${p}footer-summary {
  margin: 14px 0 0;
  max-width: 36ch;
  font-size: 1rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}footer-heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.${p}footer-col ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
  font-size: 1rem;
}

.${p}footer-col a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.${p}footer-bottom {
  margin-top: 44px;
  padding-top: 24px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}bg-contrast .${p}footer-bottom {
  border-top-color: rgba(255, 255, 255, 0.14);
}

/* 4-Column Team Grid */
.${p}grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

/* Logo Cloud */
.${p}logo-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.${p}logo-caption {
  margin: 0;
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}bg-contrast .${p}logo-caption,
.${p}bg-contrast .${p}logo-sector,
.${p}bg-contrast .${p}case-meta,
.${p}bg-contrast .${p}calc-range-limits,
.${p}bg-contrast .${p}calc-assumptions span,
.${p}bg-contrast .${p}calc-metrics span {
  color: rgba(255, 255, 255, 0.86);
}

.${p}logo-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 24px;
  padding-block: 24px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}logo-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background-color: ${v(`--${p}border`, border)};
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  overflow: hidden;
}

.${p}bg-contrast .${p}logo-row {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}bg-contrast .${p}logo-grid {
  background-color: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}logo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0.78;
  transition: opacity 180ms ease;
}

.${p}logo-item:hover {
  opacity: 1;
}

.${p}logo-grid .${p}logo-item {
  padding: 24px 16px;
  background-color: ${v(`--${p}bg`, bg)};
}

.${p}bg-surface .${p}logo-grid .${p}logo-item {
  background-color: ${v(`--${p}surface`, surface)};
}

.${p}bg-contrast .${p}logo-grid .${p}logo-item {
  background-color: ${v(`--${p}contrast`, contrastBg)};
}

.${p}logo-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.${p}logo-sector {
  font-size: 0.8125rem;
  color: ${v(`--${p}muted`, muted)};
  margin-top: 4px;
}

/* Portfolio & Case Studies */
.${p}portfolio-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
}

.${p}portfolio-head .${p}section-head {
  margin-bottom: 0;
}

.${p}filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}surface`, surface)};
}

.${p}bg-contrast .${p}filter-bar {
  border-color: rgba(255, 255, 255, 0.18);
  background-color: rgba(255, 255, 255, 0.06);
}

.${p}filter-btn {
  padding: 7px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: ${v(`--${p}radius`, radius)};
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.${p}filter-btn.${p}filter-active {
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
}

.${p}case-card,
.${p}team-card {
  display: flex;
  flex-direction: column;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 30px -18px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}case-card:hover,
.${p}team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -26px rgba(15, 23, 42, 0.2);
}

.${p}bg-contrast .${p}case-card,
.${p}bg-contrast .${p}team-card {
  border-color: rgba(255, 255, 255, 0.16);
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: none;
}

.${p}case-media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}case-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}case-card:hover .${p}case-media img {
  transform: scale(1.03);
}

.${p}case-body,
.${p}team-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.${p}case-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${v(`--${p}muted`, muted)};
  margin-bottom: 8px;
}

.${p}case-metric {
  margin: 0 0 10px;
  font-size: 0.9375rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}case-metric {
  color: #FFFFFF;
}

.${p}case-link {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  background: transparent;
  border-inline: 0;
  border-bottom: 0;
  color: inherit;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  padding-inline: 0;
}

.${p}case-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.${p}case-modal[hidden] {
  display: none;
}

.${p}case-modal-card {
  width: 100%;
  max-width: 700px;
  max-height: 88vh;
  background: #FFFFFF;
  color: #000000;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.${p}case-modal-top,
.${p}case-modal-foot {
  padding: 16px 24px;
  border-bottom: 1px solid #E2E8F0;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.${p}case-modal-foot {
  border-bottom: 0;
  border-top: 1px solid #E2E8F0;
  justify-content: flex-end;
}

.${p}case-modal-kicker {
  font-size: 0.875rem;
  font-weight: 600;
}

.${p}case-modal-close {
  width: 32px;
  height: 32px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  background: #FFFFFF;
  color: #000000;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.${p}case-modal-scroll {
  padding: 24px;
  overflow-y: auto;
  display: grid;
  gap: 14px;
}

.${p}case-modal-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
}

.${p}case-modal-title {
  margin: 0;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.75rem;
  line-height: 1.15;
}

.${p}case-modal-summary {
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
}

.${p}case-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}

.${p}case-modal-subhead {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

/* Video Showcase */
.${p}video-split {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 44px;
  align-items: center;
}

.${p}video-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: ${v(`--${p}radius`, radius)};
  border: 1px solid ${v(`--${p}border`, border)};
  background: #0F172A;
  overflow: hidden;
  box-shadow: 0 28px 56px -24px rgba(0, 0, 0, 0.45);
}

.${p}video-stage iframe,
.${p}video-stage video {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.${p}video-poster-btn {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: #0F172A;
  cursor: pointer;
  display: block;
}

.${p}video-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}video-poster-btn:hover .${p}video-poster-img {
  transform: scale(1.03);
}

.${p}video-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(13, 15, 20, 0.18) 0%, rgba(13, 15, 20, 0.72) 100%);
}

.${p}video-play-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #FFFFFF;
}

.${p}video-play-circle {
  width: 66px;
  height: 66px;
  border-radius: 999px;
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  padding-left: 3px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.${p}video-duration {
  font-size: 0.9375rem;
  font-weight: 600;
}

.${p}video-reset {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

/* Team Grid */
.${p}team-media {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  background: #F1F5F9;
}

.${p}team-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}team-card:hover .${p}team-media img {
  transform: scale(1.03);
}

.${p}team-role {
  margin: 4px 0 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}team-role {
  color: rgba(255, 255, 255, 0.88);
}

.${p}team-socials {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 0.875rem;
  font-weight: 600;
}

.${p}team-socials a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* ROI & Pricing Calculator */
.${p}calc-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 32px;
  align-items: stretch;
}

.${p}calc-controls {
  padding: 32px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 14px 30px -18px rgba(15, 23, 42, 0.11);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}

.${p}bg-contrast .${p}calc-controls {
  border-color: rgba(255, 255, 255, 0.16);
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: none;
}

.${p}calc-slider-group {
  display: grid;
  gap: 10px;
}

.${p}calc-slider-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.${p}calc-slider-top label {
  font-size: 0.9375rem;
  font-weight: 600;
}

.${p}calc-slider-val {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.375rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.${p}calc-slider-group input[type="range"] {
  width: 100%;
  accent-color: ${v(`--${p}primary`, primary)};
  cursor: pointer;
}

.${p}calc-range-limits {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: ${v(`--${p}muted`, muted)};
}

.${p}calc-assumptions {
  padding-top: 20px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  font-variant-numeric: tabular-nums;
}

.${p}calc-assumptions span {
  display: block;
  font-size: 0.8125rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}calc-assumptions strong {
  font-size: 0.96875rem;
}

.${p}calc-output {
  padding: 32px;
  border: 1px solid ${v(`--${p}primary`, primary)};
  border-top-width: 3px;
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}surface`, surface)};
  background-image: radial-gradient(circle at 100% 0%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 10%, transparent), transparent 56%);
  box-shadow: 0 22px 46px -22px color-mix(in srgb, ${v(`--${p}primary`, primary)} 26%, rgba(15, 23, 42, 0.2));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
}

.${p}bg-contrast .${p}calc-output {
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

.${p}calc-kicker {
  margin: 0 0 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}calc-kicker {
  color: rgba(255, 255, 255, 0.9);
}

.${p}calc-big-val {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(2.15rem, 3.6vw, 3.1rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.${p}calc-per {
  font-size: 1.125rem;
  font-weight: 500;
  opacity: 0.78;
}

.${p}calc-metrics {
  padding-block: 16px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  display: grid;
  gap: 12px;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
}

.${p}calc-metrics > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Extended Layout & Grid Style Variants */
.${p}hero-split-left .${p}hero-media {
  order: -1;
}

.${p}stats-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.${p}stats-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.${p}stats-cards .${p}stat-item,
.${p}stats-grid-2 .${p}stat-item {
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 26px -18px rgba(15, 23, 42, 0.1);
  padding: 24px;
}

.${p}bg-contrast .${p}stats-cards .${p}stat-item,
.${p}bg-contrast .${p}stats-grid-2 .${p}stat-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.${p}bento-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.${p}bento-wide {
  grid-column: span 2;
}

.${p}bento-featured {
  border-color: ${v(`--${p}primary`, primary)};
  background-color: ${v(`--${p}surface`, surface)};
  background-image: radial-gradient(circle at 100% 0%, color-mix(in srgb, ${v(`--${p}primary`, primary)} 10%, transparent), transparent 56%);
}

.${p}bg-contrast .${p}bento-featured {
  background-color: rgba(255, 255, 255, 0.09);
}

.${p}feat-minimal-grid {
  gap: 36px 32px;
}

.${p}feat-minimal {
  padding-top: 20px;
  border-top: 2px solid ${v(`--${p}border`, border)};
}

.${p}feat-minimal-lead {
  border-top-color: ${v(`--${p}primary`, primary)};
}

.${p}feat-minimal-meta {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}feat-minimal-meta {
  color: rgba(255, 255, 255, 0.88);
}

.${p}feat-numbered-list {
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}feat-numbered-row {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 24px;
  align-items: baseline;
  padding-block: 24px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}feat-numbered-lead {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.${p}feat-num {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${v(`--${p}primary`, primary)};
}

.${p}feat-numbered-meta {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}split-wide-media {
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
}

.${p}split-stacked {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.${p}split-stacked .${p}split-copy {
  max-width: 64ch;
}

.${p}pricing-rows {
  display: grid;
  gap: 18px;
}

.${p}pricing-row {
  display: grid;
  grid-template-columns: 4fr 5fr 3fr;
  gap: 28px;
  align-items: center;
  padding: 28px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
}

.${p}bg-contrast .${p}pricing-row {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}pricing-list-2col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 14px 0 0;
}

.${p}quote-centered {
  text-align: center;
}

.${p}quote-centered .${p}quote-footer {
  justify-content: center;
  flex-direction: column;
}

.${p}quote-card {
  padding: 44px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-top: 3px solid ${v(`--${p}primary`, primary)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
}

.${p}bg-contrast .${p}quote-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
  border-top-color: ${v(`--${p}primary`, primary)};
}

.${p}faq-split {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: 48px;
  align-items: start;
}

.${p}cta-centered {
  flex-direction: column;
  text-align: center;
}

.${p}cta-centered .${p}btn-group {
  justify-content: center;
}

.${p}cta-minimal {
  border-inline: 0;
  border-radius: 0;
  padding-inline: 0;
  background-color: transparent !important;
}

.${p}contact-reverse .${p}contact-form {
  order: -1;
}

.${p}contact-centered {
  max-width: 680px;
  display: grid;
  gap: 32px;
}

.${p}contact-centered .${p}split-copy {
  text-align: center;
}

.${p}contact-centered .${p}eyebrow {
  justify-content: center;
}

.${p}footer-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
}

.${p}footer-inline-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.${p}footer-bottom-centered {
  text-align: center;
}

.${p}logo-cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.${p}logo-cards .${p}logo-item,
.${p}logo-compact-grid .${p}logo-item {
  padding: 20px 14px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
}

.${p}bg-contrast .${p}logo-cards .${p}logo-item,
.${p}bg-contrast .${p}logo-compact-grid .${p}logo-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}logo-compact-wrap {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: 32px;
  align-items: center;
}

.${p}logo-compact-wrap .${p}logo-head {
  margin-bottom: 0;
  display: block;
}

.${p}logo-compact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.${p}case-rows {
  display: grid;
  gap: 24px;
}

.${p}case-card-row {
  display: grid;
  grid-template-columns: 5fr 7fr;
}

.${p}case-card-row .${p}case-media {
  border-bottom: 0;
  border-right: 1px solid ${v(`--${p}border`, border)};
  height: 100%;
}

.${p}video-split-left .${p}video-stage-wrap {
  order: -1;
}

.${p}video-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 36px;
}

.${p}video-centered .${p}video-copy {
  max-width: 64ch;
}

.${p}video-centered .${p}eyebrow {
  justify-content: center;
}

.${p}video-centered .${p}video-stage-wrap {
  width: 100%;
  max-width: 920px;
}

.${p}team-card-row {
  flex-direction: row;
  align-items: flex-start;
  padding: 20px;
  gap: 20px;
}

.${p}team-card-row .${p}team-media {
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-bottom: 0;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
}

.${p}team-card-row .${p}team-body {
  padding: 0;
}

.${p}team-card-minimal {
  border: 0;
  background-color: transparent !important;
  box-shadow: none !important;
}

.${p}team-card-minimal .${p}team-media {
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  margin-bottom: 16px;
}

.${p}team-card-minimal .${p}team-body {
  padding: 0;
}

.${p}calc-reverse .${p}calc-output {
  order: -1;
}

.${p}calc-stacked {
  grid-template-columns: 1fr;
}

/* Responsive Breakpoints */
@media (max-width: 900px) {
  .${p}hero-split,
  .${p}split,
  .${p}grid-3,
  .${p}grid-4,
  .${p}stats-grid,
  .${p}stats-cards,
  .${p}stats-grid-2,
  .${p}bento-grid,
  .${p}feat-numbered-row,
  .${p}pricing-row,
  .${p}pricing-list-2col,
  .${p}faq-split,
  .${p}logo-compact-wrap,
  .${p}case-card-row,
  .${p}footer-grid,
  .${p}video-split,
  .${p}calc-grid,
  .${p}case-modal-grid {
    grid-template-columns: 1fr;
  }

  .${p}bento-wide {
    grid-column: span 1;
  }

  .${p}hero-split-left .${p}hero-media,
  .${p}contact-reverse .${p}contact-form,
  .${p}video-split-left .${p}video-stage-wrap,
  .${p}calc-reverse .${p}calc-output {
    order: 0;
  }

  .${p}case-card-row .${p}case-media {
    border-right: 0;
    border-bottom: 1px solid ${v(`--${p}border`, border)};
  }

  .${p}team-card-row {
    flex-direction: column;
  }

  .${p}logo-row,
  .${p}logo-grid,
  .${p}logo-cards,
  .${p}logo-compact-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .${p}calc-assumptions {
    grid-template-columns: 1fr;
  }

  .${p}stat-item {
    padding: 20px 0;
  }

  .${p}stat-item + .${p}stat-item {
    border-left: none;
    border-top: 1px solid ${v(`--${p}border`, border)};
  }

  .${p}bg-contrast .${p}stat-item + .${p}stat-item {
    border-top-color: rgba(255, 255, 255, 0.16);
  }

  .${p}split-reverse .${p}split-media {
    order: 0;
  }

  .${p}grid-2 {
    grid-template-columns: 1fr;
  }

  .${p}hero-banner {
    min-height: 420px;
    padding: 32px;
  }

  .${p}cta-panel {
    padding: 32px 24px;
  }
}

@media (max-width: 720px) {
  .${p}nav-links {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 74px;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 28px;
    background: inherit;
    border-bottom: 1px solid ${v(`--${p}border`, border)};
    gap: 16px;
  }

  .${p}nav-links.${p}nav-open {
    display: flex;
  }

  .${p}menu-toggle {
    display: inline-flex;
  }
}

/* Marketing Announcement Bar */
.${p}promo-bar {
  background-color: ${v(`--${p}contrast`, contrastBg)};
  color: #FFFFFF;
  padding: 10px 24px;
  font-size: 0.9375rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.${p}promo-inner {
  max-width: ${options.useCssVariables ? `var(--${p}container)` : '1200px'};
  margin-inline: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.${p}promo-cta {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
  font-size: 0.875rem;
  font-weight: 600;
}

${
  motionMode !== 'none'
    ? `/* Motion & Micro-Interactions */
@keyframes ${p}fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ${p}scaleIn {
  from {
    opacity: 0;
    transform: scale(0.975) translateY(14px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes ${p}bannerSettle {
  from {
    transform: scale(1.055);
  }
  to {
    transform: scale(1);
  }
}

@keyframes ${p}faqOpen {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.${p}navbar {
  transition: box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms ease;
}

.${p}navbar.${p}nav-scrolled {
  box-shadow: 0 12px 32px -22px rgba(15, 23, 42, 0.28);
}

.${p}btn:active {
  transform: translateY(0) scale(0.985);
}

.${p}media-frame .${p}media-img,
.${p}hero-banner .${p}hero-banner-bg {
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.${p}media-frame:hover .${p}media-img,
.${p}hero-banner:hover .${p}hero-banner-bg {
  transform: scale(1.03);
}

.${p}card {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.${p}card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -26px rgba(15, 23, 42, 0.2);
}

.${p}pricing-card {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.${p}pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 48px -24px rgba(15, 23, 42, 0.24);
}

.${p}faq-item[open] .${p}faq-answer {
  animation: ${p}faqOpen 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.${p}hero-copy > *,
.${p}hero-banner-content > * {
  animation: ${p}fadeUp ${motionMode === 'editorial' ? '640ms' : '420ms'} cubic-bezier(0.16, 1, 0.3, 1) both;
}

.${p}hero-copy > *:nth-child(1),
.${p}hero-banner-content > *:nth-child(1) {
  animation-delay: 40ms;
}

.${p}hero-copy > *:nth-child(2),
.${p}hero-banner-content > *:nth-child(2) {
  animation-delay: 110ms;
}

.${p}hero-copy > *:nth-child(3),
.${p}hero-banner-content > *:nth-child(3) {
  animation-delay: 175ms;
}

.${p}hero-copy > *:nth-child(4),
.${p}hero-banner-content > *:nth-child(4) {
  animation-delay: 240ms;
}

.${p}hero-media {
  animation: ${p}scaleIn ${motionMode === 'editorial' ? '720ms' : '460ms'} cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
}
`
    : ''
}
${
  motionMode === 'editorial'
    ? `.${p}hero-banner-bg {
  animation: ${p}bannerSettle 1400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

html.${p}motion-ready .${p}reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 620ms cubic-bezier(0.16, 1, 0.3, 1), transform 620ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

html.${p}motion-ready .${p}reveal.${p}in-view {
  opacity: 1;
  transform: translateY(0);
}

html.${p}motion-ready .${p}reveal:nth-child(2) { transition-delay: 70ms; }
html.${p}motion-ready .${p}reveal:nth-child(3) { transition-delay: 140ms; }
html.${p}motion-ready .${p}reveal:nth-child(4) { transition-delay: 210ms; }
html.${p}motion-ready .${p}reveal:nth-child(5) { transition-delay: 280ms; }
html.${p}motion-ready .${p}reveal:nth-child(6) { transition-delay: 350ms; }
`
    : ''
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  html.${p}motion-ready .${p}reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
`.trim();

  if (!options.minify) {
    return rawCss;
  }

  return rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function generateCleanHtml(
  project: SiteProject,
  options: ExportOptions,
  inlineCss = false,
  includePreviewScrollbar = false,
  targetPage?: SitePage
): string {
  const p = (options.prefix || 'af-').replace(/[^a-zA-Z0-9_-]/g, '');
  const fontsHref = getGoogleFontsUrl(project.theme);
  const pageBlocks = targetPage ? targetPage.blocks : project.blocks;
  const pagePath = targetPage ? normalizePagePath(targetPage.path) : '/';
  const bodyBlocks = pageBlocks.map((block) => renderBlockHtml(block, p)).join('\n\n');
  const css = inlineCss ? generateCleanCss(project.theme, options) : '';
  const previewScrollbarCss = includePreviewScrollbar
    ? `
    html {
      scroll-behavior: smooth;
      scrollbar-gutter: stable;
      scrollbar-width: auto;
      scrollbar-color: #7D7667 #E5E0D4;
    }
    html::-webkit-scrollbar { width: 12px; height: 12px; }
    html::-webkit-scrollbar-track { background: #E5E0D4; border-left: 1px solid #CFC8B8; }
    html::-webkit-scrollbar-thumb { background: #7D7667; border-radius: 9999px; border: 2px solid #E5E0D4; }
    html::-webkit-scrollbar-thumb:hover { background: #13151A; }`
    : '';

  const baseSeoTitle = project.seo?.title?.trim() || project.name;
  const seoTitle =
    targetPage?.seo?.title?.trim() ||
    (targetPage && pagePath !== '/'
      ? `${targetPage.name} — ${baseSeoTitle}`
      : baseSeoTitle);
  const seoDesc =
    targetPage?.seo?.description?.trim() ||
    project.seo?.description?.trim() ||
    project.description ||
    project.name;
  const seoLang = (project.seo?.language || 'en').replace(/[^a-zA-Z-]/g, '') || 'en';
  const rawBaseCanonical =
    targetPage?.seo?.canonicalUrl?.trim() ||
    project.seo?.canonicalUrl?.trim() ||
    project.seo?.customDomain?.trim() ||
    '';
  const normalizedBase =
    rawBaseCanonical &&
    !/^https?:\/\//i.test(rawBaseCanonical) &&
    !rawBaseCanonical.startsWith('/')
      ? `https://${rawBaseCanonical}`
      : rawBaseCanonical;
  const canonicalHref =
    normalizedBase &&
    targetPage &&
    !targetPage.seo?.canonicalUrl?.trim() &&
    pagePath !== '/'
      ? `${normalizedBase.replace(/\/+$/, '')}${pagePath}`
      : normalizedBase;
  const formEndpoint = options.formEndpoint?.trim() || '';
  const trackEndpoint = options.trackEndpoint?.trim() || '';
  const previewNavBridge = Boolean(options.previewNavigationBridge);

  const mkt = project.marketing;
  const ga4Id =
    mkt?.ga4MeasurementId && /^G-[A-Z0-9]{4,18}$/i.test(mkt.ga4MeasurementId.trim())
      ? mkt.ga4MeasurementId.trim().toUpperCase()
      : '';
  const adsId =
    mkt?.googleAdsId && /^AW-[A-Z0-9]{4,18}$/i.test(mkt.googleAdsId.trim())
      ? mkt.googleAdsId.trim().toUpperCase()
      : '';
  const metaPixelId =
    mkt?.metaPixelId && /^\d{8,22}$/.test(mkt.metaPixelId.trim())
      ? mkt.metaPixelId.trim()
      : '';
  const linkedinId =
    mkt?.linkedinPartnerId && /^\d{4,16}$/.test(mkt.linkedinPartnerId.trim())
      ? mkt.linkedinPartnerId.trim()
      : '';

  const gtagPrimaryId = ga4Id || adsId;
  const gtagSnippet = gtagPrimaryId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(
        gtagPrimaryId
      )}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());${
      ga4Id ? `\n    gtag('config', ${JSON.stringify(ga4Id)});` : ''
    }${adsId ? `\n    gtag('config', ${JSON.stringify(adsId)});` : ''}
  </script>`
    : '';

  const metaPixelSnippet = metaPixelId
    ? `<script>
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', ${JSON.stringify(metaPixelId)});
    fbq('track', 'PageView');
  </script>`
    : '';

  const linkedinSnippet = linkedinId
    ? `<script>
    _linkedin_partner_id = ${JSON.stringify(linkedinId)};
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];
    var b=document.createElement("script");b.type="text/javascript";b.async=true;
    b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b,s);})(window.lintrk);
  </script>`
    : '';

  const jsonLdSnippet = mkt?.enableJsonLd
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: seoTitle,
        description: seoDesc,
        ...(canonicalHref ? { url: canonicalHref } : {}),
      }).replace(/</g, '\\u003c')}</script>`
    : '';

  const promoBarHtml =
    mkt?.announcementEnabled && mkt.announcementText?.trim()
      ? `  <div class="${p}promo-bar" role="region" aria-label="Promotional announcement">
    <div class="${p}promo-inner">
      <span>${escapeHtml(mkt.announcementText.trim())}</span>${
        mkt.announcementCtaLabel?.trim()
          ? `
      <a href="${escapeHtml(
        mkt.announcementCtaHref?.trim() || '#contact'
      )}" class="${p}promo-cta">${escapeHtml(mkt.announcementCtaLabel.trim())}</a>`
          : ''
      }
    </div>
  </div>\n`
      : '';

  const motionMode = project.theme.motion || 'editorial';
  const interactionScript = `<script>
    (function () {
      var motionMode = ${JSON.stringify(motionMode)};
      var navbar = document.querySelector('.${p}navbar');
      if (navbar && motionMode !== 'none') {
        var onNavScroll = function () {
          navbar.classList.toggle('${p}nav-scrolled', window.scrollY > 12);
        };
        window.addEventListener('scroll', onNavScroll, { passive: true });
        onNavScroll();
      }
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (motionMode === 'editorial' && !reducedMotion) {
        var revealEls = Array.prototype.slice.call(document.querySelectorAll('.${p}reveal'));
        if (revealEls.length > 0) {
          document.documentElement.classList.add('${p}motion-ready');
          var revealIfVisible = function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.96) {
              el.classList.add('${p}in-view');
              return true;
            }
            return false;
          };
          revealEls.forEach(function (el) { revealIfVisible(el); });
          if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add('${p}in-view');
                  io.unobserve(entry.target);
                }
              });
            }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
            revealEls.forEach(function (el) {
              if (!el.classList.contains('${p}in-view')) io.observe(el);
            });
          } else {
            revealEls.forEach(function (el) { el.classList.add('${p}in-view'); });
          }
          setTimeout(function () {
            revealEls.forEach(function (el) {
              if (!el.classList.contains('${p}in-view')) {
                var rect = el.getBoundingClientRect();
                if (rect.top <= (window.innerHeight || 900) * 1.15) {
                  el.classList.add('${p}in-view');
                }
              }
            });
          }, 900);
        }
      }
      var toggle = document.querySelector('.${p}menu-toggle');
      var nav = document.querySelector('.${p}nav-links');
      if (toggle && nav) {
        toggle.addEventListener('click', function () {
          var open = nav.classList.toggle('${p}nav-open');
          toggle.setAttribute('aria-expanded', String(open));
        });
      }
      var trackUrl = ${JSON.stringify(trackEndpoint)};
      if (trackUrl) {
        document.querySelectorAll('.${p}btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var label = (btn.textContent || '').trim().slice(0, 80);
            var payload = JSON.stringify({ eventType: 'cta_click', targetLabel: label });
            if (navigator.sendBeacon) {
              navigator.sendBeacon(trackUrl, new Blob([payload], { type: 'application/json' }));
            } else {
              fetch(trackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
            }
          });
        });
      }
      var forms = document.querySelectorAll('[data-af-contact-form]');
      var endpoint = ${JSON.stringify(formEndpoint)};
      forms.forEach(function (form) {
        var formMode = form.getAttribute('data-af-form-mode') || 'standard';

        // Multi-step wiring
        if (formMode === 'multistep') {
          var step1 = form.querySelector('[data-af-step="1"]');
          var step2 = form.querySelector('[data-af-step="2"]');
          var nextBtn = form.querySelector('[data-af-step-next]');
          var prevBtn = form.querySelector('[data-af-step-prev]');
          var stepText = form.querySelector('[data-af-step-text]');
          var dot1 = form.querySelector('[data-af-dot="1"]');
          var dot2 = form.querySelector('[data-af-dot="2"]');

          if (step1 && step2 && nextBtn) {
            nextBtn.addEventListener('click', function () {
              var s1Controls = step1.querySelectorAll('input, select, textarea');
              for (var i = 0; i < s1Controls.length; i++) {
                if (!s1Controls[i].checkValidity()) {
                  s1Controls[i].reportValidity();
                  return;
                }
              }
              step1.setAttribute('hidden', '');
              step2.removeAttribute('hidden');
              if (stepText) stepText.textContent = 'Step 2 of 2 · Project Scope';
              if (dot2) dot2.classList.add('${p}step-dot-active');
            });
          }
          if (step1 && step2 && prevBtn) {
            prevBtn.addEventListener('click', function () {
              step2.setAttribute('hidden', '');
              step1.removeAttribute('hidden');
              if (stepText) stepText.textContent = 'Step 1 of 2 · Your Details';
              if (dot2) dot2.classList.remove('${p}step-dot-active');
            });
          }
        }

        // Consultation booking picker wiring
        var bookingPicker = form.querySelector('[data-af-booking-picker]');
        if (bookingPicker) {
          var datesWrap = bookingPicker.querySelector('[data-af-booking-dates]');
          var dateInput = bookingPicker.querySelector('[data-af-booking-date-input]');
          var timeInput = bookingPicker.querySelector('[data-af-booking-time-input]');
          var summaryEl = bookingPicker.querySelector('[data-af-booking-summary]');
          var slotBtns = bookingPicker.querySelectorAll('[data-af-booking-slot]');
          var selectedDayLabel = '';
          var selectedTimeLabel = (timeInput && timeInput.value) || '10:30 AM';

          var refreshBookingSummary = function () {
            if (summaryEl && selectedDayLabel) {
              summaryEl.textContent = 'Selected: ' + selectedDayLabel + ' at ' + selectedTimeLabel;
            }
          };

          if (datesWrap) {
            var cursor = new Date();
            cursor.setHours(12, 0, 0, 0);
            cursor.setDate(cursor.getDate() + 1);
            var daysAdded = 0;
            while (daysAdded < 6) {
              var dow = cursor.getDay();
              if (dow !== 0 && dow !== 6) {
                (function (dObj, idx) {
                  var wk = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                  var dt = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  var fullLbl = wk + ', ' + dt;
                  var btn = document.createElement('button');
                  btn.type = 'button';
                  btn.className = '${p}booking-date-btn' + (idx === 0 ? ' ${p}booking-active' : '');
                  btn.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
                  btn.innerHTML = '<span>' + wk + '</span><strong>' + dt + '</strong>';
                  if (idx === 0) {
                    selectedDayLabel = fullLbl;
                    if (dateInput) dateInput.value = fullLbl;
                  }
                  btn.addEventListener('click', function () {
                    datesWrap.querySelectorAll('.${p}booking-date-btn').forEach(function (b) {
                      b.classList.remove('${p}booking-active');
                      b.setAttribute('aria-pressed', 'false');
                    });
                    btn.classList.add('${p}booking-active');
                    btn.setAttribute('aria-pressed', 'true');
                    selectedDayLabel = fullLbl;
                    if (dateInput) dateInput.value = fullLbl;
                    refreshBookingSummary();
                  });
                  datesWrap.appendChild(btn);
                })(new Date(cursor.getTime()), daysAdded);
                daysAdded++;
              }
              cursor.setDate(cursor.getDate() + 1);
            }
          }

          slotBtns.forEach(function (sBtn) {
            sBtn.addEventListener('click', function () {
              slotBtns.forEach(function (b) {
                b.classList.remove('${p}booking-active');
                b.setAttribute('aria-pressed', 'false');
              });
              sBtn.classList.add('${p}booking-active');
              sBtn.setAttribute('aria-pressed', 'true');
              selectedTimeLabel = sBtn.getAttribute('data-af-booking-slot') || '';
              if (timeInput) timeInput.value = selectedTimeLabel;
              refreshBookingSummary();
            });
          });
          refreshBookingSummary();
        }

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var statusEl = form.querySelector('.${p}form-status');
          var submitBtn = form.querySelector('button[type="submit"]');
          var successMsg = form.getAttribute('data-af-success-msg') || 'Thank you — your inquiry was received.';
          var redirectUrl = form.getAttribute('data-af-redirect-url') || '';

          var nameVal = ((form.querySelector('[name="name"]') || {}).value || '').trim();
          var emailVal = ((form.querySelector('[name="email"]') || {}).value || '').trim();
          var phoneVal = ((form.querySelector('[name="phone"]') || {}).value || '').trim();
          var companyVal = ((form.querySelector('[name="company"]') || {}).value || '').trim();
          var msgVal = ((form.querySelector('[name="message"]') || {}).value || '').trim();

          var customData = {};
          form.querySelectorAll('[data-af-field-label]').forEach(function (el) {
            var fieldName = el.getAttribute('name') || '';
            if (!fieldName || fieldName === 'name' || fieldName === 'email' || fieldName === 'phone' || fieldName === 'company' || fieldName === 'message') {
              if (!nameVal && el.type === 'text' && fieldName.indexOf('name') !== -1) nameVal = (el.value || '').trim();
              if (!emailVal && el.type === 'email') emailVal = (el.value || '').trim();
              return;
            }
            var labelKey = el.getAttribute('data-af-field-label') || fieldName;
            if (el.type === 'checkbox') {
              customData[labelKey] = Boolean(el.checked);
            } else if ((el.value || '').trim()) {
              customData[labelKey] = el.value.trim();
            }
          });

          var bookingPayload = null;
          if (bookingPicker) {
            var bDate = ((form.querySelector('[data-af-booking-date-input]') || {}).value || '').trim();
            var bTime = ((form.querySelector('[data-af-booking-time-input]') || {}).value || '').trim();
            if (bDate && bTime) {
              bookingPayload = {
                date: bDate,
                time: bTime,
                timezone: bookingPicker.getAttribute('data-af-timezone') || '',
                duration: bookingPicker.getAttribute('data-af-duration') || ''
              };
            }
          }

          if (!endpoint) {
            if (statusEl) statusEl.textContent = successMsg;
            form.reset();
            return;
          }
          if (submitBtn) submitBtn.disabled = true;
          if (statusEl) statusEl.textContent = 'Sending...';
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nameVal || 'Website Visitor',
              email: emailVal,
              phone: phoneVal,
              company: companyVal,
              message: msgVal,
              customData: customData,
              bookingSlot: bookingPayload
            })
          })
            .then(function (res) {
              if (!res.ok) throw new Error('Submission failed');
              return res.json();
            })
            .then(function () {
              if (statusEl) statusEl.textContent = successMsg;
              form.reset();
              if (redirectUrl) {
                setTimeout(function () { window.location.href = redirectUrl; }, 900);
              }
            })
            .catch(function () {
              if (statusEl) statusEl.textContent = 'Unable to send right now. Please try again.';
            })
            .finally(function () {
              if (submitBtn) submitBtn.disabled = false;
            });
        });
      });

      // Portfolio category filtering & detail modal
      document.querySelectorAll('[data-af-portfolio]').forEach(function (section) {
        var filterBtns = section.querySelectorAll('[data-af-filter]');
        var cards = section.querySelectorAll('[data-af-category]');
        filterBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var cat = btn.getAttribute('data-af-filter') || 'All';
            filterBtns.forEach(function (b) { b.classList.remove('${p}filter-active'); });
            btn.classList.add('${p}filter-active');
            cards.forEach(function (card) {
              var cardCat = card.getAttribute('data-af-category') || '';
              card.style.display = (cat === 'All' || cardCat === cat) ? '' : 'none';
            });
          });
        });

        var modal = section.querySelector('[data-af-case-modal]');
        if (modal) {
          var closeModal = function () { modal.setAttribute('hidden', ''); };
          modal.querySelectorAll('[data-af-modal-close]').forEach(function (cBtn) {
            cBtn.addEventListener('click', closeModal);
          });
          modal.addEventListener('click', function (ev) {
            if (ev.target === modal) closeModal();
          });
          document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
          });

          cards.forEach(function (card) {
            var trigger = card.querySelector('[data-af-open-case]');
            var openCard = function () {
              var mMeta = modal.querySelector('[data-af-modal-meta]');
              var mImg = modal.querySelector('[data-af-modal-img]');
              var mMetric = modal.querySelector('[data-af-modal-metric]');
              var mTitle = modal.querySelector('[data-af-modal-title]');
              var mSummary = modal.querySelector('[data-af-modal-summary]');
              var mChal = modal.querySelector('[data-af-modal-challenge]');
              var mOut = modal.querySelector('[data-af-modal-outcome]');
              var mDetails = modal.querySelector('[data-af-modal-details]');
              var mCta = modal.querySelector('[data-af-modal-cta]');
              var cat = card.getAttribute('data-af-case-category') || '';
              var cli = card.getAttribute('data-af-case-client') || '';
              if (mMeta) mMeta.textContent = cat + ' · ' + cli;
              if (mImg) {
                mImg.setAttribute('src', card.getAttribute('data-af-case-img') || '');
                mImg.setAttribute('alt', card.getAttribute('data-af-case-alt') || '');
              }
              if (mMetric) mMetric.textContent = card.getAttribute('data-af-case-metric') || '';
              if (mTitle) mTitle.textContent = card.getAttribute('data-af-case-title') || '';
              if (mSummary) mSummary.textContent = card.getAttribute('data-af-case-summary') || '';
              var ch = card.getAttribute('data-af-case-challenge') || '';
              var ou = card.getAttribute('data-af-case-outcome') || '';
              if (mChal) mChal.textContent = ch;
              if (mOut) mOut.textContent = ou;
              if (mDetails) mDetails.style.display = (ch || ou) ? 'grid' : 'none';
              var ctaText = card.getAttribute('data-af-case-cta') || '';
              var ctaHref = card.getAttribute('data-af-case-href') || '#contact';
              if (mCta) {
                mCta.textContent = ctaText;
                mCta.setAttribute('href', ctaHref);
                mCta.style.display = ctaText ? 'inline-flex' : 'none';
                mCta.onclick = closeModal;
              }
              modal.removeAttribute('hidden');
            };
            if (trigger) trigger.addEventListener('click', openCard);
          });
        }
      });

      // Video Showcase interactive embed toggle
      document.querySelectorAll('[data-af-video-stage]').forEach(function (stage) {
        var posterMarkup = stage.innerHTML;
        var bindPlay = function () {
          var playBtn = stage.querySelector('[data-af-video-play]');
          if (!playBtn) return;
          playBtn.addEventListener('click', function () {
            var kind = stage.getAttribute('data-video-kind') || 'link';
            var src = stage.getAttribute('data-video-src') || '';
            var title = stage.getAttribute('data-video-title') || 'Video showcase';
            var poster = stage.getAttribute('data-poster-url') || '';
            if (kind === 'iframe' && src) {
              stage.innerHTML = '';
              var fr = document.createElement('iframe');
              fr.setAttribute('src', src);
              fr.setAttribute('title', title);
              fr.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
              fr.setAttribute('allowfullscreen', '');
              stage.appendChild(fr);
            } else if (kind === 'video' && src) {
              stage.innerHTML = '';
              var vid = document.createElement('video');
              vid.setAttribute('src', src);
              if (poster) vid.setAttribute('poster', poster);
              vid.setAttribute('controls', '');
              vid.setAttribute('autoplay', '');
              vid.setAttribute('playsinline', '');
              stage.appendChild(vid);
            } else if (src) {
              window.open(src, '_blank', 'noopener,noreferrer');
              return;
            }
            var resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = '${p}video-reset';
            resetBtn.textContent = 'Poster';
            resetBtn.addEventListener('click', function () {
              stage.innerHTML = posterMarkup;
              bindPlay();
            });
            stage.appendChild(resetBtn);
          });
        };
        bindPlay();
      });

      // Interactive ROI & Pricing Calculator
      document.querySelectorAll('[data-af-calc]').forEach(function (calc) {
        var cur = calc.getAttribute('data-cur') || '$';
        var rate = Number(calc.getAttribute('data-rate') || '75');
        var base = Number(calc.getAttribute('data-base') || '199');
        var unitCost = Number(calc.getAttribute('data-unit-cost') || '28');
        var u1 = calc.getAttribute('data-u1') || 'seats';
        var u2 = calc.getAttribute('data-u2') || 'hrs/mo';
        var pInput = calc.querySelector('[data-af-calc-primary]');
        var sInput = calc.querySelector('[data-af-calc-secondary]');
        var updateCalc = function () {
          if (!pInput || !sInput) return;
          var pVal = Number(pInput.value || 0);
          var sVal = Number(sInput.value || 0);
          var gross = pVal * sVal * rate;
          var cost = base + pVal * unitCost;
          var net = Math.max(0, gross - cost);
          var annual = net * 12;
          var hours = pVal * sVal * 12;
          var mult = cost > 0 ? Math.max(1, gross / cost) : 1;
          var elP = calc.querySelector('[data-af-out-primary]');
          var elS = calc.querySelector('[data-af-out-secondary]');
          var elCost = calc.querySelector('[data-af-out-cost]');
          var elHrs = calc.querySelector('[data-af-out-hours]');
          var elNet = calc.querySelector('[data-af-out-net]');
          var elAnn = calc.querySelector('[data-af-out-annual]');
          var elGross = calc.querySelector('[data-af-out-gross]');
          var elRoi = calc.querySelector('[data-af-out-roi]');
          if (elP) elP.textContent = pVal.toLocaleString() + ' ' + u1;
          if (elS) elS.textContent = sVal.toLocaleString() + ' ' + u2;
          if (elCost) elCost.textContent = cur + cost.toLocaleString() + '/mo';
          if (elHrs) elHrs.textContent = hours.toLocaleString() + ' hrs';
          if (elNet) elNet.textContent = cur + net.toLocaleString();
          if (elAnn) elAnn.textContent = cur + annual.toLocaleString() + ' / yr';
          if (elGross) elGross.textContent = cur + gross.toLocaleString() + ' / mo';
          if (elRoi) elRoi.textContent = mult.toFixed(1) + 'x ROI';
        };
        if (pInput) pInput.addEventListener('input', updateCalc);
        if (sInput) sInput.addEventListener('input', updateCalc);
        updateCalc();
      });${
        previewNavBridge
          ? `
      document.addEventListener('click', function (e) {
        var anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!anchor) return;
        var href = anchor.getAttribute('href') || '';
        if (href.charAt(0) === '/' && href.indexOf('//') !== 0) {
          e.preventDefault();
          window.parent.postMessage({ type: 'af-preview-navigate', path: href }, '*');
        }
      });`
          : ''
      }
    })();
  </script>`;

  const doc = `<!doctype html>
<html lang="${escapeHtml(seoLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDesc)}" />
  <meta property="og:title" content="${escapeHtml(seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(seoDesc)}" />
  <meta property="og:type" content="website" />
  ${canonicalHref ? `<meta property="og:url" content="${escapeHtml(canonicalHref)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  ${canonicalHref ? `<link rel="canonical" href="${escapeHtml(canonicalHref)}" />` : ''}
  ${jsonLdSnippet}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fontsHref}" rel="stylesheet" />
  ${
    inlineCss
      ? `<style>\n${css}${previewScrollbarCss}\n  </style>`
      : `<link rel="stylesheet" href="./styles.css" />`
  }
  ${gtagSnippet}
  ${metaPixelSnippet}
  ${linkedinSnippet}
</head>
<body>
${promoBarHtml}${bodyBlocks}
  ${interactionScript}
</body>
</html>`;

  if (!options.minify || inlineCss) {
    return doc;
  }
  return doc.replace(/>\s+</g, '><').trim();
}

export interface CompiledSitePage {
  id: string;
  name: string;
  path: string;
  fileName: string;
  title: string;
  description: string;
  blockCount: number;
  html: string;
}

export function generateAllSitePagesHtml(
  project: SiteProject,
  options: ExportOptions,
  inlineCss = false
): CompiledSitePage[] {
  const { pages, activePageId } = ensureProjectPages(project);
  return pages.map((page) => {
    const resolvedPage: SitePage =
      page.id === activePageId ? { ...page, blocks: project.blocks } : page;
    const normPath = normalizePagePath(resolvedPage.path);
    const title =
      resolvedPage.seo?.title?.trim() ||
      (normPath === '/'
        ? project.seo?.title?.trim() || project.name
        : `${resolvedPage.name} — ${project.seo?.title?.trim() || project.name}`);
    const description =
      resolvedPage.seo?.description?.trim() ||
      project.seo?.description?.trim() ||
      project.description ||
      project.name;

    return {
      id: resolvedPage.id,
      name: resolvedPage.name,
      path: normPath,
      fileName: formatPageFileName(normPath),
      title,
      description,
      blockCount: resolvedPage.blocks.length,
      html: generateCleanHtml(project, options, inlineCss, false, resolvedPage),
    };
  });
}

export function generateSitemapXml(project: SiteProject, baseOrigin?: string): string {
  const { pages } = ensureProjectPages(project);
  const rawDomain =
    baseOrigin?.trim() ||
    project.seo?.customDomain?.trim() ||
    project.seo?.canonicalUrl?.trim() ||
    (project.lastDeployedSlug ? `https://atelierframe.app/sites/${project.lastDeployedSlug}` : `https://example.com`);
  const cleanOrigin = (/^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`).replace(
    /\/+$/,
    ''
  );
  const lastmod = (project.updatedAt || new Date().toISOString()).slice(0, 10);

  const urlNodes = pages
    .map((page) => {
      const normPath = normalizePagePath(page.path);
      const loc = normPath === '/' ? `${cleanOrigin}/` : `${cleanOrigin}${normPath}`;
      const priority = normPath === '/' ? '1.0' : '0.8';
      return `  <url>
    <loc>${escapeHtml(loc)}</loc>
    <lastmod>${escapeHtml(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;
}

export function generateRobotsTxt(project: SiteProject, baseOrigin?: string): string {
  const rawDomain =
    baseOrigin?.trim() ||
    project.seo?.customDomain?.trim() ||
    project.seo?.canonicalUrl?.trim() ||
    (project.lastDeployedSlug ? `https://atelierframe.app/sites/${project.lastDeployedSlug}` : `https://example.com`);
  const cleanOrigin = (/^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`).replace(
    /\/+$/,
    ''
  );
  return `User-agent: *
Allow: /

Sitemap: ${cleanOrigin}/sitemap.xml`;
}
