import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Globe,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { SitePage, SiteProject } from '../types/builder';
import {
  createPageId,
  createStarterPageBlocks,
  ensureProjectPages,
  normalizePagePath,
  PageStarterPreset,
  syncNavigationLinksAcrossPages,
} from '../utils/sitePages';

interface PageManagerModalProps {
  open: boolean;
  project: SiteProject;
  onClose: () => void;
  onUpdatePages: (nextPages: SitePage[], nextActivePageId: string) => void;
  onNotify?: (msg: string) => void;
}

const PAGE_PRESETS: Array<{
  preset: PageStarterPreset;
  name: string;
  path: string;
  summary: string;
}> = [
  {
    preset: 'about',
    name: 'About',
    path: '/about',
    summary: 'Hero intro, key metrics, studio story & client quote',
  },
  {
    preset: 'services',
    name: 'Services',
    path: '/services',
    summary: 'Capabilities grid, FAQ accordion & inquiry banner',
  },
  {
    preset: 'pricing',
    name: 'Pricing',
    path: '/pricing',
    summary: 'Tier comparison table paired with billing FAQ',
  },
  {
    preset: 'work',
    name: 'Work',
    path: '/work',
    summary: 'Alternating case study showcases & performance stats',
  },
  {
    preset: 'contact',
    name: 'Contact',
    path: '/contact',
    summary: 'Direct lead capture form, studio details & FAQ',
  },
  {
    preset: 'blank',
    name: 'Custom Page',
    path: '/custom',
    summary: 'Clean starter page inheriting your navbar & footer',
  },
];

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  open,
  project,
  onClose,
  onUpdatePages,
  onNotify,
}) => {
  const { pages, activePageId } = ensureProjectPages(project);
  const [selectedPreset, setSelectedPreset] = useState<PageStarterPreset>('about');
  const [newName, setNewName] = useState('About');
  const [newPath, setNewPath] = useState('/about');
  const [autoSyncNav, setAutoSyncNav] = useState(true);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSelectPreset = (item: (typeof PAGE_PRESETS)[number]) => {
    setSelectedPreset(item.preset);
    setNewName(item.name);
    setNewPath(item.path);
    setError(null);
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = newName.trim() || 'New Page';
    let normPath = normalizePagePath(newPath || trimmedName);
    if (normPath === '/') {
      normPath = `/${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page'}`;
    }

    if (pages.some((p) => normalizePagePath(p.path) === normPath)) {
      setError(`A page with path "${normPath}" already exists.`);
      return;
    }

    // Ensure current active blocks are persisted before branching
    const syncedCurrent = pages.map((p) =>
      p.id === activePageId ? { ...p, blocks: project.blocks } : p
    );

    const newPage: SitePage = {
      id: createPageId(),
      name: trimmedName,
      path: normPath,
      blocks: createStarterPageBlocks(selectedPreset, project, trimmedName),
      seo: {
        title: `${trimmedName} — ${project.seo?.title?.trim() || project.name}`,
        description: project.seo?.description || project.description,
      },
    };

    let nextPages = [...syncedCurrent, newPage];
    if (autoSyncNav) {
      nextPages = syncNavigationLinksAcrossPages(nextPages);
    }

    onUpdatePages(nextPages, newPage.id);
    onNotify?.(`Added ${trimmedName} (${normPath})`);
    onClose();
  };

  const handleDuplicatePage = (page: SitePage) => {
    const baseSlug = page.path === '/' ? '/home-copy' : `${page.path}-copy`;
    let candidate = baseSlug;
    let n = 2;
    while (pages.some((p) => normalizePagePath(p.path) === candidate)) {
      candidate = `${baseSlug}-${n++}`;
    }

    const syncedCurrent = pages.map((p) =>
      p.id === activePageId ? { ...p, blocks: project.blocks } : p
    );
    const source = syncedCurrent.find((p) => p.id === page.id) || page;
    const copy: SitePage = {
      id: createPageId(),
      name: `${source.name} Copy`,
      path: candidate,
      blocks: structuredClone(source.blocks),
      seo: source.seo ? { ...source.seo } : undefined,
    };

    const nextPages = [...syncedCurrent, copy];
    onUpdatePages(nextPages, copy.id);
    onNotify?.(`Duplicated ${source.name} to ${candidate}`);
  };

  const handleStartEdit = (page: SitePage) => {
    setEditingPageId(page.id);
    setEditName(page.name);
    setEditPath(page.path);
    setError(null);
  };

  const handleSaveEdit = (pageId: string) => {
    const trimmedName = editName.trim() || 'Page';
    const isHome = pages[0]?.id === pageId || editPath.trim() === '/';
    const normPath = isHome ? '/' : normalizePagePath(editPath || trimmedName);
    if (pages.some((p) => p.id !== pageId && normalizePagePath(p.path) === normPath)) {
      setError(`Another page already uses "${normPath}".`);
      return;
    }

    const syncedCurrent = pages.map((p) =>
      p.id === activePageId ? { ...p, blocks: project.blocks } : p
    );
    let nextPages = syncedCurrent.map((p) =>
      p.id === pageId ? { ...p, name: trimmedName, path: normPath } : p
    );
    if (autoSyncNav) {
      nextPages = syncNavigationLinksAcrossPages(nextPages);
    }
    onUpdatePages(nextPages, activePageId);
    setEditingPageId(null);
    onNotify?.(`Updated page "${trimmedName}"`);
  };

  const handleDeletePage = (page: SitePage) => {
    if (page.path === '/' || pages.length <= 1) return;
    const syncedCurrent = pages.map((p) =>
      p.id === activePageId ? { ...p, blocks: project.blocks } : p
    );
    let nextPages = syncedCurrent.filter((p) => p.id !== page.id);
    if (autoSyncNav) {
      nextPages = syncNavigationLinksAcrossPages(nextPages);
    }
    const nextActive =
      activePageId === page.id ? nextPages[0].id : activePageId;
    onUpdatePages(nextPages, nextActive);
    onNotify?.(`Removed ${page.path}`);
  };

  const handleSyncAllNav = () => {
    const syncedCurrent = pages.map((p) =>
      p.id === activePageId ? { ...p, blocks: project.blocks } : p
    );
    const updated = syncNavigationLinksAcrossPages(syncedCurrent);
    onUpdatePages(updated, activePageId);
    onNotify?.('Synced header & footer links across all pages');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#13151A]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl border border-[#DAD4C6] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-[#DAD4C6] bg-[#F8F6F1] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#1D4ED8]" />
            <div>
              <h2 className="text-base font-bold text-black">
                Site Pages &amp; Navigation Routes
              </h2>
              <p className="text-xs text-black">
                Build a multi-page website with individual routes, per-page SEO, and automatic sitemap.xml generation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pages manager"
            className="p-1.5 rounded-md text-black hover:bg-[#EAE6DC] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto studio-scroll p-5 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Existing Pages List */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-black">
                Active Website Pages ({pages.length})
              </div>
              <button
                type="button"
                onClick={handleSyncAllNav}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-[#EAE6DC] text-xs font-semibold text-black cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Sync Navbar &amp; Footer Links Across All Pages</span>
              </button>
            </div>

            <div className="divide-y divide-[#DAD4C6] border border-[#DAD4C6] rounded-xl overflow-hidden bg-white">
              {pages.map((page, idx) => {
                const isActive = page.id === activePageId;
                const isHome = page.path === '/';
                const isEditing = editingPageId === page.id;
                const blockCount =
                  isActive ? project.blocks.length : page.blocks.length;

                return (
                  <div
                    key={page.id}
                    className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                      isActive ? 'bg-[#F0F5FF]/70' : 'bg-white'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Page name"
                          className="rounded-md border border-[#DAD4C6] px-2.5 py-1 text-sm text-black w-36"
                        />
                        <input
                          type="text"
                          value={editPath}
                          disabled={isHome}
                          onChange={(e) => setEditPath(e.target.value)}
                          placeholder="/route"
                          className="rounded-md border border-[#DAD4C6] px-2.5 py-1 text-sm font-mono text-black w-40 disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(page.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPageId(null)}
                          className="px-2 py-1 rounded-md border border-[#DAD4C6] text-xs font-medium text-black cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded bg-[#FAF9F5] border border-[#DAD4C6] flex items-center justify-center text-[11px] font-mono font-bold text-black shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const synced = pages.map((p) =>
                                    p.id === activePageId
                                      ? { ...p, blocks: project.blocks }
                                      : p
                                  );
                                  onUpdatePages(synced, page.id);
                                  onClose();
                                }}
                                className="text-sm font-bold text-black hover:text-[#1D4ED8] cursor-pointer text-left"
                              >
                                {page.name}
                              </button>
                              {isHome && (
                                <span className="text-[11px] font-mono font-semibold text-black border border-[#DAD4C6] bg-[#FAF9F5] px-1.5 py-0.5 rounded">
                                  Root /
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[11px] font-semibold text-[#1D4ED8]">
                                  · Editing
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-black">
                              {page.path} · {blockCount} sections
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                const synced = pages.map((p) =>
                                  p.id === activePageId
                                    ? { ...p, blocks: project.blocks }
                                    : p
                                );
                                onUpdatePages(synced, page.id);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#13151A] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                            >
                              Edit Page
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(page)}
                            className="px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-medium text-black cursor-pointer"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicatePage(page)}
                            title="Duplicate page"
                            className="p-1.5 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {!isHome && (
                            <button
                              type="button"
                              onClick={() => handleDeletePage(page)}
                              title="Delete page"
                              className="p-1.5 rounded-md border border-[#DAD4C6] bg-white hover:bg-red-50 text-black hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Page Section */}
          <form
            onSubmit={handleCreatePage}
            className="p-4 rounded-xl border border-[#DAD4C6] bg-[#FAF9F5] space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1D4ED8]" />
                <span className="text-sm font-bold text-black">
                  Add a New Page
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncNav}
                  onChange={(e) => setAutoSyncNav(e.target.checked)}
                  className="rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
                <span>Auto-link in Navbar &amp; Footer</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAGE_PRESETS.map((item) => {
                const active = selectedPreset === item.preset;
                return (
                  <button
                    key={item.preset}
                    type="button"
                    onClick={() => handleSelectPreset(item)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-white ring-2 ring-[#1D4ED8]/20'
                        : 'border-[#DAD4C6] bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-black">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-black">
                        {item.path}
                      </span>
                    </div>
                    <p className="text-[11px] text-black mt-1 leading-snug">
                      {item.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label
                  htmlFor="new-page-name"
                  className="block text-xs font-semibold text-black mb-1"
                >
                  Page Title
                </label>
                <input
                  id="new-page-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (selectedPreset === 'blank') {
                      const autoSlug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                      setNewPath(autoSlug ? `/${autoSlug}` : '/custom');
                    }
                  }}
                  placeholder="About Us"
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="new-page-path"
                  className="block text-xs font-semibold text-black mb-1"
                >
                  URL Path
                </label>
                <input
                  id="new-page-path"
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="/about"
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Page</span>
                </button>
              </div>
            </div>
          </form>

          <div className="px-4 py-3 rounded-lg border border-[#DAD4C6] bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-black">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#047857]" />
              <span>
                <strong>Auto-Sitemap Active:</strong> Publishing generates{' '}
                <span className="font-mono">/sitemap.xml</span> &amp;{' '}
                <span className="font-mono">/robots.txt</span> covering all {pages.length} page routes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
