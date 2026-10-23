import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';

export const DocumentIntelligence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const docId = id || 'doc_inv_101';
  const analysis = vaultStore.getDocumentAnalysis(docId);

  const [activeTab, setActiveTab] = useState<'Analysis' | 'Details' | 'Citations' | 'Missing Info'>('Analysis');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  const totalPages = analysis.page_count || 3;

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(75, prev + delta)));
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([analysis.raw_text_by_page[currentPage] || analysis.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${analysis.title.replace(/\.[^/.]+$/, '')}_page_${currentPage}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ─── Breadcrumb & Top Controls ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-luna-pearl-grey">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/documents"
            className="flex items-center gap-1 text-luna-secondary hover:text-luna-primary font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Documents</span>
          </Link>
          <span className="text-luna-silver">/</span>
          <span className="font-semibold text-luna-primary">{analysis.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-luna-pearl hover:bg-luna-ivory text-luna-primary border border-luna-pearl-grey rounded-luna-md text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-luna-secondary" />
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-luna-pearl hover:bg-luna-ivory text-luna-primary border border-luna-pearl-grey rounded-luna-md text-xs font-medium shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-luna-secondary" />
            <span>Open Original</span>
          </button>
        </div>
      </div>

      {/* ─── Split Two-Panel Workspace ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Panel: Document Viewer (5 cols on lg) ─────────────────── */}
        <div className="lg:col-span-5 bg-[#14141A]/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col h-[700px]">
          {/* Viewer Toolbar */}
          <div className="h-11 bg-white/[0.04] border-b border-white/10 px-3 flex items-center justify-between text-xs text-luna-silver shrink-0">
            {/* Page navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-luna-charcoal hover:text-white disabled:opacity-40 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-luna-charcoal hover:text-white disabled:opacity-40 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoom(-15)}
                className="p-1 rounded hover:bg-luna-charcoal hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-white w-8 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => handleZoom(15)}
                className="p-1 rounded hover:bg-luna-charcoal hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 rounded hover:bg-luna-charcoal hover:text-white transition-colors"
                title="Reset zoom"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Sheet Display Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0E0E12] flex items-center justify-center">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
              className="w-full max-w-[380px] min-h-[480px] bg-white rounded-md shadow-2xl p-6 text-luna-primary font-sans text-xs flex flex-col justify-between transition-transform duration-150"
            >
              {/* Document Page Header */}
              {currentPage === 1 ? (
                <>
                  <div>
                    <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-4">
                      <div>
                        <h4 className="font-bold text-base text-gray-900 tracking-tight">TechWorld</h4>
                        <p className="text-[10px] text-gray-500">Authorized Electronics Retailer</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-gray-800 text-[11px]">#INV-2026-001</p>
                        <p className="text-[10px] text-gray-500">15 Aug 2026</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800 block mb-1">
                        INVOICE
                      </span>
                      <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded">
                        <p className="font-semibold text-gray-800">Bill To:</p>
                        <p>{vaultStore.getState().settings.name || 'Account Holder'}</p>
                        <p>Kanpur, Uttar Pradesh</p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-200 rounded overflow-hidden mb-4">
                      <div className="bg-gray-100 px-2 py-1 flex justify-between text-[10px] font-bold text-gray-700">
                        <span>Items</span>
                        <span>Amount</span>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <div>
                            <p className="font-semibold text-gray-900">Laptop - XYZ Model</p>
                            <p className="text-gray-500 text-[9px]">16GB RAM / 512GB SSD</p>
                          </div>
                          <span className="font-semibold text-gray-900">₹85,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 font-bold text-gray-900 text-sm">
                      <span>Total</span>
                      <span>₹85,000</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-[9px] text-gray-400 text-center">
                    Thank you for your purchase! Keep this invoice for warranty verification.
                  </div>
                </>
              ) : currentPage === 2 ? (
                <>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-2 border-b pb-1">
                      Warranty Policy & Terms
                    </h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-3">
                      This unit is covered under TechWorld 1-Year Limited Hardware Protection valid through 15 Aug 2027.
                    </p>
                    <div className="space-y-2 text-[10px] text-gray-700 bg-gray-50 p-3 rounded">
                      <p><strong>Hardware Serial:</strong> SN-TECH-88291X</p>
                      <p><strong>Coverage:</strong> Screen fault, motherboard defects, manufacturing issues.</p>
                      <p><strong>Exclusions:</strong> Water damage, physical drop, unauthorized repair.</p>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-400 text-center">Page 2 of 3</div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-2 border-b pb-1">
                      Service Centers & Support
                    </h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-3">
                      For warranty claims, present this original invoice at any authorized service center.
                    </p>
                    <div className="text-[10px] text-gray-700 space-y-1 bg-gray-50 p-3 rounded">
                      <p><strong>Email:</strong> support@techworld.in</p>
                      <p><strong>Helpline:</strong> 1800-200-LUNA</p>
                      <p><strong>Turnaround Time:</strong> 3-5 business days</p>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-400 text-center">Page 3 of 3</div>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="h-16 bg-luna-charcoal border-t border-luna-charcoal-border px-3 flex items-center justify-center gap-3 shrink-0">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-11 rounded border flex flex-col items-center justify-center text-[10px] transition-all ${
                  currentPage === page
                    ? 'border-luna-halo bg-luna-charcoal-surface text-white ring-1 ring-luna-halo'
                    : 'border-luna-charcoal-border bg-[#0E0E12] text-luna-silver hover:border-luna-silver'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mb-0.5 opacity-80" />
                <span>p.{page}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Right Panel: Intelligence Workspace (7 cols on lg) ─────────── */}
        <div className="lg:col-span-7 bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col min-h-[700px]">
          {/* Workspace Tabs Header */}
          <div className="flex items-center justify-between border-b border-stone-200/60 px-4 bg-white/40">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {(['Analysis', 'Details', 'Citations', 'Missing Info'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-luna-md text-xs font-semibold transition-all shrink-0 ${
                    activeTab === tab
                      ? 'bg-luna-charcoal text-white shadow-xs'
                      : 'text-luna-secondary hover:text-luna-primary hover:bg-luna-pearl-grey/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Confidence Badge */}
            <div className="shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{analysis.confidence}</span>
              </span>
            </div>
          </div>

          {/* Workspace Tab Content */}
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-6 overflow-y-auto">
            {activeTab === 'Analysis' && (
              <div className="space-y-6">
                {/* Extracted Information Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-3">
                    Extracted Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(analysis.extracted_fields).map(([label, val]) => (
                      <div
                        key={label}
                        className="p-3 rounded-luna-md bg-luna-ivory/60 border border-luna-pearl-grey"
                      >
                        <span className="text-[10px] font-medium text-luna-secondary block uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="text-sm font-bold text-luna-primary block mt-0.5 truncate">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Dates Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-3">
                    Key Dates
                  </h3>
                  <div className="space-y-2">
                    {analysis.key_dates.map((kd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-luna-md bg-luna-ivory/60 border border-luna-pearl-grey"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-luna-sm bg-rose-50 border border-rose-200 text-rose-700 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold leading-none">{kd.day}</span>
                            <span className="text-[9px] font-semibold uppercase leading-none mt-0.5">
                              {kd.month}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-luna-primary">{kd.title}</p>
                            <p className="text-xs text-luna-secondary">{kd.subtitle}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {kd.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-2">
                    Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-luna-primary bg-luna-ivory/40 p-3.5 rounded-luna-md border border-luna-pearl-grey leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'Details' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary">
                  Complete Field Verification
                </h3>
                <div className="border border-luna-pearl-grey rounded-luna-md overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-luna-ivory text-luna-secondary font-semibold border-b border-luna-pearl-grey">
                      <tr>
                        <th className="p-2.5">Field</th>
                        <th className="p-2.5">Extracted Value</th>
                        <th className="p-2.5">Page</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-luna-pearl-grey/60">
                      {analysis.details.map((d, i) => (
                        <tr key={i} className="hover:bg-luna-ivory/30">
                          <td className="p-2.5 font-medium text-luna-primary">{d.label}</td>
                          <td className="p-2.5 text-luna-secondary font-mono">{d.value}</td>
                          <td className="p-2.5 text-luna-silver">Page {d.page}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Citations' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary">
                  Evidence-Backed Source Citations
                </h3>
                <div className="space-y-3">
                  {analysis.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-luna-ivory/60 border border-luna-pearl-grey rounded-luna-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-luna-secondary">
                        <span className="font-semibold text-luna-primary flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-luna-accent" />
                          {cite.document_title}
                        </span>
                        <span className="font-mono text-luna-silver">Page {cite.page}</span>
                      </div>
                      <blockquote className="border-l-2 border-luna-accent pl-2.5 text-xs text-luna-primary italic">
                        “{cite.text_snippet}”
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Missing Info' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-luna-secondary">
                  Requirements & Missing Fields
                </h3>
                <div className="space-y-3">
                  {analysis.missing_info.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-luna-md space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-amber-900">{item.field}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {item.importance}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="pt-4 border-t border-luna-pearl-grey flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('Citations')}
                className="w-full sm:w-auto px-4 py-2 bg-luna-ivory hover:bg-luna-pearl-grey/70 text-luna-primary border border-luna-pearl-grey rounded-luna-md text-xs font-semibold transition-colors"
              >
                View Citations
              </button>
              <button
                type="button"
                onClick={() => navigate('/workflows')}
                className="w-full sm:w-auto px-5 py-2.5 bg-luna-accent hover:bg-luna-accent-hover text-white rounded-luna-md text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-luna-halo"
              >
                <span>Prepare Action</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentIntelligence;
