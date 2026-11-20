import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Globe,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  AnalyticsPayload,
  LeadPipelineStatus,
  SeoAuditCheck,
  SiteProject,
} from '../types/builder';
import { auditProjectSeo } from '../utils/seoAudit';

interface AnalyticsDashboardProps {
  project: SiteProject;
  onOpenDeploy: () => void;
  onOpenSeoInspector?: () => void;
  onOpenMarketing?: () => void;
  onOpenBuilder?: () => void;
}

type RangeDays = 7 | 14 | 30 | 90;
type ActivityTab = 'leads' | 'events';
type ChartMetricFilter = 'all' | 'views' | 'clicks' | 'leads';

function computeDelta(current: number, previous: number): {
  label: string;
  direction: 'up' | 'down' | 'flat';
} {
  if (previous === 0 && current === 0) {
    return { label: 'No change vs prior period', direction: 'flat' };
  }
  if (previous === 0 && current > 0) {
    return { label: `+${current.toLocaleString()} new vs 0 prior`, direction: 'up' };
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return { label: 'Flat vs prior period', direction: 'flat' };
  }
  const rounded = Math.round(pct);
  return {
    label: `${rounded > 0 ? '+' : ''}${rounded}% vs prior (${previous.toLocaleString()})`,
    direction: rounded > 0 ? 'up' : 'down',
  };
}

function getSeoGrade(score: number): {
  letter: string;
  label: string;
  toneClass: string;
  barColor: string;
  strokeColor: string;
} {
  if (score >= 85) {
    return {
      letter: 'A',
      label: 'Strong SEO',
      toneClass: 'text-[#047857] bg-emerald-50 border-emerald-200',
      barColor: 'bg-[#047857]',
      strokeColor: '#047857',
    };
  }
  if (score >= 65) {
    return {
      letter: 'B',
      label: 'Needs Polish',
      toneClass: 'text-[#B45309] bg-amber-50 border-amber-200',
      barColor: 'bg-[#D97706]',
      strokeColor: '#D97706',
    };
  }
  return {
    letter: 'C',
    label: 'Critical Gaps',
    toneClass: 'text-[#B91C1C] bg-red-50 border-red-200',
    barColor: 'bg-[#B91C1C]',
    strokeColor: '#B91C1C',
  };
}

function formatReferrerLabel(raw: string): {
  label: string;
  kind: 'Campaign UTM' | 'Direct' | 'Referral';
} {
  if (!raw || raw.toLowerCase() === 'direct') {
    return { label: 'Direct / Typed URL', kind: 'Direct' };
  }
  if (raw.startsWith('utm:')) {
    return { label: raw.slice(4), kind: 'Campaign UTM' };
  }
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return { label: parsed.hostname.replace(/^www\./, ''), kind: 'Referral' };
  } catch {
    return { label: raw, kind: 'Referral' };
  }
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  project,
  onOpenDeploy,
  onOpenSeoInspector,
  onOpenMarketing,
  onOpenBuilder,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>('all');
  const [days, setDays] = useState<RangeDays>(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTab, setActivityTab] = useState<ActivityTab>('leads');
  const [chartFilter, setChartFilter] = useState<ChartMetricFilter>('all');
  const [auditTarget, setAuditTarget] = useState<string>('draft');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const seoSectionRef = useRef<HTMLElement | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        slug: selectedSlug,
        days: String(days),
      });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load analytics.');
      }
      setData(json as AnalyticsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Keep audit target aligned if selectedSlug is changed to a specific deployed site
  useEffect(() => {
    if (selectedSlug !== 'all' && data?.sites.some((s) => s.slug === selectedSlug)) {
      setAuditTarget(selectedSlug);
    }
  }, [selectedSlug, data?.sites]);

  const draftAudit = useMemo(() => auditProjectSeo(project), [project]);

  const activeAudit = useMemo(() => {
    if (auditTarget !== 'draft' && data?.sites) {
      const matched = data.sites.find((s) => s.slug === auditTarget);
      if (matched) {
        return {
          mode: 'deployed' as const,
          title: matched.name,
          subtitle: matched.customDomain
            ? `${matched.customDomain}${matched.domainVerified ? ' · DNS Verified' : ' · DNS Pending'}`
            : `/sites/${matched.slug}`,
          score: matched.seoScore,
          wordCount: matched.wordCount,
          headingCount: matched.headingCount,
          imageCount: matched.imageCount,
          htmlSizeKb: matched.htmlSizeKb,
          blockCount: matched.blockCount,
          checks: matched.seoChecks,
          url: matched.url,
        };
      }
    }
    return {
      mode: 'draft' as const,
      title: `${project.name || 'Untitled Project'} (Studio Draft)`,
      subtitle: project.seo?.customDomain
        ? `${project.seo.customDomain} · Draft Preview`
        : `/sites/${project.slug || 'draft'} · Unsaved/Draft Audit`,
      score: draftAudit.score,
      wordCount: draftAudit.wordCount,
      headingCount: draftAudit.headingCount,
      imageCount: draftAudit.imageCount,
      htmlSizeKb: null as number | null,
      blockCount: project.blocks.length,
      checks: draftAudit.checks,
      url: project.lastDeployedUrl || null,
    };
  }, [auditTarget, data?.sites, draftAudit, project]);

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAnalytics();
      }
    } catch {
      // Ignore transient error
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadPipelineStatus) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            leads: prev.leads.map((l) => (l.id === id ? { ...l, status } : l)),
          }
        : prev
    );
    try {
      await fetch(`/api/leads/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Keep optimistic status or refresh on next fetch
    }
  };

  const exportLeadsCsvReport = () => {
    if (!data || data.leads.length === 0) return;
    const header = [
      'Submitted At',
      'Site Slug',
      'Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Consultation Slot',
      'Custom Fields',
      'Message',
      'Webhook Status',
    ];
    const rows = data.leads.map((l) =>
      [
        l.submittedAt,
        l.siteSlug,
        l.name,
        l.email,
        l.phone || '',
        l.company || '',
        l.status || 'new',
        l.bookingSlot
          ? `${l.bookingSlot.date} ${l.bookingSlot.time}${l.bookingSlot.duration ? ` (${l.bookingSlot.duration})` : ''}`
          : '',
        l.customData
          ? Object.entries(l.customData)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' | ')
          : '',
        l.message,
        l.webhookStatus || 'none',
      ]
        .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-captured-leads-${days}d.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDeployment = async (slug: string) => {
    try {
      const res = await fetch(`/api/deployments/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (selectedSlug === slug) setSelectedSlug('all');
        if (auditTarget === slug) setAuditTarget('draft');
        await fetchAnalytics();
      }
    } catch {
      // Ignore transient error
    }
  };

  const handleCopyEmail = async (leadId: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedLeadId(leadId);
      setTimeout(() => {
        setCopiedLeadId((prev) => (prev === leadId ? null : prev));
      }, 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const handleCheckQuickAction = (target?: SeoAuditCheck['actionTarget']) => {
    if (target === 'seo' && onOpenSeoInspector) {
      onOpenSeoInspector();
    } else if (target === 'marketing' && onOpenMarketing) {
      onOpenMarketing();
    } else if (target === 'deploy') {
      onOpenDeploy();
    } else if (target === 'builder' && onOpenBuilder) {
      onOpenBuilder();
    }
  };

  const exportCsvReport = () => {
    if (!data) return;
    const header = [
      'Site Name',
      'Client',
      'Slug',
      'Custom Domain',
      'SEO Score (/100)',
      'HTML Size (KB)',
      'Word Count',
      'Page Views',
      'CTA Clicks',
      'CTR (%)',
      'Leads',
      'Conversion Rate (%)',
      'Last Published',
    ];
    const rows = data.sites.map((s) =>
      [
        s.name,
        s.clientName,
        s.slug,
        s.customDomain || '',
        s.seoScore,
        s.htmlSizeKb.toFixed(1),
        s.wordCount,
        s.views,
        s.clicks,
        s.ctr.toFixed(1),
        s.leads,
        s.conversionRate.toFixed(1),
        s.deployedAt,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-site-analytics-seo-${days}d.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredSites = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.sites.filter((s) => {
      if (selectedSlug !== 'all' && s.slug !== selectedSlug) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.customDomain || '').toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, selectedSlug]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.leads.filter((l) => {
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.siteSlug.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.recentEvents.filter((ev) => {
      if (!q) return true;
      return (
        ev.siteSlug.toLowerCase().includes(q) ||
        ev.targetLabel.toLowerCase().includes(q) ||
        ev.referrer.toLowerCase().includes(q) ||
        ev.eventType.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const maxSeriesVal = useMemo(() => {
    if (!data || data.series.length === 0) return 4;
    const peak = Math.max(
      ...data.series.map((d) => {
        if (chartFilter === 'views') return d.views;
        if (chartFilter === 'clicks') return d.clicks;
        if (chartFilter === 'leads') return d.leads;
        return Math.max(d.views, d.clicks, d.leads);
      })
    );
    return Math.max(peak, 4);
  }, [data, chartFilter]);

  const totalDeviceViews = useMemo(() => {
    if (!data) return 0;
    return data.devices.reduce((acc, item) => acc + item.count, 0);
  }, [data]);

  const totalReferrerViews = useMemo(() => {
    if (!data) return 0;
    return data.topReferrers.reduce((acc, item) => acc + item.count, 0);
  }, [data]);

  const activeHoverPoint =
    hoveredIdx !== null && data?.series[hoveredIdx]
      ? data.series[hoveredIdx]
      : null;

  const viewsDelta = computeDelta(
    data?.summary.totalViews ?? 0,
    data?.summary.prevViews ?? 0
  );
  const clicksDelta = computeDelta(
    data?.summary.totalClicks ?? 0,
    data?.summary.prevClicks ?? 0
  );
  const leadsDelta = computeDelta(
    data?.summary.totalLeads ?? 0,
    data?.summary.prevLeads ?? 0
  );

  const displayedSeoScore =
    data && data.sites.length > 0
      ? selectedSlug !== 'all'
        ? data.sites.find((s) => s.slug === selectedSlug)?.seoScore ?? data.summary.avgSeoScore
        : data.summary.avgSeoScore
      : draftAudit.score;

  const displayedSeoGrade = getSeoGrade(displayedSeoScore);
  const auditGrade = getSeoGrade(activeAudit.score);
  const passedCheckCount = activeAudit.checks.filter((c) => c.status === 'pass').length;

  const totalViews = data?.summary.totalViews ?? 0;
  const totalClicks = data?.summary.totalClicks ?? 0;
  const totalLeads = data?.summary.totalLeads ?? 0;
  const ctrPct = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const clickToLeadPct = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (Math.min(Math.max(activeAudit.score, 0), 100) / 100) * ringCircumference;

  return (
    <main className="flex-1 overflow-y-auto studio-scroll bg-[#F4F2EC] p-6 lg:p-8">
      <div className="max-w-[1320px] mx-auto space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Website Analytics, Conversions &amp; SEO Audit
            </h1>
            <p className="text-sm text-black mt-1">
              Live traffic, period comparisons, UTM attribution, and deterministic 100-point SEO page health across your sites.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-black absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter sites, leads, referrers..."
                className="pl-9 pr-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white text-sm text-black placeholder:text-black/60 w-56 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              aria-label="Filter by deployed site"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">All Published Sites</option>
              {data?.sites.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} (/{s.slug})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70">
              {([7, 14, 30, 90] as RangeDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-md text-sm font-mono font-medium transition-colors cursor-pointer tabular-nums ${
                    days === d
                      ? 'bg-white text-black shadow-xs'
                      : 'text-black hover:bg-white/60'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-slate-50 text-sm font-medium text-black cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCsvReport}
              disabled={!data || data.sites.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#13151A] hover:bg-black disabled:bg-slate-400 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 5-Column Unified KPI Strip */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#DAD4C6]">
          <div className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-black">
              Page Views ({days}D)
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums">
              {loading && !data ? '—' : totalViews.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-black mt-1.5 tabular-nums">
              {viewsDelta.direction === 'up' && (
                <TrendingUp className="w-3.5 h-3.5 text-[#047857] shrink-0" />
              )}
              {viewsDelta.direction === 'down' && (
                <TrendingDown className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
              )}
              <span>{viewsDelta.label}</span>
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-black">
              CTA Clicks &amp; CTR
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-bold text-black tabular-nums">
                {loading && !data ? '—' : totalClicks.toLocaleString()}
              </span>
              <span className="text-sm font-mono font-semibold text-[#1D4ED8] tabular-nums">
                {ctrPct.toFixed(1)}% CTR
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-black mt-1.5 tabular-nums">
              {clicksDelta.direction === 'up' && (
                <TrendingUp className="w-3.5 h-3.5 text-[#047857] shrink-0" />
              )}
              {clicksDelta.direction === 'down' && (
                <TrendingDown className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
              )}
              <span>{clicksDelta.label}</span>
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-black">
              Captured Leads
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums">
              {loading && !data ? '—' : totalLeads.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-black mt-1.5 tabular-nums">
              {leadsDelta.direction === 'up' && (
                <TrendingUp className="w-3.5 h-3.5 text-[#047857] shrink-0" />
              )}
              {leadsDelta.direction === 'down' && (
                <TrendingDown className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
              )}
              <span>{leadsDelta.label}</span>
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-black">
              Conversion Rate
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums">
              {loading && !data
                ? '—'
                : `${(data?.summary.conversionRate ?? 0).toFixed(1)}%`}
            </div>
            <div className="text-xs font-medium text-black mt-1.5 tabular-nums">
              Click-to-Lead: {clickToLeadPct.toFixed(1)}% · {data?.summary.publishedSitesCount ?? 0} live sites
            </div>
          </div>

          <div className="p-5 col-span-2 md:col-span-1 bg-[#FAF9F5]/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-black">
                SEO Health Score
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${displayedSeoGrade.toneClass}`}
              >
                Grade {displayedSeoGrade.letter}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-bold text-black tabular-nums">
                {displayedSeoScore}
              </span>
              <span className="text-sm font-mono font-medium text-black">/ 100</span>
            </div>
            <div className="text-xs font-medium text-black mt-1.5">
              {data && data.sites.length > 0
                ? `${displayedSeoGrade.label} · ${selectedSlug === 'all' ? 'Avg across live sites' : 'Selected site'}`
                : `${displayedSeoGrade.label} · Active Studio draft`}
            </div>
          </div>
        </section>

        {/* SEO Score & Technical Audit Section */}
        <section
          ref={seoSectionRef}
          className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[#DAD4C6] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#1D4ED8] shrink-0" />
              <div>
                <h2 className="text-base font-bold text-black">
                  SEO Score &amp; Technical Page Audit
                </h2>
                <p className="text-xs text-black">
                  Audits metadata, canonical URLs, semantic headings, alt text, JSON-LD schema, and conversion tags.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="seo-audit-target"
                className="text-xs font-semibold text-black"
              >
                Inspecting:
              </label>
              <select
                id="seo-audit-target"
                value={auditTarget}
                onChange={(e) => setAuditTarget(e.target.value)}
                className="rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] cursor-pointer"
              >
                <option value="draft">
                  Studio Draft · {project.name || 'Untitled'} ({draftAudit.score}/100)
                </option>
                {data?.sites.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    Live Site · {s.name} ({s.seoScore}/100)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Summary Gauge & Technical Signals */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl border border-[#DAD4C6] bg-[#FAF9F5] flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      fill="none"
                      stroke="#E5E0D5"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      fill="none"
                      stroke={auditGrade.strokeColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-black tabular-nums leading-none">
                      {activeAudit.score}
                    </span>
                    <span className="text-[11px] font-mono text-black">/ 100</span>
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-semibold ${auditGrade.toneClass}`}
                    >
                      {auditGrade.label}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-black truncate">
                    {activeAudit.title}
                  </div>
                  <div className="text-xs font-mono text-black truncate">
                    {activeAudit.subtitle}
                  </div>
                  <div className="text-xs font-medium text-black pt-0.5">
                    {passedCheckCount} of {activeAudit.checks.length} checks passed
                  </div>
                </div>
              </div>

              {/* 4-cell Technical Breakdown */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg border border-[#DAD4C6] bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black">
                    Word Count
                  </div>
                  <div className="text-lg font-bold text-black mt-0.5 tabular-nums">
                    {activeAudit.wordCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-black">
                    {activeAudit.wordCount >= 250
                      ? 'Healthy content depth'
                      : 'Consider 250+ words'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#DAD4C6] bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black">
                    {activeAudit.htmlSizeKb !== null ? 'HTML Payload' : 'Sections'}
                  </div>
                  <div className="text-lg font-bold text-black mt-0.5 tabular-nums">
                    {activeAudit.htmlSizeKb !== null
                      ? `${activeAudit.htmlSizeKb.toFixed(1)} KB`
                      : `${activeAudit.blockCount} blocks`}
                  </div>
                  <div className="text-xs text-black">
                    {activeAudit.htmlSizeKb !== null
                      ? activeAudit.htmlSizeKb < 100
                        ? 'Fast single-file load'
                        : 'Compact document'
                      : `${activeAudit.blockCount} modular blocks`}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#DAD4C6] bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black">
                    Headings
                  </div>
                  <div className="text-lg font-bold text-black mt-0.5 tabular-nums">
                    {activeAudit.headingCount} tags
                  </div>
                  <div className="text-xs text-black">H1 + H2 structure</div>
                </div>

                <div className="p-3 rounded-lg border border-[#DAD4C6] bg-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-black">
                    Media Assets
                  </div>
                  <div className="text-lg font-bold text-black mt-0.5 tabular-nums">
                    {activeAudit.imageCount} images
                  </div>
                  <div className="text-xs text-black">Alt text verified</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {onOpenSeoInspector && (
                  <button
                    type="button"
                    onClick={onOpenSeoInspector}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Open SEO Inspector</span>
                  </button>
                )}
                {onOpenMarketing && (
                  <button
                    type="button"
                    onClick={onOpenMarketing}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-[#EAE6DC] text-black text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Boost &amp; Schema</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right 9-Rule Audit Checklist */}
            <div className="lg:col-span-8 divide-y divide-[#DAD4C6] border border-[#DAD4C6] rounded-xl overflow-hidden">
              {activeAudit.checks.map((chk) => {
                const statusBadge =
                  chk.status === 'pass'
                    ? 'bg-emerald-50 text-[#047857] border-emerald-200'
                    : chk.status === 'warn'
                      ? 'bg-amber-50 text-[#B45309] border-amber-200'
                      : 'bg-red-50 text-[#B91C1C] border-red-200';
                const statusLabel =
                  chk.status === 'pass'
                    ? 'Pass'
                    : chk.status === 'warn'
                      ? 'Warn'
                      : 'Missing';

                const actionLabel =
                  chk.actionTarget === 'seo'
                    ? 'Fix in SEO'
                    : chk.actionTarget === 'marketing'
                      ? 'Open Marketing'
                      : chk.actionTarget === 'deploy'
                        ? 'Connect Domain'
                        : 'Edit in Builder';

                return (
                  <div
                    key={chk.id}
                    className="px-4 py-3 bg-white hover:bg-[#FAF9F5]/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {chk.status === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                      ) : chk.status === 'warn' ? (
                        <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-black">
                            {chk.label}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold ${statusBadge}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-black mt-0.5 leading-relaxed">
                          {chk.detail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <span className="font-mono text-xs font-semibold text-black tabular-nums">
                        {chk.points}/{chk.maxPoints} pts
                      </span>
                      {chk.status !== 'pass' && (
                        <button
                          type="button"
                          onClick={() => handleCheckQuickAction(chk.actionTarget)}
                          className="px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] hover:text-[#1D4ED8] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
                        >
                          {actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Chart & Conversion Funnel Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Traffic & Conversions Chart */}
          <div className="lg:col-span-8 bg-white border border-[#DAD4C6] rounded-xl p-5 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-black">
                  Daily Traffic &amp; Interactions
                </h2>
                <p className="text-sm text-black mt-0.5 tabular-nums">
                  {activeHoverPoint
                    ? `${activeHoverPoint.date} · ${activeHoverPoint.views} views · ${activeHoverPoint.clicks} clicks · ${activeHoverPoint.leads} leads`
                    : `Hover any day column to inspect exact counts (${days} days)`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#FAF9F5] border border-[#DAD4C6] rounded-lg">
                  {(
                    [
                      ['all', 'All'],
                      ['views', 'Views'],
                      ['clicks', 'Clicks'],
                      ['leads', 'Leads'],
                    ] as Array<[ChartMetricFilter, string]>
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChartFilter(key)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                        chartFilter === key
                          ? 'bg-[#13151A] text-white'
                          : 'text-black hover:bg-[#EAE6DC]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-black pl-1">
                  {(chartFilter === 'all' || chartFilter === 'views') && (
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8] inline-block" />
                      Views
                    </span>
                  )}
                  {(chartFilter === 'all' || chartFilter === 'clicks') && (
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#13151A] inline-block" />
                      Clicks
                    </span>
                  )}
                  {(chartFilter === 'all' || chartFilter === 'leads') && (
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#047857] inline-block" />
                      Leads
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading && !data ? (
              <div className="h-56 bg-slate-100 rounded-lg animate-pulse" />
            ) : !data || data.series.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-black">
                No daily points in range.
              </div>
            ) : (
              <div className="h-56 flex flex-col justify-end">
                <div className="flex-1 flex items-end gap-1 pt-4 border-b border-[#DAD4C6]">
                  {data.series.map((pt, i) => {
                    const viewH = Math.round((pt.views / maxSeriesVal) * 100);
                    const clickH = Math.round((pt.clicks / maxSeriesVal) * 100);
                    const leadH = Math.round((pt.leads / maxSeriesVal) * 100);
                    return (
                      <div
                        key={pt.date}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className={`flex-1 h-full flex items-end justify-center gap-[2px] px-[1px] rounded-t transition-colors ${
                          hoveredIdx === i ? 'bg-[#FAF9F5]' : ''
                        }`}
                      >
                        {(chartFilter === 'all' || chartFilter === 'views') && (
                          <div
                            className="w-full max-w-[12px] bg-[#1D4ED8] rounded-t-xs transition-all"
                            style={{ height: `${pt.views > 0 ? Math.max(viewH, 4) : 0}%` }}
                            title={`${pt.date}: ${pt.views} views`}
                          />
                        )}
                        {(chartFilter === 'all' || chartFilter === 'clicks') && (
                          <div
                            className="w-full max-w-[12px] bg-[#13151A] rounded-t-xs transition-all"
                            style={{ height: `${pt.clicks > 0 ? Math.max(clickH, 4) : 0}%` }}
                            title={`${pt.date}: ${pt.clicks} clicks`}
                          />
                        )}
                        {(chartFilter === 'all' || chartFilter === 'leads') && (
                          <div
                            className="w-full max-w-[12px] bg-[#047857] rounded-t-xs transition-all"
                            style={{ height: `${pt.leads > 0 ? Math.max(leadH, 4) : 0}%` }}
                            title={`${pt.date}: ${pt.leads} leads`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[13px] font-mono text-black pt-2 tabular-nums">
                  <span>{data.series[0]?.date}</span>
                  <span>
                    {data.series[Math.floor(data.series.length / 2)]?.date}
                  </span>
                  <span>{data.series[data.series.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Funnel Card */}
          <div className="lg:col-span-4 bg-white border border-[#DAD4C6] rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-black">
                  Conversion Funnel
                </h2>
                <Filter className="w-4 h-4 text-black" />
              </div>
              <p className="text-xs text-black mt-0.5">
                Visitor journey from landing page view to submitted inquiry.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-black mb-1">
                    <span>1. Landing Page Views</span>
                    <span className="font-mono font-bold tabular-nums">
                      {totalViews.toLocaleString()} (100%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#FAF9F5] border border-[#DAD4C6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] rounded-full"
                      style={{ width: totalViews > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-black mb-1">
                    <span>2. CTA Button Clicks</span>
                    <span className="font-mono font-bold tabular-nums">
                      {totalClicks.toLocaleString()} ({ctrPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#FAF9F5] border border-[#DAD4C6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#13151A] rounded-full transition-all"
                      style={{
                        width: `${totalViews > 0 ? Math.min(Math.max(ctrPct, totalClicks > 0 ? 4 : 0), 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-black mb-1">
                    <span>3. Form Lead Captures</span>
                    <span className="font-mono font-bold tabular-nums">
                      {totalLeads.toLocaleString()} ({(data?.summary.conversionRate ?? 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#FAF9F5] border border-[#DAD4C6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#047857] rounded-full transition-all"
                      style={{
                        width: `${
                          totalViews > 0
                            ? Math.min(
                                Math.max(data?.summary.conversionRate ?? 0, totalLeads > 0 ? 4 : 0),
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DAD4C6] flex items-center justify-between text-xs text-black">
              <span>Click-to-Lead Efficiency</span>
              <span className="font-mono font-bold tabular-nums">
                {clickToLeadPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        {/* 3-Column Attribution, Devices, & Top CTAs Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Traffic Sources & UTM Campaigns */}
          <div className="bg-white border border-[#DAD4C6] rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-semibold text-black">
                Traffic Sources &amp; UTM Campaigns
              </h2>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </div>
            {!data || data.topReferrers.length === 0 ? (
              <p className="text-sm text-black leading-relaxed">
                Source domains and <span className="font-mono">utm_campaign</span> tags appear here once live sites receive visits.
              </p>
            ) : (
              <div className="space-y-3">
                {data.topReferrers.map((item) => {
                  const formatted = formatReferrerLabel(item.referrer);
                  const pct =
                    totalReferrerViews > 0
                      ? Math.round((item.count / totalReferrerViews) * 100)
                      : 0;
                  return (
                    <div key={item.referrer} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-medium text-black truncate">
                            {formatted.label}
                          </span>
                          <span className="text-[11px] font-mono text-black shrink-0">
                            {formatted.kind}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-black tabular-nums shrink-0">
                          {item.count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#FAF9F5] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            formatted.kind === 'Campaign UTM' ? 'bg-[#047857]' : 'bg-[#1D4ED8]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Device Breakdown */}
          <div className="bg-white border border-[#DAD4C6] rounded-xl p-5">
            <h2 className="text-base font-semibold text-black mb-3">
              Device Breakdown
            </h2>
            <div className="space-y-3.5">
              {(data?.devices || [
                { device: 'Desktop', count: 0 },
                { device: 'Tablet', count: 0 },
                { device: 'Mobile', count: 0 },
              ]).map((item) => {
                const pct =
                  totalDeviceViews > 0
                    ? Math.round((item.count / totalDeviceViews) * 100)
                    : 0;
                return (
                  <div key={item.device} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-black">
                        {item.device === 'Desktop' ? (
                          <Monitor className="w-4 h-4 text-black" />
                        ) : item.device === 'Tablet' ? (
                          <Tablet className="w-4 h-4 text-black" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-black" />
                        )}
                        <span>{item.device}</span>
                      </span>
                      <span className="font-mono text-xs font-semibold text-black tabular-nums">
                        {item.count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#FAF9F5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D4ED8] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Clicked CTAs */}
          <div className="bg-white border border-[#DAD4C6] rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-semibold text-black">
                Top Clicked CTAs
              </h2>
              <MousePointerClick className="w-4 h-4 text-black" />
            </div>
            {!data || data.topCtas.length === 0 ? (
              <p className="text-sm text-black leading-relaxed">
                Button click rankings appear once visitors interact with CTAs on live sites.
              </p>
            ) : (
              <div className="space-y-3">
                {data.topCtas.map((cta) => {
                  const pct =
                    totalClicks > 0 ? Math.round((cta.count / totalClicks) * 100) : 0;
                  return (
                    <div key={cta.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-black font-medium truncate pr-2">
                          {cta.label}
                        </span>
                        <span className="font-mono text-xs text-black font-semibold tabular-nums shrink-0">
                          {cta.count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#FAF9F5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#13151A] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Client Site Performance Table */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DAD4C6] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-black" />
              <h2 className="text-base font-semibold text-black">
                Deployed Client Sites &amp; SEO Health
              </h2>
            </div>
            <span className="text-sm text-black tabular-nums">
              {filteredSites.length} sites
            </span>
          </div>

          {loading && !data ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-base font-semibold text-black">
                No deployed client sites found
              </p>
              <p className="text-sm text-black max-w-md mx-auto leading-relaxed">
                Deploy a website from the Builder to start collecting real visitor page views, CTA clicks, conversion funnels, and live HTML SEO scores.
              </p>
              <button
                type="button"
                onClick={onOpenDeploy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Deploy Current Site</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DAD4C6] bg-[#FAF9F5] text-xs font-semibold text-black">
                    <th className="py-2.5 px-5">Site</th>
                    <th className="py-2.5 px-4">Domain / Path</th>
                    <th className="py-2.5 px-4 text-right">SEO Score</th>
                    <th className="py-2.5 px-4 text-right">Views</th>
                    <th className="py-2.5 px-4 text-right">Clicks (CTR)</th>
                    <th className="py-2.5 px-4 text-right">Leads</th>
                    <th className="py-2.5 px-4 text-right">Conv.</th>
                    <th className="py-2.5 px-4 text-right">Size / Words</th>
                    <th className="py-2.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD4C6] text-sm">
                  {filteredSites.map((site) => {
                    const grade = getSeoGrade(site.seoScore);
                    return (
                      <tr
                        key={site.slug}
                        className="hover:bg-[#FAF9F5]/70 transition-colors h-13"
                      >
                        <td className="px-5 py-2.5">
                          <div className="font-semibold text-black">{site.name}</div>
                          <div className="text-xs text-black">{site.clientName}</div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-black">
                          {site.customDomain ? (
                            <div>
                              <span className="font-semibold">{site.customDomain}</span>
                              <span className="block text-[11px] text-black">
                                {site.url} · {site.domainVerified ? 'DNS Verified' : 'DNS Pending'}
                              </span>
                            </div>
                          ) : (
                            <span>{site.url}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditTarget(site.slug);
                              seoSectionRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }}
                            title="Inspect detailed 9-point SEO audit"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-semibold cursor-pointer tabular-nums ${grade.toneClass}`}
                          >
                            <span>{site.seoScore}/100</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-black">
                          {site.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-black">
                          {site.clicks.toLocaleString()} ({site.ctr.toFixed(1)}%)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-black font-semibold">
                          {site.leads.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-black">
                          {site.conversionRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-black whitespace-nowrap">
                          {site.htmlSizeKb.toFixed(1)} KB · {site.wordCount}w
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAuditTarget(site.slug);
                                seoSectionRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              }}
                              className="px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:border-[#1D4ED8] hover:text-[#1D4ED8] text-xs font-semibold text-black cursor-pointer"
                            >
                              Audit
                            </button>
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-slate-50 text-xs font-medium text-black"
                            >
                              <span>Visit</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeployment(site.slug)}
                              title="Unpublish site"
                              className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Leads & Visitor Events */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#DAD4C6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg">
              <button
                type="button"
                onClick={() => setActivityTab('leads')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  activityTab === 'leads'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Captured Leads ({filteredLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('events')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  activityTab === 'events'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Visitor Event Log ({filteredEvents.length})
              </button>
            </div>
            {activityTab === 'leads' && filteredLeads.length > 0 && (
              <button
                type="button"
                onClick={exportLeadsCsvReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Leads CSV</span>
              </button>
            )}
          </div>

          {activityTab === 'leads' ? (
            filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-black">
                No lead submissions recorded in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DAD4C6] bg-[#FAF9F5] text-xs font-semibold text-black">
                      <th className="py-2.5 px-5">Contact</th>
                      <th className="py-2.5 px-4">Site</th>
                      <th className="py-2.5 px-4">Inquiry, Booking &amp; Details</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Submitted</th>
                      <th className="py-2.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DAD4C6] text-sm">
                    {filteredLeads.map((lead) => {
                      const customEntries = lead.customData
                        ? Object.entries(lead.customData)
                        : [];
                      const currentStatus: LeadPipelineStatus =
                        lead.status || (lead.bookingSlot ? 'booked' : 'new');
                      return (
                        <tr key={lead.id} className="hover:bg-[#FAF9F5]/70 align-top">
                          <td className="px-5 py-3">
                            <div className="font-semibold text-black">{lead.name}</div>
                            <div className="text-xs text-black">{lead.email}</div>
                            {(lead.phone || lead.company) && (
                              <div className="text-xs text-black/80 mt-0.5">
                                {[lead.company, lead.phone].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-black whitespace-nowrap">
                            <div>/{lead.siteSlug}</div>
                            {lead.webhookStatus && lead.webhookStatus !== 'none' && (
                              <div
                                className={`mt-1 font-sans text-[11px] font-semibold ${
                                  lead.webhookStatus === 'delivered'
                                    ? 'text-[#047857]'
                                    : 'text-[#B91C1C]'
                                }`}
                              >
                                {lead.webhookStatus === 'delivered'
                                  ? `Webhook ${lead.webhookResponseCode || 200}`
                                  : 'Webhook failed'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-black max-w-md space-y-1">
                            {lead.bookingSlot && (
                              <div className="text-xs font-semibold text-[#1D4ED8] tabular-nums">
                                Booked: {lead.bookingSlot.date} · {lead.bookingSlot.time}
                                {lead.bookingSlot.duration
                                  ? ` (${lead.bookingSlot.duration})`
                                  : ''}
                              </div>
                            )}
                            <div className="text-sm text-black leading-snug">
                              {lead.message}
                            </div>
                            {customEntries.length > 0 && (
                              <div className="text-xs text-black/80 pt-0.5 space-y-0.5">
                                {customEntries.map(([k, v]) => (
                                  <div key={k}>
                                    <span className="font-semibold">{k}:</span>{' '}
                                    <span>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Pipeline status for ${lead.name}`}
                              value={currentStatus}
                              onChange={(e) =>
                                handleUpdateLeadStatus(
                                  lead.id,
                                  e.target.value as LeadPipelineStatus
                                )
                              }
                              className="rounded-md border border-[#DAD4C6] bg-white px-2 py-1 text-xs font-semibold text-black cursor-pointer"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="booked">Booked</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-black tabular-nums whitespace-nowrap">
                            {new Date(lead.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(lead.id, lead.email)}
                                title="Copy email address"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-medium text-black cursor-pointer"
                              >
                                {copiedLeadId === lead.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#047857]" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Delete lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-black">
              No visitor events recorded in this filter yet. Open any deployed site URL to generate live traffic events.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DAD4C6] bg-[#FAF9F5] text-xs font-semibold text-black">
                    <th className="py-2.5 px-5">Event</th>
                    <th className="py-2.5 px-4">Site</th>
                    <th className="py-2.5 px-4">Target / Referrer</th>
                    <th className="py-2.5 px-4">Device</th>
                    <th className="py-2.5 px-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD4C6] text-sm">
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF9F5]/70 h-11">
                      <td className="px-5 font-medium text-black">
                        {ev.eventType === 'page_view'
                          ? 'Page View'
                          : ev.eventType === 'cta_click'
                            ? 'CTA Click'
                            : 'Form Submit'}
                      </td>
                      <td className="px-4 font-mono text-black">
                        /{ev.siteSlug}
                      </td>
                      <td className="px-4 text-black">
                        {ev.targetLabel || ev.referrer || 'Direct'}
                      </td>
                      <td className="px-4 capitalize text-black">
                        {ev.deviceType}
                      </td>
                      <td className="px-5 text-right font-mono text-xs text-black tabular-nums whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
