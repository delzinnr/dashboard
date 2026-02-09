
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, Search, Users } from 'lucide-react';
import { Cycle, Role, Timeframe } from '../types';
import { CycleModal } from './CycleModal';

interface CyclesViewProps {
  cycles: Cycle[];
  onAddCycle: (cycle: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>) => void;
  onDeleteCycle: (id: string) => void;
  userRole: Role;
}

export const CyclesView: React.FC<CyclesViewProps> = ({ cycles, onAddCycle, onDeleteCycle, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredCycles = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return cycles.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const cycleDate = parseDate(c.date);
      if (timeframe === 'daily') return cycleDate.getTime() === today.getTime();
      if (timeframe === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return cycleDate >= weekAgo;
      }
      if (timeframe === 'monthly') {
        return cycleDate.getMonth() === today.getMonth() && cycleDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }, [cycles, searchTerm, timeframe]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white">Operações <span className="text-zinc-600">Ativas</span></h1>
          <p className="text-zinc-500 text-sm mt-1">Gestão de entradas e saídas por ciclo de banca</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-[#111] p-1 rounded-xl border border-white/5">
            {['daily', 'weekly', 'monthly', 'all'].map((t) => (
              <button 
                key={t} 
                onClick={() => setTimeframe(t as Timeframe)} 
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${timeframe === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t === 'daily' ? 'Hoje' : t === 'weekly' ? 'Semana' : t === 'monthly' ? 'Mês' : 'Tudo'}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input 
                type="text" 
                placeholder="Buscar ciclo..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="bg-[#111] border border-white/5 rounded-xl py-3 pl-10 pr-6 text-xs text-white focus:outline-none focus:border-yellow-500/50 min-w-[200px]" 
              />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-8 py-3 bg-yellow-500 text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-400 shadow-xl shadow-yellow-500/10">
              <Plus size={18} /> Novo Ciclo
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Ciclo / Data</th>
                {userRole === 'admin' && <th className="px-8 py-6">Operador</th>}
                <th className="px-8 py-6">Investimento</th>
                <th className="px-8 py-6">Retorno Bruto</th>
                <th className="px-8 py-6">Lucro Operacional</th>
                <th className="px-8 py-6 text-yellow-500">Comissão</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCycles.length > 0 ? filteredCycles.map(cycle => (
                <tr key={cycle.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="px-10 py-7">
                    <p className="font-bold text-white text-sm">{cycle.name}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-1 flex items-center gap-1"><Calendar size={10} /> {cycle.date}</p>
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-8 py-7">
                      <span className="text-[10px] font-black text-zinc-400 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {cycle.operatorName}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-7 text-zinc-400 text-sm">{formatBRL(cycle.invested)}</td>
                  <td className="px-8 py-7 text-white font-bold text-sm">{formatBRL(cycle.return)}</td>
                  <td className="px-8 py-7">
                    <span className={`font-black text-sm ${cycle.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatBRL(cycle.profit)}
                    </span>
                  </td>
                  <td className="px-8 py-7 font-black text-sm text-yellow-500">{formatBRL(cycle.commissionValue)}</td>
                  <td className="px-10 py-7 text-right">
                    <button onClick={() => onDeleteCycle(cycle.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={userRole === 'admin' ? 7 : 6} className="px-10 py-20 text-center text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">
                    Nenhuma operação encontrada para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CycleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddCycle} />
    </div>
  );
};
