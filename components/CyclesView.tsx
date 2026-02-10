
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Edit3, CheckSquare, Square, X } from 'lucide-react';
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

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredCycles = useMemo(() => {
    return cycles.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [cycles, searchTerm]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCycles.length) setSelectedIds([]);
    else setSelectedIds(filteredCycles.map(c => c.id));
  };

  const handleBulkDelete = () => {
    onDeleteMultipleCycles(selectedIds);
    setSelectedIds([]);
  };

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteCycle(id);
  };

  const handleAddNew = () => {
    setEditingCycle(null);
    setIsModalOpen(true);
  };

  const handleSave = (data: any) => {
    onAddCycle(data, editingCycle?.id);
    setIsModalOpen(false);
    setEditingCycle(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Ciclos <span className="text-zinc-600">Bancários</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de Operações</p>
          </div>
          <button onClick={handleAddNew} className="flex lg:hidden items-center justify-center w-12 h-12 bg-yellow-500 text-black rounded-xl shadow-lg shadow-yellow-500/20 active:scale-90 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Buscar ciclo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-yellow-500/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddNew} className="hidden lg:flex items-center justify-center gap-3 px-8 py-3.5 bg-yellow-500 text-black rounded-xl text-xs font-black uppercase hover:bg-yellow-400 transition-all active:scale-95">
              <Plus size={18} strokeWidth={3} /> Novo Ciclo
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 p-3 px-6 rounded-2xl shadow-2xl flex items-center gap-6 z-[60] animate-in slide-in-from-bottom-4">
          <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">{selectedIds.length} selecionados</span>
          <div className="flex gap-2">
             <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-400 transition-colors">
               <Trash2 size={14} /> Excluir Todos
             </button>
             <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-500 hover:text-white transition-colors">
               <X size={16} />
             </button>
          </div>
        </div>
      )}

      {/* Tabela Desktop */}
      <div className="hidden lg:block bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-6 w-12 text-center">Sel</th>
              <th className="px-6 py-6">Ciclo</th>
              <th className="px-6 py-6">Investimento</th>
              <th className="px-6 py-6">Retorno</th>
              <th className="px-6 py-6">Lucro Operador</th>
              <th className="px-6 py-6 text-yellow-500">Comissão Admin</th>
              <th className="px-6 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCycles.map(cycle => (
              <tr key={cycle.id} className={`hover:bg-white/[0.02] transition-colors ${selectedIds.includes(cycle.id) ? 'bg-yellow-500/[0.03]' : ''}`}>
                <td className="px-6 py-6 text-center">
                   <button onClick={() => handleToggleSelect(cycle.id)} className="text-zinc-700 hover:text-yellow-500 p-1 transition-colors">
                     {selectedIds.includes(cycle.id) ? <CheckSquare size={18} className="text-yellow-500" /> : <Square size={18} />}
                   </button>
                </td>
                <td className="px-6 py-6">
                  <p className="font-bold text-white text-sm">{cycle.name}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{cycle.date} • {cycle.operatorName}</p>
                </td>
                <td className="px-6 py-6 text-zinc-400 text-sm font-medium">{formatBRL(cycle.invested)}</td>
                <td className="px-6 py-6 text-white font-bold text-sm">{formatBRL(cycle.return)}</td>
                <td className={`px-6 py-6 font-black text-sm ${cycle.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatBRL(cycle.profit)}</td>
                <td className="px-6 py-6 font-black text-sm text-yellow-500">{formatBRL(cycle.commissionValue)}</td>
                <td className="px-6 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(cycle)} className="p-2.5 bg-blue-500/5 text-blue-500 hover:bg-blue-500/20 rounded-xl transition-all" title="Editar"><Edit3 size={18} /></button>
                    <button onClick={(e) => handleDeleteClick(e, cycle.id)} className="p-2.5 bg-red-500/5 text-red-500 hover:bg-red-500/20 rounded-xl transition-all" title="Excluir"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredCycles.length > 0 ? filteredCycles.map(cycle => (
          <div 
            key={cycle.id} 
            className={`bg-[#0c0c0c] border p-5 rounded-2xl relative shadow-xl transition-all ${selectedIds.includes(cycle.id) ? 'border-yellow-500/50 bg-yellow-500/[0.02]' : 'border-white/5'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <h4 className="font-black text-sm text-white mb-0.5">{cycle.name}</h4>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{cycle.date} • {cycle.operatorName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleSelect(cycle.id)} 
                  className={`p-2.5 rounded-lg transition-colors ${selectedIds.includes(cycle.id) ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-700 bg-white/5'}`}
                >
                  {selectedIds.includes(cycle.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <button onClick={() => handleEdit(cycle)} className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg active:scale-90 transition-transform"><Edit3 size={18} /></button>
                <button onClick={(e) => handleDeleteClick(e, cycle.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-lg active:scale-90 transition-transform"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 flex items-center gap-1"><TrendingDown size={8} className="text-red-500"/> Investido</p>
                <p className="text-xs font-bold text-zinc-400">{formatBRL(cycle.invested)}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 flex items-center gap-1"><TrendingUp size={8} className="text-green-500"/> Retorno</p>
                <p className="text-xs font-bold text-white">{formatBRL(cycle.return)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div>
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5">Lucro Operador</p>
                <p className={`text-sm font-black ${cycle.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatBRL(cycle.profit)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5 text-yellow-500">Comissão Admin</p>
                <p className="text-sm font-black text-yellow-500">{formatBRL(cycle.commissionValue)}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-[#0c0c0c] rounded-[2rem] border border-dashed border-white/5">
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Sem ciclos cadastrados</p>
          </div>
        )}
      </div>

      <CycleModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingCycle(null); }} 
        onSave={handleSave} 
        editingCycle={editingCycle}
      />
    </div>
  );
};
