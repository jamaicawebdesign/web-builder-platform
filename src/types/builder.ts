export type BlockType =
  | 'navbar'
  | 'hero'
  | 'logocloud'
  | 'features'
  | 'showcase'
  | 'portfolio'
  | 'video'
  | 'stats'
  | 'team'
  | 'pricing'
  | 'calculator'
  | 'testimonial'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer';

export type BackgroundVariant = 'canvas' | 'surface' | 'contrast';
export type PaddingSize = 'compact' | 'normal' | 'spacious';

export interface SiteTheme {
  primaryColor: string;
  accentTextColor: string;
  backgroundColor: string;
  surfaceColor: string;
  contrastBgColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  displayFont: string;
  bodyFont: string;
  radius: '0px' | '6px' | '12px';
  spacing: 'compact' | 'balanced' | 'airy';
  motion?: 'none' | 'subtle' | 'editorial';
}

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  meta?: string;
}

export interface LogoCloudItem {
  name: string;
  sector?: string;
}

export interface PortfolioItem {
  title: string;
  category: string;
  client: string;
  metric: string;
  summary: string;
  challenge?: string;
  outcome?: string;
  imageUrl: string;
  imageAlt: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  imageAlt: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
}

export interface StatItem {
  value: string;
  label: string;
  context: string;
}

export interface PricingTier {
  name: string;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  heading: string;
  links: NavLinkItem[];
}

export interface BlockBase {
  id: string;
  type: BlockType;
  label: string;
  backgroundVariant: BackgroundVariant;
  paddingY: PaddingSize;
}

export interface NavbarBlock extends BlockBase {
  type: 'navbar';
  props: {
    brandName: string;
    links: NavLinkItem[];
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface HeroBlock extends BlockBase {
  type: 'hero';
  props: {
    layout: 'split' | 'split-left' | 'centered' | 'banner';
    kicker: string;
    headline: string;
    subtitle: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    imageUrl: string;
    imageAlt: string;
  };
}

export interface LogoCloudBlock extends BlockBase {
  type: 'logocloud';
  props: {
    heading: string;
    caption?: string;
    layout: 'grid' | 'row' | 'cards' | 'compact';
    items: LogoCloudItem[];
  };
}

export interface FeaturesBlock extends BlockBase {
  type: 'features';
  props: {
    eyebrow: string;
    heading: string;
    intro: string;
    columns: 2 | 3 | 4;
    layout?: 'cards' | 'bento' | 'minimal' | 'numbered';
    items: FeatureItem[];
  };
}

export interface ShowcaseBlock extends BlockBase {
  type: 'showcase';
  props: {
    eyebrow: string;
    heading: string;
    body: string;
    bullets: string[];
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
    imageAlt: string;
    imagePosition: 'left' | 'right';
    layout?: 'split' | 'wide-media' | 'stacked';
  };
}

export interface PortfolioBlock extends BlockBase {
  type: 'portfolio';
  props: {
    eyebrow: string;
    heading: string;
    intro: string;
    columns: 2 | 3;
    layout?: 'grid' | 'bento' | 'rows';
    items: PortfolioItem[];
  };
}

export interface VideoBlock extends BlockBase {
  type: 'video';
  props: {
    eyebrow: string;
    heading: string;
    description: string;
    videoUrl: string;
    posterUrl: string;
    posterAlt: string;
    durationLabel: string;
    highlights: string[];
    ctaLabel: string;
    ctaHref: string;
    layout?: 'split-right' | 'split-left' | 'centered';
  };
}

export interface StatsBlock extends BlockBase {
  type: 'stats';
  props: {
    heading: string;
    layout?: 'strip' | 'cards' | 'grid-2';
    items: StatItem[];
  };
}

export interface TeamBlock extends BlockBase {
  type: 'team';
  props: {
    eyebrow: string;
    heading: string;
    intro: string;
    columns: 2 | 3 | 4;
    layout?: 'cards' | 'horizontal' | 'minimal';
    members: TeamMember[];
  };
}

export interface PricingBlock extends BlockBase {
  type: 'pricing';
  props: {
    eyebrow: string;
    heading: string;
    intro: string;
    layout?: 'cards' | 'rows' | 'compact';
    tiers: PricingTier[];
  };
}

export interface CalculatorBlock extends BlockBase {
  type: 'calculator';
  props: {
    eyebrow: string;
    heading: string;
    intro: string;
    layout?: 'split' | 'split-reverse' | 'stacked';
    currencySymbol: string;
    primaryInputLabel: string;
    primaryMin: number;
    primaryMax: number;
    primaryStep: number;
    primaryDefault: number;
    primaryUnitLabel: string;
    secondaryInputLabel: string;
    secondaryMin: number;
    secondaryMax: number;
    secondaryStep: number;
    secondaryDefault: number;
    secondaryUnitLabel: string;
    hourlyRate: number;
    monthlyPlatformCostPerPrimary: number;
    baseMonthlyFee: number;
    roiHeadlineLabel: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface TestimonialBlock extends BlockBase {
  type: 'testimonial';
  props: {
    layout?: 'editorial' | 'centered' | 'card';
    quote: string;
    authorName: string;
    authorRole: string;
    company: string;
    outcome: string;
  };
}

export interface FaqBlock extends BlockBase {
  type: 'faq';
  props: {
    eyebrow: string;
    heading: string;
    layout?: 'single' | 'split' | 'grid-2';
    items: FaqItem[];
  };
}

export interface CtaBlock extends BlockBase {
  type: 'cta';
  props: {
    layout?: 'panel' | 'centered' | 'minimal';
    headline: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
}

export type ContactFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'select'
  | 'textarea'
  | 'checkbox';

export interface ContactFormField {
  id: string;
  name: string;
  label: string;
  type: ContactFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  step?: 1 | 2;
}

export interface ContactBookingConfig {
  durationLabel?: string;
  timezone?: string;
  slots?: string[];
  stepHeading?: string;
  externalBookingUrl?: string;
  externalBookingLabel?: string;
}

export interface ContactBlock extends BlockBase {
  type: 'contact';
  props: {
    eyebrow: string;
    heading: string;
    description: string;
    email: string;
    location: string;
    submitLabel: string;
    layout?: 'split' | 'split-reverse' | 'centered';
    formMode?: 'standard' | 'multistep' | 'booking';
    customFields?: ContactFormField[];
    booking?: ContactBookingConfig;
    successMessage?: string;
    redirectUrl?: string;
  };
}

export interface FooterBlock extends BlockBase {
  type: 'footer';
  props: {
    brandName: string;
    summary: string;
    columns: FooterColumn[];
    copyright: string;
    layout?: 'columns' | 'centered';
  };
}

export type SiteBlock =
  | NavbarBlock
  | HeroBlock
  | LogoCloudBlock
  | FeaturesBlock
  | ShowcaseBlock
  | PortfolioBlock
  | VideoBlock
  | StatsBlock
  | TeamBlock
  | PricingBlock
  | CalculatorBlock
  | TestimonialBlock
  | FaqBlock
  | CtaBlock
  | ContactBlock
  | FooterBlock;

export interface SiteSeo {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  language?: string;
  customDomain?: string;
}

export interface SiteMarketingConfig {
  ga4MeasurementId?: string;
  metaPixelId?: string;
  googleAdsId?: string;
  linkedinPartnerId?: string;
  enableJsonLd?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementCtaLabel?: string;
  announcementCtaHref?: string;
  campaignTone?: string;
  savedKit?: MarketingAdKit | null;
}

export interface SiteAutomationsConfig {
  webhookUrl?: string;
  webhookFormat?: 'json' | 'slack' | 'discord';
  notifyEmail?: string;
  autoResponderNote?: string;
}

export interface SitePage {
  id: string;
  name: string;
  path: string;
  blocks: SiteBlock[];
  seo?: SiteSeo;
}

export interface SiteProject {
  id: string;
  clientName?: string;
  name: string;
  slug: string;
  description: string;
  theme: SiteTheme;
  blocks: SiteBlock[];
  pages?: SitePage[];
  activePageId?: string;
  seo?: SiteSeo;
  marketing?: SiteMarketingConfig;
  automations?: SiteAutomationsConfig;
  createdAt?: string;
  updatedAt: string;
  lastDeployedSlug?: string;
  lastDeployedUrl?: string;
  lastDeployedAt?: string;
}

export interface ExportOptions {
  prefix: string;
  minify: boolean;
  includeReset: boolean;
  useCssVariables: boolean;
  formEndpoint?: string;
  trackEndpoint?: string;
  previewNavigationBridge?: boolean;
}

export interface DomainAliasRecord {
  domain: string;
  verified: boolean;
  verifiedAt?: string | null;
}

export interface DeployedSiteRecord {
  slug: string;
  projectId?: string | null;
  clientName?: string;
  name: string;
  description: string;
  deployedAt: string;
  blockCount: number;
  pagesCount?: number;
  pagePaths?: string[];
  url: string;
  customDomain?: string | null;
  domainVerified?: boolean;
  domainVerifiedAt?: string | null;
  additionalDomains?: DomainAliasRecord[];
}

export interface DomainDnsInstructions {
  domain: string;
  cnameHost: string;
  cnameTarget: string;
  txtHost: string;
  txtValue: string;
}

export interface DomainVerificationResult {
  slug: string;
  customDomain: string;
  verified: boolean;
  domainVerifiedAt: string | null;
  instructions: DomainDnsInstructions;
  checks: {
    cnameMatched: boolean;
    txtMatched: boolean;
    aRecordMatched: boolean;
    resolvedCnames: string[];
    resolvedIps: string[];
    resolvedTxt: string[];
  };
}

export interface DomainInspectionResult {
  domain: string;
  apexDomain: string;
  detectedRegistrar: string;
  registrarSlug:
    | 'cloudflare'
    | 'godaddy'
    | 'namecheap'
    | 'squarespace'
    | 'route53'
    | 'porkbun'
    | 'shopify'
    | 'other';
  rdapFound: boolean;
  transferLocked: boolean | null;
  rdapStatuses: string[];
  expiresAt: string | null;
  registeredAt: string | null;
  ageDays: number | null;
  icann60DayEligible: boolean | null;
  nameservers: string[];
  mxRecords: string[];
  currentIps: string[];
  currentCnames: string[];
  txtRecords: string[];
}

export type DomainTransferStatus =
  | 'initiated'
  | 'auth_verified'
  | 'approval_pending'
  | 'icann_window'
  | 'completed'
  | 'cancelled';

export type DomainTransferDnsStrategy = 'keep_dns' | 'managed_dns';

export interface DomainTransferRecord {
  id: string;
  domain: string;
  siteSlug: string;
  currentRegistrar: string;
  eppLast4: string;
  registrantEmail: string;
  dnsStrategy: DomainTransferDnsStrategy;
  status: DomainTransferStatus;
  lockDetected: boolean;
  mxWarning: boolean;
  nameservers: string[];
  mxRecords: string[];
  registrarChecks: {
    unlocked: boolean;
    ageConfirmed: boolean;
    emailConfirmed: boolean;
  };
  estimatedCompletionAt: string;
  foaApprovedAt?: string | null;
  completedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadBookingSlot {
  date: string;
  time: string;
  timezone?: string;
  duration?: string;
}

export type LeadPipelineStatus = 'new' | 'contacted' | 'booked' | 'archived';

export interface LeadSubmission {
  id: string;
  siteSlug: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  customData?: Record<string, string | boolean>;
  bookingSlot?: LeadBookingSlot | null;
  status?: LeadPipelineStatus;
  webhookStatus?: 'none' | 'delivered' | 'failed';
  webhookResponseCode?: number | null;
  submittedAt: string;
}

export interface AnalyticsDailyPoint {
  date: string;
  views: number;
  clicks: number;
  leads: number;
}

export interface SeoAuditCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  points: number;
  maxPoints: number;
  detail: string;
  actionTarget?: 'seo' | 'marketing' | 'builder' | 'deploy';
}

export interface SitePerformanceMetric {
  slug: string;
  name: string;
  clientName: string;
  url: string;
  customDomain?: string | null;
  domainVerified?: boolean;
  blockCount: number;
  deployedAt: string;
  views: number;
  clicks: number;
  leads: number;
  conversionRate: number;
  ctr: number;
  seoScore: number;
  htmlSizeKb: number;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  seoChecks: SeoAuditCheck[];
}

export interface AnalyticsEventItem {
  id: string;
  siteSlug: string;
  eventType: 'page_view' | 'cta_click' | 'form_submit';
  deviceType: 'desktop' | 'tablet' | 'mobile';
  referrer: string;
  targetLabel: string;
  createdAt: string;
}

export interface AnalyticsPayload {
  summary: {
    totalViews: number;
    totalClicks: number;
    totalLeads: number;
    conversionRate: number;
    ctr: number;
    avgSeoScore: number;
    prevViews: number;
    prevClicks: number;
    prevLeads: number;
    publishedSitesCount: number;
    savedProjectsCount: number;
  };
  series: AnalyticsDailyPoint[];
  devices: Array<{ device: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topCtas: Array<{ label: string; count: number }>;
  sites: SitePerformanceMetric[];
  leads: LeadSubmission[];
  recentEvents: AnalyticsEventItem[];
}

export type MarketingPackageId =
  | 'seo_boost'
  | 'social_launch'
  | 'full_funnel'
  | 'ad_booster';

export type MarketingOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'active'
  | 'paused'
  | 'completed';

export interface MarketingAdKit {
  summary: string;
  targetKeywords: string[];
  googleSearchAd: {
    headlines: string[];
    descriptions: string[];
  };
  metaSocialAd: {
    primaryText: string;
    headline: string;
    callToAction: string;
  };
  linkedinPost: {
    hook: string;
    body: string;
    cta: string;
  };
  emailBroadcast: {
    subject: string;
    previewText: string;
    body: string;
  };
  launchChecklist: string[];
}

export interface MarketingOrderRecord {
  id: string;
  siteSlug: string;
  siteName: string;
  clientName: string;
  customerEmail: string;
  packageId: MarketingPackageId;
  packageName: string;
  billingType: 'one_time' | 'monthly';
  adBudgetUsd: number;
  serviceFeeUsd: number;
  totalUsd: number;
  channels: string[];
  targetAudience: string;
  campaignGoal: string;
  utmCampaign: string;
  status: MarketingOrderStatus;
  paymentProvider: 'stripe' | 'invoice';
  stripeSessionId?: string | null;
  generatedKit?: MarketingAdKit | null;
  createdAt: string;
  updatedAt: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type StudioView =
  | 'builder'
  | 'preview'
  | 'code'
  | 'analytics'
  | 'marketing'
  | 'pricing';
export type PlanTierId = 'starter' | 'pro' | 'agency';
