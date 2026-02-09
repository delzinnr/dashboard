
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Receipt, 
  Smartphone, 
  Globe, 
  Settings, 
  Hammer, 
  PieChart as PieChartIcon, 
  Users as UsersIcon,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Cost, Role, CostType, Timeframe } from '../types';

interface CostsViewProps {
  costs: Cost[];
  onAddCost: (cost: Omit<Cost, 'id' | 'operatorId' | 'operatorName'>) => void;
  onDeleteCost: (id: string) => void;
  userRole: Role;
}

export const CostsView: React.FC<CostsViewProps> = ({ costs, onAddCost, onDeleteCost, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [newCost, setNewCost] = useState({
    name: '',
    amount: 0,
    type: 'sms' as CostType,
    date: new Date().toLocaleDateString('pt-BR')
  });

  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredCosts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return costs.filter(c => {
      const costDate = parseDate(c.date);
      if (timeframe === 'daily') return costDate.getTime() === today.getTime();
      if (timeframe === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return costDate >= weekAgo;
      }
      if (timeframe === 'monthly') return costDate.getMonth() === today.getMonth() && costDate.getFullYear() === today.getFullYear();
      return true;
    });
  }, [costs, timeframe]);

  const categoryData = useMemo(() => {
    const types: Record<string, number> = {};
    filteredCosts.forEach(c => {
      types[c.type] = (types[c.type] || 0) + c.amount;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filteredCosts]);

  const operatorData = useMemo(() => {
    const ops: Record<string, number> = {};
    filteredCosts.forEach(c => {
      ops[c.operatorName] = (ops[c.operatorName] || 0) + c.amount;
    });
    return Object.entries(ops).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filteredCosts]);

  const COLORS = ['#ef4444', '#3b82f6', '#a855f7', '#eab308', '#22c55e'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCost(newCost);
    setIsModalOpen(false);
    setNewCost({ name: '', amount: 0, type: 'sms', date: new Date().toLocaleDateString('pt-BR') });
  };

  const getIcon = (type: CostType) => {
    switch(type) {
      case 'sms': return <Smartphone size={16} className="text-red-500" />;
      case 'proxy': return <Globe size={16} className="text-blue-500" />;
      case 'ferramenta': return <Hammer size={16} className="text-purple-500" />;
      default: return <Settings size={16} className="text-zinc-500" />;
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white">Fluxo de <span className="text-zinc-600">Custos</span></h1>
          <p className="text-zinc-500 text-sm mt-1">Monitoramento financeiro e despesas operacionais</p>
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
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-400 shadow-xl shadow-red-500/10">
            <Plus size={18} /> Novo Gasto
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        <div className="bg-[#0c0c0c] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><PieChartIcon size={18} /></div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Gastos por Categoria</h3>
          </div>
          <div className="h-[250px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatBRL(value)}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">Sem dados no período</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[9px] font-black uppercase text-zinc-500">{entry.name}</span>
                <span className="text-[10px] font-bold text-white">{formatBRL(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-[#0c0c0c] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UsersIcon size={18} /></div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Gastos por Operador</h3>
            </div>
            <div className="h-[250px] w-full">
              {operatorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatorData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
                    <Tooltip 
                      formatter={(value: number) => formatBRL(value)}
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" fill="#eab308" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">Sem dados no período</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0c0c0c] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <BarChart3 size={20} className="text-zinc-600" />
             <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Detalhamento Financeiro</h4>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-4 py-2 rounded-full">
            Total do Período: {formatBRL(filteredCosts.reduce((a, b) => a + b.amount, 0))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Despesa / Data</th>
                <th className="px-8 py-6">Tipo</th>
                {isAdmin && <th className="px-8 py-6">Responsável</th>}
                <th className="px-8 py-6 text-red-500">Valor</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCosts.length > 0 ? filteredCosts.map(cost => (
                <tr key={cost.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-7">
                    <p className="font-bold text-white text-sm">{cost.name}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-1 flex items-center gap-1"><Calendar size={10} /> {cost.date}</p>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 capitalize">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {getIcon(cost.type)}
                      </div>
                      {cost.type}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-7">
                      <span className="text-[10px] font-black text-zinc-500 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {cost.operatorName}
                      </span>
                    </td>
                  )}
                  <td className="px-8 py-7 font-black text-sm text-red-500">- {formatBRL(cost.amount)}</td>
                  <td className="px-10 py-7 text-right">
                    <button onClick={() => onDeleteCost(cost.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-10 py-20 text-center text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">Nenhuma despesa encontrada para este período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black mb-2 text-white">Nova <span className="text-red-500">Despesa</span></h2>
            <p className="text-zinc-500 text-xs font-medium mb-10 uppercase tracking-widest">Lançamento de custo operacional</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all" 
                  value={newCost.name} 
                  onChange={e => setNewCost({...newCost, name: e.target.value})} 
                  required 
                  placeholder="Ex: Recarga SMS Semanal" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none appearance-none" 
                    value={newCost.type} 
                    onChange={e => setNewCost({...newCost, type: e.target.value as CostType})}
                  >
                    <option value="sms">SMS</option>
                    <option value="proxy">Proxy</option>
                    <option value="ferramenta">Ferramenta</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-red-500/50" 
                    value={newCost.amount} 
                    onChange={e => setNewCost({...newCost, amount: Number(e.target.value)})} 
                    required 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-zinc-500 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 shadow-2xl shadow-white/5">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
