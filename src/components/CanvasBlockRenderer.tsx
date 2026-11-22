import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  GripVertical,
  ImageOff,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  BackgroundVariant,
  PortfolioItem,
  SiteBlock,
  SiteTheme,
  ViewportMode,
} from '../types/builder';
import {
  getEffectiveBookingSlots,
  getEffectiveContactFields,
  getUpcomingWeekdays,
} from '../utils/contactForm';
import { resolveVideoSource } from '../utils/videoEmbed';

interface CanvasBlockRendererProps {
  block: SiteBlock;
  index: number;
  total: number;
  theme: SiteTheme;
  viewport: ViewportMode;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCycleBackground?: (block: SiteBlock) => void;
  onDragStartBlock: (e: React.DragEvent, index: number) => void;
  onQuickAiRefine: (id: string) => void;
}

function SafeMedia({
  src,
  alt,
  radius,
  zoomOnHover = false,
}: {
  src: string;
  alt: string;
  radius: string;
  zoomOnHover?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="w-full aspect-[16/10] bg-slate-200/70 border border-slate-300/80 flex flex-col items-center justify-center gap-2 text-black p-6 text-center"
        style={{ borderRadius: radius }}
      >
        <ImageOff className="w-6 h-6" />
        <span className="text-sm font-medium">{alt || 'Visual media slot'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-full aspect-[16/10] object-cover block ${
        zoomOnHover
          ? 'transition-transform duration-500 ease-out group-hover/media:scale-[1.03]'
          : ''
      }`}
      style={{ borderRadius: radius }}
    />
  );
}

export const CanvasBlockRenderer: React.FC<CanvasBlockRendererProps> = ({
  block,
  index,
  total,
  theme,
  viewport,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  onCycleBackground,
  onDragStartBlock,
  onQuickAiRefine,
}) => {
  const isCompactViewport = viewport === 'mobile';
  const isNarrowViewport = viewport === 'mobile' || viewport === 'tablet';

  const bgStyle: React.CSSProperties =
    block.backgroundVariant === 'contrast'
      ? { backgroundColor: theme.contrastBgColor, color: '#FFFFFF' }
      : block.backgroundVariant === 'surface'
        ? { backgroundColor: theme.surfaceColor, color: theme.textColor }
        : { backgroundColor: theme.backgroundColor, color: theme.textColor };

  const mutedColor =
    block.backgroundVariant === 'contrast'
      ? 'rgba(255, 255, 255, 0.92)'
      : theme.mutedTextColor;

  const cardBorder =
    block.backgroundVariant === 'contrast'
      ? 'rgba(255, 255, 255, 0.14)'
      : theme.borderColor;

  const rhythm = theme.spacing === 'compact' ? 0.78 : theme.spacing === 'airy' ? 1.25 : 1;
  const padY =
    block.paddingY === 'compact'
      ? Math.round(32 * rhythm)
      : block.paddingY === 'spacious'
        ? Math.round(84 * rhythm)
        : Math.round(56 * rhythm);

  const displayStyle: React.CSSProperties = {
    fontFamily: `"${theme.displayFont}", system-ui, sans-serif`,
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: `"${theme.bodyFont}", system-ui, sans-serif`,
  };

  const motionMode = theme.motion || 'editorial';
  const hasMotion = motionMode !== 'none';
  const enterAnimClass =
    motionMode === 'editorial'
      ? 'af-canvas-enter-editorial'
      : motionMode === 'subtle'
        ? 'af-canvas-enter-subtle'
        : '';
  const enterDelayStyle: React.CSSProperties = hasMotion
    ? { animationDelay: `${Math.min(index, 6) * 45}ms` }
    : {};

  const nextBgVariant = (): BackgroundVariant => {
    if (block.backgroundVariant === 'canvas') return 'surface';
    if (block.backgroundVariant === 'surface') return 'contrast';
    return 'canvas';
  };

  // Interactive states for Portfolio, Video, Calculator, and Contact blocks on Canvas
  const [portfolioFilter, setPortfolioFilter] = useState<string>('All');
  const [activeCaseStudy, setActiveCaseStudy] = useState<PortfolioItem | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const [contactStep, setContactStep] = useState<1 | 2>(1);
  const [bookingDayIdx, setBookingDayIdx] = useState<number>(0);
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>(() =>
    block.type === 'contact' ? getEffectiveBookingSlots(block.props)[1] || getEffectiveBookingSlots(block.props)[0] || '10:30 AM' : '10:30 AM'
  );

  const [calcPrimary, setCalcPrimary] = useState<number>(() =>
    block.type === 'calculator' ? block.props.primaryDefault : 25
  );
  const [calcSecondary, setCalcSecondary] = useState<number>(() =>
    block.type === 'calculator' ? block.props.secondaryDefault : 8
  );

  // Keep calculator sliders & booking slots synced when defaults change in inspector
  React.useEffect(() => {
    if (block.type === 'calculator') {
      setCalcPrimary(block.props.primaryDefault);
      setCalcSecondary(block.props.secondaryDefault);
    }
  }, [
    block.type,
    block.type === 'calculator' ? block.props.primaryDefault : 0,
    block.type === 'calculator' ? block.props.secondaryDefault : 0,
  ]);

  React.useEffect(() => {
    if (block.type === 'contact') {
      const slots = getEffectiveBookingSlots(block.props);
      if (slots.length > 0 && !slots.includes(bookingTimeSlot)) {
        setBookingTimeSlot(slots[0]);
      }
      if (block.props.formMode !== 'multistep') {
        setContactStep(1);
      }
    }
  }, [block, bookingTimeSlot]);

  const portfolioCategories = useMemo(() => {
    if (block.type !== 'portfolio') return ['All'];
    const cats = Array.from(
      new Set(block.props.items.map((it) => it.category.trim()).filter(Boolean))
    );
    return ['All', ...cats];
  }, [block]);

  React.useEffect(() => {
    if (!portfolioCategories.includes(portfolioFilter)) {
      setPortfolioFilter('All');
    }
  }, [portfolioCategories, portfolioFilter]);

  return (
    <div
      data-block-id={block.id}
      draggable
      onDragStart={(e) => onDragStartBlock(e, index)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      className={`group relative transition-shadow duration-150 cursor-pointer ${
        selected
          ? 'ring-2 ring-[#1D4ED8] ring-inset z-10'
          : 'hover:ring-1 hover:ring-[#1D4ED8]/60 hover:ring-inset'
      }`}
      style={{ ...bgStyle, ...bodyStyle }}
    >
      {/* Top-Left Section Index Marker on Hover/Select */}
      <div
        className={`pointer-events-none absolute left-3 z-20 px-2 py-0.5 rounded bg-[#13151A] text-white text-[11px] font-mono font-semibold tabular-nums transition-opacity duration-150 ${
          block.type === 'navbar' ? '-bottom-3' : 'top-2.5'
        } ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        {String(index + 1).padStart(2, '0')} · {block.label}
      </div>

      {/* Floating Section Action Bar */}
      <div
        className={`absolute right-3 z-20 flex items-center gap-0.5 bg-white/95 backdrop-blur border border-[#DAD4C6] rounded-md px-1.5 py-1 shadow-sm transition-opacity duration-150 ${
          block.type === 'navbar' ? '-bottom-3.5' : 'top-2.5'
        } ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          title="Drag section to reorder"
          className="cursor-grab active:cursor-grabbing p-1 text-black hover:text-[#1D4ED8]"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        {onCycleBackground && (
          <button
            type="button"
            onClick={() => onCycleBackground(block)}
            title={`Surface: ${block.backgroundVariant} (click to switch to ${nextBgVariant()})`}
            className="flex items-center gap-1 px-1.5 py-1 rounded text-xs font-medium text-black hover:bg-[#FAF9F5] cursor-pointer capitalize whitespace-nowrap"
          >
            <Palette className="w-3 h-3 text-[#B45309]" />
            <span>{block.backgroundVariant}</span>
          </button>
        )}
        <div className="h-3.5 w-px bg-[#DAD4C6] mx-0.5" />
        <button
          type="button"
          onClick={() => onQuickAiRefine(block.id)}
          title="Refine section with AI"
          className="flex items-center gap-1 px-1.5 py-1 rounded text-xs font-semibold text-[#1D4ED8] hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rewrite</span>
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          title="Move section up"
          className="p-1 rounded text-black hover:bg-[#FAF9F5] disabled:opacity-30 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          title="Move section down"
          className="p-1 rounded text-black hover:bg-[#FAF9F5] disabled:opacity-30 cursor-pointer"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(block.id)}
          title="Duplicate section"
          className="p-1 rounded text-black hover:bg-[#FAF9F5] cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          title="Remove section"
          className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Body */}
      {block.type === 'navbar' && (
        <header
          className="px-6 py-4"
          style={{ borderBottom: `1px solid ${cardBorder}` }}
        >
          <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-6">
            <span
              className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
              style={displayStyle}
            >
              {block.props.brandName}
            </span>
            {!isCompactViewport && (
              <nav className="flex items-center gap-6 text-base font-medium overflow-hidden">
                {block.props.links.map((link, idx) => (
                  <span
                    key={idx}
                    className="whitespace-nowrap"
                  >
                    {link.label}
                  </span>
                ))}
              </nav>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="px-4 py-2 text-sm font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.accentTextColor,
                  borderRadius: theme.radius,
                }}
              >
                {block.props.ctaLabel}
              </span>
              {isCompactViewport && (
                <span
                  className="px-2.5 py-1.5 text-sm font-medium border"
                  style={{ borderColor: cardBorder, borderRadius: theme.radius }}
                >
                  Menu
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {block.type === 'hero' && (
        <section
          className={`px-7 relative overflow-hidden ${enterAnimClass}`}
          style={{
            paddingBlock: `${padY}px`,
            backgroundImage:
              block.props.layout !== 'banner'
                ? block.backgroundVariant === 'contrast'
                  ? `radial-gradient(ellipse 68% 58% at 88% 8%, color-mix(in srgb, ${theme.primaryColor} 22%, transparent), transparent 72%)`
                  : `radial-gradient(ellipse 68% 58% at 88% 8%, color-mix(in srgb, ${theme.primaryColor} 10%, transparent), transparent 70%)`
                : undefined,
            ...enterDelayStyle,
          }}
        >
          {block.props.layout === 'banner' && block.props.imageUrl ? (
            <div
              className="group/media max-w-[1160px] mx-auto relative overflow-hidden flex items-end border"
              style={{
                minHeight: isCompactViewport ? '400px' : '520px',
                padding: isCompactViewport ? '28px' : '56px',
                borderRadius: theme.radius,
                borderColor: 'rgba(255,255,255,0.16)',
                boxShadow: '0 32px 64px -26px rgba(0,0,0,0.48)',
              }}
            >
              <img
                src={block.props.imageUrl}
                alt={block.props.imageAlt || block.props.headline}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover ${
                  hasMotion
                    ? 'transition-transform duration-700 ease-out group-hover/media:scale-[1.03]'
                    : ''
                }`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(104deg, rgba(10,12,17,0.92) 0%, rgba(10,12,17,0.68) 48%, rgba(10,12,17,0.22) 100%)',
                }}
              />
              <div className="relative z-10 max-w-2xl text-white">
                {block.props.kicker && (
                  <p className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3.5 text-white/90">
                    <span
                      className="w-6 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.kicker}</span>
                  </p>
                )}
                <h1
                  className={`font-bold tracking-tight leading-[1.06] mb-5 [text-wrap:balance] ${
                    isCompactViewport ? 'text-4xl' : 'text-[2.65rem] lg:text-[3.45rem]'
                  }`}
                  style={displayStyle}
                >
                  {block.props.headline}
                </h1>
                <p className="text-lg leading-relaxed mb-8 max-w-[54ch] text-white/90">
                  {block.props.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span
                    className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.accentTextColor,
                      borderRadius: theme.radius,
                      boxShadow: `0 12px 28px -10px color-mix(in srgb, ${theme.primaryColor} 70%, transparent)`,
                    }}
                  >
                    {block.props.primaryCtaLabel}
                  </span>
                  {block.props.secondaryCtaLabel && (
                    <span
                      className="px-6 py-3 text-base font-semibold border whitespace-nowrap text-white backdrop-blur-xs"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'rgba(255,255,255,0.34)',
                        borderRadius: theme.radius,
                      }}
                    >
                      {block.props.secondaryCtaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`max-w-[1160px] mx-auto ${
                block.props.layout === 'centered'
                  ? 'flex flex-col items-center text-center'
                  : isNarrowViewport
                    ? 'grid grid-cols-1 gap-8 items-center'
                    : 'grid grid-cols-12 gap-12 items-center'
              }`}
            >
              <div
                className={
                  block.props.layout === 'centered'
                    ? 'max-w-2xl'
                    : isNarrowViewport
                      ? ''
                      : block.props.layout === 'split-left'
                        ? 'col-span-6 order-2'
                        : 'col-span-6'
                }
              >
                {block.props.kicker && (
                  <p
                    className={`inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3.5 ${
                      block.props.layout === 'centered' ? 'justify-center' : ''
                    }`}
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-6 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.kicker}</span>
                  </p>
                )}
                <h1
                  className={`font-bold tracking-tight leading-[1.06] mb-5 [text-wrap:balance] ${
                    isCompactViewport ? 'text-4xl' : 'text-[2.65rem] lg:text-[3.45rem]'
                  }`}
                  style={displayStyle}
                >
                  {block.props.headline}
                </h1>
                <p
                  className="text-lg leading-relaxed mb-8 max-w-[54ch]"
                  style={{
                    color: mutedColor,
                    marginInline: block.props.layout === 'centered' ? 'auto' : undefined,
                  }}
                >
                  {block.props.subtitle}
                </p>
                <div
                  className={`flex flex-wrap gap-3 ${
                    block.props.layout === 'centered' ? 'justify-center' : ''
                  }`}
                >
                  <span
                    className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.accentTextColor,
                      borderRadius: theme.radius,
                      boxShadow: `0 10px 24px -10px color-mix(in srgb, ${theme.primaryColor} 65%, transparent)`,
                    }}
                  >
                    {block.props.primaryCtaLabel}
                  </span>
                  {block.props.secondaryCtaLabel && (
                    <span
                      className="px-6 py-3 text-base font-semibold border whitespace-nowrap"
                      style={{
                        borderColor: cardBorder,
                        borderRadius: theme.radius,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.07)'
                            : theme.surfaceColor,
                      }}
                    >
                      {block.props.secondaryCtaLabel}
                    </span>
                  )}
                </div>
              </div>
              {block.props.imageUrl && (
                <div
                  className={
                    block.props.layout === 'centered'
                      ? 'w-full max-w-4xl mt-12'
                      : isNarrowViewport
                        ? 'w-full'
                        : block.props.layout === 'split-left'
                          ? 'col-span-6 order-1'
                          : 'col-span-6'
                  }
                >
                  <div
                    className="group/media overflow-hidden border"
                    style={{
                      borderColor: cardBorder,
                      borderRadius: theme.radius,
                      boxShadow:
                        block.backgroundVariant === 'contrast'
                          ? '0 32px 64px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                          : '0 2px 6px rgba(15,23,42,0.05), 0 28px 56px -26px rgba(15,23,42,0.25)',
                    }}
                  >
                    <SafeMedia
                      src={block.props.imageUrl}
                      alt={block.props.imageAlt}
                      radius="0px"
                      zoomOnHover={hasMotion}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {block.type === 'stats' && (() => {
        const statsLayout = block.props.layout || 'strip';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div className="max-w-[1160px] mx-auto">
              {block.props.heading && (
                <h2
                  className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-5"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.heading}</span>
                </h2>
              )}

              {statsLayout === 'strip' ? (
                <div
                  className={`grid ${
                    isCompactViewport
                      ? 'grid-cols-1 divide-y'
                      : isNarrowViewport
                        ? 'grid-cols-2'
                        : 'grid-cols-4 divide-x'
                  }`}
                  style={{
                    borderTop: `1px solid ${cardBorder}`,
                    borderBottom: `1px solid ${cardBorder}`,
                    borderColor: cardBorder,
                  }}
                >
                  {block.props.items.map((item, i) => (
                    <div
                      key={i}
                      className={`py-7 ${!isCompactViewport && i > 0 ? 'px-6' : 'pr-6'}`}
                      style={{ borderColor: cardBorder }}
                    >
                      <div
                        className="text-3xl lg:text-4xl font-bold tabular-nums tracking-tight"
                        style={displayStyle}
                      >
                        {item.value}
                      </div>
                      <div className="text-base font-semibold mt-2">{item.label}</div>
                      <div className="text-sm mt-1" style={{ color: mutedColor }}>
                        {item.context}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`grid gap-5 ${
                    isCompactViewport
                      ? 'grid-cols-1'
                      : statsLayout === 'grid-2' || isNarrowViewport
                        ? 'grid-cols-2'
                        : 'grid-cols-4'
                  }`}
                >
                  {block.props.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-6 border"
                      style={{
                        borderColor: cardBorder,
                        borderRadius: theme.radius,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.05)'
                            : theme.backgroundColor,
                      }}
                    >
                      <div
                        className="text-3xl lg:text-4xl font-bold tabular-nums tracking-tight"
                        style={displayStyle}
                      >
                        {item.value}
                      </div>
                      <div className="text-base font-semibold mt-2">{item.label}</div>
                      <div className="text-sm mt-1 leading-relaxed" style={{ color: mutedColor }}>
                        {item.context}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {block.type === 'features' && (() => {
        const featLayout = block.props.layout || 'cards';
        const colClass = isCompactViewport
          ? 'grid-cols-1'
          : isNarrowViewport
            ? 'grid-cols-2'
            : block.props.columns === 4
              ? 'grid-cols-4'
              : block.props.columns === 2
                ? 'grid-cols-2'
                : 'grid-cols-3';

        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div className="max-w-[1160px] mx-auto">
              <div className="max-w-2xl mb-11">
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                {block.props.intro && (
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.intro}
                  </p>
                )}
              </div>

              {featLayout === 'numbered' ? (
                <div style={{ borderTop: `1px solid ${cardBorder}` }}>
                  {block.props.items.map((item, i) => (
                    <div
                      key={i}
                      className={`py-6 grid gap-4 items-baseline ${
                        isCompactViewport ? 'grid-cols-1' : 'grid-cols-12'
                      }`}
                      style={{ borderBottom: `1px solid ${cardBorder}` }}
                    >
                      <div className={isCompactViewport ? '' : 'col-span-5 flex items-baseline gap-4'}>
                        <span
                          className="text-sm font-mono font-bold tabular-nums shrink-0"
                          style={{
                            color:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.88)'
                                : theme.primaryColor,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight" style={displayStyle}>
                            {item.title}
                          </h3>
                          {item.meta && (
                            <p className="text-xs font-medium mt-0.5" style={{ color: mutedColor }}>
                              {item.meta}
                            </p>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-base leading-relaxed ${
                          isCompactViewport ? '' : 'col-span-7'
                        }`}
                        style={{ color: mutedColor }}
                      >
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : featLayout === 'minimal' ? (
                <div className={`grid gap-x-8 gap-y-10 ${colClass}`}>
                  {block.props.items.map((item, i) => (
                    <div
                      key={i}
                      className="pt-5"
                      style={{ borderTop: `2px solid ${i === 0 ? theme.primaryColor : cardBorder}` }}
                    >
                      {item.meta && (
                        <p
                          className="text-xs font-semibold tracking-wide mb-2"
                          style={{
                            color:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.88)'
                                : theme.primaryColor,
                          }}
                        >
                          {item.meta}
                        </p>
                      )}
                      <h3 className="text-xl font-bold mb-2 tracking-tight" style={displayStyle}>
                        {item.title}
                      </h3>
                      <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : featLayout === 'bento' ? (
                <div
                  className={`grid gap-5 ${
                    isCompactViewport ? 'grid-cols-1' : isNarrowViewport ? 'grid-cols-2' : 'grid-cols-3'
                  }`}
                >
                  {block.props.items.map((item, i) => {
                    const isWide = !isCompactViewport && (i % 4 === 0 || i % 4 === 3);
                    return (
                      <div
                        key={i}
                        className={`p-7 border flex flex-col justify-between ${
                          isWide ? 'col-span-2' : ''
                        } ${hasMotion ? 'af-hover-lift' : ''}`}
                        style={{
                          borderColor: i === 0 ? theme.primaryColor : cardBorder,
                          borderRadius: theme.radius,
                          boxShadow:
                            block.backgroundVariant !== 'contrast'
                              ? '0 1px 2px rgba(15,23,42,0.04), 0 12px 26px -18px rgba(15,23,42,0.12)'
                              : undefined,
                          backgroundImage:
                            i === 0
                              ? `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${theme.primaryColor} 12%, transparent), transparent 58%)`
                              : undefined,
                          backgroundColor:
                            block.backgroundVariant === 'contrast'
                              ? i === 0
                                ? 'rgba(255,255,255,0.09)'
                                : 'rgba(255,255,255,0.04)'
                              : i === 0
                                ? theme.surfaceColor
                                : theme.backgroundColor,
                        }}
                      >
                        <div>
                          {item.meta && (
                            <p
                              className="text-xs font-semibold tracking-wide mb-3"
                              style={{
                                color:
                                  block.backgroundVariant === 'contrast'
                                    ? 'rgba(255,255,255,0.88)'
                                    : theme.primaryColor,
                              }}
                            >
                              {item.meta}
                            </p>
                          )}
                          <h3
                            className={`font-bold mb-2.5 tracking-tight ${
                              isWide ? 'text-2xl' : 'text-xl'
                            }`}
                            style={displayStyle}
                          >
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-base leading-relaxed max-w-[60ch]" style={{ color: mutedColor }}>
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`grid gap-6 ${colClass}`}>
                  {block.props.items.map((item, i) => (
                    <div
                      key={i}
                      className={`p-7 border ${hasMotion ? 'af-hover-lift' : ''}`}
                      style={{
                        borderColor: cardBorder,
                        borderRadius: theme.radius,
                        boxShadow:
                          block.backgroundVariant !== 'contrast'
                            ? '0 1px 2px rgba(15,23,42,0.04), 0 12px 26px -18px rgba(15,23,42,0.11)'
                            : undefined,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.05)'
                            : theme.backgroundColor,
                      }}
                    >
                      {item.meta && (
                        <p
                          className="text-sm font-semibold pb-3 mb-3.5"
                          style={{
                            color:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.88)'
                                : theme.primaryColor,
                            borderBottom: `1px solid ${cardBorder}`,
                          }}
                        >
                          {item.meta}
                        </p>
                      )}
                      <h3 className="text-xl font-bold mb-2.5 tracking-tight" style={displayStyle}>
                        {item.title}
                      </h3>
                      <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {block.type === 'showcase' && (() => {
        const showLayout = block.props.layout || 'split';
        const isStacked = showLayout === 'stacked';
        const isWideMedia = showLayout === 'wide-media';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[1160px] mx-auto ${
                isStacked
                  ? 'flex flex-col gap-10'
                  : isNarrowViewport
                    ? 'grid grid-cols-1 gap-10 items-center'
                    : isWideMedia
                      ? 'grid grid-cols-12 gap-12 items-center'
                      : 'grid grid-cols-2 gap-12 items-center'
              }`}
            >
              <div
                className={
                  isStacked
                    ? 'max-w-2xl'
                    : isWideMedia && !isNarrowViewport
                      ? `col-span-5 ${block.props.imagePosition === 'left' ? 'order-2' : ''}`
                      : !isNarrowViewport && block.props.imagePosition === 'left'
                        ? 'order-2'
                        : ''
                }
              >
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: mutedColor }}>
                  {block.props.body}
                </p>
                {block.props.bullets.length > 0 && (
                  <ul
                    className="space-y-3 text-base mb-7"
                    style={{ color: mutedColor }}
                  >
                    {block.props.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 mt-0.5 rounded-full inline-flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            backgroundColor:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.14)'
                                : `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
                            color:
                              block.backgroundVariant === 'contrast'
                                ? '#FFFFFF'
                                : theme.primaryColor,
                          }}
                        >
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {block.props.ctaLabel && (
                  <span
                    className="inline-flex px-5 py-2.5 text-base font-semibold border"
                    style={{
                      borderColor: cardBorder,
                      borderRadius: theme.radius,
                      backgroundColor:
                        block.backgroundVariant === 'contrast'
                          ? 'rgba(255,255,255,0.06)'
                          : theme.backgroundColor,
                    }}
                  >
                    {block.props.ctaLabel}
                  </span>
                )}
              </div>
              <div
                className={
                  isStacked
                    ? 'w-full'
                    : isWideMedia && !isNarrowViewport
                      ? `col-span-7 ${block.props.imagePosition === 'left' ? 'order-1' : ''}`
                      : !isNarrowViewport && block.props.imagePosition === 'left'
                        ? 'order-1'
                        : ''
                }
              >
                <div
                  className="group/media overflow-hidden border"
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                    boxShadow:
                      block.backgroundVariant === 'contrast'
                        ? '0 32px 64px -24px rgba(0,0,0,0.6)'
                        : '0 2px 6px rgba(15,23,42,0.05), 0 28px 56px -26px rgba(15,23,42,0.24)',
                  }}
                >
                  <SafeMedia
                    src={block.props.imageUrl}
                    alt={block.props.imageAlt}
                    radius="0px"
                    zoomOnHover={hasMotion}
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {block.type === 'pricing' && (() => {
        const pricingLayout = block.props.layout || 'cards';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div className="max-w-[1160px] mx-auto">
              <div className="max-w-2xl mb-11">
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                {block.props.intro && (
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.intro}
                  </p>
                )}
              </div>

              {pricingLayout === 'rows' ? (
                <div className="space-y-4">
                  {block.props.tiers.map((tier, i) => (
                    <div
                      key={i}
                      className={`p-7 border grid gap-6 items-center ${
                        isNarrowViewport ? 'grid-cols-1' : 'grid-cols-12'
                      }`}
                      style={{
                        borderColor: tier.highlighted ? theme.primaryColor : cardBorder,
                        borderLeftWidth: tier.highlighted ? '3px' : '1px',
                        borderRadius: theme.radius,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.05)'
                            : theme.backgroundColor,
                      }}
                    >
                      <div className={isNarrowViewport ? '' : 'col-span-4'}>
                        {tier.highlighted && (
                          <p
                            className="text-xs font-bold tracking-wide mb-1"
                            style={{ color: theme.primaryColor }}
                          >
                            Recommended
                          </p>
                        )}
                        <h3 className="text-xl font-bold" style={displayStyle}>
                          {tier.name}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: mutedColor }}>
                          {tier.audience}
                        </p>
                        <div className="flex items-baseline gap-2 mt-3">
                          <span
                            className="text-3xl font-bold tabular-nums tracking-tight"
                            style={displayStyle}
                          >
                            {tier.price}
                          </span>
                          <span className="text-sm" style={{ color: mutedColor }}>
                            {tier.cadence}
                          </span>
                        </div>
                      </div>
                      <div className={isNarrowViewport ? '' : 'col-span-5'}>
                        <p className="text-sm mb-3" style={{ color: mutedColor }}>
                          {tier.description}
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          {tier.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-2">
                              <span className="font-bold shrink-0" style={{ color: theme.primaryColor }}>
                                ✓
                              </span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={isNarrowViewport ? '' : 'col-span-3 flex justify-end'}>
                        <span
                          className="w-full py-3 px-4 text-center text-sm font-semibold border whitespace-nowrap"
                          style={
                            tier.highlighted
                              ? {
                                  backgroundColor: theme.primaryColor,
                                  color: theme.accentTextColor,
                                  borderColor: theme.primaryColor,
                                  borderRadius: theme.radius,
                                }
                              : {
                                  borderColor: cardBorder,
                                  borderRadius: theme.radius,
                                }
                          }
                        >
                          {tier.ctaLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`grid gap-6 items-stretch ${
                    isNarrowViewport
                      ? 'grid-cols-1'
                      : pricingLayout === 'compact' || block.props.tiers.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                  }`}
                >
                  {block.props.tiers.map((tier, i) => (
                    <div
                      key={i}
                      className={`p-8 border flex flex-col ${hasMotion ? 'af-hover-lift' : ''}`}
                      style={{
                        borderColor: tier.highlighted ? theme.primaryColor : cardBorder,
                        borderTopWidth: tier.highlighted ? '3px' : '1px',
                        boxShadow: tier.highlighted
                          ? `0 24px 48px -22px color-mix(in srgb, ${theme.primaryColor} 28%, rgba(15,23,42,0.2))`
                          : block.backgroundVariant !== 'contrast'
                            ? '0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -18px rgba(15,23,42,0.1)'
                            : undefined,
                        borderRadius: theme.radius,
                        backgroundImage: tier.highlighted
                          ? `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${theme.primaryColor} 10%, transparent), transparent 55%)`
                          : undefined,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.05)'
                            : theme.backgroundColor,
                      }}
                    >
                      {tier.highlighted && (
                        <p
                          className="text-xs font-bold tracking-wide mb-2"
                          style={{ color: theme.primaryColor }}
                        >
                          Recommended
                        </p>
                      )}
                      <h3 className="text-xl font-bold" style={displayStyle}>
                        {tier.name}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: mutedColor }}>
                        {tier.audience}
                      </p>
                      <div className="flex items-baseline gap-2 my-5">
                        <span
                          className="text-4xl font-bold tabular-nums tracking-tight"
                          style={displayStyle}
                        >
                          {tier.price}
                        </span>
                        <span className="text-sm" style={{ color: mutedColor }}>
                          {tier.cadence}
                        </span>
                      </div>
                      <p className="text-base" style={{ color: mutedColor }}>
                        {tier.description}
                      </p>
                      <div
                        className="h-px my-5"
                        style={{ backgroundColor: cardBorder }}
                      />
                      <ul className="space-y-2.5 text-base mb-7 flex-1">
                        {tier.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2.5">
                            <span
                              className="w-5 h-5 mt-0.5 rounded-full inline-flex items-center justify-center text-[11px] font-bold shrink-0"
                              style={{
                                backgroundColor:
                                  block.backgroundVariant === 'contrast'
                                    ? 'rgba(255,255,255,0.14)'
                                    : `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
                                color:
                                  block.backgroundVariant === 'contrast'
                                    ? '#FFFFFF'
                                    : theme.primaryColor,
                              }}
                            >
                              ✓
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <span
                        className="w-full py-3 px-4 text-center text-base font-semibold border"
                        style={
                          tier.highlighted
                            ? {
                                backgroundColor: theme.primaryColor,
                                color: theme.accentTextColor,
                                borderColor: theme.primaryColor,
                                borderRadius: theme.radius,
                                boxShadow: `0 10px 22px -10px color-mix(in srgb, ${theme.primaryColor} 65%, transparent)`,
                              }
                            : {
                                borderColor: cardBorder,
                                borderRadius: theme.radius,
                              }
                        }
                      >
                        {tier.ctaLabel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {block.type === 'testimonial' && (() => {
        const tLayout = block.props.layout || 'editorial';
        const isCentered = tLayout === 'centered';
        const isCard = tLayout === 'card';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[940px] mx-auto ${isCentered ? 'text-center' : ''} ${
                isCard ? 'p-9 lg:p-12 border' : ''
              }`}
              style={
                isCard
                  ? {
                      borderColor: cardBorder,
                      borderTopWidth: '3px',
                      borderTopColor: theme.primaryColor,
                      borderRadius: theme.radius,
                      backgroundColor:
                        block.backgroundVariant === 'contrast'
                          ? 'rgba(255,255,255,0.05)'
                          : theme.backgroundColor,
                    }
                  : undefined
              }
            >
              <div
                className="text-5xl leading-none mb-3"
                style={{
                  ...displayStyle,
                  color:
                    block.backgroundVariant === 'contrast'
                      ? 'rgba(255,255,255,0.45)'
                      : theme.primaryColor,
                }}
                aria-hidden="true"
              >
                “
              </div>
              <blockquote
                className={`text-3xl lg:text-4xl font-medium leading-snug tracking-tight mb-7 ${
                  isCentered ? 'mx-auto max-w-3xl' : ''
                }`}
                style={displayStyle}
              >
                {block.props.quote}
              </blockquote>
              <div
                className={`pt-5 flex flex-wrap items-center gap-3 ${
                  isCentered ? 'justify-center flex-col' : 'justify-between'
                }`}
                style={{ borderTop: `1px solid ${cardBorder}` }}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 text-base">
                  <strong className="font-semibold">{block.props.authorName}</strong>
                  <span style={{ color: mutedColor }}>
                    {block.props.authorRole} · {block.props.company}
                  </span>
                </div>
                {block.props.outcome && (
                  <p className="text-sm font-medium" style={{ color: mutedColor }}>
                    {block.props.outcome}
                  </p>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {block.type === 'faq' && (() => {
        const faqLayout = block.props.layout || 'single';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`mx-auto ${
                faqLayout === 'single' ? 'max-w-[820px]' : 'max-w-[1160px]'
              }`}
            >
              {faqLayout === 'split' && !isNarrowViewport ? (
                <div className="grid grid-cols-12 gap-12 items-start">
                  <div className="col-span-4">
                    {block.props.eyebrow && (
                      <p
                        className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                        style={{ color: mutedColor }}
                      >
                        <span
                          className="w-5 h-0.5 shrink-0"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <span>{block.props.eyebrow}</span>
                      </p>
                    )}
                    <h2
                      className="text-3xl lg:text-4xl font-bold tracking-tight [text-wrap:balance]"
                      style={displayStyle}
                    >
                      {block.props.heading}
                    </h2>
                  </div>
                  <div className="col-span-8" style={{ borderTop: `1px solid ${cardBorder}` }}>
                    {block.props.items.map((item, i) => (
                      <div
                        key={i}
                        className="py-5"
                        style={{ borderBottom: `1px solid ${cardBorder}` }}
                      >
                        <div
                          className="font-semibold text-lg mb-2 flex items-center justify-between gap-4"
                          style={displayStyle}
                        >
                          <span>{item.question}</span>
                          <span className="text-xl font-normal shrink-0">+</span>
                        </div>
                        <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className={faqLayout === 'grid-2' ? 'max-w-2xl mb-10' : 'mb-8'}>
                    {block.props.eyebrow && (
                      <p
                        className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                        style={{ color: mutedColor }}
                      >
                        <span
                          className="w-5 h-0.5 shrink-0"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <span>{block.props.eyebrow}</span>
                      </p>
                    )}
                    <h2
                      className="text-3xl lg:text-4xl font-bold tracking-tight"
                      style={displayStyle}
                    >
                      {block.props.heading}
                    </h2>
                  </div>
                  {faqLayout === 'grid-2' ? (
                    <div
                      className={`grid gap-6 ${
                        isCompactViewport ? 'grid-cols-1' : 'grid-cols-2'
                      }`}
                    >
                      {block.props.items.map((item, i) => (
                        <div
                          key={i}
                          className="p-6 border"
                          style={{
                            borderColor: cardBorder,
                            borderRadius: theme.radius,
                            backgroundColor:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.05)'
                                : theme.backgroundColor,
                          }}
                        >
                          <div className="font-semibold text-lg mb-2" style={displayStyle}>
                            {item.question}
                          </div>
                          <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ borderTop: `1px solid ${cardBorder}` }}>
                      {block.props.items.map((item, i) => (
                        <div
                          key={i}
                          className="py-5"
                          style={{ borderBottom: `1px solid ${cardBorder}` }}
                        >
                          <div
                            className="font-semibold text-lg mb-2 flex items-center justify-between gap-4"
                            style={displayStyle}
                          >
                            <span>{item.question}</span>
                            <span className="text-xl font-normal shrink-0">+</span>
                          </div>
                          <p className="text-base leading-relaxed max-w-[66ch]" style={{ color: mutedColor }}>
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        );
      })()}

      {block.type === 'cta' && (() => {
        const ctaLayout = block.props.layout || 'panel';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[1160px] mx-auto ${
                ctaLayout === 'minimal'
                  ? 'py-10 border-y flex flex-wrap items-center justify-between gap-8'
                  : ctaLayout === 'centered'
                    ? 'p-10 lg:p-16 border flex flex-col items-center text-center gap-6'
                    : 'p-10 lg:p-14 border flex flex-wrap items-center justify-between gap-8'
              }`}
              style={{
                borderColor: cardBorder,
                borderRadius: ctaLayout === 'minimal' ? '0px' : theme.radius,
                backgroundImage:
                  ctaLayout !== 'minimal'
                    ? `radial-gradient(ellipse 75% 80% at 88% 12%, color-mix(in srgb, ${theme.primaryColor} ${
                        block.backgroundVariant === 'contrast' ? '22%' : '11%'
                      }, transparent), transparent 72%)`
                    : undefined,
                backgroundColor:
                  ctaLayout !== 'minimal' && block.backgroundVariant === 'contrast'
                    ? 'rgba(255,255,255,0.04)'
                    : undefined,
              }}
            >
              <div className={ctaLayout === 'centered' ? 'max-w-2xl' : 'max-w-xl'}>
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.headline}
                </h2>
                <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                  {block.props.description}
                </p>
              </div>
              <div
                className={`flex flex-wrap gap-3 ${
                  ctaLayout === 'centered' ? 'justify-center' : ''
                }`}
              >
                <span
                  className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.accentTextColor,
                    borderRadius: theme.radius,
                    boxShadow: `0 10px 24px -10px color-mix(in srgb, ${theme.primaryColor} 65%, transparent)`,
                  }}
                >
                  {block.props.primaryCtaLabel}
                </span>
                {block.props.secondaryCtaLabel && (
                  <span
                    className="px-6 py-3 text-base font-semibold border whitespace-nowrap"
                    style={{
                      borderColor: cardBorder,
                      borderRadius: theme.radius,
                      backgroundColor:
                        block.backgroundVariant === 'contrast'
                          ? 'rgba(255,255,255,0.08)'
                          : undefined,
                    }}
                  >
                    {block.props.secondaryCtaLabel}
                  </span>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {block.type === 'contact' && (() => {
        const contactLayout = block.props.layout || 'split';
        const isCentered = contactLayout === 'centered';
        const isReverse = contactLayout === 'split-reverse';
        const formMode = block.props.formMode || 'standard';
        const fields = getEffectiveContactFields(block.props);
        const step1Fields = fields.filter((f) => (f.step || 1) === 1);
        const step2Fields = fields.filter((f) => f.step === 2);
        const activeFields =
          formMode === 'multistep'
            ? contactStep === 1
              ? step1Fields.length > 0
                ? step1Fields
                : fields
              : step2Fields.length > 0
                ? step2Fields
                : fields
            : fields;

        const weekdays = getUpcomingWeekdays(isCompactViewport ? 4 : 6);
        const bookingSlots = getEffectiveBookingSlots(block.props);
        const activeDay = weekdays[bookingDayIdx] || weekdays[0];
        const durationLabel = block.props.booking?.durationLabel || '30 min';
        const timezoneLabel = block.props.booking?.timezone || 'EST (UTC-5)';
        const bookingHeading =
          block.props.booking?.stepHeading || 'Select a Consultation Date & Time';

        const renderPreviewField = (field: (typeof fields)[number]) => {
          if (field.type === 'checkbox') {
            return (
              <label
                key={field.id}
                className="flex items-start gap-2.5 text-sm cursor-pointer pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="w-4 h-4 mt-0.5 border bg-white shrink-0 inline-flex items-center justify-center"
                  style={{ borderColor: theme.borderColor, borderRadius: '4px' }}
                />
                <span>
                  {field.label}
                  {field.required && (
                    <span style={{ color: theme.primaryColor }}> *</span>
                  )}
                </span>
              </label>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.id}>
                <div className="text-sm font-medium mb-1">
                  {field.label}
                  {field.required && (
                    <span style={{ color: theme.primaryColor }}> *</span>
                  )}
                </div>
                <div
                  className="h-24 p-3.5 border text-sm bg-white text-black"
                  style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
                >
                  {field.placeholder || 'Share scope, timeline, and goals...'}
                </div>
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.id}>
                <div className="text-sm font-medium mb-1">
                  {field.label}
                  {field.required && (
                    <span style={{ color: theme.primaryColor }}> *</span>
                  )}
                </div>
                <div
                  className="h-11 px-3.5 border flex items-center justify-between text-sm bg-white text-black"
                  style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
                >
                  <span>
                    {field.options?.[0] || field.placeholder || 'Select an option'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </div>
              </div>
            );
          }

          return (
            <div key={field.id}>
              <div className="text-sm font-medium mb-1">
                {field.label}
                {field.required && (
                  <span style={{ color: theme.primaryColor }}> *</span>
                )}
              </div>
              <div
                className="h-11 px-3.5 border flex items-center text-sm bg-white text-black"
                style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
              >
                {field.placeholder ||
                  (field.type === 'email'
                    ? 'alex@company.com'
                    : field.type === 'tel'
                      ? '+1 (555) 234-5678'
                      : 'Enter response...')}
              </div>
            </div>
          );
        };

        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[1160px] mx-auto ${
                isCentered
                  ? 'max-w-2xl space-y-8'
                  : `grid gap-12 items-start ${isNarrowViewport ? 'grid-cols-1' : 'grid-cols-2'}`
              }`}
            >
              <div className={isCentered ? 'text-center' : isReverse && !isNarrowViewport ? 'order-2' : ''}>
                {block.props.eyebrow && (
                  <p
                    className={`inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3 ${
                      isCentered ? 'justify-center' : ''
                    }`}
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                <p className="text-base leading-relaxed mb-7" style={{ color: mutedColor }}>
                  {block.props.description}
                </p>
                <div
                  className={isCentered ? 'grid sm:grid-cols-2 text-left' : ''}
                  style={{ borderTop: `1px solid ${cardBorder}` }}
                >
                  <div className="py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <div className="text-sm font-semibold" style={{ color: mutedColor }}>
                      Email
                    </div>
                    <div className="font-medium mt-0.5 text-base">{block.props.email}</div>
                  </div>
                  <div className="py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <div className="text-sm font-semibold" style={{ color: mutedColor }}>
                      Studio
                    </div>
                    <div className="font-medium mt-0.5 text-base">{block.props.location}</div>
                  </div>
                </div>
              </div>
              <div
                className={`p-7 border space-y-4 ${
                  !isCentered && isReverse && !isNarrowViewport ? 'order-1' : ''
                }`}
                style={{
                  borderColor: cardBorder,
                  borderRadius: theme.radius,
                  boxShadow: '0 20px 44px -26px rgba(15,23,42,0.16)',
                  backgroundColor:
                    block.backgroundVariant === 'contrast'
                      ? 'rgba(255,255,255,0.06)'
                      : theme.backgroundColor,
                }}
              >
                {formMode === 'multistep' && (
                  <div
                    className="pb-3 flex items-center justify-between gap-3 border-b"
                    style={{ borderColor: cardBorder }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                      Step {contactStep} of 2 ·{' '}
                      {contactStep === 1 ? 'Your Details' : 'Project Scope'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactStep(st as 1 | 2);
                          }}
                          className="h-2 w-8 rounded-full transition-colors cursor-pointer"
                          style={{
                            backgroundColor:
                              contactStep >= st ? theme.primaryColor : cardBorder,
                          }}
                          aria-label={`Preview step ${st}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {formMode === 'booking' && (
                  <div
                    className="p-4 border space-y-3"
                    style={{
                      borderColor: cardBorder,
                      borderRadius: theme.radius,
                      backgroundColor:
                        block.backgroundVariant === 'contrast'
                          ? 'rgba(255,255,255,0.04)'
                          : theme.surfaceColor,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
                        <span>{bookingHeading}</span>
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs font-medium tabular-nums"
                        style={{ color: mutedColor }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {durationLabel} · {timezoneLabel}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`grid gap-1.5 ${
                        isCompactViewport ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-6'
                      }`}
                    >
                      {weekdays.map((day, dIdx) => {
                        const isPicked = bookingDayIdx === dIdx;
                        return (
                          <button
                            key={day.iso}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingDayIdx(dIdx);
                            }}
                            className="py-2 px-1.5 border text-center transition-colors cursor-pointer"
                            style={{
                              borderRadius: theme.radius,
                              borderColor: isPicked ? theme.primaryColor : cardBorder,
                              backgroundColor: isPicked
                                ? theme.primaryColor
                                : block.backgroundVariant === 'contrast'
                                  ? 'rgba(255,255,255,0.08)'
                                  : '#FFFFFF',
                              color: isPicked ? theme.accentTextColor : '#000000',
                            }}
                          >
                            <div className="text-[11px] font-medium opacity-80">
                              {day.weekday}
                            </div>
                            <div className="text-xs font-semibold tabular-nums">
                              {day.dayLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {bookingSlots.map((slot) => {
                        const isSlotPicked = bookingTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingTimeSlot(slot);
                            }}
                            className="px-2.5 py-1.5 border text-xs font-semibold tabular-nums transition-colors cursor-pointer"
                            style={{
                              borderRadius: theme.radius,
                              borderColor: isSlotPicked ? theme.primaryColor : cardBorder,
                              backgroundColor: isSlotPicked
                                ? theme.primaryColor
                                : block.backgroundVariant === 'contrast'
                                  ? 'rgba(255,255,255,0.08)'
                                  : '#FFFFFF',
                              color: isSlotPicked ? theme.accentTextColor : '#000000',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-medium"
                      style={{ color: mutedColor }}
                    >
                      <span>
                        Selected: <strong>{activeDay?.fullLabel}</strong> at{' '}
                        <strong>{bookingTimeSlot}</strong>
                      </span>
                      {block.props.booking?.externalBookingUrl && (
                        <span className="inline-flex items-center gap-1 underline">
                          {block.props.booking.externalBookingLabel || 'Open Calendar Link'}
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3.5">
                  {activeFields.map((field) => renderPreviewField(field))}
                </div>

                {formMode === 'multistep' ? (
                  <div className="flex items-center gap-2.5 pt-1">
                    {contactStep === 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactStep(1);
                        }}
                        className="px-4 py-3 text-sm font-semibold border cursor-pointer"
                        style={{
                          borderColor: cardBorder,
                          borderRadius: theme.radius,
                        }}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contactStep === 1) setContactStep(2);
                      }}
                      className="flex-1 inline-flex justify-center px-5 py-3 text-base font-semibold cursor-pointer"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.accentTextColor,
                        borderRadius: theme.radius,
                      }}
                    >
                      {contactStep === 1 ? 'Continue to Step 2' : block.props.submitLabel}
                    </button>
                  </div>
                ) : (
                  <span
                    className="w-full inline-flex justify-center px-5 py-3 text-base font-semibold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.accentTextColor,
                      borderRadius: theme.radius,
                    }}
                  >
                    {block.props.submitLabel}
                  </span>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {block.type === 'footer' && (() => {
        const footerLayout = block.props.layout || 'columns';
        return (
          <footer
            className="px-7"
            style={{
              paddingBlock: `${padY}px`,
              borderTop: `1px solid ${cardBorder}`,
            }}
          >
            <div className="max-w-[1160px] mx-auto">
              {footerLayout === 'centered' ? (
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="text-xl font-bold" style={displayStyle}>
                    {block.props.brandName}
                  </div>
                  <p className="text-base max-w-md leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.summary}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
                    {block.props.columns.flatMap((c) => c.links).map((l, li) => (
                      <span key={li}>{l.label}</span>
                    ))}
                  </div>
                  <div
                    className="w-full mt-4 pt-6 text-sm"
                    style={{
                      borderTop: `1px solid ${cardBorder}`,
                      color: mutedColor,
                    }}
                  >
                    {block.props.copyright}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`grid gap-10 ${
                      isNarrowViewport ? 'grid-cols-1' : 'grid-cols-4'
                    }`}
                  >
                    <div className={isNarrowViewport ? '' : 'col-span-2'}>
                      <div className="text-lg font-bold" style={displayStyle}>
                        {block.props.brandName}
                      </div>
                      <p
                        className="text-base mt-3 max-w-xs leading-relaxed"
                        style={{ color: mutedColor }}
                      >
                        {block.props.summary}
                      </p>
                    </div>
                    {block.props.columns.map((col, ci) => (
                      <div key={ci}>
                        <div className="text-sm font-semibold mb-3">{col.heading}</div>
                        <ul className="space-y-2.5 text-base" style={{ color: mutedColor }}>
                          {col.links.map((l, li) => (
                            <li key={li}>{l.label}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-10 pt-6 text-sm"
                    style={{
                      borderTop: `1px solid ${cardBorder}`,
                      color: mutedColor,
                    }}
                  >
                    {block.props.copyright}
                  </div>
                </>
              )}
            </div>
          </footer>
        );
      })()}

      {/* 1. Logo Cloud / Client Trust Bar */}
      {block.type === 'logocloud' && (() => {
        const logoLayout = block.props.layout || 'row';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[1160px] mx-auto ${
                logoLayout === 'compact' && !isNarrowViewport
                  ? 'grid grid-cols-12 gap-8 items-center'
                  : ''
              }`}
            >
              <div
                className={
                  logoLayout === 'compact' && !isNarrowViewport
                    ? 'col-span-4'
                    : 'flex flex-wrap items-baseline justify-between gap-4 mb-7'
                }
              >
                <h2
                  className="text-sm font-semibold tracking-wide inline-flex items-center gap-2.5"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.heading}</span>
                </h2>
                {block.props.caption && (
                  <p
                    className={`text-sm ${logoLayout === 'compact' ? 'mt-2' : ''}`}
                    style={{ color: mutedColor }}
                  >
                    {block.props.caption}
                  </p>
                )}
              </div>
              <div
                className={
                  logoLayout === 'compact'
                    ? `${isNarrowViewport ? 'mt-6' : 'col-span-8'} grid gap-4 ${
                        isCompactViewport ? 'grid-cols-2' : 'grid-cols-3'
                      }`
                    : logoLayout === 'cards'
                      ? `grid gap-4 ${
                          isCompactViewport
                            ? 'grid-cols-2'
                            : isNarrowViewport
                              ? 'grid-cols-3'
                              : 'grid-cols-6'
                        }`
                      : logoLayout === 'grid'
                        ? `grid gap-px border ${
                            isCompactViewport
                              ? 'grid-cols-2'
                              : isNarrowViewport
                                ? 'grid-cols-3'
                                : 'grid-cols-6'
                          }`
                        : `grid gap-6 py-6 border-y ${
                            isCompactViewport
                              ? 'grid-cols-2'
                              : isNarrowViewport
                                ? 'grid-cols-3'
                                : 'grid-cols-6'
                          }`
                }
                style={{
                  borderColor:
                    logoLayout === 'grid' || logoLayout === 'row' ? cardBorder : undefined,
                  backgroundColor: logoLayout === 'grid' ? cardBorder : 'transparent',
                  borderRadius: logoLayout === 'grid' ? theme.radius : undefined,
                  overflow: logoLayout === 'grid' ? 'hidden' : undefined,
                }}
              >
                {block.props.items.map((partner, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center text-center transition-opacity duration-200 opacity-80 hover:opacity-100 ${
                      logoLayout === 'grid'
                        ? 'px-4 py-6'
                        : logoLayout === 'cards' || logoLayout === 'compact'
                          ? 'px-4 py-5 border'
                          : 'px-2 py-2'
                    }`}
                    style={{
                      borderColor:
                        logoLayout === 'cards' || logoLayout === 'compact' ? cardBorder : undefined,
                      borderRadius:
                        logoLayout === 'cards' || logoLayout === 'compact' ? theme.radius : undefined,
                      backgroundColor:
                        logoLayout === 'grid'
                          ? block.backgroundVariant === 'contrast'
                            ? theme.contrastBgColor
                            : block.backgroundVariant === 'surface'
                              ? theme.surfaceColor
                              : theme.backgroundColor
                          : logoLayout === 'cards' || logoLayout === 'compact'
                            ? block.backgroundVariant === 'contrast'
                              ? 'rgba(255,255,255,0.05)'
                              : theme.backgroundColor
                            : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                        className="shrink-0 opacity-85"
                      >
                        {idx % 3 === 0 ? (
                          <rect
                            x="2"
                            y="2"
                            width="14"
                            height="14"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        ) : idx % 3 === 1 ? (
                          <circle
                            cx="9"
                            cy="9"
                            r="6.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        ) : (
                          <polygon
                            points="9,2 16,15 2,15"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            fill="none"
                          />
                        )}
                      </svg>
                      <span
                        className="text-base font-bold tracking-tight whitespace-nowrap"
                        style={displayStyle}
                      >
                        {partner.name}
                      </span>
                    </div>
                    {partner.sector && (
                      <span
                        className="text-xs mt-1 whitespace-nowrap"
                        style={{ color: mutedColor }}
                      >
                        {partner.sector}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 2. Portfolio / Case Study Grid */}
      {block.type === 'portfolio' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[1160px] mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                {block.props.intro && (
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.intro}
                  </p>
                )}
              </div>

              {portfolioCategories.length > 2 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center gap-1 p-1 border"
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                    backgroundColor:
                      block.backgroundVariant === 'contrast'
                        ? 'rgba(255,255,255,0.06)'
                        : theme.surfaceColor,
                  }}
                >
                  {portfolioCategories.map((cat) => {
                    const active = portfolioFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPortfolioFilter(cat)}
                        className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                        style={
                          active
                            ? {
                                backgroundColor: theme.primaryColor,
                                color: theme.accentTextColor,
                                borderRadius: theme.radius,
                              }
                            : {
                                backgroundColor: 'transparent',
                                color:
                                  block.backgroundVariant === 'contrast'
                                    ? '#FFFFFF'
                                    : theme.textColor,
                                borderRadius: theme.radius,
                              }
                        }
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {(() => {
              const pLayout = block.props.layout || 'grid';
              const filteredItems = block.props.items.filter(
                (item) =>
                  portfolioFilter === 'All' || item.category.trim() === portfolioFilter
              );

              if (pLayout === 'rows') {
                return (
                  <div className="space-y-6">
                    {filteredItems.map((item, idx) => (
                      <article
                        key={`${item.title}-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(block.id);
                          setActiveCaseStudy(item);
                        }}
                        className={`group/media border overflow-hidden grid cursor-pointer ${
                          isNarrowViewport ? 'grid-cols-1' : 'grid-cols-12'
                        } ${hasMotion ? 'af-hover-lift' : ''}`}
                        style={{
                          borderColor: cardBorder,
                          borderRadius: theme.radius,
                          backgroundColor:
                            block.backgroundVariant === 'contrast'
                              ? 'rgba(255,255,255,0.05)'
                              : theme.backgroundColor,
                        }}
                      >
                        <div
                          className={`overflow-hidden ${
                            isNarrowViewport ? 'border-b' : 'col-span-5 border-r'
                          }`}
                          style={{ borderColor: cardBorder }}
                        >
                          <SafeMedia
                            src={item.imageUrl}
                            alt={item.imageAlt || item.title}
                            radius="0px"
                            zoomOnHover={hasMotion}
                          />
                        </div>
                        <div className={`p-7 flex flex-col justify-between ${isNarrowViewport ? '' : 'col-span-7'}`}>
                          <div>
                            <div
                              className="flex items-center gap-2 text-xs font-medium mb-2"
                              style={{ color: mutedColor }}
                            >
                              <span>{item.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.client}</span>
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight mb-2" style={displayStyle}>
                              {item.title}
                            </h3>
                            <p
                              className="text-sm font-bold tabular-nums mb-3"
                              style={{
                                color:
                                  block.backgroundVariant === 'contrast'
                                    ? '#FFFFFF'
                                    : theme.primaryColor,
                              }}
                            >
                              {item.metric}
                            </p>
                            <p className="text-base leading-relaxed mb-5" style={{ color: mutedColor }}>
                              {item.summary}
                            </p>
                          </div>
                          <div
                            className="pt-3.5 flex items-center justify-between text-sm font-semibold"
                            style={{ borderTop: `1px solid ${cardBorder}` }}
                          >
                            <span>Inspect Case Study</span>
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  className={`grid gap-6 ${
                    isCompactViewport
                      ? 'grid-cols-1'
                      : isNarrowViewport
                        ? 'grid-cols-2'
                        : pLayout === 'bento'
                          ? 'grid-cols-3'
                          : block.props.columns === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                  }`}
                >
                  {filteredItems.map((item, idx) => {
                    const isMarquee = pLayout === 'bento' && idx === 0 && !isCompactViewport;
                    return (
                      <article
                        key={`${item.title}-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(block.id);
                          setActiveCaseStudy(item);
                        }}
                        className={`group/media border overflow-hidden flex flex-col cursor-pointer ${
                          isMarquee ? 'col-span-2' : ''
                        } ${hasMotion ? 'af-hover-lift' : ''}`}
                        style={{
                          borderColor: cardBorder,
                          borderRadius: theme.radius,
                          boxShadow:
                            block.backgroundVariant !== 'contrast'
                              ? '0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -18px rgba(15,23,42,0.12)'
                              : undefined,
                          backgroundColor:
                            block.backgroundVariant === 'contrast'
                              ? 'rgba(255,255,255,0.05)'
                              : theme.backgroundColor,
                        }}
                      >
                        <div className="overflow-hidden border-b" style={{ borderColor: cardBorder }}>
                          <SafeMedia
                            src={item.imageUrl}
                            alt={item.imageAlt || item.title}
                            radius="0px"
                            zoomOnHover={hasMotion}
                          />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div
                            className="flex items-center gap-2 text-xs font-medium mb-2"
                            style={{ color: mutedColor }}
                          >
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.client}</span>
                          </div>
                          <h3
                            className={`${isMarquee ? 'text-2xl' : 'text-xl'} font-bold tracking-tight mb-2`}
                            style={displayStyle}
                          >
                            {item.title}
                          </h3>
                          <p
                            className="text-sm font-bold tabular-nums mb-3"
                            style={{
                              color:
                                block.backgroundVariant === 'contrast'
                                  ? '#FFFFFF'
                                  : theme.primaryColor,
                            }}
                          >
                            {item.metric}
                          </p>
                          <p
                            className="text-sm leading-relaxed flex-1 mb-4"
                            style={{ color: mutedColor }}
                          >
                            {item.summary}
                          </p>
                          <div
                            className="pt-3.5 flex items-center justify-between text-sm font-semibold"
                            style={{ borderTop: `1px solid ${cardBorder}` }}
                          >
                            <span>Inspect Case Study</span>
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Case Study Detail Modal inside Canvas Preview */}
          {activeCaseStudy && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveCaseStudy(null);
              }}
              className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white text-black border border-[#DAD4C6] rounded-xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-[#DAD4C6] bg-[#FAF9F5] flex items-center justify-between gap-4 shrink-0">
                  <div className="text-xs font-medium text-black">
                    {activeCaseStudy.category} · {activeCaseStudy.client}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCaseStudy(null)}
                    aria-label="Close case study"
                    className="p-1.5 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC] text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto studio-scroll p-6 space-y-5">
                  <div className="overflow-hidden rounded-lg border border-[#DAD4C6]">
                    <SafeMedia
                      src={activeCaseStudy.imageUrl}
                      alt={activeCaseStudy.imageAlt || activeCaseStudy.title}
                      radius="0px"
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold tabular-nums mb-1"
                      style={{ color: theme.primaryColor }}
                    >
                      {activeCaseStudy.metric}
                    </p>
                    <h3
                      className="text-2xl font-bold tracking-tight text-black"
                      style={displayStyle}
                    >
                      {activeCaseStudy.title}
                    </h3>
                    <p className="text-base text-black leading-relaxed mt-2">
                      {activeCaseStudy.summary}
                    </p>
                  </div>
                  {(activeCaseStudy.challenge || activeCaseStudy.outcome) && (
                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[#DAD4C6]">
                      {activeCaseStudy.challenge && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-black/70 mb-1">
                            Challenge
                          </div>
                          <p className="text-sm text-black leading-relaxed">
                            {activeCaseStudy.challenge}
                          </p>
                        </div>
                      )}
                      {activeCaseStudy.outcome && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-black/70 mb-1">
                            Outcome
                          </div>
                          <p className="text-sm text-black leading-relaxed">
                            {activeCaseStudy.outcome}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-[#DAD4C6] bg-[#FAF9F5] flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCaseStudy(null)}
                    className="px-4 py-2 rounded-lg border border-[#DAD4C6] bg-white text-sm font-semibold text-black cursor-pointer"
                  >
                    Close
                  </button>
                  {activeCaseStudy.linkLabel && (
                    <span
                      className="px-4 py-2 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.accentTextColor,
                        borderRadius: theme.radius,
                      }}
                    >
                      {activeCaseStudy.linkLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Video / Interactive Demo Showcase */}
      {block.type === 'video' && (() => {
        const videoSource = resolveVideoSource(block.props.videoUrl);
        const vLayout = block.props.layout || 'split-right';
        const isCentered = vLayout === 'centered';
        const isLeft = vLayout === 'split-left';
        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div
              className={`max-w-[1160px] mx-auto ${
                isCentered
                  ? 'flex flex-col items-center text-center gap-10'
                  : `grid gap-10 items-center ${isNarrowViewport ? 'grid-cols-1' : 'grid-cols-12'}`
              }`}
            >
              <div
                className={
                  isCentered
                    ? 'max-w-2xl'
                    : isNarrowViewport
                      ? ''
                      : isLeft
                        ? 'col-span-5 order-2'
                        : 'col-span-5'
                }
              >
                {block.props.eyebrow && (
                  <p
                    className={`inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3 ${
                      isCentered ? 'justify-center' : ''
                    }`}
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                <p
                  className="text-base leading-relaxed mb-6"
                  style={{ color: mutedColor }}
                >
                  {block.props.description}
                </p>
                {block.props.highlights.length > 0 && (
                  <ul
                    className={`space-y-2.5 text-sm mb-7 ${
                      isCentered ? 'inline-flex flex-col items-start text-left' : ''
                    }`}
                    style={{ color: mutedColor }}
                  >
                    {block.props.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 mt-0.5 rounded-full inline-flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            backgroundColor:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.14)'
                                : `color-mix(in srgb, ${theme.primaryColor} 13%, transparent)`,
                            color:
                              block.backgroundVariant === 'contrast'
                                ? '#FFFFFF'
                                : theme.primaryColor,
                          }}
                        >
                          ✓
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {block.props.ctaLabel && (
                  <div className={isCentered ? 'mt-2' : ''}>
                    <span
                      className="inline-flex px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.accentTextColor,
                        borderRadius: theme.radius,
                      }}
                    >
                      {block.props.ctaLabel}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={
                  isCentered
                    ? 'w-full max-w-4xl'
                    : isNarrowViewport
                      ? ''
                      : isLeft
                        ? 'col-span-7 order-1'
                        : 'col-span-7'
                }
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="relative aspect-video overflow-hidden border bg-black"
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                    boxShadow: '0 28px 56px -24px rgba(0,0,0,0.45)',
                  }}
                >
                  {!videoPlaying ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(block.id);
                        setVideoPlaying(true);
                      }}
                      className="group/vid relative w-full h-full block text-left cursor-pointer"
                    >
                      {block.props.posterUrl ? (
                        <img
                          src={block.props.posterUrl}
                          alt={block.props.posterAlt || block.props.heading}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            hasMotion
                              ? 'transition-transform duration-700 ease-out group-hover/vid:scale-[1.03]'
                              : ''
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900" />
                      )}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/15"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                        <span
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover/vid:scale-105"
                          style={{
                            backgroundColor: theme.primaryColor,
                            color: theme.accentTextColor,
                          }}
                        >
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </span>
                        <span className="mt-4 text-sm font-semibold tracking-wide">
                          {block.props.durationLabel || 'Watch Interactive Walkthrough'} ·{' '}
                          {videoSource.provider}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      {videoSource.kind === 'iframe' ? (
                        <iframe
                          src={videoSource.src}
                          title={block.props.heading}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      ) : videoSource.kind === 'video' ? (
                        <video
                          src={videoSource.src}
                          poster={block.props.posterUrl}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white gap-3">
                          <p className="text-sm">
                            External video link configured:{' '}
                            <span className="font-mono underline">{videoSource.src || 'None'}</span>
                          </p>
                          {videoSource.src && (
                            <a
                              href={videoSource.src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5"
                              style={{
                                backgroundColor: theme.primaryColor,
                                color: theme.accentTextColor,
                                borderRadius: theme.radius,
                              }}
                            >
                              <span>Open Video</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setVideoPlaying(false)}
                        title="Return to poster frame"
                        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-black/75 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 cursor-pointer border border-white/20"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Poster</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 4. Team / Leadership Grid */}
      {block.type === 'team' && (() => {
        const tLayout = block.props.layout || 'cards';
        const gridCols = isCompactViewport
          ? 'grid-cols-1'
          : isNarrowViewport
            ? 'grid-cols-2'
            : block.props.columns === 4
              ? 'grid-cols-4'
              : block.props.columns === 2
                ? 'grid-cols-2'
                : 'grid-cols-3';

        return (
          <section
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div className="max-w-[1160px] mx-auto">
              <div className="max-w-2xl mb-11">
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                {block.props.intro && (
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.intro}
                  </p>
                )}
              </div>

              {tLayout === 'horizontal' ? (
                <div
                  className={`grid gap-6 ${
                    isNarrowViewport ? 'grid-cols-1' : 'grid-cols-2'
                  }`}
                >
                  {block.props.members.map((member, idx) => (
                    <article
                      key={idx}
                      className="p-5 border flex items-start gap-5"
                      style={{
                        borderColor: cardBorder,
                        borderRadius: theme.radius,
                        boxShadow:
                          block.backgroundVariant !== 'contrast'
                            ? '0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -18px rgba(15,23,42,0.11)'
                            : undefined,
                        backgroundColor:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.05)'
                            : theme.backgroundColor,
                      }}
                    >
                      <div
                        className="w-24 h-24 shrink-0 overflow-hidden border bg-slate-100"
                        style={{ borderColor: cardBorder, borderRadius: theme.radius }}
                      >
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.imageAlt || member.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-black">
                            {member.name}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold tracking-tight" style={displayStyle}>
                          {member.name}
                        </h3>
                        <p
                          className="text-sm font-medium mt-0.5 mb-2"
                          style={{
                            color:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.85)'
                                : theme.primaryColor,
                          }}
                        >
                          {member.role}
                        </p>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: mutedColor }}>
                          {member.bio}
                        </p>
                        {(member.linkedinUrl || member.xUrl || member.websiteUrl) && (
                          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                            {member.linkedinUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>LinkedIn</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                            {member.xUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>X</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                            {member.websiteUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>Portfolio</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={`grid gap-6 ${gridCols}`}>
                  {block.props.members.map((member, idx) => (
                    <article
                      key={idx}
                      className={`group/media flex flex-col ${
                        tLayout === 'minimal' ? '' : 'border overflow-hidden'
                      } ${tLayout !== 'minimal' && hasMotion ? 'af-hover-lift' : ''}`}
                      style={
                        tLayout === 'minimal'
                          ? undefined
                          : {
                              borderColor: cardBorder,
                              borderRadius: theme.radius,
                              boxShadow:
                                block.backgroundVariant !== 'contrast'
                                  ? '0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -18px rgba(15,23,42,0.12)'
                                  : undefined,
                              backgroundColor:
                                block.backgroundVariant === 'contrast'
                                  ? 'rgba(255,255,255,0.05)'
                                  : theme.backgroundColor,
                            }
                      }
                    >
                      <div
                        className={`aspect-square overflow-hidden bg-slate-100 ${
                          tLayout === 'minimal' ? 'border mb-4' : 'border-b'
                        }`}
                        style={{
                          borderColor: cardBorder,
                          borderRadius: tLayout === 'minimal' ? theme.radius : undefined,
                        }}
                      >
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.imageAlt || member.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover object-top ${
                              hasMotion
                                ? 'transition-transform duration-500 ease-out group-hover/media:scale-[1.03]'
                                : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-black">
                            {member.name}
                          </div>
                        )}
                      </div>
                      <div className={`${tLayout === 'minimal' ? '' : 'p-6'} flex-1 flex flex-col`}>
                        <h3
                          className="text-xl font-bold tracking-tight"
                          style={displayStyle}
                        >
                          {member.name}
                        </h3>
                        <p
                          className="text-sm font-medium mt-1 mb-3"
                          style={{
                            color:
                              block.backgroundVariant === 'contrast'
                                ? 'rgba(255,255,255,0.85)'
                                : theme.primaryColor,
                          }}
                        >
                          {member.role}
                        </p>
                        <p
                          className="text-sm leading-relaxed flex-1 mb-4"
                          style={{ color: mutedColor }}
                        >
                          {member.bio}
                        </p>
                        {(member.linkedinUrl || member.xUrl || member.websiteUrl) && (
                          <div
                            className="pt-3 flex flex-wrap items-center gap-3 text-xs font-semibold"
                            style={{ borderTop: `1px solid ${cardBorder}` }}
                          >
                            {member.linkedinUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>LinkedIn</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                            {member.xUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>X</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                            {member.websiteUrl && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>Portfolio</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* 5. Interactive ROI / Pricing Calculator */}
      {block.type === 'calculator' && (() => {
        const calcLayout = block.props.layout || 'split';
        const cur = block.props.currencySymbol || '$';
        const grossValue = calcPrimary * calcSecondary * block.props.hourlyRate;
        const monthlyCost =
          block.props.baseMonthlyFee +
          calcPrimary * block.props.monthlyPlatformCostPerPrimary;
        const netMonthly = Math.max(0, grossValue - monthlyCost);
        const annualNet = netMonthly * 12;
        const roiMult =
          monthlyCost > 0 ? Math.max(1, grossValue / monthlyCost) : 1;
        const annualHours = calcPrimary * calcSecondary * 12;

        return (
          <section
            id="calculator"
            className={`px-7 ${enterAnimClass}`}
            style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
          >
            <div className="max-w-[1160px] mx-auto">
              <div className="max-w-2xl mb-10">
                {block.props.eyebrow && (
                  <p
                    className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.eyebrow}</span>
                  </p>
                )}
                <h2
                  className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                  style={displayStyle}
                >
                  {block.props.heading}
                </h2>
                {block.props.intro && (
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {block.props.intro}
                  </p>
                )}
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(block.id);
                }}
                className={
                  calcLayout === 'stacked'
                    ? 'grid grid-cols-1 gap-6'
                    : `grid gap-8 items-stretch ${
                        isNarrowViewport ? 'grid-cols-1' : 'grid-cols-12'
                      }`
                }
              >
                {/* Controls Column */}
                <div
                  className={`p-7 border flex flex-col justify-between gap-7 ${
                    calcLayout === 'stacked'
                      ? ''
                      : isNarrowViewport
                        ? ''
                        : calcLayout === 'split-reverse'
                          ? 'col-span-7 order-2'
                          : 'col-span-7'
                  }`}
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                    boxShadow:
                      block.backgroundVariant !== 'contrast'
                        ? '0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -18px rgba(15,23,42,0.11)'
                        : undefined,
                    backgroundColor:
                      block.backgroundVariant === 'contrast'
                        ? 'rgba(255,255,255,0.05)'
                        : theme.backgroundColor,
                  }}
                >
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-baseline justify-between gap-4 mb-2.5">
                        <label className="text-sm font-semibold">
                          {block.props.primaryInputLabel}
                        </label>
                        <span
                          className="text-xl font-bold tabular-nums"
                          style={displayStyle}
                        >
                          {calcPrimary.toLocaleString()} {block.props.primaryUnitLabel}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={block.props.primaryMin}
                        max={block.props.primaryMax}
                        step={block.props.primaryStep}
                        value={calcPrimary}
                        onChange={(e) => setCalcPrimary(Number(e.target.value))}
                        className="w-full cursor-pointer"
                        style={{ accentColor: theme.primaryColor }}
                      />
                      <div
                        className="flex justify-between text-xs tabular-nums mt-1"
                        style={{ color: mutedColor }}
                      >
                        <span>{block.props.primaryMin}</span>
                        <span>{block.props.primaryMax}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-4 mb-2.5">
                        <label className="text-sm font-semibold">
                          {block.props.secondaryInputLabel}
                        </label>
                        <span
                          className="text-xl font-bold tabular-nums"
                          style={displayStyle}
                        >
                          {calcSecondary.toLocaleString()} {block.props.secondaryUnitLabel}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={block.props.secondaryMin}
                        max={block.props.secondaryMax}
                        step={block.props.secondaryStep}
                        value={calcSecondary}
                        onChange={(e) => setCalcSecondary(Number(e.target.value))}
                        className="w-full cursor-pointer"
                        style={{ accentColor: theme.primaryColor }}
                      />
                      <div
                        className="flex justify-between text-xs tabular-nums mt-1"
                        style={{ color: mutedColor }}
                      >
                        <span>{block.props.secondaryMin}</span>
                        <span>{block.props.secondaryMax}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="pt-5 grid grid-cols-3 gap-4 text-sm tabular-nums"
                    style={{ borderTop: `1px solid ${cardBorder}` }}
                  >
                    <div>
                      <div className="text-xs" style={{ color: mutedColor }}>
                        Assumed Hourly Rate
                      </div>
                      <div className="font-bold mt-0.5">
                        {cur}
                        {block.props.hourlyRate}/hr
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: mutedColor }}>
                        Estimated Plan Cost
                      </div>
                      <div className="font-bold mt-0.5">
                        {cur}
                        {monthlyCost.toLocaleString()}/mo
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: mutedColor }}>
                        Hours Reclaimed / Yr
                      </div>
                      <div className="font-bold mt-0.5">
                        {annualHours.toLocaleString()} hrs
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcome Readout Column */}
                <div
                  className={`p-7 border flex flex-col justify-between gap-6 ${
                    calcLayout === 'stacked'
                      ? ''
                      : isNarrowViewport
                        ? ''
                        : calcLayout === 'split-reverse'
                          ? 'col-span-5 order-1'
                          : 'col-span-5'
                  }`}
                  style={{
                    borderColor: theme.primaryColor,
                    borderTopWidth: '3px',
                    borderRadius: theme.radius,
                    backgroundImage: `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${theme.primaryColor} 10%, transparent), transparent 56%)`,
                    boxShadow:
                      block.backgroundVariant !== 'contrast'
                        ? `0 22px 46px -22px color-mix(in srgb, ${theme.primaryColor} 26%, rgba(15,23,42,0.2))`
                        : undefined,
                    backgroundColor:
                      block.backgroundVariant === 'contrast'
                        ? 'rgba(255,255,255,0.08)'
                        : theme.surfaceColor,
                  }}
                >
                  <div>
                    <p
                      className="text-sm font-semibold mb-2"
                      style={{
                        color:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.88)'
                            : theme.primaryColor,
                      }}
                    >
                      {block.props.roiHeadlineLabel}
                    </p>
                    <div
                      className="text-4xl lg:text-5xl font-bold tracking-tight tabular-nums"
                      style={displayStyle}
                    >
                      {cur}
                      {netMonthly.toLocaleString()}
                      <span className="text-lg font-medium opacity-75"> / mo</span>
                    </div>
                  </div>

                  <div
                    className="space-y-3 py-4 text-sm tabular-nums"
                    style={{
                      borderTop: `1px solid ${cardBorder}`,
                      borderBottom: `1px solid ${cardBorder}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: mutedColor }}>Annualized Net Impact</span>
                      <span className="font-bold text-base">
                        {cur}
                        {annualNet.toLocaleString()} / yr
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: mutedColor }}>Gross Output Value</span>
                      <span className="font-semibold">
                        {cur}
                        {grossValue.toLocaleString()} / mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: mutedColor }}>Projected Return Multiple</span>
                      <span className="font-bold">{roiMult.toFixed(1)}x ROI</span>
                    </div>
                  </div>

                  {block.props.ctaLabel && (
                    <span
                      className="w-full py-3 px-5 text-center text-base font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: theme.accentTextColor,
                        borderRadius: theme.radius,
                      }}
                    >
                      {block.props.ctaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
};
