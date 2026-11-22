import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BarChart3,
  Check,
  Code2,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Layers,
  LayoutTemplate,
  Megaphone,
  Monitor,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  Plus,
  Rocket,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
  X,
} from 'lucide-react';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CanvasBlockRenderer } from './components/CanvasBlockRenderer';
import { CodeHandoffView } from './components/CodeHandoffView';
import { DeployModal, DeployModalTab } from './components/DeployModal';
import { LeftRail, LeftRailTab } from './components/LeftRail';
import { MarketingView } from './components/MarketingView';
import { PageManagerModal } from './components/PageManagerModal';
import { PricingView } from './components/PricingView';
import { RightInspector, RightInspectorTab } from './components/RightInspector';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import {
  createBlockId,
  createDefaultBlock,
  DEFAULT_THEME,
  slugify,
  STARTER_TEMPLATES,
} from './data/presets';
import {
  BlockType,
  DeployedSiteRecord,
  ExportOptions,
  PricingBlock,
  PricingTier,
  SiteBlock,
  SitePage,
  SiteProject,
  SiteTheme,
  StudioView,
  ViewportMode,
} from './types/builder';
import { generateCleanHtml } from './utils/codeGenerator';
import {
  ensureProjectPages,
  normalizePagePath,
  switchProjectActivePage,
  syncActivePageIntoProject,
} from './utils/sitePages';

const ACTIVE_STORAGE_KEY = 'atelier_frame_active_project_v1';
const SAVED_STORAGE_KEY = 'atelier_frame_saved_projects_v1';

function loadInitialProject(): SiteProject {
  try {
    const raw = localStorage.getItem(ACTIVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteProject;
      if (parsed && Array.isArray(parsed.blocks) && parsed.theme) {
        const legacyGreyInk = new Set(['#475569', '#4B5563', '#525A54', '#0F172A', '#111827', '#181D1A']);
        if (legacyGreyInk.has(parsed.theme.mutedTextColor)) {
          parsed.theme.mutedTextColor = '#000000';
        }
        if (legacyGreyInk.has(parsed.theme.textColor)) {
          parsed.theme.textColor = '#000000';
        }
        const { pages, activePage, activePageId } = ensureProjectPages(parsed);
        return {
          ...parsed,
          pages,
          activePageId,
          blocks: activePage.blocks,
        };
      }
    }
  } catch {
    // Fallback to starter template
  }
  const starter = structuredClone(STARTER_TEMPLATES[0]);
  const { pages, activePageId } = ensureProjectPages(starter);
  return {
    ...starter,
    pages,
    activePageId,
  };
}

function loadSavedProjects(): SiteProject[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Ignore storage error
  }
  return [];
}

export default function App() {
  const [project, setProject] = useState<SiteProject>(loadInitialProject);
  const [history, setHistory] = useState<SiteProject[]>([]);
  const [savedProjects, setSavedProjects] = useState<SiteProject[]>(loadSavedProjects);

  const [studioView, setStudioView] = useState<StudioView>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('marketing_session_id') || params.get('marketing_cancelled')) {
        return 'marketing';
      }
    } catch {
      // Ignore URL parse issues
    }
    return 'builder';
  });
  const [marketingSessionId, setMarketingSessionId] = useState<string | null>(() => {
    try {
      return new URLSearchParams(window.location.search).get('marketing_session_id');
    } catch {
      return null;
    }
  });
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [leftTab, setLeftTab] = useState<LeftRailTab>('prompt');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    () => project.blocks[1]?.id || project.blocks[0]?.id || null
  );

  // Drag & Drop state
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [draggingBlockIndex, setDraggingBlockIndex] = useState<number | null>(null);

  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [inlineRefineBlockId, setInlineRefineBlockId] = useState<string | null>(null);
  const [inlineRefineText, setInlineRefineText] = useState('');

  // Code Export & Deploy
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    prefix: 'af-',
    minify: false,
    includeReset: true,
    useCssVariables: true,
  });
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployModalTab, setDeployModalTab] = useState<DeployModalTab>('deploy');
  const [pageManagerOpen, setPageManagerOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [initialPreviewTemplate, setInitialPreviewTemplate] = useState<SiteProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Builder Ergonomics & Full-Site Scroll State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightInspectorRequestedTab, setRightInspectorRequestedTab] = useState<{
    tab: RightInspectorTab;
    nonce: number;
  } | null>(null);
  const [canvasScale, setCanvasScale] = useState<1 | 0.85 | 0.7>(1);
  const [insertMenuSlot, setInsertMenuSlot] = useState<number | null>(null);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const [canvasScroll, setCanvasScroll] = useState({
    top: 0,
    max: 0,
    height: 0,
    client: 0,
    percent: 0,
  });

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [previewScroll, setPreviewScroll] = useState({
    top: 0,
    max: 0,
    percent: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const syncCanvasScroll = useCallback(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const top = Math.min(el.scrollTop, max);
    const percent = max > 0 ? Math.round((top / max) * 100) : 0;
    setCanvasScroll({
      top,
      max,
      height: el.scrollHeight,
      client: el.clientHeight,
      percent,
    });
  }, []);

  const scrollCanvasTo = (targetTop: number, smooth = true) => {
    const el = canvasScrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const jumpToBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    const container = canvasScrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-block-id="${CSS.escape(blockId)}"]`
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const syncPreviewScroll = useCallback(() => {
    const win = previewIframeRef.current?.contentWindow;
    const doc = previewIframeRef.current?.contentDocument;
    if (!win || !doc) return;
    const root = doc.documentElement;
    const body = doc.body;
    const scrollHeight = Math.max(root?.scrollHeight || 0, body?.scrollHeight || 0);
    const clientHeight = win.innerHeight || root?.clientHeight || 0;
    const max = Math.max(0, scrollHeight - clientHeight);
    const top = Math.min(win.scrollY || root?.scrollTop || 0, max);
    const percent = max > 0 ? Math.round((top / max) * 100) : 0;
    setPreviewScroll({ top, max, percent });
  }, []);

  const scrollPreviewTo = (targetTop: number, smooth = true) => {
    const win = previewIframeRef.current?.contentWindow;
    if (!win) return;
    win.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const jumpPreviewToSectionIndex = (idx: number) => {
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc) return;
    const els = doc.querySelectorAll('body > header, body > section, body > footer');
    const target = els[idx] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load saved client projects from backend (Supabase or server disk store)
  useEffect(() => {
    let active = true;
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.projects) && data.projects.length > 0) {
          setSavedProjects(data.projects);
        }
      })
      .catch(() => {
        // Keep localStorage fallback silently
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync active project & saved snapshots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Ignore quota errors
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedProjects));
    } catch {
      // Ignore quota errors
    }
  }, [savedProjects]);

  const commitProject = (updater: (prev: SiteProject) => SiteProject) => {
    setProject((prev) => {
      setHistory((h) => [...h.slice(-24), prev]);
      const next = updater(prev);
      const synced = syncActivePageIntoProject(next, next.blocks);
      return {
        ...synced,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleUndo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setProject(previous);
      return h.slice(0, -1);
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveProjectSnapshot();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !isEditingInput) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === 'Escape') {
        if (inlineRefineBlockId) setInlineRefineBlockId(null);
        if (deployModalOpen) setDeployModalOpen(false);
        if (pageManagerOpen) setPageManagerOpen(false);
        if (templateGalleryOpen) setTemplateGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const {
    pages: projectPages,
    activePage,
    activePageId,
  } = useMemo(() => ensureProjectPages(project), [project]);

  const handleSwitchPage = useCallback(
    (targetPageId: string) => {
      const targetPage = projectPages.find((p) => p.id === targetPageId);
      setProject((prev) => {
        const switched = switchProjectActivePage(prev, targetPageId);
        return {
          ...switched,
          updatedAt: new Date().toISOString(),
        };
      });
      if (targetPage) {
        setSelectedBlockId(
          targetPage.blocks[1]?.id || targetPage.blocks[0]?.id || null
        );
      }
      setInsertMenuSlot(null);
      setInlineRefineBlockId(null);
      canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [projectPages]
  );

  const handleUpdatePages = (nextPages: SitePage[], nextActiveId: string) => {
    const target =
      nextPages.find((p) => p.id === nextActiveId) || nextPages[0];
    commitProject((prev) => ({
      ...prev,
      pages: nextPages,
      activePageId: target.id,
      blocks: target.blocks,
    }));
    setSelectedBlockId(
      target?.blocks[1]?.id || target?.blocks[0]?.id || null
    );
    setInsertMenuSlot(null);
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'af-preview-navigate') return;
      const rawPath = String(event.data.path || '/');
      const normalized = normalizePagePath(rawPath);
      const matched = projectPages.find(
        (p) => normalizePagePath(p.path) === normalized
      );
      if (matched) {
        if (matched.id !== activePageId) {
          handleSwitchPage(matched.id);
          showToast(`Navigated to ${matched.name} (${matched.path})`);
        }
        previewIframeRef.current?.contentWindow?.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        showToast(`No page configured for "${normalized}". Add it in Pages.`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [projectPages, activePageId, handleSwitchPage]);

  const selectedBlock = useMemo(
    () => project.blocks.find((b) => b.id === selectedBlockId) || null,
    [project.blocks, selectedBlockId]
  );

  const previewHtml = useMemo(
    () =>
      generateCleanHtml(
        project,
        {
          ...exportOptions,
          minify: false,
          previewNavigationBridge: true,
        },
        true,
        true,
        activePage
      ),
    [project, exportOptions, activePage]
  );

  // Keep canvas scroll bar & height metrics in sync when blocks, scale, or panels change
  useEffect(() => {
    if (studioView !== 'builder') return;
    const id = requestAnimationFrame(syncCanvasScroll);
    const container = canvasScrollRef.current;
    const frame = canvasFrameRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && (container || frame)) {
      observer = new ResizeObserver(() => syncCanvasScroll());
      if (container) observer.observe(container);
      if (frame) observer.observe(frame);
    }
    return () => {
      cancelAnimationFrame(id);
      observer?.disconnect();
    };
  }, [
    studioView,
    project.blocks,
    viewport,
    canvasScale,
    leftPanelOpen,
    rightPanelOpen,
    syncCanvasScroll,
  ]);

  // AI Template Generation
  const handleGenerateTemplate = async (prompt: string, style: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Template generation failed.');
      }

      const nextName = data.name || 'Generated Website';
      const nextBlocks: SiteBlock[] = Array.isArray(data.blocks) ? data.blocks : [];
      if (nextBlocks.length === 0) {
        throw new Error('No sections were returned. Try refining your prompt.');
      }

      commitProject((prev) => {
        const nextSeo = {
          title: `${nextName} — Home`,
          description: data.description || prompt,
          language: prev.seo?.language || 'en',
        };
        return {
          ...prev,
          id: createBlockId('proj'),
          name: nextName,
          slug: slugify(nextName),
          description: data.description || prompt,
          theme: data.theme || prev.theme,
          seo: nextSeo,
          blocks: nextBlocks,
          pages: [
            {
              id: 'page_home',
              name: 'Home',
              path: '/',
              blocks: nextBlocks,
              seo: nextSeo,
            },
          ],
          activePageId: 'page_home',
        };
      });
      setSelectedBlockId(nextBlocks[1]?.id || nextBlocks[0]?.id || null);
      if (studioView === 'code') {
        setStudioView('builder');
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Unable to generate template.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Single Block Refinement
  const handleRefineBlock = async (block: SiteBlock, instruction: string) => {
    setIsRefining(true);
    setRefineError(null);
    try {
      const res = await fetch('/api/refine-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block,
          instruction,
          siteContext: `${project.name} — ${project.description}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Block refinement failed.');
      }

      commitProject((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === block.id ? data : b)),
      }));
      setInlineRefineBlockId(null);
      setInlineRefineText('');
    } catch (err) {
      setRefineError(
        err instanceof Error ? err.message : 'Failed to refine block.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  // Block Mutations
  const handleAddBlock = (type: BlockType, insertAtIndex?: number) => {
    const newBlock = createDefaultBlock(type);
    commitProject((prev) => {
      const blocks = [...prev.blocks];
      if (typeof insertAtIndex === 'number') {
        blocks.splice(insertAtIndex, 0, newBlock);
      } else {
        const selectedIdx = blocks.findIndex((b) => b.id === selectedBlockId);
        if (selectedIdx >= 0) {
          blocks.splice(selectedIdx + 1, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
      }
      return { ...prev, blocks };
    });
    setSelectedBlockId(newBlock.id);
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= project.blocks.length) return;
    commitProject((prev) => {
      const next = [...prev.blocks];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, blocks: next };
    });
  };

  const handleDuplicateBlock = (id: string) => {
    commitProject((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const clone: SiteBlock = {
        ...structuredClone(prev.blocks[idx]),
        id: createBlockId(prev.blocks[idx].type),
      };
      const next = [...prev.blocks];
      next.splice(idx + 1, 0, clone);
      setSelectedBlockId(clone.id);
      return { ...prev, blocks: next };
    });
  };

  const handleDeleteBlock = (id: string) => {
    commitProject((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleUpdateBlock = (updated: SiteBlock) => {
    commitProject((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === updated.id ? updated : b)),
    }));
  };

  const handleCycleBlockBackground = (block: SiteBlock) => {
    const nextBg =
      block.backgroundVariant === 'canvas'
        ? 'surface'
        : block.backgroundVariant === 'surface'
          ? 'contrast'
          : 'canvas';
    handleUpdateBlock({ ...block, backgroundVariant: nextBg });
  };

  const handleUpdateTheme = (patch: Partial<SiteTheme>) => {
    commitProject((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...patch },
    }));
  };

  const handleLoadTemplate = (tpl: SiteProject) => {
    const cloned = structuredClone(tpl);
    cloned.id = createBlockId('proj');
    const { pages, activePage: tplActivePage, activePageId: tplActiveId } =
      ensureProjectPages(cloned);
    cloned.pages = pages;
    cloned.activePageId = tplActiveId;
    cloned.blocks = tplActivePage.blocks;
    commitProject(() => cloned);
    setSelectedBlockId(cloned.blocks[1]?.id || cloned.blocks[0]?.id || null);
  };

  const handleCreateBlank = () => {
    commitProject(() => ({
      id: createBlockId('proj'),
      name: 'Untitled Site',
      slug: 'untitled-site',
      description: 'Custom layout built with Atelier Frame',
      theme: { ...DEFAULT_THEME },
      blocks: [],
      pages: [
        {
          id: 'page_home',
          name: 'Home',
          path: '/',
          blocks: [],
        },
      ],
      activePageId: 'page_home',
      updatedAt: new Date().toISOString(),
    }));
    setSelectedBlockId(null);
    setLeftTab('elements');
  };

  const handleSaveProjectSnapshot = async (overrideProject?: SiteProject) => {
    const target = overrideProject || project;
    setIsSaving(true);
    const snapshot: SiteProject = {
      ...structuredClone(target),
      clientName: target.clientName || 'Internal Studio',
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.project || snapshot;
        setSavedProjects((prev) => [
          saved,
          ...prev.filter((p) => p.id !== saved.id),
        ]);
      } else {
        setSavedProjects((prev) => [
          snapshot,
          ...prev.filter((p) => p.id !== snapshot.id),
        ]);
      }
      setSavedNotice(true);
      showToast('Project snapshot saved.');
      setTimeout(() => setSavedNotice(false), 1800);
    } catch {
      setSavedProjects((prev) => [
        snapshot,
        ...prev.filter((p) => p.id !== snapshot.id),
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateForClient = () => {
    const cloned: SiteProject = {
      ...structuredClone(project),
      id: createBlockId('proj'),
      name: `${project.name} (Client Copy)`,
      slug: slugify(`${project.slug || project.name}-copy`),
      clientName: 'New Client',
      lastDeployedSlug: undefined,
      lastDeployedUrl: undefined,
      lastDeployedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    commitProject(() => cloned);
  };

  const handleDeleteSavedProject = async (id: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignore network error
    }
  };

  // Drag & Drop handlers on Canvas insertion slots
  const handleSlotDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggingBlockIndex !== null ? 'move' : 'copy';
    if (dragOverSlot !== slotIdx) {
      setDragOverSlot(slotIdx);
    }
  };

  const handleSlotDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    const newType = e.dataTransfer.getData('application/x-atelier-new-block') as BlockType;
    if (newType) {
      handleAddBlock(newType, slotIdx);
      setDraggingBlockIndex(null);
      return;
    }

    const moveIdxRaw = e.dataTransfer.getData('application/x-atelier-move-index');
    const sourceIdx =
      moveIdxRaw !== '' ? Number(moveIdxRaw) : draggingBlockIndex;

    if (sourceIdx !== null && !Number.isNaN(sourceIdx)) {
      if (sourceIdx !== slotIdx && sourceIdx + 1 !== slotIdx) {
        commitProject((prev) => {
          const next = [...prev.blocks];
          const [moved] = next.splice(sourceIdx, 1);
          const adjustedIdx = sourceIdx < slotIdx ? slotIdx - 1 : slotIdx;
          next.splice(adjustedIdx, 0, moved);
          return { ...prev, blocks: next };
        });
      }
    }
    setDraggingBlockIndex(null);
  };

  const handleDragStartBlock = (e: React.DragEvent, index: number) => {
    setDraggingBlockIndex(index);
    e.dataTransfer.setData('application/x-atelier-move-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDeployed = (record: DeployedSiteRecord) => {
    const updated: SiteProject = {
      ...project,
      clientName: record.clientName || project.clientName,
      lastDeployedSlug: record.slug,
      lastDeployedUrl: record.url,
      lastDeployedAt: record.deployedAt,
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    handleSaveProjectSnapshot(updated);
  };

  const handleApplyPricingToCanvas = (
    tiers: PricingTier[],
    heading: string,
    intro: string
  ) => {
    const existing = project.blocks.find((b) => b.type === 'pricing') as
      | PricingBlock
      | undefined;

    if (existing) {
      const updatedBlock: PricingBlock = {
        ...existing,
        props: {
          ...existing.props,
          eyebrow: 'Pricing & Tiers',
          heading,
          intro,
          tiers,
        },
      };
      commitProject((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === existing.id ? updatedBlock : b)),
      }));
      setSelectedBlockId(existing.id);
    } else {
      const created = createDefaultBlock('pricing') as PricingBlock;
      created.props = {
        eyebrow: 'Pricing & Tiers',
        heading,
        intro,
        tiers,
      };
      commitProject((prev) => {
        const blocks = [...prev.blocks];
        const insertBeforeIdx = blocks.findIndex(
          (b) => b.type === 'contact' || b.type === 'footer'
        );
        if (insertBeforeIdx >= 0) {
          blocks.splice(insertBeforeIdx, 0, created);
        } else {
          blocks.push(created);
        }
        return { ...prev, blocks };
      });
      setSelectedBlockId(created.id);
    }

    setStudioView('builder');
  };

  const viewportWidthPx =
    viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%';

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F2EC] text-black"
      onDragEnd={() => {
        setDragOverSlot(null);
        setDraggingBlockIndex(null);
      }}
    >
      {/* Top Studio Bar: Strict 3-Zone Contract */}
      <header className="h-16 shrink-0 bg-white border-b border-[#DAD4C6] px-5 flex items-center justify-between gap-6 z-30">
        {/* Zone 1: Brand Mark & Editable Project Name */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect width="28" height="28" rx="6" fill="#13151A" />
              <rect x="6" y="6" width="16" height="16" rx="2" stroke="#FFFFFF" strokeWidth="1.75" />
              <path d="M14 6V22" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.45" />
              <rect x="15.5" y="7.5" width="5" height="5" rx="1" fill="#1D4ED8" />
            </svg>
            <span className="text-lg font-bold tracking-tight text-black whitespace-nowrap shrink-0 font-display">
              Atelier Frame
            </span>
          </div>
          <span className="text-black select-none">/</span>
          <input
            type="text"
            aria-label="Project title"
            value={project.name}
            onChange={(e) =>
              setProject((prev) => ({
                ...prev,
                name: e.target.value,
                slug: slugify(e.target.value),
              }))
            }
            className="text-sm font-medium text-black bg-[#FAF9F5] hover:bg-[#EAE6DC]/60 focus:bg-white border border-transparent focus:border-[#DAD4C6] rounded-md px-2.5 py-1 max-w-[175px] xl:max-w-[220px] truncate focus:outline-none"
          />
        </div>

        {/* Zone 2: Studio Mode Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
            <button
              type="button"
              onClick={() => setStudioView('builder')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'builder'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <PenTool className="w-4 h-4 text-[#1D4ED8]" />
              <span>Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioView('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'preview'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Eye className="w-4 h-4 text-[#1D4ED8]" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioView('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'code'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Code2 className="w-4 h-4 text-[#13151A]" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioView('analytics')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'analytics'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#1D4ED8]" />
              <span>Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioView('marketing')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'marketing'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Megaphone className="w-4 h-4 text-[#1D4ED8]" />
              <span>Marketing</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioView('pricing')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                studioView === 'pricing'
                  ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#B45309]" />
              <span>Pricing</span>
            </button>
          </div>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={handleUndo}
            title="Undo last change (Ctrl/Cmd + Z)"
            className="p-2 rounded-lg border border-[#DAD4C6] bg-white text-black hover:bg-[#FAF9F5] disabled:opacity-35 transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveProjectSnapshot()}
            title="Save project snapshot (Ctrl/Cmd + S)"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeployModalTab('deploy');
              setDeployModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>Deploy Live</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {studioView === 'builder' && (
          <>
            {leftPanelOpen && (
              <LeftRail
                activeTab={leftTab}
                onTabChange={setLeftTab}
                project={project}
                savedProjects={savedProjects}
                isGenerating={isGenerating}
                generationError={generationError}
                onGenerateTemplate={handleGenerateTemplate}
                onAddBlock={(type) => handleAddBlock(type)}
                onUpdateTheme={handleUpdateTheme}
                onUpdateProjectMeta={(patch) =>
                  commitProject((prev) => ({ ...prev, ...patch }))
                }
                onLoadTemplate={handleLoadTemplate}
                onPreviewTemplate={(tpl) => {
                  setInitialPreviewTemplate(tpl);
                  setTemplateGalleryOpen(true);
                }}
                onOpenTemplateGallery={() => {
                  setInitialPreviewTemplate(null);
                  setTemplateGalleryOpen(true);
                }}
                onOpenDomains={() => {
                  setDeployModalTab('domains');
                  setDeployModalOpen(true);
                }}
                onCreateBlank={handleCreateBlank}
                onSaveProjectSnapshot={() => handleSaveProjectSnapshot()}
                onDuplicateForClient={handleDuplicateForClient}
                onDeleteSavedProject={handleDeleteSavedProject}
              />
            )}

            {/* Central Drag-and-Drop Canvas Column + Full-Site Scroll Bar */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              {/* Fixed Canvas Context Strip */}
              <div className="shrink-0 px-4 py-2 bg-[#FAF9F5] border-b border-[#DAD4C6] flex flex-wrap items-center justify-between gap-2 z-20">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setLeftPanelOpen((o) => !o)}
                    title={leftPanelOpen ? 'Collapse left sidebar' : 'Expand left sidebar'}
                    className="p-1.5 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 text-black cursor-pointer shrink-0"
                  >
                    {leftPanelOpen ? (
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    ) : (
                      <PanelLeftOpen className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="flex items-center gap-2 min-w-0 text-sm text-black">
                    {project.lastDeployedUrl ? (
                      <a
                        href={
                          activePage.path === '/'
                            ? project.lastDeployedUrl
                            : `${project.lastDeployedUrl}${activePage.path}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#1D4ED8] hover:underline truncate"
                      >
                        <span>
                          /sites/{project.lastDeployedSlug || project.slug}
                          {activePage.path === '/' ? '' : activePage.path}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="font-mono text-xs font-semibold truncate">
                        /sites/{project.slug || 'site'}
                        {activePage.path === '/' ? '' : activePage.path}
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-xs font-medium whitespace-nowrap">
                      {projectPages.length} {projectPages.length === 1 ? 'page' : 'pages'} · {project.blocks.length} sections
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-0.5 p-0.5 bg-[#EAE6DC] rounded-md border border-[#DAD4C6]/70">
                    <button
                      type="button"
                      onClick={() => setViewport('desktop')}
                      title="Desktop 1440px"
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        viewport === 'desktop'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black hover:bg-white/60'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">1440</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewport('tablet')}
                      title="Tablet 768px"
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        viewport === 'tablet'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black hover:bg-white/60'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">768</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewport('mobile')}
                      title="Mobile 375px"
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        viewport === 'mobile'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-black hover:bg-white/60'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">375</span>
                    </button>
                  </div>

                  {/* Zoom / Scale Selector */}
                  <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-[#EAE6DC] rounded-md border border-[#DAD4C6]/70">
                    {([1, 0.85, 0.7] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setCanvasScale(sc)}
                        title={`Canvas zoom ${Math.round(sc * 100)}%`}
                        className={`px-2 py-1 rounded text-xs font-mono font-medium tabular-nums cursor-pointer transition-colors ${
                          canvasScale === sc
                            ? 'bg-white text-black shadow-xs'
                            : 'text-black hover:bg-white/60'
                        }`}
                      >
                        {Math.round(sc * 100)}%
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInitialPreviewTemplate(null);
                      setTemplateGalleryOpen(true);
                    }}
                    title="Browse Website Templates"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Templates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftPanelOpen(true);
                      setLeftTab('theme');
                    }}
                    title="Edit Brand Colors & Fonts"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <span className="flex items-center gap-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs border border-black/15"
                        style={{ backgroundColor: project.theme.primaryColor }}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-xs border border-black/15"
                        style={{ backgroundColor: project.theme.contrastBgColor }}
                      />
                    </span>
                    <Palette className="w-3.5 h-3.5" />
                    <span>Palette</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftPanelOpen(true);
                      setLeftTab('elements');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#13151A] hover:bg-black text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageManagerOpen(true)}
                    title="Manage pages & auto-sitemap"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Pages ({projectPages.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeployModalTab('domains');
                      setDeployModalOpen(true);
                    }}
                    title="Connect custom domains or transfer a domain"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Domains</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelOpen((o) => !o)}
                    title={rightPanelOpen ? 'Collapse inspector' : 'Expand inspector'}
                    className="p-1.5 rounded-md border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 text-black cursor-pointer shrink-0"
                  >
                    {rightPanelOpen ? (
                      <PanelRightClose className="w-3.5 h-3.5" />
                    ) : (
                      <PanelRightOpen className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Multi-Page Route Switcher Bar */}
              <div className="shrink-0 px-4 py-1.5 bg-white border-b border-[#DAD4C6] flex items-center justify-between gap-3 overflow-x-auto">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black/65 whitespace-nowrap mr-1">
                    Pages
                  </span>
                  {projectPages.map((pg) => {
                    const isActive = pg.id === activePageId;
                    return (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => handleSwitchPage(pg.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#13151A] text-white'
                            : 'bg-[#FAF9F5] border border-[#DAD4C6] text-black hover:bg-[#EAE6DC]'
                        }`}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>{pg.name}</span>
                        <span
                          className={`font-mono text-[11px] ${
                            isActive ? 'text-white/75' : 'text-black/60'
                          }`}
                        >
                          {pg.path}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setPageManagerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-[#1D4ED8]/60 bg-blue-50/60 hover:bg-blue-50 text-xs font-semibold text-[#1D4ED8] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Page / Sitemap</span>
                </button>
              </div>

              {/* Scrollable Developed-Site Viewport with Prominent Scrollbar */}
              <main
                ref={canvasScrollRef}
                onScroll={syncCanvasScroll}
                className="flex-1 min-w-0 min-h-0 overflow-y-scroll overflow-x-auto canvas-scroll canvas-drafting-grid p-5 lg:p-7 pb-12 flex flex-col items-center relative"
                onClick={() => {
                  setSelectedBlockId(null);
                  setInsertMenuSlot(null);
                }}
              >
                <div
                  ref={canvasFrameRef}
                  className="w-full transition-all duration-200 bg-white border border-[#C8C1B2] shadow-sm relative"
                  style={{
                    maxWidth: viewport === 'desktop' ? '1220px' : viewportWidthPx,
                    zoom: canvasScale,
                  }}
                >
                {/* Live Marketing Promo Bar Preview on Canvas */}
                {project.marketing?.announcementEnabled &&
                  project.marketing?.announcementText?.trim() && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudioView('marketing');
                      }}
                      title="Click to edit Promotional Banner in Marketing"
                      className="group/promo relative px-6 py-2.5 flex flex-wrap items-center justify-center gap-3 text-center cursor-pointer border-b border-white/15"
                      style={{
                        backgroundColor: project.theme.contrastBgColor,
                        color: '#FFFFFF',
                        fontFamily: `"${project.theme.bodyFont}", system-ui, sans-serif`,
                      }}
                    >
                      <span className="text-sm font-medium">
                        {project.marketing.announcementText.trim()}
                      </span>
                      {project.marketing.announcementCtaLabel?.trim() && (
                        <span
                          className="px-3 py-1 text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: project.theme.primaryColor,
                            color: project.theme.accentTextColor,
                            borderRadius: project.theme.radius,
                          }}
                        >
                          {project.marketing.announcementCtaLabel.trim()}
                        </span>
                      )}
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-white/15 text-white opacity-0 group-hover/promo:opacity-100 transition-opacity">
                        <Megaphone className="w-3 h-3" />
                        <span>Edit Banner</span>
                      </span>
                    </div>
                  )}
                {isGenerating && (
                  <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[#13151A] text-white flex items-center justify-center mb-3 animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-lg font-bold text-black font-display">
                      Crafting your website template...
                    </div>
                    <p className="text-sm text-black mt-1 max-w-md">
                      Generating responsive sections, brand palette, typography, and tailored copy.
                    </p>
                  </div>
                )}

                {project.blocks.length === 0 ? (
                  <div
                    onDragOver={(e) => handleSlotDragOver(e, 0)}
                    onDrop={(e) => handleSlotDrop(e, 0)}
                    className={`min-h-[460px] flex flex-col items-center justify-center p-10 text-center transition-colors ${
                      dragOverSlot === 0
                        ? 'bg-blue-50/70 border-2 border-dashed border-blue-500'
                        : 'bg-white'
                    }`}
                  >
                    <h2 className="text-xl font-semibold text-black">
                      Start designing your page
                    </h2>
                    <p className="text-sm text-black mt-1.5 max-w-sm leading-relaxed">
                      Drag building blocks from the Elements tab onto this canvas, or describe your site in the AI Prompt rail to generate a full layout.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => {
                          setInitialPreviewTemplate(null);
                          setTemplateGalleryOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <LayoutTemplate className="w-4 h-4" />
                        <span>Browse Templates</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftTab('prompt')}
                        className="px-4 py-2 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-black text-sm font-semibold cursor-pointer"
                      >
                        Generate with AI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('hero', 0)}
                        className="px-4 py-2 rounded-lg border border-[#DAD4C6] hover:bg-slate-50 text-sm font-semibold text-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Hero Section</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Top Drop Slot */}
                    <div
                      onDragOver={(e) => handleSlotDragOver(e, 0)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => handleSlotDrop(e, 0)}
                      className={`transition-all ${
                        dragOverSlot === 0
                          ? 'h-10 bg-blue-50 border-y-2 border-dashed border-blue-600 flex items-center justify-center text-sm font-medium text-blue-700'
                          : 'h-2 bg-transparent'
                      }`}
                    >
                      {dragOverSlot === 0 && 'Drop here to insert at top'}
                    </div>

                    {project.blocks.map((block, index) => (
                      <React.Fragment key={block.id}>
                        <div className="relative">
                          <CanvasBlockRenderer
                            block={block}
                            index={index}
                            total={project.blocks.length}
                            theme={project.theme}
                            viewport={viewport}
                            selected={selectedBlockId === block.id}
                            onSelect={(id) => {
                              setSelectedBlockId(id);
                              setInsertMenuSlot(null);
                            }}
                            onMove={handleMoveBlock}
                            onDuplicate={handleDuplicateBlock}
                            onDelete={handleDeleteBlock}
                            onCycleBackground={handleCycleBlockBackground}
                            onDragStartBlock={handleDragStartBlock}
                            onQuickAiRefine={(id) => {
                              setSelectedBlockId(id);
                              setInlineRefineBlockId(
                                inlineRefineBlockId === id ? null : id
                              );
                              setInlineRefineText('');
                            }}
                          />

                          {/* Inline Quick AI Refine Popover */}
                          {inlineRefineBlockId === block.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mx-6 mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50/95 shadow-sm flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                              <input
                                type="text"
                                autoFocus
                                value={inlineRefineText}
                                onChange={(e) => setInlineRefineText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && inlineRefineText.trim()) {
                                    e.preventDefault();
                                    handleRefineBlock(block, inlineRefineText.trim());
                                  }
                                }}
                                placeholder="Describe how AI should rewrite this section..."
                                className="flex-1 min-w-0 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                              <button
                                type="button"
                                disabled={isRefining || !inlineRefineText.trim()}
                                onClick={() =>
                                  handleRefineBlock(block, inlineRefineText.trim())
                                }
                                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                              >
                                {isRefining ? 'Rewriting...' : 'Rewrite'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineRefineBlockId(null)}
                                className="p-1 text-black hover:bg-blue-100 rounded cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Interactive Drop & Quick-Insert Slot After Each Block */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onDragOver={(e) => handleSlotDragOver(e, index + 1)}
                          onDragLeave={() => setDragOverSlot(null)}
                          onDrop={(e) => handleSlotDrop(e, index + 1)}
                          className={`group/slot relative transition-all ${
                            dragOverSlot === index + 1
                              ? 'h-10 bg-blue-50 border-y-2 border-dashed border-[#1D4ED8] flex items-center justify-center text-sm font-medium text-[#1D4ED8]'
                              : insertMenuSlot === index + 1
                                ? 'py-2 px-4 bg-[#FAF9F5] border-y border-[#DAD4C6]'
                                : 'h-3 bg-transparent hover:bg-[#1D4ED8]/10'
                          }`}
                        >
                          {dragOverSlot === index + 1 && 'Drop here to insert section'}
                          {dragOverSlot !== index + 1 && insertMenuSlot !== index + 1 && (
                            <button
                              type="button"
                              onClick={() => setInsertMenuSlot(index + 1)}
                              title="Insert a section here"
                              className="opacity-0 group-hover/slot:opacity-100 focus:opacity-100 transition-opacity absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-2.5 py-0.5 rounded bg-[#13151A] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Insert section</span>
                            </button>
                          )}
                          {insertMenuSlot === index + 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <span className="text-xs font-semibold text-black mr-1">
                                Insert after {block.label}:
                              </span>
                              {(
                                [
                                  ['hero', 'Hero'],
                                  ['logocloud', 'Logo Cloud'],
                                  ['features', 'Features'],
                                  ['showcase', 'Showcase'],
                                  ['portfolio', 'Portfolio'],
                                  ['video', 'Video Demo'],
                                  ['stats', 'Stats'],
                                  ['team', 'Team'],
                                  ['pricing', 'Pricing'],
                                  ['calculator', 'ROI Calc'],
                                  ['testimonial', 'Testimonial'],
                                  ['faq', 'FAQ'],
                                  ['cta', 'CTA'],
                                  ['contact', 'Contact'],
                                ] as Array<[BlockType, string]>
                              ).map(([type, label]) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    handleAddBlock(type, index + 1);
                                    setInsertMenuSlot(null);
                                  }}
                                  className="px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] text-xs font-semibold text-black cursor-pointer"
                                >
                                  + {label}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setInsertMenuSlot(null)}
                                aria-label="Close section picker"
                                className="p-1 rounded text-black hover:bg-[#EAE6DC] cursor-pointer ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick-Append Section Bar */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full mt-4 px-4 py-3 bg-white/95 border border-[#DAD4C6] rounded-lg flex flex-wrap items-center justify-between gap-3"
                style={{
                  maxWidth: viewport === 'desktop' ? '1220px' : viewportWidthPx,
                }}
              >
                <span className="text-xs font-semibold text-black">
                  Quick Add Section:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['logocloud', 'Logo Cloud'],
                      ['features', 'Features'],
                      ['portfolio', 'Portfolio'],
                      ['video', 'Video Demo'],
                      ['stats', 'Stats'],
                      ['team', 'Team'],
                      ['pricing', 'Pricing'],
                      ['calculator', 'ROI Calc'],
                      ['testimonial', 'Testimonial'],
                      ['faq', 'FAQ'],
                      ['contact', 'Contact'],
                    ] as Array<[BlockType, string]>
                  ).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAddBlock(type, project.blocks.length)}
                      className="px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] hover:bg-white text-xs font-semibold text-black cursor-pointer transition-colors"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
              </main>

              {/* Dedicated Full-Site Scroll Bar & Section Navigator */}
              <div className="shrink-0 h-11 bg-white border-t border-[#DAD4C6] px-4 flex items-center gap-3 z-20">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollCanvasTo(0)}
                    disabled={canvasScroll.top <= 4}
                    title="Scroll to top of developed site"
                    className="flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-[#EAE6DC] disabled:opacity-40 text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCanvasTo(canvasScroll.max)}
                    disabled={canvasScroll.max <= 4 || canvasScroll.top >= canvasScroll.max - 4}
                    title="Scroll to bottom of developed site"
                    className="flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-[#EAE6DC] disabled:opacity-40 text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Bottom</span>
                  </button>
                </div>

                <div className="flex-1 min-w-[120px] flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-black whitespace-nowrap hidden md:inline">
                    Page Scroll
                  </span>
                  <input
                    type="range"
                    aria-label="Scroll developed website"
                    min={0}
                    max={Math.max(1, canvasScroll.max)}
                    value={Math.min(canvasScroll.top, Math.max(1, canvasScroll.max))}
                    disabled={canvasScroll.max <= 0}
                    onChange={(e) => scrollCanvasTo(Number(e.target.value), false)}
                    className="af-scroll-slider flex-1 min-w-0 disabled:opacity-40"
                  />
                  <span className="text-xs font-mono font-semibold text-black tabular-nums whitespace-nowrap">
                    {canvasScroll.max > 0 ? `${canvasScroll.percent}%` : 'Fit'}
                  </span>
                  <span className="hidden lg:inline text-xs font-mono text-black/75 tabular-nums whitespace-nowrap">
                    · {Math.round(canvasScroll.height).toLocaleString()} px
                  </span>
                </div>

                {project.blocks.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label
                      htmlFor="builder-jump-section"
                      className="text-xs font-medium text-black whitespace-nowrap hidden xl:inline"
                    >
                      Section
                    </label>
                    <select
                      id="builder-jump-section"
                      value={selectedBlockId || ''}
                      onChange={(e) => {
                        if (e.target.value) jumpToBlock(e.target.value);
                      }}
                      className="rounded-md border border-[#DAD4C6] bg-[#FAF9F5] px-2 py-1 text-xs font-medium text-black max-w-[170px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    >
                      <option value="">Jump to section...</option>
                      {project.blocks.map((blk, i) => (
                        <option key={blk.id} value={blk.id}>
                          {String(i + 1).padStart(2, '0')}. {blk.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {rightPanelOpen && (
              <RightInspector
                project={project}
                blocks={project.blocks}
                selectedBlock={selectedBlock}
                isRefining={isRefining}
                refineError={refineError}
                onSelectBlock={(id) => setSelectedBlockId(id)}
                onJumpToBlock={jumpToBlock}
                onMoveBlock={handleMoveBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onUpdateBlock={handleUpdateBlock}
                onRefineBlock={handleRefineBlock}
                onDeleteBlock={handleDeleteBlock}
                onUpdateSeo={(patch) =>
                  commitProject((prev) => {
                    const { pages, activePageId: curActiveId } =
                      ensureProjectPages(prev);
                    const curPage =
                      pages.find((p) => p.id === curActiveId) || pages[0];
                    const isHome = curPage.path === '/';
                    const nextPages = pages.map((p) =>
                      p.id === curPage.id
                        ? {
                            ...p,
                            seo: {
                              ...p.seo,
                              ...(patch.title !== undefined
                                ? { title: patch.title }
                                : {}),
                              ...(patch.description !== undefined
                                ? { description: patch.description }
                                : {}),
                              ...(patch.canonicalUrl !== undefined
                                ? { canonicalUrl: patch.canonicalUrl }
                                : {}),
                            },
                          }
                        : p
                    );
                    return {
                      ...prev,
                      pages: nextPages,
                      seo: {
                        ...prev.seo,
                        ...(patch.language !== undefined
                          ? { language: patch.language }
                          : {}),
                        ...(patch.customDomain !== undefined
                          ? { customDomain: patch.customDomain }
                          : {}),
                        ...(isHome ? patch : {}),
                      },
                    };
                  })
                }
                onUpdateAutomations={(patch) =>
                  commitProject((prev) => ({
                    ...prev,
                    automations: { ...prev.automations, ...patch },
                  }))
                }
                onOpenMarketing={() => setStudioView('marketing')}
                onOpenDomains={() => {
                  setDeployModalTab('domains');
                  setDeployModalOpen(true);
                }}
                requestedTab={rightInspectorRequestedTab}
              />
            )}
          </>
        )}

        {studioView === 'preview' && (
          <main className="flex-1 min-w-0 min-h-0 overflow-hidden canvas-drafting-grid p-4 lg:p-6 flex flex-col items-center">
            <div
              className="w-full shrink-0 mb-3 px-4 py-2 bg-white/95 border border-[#DAD4C6] rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs"
              style={{
                maxWidth: viewport === 'desktop' ? '1440px' : viewportWidthPx,
              }}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-black min-w-0">
                <span className="font-semibold whitespace-nowrap">Live Interactive Preview</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{project.name}</span>
                {projectPages.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {projectPages.map((pg) => (
                        <button
                          key={pg.id}
                          type="button"
                          onClick={() => handleSwitchPage(pg.id)}
                          className={`px-2 py-0.5 rounded text-xs font-sans font-semibold cursor-pointer transition-colors ${
                            pg.id === activePageId
                              ? 'bg-[#13151A] text-white'
                              : 'bg-[#FAF9F5] border border-[#DAD4C6] text-black hover:bg-[#EAE6DC]'
                          }`}
                        >
                          {pg.name} <span className="font-mono opacity-75">{pg.path}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5 p-0.5 bg-[#EAE6DC] rounded-md border border-[#DAD4C6]/70">
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                      viewport === 'desktop'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">1440</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                      viewport === 'tablet'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">768</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                      viewport === 'mobile'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">375</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStudioView('marketing')}
                  className="px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                >
                  Promote Site
                </button>
                <button
                  type="button"
                  onClick={() => setStudioView('builder')}
                  className="px-2.5 py-1 rounded-md bg-[#13151A] hover:bg-black text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Edit in Builder
                </button>
              </div>
            </div>
            <div
              className="flex-1 min-h-0 w-full bg-white border border-[#C8C1B2] rounded-lg shadow-sm overflow-hidden transition-all duration-200 flex flex-col"
              style={{
                maxWidth: viewport === 'desktop' ? '1440px' : viewportWidthPx,
              }}
            >
              <iframe
                ref={previewIframeRef}
                title="Real-time responsive site preview"
                srcDoc={previewHtml}
                onLoad={() => {
                  syncPreviewScroll();
                  const win = previewIframeRef.current?.contentWindow;
                  if (win) {
                    win.addEventListener('scroll', syncPreviewScroll, { passive: true });
                    win.addEventListener('resize', syncPreviewScroll, { passive: true });
                  }
                }}
                className="w-full h-full flex-1 min-h-0 border-0 bg-white"
              />
              {/* Dedicated Preview Full-Site Scroll Bar */}
              <div className="shrink-0 h-10 bg-[#FAF9F5] border-t border-[#DAD4C6] px-4 flex items-center gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollPreviewTo(0)}
                    disabled={previewScroll.top <= 4}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC] disabled:opacity-40 text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                    <span>Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollPreviewTo(previewScroll.max)}
                    disabled={previewScroll.max <= 4 || previewScroll.top >= previewScroll.max - 4}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC] disabled:opacity-40 text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Bottom</span>
                  </button>
                </div>
                <input
                  type="range"
                  aria-label="Scroll live preview"
                  min={0}
                  max={Math.max(1, previewScroll.max)}
                  value={Math.min(previewScroll.top, Math.max(1, previewScroll.max))}
                  disabled={previewScroll.max <= 0}
                  onChange={(e) => scrollPreviewTo(Number(e.target.value), false)}
                  className="af-scroll-slider flex-1 min-w-0 disabled:opacity-40"
                />
                <span className="text-xs font-mono font-semibold text-black tabular-nums whitespace-nowrap">
                  {previewScroll.max > 0 ? `${previewScroll.percent}%` : '100%'}
                </span>
                {project.blocks.length > 0 && (
                  <select
                    aria-label="Jump to preview section"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value !== '') {
                        jumpPreviewToSectionIndex(Number(e.target.value));
                      }
                    }}
                    className="rounded-md border border-[#DAD4C6] bg-white px-2 py-1 text-xs font-medium text-black max-w-[165px] cursor-pointer"
                  >
                    <option value="">Jump to section...</option>
                    {project.blocks.map((blk, i) => (
                      <option key={blk.id} value={i}>
                        {String(i + 1).padStart(2, '0')}. {blk.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </main>
        )}

        {studioView === 'code' && (
          <CodeHandoffView
            project={project}
            options={exportOptions}
            onChangeOptions={(patch) =>
              setExportOptions((prev) => ({ ...prev, ...patch }))
            }
          />
        )}

        {studioView === 'analytics' && (
          <AnalyticsDashboard
            project={project}
            onOpenDeploy={() => setDeployModalOpen(true)}
            onOpenSeoInspector={() => {
              setStudioView('builder');
              setRightPanelOpen(true);
              setRightInspectorRequestedTab({ tab: 'seo', nonce: Date.now() });
            }}
            onOpenMarketing={() => setStudioView('marketing')}
            onOpenBuilder={() => setStudioView('builder')}
          />
        )}

        {studioView === 'marketing' && (
          <MarketingView
            project={project}
            onUpdateMarketing={(patch) =>
              commitProject((prev) => ({
                ...prev,
                marketing: { ...prev.marketing, ...patch },
              }))
            }
            onOpenDeploy={() => setDeployModalOpen(true)}
            onNotify={showToast}
            initialSessionId={marketingSessionId}
            onClearSessionParam={() => {
              setMarketingSessionId(null);
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('marketing_session_id');
                url.searchParams.delete('marketing_cancelled');
                window.history.replaceState({}, '', url.toString());
              } catch {
                // Ignore history error
              }
            }}
          />
        )}

        {studioView === 'pricing' && (
          <PricingView
            savedProjectsCount={savedProjects.length}
            currentProjectName={project.name}
            onApplyPricingToCanvas={handleApplyPricingToCanvas}
            onOpenDeploy={() => setDeployModalOpen(true)}
          />
        )}
      </div>

      {/* Multi-Page Architecture & Sitemap Modal */}
      <PageManagerModal
        open={pageManagerOpen}
        project={project}
        onClose={() => setPageManagerOpen(false)}
        onUpdatePages={handleUpdatePages}
        onNotify={showToast}
      />

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        open={templateGalleryOpen}
        currentTemplateSlug={project.slug}
        initialPreviewTemplate={initialPreviewTemplate}
        onClose={() => {
          setTemplateGalleryOpen(false);
          setInitialPreviewTemplate(null);
        }}
        onSelectTemplate={handleLoadTemplate}
        onCreateBlank={handleCreateBlank}
        onOpenAiPrompt={() => setLeftTab('prompt')}
      />

      {/* One-Click Deployment & Custom Domain Modal */}
      <DeployModal
        open={deployModalOpen}
        initialTab={deployModalTab}
        project={project}
        exportOptions={exportOptions}
        onClose={() => setDeployModalOpen(false)}
        onDeployed={handleDeployed}
        onUpdateProjectDomain={(domain) =>
          commitProject((prev) => ({
            ...prev,
            seo: { ...prev.seo, customDomain: domain },
          }))
        }
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-[#13151A] text-white text-sm font-medium shadow-lg border border-white/15 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
