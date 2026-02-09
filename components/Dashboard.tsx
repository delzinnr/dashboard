
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  Sparkles, 
  Smartphone, 
  Globe, 
  Receipt, 
  Users,
  LineChart as LineChartIcon,
  ArrowUpRight,
  DollarSign,
  ShieldCheck,
  Briefcase,
  TrendingDown,
  ArrowDownRight,
  Layers,
  BrainCircuit,
  AlertTriangle
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
  Legend
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
    if (isAdmin) {
      // Visão do Administrador: Lucro próprio + Comissões da equipe - Custos do Admin
      const adminCycles = filteredCycles.filter(c => c.operatorId.includes('admin'));
      const teamCycles = filteredCycles.filter(c => !c.operatorId.includes('admin'));

      const managerPersonalProfit = adminCycles.reduce((acc, c) => acc + c.profit, 0);
      const managementCommission = teamCycles.reduce((acc, c) => acc + c.commissionValue, 0);
      
      const managerPersonalCosts = filteredCosts.filter(c => c.operatorId.includes('admin')).reduce((acc, c) => acc + c.amount, 0);
      const teamTotalCosts = filteredCosts.filter(c => !c.operatorId.includes('admin')).reduce((acc, c) => acc + c.amount, 0);
      
      const managerNetEarnings = Number((managerPersonalProfit + managementCommission - managerPersonalCosts).toFixed(2));

      return { 
        managerPersonalProfit: Number(managerPersonalProfit.toFixed(2)), 
        managementCommission: Number(managementCommission.toFixed(2)), 
        managerPersonalCosts: Number(managerPersonalCosts.toFixed(2)), 
        managerNetEarnings, 
        teamTotalCosts: Number(teamTotalCosts.toFixed(2))
      };
    } else {
      // Visão do Operador: Comissões próprias - Custos próprios
      const myGrossCommissions = filteredCycles.reduce((acc, c) => acc + c.commissionValue, 0);
      const myTotalCosts = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
      const myNetEarnings = Number((myGrossCommissions - myTotalCosts).toFixed(2));

      return {
        managerPersonalProfit: 0, 
        managementCommission: Number(myGrossCommissions.toFixed(2)), // Card: Minhas Comissões (Bruto)
        managerPersonalCosts: Number(myTotalCosts.toFixed(2)), // Card: Meus Custos
        managerNetEarnings: myNetEarnings, // Card Principal: Saldo Líquido
        teamTotalCosts: Number(myTotalCosts.toFixed(2))
      };
    }
  }, [filteredCycles, filteredCosts, isAdmin]);

  const teamPerformanceData = useMemo(() => {
    if (!isAdmin) return [];
    const data: Record<string, { profit: number; costs: number; commission: number }> = {};
    
    filteredCycles.forEach(c => {
      if (!c.operatorId.includes('admin')) {
        if (!data[c.operatorName]) data[c.operatorName] = { profit: 0, costs: 0, commission: 0 };
        data[c.operatorName].profit += c.profit;
        data[c.operatorName].commission += c.commissionValue;
      }
    });

    filteredCosts.forEach(c => {
      if (!c.operatorId.includes('admin')) {
        if (!data[c.operatorName]) data[c.operatorName] = { profit: 0, costs: 0, commission: 0 };
        data[c.operatorName].costs += c.amount;
      }
    });

    return Object.entries(data).map(([name, vals]) => ({
      name,
      'Lucro Bruto': Number(vals.profit.toFixed(2)),
      'Custos Operador': Number(vals.costs.toFixed(2)),
      'Saldo Operador': Number((vals.commission - vals.costs).toFixed(2))
    })).sort((a, b) => b['Lucro Bruto'] - a['Lucro Bruto']);
  }, [filteredCycles, filteredCosts, isAdmin]);

  const evolutionData = useMemo(() => {
    const dataByDate: Record<string, number> = {};
    
    filteredCycles.forEach(c => {
      const gain = isAdmin ? (c.operatorId.includes('admin') ? c.profit : c.commissionValue) : c.commissionValue;
      dataByDate[c.date] = (dataByDate[c.date] || 0) + gain;
    });
    
    filteredCosts.forEach(c => {
      // Para admin, só contam custos do admin no saldo pessoal. Para operador, contam todos (que já estão filtrados no App.tsx)
      if (!isAdmin || (isAdmin && c.operatorId.includes('admin'))) {
        dataByDate[c.date] = (dataByDate[c.date] || 0) - c.amount;
      }
    });

    const sortedDates = Object.keys(dataByDate).sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime());
    
    let cumulative = 0;
    const history = sortedDates.map(date => {
      cumulative += dataByDate[date];
      return { date, saldo: Number(cumulative.toFixed(2)) };
    });

    return [{ date: 'Início', saldo: 0 }, ...history];
  }, [filteredCycles, filteredCosts, isAdmin]);

  const analyzeWithAI = async () => {
    const key = process.env.API_KEY;
    if (!key || key === 'YOUR_API_KEY' || key === 'undefined') {
      setAiInsight("AI Indisponível: Chave de API não configurada.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const context = isAdmin 
        ? `Administrador: Lucro Líquido ${formatBRL(stats.managerNetEarnings)}, Comissões da Equipe ${formatBRL(stats.managementCommission)}.`
        : `Operador: Comissões Brutas ${formatBRL(stats.managementCommission)}, Custos Operacionais ${formatBRL(stats.managerPersonalCosts)}, Saldo Líquido ${formatBRL(stats.managerNetEarnings)}.`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: `Analise SMK Finance: ${context} Responda em 1 frase curta sobre a saúde financeira.` 
      });
      setAiInsight(response.text);
    } catch (e) { 
      setAiInsight("Erro ao processar análise inteligente."); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Dashboard <span className="text-zinc-600">{isAdmin ? 'Master' : 'Operador'}</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">
            {isAdmin ? 'Gestão de rede e comissionamento' : 'Minha performance operacional'}
          </p>
        </div>
        <div className="flex bg-[#111] p-1.5 rounded-2xl border border-white/5">
          {['daily', 'weekly', 'monthly', 'all'].map((t) => (
            <button key={t} onClick={() => setTimeframe(t as Timeframe)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${timeframe === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
              {t === 'daily' ? 'Hoje' : t === 'weekly' ? 'Semana' : t === 'monthly' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Principal: Saldo Líquido (Correto para ambos) */}
        <div className="bg-[#0c0c0c] border border-yellow-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-all"></div>
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><Wallet size={20} /></div>
             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Seu Saldo Líquido</span>
           </div>
           <h3 className={`text-3xl font-black ${stats.managerNetEarnings >= 0 ? 'text-white' : 'text-red-500'}`}>
             {formatBRL(stats.managerNetEarnings)}
           </h3>
           <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase flex items-center gap-1">
             {stats.managerNetEarnings >= 0 ? <ArrowUpRight size={12} className="text-green-500" /> : <ArrowDownRight size={12} className="text-red-500" />} 
             Lucro Real Final
           </p>
        </div>

        {isAdmin ? (
          <>
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Briefcase size={20} /></div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Comissões de Equipe</span>
              </div>
              <h3 className="text-2xl font-black text-white">{formatBRL(stats.managementCommission)}</h3>
              <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Ganhos sobre a rede</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><ShieldCheck size={20} /></div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Minha Operação</span>
              </div>
              <h3 className="text-2xl font-black text-white">{formatBRL(stats.managerPersonalProfit)}</h3>
              <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Lucro Bruto Pessoal</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><TrendingDown size={20} /></div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Meus Custos</span>
              </div>
              <h3 className="text-2xl font-black text-red-500">{formatBRL(stats.managerPersonalCosts)}</h3>
              <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Gastos Master</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl lg:col-span-2">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><DollarSign size={20} /></div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Comissões Acumuladas</span>
                </div>
                <h3 className="text-2xl font-black text-white">{formatBRL(stats.managementCommission)}</h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Total de ganhos (Bruto)</p>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><Receipt size={20} /></div>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Meus Custos</span>
                </div>
                <h3 className="text-2xl font-black text-red-500">{formatBRL(stats.managerPersonalCosts)}</h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">SMS, Proxy e Ferramentas</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-6 shadow-2xl overflow-hidden relative group">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><BrainCircuit size={20} /></div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Análise de Performance IA</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
           <button 
             onClick={analyzeWithAI}
             disabled={isAnalyzing}
             className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-yellow-500/20 disabled:opacity-50 shrink-0"
           >
             {isAnalyzing ? "Calculando..." : "Gerar Insight de Performance"}
           </button>
           
           {aiInsight && (
             <div className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5 animate-in slide-in-from-left-4">
               <Sparkles className="text-yellow-500 shrink-0" size={16} />
               <p className="text-sm font-medium text-zinc-300 italic">"{aiInsight}"</p>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><LineChartIcon size={22} /></div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Curva de Saldo Real</h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">Saldo acumulado pós-custos</p>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
                <Tooltip 
                  formatter={(value: number) => [formatBRL(value), "Saldo Real"]}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="saldo" stroke="#eab308" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Layers size={22} /></div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Rentabilidade Equipe</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase">Lucro Bruto vs Custos Individuais</p>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              {teamPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformanceData} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
                    <Tooltip 
                      formatter={(value: number) => formatBRL(value)}
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '11px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '20px' }} />
                    <Bar dataKey="Lucro Bruto" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Custos Operador" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest gap-4">
                  <AlertTriangle size={32} strokeWidth={1} />
                  Sem dados de equipe para exibir
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-yellow-500/10 rounded-[2.5rem] mb-6 text-yellow-500">
               <TrendingUp size={48} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Ótimo trabalho!</h3>
            <p className="text-zinc-500 text-sm max-w-xs">Continue gerenciando seus ciclos e custos para manter sua rentabilidade positiva.</p>
          </div>
        )}
      </div>
    </div>
  );
};
