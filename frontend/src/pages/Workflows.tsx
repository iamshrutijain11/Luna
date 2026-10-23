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
} from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';
import { api } from '../lib/api';
import { WorkflowItem, WorkflowStatus, WorkflowType } from '../types/api';

export const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(vaultStore.getState().workflows);
  const [activeFilter, setActiveFilter] = useState<WorkflowStatus>('All');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newWorkflowType, setNewWorkflowType] = useState<WorkflowType>('warranty_claim');
  const [newTitle, setNewTitle] = useState('');
  const [newDocId, setNewDocId] = useState('doc_inv_101');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  useEffect(() => {
    const syncBackend = async () => {
      try {
        const backendWorkflows = await api.listWorkflows();
        if (backendWorkflows && backendWorkflows.length > 0) {
          const mapped: WorkflowItem[] = backendWorkflows.map((w: any) => ({
            id: w.id,
            title: w.title,
            workflow_type: w.workflow_type || 'warranty_claim',
            status: (w.status === 'COMPLETED' ? 'Completed' : 'Draft') as any,
            related_document: 'Dell XPS 15 Invoice',
            document_id: (w.document_ids && w.document_ids[0]) || 'doc_inv_101',
            created_at: w.created_at || new Date().toISOString(),
            formatted_date: 'Active workflow',
            issuer: 'Dell Technologies Direct Inc.',
            description: 'Automated claim drafted and awaiting user review.',
            parameters: w.parameters || {},
            required_checklist: [
              { label: 'Purchase invoice verified', verified: true, evidence: 'INV-2025-883' },
              { label: 'Serial number verified', verified: true, evidence: 'SN-DELL-98721X' },
              { label: 'Defect details provided', verified: !w.required_missing_items || w.required_missing_items.length === 0 },
            ],
            missing_items: w.required_missing_items || [],
            is_approved: w.is_approved || false,
            approval_date: w.is_approved ? new Date().toLocaleDateString() : undefined,
          }));
          setWorkflows(mapped);
        }
      } catch {
        // Fallback to local store
      }
    };
    syncBackend();

    const unsub = vaultStore.subscribe(() => {
      setWorkflows([...vaultStore.getState().workflows]);
    });
    return unsub;
  }, []);

  const filterTabs: WorkflowStatus[] = ['All', 'Draft', 'Pending', 'Completed', 'Failed'];

  const filteredWorkflows = workflows.filter((w) => {
    if (activeFilter === 'All') return true;
    return w.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const getStatusBadge = (status: WorkflowItem['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-luna-pearl-grey text-luna-secondary border-luna-pearl-grey';
    }
  };

  const getWorkflowIcon = (type: WorkflowType, status: WorkflowItem['status']) => {
    if (status === 'Completed') {
      return (
        <div className="w-10 h-10 rounded-luna-sm bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (status === 'Failed') {
      return (
        <div className="w-10 h-10 rounded-luna-sm bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'warranty_claim') {
      return (
        <div className="w-10 h-10 rounded-luna-sm bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      );
    }
    if (type === 'billing_inquiry') {
      return (
        <div className="w-10 h-10 rounded-luna-sm bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-luna-sm bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
        <GitBranch className="w-5 h-5" />
      </div>
    );
  };

  const handleApproveWorkflow = (wfId: string) => {
    vaultStore.approveWorkflow(wfId);
    setApprovalConfirmed(true);
    setTimeout(() => {
      setSelectedWorkflow(null);
      setApprovalConfirmed(false);
    }, 1500);
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = vaultStore.getState().documents.find((d) => d.id === newDocId);
    const newWf: WorkflowItem = {
      id: `wf_${Date.now()}`,
      title: newTitle || 'Custom Paperwork Workflow',
      workflow_type: newWorkflowType,
      status: 'Pending',
      related_document: doc?.fileName || 'Document.pdf',
      document_id: newDocId,
      created_at: new Date().toISOString(),
      formatted_date: 'Just now',
      issuer: 'User Vault',
      description: 'User-created paperwork action workflow.',
      parameters: {
        'Target Document': doc?.fileName || 'Document.pdf',
        'Initiated By': 'Shruti Jain',
      },
      required_checklist: [
        { label: 'Document verified in vault', verified: true },
        { label: 'Action parameters submitted', verified: true },
      ],
      missing_items: [],
      is_approved: false,
    };

    vaultStore.getState().workflows.unshift(newWf);
    vaultStore.loadReferenceData(); // notify store
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── Header Section (Matching Screen 5) ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-luna-primary tracking-tight font-sans">
            Workflows
          </h1>
          <p className="text-sm text-luna-secondary mt-1 font-medium">
            Prepare, review and manage your paperwork workflows.
          </p>
        </div>

        <div>
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

      {/* ─── Filter Tabs (All, Draft, Pending, Completed, Failed) ─────────── */}
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

      {/* ─── Workflow Cards List (Matching Screen 5 Right) ───────────────── */}
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
              {/* Left Icon & Meta */}
              <div className="flex items-center gap-4 min-w-0">
                {getWorkflowIcon(wf.workflow_type, wf.status)}

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-luna-primary group-hover:text-luna-accent transition-colors truncate">
                      {wf.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${getStatusBadge(
                        wf.status
                      )}`}
                    >
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-xs text-luna-secondary mt-0.5 truncate">
                    {wf.related_document} • {wf.issuer}
                  </p>
                </div>
              </div>

              {/* Right: Date & Chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-luna-silver hidden sm:inline">
                  {wf.formatted_date}
                </span>
                <div className="w-8 h-8 rounded-full bg-luna-ivory group-hover:bg-luna-charcoal group-hover:text-white flex items-center justify-center text-luna-secondary transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Workflow Review & Approval Modal ─────────────────────────────── */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey max-w-2xl w-full p-6 shadow-luna-card max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-luna-pearl-grey">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-luna-primary">
                    {selectedWorkflow.title}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                      selectedWorkflow.status
                    )}`}
                  >
                    {selectedWorkflow.status}
                  </span>
                </div>
                <p className="text-xs text-luna-secondary mt-0.5">
                  Associated with {selectedWorkflow.related_document}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkflow(null)}
                className="text-luna-silver hover:text-luna-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="p-3 bg-luna-ivory/60 rounded-luna-md border border-luna-pearl-grey text-xs text-luna-primary">
              <span className="font-semibold block mb-0.5">Workflow Objective:</span>
              {selectedWorkflow.description}
            </div>

            {/* Checklist of Verified Conditions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-2">
                Requirements Checklist & Evidence
              </h4>
              <div className="space-y-2">
                {selectedWorkflow.required_checklist.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-luna-md border border-luna-pearl-grey bg-white flex items-start gap-2.5 text-xs"
                  >
                    {item.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className={item.verified ? 'text-luna-primary font-medium' : 'text-amber-900 font-medium'}>
                        {item.label}
                      </span>
                      {item.evidence && (
                        <p className="text-[11px] text-luna-secondary mt-0.5">
                          Citation evidence: <span className="italic">{item.evidence}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Information Alert if any */}
            {selectedWorkflow.missing_items.length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-luna-md space-y-1">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Missing Required Information Before Submission:
                </span>
                <ul className="list-disc list-inside text-xs text-rose-800 space-y-0.5">
                  {selectedWorkflow.missing_items.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parameters Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-luna-secondary mb-2">
                Draft Claim Parameters
              </h4>
              <div className="border border-luna-pearl-grey rounded-luna-md overflow-hidden text-xs">
                {Object.entries(selectedWorkflow.parameters).map(([k, v], i) => (
                  <div
                    key={k}
                    className={`p-2.5 flex justify-between ${
                      i % 2 === 0 ? 'bg-luna-ivory/40' : 'bg-white'
                    }`}
                  >
                    <span className="font-semibold text-luna-secondary">{k}</span>
                    <span className="text-luna-primary font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Notification */}
            {approvalConfirmed && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-luna-md text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Workflow approved and marked as Completed!</span>
              </div>
            )}

            {/* Consequential Action Safeguard & Buttons */}
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
                <button
                  type="button"
                  onClick={() => setSelectedWorkflow(null)}
                  className="px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary"
                >
                  Close
                </button>
                {selectedWorkflow.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleApproveWorkflow(selectedWorkflow.id)}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-luna-md text-xs font-semibold shadow-sm transition-colors"
                  >
                    Explicitly Approve & Finalize
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create New Workflow Modal ────────────────────────────────────── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateWorkflow}
            className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey max-w-md w-full p-6 shadow-luna-card space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-luna-pearl-grey">
              <h3 className="font-bold text-base text-luna-primary">Prepare New Workflow</h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-luna-silver hover:text-luna-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-luna-secondary block mb-1">
                Workflow Title
              </label>
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
              <label className="text-xs font-semibold text-luna-secondary block mb-1">
                Workflow Type
              </label>
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

            <div>
              <label className="text-xs font-semibold text-luna-secondary block mb-1">
                Source Document
              </label>
              <select
                value={newDocId}
                onChange={(e) => setNewDocId(e.target.value)}
                className="w-full px-3 py-2 bg-luna-ivory/60 border border-luna-pearl-grey rounded-luna-md text-xs text-luna-primary focus:ring-2 focus:ring-luna-halo focus:outline-none"
              >
                {vaultStore.getState().documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName} ({d.badgeLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 border border-luna-pearl-grey rounded-luna-md text-xs font-medium text-luna-secondary hover:text-luna-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-luna-accent hover:bg-luna-accent-hover text-white rounded-luna-md text-xs font-semibold shadow-xs"
              >
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
