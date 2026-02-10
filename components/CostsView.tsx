
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Smartphone, 
  Globe, 
  Settings, 
  Hammer, 
  Search, 
  Calendar, 
  Filter,
  User as UserIcon,
  Users,
  X,
  Receipt
} from 'lucide-react';
import { Cost, Role, CostType } from '../types';

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
  const [categoryFilter, setCategoryFilter] = useState<CostType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = userRole === 'admin';
  
  // Formatação estrita
  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
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

  const processedCosts = useMemo(() => {
    const filtered = costs.filter(cost => {
      const matchSearch = cost.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || cost.type === categoryFilter;
      
      const [d, m, y] = cost.date.split('/').map(Number);
      const costTime = new Date(y, m - 1, d).getTime();
      
      const matchStart = !startDate || costTime >= new Date(startDate).getTime();
      const matchEnd = !endDate || costTime <= new Date(endDate).getTime();

      return matchSearch && matchCategory && matchStart && matchEnd;
    });

    const currentUserStr = localStorage.getItem('fm_current_user') || sessionStorage.getItem('fm_current_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};
    
    return {
      personal: filtered.filter(c => c.operatorId === currentUser.id),
      team: filtered.filter(c => c.operatorId !== currentUser.id)
    };
  }, [costs, searchTerm, categoryFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const renderCostList = (items: Cost[], title: string, icon: React.ReactNode, colorClass: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>{icon}</div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
          <div className="flex-1 h-px bg-white/5 ml-2"></div>
          <span className="text-[10px] font-black text-zinc-700">{items.length} ITENS</span>
        </div>

        <div className="hidden lg:block bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Categoria</th>
                {isAdmin && title.includes('Equipe') && <th className="px-8 py-5">Operador</th>}
                <th className="px-8 py-5 text-red-500">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map(cost => (
                <tr key={cost.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-white text-sm">{cost.name}</p>
                    <p className="text-[10px] text-zinc-600 font-bold">{cost.date}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black text-zinc-500 uppercase flex items-center gap-2 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                      {getIcon(cost.type)} {cost.type}
                    </span>
                  </td>
                  {isAdmin && title.includes('Equipe') && (
                    <td className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase">{cost.operatorName}</td>
                  )}
                  <td className="px-8 py-5 font-black text-sm text-red-500">-{formatBRL(cost.amount)}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => onDeleteCost(cost.id)} className="p-2.5 bg-red-500/5 text-red-500/40 group-hover:text-red-500 group-hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-3">
          {items.map(cost => (
            <div key={cost.id} className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5">{getIcon(cost.type)}</div>
                <div>
                  <p className="font-bold text-sm text-white">{cost.name}</p>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{cost.date} {isAdmin && `• ${cost.operatorName}`}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-black text-red-500">-{formatBRL(cost.amount)}</p>
                <button onClick={() => onDeleteCost(cost.id)} className="p-1.5 text-zinc-700 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Despesas <span className="text-zinc-600">Gerais</span></h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de Fluxo de Caixa</p>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-zinc-400 border-white/5'}`}
            >
              <Filter size={20} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/20">
              <Plus size={18} strokeWidth={3} /> <span className="hidden md:inline">Novo Gasto</span>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2rem] animate-in slide-in-from-top-4 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Buscar por Nome</label>
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Ex: Proxy..." 
                  className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Categoria</label>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-white/20 appearance-none"
              >
                <option value="all">Todas as Categorias</option>
                <option value="sms">SMS</option>
                <option value="proxy">Proxy</option>
                <option value="ferramenta">Ferramentas</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-white/20 color-scheme-dark"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Até</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-white/20 color-scheme-dark"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button onClick={clearFilters} className="text-[9px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2">
              <X size={12} /> Limpar Todos os Filtros
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {renderCostList(processedCosts.personal, "Minhas Despesas", <UserIcon size={14} />, "text-blue-500")}
        {isAdmin && renderCostList(processedCosts.team, "Despesas da Equipe", <Users size={14} />, "text-purple-500")}

        {processedCosts.personal.length === 0 && processedCosts.team.length === 0 && (
          <div className="text-center py-32 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-800">
              <Receipt size={24} />
            </div>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Nenhuma despesa encontrada para os filtros aplicados</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0a0a0a] w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] border border-white/10 p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Lançar <span className="text-red-500">Despesa</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); onAddCost(newCost); setIsModalOpen(false); }} className="space-y-8 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição do Gasto</label>
                <input type="text" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 transition-all font-bold" value={newCost.name} onChange={e => setNewCost({...newCost, name: e.target.value})} required placeholder="Ex: Proxy Semanal" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valor Unitário (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-red-500/30 transition-all font-black" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: Number(e.target.value)})} required />
                </div>
              </div>
              
              <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5">
                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-3">Resumo do Lançamento</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Total a ser deduzido:</span>
                  <span className="text-xl font-black text-red-500">-{formatBRL(newCost.amount)}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-zinc-600 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">Gravar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
