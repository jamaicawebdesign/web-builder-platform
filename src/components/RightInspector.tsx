import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Copy,
  Crosshair,
  Globe,
  GripVertical,
  Layers,
  Link2,
  Megaphone,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Webhook,
} from 'lucide-react';
import { STUDIO_IMAGES } from '../data/presets';
import {
  BackgroundVariant,
  ContactFieldType,
  ContactFormField,
  PaddingSize,
  SiteAutomationsConfig,
  SiteBlock,
  SiteProject,
  SiteSeo,
} from '../types/builder';
import {
  DEFAULT_BOOKING_SLOTS,
  getEffectiveBookingSlots,
  getEffectiveContactFields,
  slugifyFieldName,
} from '../utils/contactForm';
import { ensureProjectPages } from '../utils/sitePages';

export type RightInspectorTab = 'inspector' | 'seo';

interface RightInspectorProps {
  project: SiteProject;
  blocks: SiteBlock[];
  selectedBlock: SiteBlock | null;
  isRefining: boolean;
  refineError: string | null;
  onSelectBlock: (id: string | null) => void;
  onJumpToBlock?: (id: string) => void;
  onMoveBlock: (index: number, direction: -1 | 1) => void;
  onDuplicateBlock?: (id: string) => void;
  onUpdateBlock: (updated: SiteBlock) => void;
  onRefineBlock: (block: SiteBlock, instruction: string) => Promise<void>;
  onDeleteBlock: (id: string) => void;
  onUpdateSeo: (patch: Partial<SiteSeo>) => void;
  onUpdateAutomations?: (patch: Partial<SiteAutomationsConfig>) => void;
  onOpenMarketing?: () => void;
  onOpenDomains?: () => void;
  requestedTab?: { tab: RightInspectorTab; nonce: number } | null;
}

function TextInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-black mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        />
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-black mb-1">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
        className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm font-mono text-black tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
      />
    </div>
  );
}

function ImageAssetPicker({
  value,
  alt,
  onChangeUrl,
  onChangeAlt,
}: {
  value: string;
  alt: string;
  onChangeUrl: (url: string) => void;
  onChangeAlt: (alt: string) => void;
}) {
  return (
    <div className="space-y-2.5 pt-2 border-t border-slate-200">
      <div className="text-[13px] font-semibold text-black">
        Media Asset
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STUDIO_IMAGES.map((asset) => {
          const active = value === asset.url;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                onChangeUrl(asset.url);
                if (!alt) onChangeAlt(asset.alt);
              }}
              className={`text-left rounded-lg overflow-hidden border transition-all cursor-pointer ${
                active
                  ? 'border-blue-600 ring-2 ring-blue-600/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img
                src={asset.url}
                alt={asset.alt}
                referrerPolicy="no-referrer"
                className="w-full h-14 object-cover"
              />
              <div className="px-2 py-1 text-xs font-medium text-black truncate bg-white">
                {asset.label}
              </div>
            </button>
          );
        })}
      </div>
      <TextInput label="Custom Image URL" value={value} onChange={onChangeUrl} />
      <TextInput label="Alt Description" value={alt} onChange={onChangeAlt} />
    </div>
  );
}

type LayoutGlyphKind =
  | 'split-right'
  | 'split-left'
  | 'centered'
  | 'banner'
  | 'cards'
  | 'bento'
  | 'minimal'
  | 'numbered'
  | 'strip'
  | 'grid-2'
  | 'rows'
  | 'stacked'
  | 'wide-media'
  | 'panel'
  | 'columns';

function LayoutGlyph({ kind, active }: { kind: LayoutGlyphKind; active: boolean }) {
  const stroke = active ? '#1D4ED8' : '#334155';
  const fillMuted = active ? 'rgba(29, 78, 216, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const fillStrong = active ? 'rgba(29, 78, 216, 0.28)' : 'rgba(15, 23, 42, 0.18)';

  return (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="0.75" y="0.75" width="34.5" height="20.5" rx="2.5" stroke={stroke} strokeOpacity="0.35" strokeWidth="1" />
      {kind === 'split-right' && (
        <>
          <rect x="4" y="6" width="12" height="2.5" rx="1" fill={stroke} />
          <rect x="4" y="10.5" width="10" height="1.5" rx="0.75" fill={fillStrong} />
          <rect x="4" y="14" width="6" height="2.5" rx="1" fill={fillStrong} />
          <rect x="19" y="4" width="13" height="14" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'split-left' && (
        <>
          <rect x="4" y="4" width="13" height="14" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="20" y="6" width="12" height="2.5" rx="1" fill={stroke} />
          <rect x="20" y="10.5" width="10" height="1.5" rx="0.75" fill={fillStrong} />
          <rect x="20" y="14" width="6" height="2.5" rx="1" fill={fillStrong} />
        </>
      )}
      {kind === 'wide-media' && (
        <>
          <rect x="4" y="6" width="9" height="2.2" rx="1" fill={stroke} />
          <rect x="4" y="10" width="8" height="1.5" rx="0.75" fill={fillStrong} />
          <rect x="4" y="13.5" width="5" height="2.5" rx="1" fill={fillStrong} />
          <rect x="15" y="3.5" width="17" height="15" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'centered' && (
        <>
          <rect x="10" y="4.5" width="16" height="2.5" rx="1" fill={stroke} />
          <rect x="8" y="8.5" width="20" height="1.5" rx="0.75" fill={fillStrong} />
          <rect x="11" y="12" width="14" height="6.5" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'banner' && (
        <>
          <rect x="2.5" y="2.5" width="31" height="17" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="5" y="10.5" width="15" height="2.5" rx="1" fill={stroke} />
          <rect x="5" y="14.5" width="9" height="2.2" rx="1" fill={fillStrong} />
        </>
      )}
      {kind === 'cards' && (
        <>
          <rect x="3.5" y="4.5" width="8.5" height="13" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="13.75" y="4.5" width="8.5" height="13" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="24" y="4.5" width="8.5" height="13" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'bento' && (
        <>
          <rect x="3.5" y="4" width="18.5" height="6.5" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="23.5" y="4" width="9" height="6.5" rx="1.2" fill={fillStrong} stroke={stroke} strokeWidth="1" />
          <rect x="3.5" y="12" width="9" height="6" rx="1.2" fill={fillStrong} stroke={stroke} strokeWidth="1" />
          <rect x="14" y="12" width="18.5" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'minimal' && (
        <>
          <line x1="4" y1="6.5" x2="32" y2="6.5" stroke={stroke} strokeWidth="1.2" />
          <line x1="4" y1="11" x2="32" y2="11" stroke={stroke} strokeOpacity="0.45" strokeWidth="1" />
          <line x1="4" y1="15.5" x2="32" y2="15.5" stroke={stroke} strokeOpacity="0.45" strokeWidth="1" />
        </>
      )}
      {kind === 'numbered' && (
        <>
          <rect x="4" y="5" width="4" height="2.5" rx="0.7" fill={stroke} />
          <rect x="10" y="5" width="21" height="2.5" rx="0.7" fill={fillStrong} />
          <rect x="4" y="10" width="4" height="2.5" rx="0.7" fill={stroke} />
          <rect x="10" y="10" width="21" height="2.5" rx="0.7" fill={fillStrong} />
          <rect x="4" y="15" width="4" height="2.5" rx="0.7" fill={stroke} />
          <rect x="10" y="15" width="17" height="2.5" rx="0.7" fill={fillStrong} />
        </>
      )}
      {kind === 'strip' && (
        <>
          <line x1="3" y1="5.5" x2="33" y2="5.5" stroke={stroke} strokeWidth="1" />
          <line x1="3" y1="16.5" x2="33" y2="16.5" stroke={stroke} strokeWidth="1" />
          <line x1="13" y1="5.5" x2="13" y2="16.5" stroke={stroke} strokeOpacity="0.4" strokeWidth="1" />
          <line x1="23" y1="5.5" x2="23" y2="16.5" stroke={stroke} strokeOpacity="0.4" strokeWidth="1" />
          <rect x="5" y="9" width="5.5" height="4" rx="0.8" fill={stroke} />
          <rect x="15.2" y="9" width="5.5" height="4" rx="0.8" fill={stroke} />
          <rect x="25.5" y="9" width="5.5" height="4" rx="0.8" fill={stroke} />
        </>
      )}
      {kind === 'grid-2' && (
        <>
          <rect x="4" y="4" width="13" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="19" y="4" width="13" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="4" y="12" width="13" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="19" y="12" width="13" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'rows' && (
        <>
          <rect x="3.5" y="4" width="29" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="3.5" y="12" width="29" height="6" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'stacked' && (
        <>
          <rect x="5" y="4" width="26" height="5" rx="1.2" fill={fillStrong} />
          <rect x="5" y="11" width="26" height="7.5" rx="1.2" fill={fillMuted} stroke={stroke} strokeWidth="1" />
        </>
      )}
      {kind === 'panel' && (
        <>
          <rect x="3.5" y="4.5" width="29" height="13" rx="1.5" fill={fillMuted} stroke={stroke} strokeWidth="1" />
          <rect x="6" y="8" width="13" height="2.5" rx="0.8" fill={stroke} />
          <rect x="22" y="8.5" width="8" height="4.5" rx="1" fill={fillStrong} />
        </>
      )}
      {kind === 'columns' && (
        <>
          <rect x="4" y="5" width="11" height="12" rx="1" fill={fillStrong} />
          <rect x="17.5" y="5" width="6" height="12" rx="1" fill={fillMuted} stroke={stroke} strokeWidth="0.9" />
          <rect x="25.5" y="5" width="6" height="12" rx="1" fill={fillMuted} stroke={stroke} strokeWidth="0.9" />
        </>
      )}
    </svg>
  );
}

interface LayoutOption<T extends string> {
  value: T;
  label: string;
  glyph: LayoutGlyphKind;
}

function LayoutPicker<T extends string>({
  label = 'Grid & Layout Style',
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: Array<LayoutOption<T>>;
  onChange: (val: T) => void;
}) {
  return (
    <div>
      <div className="text-[13px] font-medium text-black mb-1.5">{label}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-2 px-2 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                active
                  ? 'border-[#1D4ED8] bg-blue-50/70 text-[#1D4ED8] shadow-xs'
                  : 'border-[#DAD4C6] bg-white hover:border-[#1D4ED8]/50 text-black'
              }`}
            >
              <LayoutGlyph kind={opt.glyph} active={active} />
              <span className="text-xs font-semibold leading-tight truncate">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English (en)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'de', label: 'German (de)' },
  { code: 'pt', label: 'Portuguese (pt)' },
  { code: 'it', label: 'Italian (it)' },
  { code: 'nl', label: 'Dutch (nl)' },
  { code: 'ja', label: 'Japanese (ja)' },
];

function normalizeCanonicalPreview(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  project,
  blocks,
  selectedBlock,
  isRefining,
  refineError,
  onSelectBlock,
  onJumpToBlock,
  onMoveBlock,
  onDuplicateBlock,
  onUpdateBlock,
  onRefineBlock,
  onDeleteBlock,
  onUpdateSeo,
  onUpdateAutomations,
  onOpenMarketing,
  onOpenDomains,
  requestedTab,
}) => {
  const [activeTab, setActiveTab] = useState<RightInspectorTab>('inspector');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [newBookingSlotInput, setNewBookingSlotInput] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const inspectorScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (requestedTab?.tab) {
      setActiveTab(requestedTab.tab);
    }
  }, [requestedTab?.nonce, requestedTab?.tab]);

  useEffect(() => {
    if (inspectorScrollRef.current) {
      inspectorScrollRef.current.scrollTop = 0;
    }
  }, [selectedBlock?.id, activeTab]);

  const { activePage } = ensureProjectPages(project);
  const isHomePage = activePage.path === '/';

  const seoTitleValue =
    (isHomePage ? project.seo?.title : activePage.seo?.title) ?? '';
  const seoDescValue =
    (isHomePage ? project.seo?.description : activePage.seo?.description) ?? '';
  const seoCanonicalValue =
    (isHomePage ? project.seo?.canonicalUrl : activePage.seo?.canonicalUrl) ?? '';
  const seoLangValue = project.seo?.language || 'en';

  const resolvedTitle =
    seoTitleValue.trim() ||
    (isHomePage
      ? project.name || 'Untitled Site'
      : `${activePage.name} — ${project.seo?.title?.trim() || project.name}`);
  const resolvedDesc =
    seoDescValue.trim() ||
    project.seo?.description?.trim() ||
    project.description ||
    'Add a concise meta description to improve search click-through rates.';
  const fallbackDomainCanonical = project.seo?.customDomain?.trim()
    ? normalizeCanonicalPreview(
        isHomePage
          ? project.seo.customDomain
          : `${project.seo.customDomain.replace(/\/+$/, '')}${activePage.path}`
      )
    : '';
  const resolvedCanonical =
    normalizeCanonicalPreview(seoCanonicalValue) || fallbackDomainCanonical;
  const serpDisplayUrl =
    resolvedCanonical ||
    (project.lastDeployedUrl
      ? `${project.lastDeployedUrl}${isHomePage ? '' : activePage.path}`
      : `https://atelierframe.app/sites/${project.slug || 'site'}${isHomePage ? '' : activePage.path}`);

  const hasHeroHeading = blocks.some(
    (b) => b.type === 'hero' && b.props.headline.trim().length > 0
  );
  const titleLength = resolvedTitle.length;
  const descLength = resolvedDesc.length;
  const canonicalIsValid =
    !seoCanonicalValue.trim() ||
    /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(normalizeCanonicalPreview(seoCanonicalValue));

  const tabSwitcher = (
    <div className="p-2.5 border-b border-[#DAD4C6] bg-[#F8F6F1] shrink-0">
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
              : 'text-black hover:bg-white/60'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#1D4ED8]" />
          <span>{selectedBlock ? 'Section' : 'Outline'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'seo'
              ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
              : 'text-black hover:bg-white/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#1D4ED8]" />
          <span>SEO</span>
        </button>
      </div>
    </div>
  );

  if (activeTab === 'seo') {
    const connectedDomainSuggestion = project.seo?.customDomain?.trim()
      ? normalizeCanonicalPreview(project.seo.customDomain)
      : '';
    const deployedUrlSuggestion = project.lastDeployedUrl
      ? `${window.location.origin}${project.lastDeployedUrl.startsWith('/') ? '' : '/'}${project.lastDeployedUrl}`
      : '';

    return (
      <aside className="w-[336px] shrink-0 bg-white border-l border-[#DAD4C6] flex flex-col h-full overflow-hidden">
        {tabSwitcher}

        <div className="px-4 py-3 border-b border-[#DAD4C6] bg-[#FAF9F5] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-[#1D4ED8] shrink-0" />
            <h2 className="text-sm font-semibold text-black truncate">
              {isHomePage ? 'Site SEO Tags' : `Page SEO: ${activePage.name}`}
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-black bg-[#EAE6DC] px-2 py-0.5 rounded">
            {activePage.path}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-5">
          {/* Live Search Engine Snippet Preview */}
          <div className="p-3.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] space-y-1.5">
            <div className="text-xs font-semibold text-black">
              Search Snippet Preview
            </div>
            <div className="text-xs text-black truncate font-mono">
              {serpDisplayUrl}
            </div>
            <div className="text-[15px] font-semibold text-[#1D4ED8] leading-snug line-clamp-2">
              {resolvedTitle}
            </div>
            <p className="text-[13px] text-black leading-relaxed line-clamp-3">
              {resolvedDesc}
            </p>
          </div>

          {/* Site-Wide Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="seo-title-input"
                className="text-[13px] font-semibold text-black"
              >
                Site Title (&lt;title&gt;)
              </label>
              <span className="text-xs font-mono tabular-nums text-black">
                {titleLength}/60
              </span>
            </div>
            <input
              id="seo-title-input"
              type="text"
              value={seoTitleValue}
              onChange={(e) => onUpdateSeo({ title: e.target.value })}
              placeholder={project.name}
              className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <p className="text-xs text-black leading-relaxed">
              Populates both <span className="font-mono">&lt;title&gt;</span> and{' '}
              <span className="font-mono">og:title</span>. Aim for 30–60 characters.
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="seo-description-input"
                className="text-[13px] font-semibold text-black"
              >
                Meta Description
              </label>
              <span className="text-xs font-mono tabular-nums text-black">
                {descLength}/160
              </span>
            </div>
            <textarea
              id="seo-description-input"
              rows={3}
              value={seoDescValue}
              onChange={(e) => onUpdateSeo({ description: e.target.value })}
              placeholder={project.description || 'Describe this site for search engines...'}
              className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm text-black placeholder:text-black/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-y"
            />
            <p className="text-xs text-black leading-relaxed">
              Populates <span className="font-mono">meta[name="description"]</span> and{' '}
              <span className="font-mono">og:description</span>. Aim for 70–160 characters.
            </p>
          </div>

          {/* Canonical URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="seo-canonical-input"
                className="text-[13px] font-semibold text-black"
              >
                Canonical URL
              </label>
              {seoCanonicalValue.trim() && (
                <button
                  type="button"
                  onClick={() => onUpdateSeo({ canonicalUrl: '' })}
                  className="text-xs font-medium text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-black absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="seo-canonical-input"
                type="url"
                value={seoCanonicalValue}
                onChange={(e) => onUpdateSeo({ canonicalUrl: e.target.value })}
                placeholder={fallbackDomainCanonical || 'https://yourdomain.com/'}
                className="w-full rounded-lg border border-[#DAD4C6] bg-white pl-8 pr-2.5 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>
            {!canonicalIsValid && (
              <p className="text-xs font-medium text-red-700">
                Enter a valid absolute URL (e.g. https://yourdomain.com/).
              </p>
            )}
            <p className="text-xs text-black leading-relaxed">
              Sets <span className="font-mono">&lt;link rel="canonical"&gt;</span> and{' '}
              <span className="font-mono">og:url</span> to prevent duplicate-content indexing.
            </p>
            {(connectedDomainSuggestion || deployedUrlSuggestion) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {connectedDomainSuggestion &&
                  seoCanonicalValue.trim() !== connectedDomainSuggestion && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSeo({ canonicalUrl: connectedDomainSuggestion })
                      }
                      className="text-xs font-medium text-black px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] hover:bg-white cursor-pointer"
                    >
                      Use connected domain
                    </button>
                  )}
                {deployedUrlSuggestion &&
                  seoCanonicalValue.trim() !== deployedUrlSuggestion && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSeo({ canonicalUrl: deployedUrlSuggestion })
                      }
                      className="text-xs font-medium text-black px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] hover:bg-white cursor-pointer"
                    >
                      Use live deploy URL
                    </button>
                  )}
              </div>
            )}
            {onOpenDomains && (
              <button
                type="button"
                onClick={onOpenDomains}
                className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Connect DNS or Transfer Domain →
              </button>
            )}
          </div>

          {/* Document Language */}
          <div className="space-y-1.5">
            <label
              htmlFor="seo-language-select"
              className="block text-[13px] font-semibold text-black"
            >
              Document Language (&lt;html lang&gt;)
            </label>
            <select
              id="seo-language-select"
              value={seoLangValue}
              onChange={(e) => onUpdateSeo({ language: e.target.value })}
              className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discoverability Checklist */}
          <div className="p-3.5 rounded-lg border border-[#DAD4C6] bg-white space-y-2.5">
            <div className="text-[13px] font-semibold text-black">
              Discoverability Checklist
            </div>
            <div className="space-y-2 text-xs text-black">
              <div className="flex items-start gap-2">
                {titleLength >= 10 && titleLength <= 65 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                )}
                <span>
                  Title tag length ({titleLength} chars — ideal 30–60)
                </span>
              </div>
              <div className="flex items-start gap-2">
                {descLength >= 50 && descLength <= 165 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                )}
                <span>
                  Meta description ({descLength} chars — ideal 70–160)
                </span>
              </div>
              <div className="flex items-start gap-2">
                {resolvedCanonical && canonicalIsValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                )}
                <span>
                  {resolvedCanonical
                    ? 'Canonical URL tag emitted in <head>'
                    : 'Add a canonical URL for primary domain indexing'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                {hasHeroHeading ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                )}
                <span>
                  {hasHeroHeading
                    ? 'Primary <h1> hero heading present'
                    : 'Add a Hero section for a semantic <h1> heading'}
                </span>
              </div>
            </div>
          </div>

          {/* Generated Head Tags Preview */}
          <div className="space-y-1.5">
            <div className="text-[13px] font-semibold text-black">
              Compiled &lt;head&gt; Tags
            </div>
            <pre className="p-3 rounded-lg bg-[#13151A] text-white text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
              {`<html lang="${seoLangValue}">
<title>${resolvedTitle}</title>
<meta name="description" content="${resolvedDesc}" />${
                resolvedCanonical
                  ? `\n<link rel="canonical" href="${resolvedCanonical}" />`
                  : ''
              }`}
            </pre>
          </div>

          {onOpenMarketing && (
            <button
              type="button"
              onClick={onOpenMarketing}
              className="w-full py-2.5 px-3 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white hover:border-[#1D4ED8] text-xs font-semibold text-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Configure Pixels, Promo Bar &amp; Paid Ads</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  if (!selectedBlock) {
    return (
      <aside className="w-[336px] shrink-0 bg-white border-l border-[#DAD4C6] flex flex-col h-full overflow-hidden">
        {tabSwitcher}
        <div className="px-4 py-3.5 border-b border-[#DAD4C6] bg-[#F8F6F1] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1D4ED8]" />
          <h2 className="text-sm font-semibold text-black">Page Sections</h2>
          <span className="ml-auto text-sm font-semibold text-black tabular-nums">
            {blocks.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto studio-scroll p-3 space-y-1.5">
          {blocks.length === 0 ? (
            <div className="p-4 text-center text-sm text-black leading-relaxed">
              No sections yet. Drag an element from the left rail or generate a template with AI.
            </div>
          ) : (
            blocks.map((blk, i) => (
              <div
                key={blk.id}
                className="group w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#DAD4C6] bg-white hover:border-[#1D4ED8] hover:bg-[#FAF9F5] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectBlock(blk.id);
                    onJumpToBlock?.(blk.id);
                  }}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
                >
                  <GripVertical className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="text-[13px] font-mono text-black tabular-nums w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-black truncate flex-1">
                    {blk.label}
                  </span>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  {onJumpToBlock && (
                    <button
                      type="button"
                      onClick={() => onJumpToBlock(blk.id)}
                      title="Scroll canvas to section"
                      className="p-1 rounded text-black hover:text-[#1D4ED8] hover:bg-[#EAE6DC] cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => onMoveBlock(i, -1)}
                    title="Move section up"
                    className="p-1 rounded text-black hover:bg-[#EAE6DC] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === blocks.length - 1}
                    onClick={() => onMoveBlock(i, 1)}
                    title="Move section down"
                    className="p-1 rounded text-black hover:bg-[#EAE6DC] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-[#DAD4C6] bg-[#F8F6F1] text-sm text-black leading-relaxed">
          Click any section on the canvas or in this outline to edit its copy, surface tone, and layout.
        </div>
      </aside>
    );
  }

  const selectedIndex = blocks.findIndex((b) => b.id === selectedBlock.id);

  const updateProps = (patch: Record<string, any>) => {
    onUpdateBlock({
      ...selectedBlock,
      props: {
        ...selectedBlock.props,
        ...patch,
      },
    } as SiteBlock);
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || isRefining) return;
    await onRefineBlock(selectedBlock, refinePrompt.trim());
    setRefinePrompt('');
  };

  return (
    <aside className="w-[336px] shrink-0 bg-white border-l border-[#DAD4C6] flex flex-col h-full overflow-hidden">
      {tabSwitcher}
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#DAD4C6] bg-[#F8F6F1] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-black truncate">
            {selectedBlock.label}
          </div>
          <div className="text-[13px] text-black capitalize tabular-nums">
            Section {selectedIndex + 1} of {blocks.length} · {selectedBlock.type}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onJumpToBlock && (
            <button
              type="button"
              onClick={() => onJumpToBlock(selectedBlock.id)}
              title="Scroll canvas to this section"
              className="p-1 rounded text-black hover:text-[#1D4ED8] hover:bg-[#EAE6DC] cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={selectedIndex <= 0}
            onClick={() => {
              if (selectedIndex > 0) {
                const targetId = blocks[selectedIndex - 1].id;
                onSelectBlock(targetId);
                onJumpToBlock?.(targetId);
              }
            }}
            title="Previous section"
            className="p-1 rounded text-black hover:bg-[#EAE6DC] disabled:opacity-30 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={selectedIndex >= blocks.length - 1}
            onClick={() => {
              if (selectedIndex < blocks.length - 1) {
                const targetId = blocks[selectedIndex + 1].id;
                onSelectBlock(targetId);
                onJumpToBlock?.(targetId);
              }
            }}
            title="Next section"
            className="p-1 rounded text-black hover:bg-[#EAE6DC] disabled:opacity-30 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          {onDuplicateBlock && (
            <button
              type="button"
              onClick={() => onDuplicateBlock(selectedBlock.id)}
              title="Duplicate section"
              className="p-1 rounded text-black hover:bg-[#EAE6DC] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectBlock(null)}
            className="text-[13px] font-medium text-black px-2 py-1 rounded hover:bg-[#EAE6DC] cursor-pointer"
          >
            Outline
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(selectedBlock.id)}
            title="Delete block"
            className="p-1.5 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div
        ref={inspectorScrollRef}
        className="flex-1 overflow-y-auto studio-scroll p-4 space-y-5"
      >
        {/* AI Refine Selected Block */}
        <form
          onSubmit={handleRefineSubmit}
          className="p-3 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] space-y-2"
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-black">
            <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
            <span>AI Section Rewrite</span>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g. Make copy punchier for enterprise"
              className="flex-1 min-w-0 rounded-md border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <button
              type="submit"
              disabled={isRefining || !refinePrompt.trim()}
              className="px-3 py-1.5 rounded-md bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold shrink-0 cursor-pointer"
            >
              {isRefining ? '...' : 'Apply'}
            </button>
          </div>
          {refineError && (
            <p className="text-[13px] text-red-600">{refineError}</p>
          )}
        </form>

        {/* Surface & Padding */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-black">
            Surface &amp; Spacing
          </div>
          <div>
            <div className="text-[13px] text-black mb-1">Background Band</div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
              {(
                [
                  ['canvas', project.theme.backgroundColor],
                  ['surface', project.theme.surfaceColor],
                  ['contrast', project.theme.contrastBgColor],
                ] as Array<[BackgroundVariant, string]>
              ).map(([v, swatch]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    onUpdateBlock({ ...selectedBlock, backgroundVariant: v })
                  }
                  className={`py-1.5 px-1.5 text-[13px] font-medium capitalize rounded-md cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedBlock.backgroundVariant === v
                      ? 'bg-white text-black shadow-xs'
                      : 'text-black hover:bg-white/50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-xs border border-black/20 shrink-0"
                    style={{ backgroundColor: swatch }}
                  />
                  <span>{v}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedBlock.type !== 'navbar' && (
            <div>
              <div className="text-[13px] text-black mb-1">
                Vertical Padding
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                {(['compact', 'normal', 'spacious'] as PaddingSize[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      onUpdateBlock({ ...selectedBlock, paddingY: p })
                    }
                    className={`py-1.5 text-[13px] font-medium capitalize rounded-md cursor-pointer ${
                      selectedBlock.paddingY === p
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Block-Specific Fields */}
        <div className="space-y-3 pt-4 border-t border-[#DAD4C6]">
          <div className="text-sm font-semibold text-black">Content</div>

          {selectedBlock.type === 'navbar' && (
            <>
              <TextInput
                label="Brand Wordmark"
                value={selectedBlock.props.brandName}
                onChange={(v) => updateProps({ brandName: v })}
              />
              <TextInput
                label="Primary CTA Label"
                value={selectedBlock.props.ctaLabel}
                onChange={(v) => updateProps({ ctaLabel: v })}
              />
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-black">
                    Navigation Links
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateProps({
                        links: [
                          ...selectedBlock.props.links,
                          { label: 'New Link', href: '#section' },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1 text-[13px] text-blue-600 font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {selectedBlock.props.links.map((link, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...selectedBlock.props.links];
                        next[idx] = { ...link, label: e.target.value };
                        updateProps({ links: next });
                      }}
                      className="flex-1 min-w-0 rounded border border-slate-200 px-2 py-1 text-sm text-black"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => {
                        const next = [...selectedBlock.props.links];
                        next[idx] = { ...link, href: e.target.value };
                        updateProps({ links: next });
                      }}
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm text-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedBlock.props.links.filter(
                          (_, i) => i !== idx
                        );
                        updateProps({ links: next });
                      }}
                      className="text-black hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedBlock.type === 'hero' && (
            <>
              <LayoutPicker
                label="Hero Layout"
                value={selectedBlock.props.layout || 'split'}
                options={[
                  { value: 'split', label: 'Media Right', glyph: 'split-right' },
                  { value: 'split-left', label: 'Media Left', glyph: 'split-left' },
                  { value: 'centered', label: 'Centered', glyph: 'centered' },
                  { value: 'banner', label: 'Full Banner', glyph: 'banner' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Kicker"
                value={selectedBlock.props.kicker}
                onChange={(v) => updateProps({ kicker: v })}
              />
              <TextInput
                label="Headline"
                value={selectedBlock.props.headline}
                onChange={(v) => updateProps({ headline: v })}
                multiline
              />
              <TextInput
                label="Subtitle"
                value={selectedBlock.props.subtitle}
                onChange={(v) => updateProps({ subtitle: v })}
                multiline
              />
              <TextInput
                label="Primary Button"
                value={selectedBlock.props.primaryCtaLabel}
                onChange={(v) => updateProps({ primaryCtaLabel: v })}
              />
              <TextInput
                label="Secondary Button"
                value={selectedBlock.props.secondaryCtaLabel}
                onChange={(v) => updateProps({ secondaryCtaLabel: v })}
              />
              <ImageAssetPicker
                value={selectedBlock.props.imageUrl}
                alt={selectedBlock.props.imageAlt}
                onChangeUrl={(url) => updateProps({ imageUrl: url })}
                onChangeAlt={(alt) => updateProps({ imageAlt: alt })}
              />
            </>
          )}

          {selectedBlock.type === 'stats' && (
            <>
              <LayoutPicker
                label="Grid Style"
                value={selectedBlock.props.layout || 'strip'}
                options={[
                  { value: 'strip', label: 'Divider Strip', glyph: 'strip' },
                  { value: 'cards', label: 'Metric Cards', glyph: 'cards' },
                  { value: 'grid-2', label: '2×2 Grid', glyph: 'grid-2' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Section Label"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.items.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Metric {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            items: selectedBlock.props.items.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Value"
                      value={stat.value}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...stat, value: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Label"
                      value={stat.label}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...stat, label: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Context"
                      value={stat.context}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...stat, context: v };
                        updateProps({ items: next });
                      }}
                    />
                  </div>
                ))}
                {selectedBlock.props.items.length < 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateProps({
                        items: [
                          ...selectedBlock.props.items,
                          { value: '100%', label: 'New Metric', context: 'Verified outcome' },
                        ],
                      })
                    }
                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                  >
                    + Add Metric
                  </button>
                )}
              </div>
            </>
          )}

          {selectedBlock.type === 'features' && (
            <>
              <LayoutPicker
                label="Grid Style"
                value={selectedBlock.props.layout || 'cards'}
                options={[
                  { value: 'cards', label: 'Card Grid', glyph: 'cards' },
                  { value: 'bento', label: 'Bento Grid', glyph: 'bento' },
                  { value: 'minimal', label: 'Hairline Grid', glyph: 'minimal' },
                  { value: 'numbered', label: 'Numbered Rows', glyph: 'numbered' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              {(selectedBlock.props.layout || 'cards') !== 'numbered' &&
                (selectedBlock.props.layout || 'cards') !== 'bento' && (
                  <div>
                    <div className="text-[13px] font-medium text-black mb-1">Columns</div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                      {([2, 3, 4] as const).map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => updateProps({ columns: cols })}
                          className={`py-1.5 text-[13px] font-medium rounded-md cursor-pointer ${
                            selectedBlock.props.columns === cols
                              ? 'bg-white text-black shadow-xs'
                              : 'text-black'
                          }`}
                        >
                          {cols} Cols
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Intro"
                value={selectedBlock.props.intro}
                onChange={(v) => updateProps({ intro: v })}
                multiline
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Card {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            items: selectedBlock.props.items.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Meta"
                      value={item.meta || ''}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, meta: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Title"
                      value={item.title}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, title: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Description"
                      value={item.description}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, description: v };
                        updateProps({ items: next });
                      }}
                      multiline
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateProps({
                      items: [
                        ...selectedBlock.props.items,
                        {
                          title: 'New Capability',
                          description: 'Describe the specific engineering or service outcome.',
                          meta: 'Phase',
                        },
                      ],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                >
                  + Add Feature Card
                </button>
              </div>
            </>
          )}

          {selectedBlock.type === 'showcase' && (
            <>
              <LayoutPicker
                label="Section Layout"
                value={selectedBlock.props.layout || 'split'}
                options={[
                  { value: 'split', label: '50/50 Split', glyph: 'split-right' },
                  { value: 'wide-media', label: 'Wide Visual', glyph: 'wide-media' },
                  { value: 'stacked', label: 'Stacked', glyph: 'stacked' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              {(selectedBlock.props.layout || 'split') !== 'stacked' && (
                <div>
                  <div className="text-[13px] font-medium text-black mb-1">
                    Image Position
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                    {(['left', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => updateProps({ imagePosition: pos })}
                        className={`py-1.5 text-[13px] font-medium capitalize rounded-md cursor-pointer ${
                          selectedBlock.props.imagePosition === pos
                            ? 'bg-white text-black shadow-xs'
                            : 'text-black'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
              />
              <TextInput
                label="Narrative Body"
                value={selectedBlock.props.body}
                onChange={(v) => updateProps({ body: v })}
                multiline
              />
              <TextInput
                label="Bullet Points (one per line)"
                value={selectedBlock.props.bullets.join('\n')}
                onChange={(v) =>
                  updateProps({
                    bullets: v
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                multiline
              />
              <TextInput
                label="Button Label"
                value={selectedBlock.props.ctaLabel}
                onChange={(v) => updateProps({ ctaLabel: v })}
              />
              <ImageAssetPicker
                value={selectedBlock.props.imageUrl}
                alt={selectedBlock.props.imageAlt}
                onChangeUrl={(url) => updateProps({ imageUrl: url })}
                onChangeAlt={(alt) => updateProps({ imageAlt: alt })}
              />
            </>
          )}

          {selectedBlock.type === 'pricing' && (
            <>
              <LayoutPicker
                label="Grid & Layout Style"
                value={selectedBlock.props.layout || 'cards'}
                options={[
                  { value: 'cards', label: 'Tier Grid', glyph: 'cards' },
                  { value: 'rows', label: 'Comparison Rows', glyph: 'rows' },
                  { value: 'compact', label: '2-Column Grid', glyph: 'grid-2' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
              />
              <TextInput
                label="Intro"
                value={selectedBlock.props.intro}
                onChange={(v) => updateProps({ intro: v })}
                multiline
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Tier {idx + 1}
                      </span>
                      <label className="flex items-center gap-1.5 text-[13px] text-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.highlighted}
                          onChange={(e) => {
                            const next = [...selectedBlock.props.tiers];
                            next[idx] = { ...tier, highlighted: e.target.checked };
                            updateProps({ tiers: next });
                          }}
                        />
                        Featured
                      </label>
                    </div>
                    <TextInput
                      label="Tier Name"
                      value={tier.name}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.tiers];
                        next[idx] = { ...tier, name: v };
                        updateProps({ tiers: next });
                      }}
                    />
                    <TextInput
                      label="Target Audience"
                      value={tier.audience}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.tiers];
                        next[idx] = { ...tier, audience: v };
                        updateProps({ tiers: next });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        label="Price"
                        value={tier.price}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.tiers];
                          next[idx] = { ...tier, price: v };
                          updateProps({ tiers: next });
                        }}
                      />
                      <TextInput
                        label="Cadence"
                        value={tier.cadence}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.tiers];
                          next[idx] = { ...tier, cadence: v };
                          updateProps({ tiers: next });
                        }}
                      />
                    </div>
                    <TextInput
                      label="Features (one per line)"
                      value={tier.features.join('\n')}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.tiers];
                        next[idx] = {
                          ...tier,
                          features: v.split('\n').filter((x) => x.trim().length > 0),
                        };
                        updateProps({ tiers: next });
                      }}
                      multiline
                    />
                    <TextInput
                      label="CTA Label"
                      value={tier.ctaLabel}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.tiers];
                        next[idx] = { ...tier, ctaLabel: v };
                        updateProps({ tiers: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedBlock.type === 'testimonial' && (
            <>
              <LayoutPicker
                label="Quote Layout"
                value={selectedBlock.props.layout || 'editorial'}
                options={[
                  { value: 'editorial', label: 'Editorial Left', glyph: 'minimal' },
                  { value: 'centered', label: 'Centered', glyph: 'centered' },
                  { value: 'card', label: 'Framed Card', glyph: 'panel' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Quote"
                value={selectedBlock.props.quote}
                onChange={(v) => updateProps({ quote: v })}
                multiline
              />
              <TextInput
                label="Author Name"
                value={selectedBlock.props.authorName}
                onChange={(v) => updateProps({ authorName: v })}
              />
              <TextInput
                label="Author Role"
                value={selectedBlock.props.authorRole}
                onChange={(v) => updateProps({ authorRole: v })}
              />
              <TextInput
                label="Company"
                value={selectedBlock.props.company}
                onChange={(v) => updateProps({ company: v })}
              />
              <TextInput
                label="Measured Outcome"
                value={selectedBlock.props.outcome}
                onChange={(v) => updateProps({ outcome: v })}
              />
            </>
          )}

          {selectedBlock.type === 'faq' && (
            <>
              <LayoutPicker
                label="FAQ Layout"
                value={selectedBlock.props.layout || 'single'}
                options={[
                  { value: 'single', label: 'Single Column', glyph: 'minimal' },
                  { value: 'split', label: 'Split Header', glyph: 'split-right' },
                  { value: 'grid-2', label: '2-Column Grid', glyph: 'grid-2' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Question {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            items: selectedBlock.props.items.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Question"
                      value={item.question}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, question: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Answer"
                      value={item.answer}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, answer: v };
                        updateProps({ items: next });
                      }}
                      multiline
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateProps({
                      items: [
                        ...selectedBlock.props.items,
                        {
                          question: 'New Question',
                          answer: 'Clear, direct answer for prospective visitors.',
                        },
                      ],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                >
                  + Add FAQ Row
                </button>
              </div>
            </>
          )}

          {selectedBlock.type === 'cta' && (
            <>
              <LayoutPicker
                label="CTA Layout"
                value={selectedBlock.props.layout || 'panel'}
                options={[
                  { value: 'panel', label: 'Split Panel', glyph: 'panel' },
                  { value: 'centered', label: 'Centered', glyph: 'centered' },
                  { value: 'minimal', label: 'Open Strip', glyph: 'minimal' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Headline"
                value={selectedBlock.props.headline}
                onChange={(v) => updateProps({ headline: v })}
                multiline
              />
              <TextInput
                label="Description"
                value={selectedBlock.props.description}
                onChange={(v) => updateProps({ description: v })}
                multiline
              />
              <TextInput
                label="Primary Button"
                value={selectedBlock.props.primaryCtaLabel}
                onChange={(v) => updateProps({ primaryCtaLabel: v })}
              />
              <TextInput
                label="Secondary Button"
                value={selectedBlock.props.secondaryCtaLabel}
                onChange={(v) => updateProps({ secondaryCtaLabel: v })}
              />
            </>
          )}

          {selectedBlock.type === 'contact' && (() => {
            const formMode = selectedBlock.props.formMode || 'standard';
            const fields = getEffectiveContactFields(selectedBlock.props);
            const bookingSlots = getEffectiveBookingSlots(selectedBlock.props);
            const bookingCfg = selectedBlock.props.booking || {};
            const automations = project.automations || {};

            const setFields = (nextFields: ContactFormField[]) => {
              updateProps({ customFields: nextFields });
            };

            const addPresetField = (
              preset: Partial<ContactFormField> & { label: string; type: ContactFieldType }
            ) => {
              const id = `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
              const baseName = preset.name || slugifyFieldName(preset.label, fields.length + 1);
              const next: ContactFormField = {
                id,
                name: baseName,
                label: preset.label,
                type: preset.type,
                placeholder: preset.placeholder || '',
                required: preset.required ?? false,
                options: preset.options,
                step: preset.step ?? 2,
              };
              setFields([...fields, next]);
            };

            const handleTestWebhook = async () => {
              if (!automations.webhookUrl?.trim() || isTestingWebhook) return;
              setIsTestingWebhook(true);
              setWebhookTestStatus(null);
              try {
                const res = await fetch('/api/automations/test-webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    webhookUrl: automations.webhookUrl.trim(),
                    webhookFormat: automations.webhookFormat || 'json',
                    siteSlug: project.lastDeployedSlug || project.slug || 'preview',
                  }),
                });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                  setWebhookTestStatus({
                    ok: false,
                    message: data.error || `Returned status ${data.statusCode || res.status}`,
                  });
                } else {
                  setWebhookTestStatus({
                    ok: true,
                    message: `Delivered (HTTP ${data.statusCode || 200})`,
                  });
                }
              } catch (err) {
                setWebhookTestStatus({
                  ok: false,
                  message: err instanceof Error ? err.message : 'Test request failed',
                });
              } finally {
                setIsTestingWebhook(false);
              }
            };

            return (
              <>
                <LayoutPicker
                  label="Contact Layout"
                  value={selectedBlock.props.layout || 'split'}
                  options={[
                    { value: 'split', label: 'Form Right', glyph: 'split-right' },
                    { value: 'split-reverse', label: 'Form Left', glyph: 'split-left' },
                    { value: 'centered', label: 'Centered Form', glyph: 'centered' },
                  ]}
                  onChange={(lay) => updateProps({ layout: lay })}
                />

                <div>
                  <div className="text-[13px] font-medium text-black mb-1">
                    Form Experience Mode
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                    {(
                      [
                        ['standard', 'Standard'],
                        ['multistep', 'Multi-Step'],
                        ['booking', 'Booking'],
                      ] as const
                    ).map(([modeKey, modeLabel]) => (
                      <button
                        key={modeKey}
                        type="button"
                        onClick={() => updateProps({ formMode: modeKey })}
                        className={`py-1.5 text-[13px] font-medium rounded-md cursor-pointer ${
                          formMode === modeKey
                            ? 'bg-white text-black shadow-xs'
                            : 'text-black hover:bg-white/50'
                        }`}
                      >
                        {modeLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <TextInput
                  label="Eyebrow"
                  value={selectedBlock.props.eyebrow}
                  onChange={(v) => updateProps({ eyebrow: v })}
                />
                <TextInput
                  label="Heading"
                  value={selectedBlock.props.heading}
                  onChange={(v) => updateProps({ heading: v })}
                />
                <TextInput
                  label="Description"
                  value={selectedBlock.props.description}
                  onChange={(v) => updateProps({ description: v })}
                  multiline
                />
                <TextInput
                  label="Contact Email"
                  value={selectedBlock.props.email}
                  onChange={(v) => updateProps({ email: v })}
                />
                <TextInput
                  label="Office Location"
                  value={selectedBlock.props.location}
                  onChange={(v) => updateProps({ location: v })}
                />
                <TextInput
                  label="Submit Button Label"
                  value={selectedBlock.props.submitLabel}
                  onChange={(v) => updateProps({ submitLabel: v })}
                />

                {/* Consultation Booking Scheduler Config */}
                {formMode === 'booking' && (
                  <div className="pt-3 border-t border-[#DAD4C6] space-y-3">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-black">
                      <Calendar className="w-4 h-4 text-[#1D4ED8]" />
                      <span>Consultation Scheduler</span>
                    </div>
                    <TextInput
                      label="Scheduler Heading"
                      value={bookingCfg.stepHeading ?? 'Select a Consultation Date & Time'}
                      onChange={(v) =>
                        updateProps({ booking: { ...bookingCfg, stepHeading: v } })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[13px] font-medium text-black mb-1">
                          Duration
                        </label>
                        <select
                          value={bookingCfg.durationLabel || '30 min'}
                          onChange={(e) =>
                            updateProps({
                              booking: { ...bookingCfg, durationLabel: e.target.value },
                            })
                          }
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm text-black"
                        >
                          <option value="15 min">15 min</option>
                          <option value="30 min">30 min</option>
                          <option value="45 min">45 min</option>
                          <option value="60 min">60 min</option>
                        </select>
                      </div>
                      <TextInput
                        label="Timezone"
                        value={bookingCfg.timezone ?? 'EST (UTC-5)'}
                        onChange={(v) =>
                          updateProps({ booking: { ...bookingCfg, timezone: v } })
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-black">
                          Available Time Slots
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateProps({
                              booking: { ...bookingCfg, slots: [...DEFAULT_BOOKING_SLOTS] },
                            })
                          }
                          className="text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                        >
                          Reset defaults
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {bookingSlots.map((slot, sIdx) => (
                          <span
                            key={`${slot}-${sIdx}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] text-xs font-mono text-black"
                          >
                            <span>{slot}</span>
                            {bookingSlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateProps({
                                    booking: {
                                      ...bookingCfg,
                                      slots: bookingSlots.filter((_, i) => i !== sIdx),
                                    },
                                  })
                                }
                                className="text-black hover:text-red-600 cursor-pointer"
                                aria-label={`Remove ${slot}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newBookingSlotInput}
                          onChange={(e) => setNewBookingSlotInput(e.target.value)}
                          placeholder="e.g. 11:30 AM"
                          className="flex-1 min-w-0 rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm text-black"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newBookingSlotInput.trim();
                            if (!trimmed || bookingSlots.includes(trimmed)) return;
                            updateProps({
                              booking: {
                                ...bookingCfg,
                                slots: [...bookingSlots, trimmed],
                              },
                            });
                            setNewBookingSlotInput('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                        >
                          Add Slot
                        </button>
                      </div>
                    </div>

                    <TextInput
                      label="External Calendar URL (Optional Cal.com / Calendly)"
                      value={bookingCfg.externalBookingUrl || ''}
                      onChange={(v) =>
                        updateProps({
                          booking: { ...bookingCfg, externalBookingUrl: v },
                        })
                      }
                    />
                    {bookingCfg.externalBookingUrl && (
                      <TextInput
                        label="External Link Label"
                        value={bookingCfg.externalBookingLabel || 'Prefer Cal.com? Open live calendar'}
                        onChange={(v) =>
                          updateProps({
                            booking: { ...bookingCfg, externalBookingLabel: v },
                          })
                        }
                      />
                    )}
                  </div>
                )}

                {/* Custom Form Fields Builder */}
                <div className="pt-3 border-t border-[#DAD4C6] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-black">
                      Custom Form Fields ({fields.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          name: 'phone',
                          label: 'Phone Number',
                          type: 'tel',
                          placeholder: '+1 (555) 234-5678',
                          step: 1,
                        })
                      }
                      className="px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-black cursor-pointer"
                    >
                      + Phone
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          name: 'company',
                          label: 'Company / Brand',
                          type: 'text',
                          placeholder: 'Northwind Craft',
                          step: 1,
                        })
                      }
                      className="px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-black cursor-pointer"
                    >
                      + Company
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          name: 'budget',
                          label: 'Estimated Budget',
                          type: 'select',
                          options: ['$5k – $15k', '$15k – $35k', '$35k – $75k', '$75k+'],
                          required: true,
                          step: 2,
                        })
                      }
                      className="px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-black cursor-pointer"
                    >
                      + Budget Select
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          name: 'service',
                          label: 'Service Needed',
                          type: 'select',
                          options: ['Brand & Web Design', 'Product Engineering', 'Growth Retainer'],
                          step: 2,
                        })
                      }
                      className="px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-black cursor-pointer"
                    >
                      + Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          name: 'nda_consent',
                          label: 'Request mutual NDA before discovery call',
                          type: 'checkbox',
                          step: 2,
                        })
                      }
                      className="px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-medium text-black cursor-pointer"
                    >
                      + Checkbox
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addPresetField({
                          label: 'Custom Question',
                          type: 'text',
                          placeholder: 'Share details...',
                          step: 2,
                        })
                      }
                      className="px-2 py-1 rounded border border-dashed border-[#1D4ED8] bg-white hover:bg-blue-50 text-xs font-semibold text-[#1D4ED8] cursor-pointer"
                    >
                      + Text Field
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {fields.map((fld, idx) => (
                      <div
                        key={fld.id}
                        className="p-2.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-black truncate">
                            {idx + 1}. {fld.label || 'Untitled Field'}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const next = [...fields];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                setFields(next);
                              }}
                              className="p-1 rounded text-black hover:bg-white disabled:opacity-30 cursor-pointer"
                              title="Move field up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === fields.length - 1}
                              onClick={() => {
                                const next = [...fields];
                                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                setFields(next);
                              }}
                              className="p-1 rounded text-black hover:bg-white disabled:opacity-30 cursor-pointer"
                              title="Move field down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                                className="p-1 rounded text-black hover:text-red-600 cursor-pointer"
                                title="Delete field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <TextInput
                            label="Label"
                            value={fld.label}
                            onChange={(v) => {
                              const next = [...fields];
                              next[idx] = {
                                ...fld,
                                label: v,
                                name:
                                  fld.name === 'name' || fld.name === 'email' || fld.name === 'message'
                                    ? fld.name
                                    : slugifyFieldName(v, idx + 1),
                              };
                              setFields(next);
                            }}
                          />
                          <div>
                            <label className="block text-[13px] font-medium text-black mb-1">
                              Type
                            </label>
                            <select
                              value={fld.type}
                              onChange={(e) => {
                                const nextType = e.target.value as ContactFieldType;
                                const next = [...fields];
                                next[idx] = {
                                  ...fld,
                                  type: nextType,
                                  options:
                                    nextType === 'select' && (!fld.options || fld.options.length === 0)
                                      ? ['Option A', 'Option B', 'Option C']
                                      : fld.options,
                                };
                                setFields(next);
                              }}
                              className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2 py-1.5 text-sm text-black"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="select">Dropdown</option>
                              <option value="textarea">Long Text</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>
                        </div>

                        {fld.type !== 'checkbox' && fld.type !== 'select' && (
                          <TextInput
                            label="Placeholder"
                            value={fld.placeholder || ''}
                            onChange={(v) => {
                              const next = [...fields];
                              next[idx] = { ...fld, placeholder: v };
                              setFields(next);
                            }}
                          />
                        )}

                        {fld.type === 'select' && (
                          <TextInput
                            label="Dropdown Options (comma separated)"
                            value={(fld.options || []).join(', ')}
                            onChange={(v) => {
                              const next = [...fields];
                              next[idx] = {
                                ...fld,
                                options: v
                                  .split(',')
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              };
                              setFields(next);
                            }}
                          />
                        )}

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-black cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(fld.required)}
                              onChange={(e) => {
                                const next = [...fields];
                                next[idx] = { ...fld, required: e.target.checked };
                                setFields(next);
                              }}
                              className="rounded border-[#DAD4C6]"
                            />
                            <span>Required</span>
                          </label>

                          {formMode === 'multistep' && (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-medium text-black">Step:</span>
                              {([1, 2] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    const next = [...fields];
                                    next[idx] = { ...fld, step: st };
                                    setFields(next);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                                    (fld.step || 1) === st
                                      ? 'bg-[#13151A] text-white'
                                      : 'bg-white border border-[#DAD4C6] text-black'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submission Confirmation & Redirect */}
                <div className="pt-3 border-t border-[#DAD4C6] space-y-2.5">
                  <div className="text-[13px] font-semibold text-black">
                    Confirmation &amp; Redirect
                  </div>
                  <TextInput
                    label="Success Message"
                    value={
                      selectedBlock.props.successMessage ??
                      'Thank you — your inquiry and details were received.'
                    }
                    onChange={(v) => updateProps({ successMessage: v })}
                    multiline
                  />
                  <TextInput
                    label="Post-Submit Redirect URL (Optional)"
                    value={selectedBlock.props.redirectUrl || ''}
                    onChange={(v) => updateProps({ redirectUrl: v })}
                  />
                </div>

                {/* Lead Automations & Webhooks */}
                {onUpdateAutomations && (
                  <div className="pt-3 border-t border-[#DAD4C6] space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-black">
                      <Webhook className="w-4 h-4 text-[#1D4ED8]" />
                      <span>Lead Automations &amp; Webhooks</span>
                    </div>
                    <p className="text-xs text-black leading-relaxed">
                      Automatically forward every live form submission and consultation booking to Slack, Discord, Zapier, Make, or your CRM.
                    </p>
                    <TextInput
                      label="Webhook Endpoint URL"
                      value={automations.webhookUrl || ''}
                      onChange={(v) => {
                        setWebhookTestStatus(null);
                        onUpdateAutomations({ webhookUrl: v });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[13px] font-medium text-black mb-1">
                          Payload Format
                        </label>
                        <select
                          value={automations.webhookFormat || 'json'}
                          onChange={(e) =>
                            onUpdateAutomations({
                              webhookFormat: e.target.value as 'json' | 'slack' | 'discord',
                            })
                          }
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-sm text-black"
                        >
                          <option value="json">JSON (Zapier / Make)</option>
                          <option value="slack">Slack Webhook</option>
                          <option value="discord">Discord Webhook</option>
                        </select>
                      </div>
                      <TextInput
                        label="Alert Email Label"
                        value={automations.notifyEmail || ''}
                        onChange={(v) => onUpdateAutomations({ notifyEmail: v })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!automations.webhookUrl?.trim() || isTestingWebhook}
                        onClick={handleTestWebhook}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white disabled:opacity-45 text-xs font-semibold text-black cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>{isTestingWebhook ? 'Sending Test...' : 'Send Test Webhook'}</span>
                      </button>
                    </div>
                    {webhookTestStatus && (
                      <div
                        className={`text-xs font-medium px-2.5 py-2 rounded-lg border ${
                          webhookTestStatus.ok
                            ? 'bg-emerald-50 border-emerald-200 text-[#047857]'
                            : 'bg-red-50 border-red-200 text-[#B91C1C]'
                        }`}
                      >
                        {webhookTestStatus.message}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {selectedBlock.type === 'footer' && (
            <>
              <LayoutPicker
                label="Footer Layout"
                value={selectedBlock.props.layout || 'columns'}
                options={[
                  { value: 'columns', label: 'Column Grid', glyph: 'columns' },
                  { value: 'centered', label: 'Centered', glyph: 'centered' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Brand Name"
                value={selectedBlock.props.brandName}
                onChange={(v) => updateProps({ brandName: v })}
              />
              <TextInput
                label="Summary"
                value={selectedBlock.props.summary}
                onChange={(v) => updateProps({ summary: v })}
                multiline
              />
              <TextInput
                label="Copyright"
                value={selectedBlock.props.copyright}
                onChange={(v) => updateProps({ copyright: v })}
              />
            </>
          )}

          {selectedBlock.type === 'logocloud' && (
            <>
              <LayoutPicker
                label="Grid & Strip Style"
                value={selectedBlock.props.layout || 'row'}
                options={[
                  { value: 'row', label: 'Open Strip', glyph: 'strip' },
                  { value: 'grid', label: 'Hairline Cells', glyph: 'cards' },
                  { value: 'cards', label: 'Partner Tiles', glyph: 'grid-2' },
                  { value: 'compact', label: 'Split Inline', glyph: 'split-right' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Trust Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Right Caption"
                value={selectedBlock.props.caption || ''}
                onChange={(v) => updateProps({ caption: v })}
              />
              <div className="space-y-2.5 pt-2">
                {selectedBlock.props.items.map((partner, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Partner {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            items: selectedBlock.props.items.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Company Name"
                      value={partner.name}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...partner, name: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Sector / Tag"
                      value={partner.sector || ''}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...partner, sector: v };
                        updateProps({ items: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateProps({
                      items: [
                        ...selectedBlock.props.items,
                        { name: 'Vanguard Group', sector: 'Enterprise' },
                      ],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                >
                  + Add Partner Logo
                </button>
              </div>
            </>
          )}

          {selectedBlock.type === 'portfolio' && (
            <>
              <LayoutPicker
                label="Grid & Layout Style"
                value={selectedBlock.props.layout || 'grid'}
                options={[
                  { value: 'grid', label: 'Card Grid', glyph: 'cards' },
                  { value: 'bento', label: 'Bento Spotlight', glyph: 'bento' },
                  { value: 'rows', label: 'Editorial Rows', glyph: 'rows' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              {(selectedBlock.props.layout || 'grid') === 'grid' && (
                <div>
                  <div className="text-[13px] font-medium text-black mb-1">Columns</div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                    {([2, 3] as const).map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => updateProps({ columns: cols })}
                        className={`py-1.5 text-[13px] font-medium rounded-md cursor-pointer ${
                          selectedBlock.props.columns === cols
                            ? 'bg-white text-black shadow-xs'
                            : 'text-black'
                        }`}
                      >
                        {cols} Columns
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Intro"
                value={selectedBlock.props.intro}
                onChange={(v) => updateProps({ intro: v })}
                multiline
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Case Study {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            items: selectedBlock.props.items.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Project Title"
                      value={item.title}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, title: v };
                        updateProps({ items: next });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        label="Category"
                        value={item.category}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.items];
                          next[idx] = { ...item, category: v };
                          updateProps({ items: next });
                        }}
                      />
                      <TextInput
                        label="Client"
                        value={item.client}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.items];
                          next[idx] = { ...item, client: v };
                          updateProps({ items: next });
                        }}
                      />
                    </div>
                    <TextInput
                      label="Headline Metric"
                      value={item.metric}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, metric: v };
                        updateProps({ items: next });
                      }}
                    />
                    <TextInput
                      label="Summary"
                      value={item.summary}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, summary: v };
                        updateProps({ items: next });
                      }}
                      multiline
                    />
                    <TextInput
                      label="Modal Challenge"
                      value={item.challenge || ''}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, challenge: v };
                        updateProps({ items: next });
                      }}
                      multiline
                    />
                    <TextInput
                      label="Modal Outcome"
                      value={item.outcome || ''}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, outcome: v };
                        updateProps({ items: next });
                      }}
                      multiline
                    />
                    <ImageAssetPicker
                      value={item.imageUrl}
                      alt={item.imageAlt}
                      onChangeUrl={(url) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, imageUrl: url };
                        updateProps({ items: next });
                      }}
                      onChangeAlt={(alt) => {
                        const next = [...selectedBlock.props.items];
                        next[idx] = { ...item, imageAlt: alt };
                        updateProps({ items: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateProps({
                      items: [
                        ...selectedBlock.props.items,
                        {
                          title: 'New Client Engagement',
                          category: 'Commercial',
                          client: 'Partner Studio',
                          metric: '+45% Conversion Lift',
                          summary: 'Redesigned digital flagship and checkout architecture.',
                          challenge: 'High drop-off during technical onboarding steps.',
                          outcome: 'Streamlined 2-step flow cutting launch lead times in half.',
                          imageUrl: STUDIO_IMAGES[0].url,
                          imageAlt: STUDIO_IMAGES[0].alt,
                          linkLabel: 'Request Case Brief',
                          linkHref: '#contact',
                        },
                      ],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                >
                  + Add Case Study
                </button>
              </div>
            </>
          )}

          {selectedBlock.type === 'video' && (
            <>
              <LayoutPicker
                label="Stage Layout"
                value={selectedBlock.props.layout || 'split-right'}
                options={[
                  { value: 'split-right', label: 'Video Right', glyph: 'split-right' },
                  { value: 'split-left', label: 'Video Left', glyph: 'split-left' },
                  { value: 'centered', label: 'Cinema Stack', glyph: 'centered' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Description"
                value={selectedBlock.props.description}
                onChange={(v) => updateProps({ description: v })}
                multiline
              />
              <TextInput
                label="YouTube, Vimeo, or MP4 URL"
                value={selectedBlock.props.videoUrl}
                onChange={(v) => updateProps({ videoUrl: v })}
              />
              <TextInput
                label="Duration Label"
                value={selectedBlock.props.durationLabel}
                onChange={(v) => updateProps({ durationLabel: v })}
              />
              <TextInput
                label="Key Highlights (one per line)"
                value={selectedBlock.props.highlights.join('\n')}
                onChange={(v) =>
                  updateProps({
                    highlights: v
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                multiline
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Button Label"
                  value={selectedBlock.props.ctaLabel}
                  onChange={(v) => updateProps({ ctaLabel: v })}
                />
                <TextInput
                  label="Button Link"
                  value={selectedBlock.props.ctaHref}
                  onChange={(v) => updateProps({ ctaHref: v })}
                />
              </div>
              <ImageAssetPicker
                value={selectedBlock.props.posterUrl}
                alt={selectedBlock.props.posterAlt}
                onChangeUrl={(url) => updateProps({ posterUrl: url })}
                onChangeAlt={(alt) => updateProps({ posterAlt: alt })}
              />
            </>
          )}

          {selectedBlock.type === 'team' && (
            <>
              <LayoutPicker
                label="Grid & Card Style"
                value={selectedBlock.props.layout || 'cards'}
                options={[
                  { value: 'cards', label: 'Portrait Cards', glyph: 'cards' },
                  { value: 'horizontal', label: 'Bio Rows', glyph: 'rows' },
                  { value: 'minimal', label: 'Open Editorial', glyph: 'minimal' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              {(selectedBlock.props.layout || 'cards') !== 'horizontal' && (
                <div>
                  <div className="text-[13px] font-medium text-black mb-1">Columns</div>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                    {([2, 3, 4] as const).map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => updateProps({ columns: cols })}
                        className={`py-1.5 text-[13px] font-medium rounded-md cursor-pointer ${
                          selectedBlock.props.columns === cols
                            ? 'bg-white text-black shadow-xs'
                            : 'text-black'
                        }`}
                      >
                        {cols} Cols
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Intro"
                value={selectedBlock.props.intro}
                onChange={(v) => updateProps({ intro: v })}
                multiline
              />
              <div className="space-y-3 pt-2">
                {selectedBlock.props.members.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-black">
                        Member {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateProps({
                            members: selectedBlock.props.members.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-black hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <TextInput
                      label="Full Name"
                      value={member.name}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.members];
                        next[idx] = { ...member, name: v };
                        updateProps({ members: next });
                      }}
                    />
                    <TextInput
                      label="Role / Title"
                      value={member.role}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.members];
                        next[idx] = { ...member, role: v };
                        updateProps({ members: next });
                      }}
                    />
                    <TextInput
                      label="Short Bio"
                      value={member.bio}
                      onChange={(v) => {
                        const next = [...selectedBlock.props.members];
                        next[idx] = { ...member, bio: v };
                        updateProps({ members: next });
                      }}
                      multiline
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        label="LinkedIn URL"
                        value={member.linkedinUrl || ''}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.members];
                          next[idx] = { ...member, linkedinUrl: v };
                          updateProps({ members: next });
                        }}
                      />
                      <TextInput
                        label="X / Social URL"
                        value={member.xUrl || ''}
                        onChange={(v) => {
                          const next = [...selectedBlock.props.members];
                          next[idx] = { ...member, xUrl: v };
                          updateProps({ members: next });
                        }}
                      />
                    </div>
                    <ImageAssetPicker
                      value={member.imageUrl}
                      alt={member.imageAlt}
                      onChangeUrl={(url) => {
                        const next = [...selectedBlock.props.members];
                        next[idx] = { ...member, imageUrl: url };
                        updateProps({ members: next });
                      }}
                      onChangeAlt={(alt) => {
                        const next = [...selectedBlock.props.members];
                        next[idx] = { ...member, imageAlt: alt };
                        updateProps({ members: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateProps({
                      members: [
                        ...selectedBlock.props.members,
                        {
                          name: 'David Lindholm',
                          role: 'Partner · Engineering',
                          bio: 'Specializing in scalable design systems and architectural performance.',
                          imageUrl: STUDIO_IMAGES[8]?.url || STUDIO_IMAGES[2].url,
                          imageAlt: 'Portrait of David Lindholm',
                          linkedinUrl: 'https://linkedin.com',
                        },
                      ],
                    })
                  }
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-black hover:bg-slate-50 cursor-pointer"
                >
                  + Add Team Member
                </button>
              </div>
            </>
          )}

          {selectedBlock.type === 'calculator' && (
            <>
              <LayoutPicker
                label="Calculator Layout"
                value={selectedBlock.props.layout || 'split'}
                options={[
                  { value: 'split', label: 'Sliders Left', glyph: 'split-right' },
                  { value: 'split-reverse', label: 'Summary Left', glyph: 'split-left' },
                  { value: 'stacked', label: 'Stacked', glyph: 'stacked' },
                ]}
                onChange={(lay) => updateProps({ layout: lay })}
              />
              <TextInput
                label="Eyebrow"
                value={selectedBlock.props.eyebrow}
                onChange={(v) => updateProps({ eyebrow: v })}
              />
              <TextInput
                label="Heading"
                value={selectedBlock.props.heading}
                onChange={(v) => updateProps({ heading: v })}
                multiline
              />
              <TextInput
                label="Intro"
                value={selectedBlock.props.intro}
                onChange={(v) => updateProps({ intro: v })}
                multiline
              />
              <div className="pt-2 border-t border-[#DAD4C6] space-y-2.5">
                <div className="text-[13px] font-semibold text-black">
                  Primary Slider (e.g. Seats)
                </div>
                <TextInput
                  label="Label"
                  value={selectedBlock.props.primaryInputLabel}
                  onChange={(v) => updateProps({ primaryInputLabel: v })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Default Value"
                    value={selectedBlock.props.primaryDefault}
                    min={selectedBlock.props.primaryMin}
                    max={selectedBlock.props.primaryMax}
                    onChange={(v) => updateProps({ primaryDefault: v })}
                  />
                  <TextInput
                    label="Unit Label"
                    value={selectedBlock.props.primaryUnitLabel}
                    onChange={(v) => updateProps({ primaryUnitLabel: v })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput
                    label="Min"
                    value={selectedBlock.props.primaryMin}
                    onChange={(v) => updateProps({ primaryMin: v })}
                  />
                  <NumberInput
                    label="Max"
                    value={selectedBlock.props.primaryMax}
                    onChange={(v) => updateProps({ primaryMax: v })}
                  />
                  <NumberInput
                    label="Step"
                    value={selectedBlock.props.primaryStep}
                    min={1}
                    onChange={(v) => updateProps({ primaryStep: Math.max(1, v) })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#DAD4C6] space-y-2.5">
                <div className="text-[13px] font-semibold text-black">
                  Secondary Slider (e.g. Hours Saved)
                </div>
                <TextInput
                  label="Label"
                  value={selectedBlock.props.secondaryInputLabel}
                  onChange={(v) => updateProps({ secondaryInputLabel: v })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Default Value"
                    value={selectedBlock.props.secondaryDefault}
                    min={selectedBlock.props.secondaryMin}
                    max={selectedBlock.props.secondaryMax}
                    onChange={(v) => updateProps({ secondaryDefault: v })}
                  />
                  <TextInput
                    label="Unit Label"
                    value={selectedBlock.props.secondaryUnitLabel}
                    onChange={(v) => updateProps({ secondaryUnitLabel: v })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput
                    label="Min"
                    value={selectedBlock.props.secondaryMin}
                    onChange={(v) => updateProps({ secondaryMin: v })}
                  />
                  <NumberInput
                    label="Max"
                    value={selectedBlock.props.secondaryMax}
                    onChange={(v) => updateProps({ secondaryMax: v })}
                  />
                  <NumberInput
                    label="Step"
                    value={selectedBlock.props.secondaryStep}
                    min={1}
                    onChange={(v) => updateProps({ secondaryStep: Math.max(1, v) })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#DAD4C6] space-y-2.5">
                <div className="text-[13px] font-semibold text-black">
                  ROI &amp; Pricing Formula
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    label="Currency"
                    value={selectedBlock.props.currencySymbol}
                    onChange={(v) => updateProps({ currencySymbol: v })}
                  />
                  <NumberInput
                    label="Hourly Rate"
                    value={selectedBlock.props.hourlyRate}
                    min={1}
                    onChange={(v) => updateProps({ hourlyRate: Math.max(1, v) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Base Fee / mo"
                    value={selectedBlock.props.baseMonthlyFee}
                    min={0}
                    onChange={(v) => updateProps({ baseMonthlyFee: Math.max(0, v) })}
                  />
                  <NumberInput
                    label="Cost per Unit"
                    value={selectedBlock.props.monthlyPlatformCostPerPrimary}
                    min={0}
                    onChange={(v) =>
                      updateProps({ monthlyPlatformCostPerPrimary: Math.max(0, v) })
                    }
                  />
                </div>
                <TextInput
                  label="Result Headline"
                  value={selectedBlock.props.roiHeadlineLabel}
                  onChange={(v) => updateProps({ roiHeadlineLabel: v })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    label="CTA Label"
                    value={selectedBlock.props.ctaLabel}
                    onChange={(v) => updateProps({ ctaLabel: v })}
                  />
                  <TextInput
                    label="CTA Link"
                    value={selectedBlock.props.ctaHref}
                    onChange={(v) => updateProps({ ctaHref: v })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
