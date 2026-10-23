import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, MoreVertical, File } from 'lucide-react';
import { RecentDocumentItem } from '../types/api';

interface RecentDocumentsCardProps {
  documents: RecentDocumentItem[];
}

export const RecentDocumentsCard: React.FC<RecentDocumentsCardProps> = ({ documents }) => {
  const getBadgeStyle = (variant: RecentDocumentItem['badgeVariant']) => {
    switch (variant) {
      case 'lavender':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'coral':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-luna-pearl-grey/60 text-luna-secondary border-luna-pearl-grey';
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-md border border-white/90 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-luna-secondary" />
          <h3 className="font-semibold text-luna-primary text-base">Recent Documents</h3>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1 text-xs font-medium text-luna-accent hover:text-luna-accent-hover transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-luna-secondary">
          <div className="w-10 h-10 rounded-full bg-luna-ivory flex items-center justify-center mb-2">
            <File className="w-5 h-5 text-luna-silver" />
          </div>
          <p className="text-sm font-medium text-luna-primary">No documents yet</p>
          <p className="text-xs text-luna-silver mt-0.5">
            Uploaded warranties, invoices, and bills will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1 flex-1">
          {documents.slice(0, 4).map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center justify-between gap-3 p-2.5 rounded-luna-md hover:bg-luna-ivory/80 transition-colors border border-transparent hover:border-luna-pearl-grey"
            >
              {/* Document Icon & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-luna-sm bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-luna-primary truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-luna-secondary truncate">
                    {doc.formattedDate} {doc.fileSize && `· ${doc.fileSize}`}
                  </p>
                </div>
              </div>

              {/* Tag and Context Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getBadgeStyle(
                    doc.badgeVariant
                  )}`}
                >
                  {doc.badgeLabel}
                </span>
                <button
                  className="p-1 text-luna-silver hover:text-luna-primary rounded hover:bg-luna-pearl-grey/60 transition-colors"
                  aria-label={`Options for ${doc.fileName}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentDocumentsCard;
