import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CreditCard,
  Eye,
  FolderKanban,
  GripVertical,
  HelpCircle,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Navigation,
  Palette,
  PanelBottom,
  PlaySquare,
  Plus,
  Search,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  BODY_FONTS,
  BRAND_PALETTE_PRESETS,
  DISPLAY_FONTS,
  ELEMENT_PALETTE,
  STARTER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_META,
  TemplateCategory,
} from '../data/presets';
import { BlockType, SiteProject, SiteTheme } from '../types/builder';

export type LeftRailTab = 'prompt' | 'elements' | 'theme' | 'templates';

interface LeftRailProps {
  activeTab: LeftRailTab;
  onTabChange: (tab: LeftRailTab) => void;
  project: SiteProject;
  savedProjects: SiteProject[];
  isGenerating: boolean;
  generationError: string | null;
  onGenerateTemplate: (prompt: string, style: string) => Promise<void>;
  onAddBlock: (type: BlockType) => void;
  onUpdateTheme: (patch: Partial<SiteTheme>) => void;
  onUpdateProjectMeta: (patch: Partial<SiteProject>) => void;
  onLoadTemplate: (template: SiteProject) => void;
  onPreviewTemplate: (template: SiteProject) => void;
  onOpenTemplateGallery: () => void;
  onOpenDomains?: () => void;
  onCreateBlank: () => void;
  onSaveProjectSnapshot: () => void;
  onDuplicateForClient: () => void;
  onDeleteSavedProject: (id: string) => void;
}

const PROMPT_SUGGESTIONS = [
  'Architectural timber and concrete design practice in Copenhagen with project metrics and inquiry form',
  'Precision CNC aluminum coffee grinder brand with technical specs, gallery showcase, and 2 hardware editions',
  'B2B cold-chain logistics telemetry SaaS with pricing tiers, accuracy benchmarks, and FAQ',
  'Boutique botanical conservatory and architectural event venue in the Hudson Valley',
];

const STYLE_OPTIONS = [
  'Auto-match prompt',
  'Editorial Minimal',
  'Industrial Contrast',
  'Warm Architectural Serif',
  'Crisp SaaS Utility',
];

function getBlockIcon(type: BlockType) {
  switch (type) {
    case 'navbar':
      return <Navigation className="w-4 h-4" />;
    case 'hero':
      return <LayoutTemplate className="w-4 h-4" />;
    case 'logocloud':
      return <Building2 className="w-4 h-4" />;
    case 'stats':
      return <BarChart3 className="w-4 h-4" />;
    case 'features':
      return <LayoutGrid className="w-4 h-4" />;
    case 'showcase':
      return <BookOpen className="w-4 h-4" />;
    case 'portfolio':
      return <FolderKanban className="w-4 h-4" />;
    case 'video':
      return <PlaySquare className="w-4 h-4" />;
    case 'team':
      return <Users className="w-4 h-4" />;
    case 'pricing':
      return <CreditCard className="w-4 h-4" />;
    case 'calculator':
      return <Calculator className="w-4 h-4" />;
    case 'testimonial':
      return <MessageSquareQuote className="w-4 h-4" />;
    case 'faq':
      return <HelpCircle className="w-4 h-4" />;
    case 'cta':
      return <Megaphone className="w-4 h-4" />;
    case 'contact':
      return <Mail className="w-4 h-4" />;
    case 'footer':
      return <PanelBottom className="w-4 h-4" />;
  }
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  onTabChange,
  project,
  savedProjects,
  isGenerating,
  generationError,
  onGenerateTemplate,
  onAddBlock,
  onUpdateTheme,
  onUpdateProjectMeta,
  onLoadTemplate,
  onPreviewTemplate,
  onOpenTemplateGallery,
  onOpenDomains,
  onCreateBlank,
  onSaveProjectSnapshot,
  onDuplicateForClient,
  onDeleteSavedProject,
}) => {
  const [promptInput, setPromptInput] = useState(
    'Design a responsive site for an architectural acoustic studio crafting modular wood sound panels'
  );
  const [styleChoice, setStyleChoice] = useState(STYLE_OPTIONS[0]);
  const [elementQuery, setElementQuery] = useState('');
  const [presetCategory, setPresetCategory] = useState<TemplateCategory>('All');

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    await onGenerateTemplate(promptInput.trim(), styleChoice);
  };

  const categories: Array<'Structure' | 'Content' | 'Conversion'> = [
    'Structure',
    'Content',
    'Conversion',
  ];

  const normalizedQuery = elementQuery.trim().toLowerCase();

  return (
    <aside className="w-[328px] shrink-0 bg-white border-r border-[#DAD4C6] flex flex-col h-full overflow-hidden">
      {/* Segmented Rail Navigation */}
      <div className="p-2.5 border-b border-[#DAD4C6] bg-[#F8F6F1]">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
          <button
            type="button"
            onClick={() => onTabChange('prompt')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'prompt'
                ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                : 'text-black hover:bg-white/60'
            }`}
          >
            <Wand2 className="w-4 h-4 text-[#1D4ED8]" />
            <span>Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('elements')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'elements'
                ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                : 'text-black hover:bg-white/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-[#1D4ED8]" />
            <span>Elements</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('theme')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                : 'text-black hover:bg-white/60'
            }`}
          >
            <Palette className="w-4 h-4 text-[#B45309]" />
            <span>Tokens</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('templates')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                : 'text-black hover:bg-white/60'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 text-[#13151A]" />
            <span>Presets</span>
          </button>
        </div>
      </div>

      {/* Rail Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-4">
        {activeTab === 'prompt' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-black">
                AI Template Generator
              </h2>
              <p className="text-sm text-black mt-1 leading-relaxed">
                Describe the brand, audience, and sections you need. Generates a complete responsive layout ready for drag-and-drop editing.
              </p>
            </div>

            <form onSubmit={handlePromptSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="ai-prompt-input"
                  className="block text-sm font-medium text-black mb-1.5"
                >
                  Site Brief
                </label>
                <textarea
                  id="ai-prompt-input"
                  rows={4}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Describe your company, product, tone, and desired sections..."
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/60 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="ai-style-select"
                  className="block text-sm font-medium text-black mb-1.5"
                >
                  Visual Direction
                </label>
                <select
                  id="ai-style-select"
                  value={styleChoice}
                  onChange={(e) => setStyleChoice(e.target.value)}
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {generationError && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {generationError}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating || !promptInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 px-4 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Generating Template...' : 'Generate Template'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-[#DAD4C6]">
              <div className="text-sm font-semibold text-black mb-2.5">
                Example Briefs
              </div>
              <div className="space-y-2">
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptInput(suggestion)}
                    className="w-full text-left p-3 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] hover:bg-white text-sm text-black leading-relaxed transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'elements' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-black">
                Drag &amp; Drop Elements
              </h2>
              <p className="text-sm text-black mt-1">
                Drag any section onto the canvas or click + to insert.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={elementQuery}
                onChange={(e) => setElementQuery(e.target.value)}
                placeholder="Filter sections (hero, pricing, faq...)"
                className="w-full rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] focus:bg-white pl-9 pr-8 py-2 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              {elementQuery && (
                <button
                  type="button"
                  onClick={() => setElementQuery('')}
                  aria-label="Clear section filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-[#1D4ED8] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {categories.map((cat) => {
              const items = ELEMENT_PALETTE.filter(
                (el) =>
                  el.category === cat &&
                  (!normalizedQuery ||
                    el.title.toLowerCase().includes(normalizedQuery) ||
                    el.summary.toLowerCase().includes(normalizedQuery) ||
                    el.type.toLowerCase().includes(normalizedQuery))
              );
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <div className="text-sm font-semibold text-black">{cat}</div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/x-atelier-new-block', item.type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="group flex items-start gap-2.5 p-2.5 rounded-lg border border-[#DAD4C6] bg-white hover:border-[#1D4ED8] hover:shadow-xs transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="mt-0.5 text-black group-hover:text-[#1D4ED8] shrink-0">
                          {getBlockIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-black">
                            {item.title}
                          </div>
                          <div className="text-[13px] text-black leading-snug mt-0.5">
                            {item.summary}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <GripVertical className="w-3.5 h-3.5 text-black" />
                          <button
                            type="button"
                            onClick={() => onAddBlock(item.type)}
                            title={`Insert ${item.title}`}
                            className="p-1 rounded hover:bg-blue-50 text-black hover:text-[#1D4ED8] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-black">
                Design System &amp; Brand Colors
              </h2>
              <p className="text-sm text-black mt-1">
                Apply a curated brand palette or customize tokens synced directly to CSS variables.
              </p>
            </div>

            {/* Live Typography & Palette Specimen */}
            <div
              className="p-3.5 rounded-lg border flex items-center justify-between gap-3"
              style={{
                backgroundColor: project.theme.backgroundColor,
                borderColor: project.theme.borderColor,
              }}
            >
              <div className="min-w-0">
                <div
                  className="text-base font-bold truncate"
                  style={{
                    fontFamily: `"${project.theme.displayFont}", system-ui, sans-serif`,
                    color: project.theme.textColor,
                  }}
                >
                  {project.theme.displayFont}
                </div>
                <div
                  className="text-xs truncate mt-0.5"
                  style={{
                    fontFamily: `"${project.theme.bodyFont}", system-ui, sans-serif`,
                    color: project.theme.mutedTextColor,
                  }}
                >
                  Body in {project.theme.bodyFont}
                </div>
              </div>
              <span
                className="px-2.5 py-1 text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: project.theme.primaryColor,
                  color: project.theme.accentTextColor,
                  borderRadius: project.theme.radius,
                }}
              >
                Action
              </span>
            </div>

            {/* One-Click Brand Palette Presets */}
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-black">
                Brand Palette Presets
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BRAND_PALETTE_PRESETS.map((preset) => {
                  const isActive =
                    project.theme.primaryColor.toLowerCase() ===
                      preset.theme.primaryColor.toLowerCase() &&
                    project.theme.contrastBgColor.toLowerCase() ===
                      preset.theme.contrastBgColor.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onUpdateTheme(preset.theme)}
                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#1D4ED8] bg-blue-50/40 ring-1 ring-[#1D4ED8]'
                          : 'border-[#DAD4C6] bg-white hover:border-[#13151A]'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <span
                          className="w-4 h-4 rounded border border-black/15"
                          style={{ backgroundColor: preset.theme.backgroundColor }}
                        />
                        <span
                          className="w-4 h-4 rounded border border-black/15"
                          style={{ backgroundColor: preset.theme.surfaceColor }}
                        />
                        <span
                          className="w-4 h-4 rounded border border-black/15"
                          style={{ backgroundColor: preset.theme.primaryColor }}
                        />
                        <span
                          className="w-4 h-4 rounded border border-black/15"
                          style={{ backgroundColor: preset.theme.contrastBgColor }}
                        />
                      </div>
                      <div className="text-[13px] font-semibold text-black truncate">
                        {preset.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#DAD4C6]">
              <div className="text-sm font-semibold text-black">Typography</div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  Display Font
                </label>
                <select
                  value={project.theme.displayFont}
                  onChange={(e) => onUpdateTheme({ displayFont: e.target.value })}
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-2 text-sm text-black bg-white"
                >
                  {DISPLAY_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  Body Font
                </label>
                <select
                  value={project.theme.bodyFont}
                  onChange={(e) => onUpdateTheme({ bodyFont: e.target.value })}
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-2 text-sm text-black bg-white"
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#DAD4C6]">
              <div className="text-sm font-semibold text-black">Color Palette</div>
              {(
                [
                  ['Primary Accent', 'primaryColor'],
                  ['Canvas Background', 'backgroundColor'],
                  ['Surface Tint', 'surfaceColor'],
                  ['Contrast Band', 'contrastBgColor'],
                  ['Primary Ink', 'textColor'],
                  ['Muted Ink', 'mutedTextColor'],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-black">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={project.theme[key]}
                      onChange={(e) => onUpdateTheme({ [key]: e.target.value })}
                      className="w-6 h-6 rounded border border-[#DAD4C6] cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={project.theme[key]}
                      onChange={(e) => onUpdateTheme({ [key]: e.target.value })}
                      className="w-[84px] px-1.5 py-1 text-[13px] text-black font-mono border border-[#DAD4C6] rounded bg-white tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-[#DAD4C6]">
              <div className="text-sm font-semibold text-black">
                Geometry &amp; Rhythm
              </div>
              <div>
                <div className="text-[13px] text-black mb-1.5">Corner Radius</div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                  {(['0px', '6px', '12px'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onUpdateTheme({ radius: r })}
                      className={`py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                        project.theme.radius === r
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black'
                      }`}
                    >
                      {r === '0px' ? 'Sharp' : r === '6px' ? 'Subtle' : 'Soft'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] text-black mb-1.5">Section Spacing</div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                  {(['compact', 'balanced', 'airy'] as const).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => onUpdateTheme({ spacing: sp })}
                      className={`py-1.5 text-sm font-medium capitalize rounded-md transition-colors cursor-pointer ${
                        project.theme.spacing === sp
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] text-black mb-1.5">
                  Motion &amp; Animation
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE6DC] rounded-lg">
                  {(
                    [
                      ['none', 'Off'],
                      ['subtle', 'Subtle'],
                      ['editorial', 'Editorial'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateTheme({ motion: mode })}
                      className={`py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                        (project.theme.motion || 'editorial') === mode
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#DAD4C6]">
              <div className="text-sm font-semibold text-black">
                Client &amp; SEO Metadata
              </div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  Client Account
                </label>
                <input
                  type="text"
                  value={project.clientName || ''}
                  onChange={(e) =>
                    onUpdateProjectMeta({ clientName: e.target.value })
                  }
                  placeholder="Acme Architecture"
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 bg-white"
                />
              </div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  SEO Page Title
                </label>
                <input
                  type="text"
                  value={project.seo?.title || ''}
                  onChange={(e) =>
                    onUpdateProjectMeta({
                      seo: { ...project.seo, title: e.target.value },
                    })
                  }
                  placeholder={project.name}
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 bg-white"
                />
              </div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={project.seo?.description || ''}
                  onChange={(e) =>
                    onUpdateProjectMeta({
                      seo: { ...project.seo, description: e.target.value },
                    })
                  }
                  placeholder={project.description}
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 bg-white resize-none"
                />
              </div>
              <div>
                <label className="block text-[13px] text-black mb-1">
                  Canonical Domain (Optional)
                </label>
                <input
                  type="text"
                  value={project.seo?.customDomain || ''}
                  onChange={(e) =>
                    onUpdateProjectMeta({
                      seo: { ...project.seo, customDomain: e.target.value },
                    })
                  }
                  placeholder="https://clientdomain.com"
                  className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 font-mono bg-white"
                />
                {onOpenDomains && (
                  <button
                    type="button"
                    onClick={onOpenDomains}
                    className="mt-1.5 text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Connect DNS or Transfer Domain →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-black">
                  Client Sites &amp; Presets
                </h2>
                <p className="text-sm text-black mt-0.5">
                  Manage client builds or start from a curated layout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSaveProjectSnapshot}
                className="py-2 px-3 rounded-lg bg-[#13151A] hover:bg-black text-sm font-semibold text-white cursor-pointer"
              >
                Save Client Site
              </button>
              <button
                type="button"
                onClick={onDuplicateForClient}
                className="py-2 px-3 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-semibold text-black cursor-pointer"
              >
                Clone for Client
              </button>
            </div>
            <button
              type="button"
              onClick={onCreateBlank}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-[#C8C1B2] hover:bg-[#FAF9F5] text-sm font-medium text-black cursor-pointer"
            >
              + New Blank Client Canvas
            </button>

            <div className="space-y-3 pt-2 border-t border-[#DAD4C6]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-black">
                  Starter Templates ({STARTER_TEMPLATES.length})
                </div>
                <button
                  type="button"
                  onClick={onOpenTemplateGallery}
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  Open Gallery
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      presetCategory === cat
                        ? 'bg-[#13151A] text-white'
                        : 'bg-[#FAF9F5] border border-[#DAD4C6] text-black hover:bg-[#EAE6DC]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {STARTER_TEMPLATES.filter(
                  (tpl) =>
                    presetCategory === 'All' ||
                    TEMPLATE_META[tpl.id]?.category === presetCategory
                ).map((tpl) => {
                  const meta = TEMPLATE_META[tpl.id];
                  return (
                    <div
                      key={tpl.id}
                      className="w-full text-left p-3 rounded-lg border border-[#DAD4C6] bg-white hover:border-[#13151A] transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-black">
                          {tpl.name}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
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
                      <p className="text-[13px] text-black leading-relaxed">
                        {tpl.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs text-black tabular-nums">
                        <span className="font-medium">
                          {meta?.category || 'Starter'} · {tpl.blocks.length} sections
                        </span>
                        <span>{tpl.theme.displayFont}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onPreviewTemplate(tpl)}
                          className="py-1.5 px-2.5 rounded-md border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-black flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#1D4ED8]" />
                          <span>Demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onLoadTemplate(tpl)}
                          className="py-1.5 px-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {savedProjects.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#DAD4C6]">
                <div className="text-sm font-semibold text-black">
                  Saved Client Workspaces
                </div>
                {savedProjects.map((saved) => (
                  <div
                    key={saved.id}
                    className="p-2.5 rounded-lg border border-[#DAD4C6] bg-white flex items-start justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => onLoadTemplate(saved)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="text-sm font-semibold text-black truncate">
                        {saved.name}
                      </div>
                      <div className="text-[13px] text-black truncate">
                        {saved.clientName || 'Internal Studio'}
                      </div>
                      <div className="text-[13px] text-black mt-0.5 tabular-nums">
                        {saved.blocks.length} blocks ·{' '}
                        {new Date(saved.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedProject(saved.id)}
                      className="text-[13px] text-black hover:text-red-600 px-1.5 py-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
