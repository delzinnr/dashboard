
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Edit3, CheckSquare, Square, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Cycle, Role } from '../types';
import { CycleModal } from './CycleModal';

interface CyclesViewProps {
  cycles: Cycle[];
  onAddCycle: (cycle: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => void;
  onDeleteCycle: (id: string) => void;
  onDeleteMultipleCycles: (ids: string[]) => void;
  userRole: Role;
}

export const CyclesView: React.FC<CyclesViewProps> = ({ cycles, onAddCycle, onDeleteCycle, onDeleteMultipleCycles, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Formatação estrita
  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const filteredCycles = useMemo(() => {
    return cycles.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [cycles, searchTerm]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    onDeleteMultipleCycles(selectedIds);
    setSelectedIds([]);
  };

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Livro de <span className="text-zinc-600">Ciclos</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Registros Operacionais Brutos</p>
          </div>
          <button onClick={() => { setEditingCycle(null); setIsModalOpen(true); }} className="flex lg:hidden items-center justify-center w-12 h-12 bg-yellow-500 text-black rounded-xl shadow-lg active:scale-90 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Filtrar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-yellow-500/50" />
          </div>
          <button onClick={() => { setEditingCycle(null); setIsModalOpen(true); }} className="hidden lg:flex items-center justify-center gap-3 px-10 py-4 bg-yellow-500 text-black rounded-2xl text-[11px] font-black uppercase hover:bg-yellow-400 transition-all active:scale-95 shadow-xl shadow-yellow-500/10">
            <Plus size={18} strokeWidth={3} /> Novo Registro
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 lg:bottom-12 left-1/2 -translate-x-1/2 bg-[#111] border border-white/10 p-4 px-8 rounded-3xl shadow-2xl flex items-center gap-8 z-[60] animate-in slide-in-from-bottom-4">
          <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">{selectedIds.length} selecionados</span>
          <div className="flex gap-3">
             <button onClick={handleBulkDelete} className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-400 transition-colors">
               <Trash2 size={14} /> Excluir permanentemente
             </button>
             <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-500 hover:text-white transition-colors">
               <X size={18} />
             </button>
          </div>
        </div>
      )}

      {/* Tabela Desktop */}
      <div className="hidden lg:block bg-[#0c0c0c] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-8 w-12 text-center">Sel</th>
              <th className="px-8 py-8">Operação</th>
              <th className="px-8 py-8">Total Entrada</th>
              <th className="px-8 py-8">Total Saída</th>
              <th className="px-8 py-8">Lucro Bruto (Banca)</th>
              <th className="px-8 py-8 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCycles.map(cycle => (
              <tr key={cycle.id} className={`hover:bg-white/[0.01] transition-colors ${selectedIds.includes(cycle.id) ? 'bg-yellow-500/[0.02]' : ''}`}>
                <td className="px-8 py-8 text-center">
                   <button onClick={() => handleToggleSelect(cycle.id)} className="text-zinc-800 hover:text-yellow-500 transition-colors">
                     {selectedIds.includes(cycle.id) ? <CheckSquare size={20} className="text-yellow-500" /> : <Square size={20} />}
                   </button>
                </td>
                <td className="px-8 py-8">
                  <p className="font-black text-white text-base">{cycle.name}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-0.5">{cycle.date} • {cycle.operatorName}</p>
                </td>
                <td className="px-8 py-8">
                  <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                    <ArrowDownLeft size={14} className="text-blue-500" />
                    {formatBRL(cycle.invested)}
                  </div>
                </td>
                <td className="px-8 py-8 text-white font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-emerald-500" />
                    {formatBRL(cycle.return)}
                  </div>
                </td>
                <td className={`px-8 py-8 font-black text-base ${cycle.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatBRL(cycle.profit)}
                </td>
                <td className="px-8 py-8 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => handleEdit(cycle)} className="p-3 bg-white/5 text-zinc-400 hover:text-blue-500 rounded-2xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => onDeleteCycle(cycle.id)} className="p-3 bg-white/5 text-zinc-400 hover:text-red-500 rounded-2xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-4">
        {filteredCycles.map(cycle => (
          <div key={cycle.id} className="bg-[#0c0c0c] border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-black text-white text-base leading-none mb-1">{cycle.name}</h4>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{cycle.date}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(cycle)} className="p-3 bg-white/5 text-blue-500 rounded-xl"><Edit3 size={16}/></button>
                <button onClick={() => onDeleteCycle(cycle.id)} className="p-3 bg-white/5 text-red-500 rounded-xl"><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-black/50 p-4 rounded-2xl">
                 <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Entrada</p>
                 <p className="text-xs font-bold text-zinc-400">{formatBRL(cycle.invested)}</p>
               </div>
               <div className="bg-black/50 p-4 rounded-2xl">
                 <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Saída</p>
                 <p className="text-xs font-bold text-white">{formatBRL(cycle.return)}</p>
               </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lucro Bruto</p>
               <p className={`text-lg font-black ${cycle.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatBRL(cycle.profit)}</p>
            </div>
          </div>
        ))}
      </div>

      <CycleModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCycle(null); }} onSave={(data) => onAddCycle(data, editingCycle?.id)} editingCycle={editingCycle} />
    </div>
  );
};
