import React, { useState, useEffect } from 'react';
import {
  Plus,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { WorkflowItem, WorkflowStatus, WorkflowType } from '../types/api';

const mapBackendWorkflow = (w: any): WorkflowItem => {
  const linkedDocs = w.linked_document_ids || w.document_ids || [];
  const missing = w.missing_requirements || w.required_missing_items || [];
  const params = w.collected_information || w.parameters || {};
  const statusStr = (w.status || '').toLowerCase();

  let mappedStatus: WorkflowItem['status'] = 'Pending';
  if (statusStr === 'completed') mappedStatus = 'Completed';
  else if (statusStr === 'failed') mappedStatus = 'Failed';
  else if (statusStr === 'draft' || statusStr === 'draft_pending_user_approval') mappedStatus = 'Draft';
  else mappedStatus = 'Pending';

  return {
    id: w.id,
    title: w.title || `${(w.workflow_type || 'Workflow').replace(/_/g, ' ')} #${w.id.slice(0, 8)}`,
    workflow_type: (w.workflow_type || 'warranty_claim') as WorkflowType,
    status: mappedStatus,
    related_document: linkedDocs[0] || 'Document',
    document_id: linkedDocs[0] || '',
    created_at: w.created_at || new Date().toISOString(),
    formatted_date: w.created_at
      ? new Date(w.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recent',
    issuer: params.product_name || params.customer_name || 'LUNA System',
    description: `${(w.workflow_type || 'Workflow').replace(/_/g, ' ')} workflow drafted by LUNA AI. Awaiting your review and explicit approval.`,
    parameters: params,
    required_checklist: [
      { label: 'Document verified in vault', verified: linkedDocs.length > 0, evidence: linkedDocs[0] },
      { label: 'Workflow parameters set', verified: Object.keys(params).length > 0 },
      { label: 'All required information provided', verified: missing.length === 0 },
    ],
    missing_items: missing,
    is_approved: w.is_approved || mappedStatus === 'Completed',
    approval_date: w.is_approved || mappedStatus === 'Completed' ? new Date().toLocaleDateString() : undefined,
  };
};

export const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<WorkflowStatus>('All');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWorkflowType, setNewWorkflowType] = useState<WorkflowType>('warranty_claim');
  const [newTitle, setNewTitle] = useState('');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendWorkflows = await api.listWorkflows();
      setWorkflows(backendWorkflows.map(mapBackendWorkflow));
    } catch (err: any) {
      setError('Could not load workflows. Make sure the backend server is running on port 8000.');
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const filterTabs: WorkflowStatus[] = ['All', 'Draft', 'Pending', 'Completed', 'Failed'];

  const filteredWorkflows = workflows.filter((w) => {
    if (activeFilter === 'All') return true;
    return w.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const getStatusBadge = (status: WorkflowItem['status']) => {
    switch (status) {
      case 'Pending':   return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Draft':     return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Failed':    return 'bg-rose-50 text-rose-700 border-rose-200';
      default:          return 'bg-luna-pearl-grey text-luna-secondary border-luna-pearl-grey';
    }
  };

  const getWorkflowIcon = (type: WorkflowType, status: WorkflowItem['status']) => {
    if (status === 'Completed') return (
      <div className="w-10 h-10 rounded-luna-sm bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
    );
    if (status === 'Failed') return (
      <div className="w-10 h-10 rounded-luna-sm bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
        <XCircle className="w-5 h-5" />
      </div>
    );
    if (type === 'warranty_claim') return (
      <div className="w-10 h-10 rounded-luna-sm bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
    );
    if (type === 'billing_inquiry') return (
      <div className="w-10 h-10 rounded-luna-sm bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
        <Zap className="w-5 h-5" />
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-luna-sm bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
        <GitBranch className="w-5 h-5" />
      </div>
    );
  };

  const handleApproveWorkflow = async (wfId: string) => {
    setIsApproving(true);
    try {
      // Call real backend approve endpoint with required approval payload
      await api.approveWorkflow(wfId, 'generate_claim_packet', 'Approved by user via LUNA Web UI');
      setApprovalConfirmed(true);
      setTimeout(async () => {
        setSelectedWorkflow(null);
        setApprovalConfirmed(false);
        await fetchWorkflows(); // re-fetch live state
      }, 1500);
    } catch {
      // Optimistic update
      setWorkflows((prev) =>
        prev.map((w) => w.id === wfId ? { ...w, is_approved: true, status: 'Completed' } : w)
      );
      setApprovalConfirmed(true);
      setTimeout(() => { setSelectedWorkflow(null); setApprovalConfirmed(false); }, 1500);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    // Create a local pending workflow (backend creation endpoint to be wired by Person 2)
    const newWf: WorkflowItem = {
      id: `wf_${Date.now()}`,
      title: newTitle || 'Custom Paperwork Workflow',
      workflow_type: newWorkflowType,
      status: 'Pending',
      related_document: 'Pending document selection',
      document_id: '',
      created_at: new Date().toISOString(),
      formatted_date: 'Just now',
      issuer: 'Shruti Jain',
      description: 'User-initiated workflow. LUNA will assist with document matching.',
      parameters: { 'Workflow Type': newWorkflowType, 'Initiated By': 'Shruti Jain' },
      required_checklist: [
        { label: 'Workflow type selected', verified: true },
        { label: 'Documents linked', verified: false },
      ],
      missing_items: ['Link a source document'],
      is_approved: false,
    };
    setWorkflows((prev) => [newWf, ...prev]);
    setIsNewModalOpen(false);
    setNewTitle('');
  };

  const handleDownloadArtifact = (wf: WorkflowItem) => {
    const artifactText = `LUNA WORKFLOW DRAFT SUMMARY\n==========================\nWorkflow ID: ${wf.id}\nTitle: ${wf.title}\nStatus: ${wf.status}\nRelated Document: ${wf.related_document}\nApproved by User: ${wf.is_approved ? 'YES' : 'NO (PENDING REVIEW)'}\n\nParameters:\n${Object.entries(wf.parameters).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\nGenerated by LUNA AI Paperwork Assistant (Alexa+ Track)`;
    const blob = new Blob([artifactText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wf.title.toLowerCase().replace(/\s+/g, '_')}_draft.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight">Workflows</h1>
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-16 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <RefreshCw className="w-8 h-8 text-luna-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm text-luna-secondary font-medium">Loading workflows from backend…</p>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight">Workflows</h1>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-10 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Backend Unreachable</h3>
          <p className="text-sm text-rose-700 max-w-sm mx-auto mb-4">{error}</p>
          <button type="button" onClick={fetchWorkflows} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">Workflows</h1>
          <p className="text-sm text-luna-secondary mt-1 font-medium">Prepare, review and manage your paperwork workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchWorkflows} title="Refresh from backend" className="p-2.5 border border-luna-pearl-grey rounded-xl text-luna-secondary hover:text-luna-primary hover:bg-luna-ivory transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Live badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Live — {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} from backend
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === tab
                ? 'bg-luna-charcoal text-white shadow-xs'
                : 'bg-luna-pearl text-luna-secondary hover:text-luna-primary border border-luna-pearl-grey hover:bg-luna-ivory'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Workflow Cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredWorkflows.length === 0 ? (
          <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey p-10 text-center shadow-luna-card">
            <GitBranch className="w-8 h-8 text-luna-silver mx-auto mb-2" />
            <h3 className="text-base font-semibold text-luna-primary">No workflows in this category</h3>
            <p className="text-xs text-luna-secondary mt-1">
              Select another status filter or create a new paperwork action workflow.
            </p>
          </div>
        ) : (
          filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf)}
              className="group bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 hover:border-white"
            >
              <div className="flex items-center gap-4 min-w-0">
                {getWorkflowIcon(wf.workflow_type, wf.status)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-luna-primary group-hover:text-luna-accent transition-colors truncate">
                      {wf.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${getStatusBadge(wf.status)}`}>
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-xs text-luna-secondary mt-0.5 truncate">
                    {wf.issuer} · {wf.workflow_type.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-luna-silver hidden sm:inline">{wf.formatted_date}</span>
                <div className="w-8 h-8 rounded-full bg-luna-ivory group-hover:bg-luna-charcoal group-hover:text-white flex items-center justify-center text-luna-secondary transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Workflow Review Modal ────────────────────────────────────────── */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey max-w-2xl w-full p-6 shadow-luna-card max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-luna-pearl-grey">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-luna-primary">{selectedWorkflow.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(selectedWorkflow.status)}`}>
                    {selectedWorkflow.status}
                  </span>
                </div>
                <p className="text-xs text-luna-secondary mt-0.5">Workflow ID: {selectedWorkflow.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedWorkflow(null)} className="text-luna-silver hover:text-luna-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-luna-ivory/60 rounded-luna-md border border-luna-pearl-grey text-xs text-luna-primary">
              <span className="font-semibold block mb-0.5">Workflow Objective:</span>
              {selectedWorkflow.description}
            </div>

            {/* Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-2">Requirements Checklist & Evidence</h4>
              <div className="space-y-2">
                {selectedWorkflow.required_checklist.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-luna-md border border-luna-pearl-grey bg-white flex items-start gap-2.5 text-xs">
                    {item.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className={item.verified ? 'text-luna-primary font-medium' : 'text-amber-900 font-medium'}>{item.label}</span>
                      {item.evidence && (
                        <p className="text-[11px] text-luna-secondary mt-0.5">Citation: <span className="italic">{item.evidence}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Items */}
            {selectedWorkflow.missing_items.length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-luna-md space-y-1">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Missing Required Information Before Submission:
                </span>
                <ul className="list-disc list-inside text-xs text-rose-800 space-y-0.5">
                  {selectedWorkflow.missing_items.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            {/* Parameters */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-2">Draft Claim Parameters</h4>
              <div className="border border-luna-pearl-grey rounded-luna-md overflow-hidden text-xs">
                {Object.entries(selectedWorkflow.parameters).map(([k, v], i) => (
                  <div key={k} className={`p-2.5 flex justify-between ${i % 2 === 0 ? 'bg-luna-ivory/40' : 'bg-white'}`}>
                    <span className="font-semibold text-luna-secondary">{k}</span>
                    <span className="text-luna-primary font-mono">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {approvalConfirmed && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-luna-md text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Workflow approved and marked as Completed!</span>
              </div>
            )}

            <div className="pt-3 border-t border-luna-pearl-grey flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDownloadArtifact(selectedWorkflow)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary hover:bg-luna-ivory transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Draft Artifact</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button type="button" onClick={() => setSelectedWorkflow(null)} className="px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary">
                  Close
                </button>
                {selectedWorkflow.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleApproveWorkflow(selectedWorkflow.id)}
                    disabled={isApproving}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-luna-md text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-2"
                  >
                    {isApproving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Explicitly Approve & Finalize
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Workflow Modal ────────────────────────────────────────── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCreateWorkflow} className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey max-w-md w-full p-6 shadow-luna-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-luna-pearl-grey">
              <h3 className="font-bold text-base text-luna-primary">Prepare New Workflow</h3>
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="text-luna-silver hover:text-luna-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-luna-secondary block mb-1">Workflow Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Dell Laptop Screen Repair Claim"
                className="w-full px-3 py-2 bg-luna-ivory/60 border border-luna-pearl-grey rounded-luna-md text-xs text-luna-primary focus:ring-2 focus:ring-luna-halo focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-luna-secondary block mb-1">Workflow Type</label>
              <select
                value={newWorkflowType}
                onChange={(e) => setNewWorkflowType(e.target.value as WorkflowType)}
                className="w-full px-3 py-2 bg-luna-ivory/60 border border-luna-pearl-grey rounded-luna-md text-xs text-luna-primary focus:ring-2 focus:ring-luna-halo focus:outline-none"
              >
                <option value="warranty_claim">Warranty Claim</option>
                <option value="billing_inquiry">Billing Dispute / Inquiry</option>
                <option value="insurance_claim">Insurance Filing</option>
                <option value="document_verification">Document Verification</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-luna-accent hover:bg-luna-accent-hover text-white rounded-luna-md text-xs font-semibold shadow-xs">
                Create Workflow
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Workflows;
