
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { Cycle, Role } from '../types';
import { CycleModal } from './CycleModal';

interface CyclesViewProps {
  cycles: Cycle[];
  onAddCycle: (cycle: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => void;
  onDeleteCycle: (id: string) => void;
  userRole: Role;
}

export const CyclesView: React.FC<CyclesViewProps> = ({ cycles, onAddCycle, onDeleteCycle, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredCycles = useMemo(() => {
    return cycles.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [cycles, searchTerm]);

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setIsModalOpen(true);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Ciclos <span className="text-zinc-600">Bancários</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de Operações</p>
          </div>
          <button onClick={handleAddNew} className="flex lg:hidden items-center justify-center w-12 h-12 bg-yellow-500 text-black rounded-xl shadow-lg shadow-yellow-500/20">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Buscar ciclo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-yellow-500/50" />
          </div>
          <button onClick={handleAddNew} className="hidden lg:flex items-center justify-center gap-3 px-8 py-3.5 bg-yellow-500 text-black rounded-xl text-xs font-black uppercase hover:bg-yellow-400 transition-all active:scale-95">
            <Plus size={18} strokeWidth={3} /> Novo Ciclo
          </button>
        </div>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden lg:block bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Ciclo</th>
              <th className="px-8 py-6">Investimento</th>
              <th className="px-8 py-6">Retorno</th>
              <th className="px-8 py-6">Lucro Operador</th>
              <th className="px-8 py-6 text-yellow-500">Comissão Admin</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCycles.map(cycle => (
              <tr key={cycle.id} className="hover:bg-white/[0.02] group">
                <td className="px-8 py-6">
                  <p className="font-bold text-white text-sm">{cycle.name}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{cycle.date} • {cycle.operatorName}</p>
                </td>
                <td className="px-8 py-6 text-zinc-400 text-sm font-medium">{formatBRL(cycle.invested)}</td>
                <td className="px-8 py-6 text-white font-bold text-sm">{formatBRL(cycle.return)}</td>
                <td className={`px-8 py-6 font-black text-sm ${cycle.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatBRL(cycle.profit)}</td>
                <td className="px-8 py-6 font-black text-sm text-yellow-500">{formatBRL(cycle.commissionValue)}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(cycle)} className="p-2 text-zinc-700 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"><Edit3 size={18} /></button>
                    <button onClick={() => onDeleteCycle(cycle.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista Mobile em Cards */}
      <div className="lg:hidden space-y-4">
        {filteredCycles.length > 0 ? filteredCycles.map(cycle => (
          <div key={cycle.id} className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl relative shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-8">
                <h4 className="font-black text-sm text-white mb-0.5">{cycle.name}</h4>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{cycle.date} • {cycle.operatorName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(cycle)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Edit3 size={16} /></button>
                <button onClick={() => onDeleteCycle(cycle.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
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
