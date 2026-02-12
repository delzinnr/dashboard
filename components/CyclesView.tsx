
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronUp
} from 'lucide-react';
import { Cycle, Role, Timeframe } from '../types';
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
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDeleteCycle(id);
      setDeletingId(null);
    }, 300);
  };

  const formatBRL = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const timeframeInfo = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  }, []);

  const filteredCycles = useMemo(() => {
    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    };
    const now = new Date();
    const todayStr = now.toLocaleDateString('pt-BR');
    const { startOfWeek, endOfWeek, startOfMonth, endOfMonth } = timeframeInfo;

    return cycles.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const cycleDate = parseDate(c.date);
      let matchTimeframe = true;
      if (timeframe === 'daily') matchTimeframe = c.date === todayStr;
      else if (timeframe === 'weekly') matchTimeframe = cycleDate >= startOfWeek && cycleDate <= endOfWeek;
      else if (timeframe === 'monthly') matchTimeframe = cycleDate >= startOfMonth && cycleDate <= endOfMonth;
      
      return matchSearch && matchTimeframe;
    });
  }, [cycles, searchTerm, timeframe, timeframeInfo]);

  return (
    <div className="space-y-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Livro de <span className="text-zinc-600">Ciclos</span></h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Registro de Fluxo Operacional</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1">
            {['daily', 'weekly', 'monthly', 'all'].map((id) => (
              <button
                key={id}
                onClick={() => setTimeframe(id as Timeframe)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeframe === id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-600 hover:text-white'
                }`}
              >
                {id === 'daily' ? 'Hoje' : id === 'weekly' ? 'Semana' : id === 'monthly' ? 'Mês' : 'Tudo'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { setEditingCycle(null); setIsModalOpen(true); }} 
            className="flex items-center justify-center w-14 h-14 bg-yellow-500 text-black rounded-2xl shadow-2xl shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="bg-[#0c0c0c] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-10 w-16 text-center">Sel</th>
                <th className="px-10 py-10">Operação</th>
                <th className="px-10 py-10">Total Entrada</th>
                <th className="px-10 py-10">Total Saída</th>
                <th className="px-10 py-10">Lucro Bruto</th>
                <th className="px-10 py-10 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCycles.map(cycle => (
                <tr 
                  key={cycle.id} 
                  className={`hover:bg-white/[0.01] transition-all duration-300 group ${deletingId === cycle.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                >
                  <td className="px-10 py-10 text-center">
                     <button onClick={() => setSelectedIds(prev => prev.includes(cycle.id) ? prev.filter(i => i !== cycle.id) : [...prev, cycle.id])} className="text-zinc-800 hover:text-yellow-500 transition-colors">
                       {selectedIds.includes(cycle.id) ? <CheckSquare size={22} className="text-yellow-500" /> : <Square size={22} />}
                     </button>
                  </td>
                  <td className="px-10 py-10">
                    <p className="font-black text-white text-lg group-hover:text-yellow-500 transition-colors">{cycle.name}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1.5">{cycle.date} • {cycle.operatorName}</p>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-base">
                      <ArrowDownLeft size={16} className="text-blue-500" />
                      {formatBRL(cycle.invested)}
                    </div>
                  </td>
                  <td className="px-10 py-10 text-white font-bold text-base">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={16} className="text-emerald-500" />
                      {formatBRL(cycle.return)}
                    </div>
                  </td>
                  <td className={`px-10 py-10 font-black text-lg ${cycle.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatBRL(cycle.profit)}
                  </td>
                  <td className="px-10 py-10 text-right">
                    <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingCycle(cycle); setIsModalOpen(true); }} className="p-3.5 bg-white/5 text-zinc-400 hover:text-blue-500 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(cycle.id)} className="p-3.5 bg-white/5 text-zinc-400 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/20"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCycles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <p className="text-zinc-700 text-[11px] font-black uppercase tracking-[0.5em]">Nenhum ciclo registrado neste período</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 w-14 h-14 bg-yellow-500 text-black rounded-full flex items-center justify-center shadow-2xl z-[90] animate-in zoom-in duration-300 hover:scale-110 active:scale-95"
        >
          <ChevronUp size={28} strokeWidth={3} />
        </button>
      )}

      {/* MODAL DE CICLO */}
      <CycleModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingCycle(null); 
        }} 
        onSave={(data) => {
          onAddCycle(data, editingCycle?.id);
          setIsModalOpen(false); // Fechar imediatamente
          setEditingCycle(null);
        }} 
        editingCycle={editingCycle} 
      />
    </div>
  );
};
