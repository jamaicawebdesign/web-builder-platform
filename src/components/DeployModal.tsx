import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Inbox,
  Link2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { slugify } from '../data/presets';
import {
  DeployedSiteRecord,
  DomainVerificationResult,
  ExportOptions,
  LeadSubmission,
  SiteProject,
} from '../types/builder';
import {
  generateAllSitePagesHtml,
  generateCleanHtml,
} from '../utils/codeGenerator';
import { ensureProjectPages } from '../utils/sitePages';

interface DeployModalProps {
  open: boolean;
  project: SiteProject;
  exportOptions: ExportOptions;
  onClose: () => void;
  onDeployed: (record: DeployedSiteRecord) => void;
  onUpdateProjectDomain?: (domain: string) => void;
}

type ModalTab = 'deploy' | 'domains' | 'leads';

function cleanDomainInput(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '');
}

export const DeployModal: React.FC<DeployModalProps> = ({
  open,
  project,
  exportOptions,
  onClose,
  onDeployed,
  onUpdateProjectDomain,
}) => {
  const [tab, setTab] = useState<ModalTab>('deploy');
  const [slug, setSlug] = useState(() => slugify(project.slug || project.name));
  const [clientName, setClientName] = useState(
    () => project.clientName || 'Internal Studio'
  );
  const [publishDomain, setPublishDomain] = useState(() =>
    cleanDomainInput(project.seo?.customDomain || '')
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<DeployedSiteRecord | null>(null);
  const [deployments, setDeployments] = useState<DeployedSiteRecord[]>([]);
  const [leads, setLeads] = useState<LeadSubmission[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Domain tab state
  const [domainSlug, setDomainSlug] = useState(() =>
    slugify(project.lastDeployedSlug || project.slug || project.name)
  );
  const [domainInput, setDomainInput] = useState(() =>
    cleanDomainInput(project.seo?.customDomain || '')
  );
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatusMsg, setDomainStatusMsg] = useState<string | null>(null);
  const [verification, setVerification] = useState<DomainVerificationResult | null>(
    null
  );

  const loadDeployments = async () => {
    try {
      const res = await fetch('/api/deployments');
      if (res.ok) {
        const data = await res.json();
        const list: DeployedSiteRecord[] = Array.isArray(data.deployments)
          ? data.deployments
          : [];
        setDeployments(list);
        return list;
      }
    } catch {
      // Ignore transient list errors
    }
    return [] as DeployedSiteRecord[];
  };

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(Array.isArray(data.leads) ? data.leads : []);
      }
    } catch {
      // Ignore transient list errors
    }
  };

  useEffect(() => {
    if (open) {
      const activeSlug = slugify(
        project.lastDeployedSlug || project.slug || project.name
      );
      setSlug(activeSlug);
      setDomainSlug(activeSlug);
      setClientName(project.clientName || 'Internal Studio');
      setPublishDomain(cleanDomainInput(project.seo?.customDomain || ''));
      setError(null);
      setDomainError(null);
      setDomainStatusMsg(null);
      setVerification(null);

      loadDeployments().then((list) => {
        const matched = list.find((d) => d.slug === activeSlug) || list[0];
        if (matched) {
          setDomainSlug(matched.slug);
          setDomainInput(
            matched.customDomain ||
              cleanDomainInput(project.seo?.customDomain || '')
          );
        } else {
          setDomainInput(cleanDomainInput(project.seo?.customDomain || ''));
        }
      });
      loadLeads();
    }
  }, [
    open,
    project.lastDeployedSlug,
    project.slug,
    project.name,
    project.clientName,
    project.seo?.customDomain,
  ]);

  if (!open) return null;

  const copyValue = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeploying) return;
    setIsDeploying(true);
    setError(null);

    try {
      const targetSlug = slugify(slug);
      const normalizedDomain = cleanDomainInput(publishDomain);
      const projectForPublish: SiteProject = normalizedDomain
        ? {
            ...project,
            seo: {
              ...project.seo,
              customDomain: `https://${normalizedDomain}`,
            },
          }
        : project;

      const deployExportOpts: ExportOptions = {
        ...exportOptions,
        minify: false,
        formEndpoint: `/api/sites/${targetSlug}/submit`,
        trackEndpoint: `/api/sites/${targetSlug}/event`,
      };

      const compiledPages = generateAllSitePagesHtml(
        projectForPublish,
        deployExportOpts,
        true
      );
      const standaloneHtml =
        compiledPages.find((p) => p.path === '/')?.html ||
        compiledPages[0]?.html ||
        generateCleanHtml(projectForPublish, deployExportOpts, true);

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: targetSlug,
          projectId: project.id,
          clientName: clientName.trim() || 'Studio Client',
          name: project.name,
          description: project.description,
          html: standaloneHtml,
          pages: compiledPages.map((pg) => ({
            path: pg.path,
            name: pg.name,
            title: pg.title,
            description: pg.description,
            html: pg.html,
            blockCount: pg.blockCount,
          })),
          blockCount: project.blocks.length,
          ...(project.automations ? { automations: project.automations } : {}),
          ...(normalizedDomain ? { customDomain: normalizedDomain } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deploy website.');
      }

      setLatestResult(data);
      setDomainSlug(data.slug);
      if (data.customDomain) {
        setDomainInput(data.customDomain);
        onUpdateProjectDomain?.(`https://${data.customDomain}`);
      }
      onDeployed(data);
      await loadDeployments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeleteDeployment = async (targetSlug: string) => {
    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(targetSlug)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        if (latestResult?.slug === targetSlug) setLatestResult(null);
        await loadDeployments();
      }
    } catch {
      // Ignore error
    }
  };

  const handleSaveCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSlug || isSavingDomain) return;
    setIsSavingDomain(true);
    setDomainError(null);
    setDomainStatusMsg(null);
    setVerification(null);

    try {
      const cleaned = cleanDomainInput(domainInput);
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/domain`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customDomain: cleaned }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not assign custom domain.');
      }
      setDomainInput(data.customDomain || '');
      if (data.customDomain) {
        setDomainStatusMsg(
          `Domain "${data.customDomain}" saved. Add the DNS records below, then click Verify DNS.`
        );
        if (domainSlug === slugify(project.lastDeployedSlug || project.slug)) {
          onUpdateProjectDomain?.(`https://${data.customDomain}`);
        }
      }
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Failed to connect domain.'
      );
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleVerifyDns = async () => {
    if (!domainSlug || isVerifyingDns) return;
    setIsVerifyingDns(true);
    setDomainError(null);
    setDomainStatusMsg(null);

    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/verify-domain`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customDomain: cleanDomainInput(domainInput) }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'DNS verification failed.');
      }
      setVerification(data as DomainVerificationResult);
      if (data.verified) {
        setDomainStatusMsg(
          `Verified: ${data.customDomain} is active and routing to /sites/${data.slug}.`
        );
      } else {
        setDomainStatusMsg(
          `DNS records for ${data.customDomain} are not pointing here yet. Save the CNAME or TXT record at your registrar and verify again.`
        );
      }
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Unable to check DNS records.'
      );
    } finally {
      setIsVerifyingDns(false);
    }
  };

  const handleDisconnectDomain = async () => {
    if (!domainSlug || isSavingDomain) return;
    setIsSavingDomain(true);
    setDomainError(null);
    setDomainStatusMsg(null);
    setVerification(null);

    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/domain`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect domain.');
      }
      setDomainInput('');
      setDomainStatusMsg('Custom domain disconnected.');
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Unable to disconnect domain.'
      );
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      // Ignore error
    }
  };

  const exportLeadsCsv = () => {
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
    ];
    const rows = leads.map((l) =>
      [
        l.submittedAt,
        l.siteSlug,
        l.name,
        l.email,
        l.phone || '',
        l.company || '',
        l.status || 'new',
        l.bookingSlot ? `${l.bookingSlot.date} ${l.bookingSlot.time}` : '',
        l.customData
          ? Object.entries(l.customData)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' | ')
          : '',
        l.message,
      ]
        .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fullLiveUrl = latestResult
    ? `${window.location.origin}${latestResult.url}`
    : null;

  const selectedDeployment =
    deployments.find((d) => d.slug === domainSlug) || null;
  const activeDomainDisplay =
    cleanDomainInput(domainInput) ||
    selectedDeployment?.customDomain ||
    'www.yourdomain.com';
  const domainParts = activeDomainDisplay.split('.');
  const isApex = domainParts.length <= 2;
  const dnsCnameHost = isApex ? '@' : domainParts.slice(0, -2).join('.');
  const dnsTxtHost = isApex
    ? '_atelier-frame'
    : `_atelier-frame.${dnsCnameHost}`;
  const dnsTargetHost = window.location.hostname || 'your-studio-host.com';
  const dnsTxtValue = `atelier-site=${domainSlug || 'site'}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#13151A]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-[#DAD4C6] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-[#DAD4C6] bg-[#F8F6F1] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg">
            <button
              type="button"
              onClick={() => setTab('deploy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'deploy'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Rocket className="w-4 h-4 text-[#1D4ED8]" />
              <span>Publish &amp; Sites</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('domains')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'domains'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Link2 className="w-4 h-4 text-[#B45309]" />
              <span>Custom Domains</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('leads');
                loadLeads();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'leads'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Inbox className="w-4 h-4 text-black" />
              <span>Leads ({leads.length})</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deploy dialog"
            className="p-1.5 rounded-md text-black hover:bg-[#EAE6DC] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto studio-scroll flex-1">
          {tab === 'deploy' && (
            <div className="p-5 space-y-5">
              <form onSubmit={handleDeploy} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="deploy-client-input"
                      className="block text-sm font-medium text-black mb-1.5"
                    >
                      Client Account
                    </label>
                    <input
                      id="deploy-client-input"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client organization"
                      className="w-full rounded-lg border border-[#DAD4C6] px-3 py-2 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="deploy-slug-input"
                      className="block text-sm font-medium text-black mb-1.5"
                    >
                      Live URL Path
                    </label>
                    <div className="flex items-center rounded-lg border border-[#DAD4C6] overflow-hidden focus-within:ring-2 focus-within:ring-[#1D4ED8]">
                      <span className="px-2.5 py-2 bg-[#FAF9F5] border-r border-[#DAD4C6] text-sm font-mono text-black">
                        /sites/
                      </span>
                      <input
                        id="deploy-slug-input"
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="my-site"
                        className="flex-1 min-w-0 px-2.5 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="deploy-domain-input"
                    className="block text-sm font-medium text-black mb-1.5"
                  >
                    Custom Domain (Optional — can also connect after publishing)
                  </label>
                  <input
                    id="deploy-domain-input"
                    type="text"
                    value={publishDomain}
                    onChange={(e) => setPublishDomain(e.target.value)}
                    placeholder="www.yourbrand.com"
                    className="w-full rounded-lg border border-[#DAD4C6] px-3 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="px-3 py-2 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] text-xs text-black flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Publishing{' '}
                    <strong>{ensureProjectPages(project).pages.length}</strong>{' '}
                    page{ensureProjectPages(project).pages.length === 1 ? '' : 's'}:{' '}
                    <span className="font-mono">
                      {ensureProjectPages(project)
                        .pages.map((p) => p.path)
                        .join(', ')}
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-[#047857]">
                    + sitemap.xml · robots.txt
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isDeploying || project.blocks.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 px-4 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>
                    {isDeploying
                      ? 'Publishing Multi-Page Site...'
                      : 'Deploy Live Now'}
                  </span>
                </button>
              </form>

              {fullLiveUrl && latestResult && (
                <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-900">
                      Site Published Live ({latestResult.pagesCount || 1}{' '}
                      {(latestResult.pagesCount || 1) === 1 ? 'page' : 'pages'})
                    </span>
                    <span className="text-[13px] text-emerald-900 tabular-nums">
                      {new Date(latestResult.deployedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullLiveUrl}
                      className="flex-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-sm font-mono text-black"
                    />
                    <button
                      type="button"
                      onClick={() => copyValue(fullLiveUrl, 'live-url')}
                      className="px-3 py-1.5 rounded-md border border-emerald-300 bg-white hover:bg-emerald-50 text-sm font-medium text-black flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'live-url' ? (
                        <Check className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedKey === 'live-url' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={latestResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-black">
                    {(latestResult.pagePaths || ['/']).map((pgPath) => (
                      <a
                        key={pgPath}
                        href={
                          pgPath === '/'
                            ? latestResult.url
                            : `${latestResult.url}${pgPath}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-black"
                      >
                        {pgPath}
                      </a>
                    ))}
                    <a
                      href={`${latestResult.url}/sitemap.xml`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-[#047857] font-semibold"
                    >
                      sitemap.xml
                    </a>
                    <a
                      href={`${latestResult.url}/robots.txt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded border border-emerald-300 bg-white hover:bg-emerald-50 text-[#047857] font-semibold"
                    >
                      robots.txt
                    </a>
                  </div>
                  {latestResult.customDomain && (
                    <div className="flex items-center justify-between gap-2 pt-1 text-sm text-black">
                      <span>
                        Assigned domain:{' '}
                        <strong className="font-mono">
                          {latestResult.customDomain}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDomainSlug(latestResult.slug);
                          setDomainInput(latestResult.customDomain || '');
                          setTab('domains');
                        }}
                        className="text-sm font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        Verify DNS Setup →
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[#DAD4C6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black">
                    Client Deployments
                  </span>
                  <span className="text-[13px] text-black tabular-nums">
                    {deployments.length} published
                  </span>
                </div>

                {deployments.length === 0 ? (
                  <p className="text-sm text-black">
                    No sites deployed yet. Click Deploy Live Now to publish your first client site.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto studio-scroll space-y-2">
                    {deployments.map((d) => (
                      <div
                        key={d.slug}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5]"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-black truncate">
                            {d.name}
                          </div>
                          <div className="text-[13px] text-black truncate tabular-nums">
                            {d.clientName || 'Studio Client'} ·{' '}
                            <span>
                              {d.pagesCount || 1}{' '}
                              {(d.pagesCount || 1) === 1 ? 'page' : 'pages'}
                            </span>{' '}
                            · <span className="font-mono">{d.url}</span>
                            {d.customDomain && (
                              <>
                                {' '}
                                ·{' '}
                                <span className="font-mono font-semibold">
                                  {d.customDomain}
                                </span>{' '}
                                (
                                {d.domainVerified ? 'DNS Verified' : 'DNS Pending'}
                                )
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setDomainSlug(d.slug);
                              setDomainInput(d.customDomain || '');
                              setVerification(null);
                              setDomainStatusMsg(null);
                              setDomainError(null);
                              setTab('domains');
                            }}
                            className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 text-[13px] font-medium text-black cursor-pointer"
                          >
                            {d.customDomain ? 'Manage Domain' : 'Connect Domain'}
                          </button>
                          <a
                            href={`${d.url}/sitemap.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open auto-generated sitemap.xml"
                            className="px-2 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 text-[12px] font-mono font-medium text-black"
                          >
                            sitemap
                          </a>
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 text-[13px] font-medium text-black flex items-center gap-1"
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeployment(d.slug)}
                            title="Unpublish site"
                            className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'domains' && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-base font-bold text-black">
                  Connect Custom Domain
                </h3>
                <p className="text-sm text-black mt-1 leading-relaxed">
                  Bind your own domain name (e.g. <span className="font-mono">www.yourcompany.com</span>) to any published website. Incoming requests for that domain will serve your live website automatically.
                </p>
              </div>

              {deployments.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-[#DAD4C6] text-center space-y-3 bg-[#FAF9F5]">
                  <p className="text-sm text-black">
                    Publish a site first before connecting a custom domain.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('deploy')}
                    className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold cursor-pointer"
                  >
                    Go to Publish &amp; Sites
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSaveCustomDomain} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="domain-site-select"
                          className="block text-sm font-medium text-black mb-1.5"
                        >
                          Target Published Site
                        </label>
                        <select
                          id="domain-site-select"
                          value={domainSlug}
                          onChange={(e) => {
                            const nextSlug = e.target.value;
                            setDomainSlug(nextSlug);
                            const found = deployments.find(
                              (d) => d.slug === nextSlug
                            );
                            setDomainInput(found?.customDomain || '');
                            setVerification(null);
                            setDomainError(null);
                            setDomainStatusMsg(null);
                          }}
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                        >
                          {deployments.map((d) => (
                            <option key={d.slug} value={d.slug}>
                              {d.name} (/sites/{d.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="custom-domain-input"
                          className="block text-sm font-medium text-black mb-1.5"
                        >
                          Domain Name
                        </label>
                        <input
                          id="custom-domain-input"
                          type="text"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="www.yourbrand.com"
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    {domainError && (
                      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {domainError}
                      </div>
                    )}

                    {domainStatusMsg && (
                      <div
                        className={`rounded-lg border px-3 py-2.5 text-sm text-black ${
                          verification?.verified ||
                          selectedDeployment?.domainVerified
                            ? 'border-emerald-300 bg-emerald-50/70'
                            : 'border-[#DAD4C6] bg-[#FAF9F5]'
                        }`}
                      >
                        {domainStatusMsg}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={isSavingDomain || !domainInput.trim()}
                        className="px-4 py-2 rounded-lg bg-[#13151A] hover:bg-black disabled:opacity-45 text-white text-sm font-semibold cursor-pointer"
                      >
                        {isSavingDomain ? 'Saving Domain...' : 'Save Domain'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          isVerifyingDns ||
                          (!selectedDeployment?.customDomain &&
                            !domainInput.trim())
                        }
                        onClick={handleVerifyDns}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            isVerifyingDns ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {isVerifyingDns ? 'Checking DNS...' : 'Verify DNS'}
                        </span>
                      </button>

                      {selectedDeployment?.customDomain && (
                        <button
                          type="button"
                          onClick={handleDisconnectDomain}
                          disabled={isSavingDomain}
                          className="px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-red-50 text-sm font-medium text-black hover:text-red-700 cursor-pointer ml-auto"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </form>

                  {/* DNS Records Configuration Table */}
                  <div className="rounded-xl border border-[#DAD4C6] overflow-hidden bg-white">
                    <div className="px-4 py-3 bg-[#FAF9F5] border-b border-[#DAD4C6] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
                        <span className="text-sm font-semibold text-black">
                          DNS Records to Add at Your Domain Registrar
                        </span>
                      </div>
                      {selectedDeployment?.customDomain && (
                        <span
                          className={`text-xs font-bold ${
                            selectedDeployment.domainVerified
                              ? 'text-emerald-700'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {selectedDeployment.domainVerified
                            ? 'Verified'
                            : 'Pending DNS'}
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-[#DAD4C6] text-sm text-black">
                      <div className="p-3.5 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-mono font-bold">
                          CNAME
                        </div>
                        <div className="col-span-3 font-mono truncate">
                          {dnsCnameHost}
                        </div>
                        <div className="col-span-5 font-mono truncate">
                          {dnsTargetHost}
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => copyValue(dnsTargetHost, 'cname')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                          >
                            {copiedKey === 'cname' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === 'cname' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-mono font-bold">
                          TXT
                        </div>
                        <div className="col-span-3 font-mono truncate">
                          {dnsTxtHost}
                        </div>
                        <div className="col-span-5 font-mono truncate">
                          {dnsTxtValue}
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => copyValue(dnsTxtValue, 'txt')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#DAD4C6] hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                          >
                            {copiedKey === 'txt' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === 'txt' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 bg-[#FAF9F5] border-t border-[#DAD4C6] text-xs text-black leading-relaxed">
                      Tip: For root/apex domains (like <span className="font-mono">example.com</span> without <span className="font-mono">www</span>), use a DNS provider that supports CNAME flattening (such as Cloudflare) or forward the root domain to <span className="font-mono">www</span>.
                    </div>
                  </div>

                  {verification && (
                    <div className="rounded-lg border border-[#DAD4C6] p-3.5 bg-[#FAF9F5] space-y-1.5 text-xs text-black font-mono">
                      <div className="font-sans text-sm font-semibold text-black">
                        Live DNS Inspection Results
                      </div>
                      <div>
                        CNAME Match: {verification.checks.cnameMatched ? 'Yes' : 'No'}{' '}
                        {verification.checks.resolvedCnames.length > 0 &&
                          `(${verification.checks.resolvedCnames.join(', ')})`}
                      </div>
                      <div>
                        TXT Ownership Match:{' '}
                        {verification.checks.txtMatched ? 'Yes' : 'No'}
                      </div>
                      <div>
                        Host IP Match:{' '}
                        {verification.checks.aRecordMatched ? 'Yes' : 'No'}{' '}
                        {verification.checks.resolvedIps.length > 0 &&
                          `(${verification.checks.resolvedIps.join(', ')})`}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'leads' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-black">
                    Visitor Contact Submissions
                  </h3>
                  <p className="text-[13px] text-black mt-0.5">
                    Inquiries submitted through contact forms on your deployed client sites.
                  </p>
                </div>
                {leads.length > 0 && (
                  <button
                    type="button"
                    onClick={exportLeadsCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-semibold text-black cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                )}
              </div>

              {leads.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-[#DAD4C6] rounded-lg">
                  <p className="text-sm text-black">
                    No submissions yet. Visitors filling out the Contact form on any deployed site will appear here.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto studio-scroll space-y-2.5">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-black">
                          {lead.name}{' '}
                          <span className="font-normal text-black">
                            &lt;{lead.email}&gt;
                          </span>
                          {(lead.company || lead.phone) && (
                            <span className="block text-xs font-normal text-black/80">
                              {[lead.company, lead.phone].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[13px] font-mono text-black">
                            /{lead.siteSlug}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Delete submission"
                            className="text-black hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {lead.bookingSlot && (
                        <div className="text-xs font-semibold text-[#1D4ED8] tabular-nums">
                          Consultation: {lead.bookingSlot.date} at {lead.bookingSlot.time}
                          {lead.bookingSlot.duration ? ` (${lead.bookingSlot.duration})` : ''}
                        </div>
                      )}
                      <p className="text-sm text-black leading-relaxed">
                        {lead.message}
                      </p>
                      {lead.customData && Object.keys(lead.customData).length > 0 && (
                        <div className="text-xs text-black/80 space-y-0.5">
                          {Object.entries(lead.customData).map(([k, v]) => (
                            <div key={k}>
                              <span className="font-semibold">{k}:</span>{' '}
                              <span>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-[13px] text-black tabular-nums">
                        {new Date(lead.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
