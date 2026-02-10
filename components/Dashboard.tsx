
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  LineChart as LineChartIcon,
  BrainCircuit,
  Loader2,
  PieChart as PieChartIcon,
  Target,
  ArrowUpRight,
  Coins,
  BarChart3,
  Users,
  ShieldCheck,
  Percent,
  User as UserIcon,
  Briefcase
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
  currentUserId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ cycles, costs, userRole, currentUserId }) => {
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
    const totalInvested = filteredCycles.reduce((acc, c) => acc + c.invested, 0);
    const totalReturn = filteredCycles.reduce((acc, c) => acc + c.return, 0);
    const totalCommission = filteredCycles.reduce((acc, c) => acc + c.commissionValue, 0);
    const totalCosts = filteredCosts.reduce((acc, c) => acc + c.amount, 0);
    
    // Métricas Pessoais (Apenas o que o gerente operou)
    const personalCycles = filteredCycles.filter(c => c.operatorId === currentUserId);
    const personalProfit = personalCycles.reduce((acc, c) => acc + c.profit, 0);
    const personalInvested = personalCycles.reduce((acc, c) => acc + c.invested, 0);
    const personalReturn = personalCycles.reduce((acc, c) => acc + c.return, 0);
    
    let net = 0;
    if (isAdmin) {
      net = totalCommission + personalProfit - totalCosts;
    } else {
      net = personalProfit - totalCosts;
    }
    
    const roi = totalInvested > 0 ? ((totalReturn - totalInvested) / totalInvested) * 100 : 0;
    const personalRoi = personalInvested > 0 ? ((personalReturn - personalInvested) / personalInvested) * 100 : 0;

    return {
      net: Number(net.toFixed(2)),
      invested: Number(totalInvested.toFixed(2)),
      return: Number(totalReturn.toFixed(2)),
      commission: Number(totalCommission.toFixed(2)),
      costs: Number(totalCosts.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      personalProfit: Number(personalProfit.toFixed(2)),
      personalInvested: Number(personalInvested.toFixed(2)),
      personalRoi: Number(personalRoi.toFixed(2))
    };
  }, [filteredCycles, filteredCosts, isAdmin, currentUserId]);

  const teamPerformanceData = useMemo(() => {
    const data: Record<string, { name: string, profit: number, commission: number, operations: number }> = {};
    filteredCycles.forEach(c => {
      if (!data[c.operatorId]) {
        data[c.operatorId] = { name: c.operatorName, profit: 0, commission: 0, operations: 0 };
      }
      data[c.operatorId].profit += c.profit;
      data[c.operatorId].commission += c.commissionValue;
      data[c.operatorId].operations += 1;
    });
    return Object.values(data).sort((a, b) => b.profit - a.profit);
  }, [filteredCycles]);

  const evolutionData = useMemo(() => {
    // Combinar ciclos e custos em uma única linha do tempo
    const timeline: { date: Date, value: number }[] = [];
    
    filteredCycles.forEach(c => {
      const isMyOp = c.operatorId === currentUserId;
      const gain = isAdmin ? (c.commissionValue + (isMyOp ? c.profit : 0)) : c.profit;
      timeline.push({ date: parseDate(c.date), value: gain });
    });
    
    filteredCosts.forEach(cost => {
      timeline.push({ date: parseDate(cost.date), value: -cost.amount });
    });

    // Ordenar por data
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Agrupar por data e calcular acumulado
    let runningTotal = 0;
    const result: Record<string, number> = {};
    
    timeline.forEach(item => {
      const dateStr = item.date.toLocaleDateString('pt-BR');
      runningTotal += item.value;
      result[dateStr] = Number(runningTotal.toFixed(2));
    });

    return Object.entries(result).map(([date, saldo]) => ({ date, saldo }));
  }, [filteredCycles, filteredCosts, isAdmin, currentUserId]);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise SMK Finance Gerencial: Saldo Líquido ${formatBRL(stats.net)}, ROI Pessoal ${stats.personalRoi}%, Comissões Equipe ${formatBRL(stats.commission)}, Custos ${formatBRL(stats.costs)}. Dê um conselho estratégico curto em PT-BR.`
      });
      setAiInsight(response.text);
    } catch (e) {
      setAiInsight("Serviço de análise avançada temporariamente indisponível.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const COLORS = ['#eab308', '#a855f7', '#3b82f6', '#ef4444', '#22c55e', '#f97316'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white leading-tight">Painel <span className="text-zinc-600">Estratégico</span></h1>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Status Operacional • {isAdmin ? 'Gerência Master' : 'Visão Operador'}</p>
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

      {/* SEÇÃO 1: VISÃO CONSOLIDADA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck size={14} className="text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Visão Consolidada</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-[#0c0c0c] border border-yellow-500/30 p-6 rounded-[2.5rem] relative group overflow-hidden md:col-span-2 ring-1 ring-yellow-500/10">
            <div className="absolute top-0 right-0 p-12 bg-yellow-500/5 blur-3xl rounded-full"></div>
            <div className="flex items-center justify-between mb-4 relative">
              <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><ShieldCheck size={18} /></div>
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Resultado Líquido Final</span>
            </div>
            <h3 className={`text-4xl font-black truncate relative ${stats.net >= 0 ? 'text-white' : 'text-red-500'}`}>{formatBRL(stats.net)}</h3>
            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-2">Saldo Real (Meus Ganhos + Comissões - Custos)</p>
          </div>

          <div className="bg-[#0c0c0c] border border-red-500/20 p-6 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><Receipt size={18} /></div>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Gastos Gerais</span>
            </div>
            <h3 className="text-2xl font-black text-red-500 truncate">{formatBRL(stats.costs)}</h3>
            <p className="text-[9px] text-zinc-600 font-bold uppercase mt-2">Despesas totais do período</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: MINHA OPERAÇÃO VS EQUIPE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA: MINHA PERFORMANCE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <UserIcon size={14} className="text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Minha Operação (Pessoal)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2rem]">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 w-fit mb-3"><Briefcase size={16} /></div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Lucro Pessoal</p>
              <h4 className="text-lg font-black text-white">{formatBRL(stats.personalProfit)}</h4>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2rem]">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500 w-fit mb-3"><Target size={16} /></div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">ROI Pessoal</p>
              <h4 className="text-lg font-black text-blue-400">{stats.personalRoi}%</h4>
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between">
            <div>
               <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Capital Investido Próprio</p>
               <h4 className="text-xl font-black text-zinc-400">{formatBRL(stats.personalInvested)}</h4>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-700">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        {/* COLUNA: PERFORMANCE EQUIPE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Users size={14} className="text-purple-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Performance da Equipe</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0c0c0c] border border-purple-500/20 p-5 rounded-[2rem]">
              <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500 w-fit mb-3"><Coins size={16} /></div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Comissões Recebidas</p>
              <h4 className="text-lg font-black text-purple-400">{formatBRL(stats.commission)}</h4>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2rem]">
              <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 w-fit mb-3"><TrendingUp size={16} /></div>
              <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Volume Retorno Total</p>
              <h4 className="text-lg font-black text-white">{formatBRL(stats.return)}</h4>
            </div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between">
            <div>
               <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Capital Total Girado (Rede)</p>
               <h4 className="text-xl font-black text-zinc-500">{formatBRL(stats.invested)}</h4>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-700">
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE EVOLUÇÃO (REAL COM CUSTOS) */}
      <div className="bg-[#0c0c0c] rounded-[2.5rem] p-6 md:p-10 border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><LineChartIcon size={20} /></div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Curva de Lucratividade Real</h3>
            <p className="text-[9px] text-zinc-600 font-bold uppercase italic">Saldo Líquido Acumulado (Ganhos - Despesas)</p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" stroke="#333" fontSize={9} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#71717a', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number) => [formatBRL(value), 'Saldo Líquido']}
              />
              <Area type="monotone" dataKey="saldo" stroke="#eab308" fill="url(#gradReal)" strokeWidth={3} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PERFORMANCE POR OPERADOR (ADMIN ONLY) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0c0c0c] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><BarChart3 size={20} /></div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Ranking de Produção</h3>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Volume de comissões geradas por operador</p>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#333" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#71717a', fontWeight: 'bold', marginBottom: '4px' }}
                    cursor={{ fill: '#ffffff03' }}
                    formatter={(value: number) => [formatBRL(value), 'Comissão Gerada']}
                  />
                  <Bar dataKey="commission" radius={[6, 6, 0, 0]} barSize={40}>
                    {teamPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0c0c0c] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500"><PieChartIcon size={20} /></div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Mix Operacional</h3>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Frequência de ciclos na rede</p>
              </div>
            </div>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={teamPerformanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="operations"
                    nameKey="name"
                  >
                    {teamPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#71717a', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
