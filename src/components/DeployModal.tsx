import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Inbox,
  Link2,
  Lock,
  Mail,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { slugify } from '../data/presets';
import {
  DeployedSiteRecord,
  DomainInspectionResult,
  DomainTransferDnsStrategy,
  DomainTransferRecord,
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

export type DeployModalTab = 'deploy' | 'domains' | 'leads';

interface DeployModalProps {
  open: boolean;
  initialTab?: DeployModalTab;
  project: SiteProject;
  exportOptions: ExportOptions;
  onClose: () => void;
  onDeployed: (record: DeployedSiteRecord) => void;
  onUpdateProjectDomain?: (domain: string) => void;
}

type ModalTab = DeployModalTab;
type DomainSubMode = 'connect' | 'transfer';

function cleanDomainInput(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '');
}

const REGISTRAR_GUIDE_TEXT: Record<string, string> = {
  cloudflare:
    'In Cloudflare DNS, add a CNAME record pointing to the target host below. If using Cloudflare proxy (orange cloud), ensure SSL/TLS is set to Full (Strict) or add the TXT verification record.',
  godaddy:
    'In GoDaddy DNS Management, edit or add the CNAME record for "www" and the TXT record below. For apex forwarding, enable GoDaddy Domain Forwarding from "@" to "www".',
  namecheap:
    'In Namecheap Advanced DNS, add a CNAME Record for host "www" and a TXT Record for "_atelier-frame". Remove conflicting parking A/URL Redirect records.',
  squarespace:
    'In Squarespace / Google Domains DNS Settings, scroll to Custom Records and add the CNAME and TXT records shown below.',
  route53:
    'In AWS Route 53 Hosted Zones, create a CNAME record (for subdomains) or Alias A record, plus the TXT verification record.',
  porkbun:
    'In Porkbun DNS Records, add the CNAME (or ALIAS for root "@") and TXT record below.',
  shopify:
    'In Shopify Domains -> DNS Settings, add the CNAME and TXT records or update subdomain routing.',
  other:
    'Open your DNS provider dashboard and add the CNAME and TXT records below. DNS propagation usually completes within 5–30 minutes.',
};

const TRANSFER_STAGE_ORDER = [
  'initiated',
  'approval_pending',
  'icann_window',
  'completed',
] as const;

function getTransferStageLabel(status: DomainTransferRecord['status']): string {
  switch (status) {
    case 'initiated':
      return 'Unlock Required';
    case 'auth_verified':
      return 'Auth Verified';
    case 'approval_pending':
      return 'FOA Email Pending';
    case 'icann_window':
      return '5-Day Registry Window';
    case 'completed':
      return 'Completed & Live';
    case 'cancelled':
      return 'Cancelled';
  }
}

export const DeployModal: React.FC<DeployModalProps> = ({
  open,
  initialTab = 'deploy',
  project,
  exportOptions,
  onClose,
  onDeployed,
  onUpdateProjectDomain,
}) => {
  const [tab, setTab] = useState<ModalTab>(initialTab);
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
  const [domainMode, setDomainMode] = useState<DomainSubMode>('connect');
  const [domainSlug, setDomainSlug] = useState(() =>
    slugify(project.lastDeployedSlug || project.slug || project.name)
  );
  const [domainInput, setDomainInput] = useState(() =>
    cleanDomainInput(project.seo?.customDomain || '')
  );
  const [autoPairCompanion, setAutoPairCompanion] = useState(true);
  const [aliasInput, setAliasInput] = useState('');
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [verifyingDomainTarget, setVerifyingDomainTarget] = useState<string | null>(null);
  const [isInspectingDomain, setIsInspectingDomain] = useState(false);
  const [inspection, setInspection] = useState<DomainInspectionResult | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatusMsg, setDomainStatusMsg] = useState<string | null>(null);
  const [verification, setVerification] = useState<DomainVerificationResult | null>(
    null
  );

  // Domain Transfer tab state
  const [transfers, setTransfers] = useState<DomainTransferRecord[]>([]);
  const [transferDomain, setTransferDomain] = useState('');
  const [transferSiteSlug, setTransferSiteSlug] = useState(() =>
    slugify(project.lastDeployedSlug || project.slug || project.name)
  );
  const [transferRegistrar, setTransferRegistrar] = useState('');
  const [transferEpp, setTransferEpp] = useState('');
  const [showEppCode, setShowEppCode] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferDnsStrategy, setTransferDnsStrategy] =
    useState<DomainTransferDnsStrategy>('keep_dns');
  const [checkUnlocked, setCheckUnlocked] = useState(false);
  const [checkAge, setCheckAge] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [isCheckingTransfer, setIsCheckingTransfer] = useState(false);
  const [transferInspection, setTransferInspection] =
    useState<DomainInspectionResult | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
  const [busyTransferId, setBusyTransferId] = useState<string | null>(null);
  const [editingEppId, setEditingEppId] = useState<string | null>(null);
  const [editingEppValue, setEditingEppValue] = useState('');

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

  const loadTransfers = async () => {
    try {
      const res = await fetch('/api/domains/transfers');
      if (res.ok) {
        const data = await res.json();
        setTransfers(Array.isArray(data.transfers) ? data.transfers : []);
      }
    } catch {
      // Ignore transient list errors
    }
  };

  useEffect(() => {
    if (open) {
      setTab(initialTab || 'deploy');
      const activeSlug = slugify(
        project.lastDeployedSlug || project.slug || project.name
      );
      setSlug(activeSlug);
      setDomainSlug(activeSlug);
      setTransferSiteSlug(activeSlug);
      setClientName(project.clientName || 'Internal Studio');
      setPublishDomain(cleanDomainInput(project.seo?.customDomain || ''));
      setError(null);
      setDomainError(null);
      setDomainStatusMsg(null);
      setVerification(null);
      setInspection(null);
      setTransferError(null);
      setTransferSuccessMsg(null);

      loadDeployments().then((list) => {
        const matched = list.find((d) => d.slug === activeSlug) || list[0];
        if (matched) {
          setDomainSlug(matched.slug);
          setTransferSiteSlug(matched.slug);
          setDomainInput(
            matched.customDomain ||
              cleanDomainInput(project.seo?.customDomain || '')
          );
        } else {
          setDomainInput(cleanDomainInput(project.seo?.customDomain || ''));
        }
      });
      loadLeads();
      loadTransfers();
    }
  }, [
    open,
    initialTab,
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
          body: JSON.stringify({
            customDomain: cleaned,
            autoPairCompanion,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not assign custom domain.');
      }
      setDomainInput(data.customDomain || '');
      if (data.customDomain) {
        const aliasCount = Array.isArray(data.additionalDomains)
          ? data.additionalDomains.length
          : 0;
        setDomainStatusMsg(
          `Domain "${data.customDomain}" saved${
            aliasCount > 0 ? ` (plus ${aliasCount} companion alias)` : ''
          }. Add the DNS records below, then click Verify DNS.`
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

  const handleInspectConnectDomain = async () => {
    const cleaned = cleanDomainInput(domainInput);
    if (!cleaned || isInspectingDomain) return;
    setIsInspectingDomain(true);
    setDomainError(null);
    try {
      const res = await fetch('/api/domains/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Domain inspection failed.');
      }
      setInspection(data.inspection as DomainInspectionResult);
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Unable to inspect domain DNS.'
      );
    } finally {
      setIsInspectingDomain(false);
    }
  };

  const handleVerifyDns = async (targetDomain?: string) => {
    if (!domainSlug || isVerifyingDns) return;
    const domainToCheck = cleanDomainInput(targetDomain || domainInput);
    if (!domainToCheck) return;
    setIsVerifyingDns(true);
    setVerifyingDomainTarget(domainToCheck);
    setDomainError(null);
    setDomainStatusMsg(null);

    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/verify-domain`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customDomain: domainToCheck }),
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
      setVerifyingDomainTarget(null);
    }
  };

  const handleAddAliasDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanDomainInput(aliasInput);
    if (!domainSlug || !cleaned || isAddingAlias) return;
    setIsAddingAlias(true);
    setDomainError(null);
    setDomainStatusMsg(null);
    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/domains/alias`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleaned }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to add alias domain.');
      }
      setAliasInput('');
      setDomainStatusMsg(`Added alias domain "${cleaned}". Verify its DNS records below.`);
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Failed to add alias domain.'
      );
    } finally {
      setIsAddingAlias(false);
    }
  };

  const handlePromotePrimaryDomain = async (targetDomain: string) => {
    if (!domainSlug || isSavingDomain) return;
    setIsSavingDomain(true);
    setDomainError(null);
    setDomainStatusMsg(null);
    try {
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/domains/primary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: targetDomain }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not promote primary domain.');
      }
      setDomainInput(data.customDomain || targetDomain);
      if (domainSlug === slugify(project.lastDeployedSlug || project.slug)) {
        onUpdateProjectDomain?.(`https://${data.customDomain || targetDomain}`);
      }
      setDomainStatusMsg(`Promoted "${targetDomain}" to primary domain.`);
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Failed to promote primary domain.'
      );
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleDisconnectDomain = async (aliasDomain?: string) => {
    if (!domainSlug || isSavingDomain) return;
    setIsSavingDomain(true);
    setDomainError(null);
    setDomainStatusMsg(null);
    if (!aliasDomain) setVerification(null);

    try {
      const query = aliasDomain
        ? `?domain=${encodeURIComponent(aliasDomain)}`
        : '';
      const res = await fetch(
        `/api/deployments/${encodeURIComponent(domainSlug)}/domain${query}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect domain.');
      }
      if (!aliasDomain) {
        setDomainInput('');
        setDomainStatusMsg('Primary custom domain disconnected.');
      } else {
        setDomainStatusMsg(`Removed alias domain "${aliasDomain}".`);
      }
      await loadDeployments();
    } catch (err) {
      setDomainError(
        err instanceof Error ? err.message : 'Unable to disconnect domain.'
      );
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleCheckTransferReadiness = async () => {
    const cleaned = cleanDomainInput(transferDomain);
    if (!cleaned || isCheckingTransfer) return;
    setIsCheckingTransfer(true);
    setTransferError(null);
    setTransferSuccessMsg(null);
    try {
      const res = await fetch('/api/domains/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not inspect domain for transfer.');
      }
      const insp = data.inspection as DomainInspectionResult;
      setTransferInspection(insp);
      if (insp.detectedRegistrar && insp.detectedRegistrar !== 'Unknown Registrar') {
        setTransferRegistrar(insp.detectedRegistrar);
      }
      if (insp.transferLocked === false) {
        setCheckUnlocked(true);
      } else if (insp.transferLocked === true) {
        setCheckUnlocked(false);
      }
      if (insp.icann60DayEligible === true) {
        setCheckAge(true);
      }
      if (insp.mxRecords && insp.mxRecords.length > 0) {
        setTransferDnsStrategy('keep_dns');
      }
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : 'Domain eligibility check failed.'
      );
    } finally {
      setIsCheckingTransfer(false);
    }
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTransfer) return;
    setIsSubmittingTransfer(true);
    setTransferError(null);
    setTransferSuccessMsg(null);
    try {
      const cleaned = cleanDomainInput(transferDomain);
      const res = await fetch('/api/domains/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: cleaned,
          siteSlug: transferSiteSlug,
          currentRegistrar: transferRegistrar,
          eppCode: transferEpp,
          registrantEmail: transferEmail,
          dnsStrategy: transferDnsStrategy,
          registrarChecks: {
            unlocked: checkUnlocked,
            ageConfirmed: checkAge,
            emailConfirmed: checkEmail,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not initiate domain transfer.');
      }
      setTransferEpp('');
      setTransferDomain('');
      setTransferInspection(null);
      setCheckUnlocked(false);
      setCheckAge(false);
      setCheckEmail(false);
      setTransferSuccessMsg(
        `Transfer initiated for ${data.transfer.domain}. Track progress and approve registrar steps below.`
      );
      await loadTransfers();
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : 'Failed to initiate domain transfer.'
      );
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleTransferAction = async (
    id: string,
    action: 'refresh_lock' | 'approve_foa' | 'complete' | 'cancel' | 'update_epp',
    extra?: { eppCode?: string }
  ) => {
    if (busyTransferId) return;
    setBusyTransferId(id);
    setTransferError(null);
    setTransferSuccessMsg(null);
    try {
      const res = await fetch(`/api/domains/transfers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(extra || {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer update failed.');
      }
      if (action === 'update_epp') {
        setEditingEppId(null);
        setEditingEppValue('');
      }
      if (action === 'complete' && data.transfer?.domain) {
        setTransferSuccessMsg(
          `Transfer completed: ${data.transfer.domain} is now connected and live on /sites/${data.transfer.siteSlug}.`
        );
        if (
          data.transfer.siteSlug ===
          slugify(project.lastDeployedSlug || project.slug)
        ) {
          onUpdateProjectDomain?.(`https://${data.transfer.domain}`);
        }
        await loadDeployments();
      }
      await loadTransfers();
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : 'Unable to update transfer.'
      );
    } finally {
      setBusyTransferId(null);
    }
  };

  const handleDeleteTransferRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/transfers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTransfers((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // Ignore delete error
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

  const activeTransfersCount = transfers.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#13151A]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl border border-[#DAD4C6] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-[#DAD4C6] bg-[#F8F6F1] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg">
            <button
              type="button"
              onClick={() => setTab('deploy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                tab === 'domains'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-black hover:bg-white/60'
              }`}
            >
              <Link2 className="w-4 h-4 text-[#B45309]" />
              <span>
                Domains{activeTransfersCount > 0 ? ` (${activeTransfersCount} transferring)` : ''}
              </span>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-black">
                    Custom Domains &amp; Registrar Transfers
                  </h3>
                  <p className="text-sm text-black mt-0.5 leading-relaxed">
                    Connect an existing domain via DNS or transfer a domain registration directly to Atelier Frame.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]/70 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDomainMode('connect')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      domainMode === 'connect'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Connect Domain (DNS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDomainMode('transfer')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      domainMode === 'transfer'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-black hover:bg-white/60'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Transfer Domain In</span>
                  </button>
                </div>
              </div>

              {deployments.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-[#DAD4C6] text-center space-y-3 bg-[#FAF9F5]">
                  <p className="text-sm text-black">
                    Publish a site first before connecting or transferring a domain name.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('deploy')}
                    className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold cursor-pointer"
                  >
                    Go to Publish &amp; Sites
                  </button>
                </div>
              ) : domainMode === 'connect' ? (
                <div className="space-y-4">
                  <form onSubmit={handleSaveCustomDomain} className="space-y-3">
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
                            setInspection(null);
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
                          Primary Domain Name
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            id="custom-domain-input"
                            type="text"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            placeholder="www.yourbrand.com"
                            className="flex-1 min-w-0 rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                          />
                          <button
                            type="button"
                            disabled={!domainInput.trim() || isInspectingDomain}
                            onClick={handleInspectConnectDomain}
                            title="Detect registrar and current DNS records"
                            className="px-3 py-2 rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] hover:bg-white disabled:opacity-45 text-xs font-semibold text-black whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            <Search className="w-3.5 h-3.5 text-[#1D4ED8]" />
                            <span>{isInspectingDomain ? 'Inspecting...' : 'Detect DNS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-black cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoPairCompanion}
                        onChange={(e) => setAutoPairCompanion(e.target.checked)}
                        className="rounded border-[#DAD4C6]"
                      />
                      <span>
                        Also bind companion <span className="font-mono">www</span> / apex domain alias automatically
                      </span>
                    </label>

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
                        className="px-4 py-2 rounded-lg bg-[#13151A] hover:bg-black disabled:opacity-45 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isSavingDomain ? 'Saving Domain...' : 'Save Primary Domain'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          isVerifyingDns ||
                          (!selectedDeployment?.customDomain &&
                            !domainInput.trim())
                        }
                        onClick={() => handleVerifyDns()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            isVerifyingDns && !verifyingDomainTarget ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {isVerifyingDns ? 'Checking DNS...' : 'Verify DNS'}
                        </span>
                      </button>

                      {selectedDeployment?.customDomain && (
                        <button
                          type="button"
                          onClick={() => handleDisconnectDomain()}
                          disabled={isSavingDomain}
                          className="px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-red-50 text-sm font-medium text-black hover:text-red-700 whitespace-nowrap shrink-0 cursor-pointer ml-auto"
                        >
                          Disconnect Primary
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Detected Registrar & Tailored Setup Card */}
                  {inspection && (
                    <div className="rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] p-3.5 space-y-2 text-xs text-black">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-black">
                          Detected DNS Provider: {inspection.detectedRegistrar}
                        </span>
                        <span className="font-mono tabular-nums text-black/80">
                          Apex: {inspection.apexDomain}
                        </span>
                      </div>
                      <p className="leading-relaxed">
                        {REGISTRAR_GUIDE_TEXT[inspection.registrarSlug] ||
                          REGISTRAR_GUIDE_TEXT.other}
                      </p>
                      {inspection.nameservers.length > 0 && (
                        <div className="font-mono text-[11px] text-black/80">
                          NS: {inspection.nameservers.join(' · ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Domains & Alias Manager */}
                  {selectedDeployment && (selectedDeployment.customDomain || (selectedDeployment.additionalDomains && selectedDeployment.additionalDomains.length > 0)) && (
                    <div className="rounded-xl border border-[#DAD4C6] bg-white overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#FAF9F5] border-b border-[#DAD4C6] flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-black">
                          Connected Domains for /sites/{selectedDeployment.slug}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-black/80">
                          {(selectedDeployment.customDomain ? 1 : 0) +
                            (selectedDeployment.additionalDomains?.length || 0)}{' '}
                          bound
                        </span>
                      </div>

                      <div className="divide-y divide-[#DAD4C6]">
                        {selectedDeployment.customDomain && (
                          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-black">
                            <div className="min-w-0">
                              <span className="font-mono font-semibold">
                                {selectedDeployment.customDomain}
                              </span>
                              <span className="text-xs text-black/80 ml-2">
                                Primary ·{' '}
                                {selectedDeployment.domainVerified
                                  ? 'DNS & HTTPS Verified'
                                  : 'Pending DNS'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleVerifyDns(selectedDeployment.customDomain || '')
                                }
                                disabled={isVerifyingDns}
                                className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                              >
                                Verify
                              </button>
                            </div>
                          </div>
                        )}

                        {(selectedDeployment.additionalDomains || []).map((alias) => (
                          <div
                            key={alias.domain}
                            className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-black"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-medium">
                                {alias.domain}
                              </span>
                              <span className="text-xs text-black/80 ml-2">
                                Alias ·{' '}
                                {alias.verified ? 'DNS Verified' : 'Pending DNS'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleVerifyDns(alias.domain)}
                                disabled={isVerifyingDns}
                                className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePromotePrimaryDomain(alias.domain)}
                                disabled={isSavingDomain}
                                className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-[#1D4ED8] cursor-pointer"
                              >
                                Make Primary
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDisconnectDomain(alias.domain)}
                                disabled={isSavingDomain}
                                className="p-1 rounded text-black hover:text-red-600 cursor-pointer"
                                title={`Remove ${alias.domain}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={handleAddAliasDomain}
                        className="px-4 py-2.5 bg-[#FAF9F5] border-t border-[#DAD4C6] flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={aliasInput}
                          onChange={(e) => setAliasInput(e.target.value)}
                          placeholder="Add another alias domain (e.g. brand.co or app.brand.com)"
                          className="flex-1 min-w-0 rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-1.5 text-xs font-mono text-black placeholder:text-black/60"
                        />
                        <button
                          type="submit"
                          disabled={!aliasInput.trim() || isAddingAlias}
                          className="px-3 py-1.5 rounded-lg bg-[#13151A] hover:bg-black disabled:opacity-45 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isAddingAlias ? 'Adding...' : '+ Add Alias'}
                        </button>
                      </form>
                    </div>
                  )}

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
                        Live DNS Inspection Results ({verification.customDomain})
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
                </div>
              ) : (
                /* Domain Transfer Workflow */
                <div className="space-y-5">
                  <form
                    onSubmit={handleInitiateTransfer}
                    className="rounded-xl border border-[#DAD4C6] bg-[#FAF9F5] p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="transfer-site-select"
                          className="block text-xs font-semibold text-black mb-1"
                        >
                          Destination Website
                        </label>
                        <select
                          id="transfer-site-select"
                          value={transferSiteSlug}
                          onChange={(e) => setTransferSiteSlug(e.target.value)}
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
                          htmlFor="transfer-domain-input"
                          className="block text-xs font-semibold text-black mb-1"
                        >
                          Domain to Transfer In
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            id="transfer-domain-input"
                            type="text"
                            value={transferDomain}
                            onChange={(e) => setTransferDomain(e.target.value)}
                            placeholder="yourbrand.com"
                            className="flex-1 min-w-0 rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                          />
                          <button
                            type="button"
                            disabled={!transferDomain.trim() || isCheckingTransfer}
                            onClick={handleCheckTransferReadiness}
                            className="px-3 py-2 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#EAE6DC]/60 disabled:opacity-45 text-xs font-semibold text-black whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isCheckingTransfer ? 'Checking...' : 'Check Eligibility'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {transferInspection && (
                      <div className="rounded-lg border border-[#DAD4C6] bg-white p-3.5 space-y-2 text-xs text-black">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-black">
                            Registry &amp; Eligibility Check — {transferInspection.apexDomain}
                          </span>
                          <span
                            className={`font-semibold ${
                              transferInspection.transferLocked === true
                                ? 'text-red-700'
                                : transferInspection.transferLocked === false
                                ? 'text-emerald-700'
                                : 'text-[#B45309]'
                            }`}
                          >
                            {transferInspection.transferLocked === true
                              ? 'Locked at Registrar (clientTransferProhibited)'
                              : transferInspection.transferLocked === false
                              ? 'Unlocked & Ready for Transfer'
                              : 'Lock Status Unconfirmed via RDAP'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 tabular-nums">
                          <div>
                            <span className="text-black/70">Registrar:</span>{' '}
                            <span className="font-semibold">
                              {transferInspection.detectedRegistrar}
                            </span>
                          </div>
                          <div>
                            <span className="text-black/70">60-Day Rule:</span>{' '}
                            <span className="font-semibold">
                              {transferInspection.ageDays !== null
                                ? `${transferInspection.ageDays} days (${
                                    transferInspection.icann60DayEligible ? 'Eligible' : 'Locked <60d'
                                  })`
                                : 'Verify at registrar'}
                            </span>
                          </div>
                          <div>
                            <span className="text-black/70">Email MX:</span>{' '}
                            <span className="font-semibold">
                              {transferInspection.mxRecords.length > 0
                                ? `${transferInspection.mxRecords.length} active MX`
                                : 'None detected'}
                            </span>
                          </div>
                        </div>
                        {transferInspection.mxRecords.length > 0 && (
                          <div className="rounded border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-black">
                            Active email MX records detected ({transferInspection.mxRecords[0]}). Keep existing DNS during transfer so business email stays uninterrupted.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="transfer-registrar-input"
                          className="block text-xs font-semibold text-black mb-1"
                        >
                          Current Registrar
                        </label>
                        <input
                          id="transfer-registrar-input"
                          type="text"
                          value={transferRegistrar}
                          onChange={(e) => setTransferRegistrar(e.target.value)}
                          placeholder="GoDaddy, Namecheap, Cloudflare..."
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="transfer-epp-input"
                          className="block text-xs font-semibold text-black mb-1"
                        >
                          EPP / Authorization Code
                        </label>
                        <div className="relative">
                          <input
                            id="transfer-epp-input"
                            type={showEppCode ? 'text' : 'password'}
                            value={transferEpp}
                            onChange={(e) => setTransferEpp(e.target.value)}
                            placeholder="Registrar auth key"
                            autoComplete="off"
                            className="w-full rounded-lg border border-[#DAD4C6] bg-white pl-3 pr-8 py-2 text-sm font-mono text-black placeholder:text-black/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEppCode((s) => !s)}
                            aria-label={showEppCode ? 'Hide auth code' : 'Show auth code'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-black/70 hover:text-black cursor-pointer"
                          >
                            {showEppCode ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="transfer-email-input"
                          className="block text-xs font-semibold text-black mb-1"
                        >
                          Registrant Approval Email
                        </label>
                        <input
                          id="transfer-email-input"
                          type="email"
                          value={transferEmail}
                          onChange={(e) => setTransferEmail(e.target.value)}
                          placeholder="admin@yourbrand.com"
                          className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-black">
                        DNS Cutover During Transfer
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setTransferDnsStrategy('keep_dns')}
                          className={`text-left p-3 rounded-lg border cursor-pointer transition-colors ${
                            transferDnsStrategy === 'keep_dns'
                              ? 'border-[#1D4ED8] bg-white'
                              : 'border-[#DAD4C6] bg-white/60 hover:bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-black">
                            Keep Current DNS &amp; MX (Zero-Downtime)
                          </div>
                          <div className="text-[11px] text-black/80 mt-0.5">
                            Preserves existing nameservers, website, and email records throughout transfer.
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferDnsStrategy('managed_dns')}
                          className={`text-left p-3 rounded-lg border cursor-pointer transition-colors ${
                            transferDnsStrategy === 'managed_dns'
                              ? 'border-[#1D4ED8] bg-white'
                              : 'border-[#DAD4C6] bg-white/60 hover:bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-black">
                            Migrate to Atelier Managed DNS
                          </div>
                          <div className="text-[11px] text-black/80 mt-0.5">
                            Automatically routes apex &amp; www to your site on completion.
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs text-black">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkUnlocked}
                          onChange={(e) => setCheckUnlocked(e.target.checked)}
                          className="rounded border-[#DAD4C6]"
                        />
                        <span>Registrar transfer lock is disabled (unlocked)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkAge}
                          onChange={(e) => setCheckAge(e.target.checked)}
                          className="rounded border-[#DAD4C6]"
                        />
                        <span>Domain was registered or last transferred more than 60 days ago</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkEmail}
                          onChange={(e) => setCheckEmail(e.target.checked)}
                          className="rounded border-[#DAD4C6]"
                        />
                        <span>Registrant contact email is accessible for transfer approval (FOA)</span>
                      </label>
                    </div>

                    {transferError && (
                      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {transferError}
                      </div>
                    )}

                    {transferSuccessMsg && (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 px-3 py-2 text-sm text-black">
                        {transferSuccessMsg}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-black/80">
                        EPP codes are verified on submission and masked (<span className="font-mono">••••</span>) at rest.
                      </span>
                      <button
                        type="submit"
                        disabled={
                          isSubmittingTransfer ||
                          !transferDomain.trim() ||
                          !transferEpp.trim() ||
                          !transferEmail.trim()
                        }
                        className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isSubmittingTransfer
                          ? 'Submitting Transfer...'
                          : 'Initiate Domain Transfer'}
                      </button>
                    </div>
                  </form>

                  {/* Active & Completed Domain Transfers */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-black">
                        Domain Transfer Queue
                      </span>
                      <span className="text-xs font-mono tabular-nums text-black/80">
                        {transfers.length} total
                      </span>
                    </div>

                    {transfers.length === 0 ? (
                      <div className="p-6 rounded-lg border border-dashed border-[#DAD4C6] text-center text-sm text-black bg-[#FAF9F5]">
                        No domain transfers yet. Use the form above to move an existing domain into your workspace.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transfers.map((tr) => {
                          const stageIdx = TRANSFER_STAGE_ORDER.indexOf(
                            tr.status === 'auth_verified'
                              ? 'initiated'
                              : (tr.status as (typeof TRANSFER_STAGE_ORDER)[number])
                          );
                          const isBusy = busyTransferId === tr.id;
                          return (
                            <div
                              key={tr.id}
                              className="rounded-xl border border-[#DAD4C6] bg-white p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {tr.lockDetected ? (
                                      <Lock className="w-4 h-4 text-red-700 shrink-0" />
                                    ) : (
                                      <Unlock className="w-4 h-4 text-emerald-700 shrink-0" />
                                    )}
                                    <span className="text-sm font-bold font-mono text-black">
                                      {tr.domain}
                                    </span>
                                  </div>
                                  <div className="text-xs text-black/80 mt-0.5 tabular-nums">
                                    Target: <span className="font-mono">/sites/{tr.siteSlug}</span> ·{' '}
                                    {tr.currentRegistrar} · Auth:{' '}
                                    <span className="font-mono">••••{tr.eppLast4}</span> ·{' '}
                                    {tr.dnsStrategy === 'keep_dns'
                                      ? 'Keep Existing DNS'
                                      : 'Managed DNS'}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div
                                    className={`text-xs font-bold ${
                                      tr.status === 'completed'
                                        ? 'text-emerald-700'
                                        : tr.status === 'cancelled'
                                        ? 'text-black/60'
                                        : tr.lockDetected
                                        ? 'text-red-700'
                                        : 'text-[#1D4ED8]'
                                    }`}
                                  >
                                    {getTransferStageLabel(tr.status)}
                                  </div>
                                  <div className="text-[11px] text-black/70 tabular-nums">
                                    {tr.completedAt
                                      ? `Completed ${new Date(tr.completedAt).toLocaleDateString()}`
                                      : `Est. completion ${new Date(
                                          tr.estimatedCompletionAt
                                        ).toLocaleDateString()}`}
                                  </div>
                                </div>
                              </div>

                              {tr.status !== 'cancelled' && (
                                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                                  {[
                                    '1. Lock & Auth',
                                    '2. FOA Email',
                                    '3. 5-Day Window',
                                    '4. Live & Routed',
                                  ].map((label, idx) => {
                                    const active = stageIdx >= idx;
                                    return (
                                      <div key={label} className="space-y-1">
                                        <div
                                          className={`h-1.5 rounded-full ${
                                            tr.status === 'completed'
                                              ? 'bg-emerald-600'
                                              : active
                                              ? 'bg-[#1D4ED8]'
                                              : 'bg-[#EAE6DC]'
                                          }`}
                                        />
                                        <div
                                          className={`truncate ${
                                            active
                                              ? 'font-semibold text-black'
                                              : 'text-black/60'
                                          }`}
                                        >
                                          {label}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {tr.notes && (
                                <p className="text-xs text-black leading-relaxed bg-[#FAF9F5] border border-[#DAD4C6]/70 rounded-lg px-3 py-2">
                                  {tr.notes}
                                </p>
                              )}

                              {editingEppId === tr.id && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingEppValue}
                                    onChange={(e) => setEditingEppValue(e.target.value)}
                                    placeholder="Enter updated EPP auth code"
                                    className="flex-1 min-w-0 rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-xs font-mono text-black"
                                  />
                                  <button
                                    type="button"
                                    disabled={isBusy || !editingEppValue.trim()}
                                    onClick={() =>
                                      handleTransferAction(tr.id, 'update_epp', {
                                        eppCode: editingEppValue,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-[#13151A] text-white text-xs font-semibold cursor-pointer"
                                  >
                                    Save Auth Code
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEppId(null);
                                      setEditingEppValue('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] text-xs font-medium text-black cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {tr.status !== 'completed' && tr.status !== 'cancelled' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleTransferAction(tr.id, 'refresh_lock')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-black cursor-pointer"
                                    >
                                      <RefreshCw
                                        className={`w-3.5 h-3.5 ${
                                          isBusy ? 'animate-spin' : ''
                                        }`}
                                      />
                                      <span>Re-check Lock</span>
                                    </button>

                                    {(tr.status === 'initiated' ||
                                      tr.status === 'auth_verified' ||
                                      tr.status === 'approval_pending') && (
                                      <button
                                        type="button"
                                        disabled={isBusy || tr.lockDetected}
                                        onClick={() =>
                                          handleTransferAction(tr.id, 'approve_foa')
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] disabled:opacity-45 text-xs font-semibold text-black cursor-pointer"
                                      >
                                        <Mail className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                        <span>Confirm FOA Email</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => {
                                        setEditingEppId(tr.id);
                                        setEditingEppValue('');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-xs font-medium text-black cursor-pointer"
                                    >
                                      Update Auth Code
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleTransferAction(tr.id, 'complete')}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                                    >
                                      Finalize &amp; Route Domain
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleTransferAction(tr.id, 'cancel')}
                                      className="px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] hover:bg-red-50 text-xs font-medium text-black hover:text-red-700 cursor-pointer ml-auto"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {(tr.status === 'completed' || tr.status === 'cancelled') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransferRecord(tr.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] hover:bg-red-50 text-xs font-medium text-black hover:text-red-700 cursor-pointer ml-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove from Log</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
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
