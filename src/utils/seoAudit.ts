import { SeoAuditCheck, SiteProject } from '../types/builder';

export interface ProjectSeoAuditResult {
  score: number;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  checks: SeoAuditCheck[];
}

export function auditProjectSeo(project: SiteProject): ProjectSeoAuditResult {
  const title = (project.seo?.title?.trim() || project.name || '').trim();
  const description = (project.seo?.description?.trim() || project.description || '').trim();
  const canonical = (
    project.seo?.canonicalUrl?.trim() ||
    project.seo?.customDomain?.trim() ||
    ''
  ).trim();
  const hasAbsoluteCanonical =
    canonical.length > 0 &&
    (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(canonical) ||
      /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(`https://${canonical}`));

  const lang = (project.seo?.language || 'en').trim();

  let h1Count = 0;
  let h2Count = 0;
  let imageCount = 0;
  let imageWithAlt = 0;
  const textFragments: string[] = [];

  for (const blk of project.blocks) {
    if (blk.type === 'navbar') {
      textFragments.push(blk.props.brandName, blk.props.ctaLabel);
      blk.props.links.forEach((l) => textFragments.push(l.label));
    } else if (blk.type === 'hero') {
      if (blk.props.headline.trim()) h1Count++;
      textFragments.push(
        blk.props.kicker,
        blk.props.headline,
        blk.props.subtitle,
        blk.props.primaryCtaLabel,
        blk.props.secondaryCtaLabel
      );
      if (blk.props.imageUrl?.trim()) {
        imageCount++;
        if (blk.props.imageAlt?.trim()) imageWithAlt++;
      }
    } else if (blk.type === 'features') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.intro);
      blk.props.items.forEach((it) => textFragments.push(it.title, it.description));
    } else if (blk.type === 'showcase') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.body);
      blk.props.bullets.forEach((b) => textFragments.push(b));
      if (blk.props.imageUrl?.trim()) {
        imageCount++;
        if (blk.props.imageAlt?.trim()) imageWithAlt++;
      }
    } else if (blk.type === 'stats') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.heading);
      blk.props.items.forEach((it) => textFragments.push(it.value, it.label, it.context));
    } else if (blk.type === 'pricing') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.intro);
      blk.props.tiers.forEach((t) =>
        textFragments.push(t.name, t.audience, t.description, ...t.features)
      );
    } else if (blk.type === 'testimonial') {
      textFragments.push(blk.props.quote, blk.props.authorName, blk.props.company);
    } else if (blk.type === 'faq') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading);
      blk.props.items.forEach((it) => textFragments.push(it.question, it.answer));
    } else if (blk.type === 'cta') {
      if (blk.props.headline.trim()) h2Count++;
      textFragments.push(blk.props.headline, blk.props.description);
    } else if (blk.type === 'contact') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.description);
    } else if (blk.type === 'footer') {
      textFragments.push(blk.props.brandName, blk.props.summary, blk.props.copyright);
    } else if (blk.type === 'logocloud') {
      textFragments.push(blk.props.heading, blk.props.caption || '');
      blk.props.items.forEach((it) => textFragments.push(it.name, it.sector || ''));
    } else if (blk.type === 'portfolio') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.intro);
      blk.props.items.forEach((it) => {
        textFragments.push(it.title, it.category, it.client, it.metric, it.summary);
        if (it.imageUrl?.trim()) {
          imageCount++;
          if (it.imageAlt?.trim()) imageWithAlt++;
        }
      });
    } else if (blk.type === 'video') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(
        blk.props.eyebrow,
        blk.props.heading,
        blk.props.description,
        ...blk.props.highlights
      );
      if (blk.props.posterUrl?.trim()) {
        imageCount++;
        if (blk.props.posterAlt?.trim()) imageWithAlt++;
      }
    } else if (blk.type === 'team') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(blk.props.eyebrow, blk.props.heading, blk.props.intro);
      blk.props.members.forEach((m) => {
        textFragments.push(m.name, m.role, m.bio);
        if (m.imageUrl?.trim()) {
          imageCount++;
          if (m.imageAlt?.trim()) imageWithAlt++;
        }
      });
    } else if (blk.type === 'calculator') {
      if (blk.props.heading.trim()) h2Count++;
      textFragments.push(
        blk.props.eyebrow,
        blk.props.heading,
        blk.props.intro,
        blk.props.primaryInputLabel,
        blk.props.secondaryInputLabel,
        blk.props.roiHeadlineLabel
      );
    }
  }

  const wordCount = textFragments
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const hasJsonLd = Boolean(project.marketing?.enableJsonLd);
  const hasPixel = Boolean(
    project.marketing?.ga4MeasurementId?.trim() ||
      project.marketing?.googleAdsId?.trim() ||
      project.marketing?.metaPixelId?.trim() ||
      project.marketing?.linkedinPartnerId?.trim()
  );
  const hasCustomDomain = Boolean(project.seo?.customDomain?.trim());

  const checks: SeoAuditCheck[] = [];

  // 1. Title Tag (15 pts)
  if (title.length >= 25 && title.length <= 65) {
    checks.push({
      id: 'title',
      label: 'Site <title> Tag',
      status: 'pass',
      points: 15,
      maxPoints: 15,
      detail: `Optimal length (${title.length} chars; recommended 25–65).`,
      actionTarget: 'seo',
    });
  } else if (title.length > 0) {
    checks.push({
      id: 'title',
      label: 'Site <title> Tag',
      status: 'warn',
      points: 8,
      maxPoints: 15,
      detail: `${title.length} chars — aim for 25–65 chars so search headlines do not truncate.`,
      actionTarget: 'seo',
    });
  } else {
    checks.push({
      id: 'title',
      label: 'Site <title> Tag',
      status: 'fail',
      points: 0,
      maxPoints: 15,
      detail: 'Missing site title in SEO settings.',
      actionTarget: 'seo',
    });
  }

  // 2. Meta Description (15 pts)
  if (description.length >= 70 && description.length <= 160) {
    checks.push({
      id: 'description',
      label: 'Meta Description',
      status: 'pass',
      points: 15,
      maxPoints: 15,
      detail: `Optimal length (${description.length} chars; recommended 70–160).`,
      actionTarget: 'seo',
    });
  } else if (description.length > 0) {
    checks.push({
      id: 'description',
      label: 'Meta Description',
      status: 'warn',
      points: 8,
      maxPoints: 15,
      detail: `${description.length} chars — refine to 70–160 chars for stronger search snippets.`,
      actionTarget: 'seo',
    });
  } else {
    checks.push({
      id: 'description',
      label: 'Meta Description',
      status: 'fail',
      points: 0,
      maxPoints: 15,
      detail: 'No meta description set.',
      actionTarget: 'seo',
    });
  }

  // 3. Canonical URL (10 pts)
  checks.push({
    id: 'canonical',
    label: 'Canonical URL',
    status: hasAbsoluteCanonical ? 'pass' : 'fail',
    points: hasAbsoluteCanonical ? 10 : 0,
    maxPoints: 10,
    detail: hasAbsoluteCanonical
      ? `Canonical pointing to ${canonical}`
      : 'Set a canonical URL or custom domain in the SEO Inspector to avoid duplicate indexing.',
    actionTarget: 'seo',
  });

  // 4. OpenGraph & Twitter Meta (10 pts)
  const ogPoints = title && description ? 10 : title || description ? 5 : 0;
  checks.push({
    id: 'social_meta',
    label: 'OpenGraph & Social Cards',
    status: ogPoints === 10 ? 'pass' : ogPoints > 0 ? 'warn' : 'fail',
    points: ogPoints,
    maxPoints: 10,
    detail:
      ogPoints === 10
        ? 'Emits og:title, og:description, og:type, and summary_large_image Twitter card.'
        : 'Populate both SEO title and description to complete social share previews.',
    actionTarget: 'seo',
  });

  // 5. Heading Hierarchy (15 pts)
  if (h1Count === 1 && h2Count >= 1) {
    checks.push({
      id: 'headings',
      label: 'Semantic Heading Hierarchy',
      status: 'pass',
      points: 15,
      maxPoints: 15,
      detail: `1 primary <h1> hero heading and ${h2Count} section <h2> headings.`,
      actionTarget: 'builder',
    });
  } else if (h1Count >= 1) {
    checks.push({
      id: 'headings',
      label: 'Semantic Heading Hierarchy',
      status: 'warn',
      points: 9,
      maxPoints: 15,
      detail: `${h1Count} <h1> found and ${h2Count} <h2> section headings (ideal: 1 <h1> + multiple <h2>).`,
      actionTarget: 'builder',
    });
  } else {
    checks.push({
      id: 'headings',
      label: 'Semantic Heading Hierarchy',
      status: 'fail',
      points: 0,
      maxPoints: 15,
      detail: 'Add a Hero section with a clear headline to establish a primary <h1>.',
      actionTarget: 'builder',
    });
  }

  // 6. Image Alt Coverage (10 pts)
  const altPoints =
    imageCount === 0 || imageWithAlt === imageCount
      ? 10
      : imageWithAlt > 0
        ? 5
        : 0;
  checks.push({
    id: 'images',
    label: 'Image Alt Attributes',
    status: altPoints === 10 ? 'pass' : altPoints > 0 ? 'warn' : 'fail',
    points: altPoints,
    maxPoints: 10,
    detail:
      imageCount === 0
        ? 'No images missing alt text.'
        : `${imageWithAlt} of ${imageCount} images include descriptive alt text.`,
    actionTarget: 'builder',
  });

  // 7. Schema.org Structured Data (10 pts)
  checks.push({
    id: 'jsonld',
    label: 'Schema.org JSON-LD',
    status: hasJsonLd ? 'pass' : 'fail',
    points: hasJsonLd ? 10 : 0,
    maxPoints: 10,
    detail: hasJsonLd
      ? 'WebSite structured data JSON-LD enabled for search engines.'
      : 'Enable Schema.org JSON-LD in Marketing -> Pixels, Promo & UTMs.',
    actionTarget: 'marketing',
  });

  // 8. Language & Mobile Viewport (5 pts)
  checks.push({
    id: 'lang_viewport',
    label: 'Language & Mobile Viewport',
    status: lang ? 'pass' : 'warn',
    points: lang ? 5 : 2,
    maxPoints: 5,
    detail: `Document lang="${lang || 'en'}" with responsive viewport meta enabled.`,
    actionTarget: 'seo',
  });

  // 9. Analytics & Custom Domain (10 pts)
  const trackingPts = (hasPixel ? 5 : 0) + (hasCustomDomain ? 5 : 0);
  checks.push({
    id: 'telemetry_domain',
    label: 'Tracking & Domain Readiness',
    status: trackingPts === 10 ? 'pass' : trackingPts > 0 ? 'warn' : 'fail',
    points: trackingPts,
    maxPoints: 10,
    detail:
      trackingPts === 10
        ? 'Analytics pixel & custom domain configured.'
        : hasPixel
          ? 'Tracking tags ready; connect a custom domain for branded authority.'
          : hasCustomDomain
            ? 'Custom domain set; add GA4 or ad pixel in Marketing.'
            : 'Add GA4/pixel tags in Marketing and connect a custom domain in Deploy.',
    actionTarget: hasPixel ? 'deploy' : 'marketing',
  });

  const score = checks.reduce((sum, c) => sum + c.points, 0);

  return {
    score,
    wordCount,
    headingCount: h1Count + h2Count,
    imageCount,
    checks,
  };
}
