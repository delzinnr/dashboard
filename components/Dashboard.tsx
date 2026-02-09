
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  LineChart as LineChartIcon,
  Briefcase,
  BrainCircuit,
  Loader2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Cycle, Role, Cost, Timeframe } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  cycles: Cycle[];
  costs: Cost[];
  userRole: Role;
}

export const Dashboard: React.FC<DashboardProps> = ({ cycles, costs, userRole }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredCycles = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return cycles.filter(c => {
      const cycleDate = parseDate(c.date);
      if (timeframe === 'daily') return cycleDate.getTime() === today.getTime();
      if (timeframe === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return cycleDate >= weekAgo;
      }
      if (timeframe === 'monthly') return cycleDate.getMonth() === today.getMonth() && cycleDate.getFullYear() === today.getFullYear();
      return true;
    });
  }, [cycles, timeframe]);

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

  const stats = useMemo(() => {
    const profit = filteredCycles.reduce((acc, c) => acc + (isAdmin && !c.operatorId.includes('admin') ? c.commissionValue : c.profit), 0);
    const cost = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
    return {
      net: Number((profit - cost).toFixed(2)),
      gross: Number(filteredCycles.reduce((acc, c) => acc + c.return, 0).toFixed(2)),
      commission: Number(filteredCycles.reduce((acc, c) => acc + c.commissionValue, 0).toFixed(2)),
      costs: Number(cost.toFixed(2))
    };
  }, [filteredCycles, filteredCosts, isAdmin]);

  const evolutionData = useMemo(() => {
    const dataByDate: Record<string, number> = {};
    filteredCycles.forEach(c => {
      const val = (isAdmin && !c.operatorId.includes('admin') ? c.commissionValue : c.profit);
      dataByDate[c.date] = (dataByDate[c.date] || 0) + val;
    });
    filteredCosts.forEach(c => {
      dataByDate[c.date] = (dataByDate[c.date] || 0) - c.amount;
    });
    const sorted = Object.keys(dataByDate).sort((a,b) => parseDate(a).getTime() - parseDate(b).getTime());
    let cum = 0;
    return sorted.map(date => {
      cum += dataByDate[date];
      return { date, saldo: Number(cum.toFixed(2)) };
    });
  }, [filteredCycles, filteredCosts, isAdmin]);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise SMK Finance: Saldo ${formatBRL(stats.net)}, Custos ${formatBRL(stats.costs)}. Dê um conselho estratégico curto em PT-BR.`
      });
      setAiInsight(response.text);
    } catch (e) {
      setAiInsight("Serviço de IA indisponível temporariamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white leading-tight">Painel <span className="text-zinc-600">Geral</span></h1>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Status da Operação • {isAdmin ? 'Master' : 'Op'}</p>
          </div>
          <button onClick={analyzeWithAI} disabled={isAnalyzing} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all">
            {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
          </button>
        </div>

        <div className="flex bg-[#111] p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['daily', 'weekly', 'monthly', 'all'].map((t) => (
            <button key={t} onClick={() => setTimeframe(t as Timeframe)} className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${timeframe === t ? 'bg-yellow-500 text-black' : 'text-zinc-600'}`}>
              {t === 'daily' ? 'Hoje' : t === 'weekly' ? 'Semana' : t === 'monthly' ? 'Mês' : 'Geral'}
            </button>
          ))}
        </div>
      </div>

      {aiInsight && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="p-2 bg-yellow-500 rounded-xl text-black flex-shrink-0"><TrendingUp size={16} /></div>
          <p className="text-xs text-zinc-300 font-medium leading-relaxed">{aiInsight}</p>
        </div>
      )}

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[#0c0c0c] border border-yellow-500/20 p-6 rounded-[2.5rem] relative group">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><Wallet size={18} /></div>
             <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Saldo Líquido</span>
           </div>
           <h3 className={`text-2xl font-black truncate ${stats.net >= 0 ? 'text-white' : 'text-red-500'}`}>{formatBRL(stats.net)}</h3>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Briefcase size={18} /></div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{isAdmin ? 'Comissões' : 'Lucro Bruto'}</span>
          </div>
          <h3 className="text-2xl font-black text-white truncate">{formatBRL(stats.commission)}</h3>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><TrendingUp size={18} /></div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Volume</span>
          </div>
          <h3 className="text-2xl font-black text-white truncate">{formatBRL(stats.gross)}</h3>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><Receipt size={18} /></div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Despesas</span>
          </div>
          <h3 className="text-2xl font-black text-red-500 truncate">-{formatBRL(stats.costs)}</h3>
        </div>
      </div>

      <div className="bg-[#0c0c0c] rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><LineChartIcon size={20} /></div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Evolução do Caixa</h3>
            <p className="text-[9px] text-zinc-600 font-bold uppercase">Saldo líquido acumulado</p>
          </div>
        </div>
        <div className="h-[220px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" stroke="#333" fontSize={9} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }} />
              <Area type="monotone" dataKey="saldo" stroke="#eab308" fill="url(#grad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
