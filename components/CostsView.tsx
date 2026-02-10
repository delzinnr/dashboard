
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Smartphone, Globe, Settings, Hammer, Receipt } from 'lucide-react';
import { Cost, Role, CostType, Timeframe } from '../types';

interface CostsViewProps {
  costs: Cost[];
  onAddCost: (cost: Omit<Cost, 'id' | 'operatorId' | 'operatorName' | 'ownerAdminId'>) => void;
  onDeleteCost: (id: string) => void;
  userRole: Role;
}

export const CostsView: React.FC<CostsViewProps> = ({ costs, onAddCost, onDeleteCost, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ name: '', amount: 0, type: 'sms' as CostType, date: new Date().toLocaleDateString('pt-BR') });

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getIcon = (type: CostType) => {
    switch(type) {
      case 'sms': return <Smartphone size={16} />;
      case 'proxy': return <Globe size={16} />;
      case 'ferramenta': return <Hammer size={16} />;
      default: return <Settings size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Despesas <span className="text-zinc-600">Gerais</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Fluxo de Caixa</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="lg:hidden w-12 h-12 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center active:scale-90 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="hidden lg:flex items-center justify-center gap-3 px-8 py-3.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase hover:bg-red-400 transition-all active:scale-95 w-fit">
          <Plus size={18} strokeWidth={3} /> Novo Gasto
        </button>
      </div>

      {/* Mobile Costs Cards */}
      <div className="lg:hidden space-y-3">
        {costs.length > 0 ? costs.map(cost => (
          <div key={cost.id} className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5">{getIcon(cost.type)}</div>
              <div>
                <p className="font-bold text-sm text-white">{cost.name}</p>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{cost.date} • {cost.operatorName}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-black text-red-500">-{formatBRL(cost.amount)}</p>
              <button 
                onClick={() => onDeleteCost(cost.id)} 
                className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-lg border border-red-500/20 active:bg-red-500 active:text-white transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        )) : <div className="text-center py-20 text-zinc-800 font-black uppercase text-[10px]">Sem despesas</div>}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Descrição</th>
              <th className="px-8 py-6">Categoria</th>
              <th className="px-8 py-6">Operador</th>
              <th className="px-8 py-6 text-red-500">Valor</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {costs.map(cost => (
              <tr key={cost.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <p className="font-bold text-white text-sm">{cost.name}</p>
                  <p className="text-[10px] text-zinc-600 font-bold">{cost.date}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                    {getIcon(cost.type)} {cost.type}
                  </span>
                </td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase">{cost.operatorName}</td>
                <td className="px-8 py-6 font-black text-sm text-red-500">-{formatBRL(cost.amount)}</td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => onDeleteCost(cost.id)} className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0a0a0a] w-full h-full md:h-auto md:max-w-md md:rounded-[2rem] border-white/10 p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-[0.2em]">Lançar <span className="text-red-500">Despesa</span></h2>
            <form onSubmit={e => { e.preventDefault(); onAddCost(newCost); setIsModalOpen(false); }} className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                <input type="text" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 transition-all" value={newCost.name} onChange={e => setNewCost({...newCost, name: e.target.value})} required placeholder="Ex: Proxy Semanal" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-xs text-white outline-none focus:border-red-500/30 transition-all appearance-none" value={newCost.type} onChange={e => setNewCost({...newCost, type: e.target.value as CostType})}>
                    <option value="sms">SMS</option>
                    <option value="proxy">Proxy</option>
                    <option value="ferramenta">Ferramenta</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 transition-all" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: Number(e.target.value)})} required />
                </div>
              </div>
              <div className="flex gap-4 pt-10 mt-auto md:mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-zinc-600">Cancelar</button>
                <button type="submit" className="flex-1 bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">Lançar Agora</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
