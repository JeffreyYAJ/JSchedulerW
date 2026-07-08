import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { exportPlanning, type ExportFormat } from '../lib/export';

interface ExportMenuProps {
  programmeId?: number;
  label?: string;
  className?: string;
  onError?: (message: string) => void;
}

const ExportMenu = ({ programmeId, label = 'Exporter', className = '', onError }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setLoading(format);
    setOpen(false);
    try {
      await exportPlanning(format, programmeId);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Erreur export');
    } finally {
      setLoading(null);
    }
  };

  const items: { format: ExportFormat; label: string; icon: typeof FileText }[] = [
    { format: 'csv', label: 'CSV', icon: Table },
    { format: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { format: 'pdf', label: 'PDF', icon: FileText },
  ];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!!loading}
        className="px-4 py-2.5 border border-slate-200 rounded-xl font-semibold flex items-center gap-2 hover:bg-white disabled:opacity-50"
      >
        <Download size={18} />
        {loading ? 'Export...' : label}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {items.map(({ format, label: itemLabel, icon: Icon }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <Icon size={16} className="text-slate-400" />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
