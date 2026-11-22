import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutTemplate,
  Monitor,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from 'lucide-react';
import {
  STARTER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_META,
  TemplateCategory,
} from '../data/presets';
import { SiteProject, ViewportMode } from '../types/builder';
import { generateCleanHtml } from '../utils/codeGenerator';

interface TemplateGalleryModalProps {
  open: boolean;
  currentTemplateSlug: string;
  initialPreviewTemplate?: SiteProject | null;
  onClose: () => void;
  onSelectTemplate: (template: SiteProject) => void;
  onCreateBlank: () => void;
  onOpenAiPrompt: () => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  open,
  currentTemplateSlug,
  initialPreviewTemplate = null,
  onClose,
  onSelectTemplate,
  onCreateBlank,
  onOpenAiPrompt,
}) => {
  const [category, setCategory] = useState<TemplateCategory>('All');
  const [query, setQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<SiteProject | null>(
    initialPreviewTemplate
  );
  const [previewViewport, setPreviewViewport] = useState<ViewportMode>('desktop');
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (open) {
      setPreviewTemplate(initialPreviewTemplate || null);
      setPreviewViewport('desktop');
      setReplayKey((k) => k + 1);
    } else {
      setPreviewTemplate(null);
    }
  }, [open, initialPreviewTemplate]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STARTER_TEMPLATES.filter((tpl) => {
      const meta = TEMPLATE_META[tpl.id];
      if (category !== 'All' && meta?.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        (meta?.audienceTag || '').toLowerCase().includes(q) ||
        tpl.theme.displayFont.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const demoHtml = useMemo(() => {
    if (!previewTemplate) return '';
    return generateCleanHtml(
      previewTemplate,
      {
        prefix: 'af-',
        minify: false,
        includeReset: true,
        useCssVariables: true,
      },
      true,
      true
    );
  }, [previewTemplate]);

  const previewIndex = useMemo(() => {
    if (!previewTemplate) return -1;
    return STARTER_TEMPLATES.findIndex((t) => t.id === previewTemplate.id);
  }, [previewTemplate]);

  const handleStepPreview = (delta: -1 | 1) => {
    if (previewIndex < 0) return;
    const nextIdx =
      (previewIndex + delta + STARTER_TEMPLATES.length) % STARTER_TEMPLATES.length;
    setPreviewTemplate(STARTER_TEMPLATES[nextIdx]);
  };

  if (!open) return null;

  const viewportFrameWidth =
    previewViewport === 'mobile'
      ? '375px'
      : previewViewport === 'tablet'
        ? '768px'
        : '100%';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-[#F4F2EC] border border-[#DAD4C6] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all ${
          previewTemplate
            ? 'max-w-[1360px] h-[91vh]'
            : 'max-w-6xl max-h-[89vh]'
        }`}
      >
        {previewTemplate ? (
          <>
            {/* Interactive Demo Preview Top Bar */}
            <div className="px-5 py-3.5 bg-white border-b border-[#DAD4C6] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-black whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Templates</span>
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-black font-display truncate">
                      {previewTemplate.name}
                    </h2>
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: previewTemplate.theme.backgroundColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: previewTemplate.theme.surfaceColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: previewTemplate.theme.primaryColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: previewTemplate.theme.contrastBgColor }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-black truncate tabular-nums">
                    {TEMPLATE_META[previewTemplate.id]?.category || 'Starter'} ·{' '}
                    {previewTemplate.blocks.length} sections ·{' '}
                    {previewTemplate.theme.displayFont} / {previewTemplate.theme.bodyFont}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Responsive Viewport Switcher */}
                <div className="hidden md:flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    title="Desktop 1440px"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      previewViewport === 'desktop'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">1440</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    title="Tablet 768px"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      previewViewport === 'tablet'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">768</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    title="Mobile 375px"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      previewViewport === 'mobile'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">375</span>
                  </button>
                </div>

                {/* Replay & Cycle Previous / Next Template */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setReplayKey((k) => k + 1)}
                    title="Replay entrance animations"
                    aria-label="Replay entrance animations"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Replay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepPreview(-1)}
                    title="Previous template demo"
                    aria-label="Previous template demo"
                    className="p-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepPreview(1)}
                    title="Next template demo"
                    aria-label="Next template demo"
                    className="p-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(previewTemplate);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Template</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close template gallery"
                  className="p-1.5 rounded-lg text-black hover:bg-[#EAE6DC] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Interactive Iframe Demo Stage */}
            <div className="flex-1 canvas-drafting-grid p-4 sm:p-6 overflow-hidden flex flex-col items-center">
              <div
                className="w-full h-full bg-white rounded-xl border border-[#C8C1B2] shadow-lg overflow-hidden flex flex-col transition-all duration-200"
                style={{ maxWidth: viewportFrameWidth }}
              >
                <div className="px-4 py-2 bg-[#FAF9F5] border-b border-[#DAD4C6] flex items-center justify-between gap-3 shrink-0">
                  <div className="text-xs font-mono text-black truncate">
                    https://demo.atelierframe.site/{previewTemplate.slug}
                  </div>
                  <div className="hidden sm:block text-xs text-black whitespace-nowrap">
                    Live Interactive Demo · Scroll, test links, FAQ &amp; form
                  </div>
                </div>
                <iframe
                  key={`${previewTemplate.id}-${replayKey}`}
                  title={`Live demo preview for ${previewTemplate.name}`}
                  srcDoc={demoHtml}
                  className="w-full flex-1 border-0 bg-white"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Gallery Header */}
            <div className="px-6 py-4 bg-white border-b border-[#DAD4C6] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#13151A] text-white flex items-center justify-center shrink-0">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black font-display">
                    Website Template Gallery
                  </h2>
                  <p className="text-xs text-black">
                    Preview live interactive demos across {STARTER_TEMPLATES.length} curated layouts before choosing one for your site.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAiPrompt();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-black whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>AI Generate Custom</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCreateBlank();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Blank Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close template gallery"
                  className="p-1.5 rounded-lg text-black hover:bg-[#EAE6DC] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="px-6 py-3.5 bg-[#F8F6F1] border-b border-[#DAD4C6] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      category === cat
                        ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search industry or style..."
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white pl-9 pr-8 py-1.5 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto studio-scroll p-6">
              {filteredTemplates.length === 0 ? (
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-10 text-center space-y-2">
                  <p className="text-base font-semibold text-black">
                    No templates matched &ldquo;{query}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('All');
                      setQuery('');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTemplates.map((tpl) => {
                    const meta = TEMPLATE_META[tpl.id];
                    const isCurrent = currentTemplateSlug === tpl.slug;
                    const navBlock = tpl.blocks.find((b) => b.type === 'navbar');
                    const heroBlock = tpl.blocks.find((b) => b.type === 'hero');
                    const heroProps =
                      heroBlock && heroBlock.type === 'hero' ? heroBlock.props : null;
                    const isDarkNav = navBlock?.backgroundVariant === 'contrast';
                    const isDarkHero =
                      heroBlock?.backgroundVariant === 'contrast' ||
                      heroProps?.layout === 'banner';

                    const portfolioBlock = tpl.blocks.find((b) => b.type === 'portfolio');
                    const statsBlock = tpl.blocks.find((b) => b.type === 'stats');
                    const featuresBlock = tpl.blocks.find((b) => b.type === 'features');
                    const logoBlock = tpl.blocks.find((b) => b.type === 'logocloud');
                    const teamBlock = tpl.blocks.find((b) => b.type === 'team');
                    const videoBlock = tpl.blocks.find((b) => b.type === 'video');
                    const calcBlock = tpl.blocks.find((b) => b.type === 'calculator');
                    const contactBlock = tpl.blocks.find((b) => b.type === 'contact');

                    const signatureHighlights: string[] = [];
                    if (portfolioBlock) signatureHighlights.push('Portfolio');
                    if (videoBlock) signatureHighlights.push('Video');
                    if (calcBlock) signatureHighlights.push('ROI Calc');
                    if (teamBlock) signatureHighlights.push('Team');
                    if (logoBlock) signatureHighlights.push('Logo Strip');
                    if (
                      contactBlock &&
                      contactBlock.type === 'contact' &&
                      contactBlock.props.formMode === 'booking'
                    ) {
                      signatureHighlights.push('Booking');
                    }

                    const lowerStripBg =
                      statsBlock?.backgroundVariant === 'contrast'
                        ? tpl.theme.contrastBgColor
                        : tpl.theme.surfaceColor;
                    const isDarkStrip = statsBlock?.backgroundVariant === 'contrast';

                    return (
                      <div
                        key={tpl.id}
                        className={`bg-white rounded-xl border overflow-hidden flex flex-col transition-all duration-200 ${
                          isCurrent
                            ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/25 shadow-md'
                            : 'border-[#DAD4C6] hover:border-[#13151A] hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Architectural Multi-Band Mini-Website Preview Stage */}
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tpl)}
                          className="group relative text-left w-full aspect-[16/10] flex flex-col overflow-hidden border-b border-[#DAD4C6] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                          style={{
                            backgroundColor: isDarkHero
                              ? tpl.theme.contrastBgColor
                              : tpl.theme.backgroundColor,
                            color: isDarkHero ? '#FFFFFF' : tpl.theme.textColor,
                            backgroundImage: !isDarkHero
                              ? `radial-gradient(circle at 88% 18%, color-mix(in srgb, ${tpl.theme.primaryColor} 14%, transparent), transparent 52%)`
                              : undefined,
                          }}
                        >
                          {/* Mini Navbar */}
                          <div
                            className="px-3.5 py-1.5 flex items-center justify-between gap-2 shrink-0 border-b"
                            style={{
                              backgroundColor: isDarkNav
                                ? tpl.theme.contrastBgColor
                                : tpl.theme.backgroundColor,
                              color: isDarkNav ? '#FFFFFF' : tpl.theme.textColor,
                              borderColor: isDarkNav
                                ? 'rgba(255,255,255,0.14)'
                                : tpl.theme.borderColor,
                            }}
                          >
                            <span
                              className="text-[10px] font-bold tracking-tight truncate"
                              style={{ fontFamily: tpl.theme.displayFont }}
                            >
                              {navBlock && navBlock.type === 'navbar'
                                ? navBlock.props.brandName
                                : tpl.name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="hidden sm:inline text-[8px] opacity-70">
                                {navBlock && navBlock.type === 'navbar'
                                  ? navBlock.props.links
                                      .slice(0, 2)
                                      .map((l) => l.label)
                                      .join(' · ')
                                  : 'Work · Studio'}
                              </span>
                              <span
                                className="px-1.5 py-0.5 text-[8px] font-semibold"
                                style={{
                                  backgroundColor: tpl.theme.primaryColor,
                                  color: tpl.theme.accentTextColor,
                                  borderRadius: tpl.theme.radius,
                                }}
                              >
                                {navBlock && navBlock.type === 'navbar'
                                  ? navBlock.props.ctaLabel
                                  : 'Action'}
                              </span>
                            </div>
                          </div>

                          {/* Mini Hero Band */}
                          {heroProps?.layout === 'banner' && heroProps.imageUrl ? (
                            <div className="relative flex-1 px-3.5 py-2.5 flex flex-col justify-end overflow-hidden min-h-0">
                              <img
                                src={heroProps.imageUrl}
                                alt={tpl.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-0"
                                style={{
                                  background:
                                    'linear-gradient(104deg, rgba(13,15,20,0.92) 0%, rgba(13,15,20,0.68) 56%, rgba(13,15,20,0.25) 100%)',
                                }}
                              />
                              <div className="relative z-10 max-w-[85%] space-y-1 text-white">
                                <div
                                  className="text-[13px] font-bold leading-tight line-clamp-2"
                                  style={{ fontFamily: tpl.theme.displayFont }}
                                >
                                  {heroProps.headline}
                                </div>
                                <span
                                  className="inline-block px-2 py-0.5 text-[8px] font-semibold"
                                  style={{
                                    backgroundColor: tpl.theme.primaryColor,
                                    color: tpl.theme.accentTextColor,
                                    borderRadius: tpl.theme.radius,
                                  }}
                                >
                                  {heroProps.primaryCtaLabel}
                                </span>
                              </div>
                            </div>
                          ) : heroProps?.layout === 'centered' ? (
                            <div className="flex-1 px-3.5 pt-2.5 pb-0 flex flex-col items-center justify-between text-center overflow-hidden min-h-0">
                              <div className="space-y-1 max-w-[92%]">
                                <div
                                  className="text-[12px] font-bold leading-tight line-clamp-2"
                                  style={{ fontFamily: tpl.theme.displayFont }}
                                >
                                  {heroProps.headline}
                                </div>
                                <span
                                  className="inline-block px-2 py-0.5 text-[8px] font-semibold"
                                  style={{
                                    backgroundColor: tpl.theme.primaryColor,
                                    color: tpl.theme.accentTextColor,
                                    borderRadius: tpl.theme.radius,
                                  }}
                                >
                                  {heroProps.primaryCtaLabel}
                                </span>
                              </div>
                              {heroProps.imageUrl && (
                                <img
                                  src={heroProps.imageUrl}
                                  alt={tpl.name}
                                  className="w-[82%] h-14 object-cover border-t border-x mt-1.5 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                  style={{
                                    borderColor: tpl.theme.borderColor,
                                    borderTopLeftRadius: tpl.theme.radius,
                                    borderTopRightRadius: tpl.theme.radius,
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 px-3.5 py-2.5 grid grid-cols-12 gap-2.5 items-center min-h-0">
                              <div
                                className={`col-span-7 space-y-1 min-w-0 ${
                                  heroProps?.layout === 'split-left' ? 'order-2' : ''
                                }`}
                              >
                                <div
                                  className="text-[12px] font-bold leading-tight line-clamp-2"
                                  style={{ fontFamily: tpl.theme.displayFont }}
                                >
                                  {heroProps?.headline || tpl.name}
                                </div>
                                <p className="text-[8.5px] leading-snug opacity-75 line-clamp-2">
                                  {heroProps?.subtitle || tpl.description}
                                </p>
                                <span
                                  className="inline-block px-2 py-0.5 text-[8px] font-semibold"
                                  style={{
                                    backgroundColor: tpl.theme.primaryColor,
                                    color: tpl.theme.accentTextColor,
                                    borderRadius: tpl.theme.radius,
                                  }}
                                >
                                  {heroProps?.primaryCtaLabel || 'Explore'}
                                </span>
                              </div>
                              {heroProps?.imageUrl && (
                                <div
                                  className={`col-span-5 overflow-hidden shadow-sm ${
                                    heroProps?.layout === 'split-left' ? 'order-1' : ''
                                  }`}
                                  style={{ borderRadius: tpl.theme.radius }}
                                >
                                  <img
                                    src={heroProps.imageUrl}
                                    alt={tpl.name}
                                    className="w-full aspect-[4/3] object-cover border transition-transform duration-500 ease-out group-hover:scale-105"
                                    style={{
                                      borderColor: isDarkHero
                                        ? 'rgba(255,255,255,0.2)'
                                        : tpl.theme.borderColor,
                                      borderRadius: tpl.theme.radius,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Miniature Second-Band Strip (Real Proof / Portfolio / Metrics) */}
                          <div
                            className="px-3.5 py-2 border-t shrink-0"
                            style={{
                              backgroundColor: lowerStripBg,
                              color: isDarkStrip ? '#FFFFFF' : tpl.theme.textColor,
                              borderColor: isDarkStrip
                                ? 'rgba(255,255,255,0.14)'
                                : tpl.theme.borderColor,
                            }}
                          >
                            {portfolioBlock && portfolioBlock.type === 'portfolio' ? (
                              <div className="grid grid-cols-3 gap-1.5">
                                {portfolioBlock.props.items.slice(0, 3).map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 px-1.5 py-1 border min-w-0"
                                    style={{
                                      borderColor: tpl.theme.borderColor,
                                      backgroundColor: tpl.theme.backgroundColor,
                                      color: tpl.theme.textColor,
                                      borderRadius: tpl.theme.radius,
                                    }}
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt=""
                                      className="w-5 h-5 object-cover shrink-0"
                                      style={{ borderRadius: '3px' }}
                                    />
                                    <span className="text-[7.5px] font-semibold truncate">
                                      {item.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : statsBlock && statsBlock.type === 'stats' ? (
                              <div className="grid grid-cols-3 gap-2">
                                {statsBlock.props.items.slice(0, 3).map((stat, idx) => (
                                  <div key={idx} className="min-w-0">
                                    <div
                                      className="text-[10px] font-bold tabular-nums leading-none truncate"
                                      style={{
                                        fontFamily: tpl.theme.displayFont,
                                        color: isDarkStrip ? '#FFFFFF' : tpl.theme.primaryColor,
                                      }}
                                    >
                                      {stat.value}
                                    </div>
                                    <div className="text-[7px] opacity-75 truncate mt-0.5">
                                      {stat.label}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : featuresBlock && featuresBlock.type === 'features' ? (
                              <div className="grid grid-cols-3 gap-1.5">
                                {featuresBlock.props.items.slice(0, 3).map((feat, idx) => (
                                  <div
                                    key={idx}
                                    className="px-1.5 py-1 border min-w-0"
                                    style={{
                                      borderColor: tpl.theme.borderColor,
                                      backgroundColor: tpl.theme.backgroundColor,
                                      color: tpl.theme.textColor,
                                      borderRadius: tpl.theme.radius,
                                    }}
                                  >
                                    <div className="text-[7.5px] font-semibold truncate">
                                      {feat.title}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : teamBlock && teamBlock.type === 'team' ? (
                              <div className="grid grid-cols-3 gap-1.5">
                                {teamBlock.props.members.slice(0, 3).map((m, idx) => (
                                  <div key={idx} className="flex items-center gap-1 min-w-0">
                                    <img
                                      src={m.imageUrl}
                                      alt=""
                                      className="w-4 h-4 rounded-full object-cover object-top shrink-0"
                                    />
                                    <span className="text-[7.5px] font-medium truncate">
                                      {m.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[7.5px] font-medium opacity-75 truncate">
                                {tpl.blocks.length} bespoke sections · {tpl.theme.displayFont}
                              </div>
                            )}
                          </div>

                          {/* Hover Demo Overlay */}
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold shadow-md">
                              <Eye className="w-3.5 h-3.5 text-[#1D4ED8]" />
                              <span>Preview Live Demo</span>
                            </span>
                          </div>
                        </button>

                        {/* Template Info & Clean Unboxed Metadata */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-black">
                                {tpl.name}
                              </h3>
                              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-xs border border-black/15"
                                  style={{ backgroundColor: tpl.theme.surfaceColor }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-xs border border-black/15"
                                  style={{ backgroundColor: tpl.theme.primaryColor }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-xs border border-black/15"
                                  style={{ backgroundColor: tpl.theme.contrastBgColor }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-black tabular-nums">
                              <span className="font-medium">{meta?.category || 'Starter'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{tpl.blocks.length} sections</span>
                              <span aria-hidden="true">·</span>
                              <span>{tpl.theme.displayFont}</span>
                              {isCurrent && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-semibold text-[#1D4ED8]">
                                    Active
                                  </span>
                                </>
                              )}
                            </div>
                            {signatureHighlights.length > 0 && (
                              <p className="text-[11px] font-medium text-[#1D4ED8] truncate">
                                Includes {signatureHighlights.slice(0, 4).join(' · ')}
                              </p>
                            )}
                            <p className="text-xs text-black leading-relaxed pt-0.5">
                              {tpl.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#DAD4C6]/70">
                            <button
                              type="button"
                              onClick={() => setPreviewTemplate(tpl)}
                              className="py-2 px-3 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-black text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#1D4ED8]" />
                              <span>Live Demo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTemplate(tpl);
                                onClose();
                              }}
                              className="py-2 px-3 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Use Template
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
