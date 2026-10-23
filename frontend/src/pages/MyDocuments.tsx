import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  HeartPulse,
  Scale,
  CreditCard,
  Trash2,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { RecentDocumentItem } from '../types/api';

const mapBackendDoc = (d: any): RecentDocumentItem => {
  const dateStr = d.upload_date || d.uploaded_at;
  const fileName = d.file_name || d.original_filename || `${d.title || 'document'}.pdf`;
  const title = d.title || d.original_filename || `Document ${d.id}`;
  const docType = (d.document_type || 'other').toLowerCase();

  return {
    id: d.id,
    title,
    fileName,
    uploadedAt: dateStr || new Date().toISOString(),
    formattedDate: dateStr
      ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'In vault',
    documentType: (docType || 'other') as any,
    badgeLabel: docType === 'utility_bill' ? 'BILL' : docType.toUpperCase(),
    badgeVariant: (
      docType === 'invoice' ? 'lavender' :
      docType === 'warranty' ? 'amber' :
      docType === 'utility_bill' ? 'coral' :
      docType === 'insurance' ? 'rose' :
      docType === 'health' ? 'emerald' : 'lavender'
    ) as any,
    fileSize: d.page_count
      ? `${d.page_count} page${d.page_count !== 1 ? 's' : ''}`
      : d.size_bytes
      ? `${Math.round(d.size_bytes / 1024)} KB`
      : '1 page',
    pageCount: d.page_count || 1,
  };
};

export const MyDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<RecentDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendDocs = await api.listDocuments();
      if (!backendDocs || backendDocs.length === 0) {
        setDocuments([]);
      } else {
        setDocuments(backendDocs.map(mapBackendDoc));
      }
    } catch (err: any) {
      setError('Could not load documents. Make sure the backend server is running on port 8000.');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const documentTypes = ['All Types', 'Invoice', 'Warranty', 'Insurance', 'Bill', 'Health', 'Agreement', 'Statement'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === 'All Types' ||
      doc.badgeLabel.toLowerCase() === selectedType.toLowerCase() ||
      (selectedType === 'Bill' && (doc.badgeLabel === 'BILL' || doc.badgeLabel === 'UTILITY_BILL'));
    return matchesSearch && matchesType;
  });

  const getDocIcon = (type: RecentDocumentItem['documentType']) => {
    switch (type) {
      case 'invoice':      return <FileSpreadsheet className="w-5 h-5 text-indigo-600" />;
      case 'warranty':     return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case 'insurance':    return <ShieldCheck className="w-5 h-5 text-rose-600" />;
      case 'utility_bill': return <Zap className="w-5 h-5 text-orange-600" />;
      case 'health':       return <HeartPulse className="w-5 h-5 text-emerald-600" />;
      case 'agreement':    return <Scale className="w-5 h-5 text-purple-600" />;
      case 'statement':    return <CreditCard className="w-5 h-5 text-amber-600" />;
      default:             return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBadgeStyle = (variant: RecentDocumentItem['badgeVariant']) => {
    switch (variant) {
      case 'lavender': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':    return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'coral':    return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rose':     return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'emerald':  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:         return 'bg-luna-pearl-grey/60 text-luna-secondary border-luna-pearl-grey';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadModalOpen(false);
      try {
        setUploadSuccessMessage(`Uploading "${file.name}" to LUNA vault...`);
        await api.uploadDocument(file);
        setUploadSuccessMessage(`"${file.name}" uploaded and indexed successfully in vault!`);
        setTimeout(() => setUploadSuccessMessage(null), 5000);
        await fetchDocuments();
      } catch (err: any) {
        const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to upload document';
        setError(`Upload failed: ${errorMsg}`);
        setTimeout(() => setError(null), 6000);
      }
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuDocId(null);
    // Optimistic removal; backend delete endpoint can be wired up later
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // ── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight">My Documents</h1>
        </div>
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-16 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <RefreshCw className="w-8 h-8 text-luna-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm text-luna-secondary font-medium">Loading documents from vault…</p>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight">My Documents</h1>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-10 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Backend Unreachable</h3>
          <p className="text-sm text-rose-700 max-w-sm mx-auto mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchDocuments}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header Section ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">
            My Documents
          </h1>
          <p className="text-sm text-luna-secondary mt-1 font-medium">
            Store, search and manage all your important paperwork.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDocuments}
            title="Refresh from backend"
            className="p-2.5 border border-luna-pearl-grey rounded-xl text-luna-secondary hover:text-luna-primary hover:bg-luna-ivory transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Upload Success Alert */}
      {uploadSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-luna-md flex items-center justify-between gap-2 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMessage}</span>
          </div>
          <button onClick={() => setUploadSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Filter & Search Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-luna-secondary">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-4 py-2 bg-luna-ivory/60 hover:bg-luna-ivory focus:bg-white text-sm text-luna-primary placeholder-luna-secondary border border-luna-pearl-grey rounded-luna-md focus:ring-2 focus:ring-luna-halo focus:border-luna-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-luna-ivory/60 hover:bg-luna-ivory text-xs sm:text-sm font-medium text-luna-primary border border-luna-pearl-grey rounded-luna-md focus:ring-2 focus:ring-luna-halo focus:outline-none cursor-pointer"
          >
            {documentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="flex items-center bg-luna-ivory/80 p-0.5 rounded-luna-md border border-luna-pearl-grey shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-luna-charcoal text-white shadow-xs' : 'text-luna-secondary hover:text-luna-primary'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-luna-charcoal text-white shadow-xs' : 'text-luna-secondary hover:text-luna-primary'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live backend badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Live — {documents.length} document{documents.length !== 1 ? 's' : ''} from backend vault
      </div>

      {/* ─── Document View Container ──────────────────────────────────────── */}
      {filteredDocs.length === 0 ? (
        <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey p-12 text-center shadow-luna-card">
          <div className="w-12 h-12 rounded-full bg-luna-ivory flex items-center justify-center mx-auto mb-3 text-luna-silver">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-luna-primary">No documents found</h3>
          <p className="text-sm text-luna-secondary max-w-sm mx-auto mt-1 mb-4">
            {documents.length === 0
              ? 'Your vault is empty. Upload a document to get started.'
              : `No documents match "${searchQuery}". Try clearing your filters.`}
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedType('All Types'); }}
            className="px-4 py-2 bg-luna-charcoal text-white text-xs font-medium rounded-luna-md hover:bg-luna-charcoal-light transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/documents/${doc.id}`)}
              className="group relative bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer flex flex-col justify-between hover:border-white"
            >
              {/* Context menu trigger */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id); }}
                  className="p-1 text-luna-silver hover:text-luna-primary rounded hover:bg-luna-ivory transition-colors"
                  aria-label="Document options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenuDocId === doc.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-44 bg-white border border-luna-pearl-grey rounded-luna-md shadow-luna-card py-1 text-xs text-luna-primary z-30 animate-in fade-in"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-luna-ivory text-left"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-luna-secondary" />
                      <span>Open Intelligence</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Document</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Document Visual Thumbnail */}
              <div className="w-full aspect-[4/3] bg-luna-ivory/60 rounded-luna-md border border-luna-pearl-grey/80 p-3 mb-3 flex flex-col justify-between group-hover:bg-luna-ivory transition-colors">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-luna-sm bg-white shadow-xs border border-luna-pearl-grey">
                    {getDocIcon(doc.documentType)}
                  </div>
                  <span className="text-[10px] font-mono text-luna-silver">
                    {doc.fileSize}
                  </span>
                </div>
                <div className="space-y-1.5 my-auto px-1 opacity-70">
                  <div className="h-1.5 bg-luna-silver/20 rounded w-4/5" />
                  <div className="h-1 bg-luna-silver/15 rounded w-full" />
                  <div className="h-1 bg-luna-silver/15 rounded w-3/4" />
                </div>
                <div className="text-[10px] text-luna-silver font-medium">
                  {doc.pageCount ? `${doc.pageCount} page(s)` : 'Verified vault'}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-luna-primary truncate group-hover:text-luna-accent transition-colors" title={doc.fileName}>
                  {doc.fileName}
                </h3>
                <p className="text-xs text-luna-secondary mt-0.5">{doc.formattedDate}</p>
                <div className="mt-2.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeStyle(doc.badgeVariant)}`}>
                    {doc.badgeLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-luna-ivory/80 text-xs font-semibold text-luna-secondary border-b border-luna-pearl-grey">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luna-pearl-grey/60">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="hover:bg-luna-ivory/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="p-1.5 rounded-luna-sm bg-luna-ivory border border-luna-pearl-grey shrink-0">
                      {getDocIcon(doc.documentType)}
                    </div>
                    <p className="font-medium text-luna-primary hover:text-luna-accent transition-colors">
                      {doc.fileName}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeStyle(doc.badgeVariant)}`}>
                      {doc.badgeLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-luna-secondary">{doc.formattedDate}</td>
                  <td className="py-3 px-4 text-xs text-luna-secondary">{doc.fileSize}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
                      className="px-3 py-1 bg-luna-ivory hover:bg-luna-charcoal hover:text-white border border-luna-pearl-grey rounded-luna-sm text-xs font-medium transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Upload Document Modal ─────────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey max-w-md w-full p-6 shadow-luna-card">
            <div className="flex items-center justify-between pb-3 border-b border-luna-pearl-grey">
              <h3 className="font-bold text-base text-luna-primary">Upload to Document Vault</h3>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="text-luna-silver hover:text-luna-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 border-2 border-dashed border-luna-silver/40 hover:border-luna-accent rounded-luna-md p-6 text-center cursor-pointer transition-colors bg-luna-ivory/40"
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              <UploadCloud className="w-8 h-8 text-luna-accent mx-auto mb-2" />
              <p className="text-sm font-semibold text-luna-primary">Click to browse or drop file here</p>
              <p className="text-xs text-luna-secondary mt-1">Supports PDF, JPG, PNG up to 20MB</p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary">
                Cancel
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-luna-accent hover:bg-luna-accent-hover text-white rounded-luna-md text-xs font-medium">
                Choose File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
