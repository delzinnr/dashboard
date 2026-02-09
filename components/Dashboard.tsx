
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
  Briefcase,
  PieChart as PieChartIcon,
  BrainCircuit,
  Loader2
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
    if (isAdmin) {
      const adminCycles = filteredCycles.filter(c => c.operatorId.includes('admin'));
      const teamCycles = filteredCycles.filter(c => !c.operatorId.includes('admin'));

      const managerPersonalProfit = adminCycles.reduce((acc, c) => acc + c.profit, 0);
      const managementCommission = teamCycles.reduce((acc, c) => acc + c.commissionValue, 0);
      
      const managerPersonalCosts = filteredCosts.filter(c => c.operatorId.includes('admin')).reduce((acc, c) => acc + c.amount, 0);
      const managerNetEarnings = Number((managerPersonalProfit + managementCommission - managerPersonalCosts).toFixed(2));

      return { 
        managerPersonalProfit: Number(managerPersonalProfit.toFixed(2)), 
        managementCommission: Number(managementCommission.toFixed(2)), 
        managerPersonalCosts: Number(managerPersonalCosts.toFixed(2)), 
        managerNetEarnings, 
        teamTotalCosts: filteredCosts.filter(c => !c.operatorId.includes('admin')).reduce((acc, c) => acc + c.amount, 0)
      };
    } else {
      const myTotalNetProfit = filteredCycles.reduce((acc, c) => acc + c.profit, 0);
      const myTotalCosts = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
      const myNetEarnings = Number((myTotalNetProfit - myTotalCosts).toFixed(2));

      return {
        managerPersonalProfit: 0, 
        managementCommission: Number(myTotalNetProfit.toFixed(2)), 
        managerPersonalCosts: Number(myTotalCosts.toFixed(2)), 
        managerNetEarnings: myNetEarnings, 
        teamTotalCosts: Number(myTotalCosts.toFixed(2))
      };
    }
  }, [filteredCycles, filteredCosts, isAdmin]);

  const teamPerformance = useMemo(() => {
    if (!isAdmin) return [];
    const performance: Record<string, number> = {};
    filteredCycles.forEach(c => {
      if (!c.operatorId.includes('admin')) {
        performance[c.operatorName] = (performance[c.operatorName] || 0) + c.profit;
      }
    });
    return Object.entries(performance).map(([name, profit]) => ({ name, profit: Number(profit.toFixed(2)) }));
  }, [filteredCycles, isAdmin]);

  const costDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredCosts.forEach(c => {
      distribution[c.type] = (distribution[c.type] || 0) + c.amount;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filteredCosts]);

  const evolutionData = useMemo(() => {
    const dataByDate: Record<string, number> = {};
    
    filteredCycles.forEach(c => {
      dataByDate[c.date] = (dataByDate[c.date] || 0) + c.profit;
    });

    if (isAdmin) {
      filteredCycles.forEach(c => {
        if (!c.operatorId.includes('admin')) {
          dataByDate[c.date] = (dataByDate[c.date] || 0) + c.commissionValue;
        }
      });
    }
    
    filteredCosts.forEach(c => {
      dataByDate[c.date] = (dataByDate[c.date] || 0) - c.amount;
    });

    const sortedDates = Object.keys(dataByDate).sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime());
    
    let cumulative = 0;
    const history = sortedDates.map(date => {
      cumulative += dataByDate[date];
      return { date, saldo: Number(cumulative.toFixed(2)) };
    });

    return [{ date: 'Início', saldo: 0 }, ...history];
  }, [filteredCycles, filteredCosts, isAdmin]);

  const COLORS = ['#eab308', '#ef4444', '#3b82f6', '#a855f7', '#22c55e'];

  const analyzeWithAI = async () => {
    const key = process.env.API_KEY;
    if (!key || key === 'undefined') {
      setAiInsight("Serviço de IA não configurado corretamente.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `Analise os dados financeiros do SMK Finance. Saldo Líquido atual: ${formatBRL(stats.managerNetEarnings)}. Custos totais: ${formatBRL(stats.managerPersonalCosts)}. Tendência é de lucro líquido. Dê um insight curto e estratégico para o gestor.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      setAiInsight(response.text);
    } catch (e) { 
      setAiInsight("Não foi possível gerar a análise agora."); 
    }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Dashboard <span className="text-zinc-600">{isAdmin ? 'Master' : 'Operador'}</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">
            Visão Geral de Performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={analyzeWithAI}
            disabled={isAnalyzing}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className="text-yellow-500" />}
            IA Insight
          </button>
          <div className="flex bg-[#111] p-1.5 rounded-2xl border border-white/5">
            {['daily', 'weekly', 'monthly', 'all'].map((t) => (
              <button key={t} onClick={() => setTimeframe(t as Timeframe)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${timeframe === t ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
                {t === 'daily' ? 'Hoje' : t === 'weekly' ? 'Semana' : t === 'monthly' ? 'Mês' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aiInsight && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="p-2 bg-yellow-500 rounded-xl text-black"><Sparkles size={18} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-yellow-500 tracking-widest mb-1">SMK Intelligence</p>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed">{aiInsight}</p>
          </div>
          <button onClick={() => setAiInsight(null)} className="text-zinc-600 hover:text-white text-xs font-bold uppercase">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0c0c0c] border border-yellow-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><Wallet size={20} /></div>
             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Saldo Líquido</span>
           </div>
           <h3 className={`text-3xl font-black ${stats.managerNetEarnings >= 0 ? 'text-white' : 'text-red-500'}`}>
             {formatBRL(stats.managerNetEarnings)}
           </h3>
           <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Líquido já descontado</p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Briefcase size={20} /></div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{isAdmin ? 'Comissões Master' : 'Lucro do Ciclo'}</span>
          </div>
          <h3 className="text-2xl font-black text-white">{formatBRL(stats.managementCommission)}</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">{isAdmin ? 'Taxas da rede' : 'Ganhos operacionais'}</p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Volume Total</span>
          </div>
          <h3 className="text-2xl font-black text-white">
            {formatBRL(filteredCycles.reduce((acc, c) => acc + c.return, 0))}
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Faturamento bruto</p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><Receipt size={20} /></div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Suas Despesas</span>
          </div>
          <h3 className="text-2xl font-black text-red-500">{formatBRL(stats.managerPersonalCosts)}</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">Operacional pessoal</p>
        </div>
      </div>

      <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><LineChartIcon size={22} /></div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Curva de Evolução de Saldo</h3>
            <p className="text-[10px] text-zinc-600 font-bold uppercase">Progressão acumulada no tempo</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isAdmin && (
          <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Users size={22} /></div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Performance da Equipe</h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase">Lucro gerado por operador</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {teamPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformance} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} axisLine={false} tickLine={false} width={80} />
                    <Tooltip 
                      formatter={(v: number) => formatBRL(v)}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="profit" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-800 text-[10px] font-black uppercase tracking-widest">Nenhum dado de equipe</div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#0c0c0c] rounded-[3rem] p-10 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><PieChartIcon size={22} /></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Breakdown de Custos</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase">Distribuição por categoria</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {costDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: number) => formatBRL(v)}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-800 text-[10px] font-black uppercase tracking-widest">Sem despesas registradas</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {costDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[9px] font-black uppercase text-zinc-500">{entry.name}</span>
                <span className="text-[10px] font-bold text-white">{formatBRL(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
