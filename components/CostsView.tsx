
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Smartphone, 
  Globe, 
  Settings, 
  Hammer, 
  Search, 
  User as UserIcon,
  Users,
  X,
  ChevronUp
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const isAdmin = userRole === 'admin';
  
  const formatBRL = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const getIcon = (type: CostType) => {
    switch(type) {
      case 'sms': return <Smartphone size={16} />;
      case 'proxy': return <Globe size={16} />;
      case 'ferramenta': return <Hammer size={16} />;
      default: return <Settings size={16} />;
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDeleteCost(id);
      setDeletingId(null);
    }, 300);
  };

  const filteredCosts = useMemo(() => {
    return costs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [costs, searchTerm]);

  const renderTable = (items: Cost[], title: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="p-1.5 rounded-lg bg-white/5 text-zinc-400">{icon}</div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
        </div>
        <div className="bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Categoria</th>
                {isAdmin && <th className="px-8 py-5">Responsável</th>}
                <th className="px-8 py-5 text-red-500">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map(cost => (
                <tr 
                  key={cost.id} 
                  className={`hover:bg-white/[0.02] transition-all duration-300 ${deletingId === cost.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                >
                  <td className="px-8 py-5">
                    <p className="font-bold text-white text-sm">{cost.name}</p>
                    <p className="text-[10px] text-zinc-600 font-bold">{cost.date}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                      {getIcon(cost.type)} {cost.type}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px]">{cost.operatorName?.charAt(0)}</div>
                        {cost.operatorName}
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-5 font-black text-sm text-red-500">-{formatBRL(cost.amount)}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleDelete(cost.id)} className="p-2.5 bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 relative min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Despesas <span className="text-zinc-600">Operacionais</span></h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Controle de Custos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-3 px-8 py-3.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase hover:bg-red-400 transition-all shadow-lg shadow-red-500/20">
          <Plus size={18} strokeWidth={3} /> Novo Gasto
        </button>
      </div>

      <div className="space-y-12">
        {renderTable(filteredCosts, "Histórico de Custos", <Users size={14}/>)}
      </div>

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-24 lg:bottom-10 right-4 lg:right-10 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl z-[90] animate-in zoom-in duration-300 hover:scale-110 active:scale-95"
        >
          <ChevronUp size={24} strokeWidth={3} />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Lançar <span className="text-red-500">Gasto</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); onAddCost(newCost); setIsModalOpen(false); }} className="space-y-6">
              <input type="text" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 font-bold" value={newCost.name} onChange={e => setNewCost({...newCost, name: e.target.value})} required placeholder="Descrição" />
              <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 font-black" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: Number(e.target.value)})} required placeholder="Valor R$" />
              <select className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none" value={newCost.type} onChange={e => setNewCost({...newCost, type: e.target.value as CostType})}>
                <option value="sms">SMS</option>
                <option value="proxy">Proxy</option>
                <option value="ferramenta">Ferramenta</option>
                <option value="outros">Outros</option>
              </select>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Confirmar Lançamento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
