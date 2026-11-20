import { createBlockId, createDefaultBlock } from '../data/presets';
import {
  FooterBlock,
  NavbarBlock,
  SiteBlock,
  SitePage,
  SiteProject,
} from '../types/builder';

export type PageStarterPreset =
  | 'about'
  | 'services'
  | 'pricing'
  | 'contact'
  | 'work'
  | 'blank';

export function createPageId(): string {
  return `page_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizePagePath(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/');

  if (!cleaned || cleaned === 'index' || cleaned === 'home') {
    return '/';
  }
  const singleSegment = cleaned.split('/').filter(Boolean).slice(0, 2).join('/');
  return singleSegment ? `/${singleSegment}` : '/';
}

export function formatPageFileName(pagePath: string): string {
  const norm = normalizePagePath(pagePath);
  if (norm === '/') return 'index.html';
  return `${norm.replace(/^\//, '').replace(/\//g, '-')}.html`;
}

export function ensureProjectPages(project: SiteProject): {
  pages: SitePage[];
  activePage: SitePage;
  activePageId: string;
} {
  const rawPages = Array.isArray(project.pages) ? project.pages : [];
  if (rawPages.length === 0) {
    const homePage: SitePage = {
      id: project.activePageId || 'page_home',
      name: 'Home',
      path: '/',
      blocks: project.blocks || [],
      seo: project.seo ? { ...project.seo } : undefined,
    };
    return {
      pages: [homePage],
      activePage: homePage,
      activePageId: homePage.id,
    };
  }

  const pages = rawPages.map((p, idx) => ({
    ...p,
    id: p.id || (idx === 0 ? 'page_home' : createPageId()),
    name: p.name?.trim() || (idx === 0 ? 'Home' : `Page ${idx + 1}`),
    path: idx === 0 && p.path === '/' ? '/' : normalizePagePath(p.path || p.name),
    blocks: Array.isArray(p.blocks) ? p.blocks : [],
  }));

  const matched =
    pages.find((p) => p.id === project.activePageId) ||
    pages.find((p) => p.path === '/') ||
    pages[0];

  return {
    pages,
    activePage: matched,
    activePageId: matched.id,
  };
}

export function syncActivePageIntoProject(
  project: SiteProject,
  updatedBlocks: SiteBlock[]
): SiteProject {
  const { pages, activePageId } = ensureProjectPages(project);
  const nextPages = pages.map((p) =>
    p.id === activePageId ? { ...p, blocks: updatedBlocks } : p
  );
  return {
    ...project,
    blocks: updatedBlocks,
    pages: nextPages,
    activePageId,
  };
}

export function switchProjectActivePage(
  project: SiteProject,
  targetPageId: string
): SiteProject {
  const { pages, activePageId } = ensureProjectPages(project);
  const syncedPages = pages.map((p) =>
    p.id === activePageId ? { ...p, blocks: project.blocks } : p
  );
  const target = syncedPages.find((p) => p.id === targetPageId) || syncedPages[0];
  return {
    ...project,
    pages: syncedPages,
    activePageId: target.id,
    blocks: target.blocks,
  };
}

export function syncNavigationLinksAcrossPages(pages: SitePage[]): SitePage[] {
  const navLinks = pages.slice(0, 6).map((p) => ({
    label: p.name,
    href: p.path,
  }));
  const contactPage = pages.find((p) => p.path === '/contact');
  const ctaHref = contactPage ? contactPage.path : '#contact';

  return pages.map((page) => {
    const updatedBlocks = page.blocks.map((blk) => {
      if (blk.type === 'navbar') {
        const nav = blk as NavbarBlock;
        return {
          ...nav,
          props: {
            ...nav.props,
            links: navLinks,
            ctaHref: nav.props.ctaHref === '#contact' || nav.props.ctaHref === '/contact' ? ctaHref : nav.props.ctaHref,
          },
        };
      }
      if (blk.type === 'footer') {
        const footer = blk as FooterBlock;
        const firstCol = footer.props.columns[0];
        const remainingCols = footer.props.columns.slice(1);
        const updatedFirstCol = {
          heading: firstCol?.heading || 'Pages',
          links: pages.map((p) => ({ label: p.name, href: p.path })),
        };
        return {
          ...footer,
          props: {
            ...footer.props,
            columns: [updatedFirstCol, ...remainingCols],
          },
        };
      }
      return blk;
    });
    return {
      ...page,
      blocks: updatedBlocks,
    };
  });
}

function cloneShellBlock<T extends SiteBlock>(block: T | undefined, fallbackType: 'navbar' | 'footer'): SiteBlock {
  if (!block) {
    return createDefaultBlock(fallbackType);
  }
  const copy = structuredClone(block);
  copy.id = createBlockId(fallbackType);
  return copy;
}

export function createStarterPageBlocks(
  preset: PageStarterPreset,
  project: SiteProject,
  pageName: string
): SiteBlock[] {
  const { pages } = ensureProjectPages(project);
  const homePage = pages.find((p) => p.path === '/') || pages[0];
  const existingNavbar = homePage?.blocks.find((b) => b.type === 'navbar') as
    | NavbarBlock
    | undefined;
  const existingFooter = homePage?.blocks.find((b) => b.type === 'footer') as
    | FooterBlock
    | undefined;

  const brandName = existingNavbar?.props.brandName || project.name || 'Atelier Studio';
  const navBlock = cloneShellBlock(existingNavbar, 'navbar');
  const footerBlock = cloneShellBlock(existingFooter, 'footer');

  const blocks: SiteBlock[] = [navBlock];

  if (preset === 'about') {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'centered';
      hero.props.kicker = `About ${brandName}`;
      hero.props.headline = `Built for precision, longevity, and measurable craft.`;
      hero.props.subtitle = `${project.description || `${brandName} partners with ambitious teams to deliver focused digital and physical outcomes.`}`;
      hero.props.primaryCtaLabel = 'Meet Our Team';
      hero.props.primaryCtaHref = '#approach';
      hero.props.secondaryCtaLabel = 'Get in Touch';
      hero.props.secondaryCtaHref = pages.some((p) => p.path === '/contact') ? '/contact' : '#contact';
    }
    const stats = createDefaultBlock('stats');
    const showcase = createDefaultBlock('showcase');
    if (showcase.type === 'showcase') {
      showcase.backgroundVariant = 'surface';
      showcase.props.eyebrow = 'Studio Philosophy';
      showcase.props.heading = 'Design discipline paired with transparent execution';
    }
    const testimonial = createDefaultBlock('testimonial');
    blocks.push(hero, stats, showcase, testimonial);
  } else if (preset === 'services') {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'split';
      hero.props.kicker = 'Capabilities & Services';
      hero.props.headline = `Focused ${pageName.toLowerCase()} engineered for scale.`;
      hero.props.subtitle = `Structured deliverables, clear timelines, and senior execution from discovery through launch.`;
      hero.props.primaryCtaLabel = 'Explore Capabilities';
      hero.props.primaryCtaHref = '#approach';
      hero.props.secondaryCtaLabel = 'Request a Proposal';
      hero.props.secondaryCtaHref = pages.some((p) => p.path === '/contact') ? '/contact' : '#contact';
    }
    const features = createDefaultBlock('features');
    features.backgroundVariant = 'surface';
    const faq = createDefaultBlock('faq');
    const cta = createDefaultBlock('cta');
    cta.backgroundVariant = 'contrast';
    blocks.push(hero, features, faq, cta);
  } else if (preset === 'pricing') {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'centered';
      hero.props.kicker = 'Transparent Engagement';
      hero.props.headline = 'Clear scope and predictable pricing for every stage.';
      hero.props.subtitle = 'Select the plan built for your team size, launch schedule, and support requirements.';
      hero.props.primaryCtaLabel = 'Compare Plans';
      hero.props.primaryCtaHref = '#pricing';
      hero.props.secondaryCtaLabel = '';
      hero.props.imageUrl = '';
    }
    const pricing = createDefaultBlock('pricing');
    pricing.backgroundVariant = 'surface';
    const faq = createDefaultBlock('faq');
    blocks.push(hero, pricing, faq);
  } else if (preset === 'contact') {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'centered';
      hero.props.kicker = `Contact ${brandName}`;
      hero.props.headline = 'Start a conversation with our team.';
      hero.props.subtitle = 'Share your timeline, goals, or technical brief and we will respond within one business day.';
      hero.props.primaryCtaLabel = 'Send Project Brief';
      hero.props.primaryCtaHref = '#contact';
      hero.props.secondaryCtaLabel = '';
      hero.props.imageUrl = '';
    }
    const contact = createDefaultBlock('contact');
    contact.backgroundVariant = 'surface';
    const faq = createDefaultBlock('faq');
    blocks.push(hero, contact, faq);
  } else if (preset === 'work') {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'split';
      hero.props.kicker = 'Selected Work';
      hero.props.headline = 'Case studies & measurable client outcomes.';
      hero.props.subtitle = `Explore how ${brandName} transforms complex challenges into high-performing results.`;
    }
    const showcase1 = createDefaultBlock('showcase');
    showcase1.backgroundVariant = 'surface';
    const showcase2 = createDefaultBlock('showcase');
    if (showcase2.type === 'showcase') {
      showcase2.props.imagePosition = 'left';
    }
    const stats = createDefaultBlock('stats');
    blocks.push(hero, showcase1, showcase2, stats);
  } else {
    const hero = createDefaultBlock('hero');
    if (hero.type === 'hero') {
      hero.props.layout = 'centered';
      hero.props.kicker = brandName;
      hero.props.headline = pageName;
      hero.props.subtitle = `Add sections below to build out your ${pageName} page.`;
      hero.props.imageUrl = '';
    }
    blocks.push(hero);
  }

  blocks.push(footerBlock);
  return blocks;
}
