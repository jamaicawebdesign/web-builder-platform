import { BlockType, SiteBlock, SiteProject, SiteTheme } from '../types/builder';

export interface StudioImageAsset {
  id: string;
  label: string;
  category: string;
  url: string;
  alt: string;
}

export const STUDIO_IMAGES: StudioImageAsset[] = [
  {
    id: 'studio-loft',
    label: 'Architectural Studio Loft',
    category: 'Architecture',
    url: '/src/assets/images/hero_studio_architecture_1794976771485.jpg',
    alt: 'Sunlit concrete and oak architecture studio workspace',
  },
  {
    id: 'hardware-desk',
    label: 'Anodized Audio Hardware',
    category: 'Product',
    url: '/src/assets/images/product_hardware_craft_1794976773858.jpg',
    alt: 'Precision machined aluminum audio interface and studio headphones on dark slate',
  },
  {
    id: 'atelier-team',
    label: 'Design Team Workshop',
    category: 'Editorial',
    url: '/src/assets/images/team_atelier_portrait_1794976774786.jpg',
    alt: 'Industrial designers reviewing material samples around a birch worktable',
  },
  {
    id: 'botanical-pavilion',
    label: 'Glass Botanical Pavilion',
    category: 'Spaces',
    url: '/src/assets/images/abstract_botanical_glass_1794976774281.jpg',
    alt: 'Minimalist glass conservatory with limestone floor and olive trees',
  },
  {
    id: 'roastery-bar',
    label: 'Specialty Coffee Pour-Over Bar',
    category: 'Hospitality',
    url: '/src/assets/images/hero_roastery_coffee_1795062577796.jpg',
    alt: 'Minimalist specialty coffee roastery and oak pour-over bar in morning light',
  },
  {
    id: 'saas-telemetry',
    label: 'Fleet Telemetry Operations',
    category: 'SaaS',
    url: '/src/assets/images/hero_saas_telemetry_1795062578275.jpg',
    alt: 'Cold-chain logistics telemetry command center with dark matte displays',
  },
  {
    id: 'wellness-sanctuary',
    label: 'Longevity Clinic Sanctuary',
    category: 'Wellness',
    url: '/src/assets/images/hero_wellness_sanctuary_1795062577433.jpg',
    alt: 'Travertine limestone and cedar wood preventive wellness clinic lounge',
  },
  {
    id: 'fellowship-workshop',
    label: 'Design & AI Fellowship Studio',
    category: 'Education',
    url: '/src/assets/images/hero_fellowship_workshop_1795062577617.jpg',
    alt: 'Designers and engineers collaborating around birch studio critique tables',
  },
  {
    id: 'portrait-architect',
    label: 'Partner Portrait — Linnea',
    category: 'Portraits',
    url: '/src/assets/images/team_lead_architect_1795148542554.jpg',
    alt: 'Managing partner Linnea Halvorsen in sunlit limestone architecture studio',
  },
  {
    id: 'portrait-engineering',
    label: 'Director Portrait — Henrik',
    category: 'Portraits',
    url: '/src/assets/images/team_engineering_director_1795148543928.jpg',
    alt: 'Structural director Kenji Takahashi in studio daylight',
  },
  {
    id: 'portrait-strategy',
    label: 'Design Lead Portrait — Mei',
    category: 'Portraits',
    url: '/src/assets/images/team_strategy_partner_1795148543761.jpg',
    alt: 'Principal design strategist Mei Chen at wooden studio worktable',
  },
];

export const DISPLAY_FONTS = [
  'Plus Jakarta Sans',
  'Outfit',
  'Bricolage Grotesque',
  'Manrope',
  'Playfair Display',
  'Cormorant Garamond',
];

export const BODY_FONTS = [
  'DM Sans',
  'Plus Jakarta Sans',
  'Manrope',
  'Lora',
];

export interface BrandPalettePreset {
  id: string;
  name: string;
  description: string;
  theme: Pick<
    SiteTheme,
    | 'primaryColor'
    | 'accentTextColor'
    | 'backgroundColor'
    | 'surfaceColor'
    | 'contrastBgColor'
    | 'textColor'
    | 'mutedTextColor'
    | 'borderColor'
  >;
}

export const BRAND_PALETTE_PRESETS: BrandPalettePreset[] = [
  {
    id: 'atelier-cobalt',
    name: 'Atelier Cobalt',
    description: 'Warm bone surface with ultramarine cobalt action',
    theme: {
      primaryColor: '#1D4ED8',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F2EC',
      contrastBgColor: '#13151A',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#DAD4C6',
    },
  },
  {
    id: 'obsidian-brass',
    name: 'Obsidian & Brass',
    description: 'Deep espresso contrast with warm amber brass',
    theme: {
      primaryColor: '#B45309',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F7F4EE',
      contrastBgColor: '#181411',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E5DDD0',
    },
  },
  {
    id: 'forest-atelier',
    name: 'Forest Atelier',
    description: 'Limestone paper with botanical pine accent',
    theme: {
      primaryColor: '#166534',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FAF9F5',
      surfaceColor: '#F0EFE8',
      contrastBgColor: '#14221B',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#D6D9CE',
    },
  },
  {
    id: 'terracotta-studio',
    name: 'Terracotta Studio',
    description: 'Gallery ivory with burnt sienna focal color',
    theme: {
      primaryColor: '#C2410C',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F9F3EE',
      contrastBgColor: '#1E1614',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E8DBD2',
    },
  },
];

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: '#1D4ED8',
  accentTextColor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F4F6F8',
  contrastBgColor: '#0F172A',
  textColor: '#000000',
  mutedTextColor: '#000000',
  borderColor: '#E2E8F0',
  displayFont: 'Plus Jakarta Sans',
  bodyFont: 'DM Sans',
  radius: '6px',
  spacing: 'balanced',
  motion: 'editorial',
};

export function createBlockId(prefix = 'blk'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'atelier-site'
  );
}

export interface PaletteElementMeta {
  type: BlockType;
  title: string;
  summary: string;
  category: 'Structure' | 'Content' | 'Conversion';
}

export const ELEMENT_PALETTE: PaletteElementMeta[] = [
  {
    type: 'navbar',
    title: 'Top Navigation',
    summary: 'Brand mark, 4 links, and single primary button',
    category: 'Structure',
  },
  {
    type: 'hero',
    title: 'Hero Section',
    summary: 'Split, centered, or full-bleed editorial header',
    category: 'Structure',
  },
  {
    type: 'stats',
    title: 'Metric Strip',
    summary: 'Tabular 3–4 column key figures row',
    category: 'Content',
  },
  {
    type: 'logocloud',
    title: 'Logo Cloud / Trust Bar',
    summary: 'Monochrome partner & client trust strip',
    category: 'Content',
  },
  {
    type: 'features',
    title: 'Feature Grid',
    summary: 'Structured 2 or 3 column capability cards',
    category: 'Content',
  },
  {
    type: 'showcase',
    title: 'Media Showcase',
    summary: 'Split photography paired with narrative copy',
    category: 'Content',
  },
  {
    type: 'portfolio',
    title: 'Portfolio / Case Studies',
    summary: 'Filterable project cards with interactive detail modal',
    category: 'Content',
  },
  {
    type: 'video',
    title: 'Video / Demo Showcase',
    summary: 'YouTube, Vimeo, or MP4 embed with custom poster frame',
    category: 'Content',
  },
  {
    type: 'team',
    title: 'Team / Leadership Grid',
    summary: 'Editorial portraits, titles, bios & social links',
    category: 'Content',
  },
  {
    type: 'pricing',
    title: 'Pricing Table',
    summary: 'Audience-named tiers with clear feature limits',
    category: 'Conversion',
  },
  {
    type: 'calculator',
    title: 'ROI / Pricing Calculator',
    summary: 'Interactive sliders for team size & monthly savings',
    category: 'Conversion',
  },
  {
    type: 'testimonial',
    title: 'Editorial Quote',
    summary: 'Attributed client quote with measurable outcome',
    category: 'Content',
  },
  {
    type: 'faq',
    title: 'FAQ Accordion',
    summary: 'Native accessible expandable questions list',
    category: 'Content',
  },
  {
    type: 'cta',
    title: 'Conversion Banner',
    summary: 'Focused headline and direct action prompt',
    category: 'Conversion',
  },
  {
    type: 'contact',
    title: 'Contact & Inquiry',
    summary: 'Studio details alongside an interactive inquiry form',
    category: 'Conversion',
  },
  {
    type: 'footer',
    title: 'Site Footer',
    summary: 'Multi-column links, brand summary, and copyright',
    category: 'Structure',
  },
];

export function createDefaultBlock(type: BlockType): SiteBlock {
  const id = createBlockId(type);
  switch (type) {
    case 'navbar':
      return {
        id,
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Nordic Practice',
          links: [
            { label: 'Work', href: '#work' },
            { label: 'Approach', href: '#approach' },
            { label: 'Metrics', href: '#metrics' },
            { label: 'Contact', href: '#contact' },
          ],
          ctaLabel: 'Book Consultation',
          ctaHref: '#contact',
        },
      };
    case 'hero':
      return {
        id,
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'split',
          kicker: 'Copenhagen & Zurich · Est. 2018',
          headline: 'Timber and concrete architecture shaped for natural daylight.',
          subtitle:
            'We design civic buildings, workplace studios, and enduring timber residences built to perform across generations.',
          primaryCtaLabel: 'Explore Selected Works',
          primaryCtaHref: '#work',
          secondaryCtaLabel: 'Request Studio Dossier',
          secondaryCtaHref: '#contact',
          imageUrl: STUDIO_IMAGES[0].url,
          imageAlt: STUDIO_IMAGES[0].alt,
        },
      };
    case 'stats':
      return {
        id,
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Practice Benchmarks',
          items: [
            { value: '42%', label: 'Lower Embodied Carbon', context: 'Mass-timber hybrid structures' },
            { value: '18', label: 'Completed Commissions', context: 'Across Northern Europe since 2018' },
            { value: '99.4%', label: 'Schedule Adherence', context: 'Delivered on fixed milestones' },
            { value: '11.2 yr', label: 'Average Energy Payback', context: 'Verified post-occupancy telemetry' },
          ],
        },
      };
    case 'features':
      return {
        id,
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Core Disciplines',
          heading: 'Integrated design from feasibility to site handover.',
          intro:
            'Every commission moves through three focused phases led by our structural architects and daylighting engineers.',
          columns: 3,
          items: [
            {
              title: '01. Spatial Feasibility',
              description:
                'Solar orientation modeling, zoning audits, and material lifecycle budgets before schematic drawings begin.',
              meta: 'Weeks 1–4',
            },
            {
              title: '02. Structural Detailing',
              description:
                'Precision cross-laminated timber joinery and low-carbon concrete cores engineered for rapid dry assembly.',
              meta: 'Weeks 5–14',
            },
            {
              title: '03. Site Stewardship',
              description:
                'On-site fabrication tolerances, acoustic commissioning, and post-occupancy thermal calibration.',
              meta: 'Construction',
            },
          ],
        },
      };
    case 'showcase':
      return {
        id,
        type: 'showcase',
        label: 'Media Showcase',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Selected Commission',
          heading: 'Harbor Foundry Atelier',
          body: 'Converting a 1920s maritime warehouse into a 4,200 sqm daylight studio using reclaimed Baltic oak and cast acoustic plaster.',
          bullets: [
            'Triple-glazed steel clerestory windows preserving industrial spans',
            'Passive geothermal radiant floor slabs cutting winter heating loads by 54%',
            'Modular acoustic partitions fabricated off-site with zero wet trades',
          ],
          ctaLabel: 'View Technical Brief',
          ctaHref: '#contact',
          imageUrl: STUDIO_IMAGES[2].url,
          imageAlt: STUDIO_IMAGES[2].alt,
          imagePosition: 'right',
        },
      };
    case 'pricing':
      return {
        id,
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Engagement Models',
          heading: 'Transparent scope tiers for private and civic builds.',
          intro: 'Fixed-fee architectural stages with clear deliverables at each milestone.',
          tiers: [
            {
              name: 'Feasibility Study',
              audience: 'For early-stage site evaluation',
              price: '$8,500',
              cadence: 'fixed scope · 4 weeks',
              description: 'Validate massing, zoning envelope, and preliminary structural budget.',
              features: [
                'Measured site survey & solar path study',
                'Three schematic massing options',
                'Class-C construction cost estimate',
              ],
              ctaLabel: 'Commission Study',
              highlighted: false,
            },
            {
              name: 'Full Architectural Scope',
              audience: 'For active new builds & adaptive reuse',
              price: '$34,000',
              cadence: 'per stage · RIBA 1–5',
              description: 'End-to-end design, permitting, structural coordination, and tender package.',
              features: [
                'BIM Level-300 structural & MEP model',
                'Full municipal permit documentation',
                'Custom joinery & material specification book',
                'Bi-weekly on-site supervision',
              ],
              ctaLabel: 'Start Commission',
              highlighted: true,
            },
            {
              name: 'Advisory Retainer',
              audience: 'For multi-site development teams',
              price: '$4,200',
              cadence: 'per month',
              description: 'Ongoing design direction, contractor reviews, and carbon audits.',
              features: [
                'Weekly studio critique & drawing review',
                'Vendor & fabricator pre-qualification',
                'Quarterly embodied-carbon reporting',
              ],
              ctaLabel: 'Request Retainer',
              highlighted: false,
            },
          ],
        },
      };
    case 'testimonial':
      return {
        id,
        type: 'testimonial',
        label: 'Editorial Quote',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          quote:
            'Nordic Practice delivered our headquarters three weeks ahead of tender schedule while cutting structural steel tonnage by 38%.',
          authorName: 'Henrik Lindholm',
          authorRole: 'Director of Facilities',
          company: 'Krona Maritime Group',
          outcome: '38% reduction in structural steel · 4,200 sqm adaptive reuse',
        },
      };
    case 'faq':
      return {
        id,
        type: 'faq',
        label: 'FAQ Accordion',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Questions',
          heading: 'Practical answers before commissioning a study.',
          items: [
            {
              question: 'How early should we engage the studio before acquiring a plot?',
              answer:
                'Ideally during due diligence. A two-week feasibility audit uncovers setback constraints, soil bearing realities, and daylight rights before capital is locked.',
            },
            {
              question: 'Do you work with external general contractors or turn-key builders?',
              answer:
                'We tender clean, contractor-agnostic drawing packages and maintain independent site observation so material quality never gets value-engineered away.',
            },
            {
              question: 'What regions do you accept commissions in?',
              answer:
                'Our architects are licensed across Scandinavia, Switzerland, Germany, and select North American timber jurisdictions.',
            },
          ],
        },
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        label: 'Conversion Banner',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          headline: 'Planning a timber or adaptive-reuse build in 2027?',
          description:
            'Share your site parcel and timeline. Our senior partners review new commission briefs every Tuesday.',
          primaryCtaLabel: 'Schedule Intro Call',
          primaryCtaHref: '#contact',
          secondaryCtaLabel: 'Download Monograph',
          secondaryCtaHref: '#work',
        },
      };
    case 'contact':
      return {
        id,
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'New Commissions',
          heading: 'Start a conversation with our studio partners.',
          description:
            'Include your project location, approximate floor area, and target timeline for a tailored scope response within two business days.',
          email: 'studio@nordicpractice.example',
          location: 'Refshalevej 163A, 1432 Copenhagen',
          submitLabel: 'Send Project Brief',
        },
      };
    case 'logocloud':
      return {
        id,
        type: 'logocloud',
        label: 'Logo Cloud',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Trusted by architecture, product, and logistics teams worldwide',
          caption: 'Verified multi-year enterprise deployments across 14 countries',
          layout: 'row',
          items: [
            { name: 'Krona Maritime', sector: 'Freight' },
            { name: 'Vestergaard Timber', sector: 'Construction' },
            { name: 'NordGrid Energy', sector: 'Infrastructure' },
            { name: 'Helvetia Labs', sector: 'Biotech' },
            { name: 'Solberg Mobility', sector: 'Transit' },
            { name: 'Aurelia Hospitality', sector: 'Venues' },
          ],
        },
      };
    case 'portfolio':
      return {
        id,
        type: 'portfolio',
        label: 'Portfolio Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Selected Case Studies',
          heading: 'Measured client outcomes across civic and commercial work.',
          intro:
            'Filter projects by discipline or open any case study to inspect scope, constraints, and verified post-launch metrics.',
          columns: 3,
          items: [
            {
              title: 'Harbor Foundry Headquarters',
              category: 'Adaptive Reuse',
              client: 'Krona Maritime',
              metric: '38% Less Steel · 4,200 sqm',
              summary:
                'Transformed a 1920s brick shipping shed into a daylight timber headquarters three weeks ahead of tender schedule.',
              challenge:
                'Existing uninsulated warehouse masonry suffered high winter thermal loss and limited floorplate daylight penetration.',
              outcome:
                'Inserted freestanding CLT mezzanine volumes with triple-glazed clerestories, cutting annual heating energy by 54%.',
              imageUrl: STUDIO_IMAGES[0].url,
              imageAlt: STUDIO_IMAGES[0].alt,
              linkLabel: 'Request Similar Scope',
              linkHref: '#contact',
            },
            {
              title: 'Anodized Reference Monitor Lab',
              category: 'Product Systems',
              client: 'Solberg Acoustics',
              metric: '+142% Pre-Order Conversion',
              summary:
                'Industrial enclosure architecture and retail launch experience for a CNC-milled studio reference interface.',
              challenge:
                'Prospective engineers struggled to compare acoustic tolerances and I/O specifications on technical datasheets alone.',
              outcome:
                'Paired interactive cutaway demonstrations with transparent calibration reports, doubling direct studio orders in 60 days.',
              imageUrl: STUDIO_IMAGES[1].url,
              imageAlt: STUDIO_IMAGES[1].alt,
              linkLabel: 'View Case Brief',
              linkHref: '#contact',
            },
            {
              title: 'Conservatory Cultural Pavilion',
              category: 'Civic Venues',
              client: 'Aurelia Foundation',
              metric: '94% Year-Round Bookings',
              summary:
                'Low-iron glass and travertine assembly engineered for acoustic intimacy across 240-seat seasonal recitals.',
              challenge:
                'All-glass pavilions traditionally suffer severe reverberation and summer solar heat gain.',
              outcome:
                'Integrated micro-perforated limestone baffles and fritted roof glazing for natural ventilation with zero mechanical hum.',
              imageUrl: STUDIO_IMAGES[3].url,
              imageAlt: STUDIO_IMAGES[3].alt,
              linkLabel: 'Download Dossier',
              linkHref: '#contact',
            },
          ],
        },
      };
    case 'video':
      return {
        id,
        type: 'video',
        label: 'Video Demo',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          eyebrow: 'Interactive Walkthrough',
          heading: 'See how our workflow takes a brief from schematic to handover.',
          description:
            'Watch a concise two-minute studio walkthrough covering daylight simulation, mass-timber joinery tolerances, and client cost dashboards.',
          videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
          posterUrl: STUDIO_IMAGES[5].url,
          posterAlt: 'Interactive studio workflow walkthrough poster frame',
          durationLabel: '2:14 Walkthrough',
          highlights: [
            'Live solar and acoustic simulation before committing capital',
            'Automated BOM cost sync across structural and fixture selections',
            'Zero-handoff collaboration between partners and contractors',
          ],
          ctaLabel: 'Book Live Demo',
          ctaHref: '#contact',
        },
      };
    case 'team':
      return {
        id,
        type: 'team',
        label: 'Leadership Team',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Studio Leadership',
          heading: 'Principals leading every engagement from brief to delivery.',
          intro:
            'Clients work directly with senior architects, structural engineers, and product strategists—never handed off to junior account tiers.',
          columns: 3,
          members: [
            {
              name: 'Linnea Halvorsen',
              role: 'Managing Partner · Architecture',
              bio: 'Fifteen years leading civic timber projects across Copenhagen and Zurich with a focus on adaptive reuse.',
              imageUrl: '/src/assets/images/team_lead_architect_1795148542554.jpg',
              imageAlt: 'Portrait of Managing Partner Linnea Halvorsen',
              linkedinUrl: 'https://linkedin.com',
              xUrl: 'https://x.com',
              websiteUrl: 'https://example.com',
            },
            {
              name: 'Kenji Takahashi',
              role: 'Director · Structural Engineering',
              bio: 'Specialist in hybrid steel-timber spans, acoustic commissioning, and low-carbon modular assembly.',
              imageUrl: '/src/assets/images/team_engineering_director_1795148543928.jpg',
              imageAlt: 'Portrait of Structural Engineering Director Kenji Takahashi',
              linkedinUrl: 'https://linkedin.com',
              xUrl: 'https://x.com',
            },
            {
              name: 'Mei Chen',
              role: 'Principal · Strategy & Research',
              bio: 'Leads post-occupancy spatial telemetry, workplace feasibility studies, and capital planning benchmarks.',
              imageUrl: '/src/assets/images/team_strategy_partner_1795148543761.jpg',
              imageAlt: 'Portrait of Principal Strategist Mei Chen',
              linkedinUrl: 'https://linkedin.com',
              websiteUrl: 'https://example.com',
            },
          ],
        },
      };
    case 'calculator':
      return {
        id,
        type: 'calculator',
        label: 'ROI Calculator',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'ROI & Scope Estimator',
          heading: 'Calculate your monthly savings and payback timeline.',
          intro:
            'Adjust team seats and weekly workflow hours saved to model net financial impact before starting a rollout.',
          currencySymbol: '$',
          primaryInputLabel: 'Active Team Seats',
          primaryMin: 5,
          primaryMax: 250,
          primaryStep: 5,
          primaryDefault: 25,
          primaryUnitLabel: 'seats',
          secondaryInputLabel: 'Hours Saved per Seat / Month',
          secondaryMin: 2,
          secondaryMax: 30,
          secondaryStep: 1,
          secondaryDefault: 8,
          secondaryUnitLabel: 'hrs/mo',
          hourlyRate: 75,
          monthlyPlatformCostPerPrimary: 28,
          baseMonthlyFee: 199,
          roiHeadlineLabel: 'Estimated Net Monthly Value',
          ctaLabel: 'Lock In Custom Quote',
          ctaHref: '#contact',
        },
      };
    case 'footer':
      return {
        id,
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Nordic Practice',
          summary:
            'Architectural design and low-carbon timber engineering studio based in Copenhagen and Zurich.',
          columns: [
            {
              heading: 'Practice',
              links: [
                { label: 'Selected Works', href: '#work' },
                { label: 'Disciplines', href: '#approach' },
                { label: 'Benchmarks', href: '#metrics' },
              ],
            },
            {
              heading: 'Connect',
              links: [
                { label: 'Book Consultation', href: '#contact' },
                { label: 'Press Kit', href: '#contact' },
                { label: 'Sustainability Charter', href: '#metrics' },
              ],
            },
          ],
          copyright: '© 2026 Nordic Practice ApS. All rights reserved.',
        },
      };
  }
}

export const STARTER_TEMPLATES: SiteProject[] = [
  {
    id: 'tpl-nordic-arch',
    name: 'Nordic Practice — Architecture Studio',
    slug: 'nordic-practice',
    description: 'Editorial architectural studio with split daylight hero, benchmarks, showcase, and commission inquiry.',
    updatedAt: '2026-11-17T20:00:00Z',
    theme: { ...DEFAULT_THEME },
    blocks: [
      createDefaultBlock('navbar'),
      createDefaultBlock('hero'),
      createDefaultBlock('stats'),
      createDefaultBlock('features'),
      createDefaultBlock('showcase'),
      createDefaultBlock('testimonial'),
      createDefaultBlock('contact'),
      createDefaultBlock('footer'),
    ],
  },
  {
    id: 'tpl-klangwerk-audio',
    name: 'Klangwerk — Precision Audio Hardware',
    slug: 'klangwerk-audio',
    description: 'Industrial hardware product launch with high-contrast studio photography, specs, and tiered pre-order pricing.',
    updatedAt: '2026-11-17T20:00:00Z',
    theme: {
      primaryColor: '#DC2626',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F3F4F6',
      contrastBgColor: '#111827',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E5E7EB',
      displayFont: 'Outfit',
      bodyFont: 'DM Sans',
      radius: '6px',
      spacing: 'balanced',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Klangwerk',
          links: [
            { label: 'Instrument', href: '#instrument' },
            { label: 'Specs', href: '#specs' },
            { label: 'Editions', href: '#pricing' },
            { label: 'Support', href: '#faq' },
          ],
          ctaLabel: 'Reserve Unit',
          ctaHref: '#pricing',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'contrast',
        paddingY: 'spacious',
        props: {
          layout: 'split',
          kicker: 'Series 02 Reference Interface · Munich',
          headline: 'Machined aluminum acoustics with zero digital coloration.',
          subtitle:
            'A Class-A desktop DAC and balanced headphone stage milled from a single billet of 6061 aluminum for mastering engineers.',
          primaryCtaLabel: 'Configure Edition',
          primaryCtaHref: '#pricing',
          secondaryCtaLabel: 'Read Acoustic Whitepaper',
          secondaryCtaHref: '#specs',
          imageUrl: STUDIO_IMAGES[1].url,
          imageAlt: STUDIO_IMAGES[1].alt,
        },
      },
      {
        id: createBlockId('stats'),
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Measured Laboratory Specifications',
          items: [
            { value: '129 dB', label: 'Dynamic Range', context: 'A-weighted balanced XLR out' },
            { value: '0.0002%', label: 'THD+N @ 1 kHz', context: 'Full 4Vrms studio reference' },
            { value: '0.08 Ω', label: 'Output Impedance', context: 'Drives 12Ω to 600Ω transducers' },
            { value: '5 yr', label: 'Bench Warranty', context: 'Modular serviceable circuit boards' },
          ],
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Hardware Architecture',
          heading: 'Engineered for tactile studio endurance.',
          intro: 'Zero touchscreens, zero software subscriptions—just weighted detents and discrete analog stages.',
          columns: 3,
          items: [
            {
              title: '24-Step Relay Attenuator',
              description: 'Channel matching within 0.05 dB across the entire gain sweep using gold-clad signal relays.',
              meta: 'Analog Stage',
            },
            {
              title: 'CNC Billet Chassis',
              description: 'Bead-blasted aluminum enclosure acts as a passive heatsink and RF Faraday shield.',
              meta: '1.85 kg Mass',
            },
            {
              title: 'Dual-Mono Linear Supply',
              description: 'Toroidal power regulation isolates left and right analog rails from USB host noise.',
              meta: 'Zero Switcher',
            },
          ],
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Hardware Editions',
          heading: 'Direct from our Munich assembly bench.',
          intro: 'Serialized production runs calibrated and shipped with individual APx555 test plots.',
          tiers: [
            {
              name: 'Core DAC',
              audience: 'For studio monitor controllers',
              price: '$1,190',
              cadence: 'one-time · Batch 04',
              description: 'Balanced XLR and RCA line outputs with stepped relay volume control.',
              features: [
                'USB-C, AES/EBU, and Optical inputs',
                '4Vrms balanced XLR output',
                'Individual calibration certificate',
              ],
              ctaLabel: 'Order Core DAC',
              highlighted: false,
            },
            {
              name: 'Reference Stage',
              audience: 'For mastering & planar headphones',
              price: '$1,690',
              cadence: 'one-time · Batch 04',
              description: 'Adds discrete Class-A 4.4mm balanced and 6.3mm headphone amplification.',
              features: [
                'Everything in Core DAC',
                '3.8W into 32Ω Class-A output stage',
                'Three selectable hardware gain curves',
                'Machined desktop remote puck included',
              ],
              ctaLabel: 'Reserve Reference',
              highlighted: true,
            },
          ],
        },
      },
      {
        id: createBlockId('faq'),
        type: 'faq',
        label: 'FAQ Accordion',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Technical Questions',
          heading: 'Integration & shipping details.',
          items: [
            {
              question: 'Does Series 02 require proprietary macOS or Windows drivers?',
              answer: 'No. It operates natively over USB Audio Class 2.0 on macOS, Linux, and Windows 11 up to 384kHz PCM and DSD256.',
            },
            {
              question: 'Are replacement potentiometers and switches user-serviceable?',
              answer: 'Yes. Every sub-board connects via Molex headers with schematics printed inside the bottom inspection plate.',
            },
          ],
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Klangwerk Audio GmbH',
          summary: 'Precision desktop reference electronics engineered and assembled in Munich.',
          columns: [
            {
              heading: 'Hardware',
              links: [
                { label: 'Series 02 Reference', href: '#instrument' },
                { label: 'Test Reports', href: '#specs' },
                { label: 'Editions', href: '#pricing' },
              ],
            },
            {
              heading: 'Support',
              links: [
                { label: 'Service Schematics', href: '#faq' },
                { label: '5-Year Warranty', href: '#faq' },
                { label: 'Munich Showroom', href: '#faq' },
              ],
            },
          ],
          copyright: '© 2026 Klangwerk Audio GmbH. Crafted in Munich.',
        },
      },
    ],
  },
  {
    id: 'tpl-veridian-pavilion',
    name: 'Veridian — Botanical Conservatory',
    slug: 'veridian-conservatory',
    description: 'Warm editorial serif showcase for a glass architectural venue and botanical residency.',
    updatedAt: '2026-11-17T20:00:00Z',
    theme: {
      primaryColor: '#15803D',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FAF9F6',
      surfaceColor: '#F1EFEA',
      contrastBgColor: '#1C2620',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E2DFD7',
      displayFont: 'Playfair Display',
      bodyFont: 'Lora',
      radius: '0px',
      spacing: 'airy',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Veridian',
          links: [
            { label: 'Pavilion', href: '#pavilion' },
            { label: 'Gatherings', href: '#gatherings' },
            { label: 'Season', href: '#season' },
            { label: 'Inquire', href: '#contact' },
          ],
          ctaLabel: 'Plan a Visit',
          ctaHref: '#contact',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'centered',
          kicker: 'Hudson Valley · Architectural Conservatory',
          headline: 'A limestone and glass sanctuary for botanical craft.',
          subtitle:
            'Open Thursday through Sunday for seasonal exhibitions, architectural residencies, and intimate seated dinners beneath century-old olive trees.',
          primaryCtaLabel: 'Reserve Entry',
          primaryCtaHref: '#contact',
          secondaryCtaLabel: 'Explore the Pavilion',
          secondaryCtaHref: '#pavilion',
          imageUrl: STUDIO_IMAGES[3].url,
          imageAlt: STUDIO_IMAGES[3].alt,
        },
      },
      {
        id: createBlockId('showcase'),
        type: 'showcase',
        label: 'Media Showcase',
        backgroundVariant: 'surface',
        paddingY: 'spacious',
        props: {
          eyebrow: 'The Architecture',
          heading: 'Passive solar glasshouse with living limestone beds.',
          body: 'Designed to trace every shift in morning and afternoon light across 6,000 square feet of uninterrupted conservatory floor.',
          bullets: [
            'Accommodates up to 90 seated guests surrounded by Mediterranean flora',
            'Rainwater cistern irrigation and natural ridge ventilation',
            'Dedicated prep kitchen for visiting culinary residencies',
          ],
          ctaLabel: 'Request Event Dossier',
          ctaHref: '#contact',
          imageUrl: STUDIO_IMAGES[3].url,
          imageAlt: STUDIO_IMAGES[3].alt,
          imagePosition: 'left',
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Private Gatherings & Press',
          heading: 'Inquire about seasonal dates.',
          description: 'Share your preferred month and gathering format; our conservatory curator replies within 48 hours.',
          email: 'curator@veridian.example',
          location: '48 Orchard Lane, Rhinebeck NY',
          submitLabel: 'Submit Inquiry',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Veridian Conservatory',
          summary: 'Living botanical gallery and architectural venue in the Hudson Valley.',
          columns: [
            {
              heading: 'Visit',
              links: [
                { label: 'Hours & Tickets', href: '#contact' },
                { label: 'Exhibitions', href: '#pavilion' },
              ],
            },
            {
              heading: 'Hosting',
              links: [
                { label: 'Private Dinners', href: '#contact' },
                { label: 'Editorial Shoots', href: '#contact' },
              ],
            },
          ],
          copyright: '© 2026 Veridian Conservatory Trust.',
        },
      },
    ],
  },
  {
    id: 'tpl-kestrel-saas',
    name: 'Kestrel — B2B Telemetry SaaS',
    slug: 'kestrel-telemetry',
    description: 'High-converting B2B software landing page with crisp cobalt accents, metric strip, 3-tier SaaS pricing, and FAQ.',
    updatedAt: '2026-11-18T10:00:00Z',
    theme: {
      primaryColor: '#1D4ED8',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F3F6FA',
      contrastBgColor: '#0F172A',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#DCE3EC',
      displayFont: 'Plus Jakarta Sans',
      bodyFont: 'DM Sans',
      radius: '6px',
      spacing: 'balanced',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Kestrel',
          links: [
            { label: 'Platform', href: '#approach' },
            { label: 'Benchmarks', href: '#metrics' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'FAQ', href: '#faq' },
          ],
          ctaLabel: 'Start Free Trial',
          ctaHref: '#pricing',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'split',
          kicker: 'Cold-Chain Fleet Telemetry · SOC2 Type II',
          headline: 'Sub-second sensor monitoring for global logistics fleets.',
          subtitle:
            'Detect temperature excursions before cargo spoils. Kestrel unifies cellular gateways, warehouse probes, and automated compliance logs in one live console.',
          primaryCtaLabel: 'Start 14-Day Trial',
          primaryCtaHref: '#pricing',
          secondaryCtaLabel: 'Book Technical Demo',
          secondaryCtaHref: '#contact',
          imageUrl: STUDIO_IMAGES[5].url,
          imageAlt: STUDIO_IMAGES[5].alt,
        },
      },
      {
        id: createBlockId('stats'),
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Operational Reliability',
          items: [
            { value: '99.98%', label: 'Gateway Uptime', context: 'Multi-carrier LTE-M failover' },
            { value: '1.4s', label: 'Alert Latency', context: 'Threshold breach to SMS/webhook' },
            { value: '4.2M', label: 'Daily Readings', context: 'Immutable audit ledger' },
            { value: '31%', label: 'Less Spoilage', context: 'Measured across 40+ fleets' },
          ],
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Platform Architecture',
          heading: 'Built for compliance teams and dispatch engineers.',
          intro: 'Deploy calibrated hardware in 15 minutes and stream telemetry straight into your ERP.',
          columns: 3,
          items: [
            {
              title: 'Automated FDA 21 CFR Logs',
              description: 'Export tamper-evident PDF chain-of-custody reports with one click at every dock handoff.',
              meta: 'Compliance',
            },
            {
              title: 'Predictive Door-Seal Alerts',
              description: 'Spot compressor drift and unlatched trailer doors hours before payload limits are crossed.',
              meta: 'Diagnostics',
            },
            {
              title: 'REST & Webhook Streams',
              description: 'Forward live temperature, humidity, and GPS payloads directly to Snowflake, SAP, or Slack.',
              meta: 'Developer API',
            },
          ],
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Predictable Fleet Pricing',
          heading: 'Scale from one warehouse to a continental network.',
          intro: 'All plans include cellular data SIMs, API webhooks, and unlimited team seats.',
          tiers: [
            {
              name: 'Depot Starter',
              audience: 'Up to 15 active sensors',
              price: '$190',
              cadence: 'per month',
              description: 'Essential cold-room and single-van monitoring with instant SMS alerts.',
              features: [
                'Up to 15 calibrated LoRa/LTE sensors',
                '90-day telemetry retention',
                'Email & SMS excursion alerts',
              ],
              ctaLabel: 'Start Starter',
              highlighted: false,
            },
            {
              name: 'Fleet Growth',
              audience: 'Up to 100 active sensors',
              price: '$540',
              cadence: 'per month',
              description: 'Full multi-lane fleet visibility, API webhooks, and automated compliance packets.',
              features: [
                'Up to 100 active sensors',
                '3-year immutable audit archive',
                'REST API & webhook streaming',
                'Priority dispatch support',
              ],
              ctaLabel: 'Start Fleet Growth',
              highlighted: true,
            },
            {
              name: 'Enterprise Network',
              audience: 'Unlimited hubs & custom SLAs',
              price: '$1,450',
              cadence: 'per month',
              description: 'Dedicated VPC ingestion, SSO/SAML, and custom ERP integrations.',
              features: [
                'Unlimited sensors & depots',
                'SAML SSO & role-based permissions',
                '99.99% contractual uptime SLA',
              ],
              ctaLabel: 'Contact Sales',
              highlighted: false,
            },
          ],
        },
      },
      {
        id: createBlockId('faq'),
        type: 'faq',
        label: 'FAQ Accordion',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Common Questions',
          heading: 'Deployment, calibration, and billing.',
          items: [
            {
              question: 'How long do the wireless probe batteries last in -20°C freezers?',
              answer: 'Our lithium-thionyl chloride packs are rated for 36 months at -30°C with 5-minute reporting intervals.',
            },
            {
              question: 'Can we integrate Kestrel alerts into our existing TMS?',
              answer: 'Yes. Every Growth and Enterprise workspace includes signed JSON webhooks and GraphQL/REST endpoints.',
            },
          ],
        },
      },
      {
        id: createBlockId('cta'),
        type: 'cta',
        label: 'Conversion Banner',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          headline: 'Eliminate blind spots across your cold chain.',
          description: 'Request two pre-paired evaluation sensors shipped overnight to your facility.',
          primaryCtaLabel: 'Request Eval Kit',
          primaryCtaHref: '#contact',
          secondaryCtaLabel: 'Compare Plans',
          secondaryCtaHref: '#pricing',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Kestrel Telemetry Inc.',
          summary: 'Real-time cold-chain monitoring and compliance automation for modern logistics.',
          columns: [
            {
              heading: 'Product',
              links: [
                { label: 'Sensors & Gateways', href: '#approach' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Compliance', href: '#metrics' },
              ],
            },
            {
              heading: 'Company',
              links: [
                { label: 'Request Eval Kit', href: '#contact' },
                { label: 'FAQ', href: '#faq' },
              ],
            },
          ],
          copyright: '© 2026 Kestrel Telemetry Inc. All rights reserved.',
        },
      },
    ],
  },
  {
    id: 'tpl-mercer-advisory',
    name: 'Mercer & Sato — Advisory Firm',
    slug: 'mercer-sato-advisory',
    description: 'Executive B2B consulting and product strategy practice with workshop showcase, client quote, and retainer tiers.',
    updatedAt: '2026-11-18T10:00:00Z',
    theme: {
      primaryColor: '#B45309',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F7F4EE',
      contrastBgColor: '#181411',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E5DDD0',
      displayFont: 'Bricolage Grotesque',
      bodyFont: 'DM Sans',
      radius: '6px',
      spacing: 'balanced',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Mercer & Sato',
          links: [
            { label: 'Practice', href: '#approach' },
            { label: 'Case Study', href: '#work' },
            { label: 'Retainers', href: '#pricing' },
            { label: 'Contact', href: '#contact' },
          ],
          ctaLabel: 'Book Briefing',
          ctaHref: '#contact',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'split',
          kicker: 'Product & Engineering Advisory · New York & Tokyo',
          headline: 'Senior technical leadership for high-stakes product transitions.',
          subtitle:
            'We partner directly with founders and CTOs to untangle legacy architecture, sharpen product roadmaps, and accelerate enterprise delivery.',
          primaryCtaLabel: 'Schedule Partner Call',
          primaryCtaHref: '#contact',
          secondaryCtaLabel: 'View Engagement Models',
          secondaryCtaHref: '#pricing',
          imageUrl: STUDIO_IMAGES[2].url,
          imageAlt: STUDIO_IMAGES[2].alt,
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Advisory Mandates',
          heading: 'Hands-on sprints, never bloated slide decks.',
          intro: 'Every engagement pairs a principal systems architect with a product strategy director.',
          columns: 3,
          items: [
            {
              title: 'Architecture Due Diligence',
              description: 'Deep codebase, security, and unit-economics audits prior to Series B or M&A.',
              meta: '2-Week Sprint',
            },
            {
              title: 'Platform Modernization',
              description: 'Zero-downtime migration blueprints from monoliths to resilient service boundaries.',
              meta: '8–12 Weeks',
            },
            {
              title: 'Fractional CTO Bench',
              description: 'Weekly engineering leadership, hiring loops, and board-level technical reporting.',
              meta: 'Ongoing Retainer',
            },
          ],
        },
      },
      {
        id: createBlockId('testimonial'),
        type: 'testimonial',
        label: 'Editorial Quote',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          quote:
            'Mercer & Sato cut our cloud inference spend by 46% in six weeks while unblocking our enterprise SOC2 audit ahead of a major bank rollout.',
          authorName: 'Claire Takahashi',
          authorRole: 'Chief Executive Officer',
          company: 'Vektor Clearing Systems',
          outcome: '46% cloud cost reduction · Passed Tier-1 bank audit',
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Fixed Retainers',
          heading: 'Clear senior partner allocation.',
          intro: 'No junior hand-offs—your work is executed directly by our managing partners.',
          tiers: [
            {
              name: 'Diagnostic Sprint',
              audience: '2-week deep technical & UX audit',
              price: '$9,500',
              cadence: 'fixed 2-week sprint',
              description: 'Comprehensive risk register, latency benchmark, and 90-day remediation roadmap.',
              features: [
                'Full repository & infra review',
                'Executive readout & Q&A workshop',
                'Prioritized engineering backlog',
              ],
              ctaLabel: 'Book Diagnostic',
              highlighted: false,
            },
            {
              name: 'Embedded Advisory',
              audience: 'Ongoing weekly partner guidance',
              price: '$6,800',
              cadence: 'per month',
              description: 'Dedicated weekly architecture reviews, RFC sign-off, and key engineering hiring.',
              features: [
                'Weekly 90-min leadership cadence',
                'Async Slack & RFC design reviews',
                'Candidate final-round interviews',
                'Quarterly board deck review',
              ],
              ctaLabel: 'Reserve Retainer',
              highlighted: true,
            },
          ],
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Confidential Inquiry',
          heading: 'Discuss your upcoming roadmap.',
          description: 'Share your stage, team size, and immediate engineering priorities.',
          email: 'partners@mercersato.example',
          location: '54 Mercer Street, New York NY',
          submitLabel: 'Request Partner Intro',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Mercer & Sato Advisory',
          summary: 'Independent engineering and product strategy advisors for growth-stage companies.',
          columns: [
            {
              heading: 'Practice',
              links: [
                { label: 'Mandates', href: '#approach' },
                { label: 'Retainers', href: '#pricing' },
              ],
            },
            {
              heading: 'Offices',
              links: [
                { label: 'New York', href: '#contact' },
                { label: 'Tokyo', href: '#contact' },
              ],
            },
          ],
          copyright: '© 2026 Mercer & Sato LLP.',
        },
      },
    ],
  },
  {
    id: 'tpl-sora-roastery',
    name: 'Sora — Specialty Coffee & Roastery',
    slug: 'sora-roastery',
    description: 'Warm terracotta hospitality & specialty coffee roastery site with tasting showcase, subscription tiers, and wholesale contact.',
    updatedAt: '2026-11-18T10:00:00Z',
    theme: {
      primaryColor: '#C2410C',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F9F3EE',
      contrastBgColor: '#1E1614',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#E8DBD2',
      displayFont: 'Cormorant Garamond',
      bodyFont: 'DM Sans',
      radius: '12px',
      spacing: 'airy',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Sora Roastery',
          links: [
            { label: 'Single Origins', href: '#approach' },
            { label: 'Tasting Room', href: '#work' },
            { label: 'Subscriptions', href: '#pricing' },
            { label: 'Wholesale', href: '#contact' },
          ],
          ctaLabel: 'Join Coffee Club',
          ctaHref: '#pricing',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'centered',
          kicker: 'Small-Batch Drum Roasted in Portland',
          headline: 'Single-estate coffees roasted daily for clarity and sweetness.',
          subtitle:
            'Direct-trade harvests from smallholder farms in Ethiopia, Colombia, and Costa Rica—shipped within 24 hours of roasting.',
          primaryCtaLabel: 'Explore Subscriptions',
          primaryCtaHref: '#pricing',
          secondaryCtaLabel: 'Visit Tasting Room',
          secondaryCtaHref: '#work',
          imageUrl: STUDIO_IMAGES[4].url,
          imageAlt: STUDIO_IMAGES[4].alt,
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Current Harvests',
          heading: 'Three seasonal lots on the cupping table.',
          intro: 'Each lot is profiled on our cast-iron drum roaster to preserve bright florals and clean caramel finish.',
          columns: 3,
          items: [
            {
              title: 'Washed Guji Uraga',
              description: 'Bergamot zest, white peach, and honeyed black tea clarity. Ideal for pour-over.',
              meta: 'Ethiopia · 2,150m',
            },
            {
              title: 'Pink Bourbon Huila',
              description: 'Blood orange, cane sugar, and silky cocoa body balanced for espresso or filter.',
              meta: 'Colombia · 1,850m',
            },
            {
              title: 'Honey Process Tarrazu',
              description: 'Roasted almond, dried apricot, and velvety hazelnut sweetness.',
              meta: 'Costa Rica · 1,700m',
            },
          ],
        },
      },
      {
        id: createBlockId('showcase'),
        type: 'showcase',
        label: 'Media Showcase',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Portland Tasting Bar',
          heading: 'Friday morning public cuppings & pour-over flights.',
          body: 'Step into our sunlit roastery to taste three harvest releases side by side with our head roaster and calibrate your home grinder.',
          bullets: [
            'Open daily 7:30 AM – 4:00 PM at 418 NW Industrial Way',
            'Complimentary grind calibration on any whole-bean bag',
            'Wholesale barista training programs for partner cafes',
          ],
          ctaLabel: 'Wholesale Inquiries',
          ctaHref: '#contact',
          imageUrl: STUDIO_IMAGES[0].url,
          imageAlt: STUDIO_IMAGES[0].alt,
          imagePosition: 'left',
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Roaster Dispatch',
          heading: 'Fresh whole beans delivered on your cadence.',
          intro: 'Pause, skip, or swap origin preferences anytime from your subscriber link.',
          tiers: [
            {
              name: 'Two-Bag Discovery',
              audience: 'For daily morning pour-overs',
              price: '$38',
              cadence: 'every 2 weeks',
              description: 'Two 340g bags of rotating single-origin lots roasted to order.',
              features: [
                'Free carbon-neutral priority shipping',
                'Brew recipe cards for V60 & AeroPress',
                'Early access to micro-lot drops',
              ],
              ctaLabel: 'Subscribe Now',
              highlighted: true,
            },
            {
              name: 'Studio Office Box',
              audience: 'For creative teams & hospitality bars',
              price: '$112',
              cadence: 'every 2 weeks',
              description: 'Five pounds of our balanced House Espresso + Filter seasonal blend.',
              features: [
                '5 lb bulk craft valve bags',
                'Grind & water filtration guide',
                'Dedicated wholesale account rep',
              ],
              ctaLabel: 'Order Office Box',
              highlighted: false,
            },
          ],
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Wholesale & Events',
          heading: 'Partner with Sora Roastery.',
          description: 'Serve Sora at your cafe, restaurant, or studio kitchen. Request a complimentary sample box.',
          email: 'hello@soraroastery.example',
          location: '418 NW Industrial Way, Portland OR',
          submitLabel: 'Request Sample Box',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Sora Roastery',
          summary: 'Direct-trade specialty coffee roastery and tasting room in Portland, Oregon.',
          columns: [
            {
              heading: 'Coffee',
              links: [
                { label: 'Seasonal Lots', href: '#approach' },
                { label: 'Subscriptions', href: '#pricing' },
              ],
            },
            {
              heading: 'Visit',
              links: [
                { label: 'Tasting Bar', href: '#work' },
                { label: 'Wholesale', href: '#contact' },
              ],
            },
          ],
          copyright: '© 2026 Sora Roastery Co.',
        },
      },
    ],
  },
  {
    id: 'tpl-solis-clinic',
    name: 'Solis — Preventive Longevity Lab',
    slug: 'solis-clinic',
    description: 'Calm forest-green wellness & preventive diagnostics practice with biomarker metrics, memberships, and patient intake.',
    updatedAt: '2026-11-18T10:00:00Z',
    theme: {
      primaryColor: '#166534',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FAF9F5',
      surfaceColor: '#F0EFE8',
      contrastBgColor: '#14221B',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#D6D9CE',
      displayFont: 'Manrope',
      bodyFont: 'Manrope',
      radius: '12px',
      spacing: 'airy',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'canvas',
        paddingY: 'compact',
        props: {
          brandName: 'Solis Health',
          links: [
            { label: 'Diagnostics', href: '#approach' },
            { label: 'Biomarkers', href: '#metrics' },
            { label: 'Memberships', href: '#pricing' },
            { label: 'Book Visit', href: '#contact' },
          ],
          ctaLabel: 'Join Waitlist',
          ctaHref: '#contact',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'canvas',
        paddingY: 'spacious',
        props: {
          layout: 'split',
          kicker: 'Preventive Diagnostics & Longevity Medicine',
          headline: 'Measure 120+ clinical biomarkers before symptoms appear.',
          subtitle:
            'Evidence-based metabolic, cardiovascular, and VO2 max testing paired with quarterly physician consultations in a calm clinical sanctuary.',
          primaryCtaLabel: 'Explore Memberships',
          primaryCtaHref: '#pricing',
          secondaryCtaLabel: 'See Included Panels',
          secondaryCtaHref: '#approach',
          imageUrl: STUDIO_IMAGES[6].url,
          imageAlt: STUDIO_IMAGES[6].alt,
        },
      },
      {
        id: createBlockId('stats'),
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Clinical Depth',
          items: [
            { value: '124', label: 'Blood Biomarkers', context: 'ApoB, Lp(a), hs-CRP & hormones' },
            { value: '45 min', label: 'Physician Review', context: 'Unrushed 1-on-1 protocol design' },
            { value: '2x / yr', label: 'DEXA & VO2 Scans', context: 'Visceral fat & aerobic capacity' },
            { value: '48 hr', label: 'Lab Turnaround', context: 'Annotated trend dashboard' },
          ],
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Diagnostic Pillars',
          heading: 'Actionable longevity protocols grounded in clinical data.',
          intro: 'We translate raw lab panels into clear nutrition, sleep, and training interventions.',
          columns: 3,
          items: [
            {
              title: 'Cardiometabolic Mapping',
              description: 'Advanced lipid subfractions, fasting insulin, and continuous glucose trend analysis.',
              meta: 'Pillar 01',
            },
            {
              title: 'Body Composition & Strength',
              description: 'DEXA bone density and lean muscle mass tracking alongside grip and VO2 max benchmarks.',
              meta: 'Pillar 02',
            },
            {
              title: 'Quarterly Care Plans',
              description: 'Measurable 90-day supplement, exercise, and sleep targets reviewed by your MD.',
              meta: 'Pillar 03',
            },
          ],
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Annual Memberships',
          heading: 'Transparent preventive care.',
          intro: 'HSA/FSA eligible diagnostic memberships with zero surprise lab billing.',
          tiers: [
            {
              name: 'Baseline Panel',
              audience: 'Twice-yearly biomarker tracking',
              price: '$1,400',
              cadence: 'per year',
              description: 'Two comprehensive 124-biomarker draws and physician protocol reviews.',
              features: [
                '2x full blood biomarker panels / yr',
                '2x 45-min MD consultations',
                'Digital longitudinal trend report',
              ],
              ctaLabel: 'Select Baseline',
              highlighted: false,
            },
            {
              name: 'Complete Longevity',
              audience: 'Full metabolic, DEXA & VO2 care',
              price: '$2,900',
              cadence: 'per year',
              description: 'Quarterly labs plus DEXA scans, VO2 max testing, and direct clinician messaging.',
              features: [
                'Quarterly blood draws & ApoB tracking',
                '2x DEXA + VO2 max assessments',
                'Unlimited async physician messaging',
                'Custom sleep & nutrition protocol',
              ],
              ctaLabel: 'Apply for Membership',
              highlighted: true,
            },
          ],
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Patient Intake',
          heading: 'Book your baseline intake visit.',
          description: 'Leave your details and preferred clinic date; our care coordinator will confirm availability.',
          email: 'care@solishealth.example',
          location: '210 Greene Street, Suite 4B, Austin TX',
          submitLabel: 'Request Intake Date',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Solis Preventive Health',
          summary: 'Modern biomarker diagnostics and physician-led longevity medicine.',
          columns: [
            {
              heading: 'Clinic',
              links: [
                { label: 'Biomarker Panels', href: '#metrics' },
                { label: 'Memberships', href: '#pricing' },
              ],
            },
            {
              heading: 'Patients',
              links: [
                { label: 'Book Intake', href: '#contact' },
                { label: 'Care Pillars', href: '#approach' },
              ],
            },
          ],
          copyright: '© 2026 Solis Preventive Health PLLC.',
        },
      },
    ],
  },
  {
    id: 'tpl-foundry-cohort',
    name: 'Foundry — Design & AI Fellowship',
    slug: 'foundry-fellowship',
    description: 'High-contrast cohort & conference site with curriculum grid, alumni testimonial, tuition tiers, and application FAQ.',
    updatedAt: '2026-11-18T10:00:00Z',
    theme: {
      primaryColor: '#1D4ED8',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F4F2EC',
      contrastBgColor: '#13151A',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#DAD4C6',
      displayFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      radius: '0px',
      spacing: 'balanced',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Foundry 08',
          links: [
            { label: 'Curriculum', href: '#approach' },
            { label: 'Outcomes', href: '#metrics' },
            { label: 'Tuition', href: '#pricing' },
            { label: 'FAQ', href: '#faq' },
          ],
          ctaLabel: 'Apply Now',
          ctaHref: '#contact',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'contrast',
        paddingY: 'spacious',
        props: {
          layout: 'banner',
          kicker: '6-Week Intensive · Spring Cohort Starts May 4',
          headline: 'Ship production design systems and full-stack software with peers.',
          subtitle:
            'An intensive practitioner cohort for product designers and frontend engineers building real-world tools alongside staff mentors.',
          primaryCtaLabel: 'Submit Application',
          primaryCtaHref: '#contact',
          secondaryCtaLabel: 'Review Syllabus',
          secondaryCtaHref: '#approach',
          imageUrl: STUDIO_IMAGES[7].url,
          imageAlt: STUDIO_IMAGES[7].alt,
        },
      },
      {
        id: createBlockId('stats'),
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Cohort Track Record',
          items: [
            { value: '24', label: 'Seats Per Cohort', context: 'Small 6-person critique pods' },
            { value: '6 wks', label: 'Live Workshops', context: 'Twice weekly studio critiques' },
            { value: '94%', label: 'Completion Rate', context: 'Shipped capstone products' },
            { value: '180+', label: 'Alumni Network', context: 'Design & eng leads worldwide' },
          ],
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: '6-Week Syllabus',
          heading: 'From typographic tokens to deployed production apps.',
          intro: 'Every week ends with a live shipping demo and candid peer code & design review.',
          columns: 3,
          items: [
            {
              title: 'Weeks 1–2: Visual Systems',
              description: 'Establish grid proportions, color tokens, and accessible component contracts.',
              meta: 'Foundation',
            },
            {
              title: 'Weeks 3–4: Interactive Motion',
              description: 'Build responsive state transitions, drag-and-drop tools, and keyboard flows.',
              meta: 'Engineering',
            },
            {
              title: 'Weeks 5–6: Demo Day Launch',
              description: 'Instrument analytics, polish performance, and ship your capstone to live users.',
              meta: 'Production',
            },
          ],
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Cohort Seats',
          heading: 'Individual and team-sponsored tuition.',
          intro: 'Employer learning-budget invoices and scholarship spots available.',
          tiers: [
            {
              name: 'Independent Fellow',
              audience: 'For self-funded practitioners',
              price: '$1,200',
              cadence: '6-week cohort',
              description: 'Full access to live workshops, critique pods, and lifetime alumni Slack.',
              features: [
                '12 live studio sessions & critiques',
                '1-on-1 capstone mentor reviews',
                'Lifetime recordings & repo templates',
              ],
              ctaLabel: 'Apply as Fellow',
              highlighted: true,
            },
            {
              name: 'Company Team Pass',
              audience: 'Up to 3 engineers or designers',
              price: '$3,100',
              cadence: 'per team of 3',
              description: 'Invoice billing for product teams upgrading their internal design system.',
              features: [
                '3 reserved cohort seats',
                'Private 60-min team architecture audit',
                'Formal corporate invoice & receipt',
              ],
              ctaLabel: 'Sponsor a Team',
              highlighted: false,
            },
          ],
        },
      },
      {
        id: createBlockId('faq'),
        type: 'faq',
        label: 'FAQ Accordion',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Admissions',
          heading: 'Time commitment and prerequisites.',
          items: [
            {
              question: 'How many hours per week should fellows budget?',
              answer: 'Expect 6–8 hours weekly: two 90-minute live studio sessions plus async project building.',
            },
            {
              question: 'Can my employer reimburse tuition?',
              answer: 'Yes. We issue itemized PDF invoices and learning certificates compatible with standard L&D stipends.',
            },
          ],
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Cohort 08 Applications',
          heading: 'Reserve your seat for May.',
          description: 'Tell us about your current role and what you plan to build during the six weeks.',
          email: 'admissions@foundrycohort.example',
          location: 'Live Online + Brooklyn Demo Night',
          submitLabel: 'Submit Application',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Foundry Fellowship',
          summary: 'Practitioner-led cohorts for product designers and frontend engineers.',
          columns: [
            {
              heading: 'Cohort',
              links: [
                { label: 'Syllabus', href: '#approach' },
                { label: 'Tuition', href: '#pricing' },
              ],
            },
            {
              heading: 'Admissions',
              links: [
                { label: 'Apply', href: '#contact' },
                { label: 'FAQ', href: '#faq' },
              ],
            },
          ],
          copyright: '© 2026 Foundry Fellowship.',
        },
      },
    ],
  },
  {
    id: 'tpl-vespera-lighting',
    name: 'Vespera — Architectural Lighting',
    slug: 'vespera-lighting',
    description: 'Sculptural dark-header luminaire studio with warm brass accents, photographic banner hero, craft showcase, and trade pricing.',
    updatedAt: '2026-11-18T18:00:00Z',
    theme: {
      primaryColor: '#B45309',
      accentTextColor: '#FFFFFF',
      backgroundColor: '#FAF8F4',
      surfaceColor: '#F1ECE2',
      contrastBgColor: '#141311',
      textColor: '#000000',
      mutedTextColor: '#000000',
      borderColor: '#DFD7C8',
      displayFont: 'Cormorant Garamond',
      bodyFont: 'Manrope',
      radius: '0px',
      spacing: 'airy',
    },
    blocks: [
      {
        id: createBlockId('nav'),
        type: 'navbar',
        label: 'Top Navigation',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Vespera Milan',
          links: [
            { label: 'Luminaires', href: '#approach' },
            { label: 'Materials', href: '#work' },
            { label: 'Trade Specs', href: '#pricing' },
            { label: 'Showroom', href: '#contact' },
          ],
          ctaLabel: 'Request Trade Kit',
          ctaHref: '#contact',
        },
      },
      {
        id: createBlockId('hero'),
        type: 'hero',
        label: 'Hero Section',
        backgroundVariant: 'contrast',
        paddingY: 'normal',
        props: {
          layout: 'banner',
          kicker: 'Milan & Zurich · Hand-Cast Brass Luminaires',
          headline: 'Warm architectural light milled from solid brass and blown glass.',
          subtitle:
            'Bespoke linear pendants, wall sconces, and table lamps engineered for galleries, hospitality interiors, and private residences.',
          primaryCtaLabel: 'Explore Collection',
          primaryCtaHref: '#work',
          secondaryCtaLabel: 'Download IES Files',
          secondaryCtaHref: '#pricing',
          imageUrl: STUDIO_IMAGES[0].url,
          imageAlt: STUDIO_IMAGES[0].alt,
        },
      },
      {
        id: createBlockId('stats'),
        type: 'stats',
        label: 'Metric Strip',
        backgroundVariant: 'surface',
        paddingY: 'compact',
        props: {
          heading: 'Photometric Standards',
          items: [
            { value: '97 CRI', label: 'Spectral Accuracy', context: 'Museum-grade warm-dim LED arrays' },
            { value: '2700K', label: 'Standard Tone', context: 'Dimmable down to 1800K candlelight' },
            { value: '6 wks', label: 'Custom Lead Time', context: 'Cast and finished to order in Milan' },
            { value: '10 yr', label: 'Driver Guarantee', context: 'Modular field-replaceable optics' },
          ],
        },
      },
      {
        id: createBlockId('features'),
        type: 'features',
        label: 'Feature Grid',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Signature Series',
          heading: 'Three architectural forms engineered for quiet illumination.',
          intro: 'Every fixture ships with DALI-2 / 0-10V dimming compatibility and solid patinated hardware.',
          columns: 3,
          items: [
            {
              title: 'Arco Linear 180',
              description: 'Suspended extruded bronze beam with micro-louvered downlight and soft ceiling wash.',
              meta: 'Pendant · 1800mm',
            },
            {
              title: 'Sola Opal Sconce',
              description: 'Mouth-blown triplex opal diffuser mounted on a milled unlacquered brass backplate.',
              meta: 'Wall Fixture · IP44',
            },
            {
              title: 'Nocturne Desk Monolith',
              description: 'Weighted cast-bronze base with rotational optical hood for focused reading.',
              meta: 'Table · 2.4 kg',
            },
          ],
        },
      },
      {
        id: createBlockId('showcase'),
        type: 'showcase',
        label: 'Media Showcase',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Material Provenance',
          heading: 'Unlacquered patinas that deepen with architectural age.',
          body: 'We pair Italian sand-cast brass with optical borosilicate glass and linen-braided cabling—avoiding plated plastics or sealed disposable drivers.',
          bullets: [
            'Available in Aged Bronze, Brushed Raw Brass, and Oil-Rubbed Steel',
            'UL, CE, and UKCA certified for commercial hospitality installations',
            'Complimentary Revit BIM families and photometric IES files for architects',
          ],
          ctaLabel: 'Order Finish Samples',
          ctaHref: '#contact',
          imageUrl: STUDIO_IMAGES[1].url,
          imageAlt: STUDIO_IMAGES[1].alt,
          imagePosition: 'right',
        },
      },
      {
        id: createBlockId('pricing'),
        type: 'pricing',
        label: 'Pricing Table',
        backgroundVariant: 'canvas',
        paddingY: 'normal',
        props: {
          eyebrow: 'Trade & Commission Tiers',
          heading: 'Specification programs for studios and residences.',
          intro: 'Trade pricing applies automatically to licensed architecture and interior practices.',
          tiers: [
            {
              name: 'Finish Sample Box',
              audience: 'For active interior specification',
              price: '$140',
              cadence: 'credited to first order',
              description: 'Four machined brass and bronze blocks plus triplex glass diffuser swatches.',
              features: [
                '4 solid metal finish blocks',
                'Warm-dim 2700K–1800K swatch guide',
                'Express courier delivery',
              ],
              ctaLabel: 'Order Sample Box',
              highlighted: false,
            },
            {
              name: 'Trade Specification',
              audience: 'For hospitality & residential builds',
              price: '25% Off',
              cadence: 'trade net pricing',
              description: 'Direct studio allocation, custom drop lengths, and DALI dimming coordination.',
              features: [
                'Dedicated Milan lighting engineer',
                'Custom ceiling canopy & stem lengths',
                'Full IES & Revit BIM package',
                'Priority batch production slots',
              ],
              ctaLabel: 'Open Trade Account',
              highlighted: true,
            },
          ],
        },
      },
      {
        id: createBlockId('contact'),
        type: 'contact',
        label: 'Contact & Inquiry',
        backgroundVariant: 'surface',
        paddingY: 'normal',
        props: {
          eyebrow: 'Milan Showroom & Trade Desk',
          heading: 'Specify Vespera for your next project.',
          description: 'Send your lighting schedule or room dimensions for photometric layout recommendations.',
          email: 'trade@vesperamilano.example',
          location: 'Via Solferino 24, 20121 Milano',
          submitLabel: 'Request Trade Quote',
        },
      },
      {
        id: createBlockId('footer'),
        type: 'footer',
        label: 'Site Footer',
        backgroundVariant: 'contrast',
        paddingY: 'compact',
        props: {
          brandName: 'Vespera Milano',
          summary: 'Architectural brass and blown-glass luminaires crafted in Milan.',
          columns: [
            {
              heading: 'Collection',
              links: [
                { label: 'Luminaires', href: '#approach' },
                { label: 'Materials', href: '#work' },
              ],
            },
            {
              heading: 'Trade',
              links: [
                { label: 'Specification Tiers', href: '#pricing' },
                { label: 'Milan Showroom', href: '#contact' },
              ],
            },
          ],
          copyright: '© 2026 Vespera Illuminazione S.r.l.',
        },
      },
    ],
  },
];

export type TemplateCategory =
  | 'All'
  | 'Architecture'
  | 'SaaS'
  | 'Product'
  | 'Consulting'
  | 'Hospitality'
  | 'Wellness'
  | 'Education';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'All',
  'Architecture',
  'SaaS',
  'Product',
  'Consulting',
  'Hospitality',
  'Wellness',
  'Education',
];

export const TEMPLATE_META: Record<
  string,
  { category: Exclude<TemplateCategory, 'All'>; audienceTag: string }
> = {
  'tpl-nordic-arch': { category: 'Architecture', audienceTag: 'Architecture & Studios' },
  'tpl-klangwerk-audio': { category: 'Product', audienceTag: 'Hardware & Physical Goods' },
  'tpl-veridian-pavilion': { category: 'Hospitality', audienceTag: 'Venues & Galleries' },
  'tpl-kestrel-saas': { category: 'SaaS', audienceTag: 'B2B Software & Telemetry' },
  'tpl-mercer-advisory': { category: 'Consulting', audienceTag: 'Advisory & Agencies' },
  'tpl-sora-roastery': { category: 'Hospitality', audienceTag: 'Food, Roastery & Retail' },
  'tpl-solis-clinic': { category: 'Wellness', audienceTag: 'Clinics & Longevity' },
  'tpl-foundry-cohort': { category: 'Education', audienceTag: 'Cohorts & Conferences' },
  'tpl-vespera-lighting': { category: 'Product', audienceTag: 'Lighting & Luxury Goods' },
};

