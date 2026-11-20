import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, Globe } from 'lucide-react';
import { ExportOptions, SiteProject } from '../types/builder';
import {
  generateAllSitePagesHtml,
  generateCleanCss,
  generateRobotsTxt,
  generateSitemapXml,
} from '../utils/codeGenerator';

interface CodeHandoffViewProps {
  project: SiteProject;
  options: ExportOptions;
  onChangeOptions: (patch: Partial<ExportOptions>) => void;
}

type CodeTab = 'html' | 'css' | 'bundle' | 'sitemap' | 'robots';

export const CodeHandoffView: React.FC<CodeHandoffViewProps> = ({
  project,
  options,
  onChangeOptions,
}) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [selectedPageId, setSelectedPageId] = useState<string>(
    () => project.activePageId || project.pages?.[0]?.id || 'page_home'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const compiledPages = useMemo(
    () => generateAllSitePagesHtml(project, options, false),
    [project, options]
  );

  const compiledBundlePages = useMemo(
    () => generateAllSitePagesHtml(project, options, true),
    [project, options]
  );

  const activeCompiledPage =
    compiledPages.find((p) => p.id === selectedPageId) || compiledPages[0];
  const activeBundlePage =
    compiledBundlePages.find((p) => p.id === selectedPageId) ||
    compiledBundlePages[0];

  const htmlCode = activeCompiledPage?.html || '';
  const cssCode = useMemo(
    () => generateCleanCss(project.theme, options),
    [project.theme, options]
  );
  const bundleCode = activeBundlePage?.html || '';
  const sitemapXml = useMemo(() => generateSitemapXml(project), [project]);
  const robotsTxt = useMemo(() => generateRobotsTxt(project), [project]);

  const activeCode =
    activeTab === 'html'
      ? htmlCode
      : activeTab === 'css'
        ? cssCode
        : activeTab === 'bundle'
          ? bundleCode
          : activeTab === 'sitemap'
            ? sitemapXml
            : robotsTxt;

  const lines = useMemo(() => activeCode.split('\n'), [activeCode]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F4F2EC]">
      {/* Left Handoff Configuration Panel */}
      <aside className="w-[324px] shrink-0 bg-white border-r border-[#DAD4C6] p-5 flex flex-col justify-between overflow-y-auto studio-scroll">
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-black">
              Developer Handoff
            </h2>
            <p className="text-sm text-black mt-1 leading-relaxed">
              Multi-page semantic HTML5, zero-dependency CSS3, and auto-generated SEO sitemaps compiled directly from your site.
            </p>
          </div>

          {/* Page Switcher for Code Export */}
          <div className="space-y-2 pt-3 border-t border-[#DAD4C6]">
            <label
              htmlFor="code-page-select"
              className="flex items-center justify-between text-xs font-semibold text-black"
            >
              <span>Inspect Page Route</span>
              <span className="font-mono">{compiledPages.length} pages</span>
            </label>
            <select
              id="code-page-select"
              value={activeCompiledPage?.id || ''}
              onChange={(e) => {
                setSelectedPageId(e.target.value);
                if (activeTab === 'sitemap' || activeTab === 'robots') {
                  setActiveTab('html');
                }
              }}
              className="w-full rounded-lg border border-[#DAD4C6] bg-[#FAF9F5] px-2.5 py-1.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] cursor-pointer"
            >
              {compiledPages.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.name} ({pg.path} → {pg.fileName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#DAD4C6]">
            <div className="text-sm font-semibold text-black">
              Output Customization
            </div>

            <div>
              <label
                htmlFor="css-prefix-input"
                className="block text-[13px] font-medium text-black mb-1"
              >
                CSS Class Prefix
              </label>
              <input
                id="css-prefix-input"
                type="text"
                value={options.prefix}
                onChange={(e) => onChangeOptions({ prefix: e.target.value })}
                placeholder="af-"
                className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div>
              <label
                htmlFor="form-endpoint-input"
                className="block text-[13px] font-medium text-black mb-1"
              >
                Contact Form POST URL (Optional)
              </label>
              <input
                id="form-endpoint-input"
                type="text"
                value={options.formEndpoint || ''}
                onChange={(e) =>
                  onChangeOptions({ formEndpoint: e.target.value })
                }
                placeholder={`/api/sites/${project.slug || 'site'}/submit`}
                className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Use :root CSS Variables</span>
              <input
                type="checkbox"
                checked={options.useCssVariables}
                onChange={(e) =>
                  onChangeOptions({ useCssVariables: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Include Base CSS Reset</span>
              <input
                type="checkbox"
                checked={options.includeReset}
                onChange={(e) =>
                  onChangeOptions({ includeReset: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Minify Production Output</span>
              <input
                type="checkbox"
                checked={options.minify}
                onChange={(e) => onChangeOptions({ minify: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#DAD4C6]">
            <div className="text-sm font-semibold text-black">
              Download Site Files
            </div>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  activeCompiledPage?.fileName || 'index.html',
                  htmlCode,
                  'text/html'
                )
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-medium text-black cursor-pointer"
            >
              <span>{activeCompiledPage?.fileName || 'index.html'}</span>
              <Download className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              onClick={() => downloadFile('styles.css', cssCode, 'text/css')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-medium text-black cursor-pointer"
            >
              <span>styles.css</span>
              <Download className="w-4 h-4 text-black" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadFile('sitemap.xml', sitemapXml, 'application/xml')
                }
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-xs font-mono font-semibold text-black cursor-pointer"
              >
                <span>sitemap.xml</span>
                <Download className="w-3.5 h-3.5 text-black" />
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadFile('robots.txt', robotsTxt, 'text/plain')
                }
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-xs font-mono font-semibold text-black cursor-pointer"
              >
                <span>robots.txt</span>
                <Download className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  `${project.slug || 'site'}-${activeCompiledPage?.fileName || 'index.html'}`,
                  bundleCode,
                  'text/html'
                )
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#13151A] hover:bg-black text-sm font-semibold text-white cursor-pointer"
            >
              <span>Standalone Bundle (.html)</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-[#DAD4C6] text-[13px] text-black space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span>HTML Size</span>
            <span className="font-mono">{(htmlCode.length / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>CSS Size</span>
            <span className="font-mono">{(cssCode.length / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>Pages / Sections</span>
            <span className="font-mono">
              {compiledPages.length}p / {activeCompiledPage?.blockCount ?? project.blocks.length}b
            </span>
          </div>
        </div>
      </aside>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#13151A] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#1B1E25] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#13151A] rounded-lg border border-slate-800">
              {(
                [
                  ['html', activeCompiledPage?.fileName || 'index.html'],
                  ['css', 'styles.css'],
                  ['bundle', 'standalone.html'],
                  ['sitemap', 'sitemap.xml'],
                  ['robots', 'robots.txt'],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab === 'sitemap' || tab === 'robots' ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5" />
                  )}
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(activeCode, activeTab)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedKey === activeTab ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    Copy{' '}
                    {activeTab === 'css'
                      ? 'CSS'
                      : activeTab === 'sitemap'
                        ? 'XML'
                        : activeTab === 'robots'
                          ? 'TXT'
                          : 'HTML'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto studio-scroll p-4 font-mono text-sm leading-6 text-slate-100">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="select-none pr-4 text-right text-slate-400 tabular-nums w-10 align-top">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre text-slate-100">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
