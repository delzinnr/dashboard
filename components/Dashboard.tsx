
import React, { useMemo, useState } from 'react';
import { 
  Shield, 
  DollarSign, 
  Briefcase, 
  Target, 
  Users, 
  TrendingUp, 
  Wallet,
  Receipt,
  Gem,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Clock
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
  Cell
} from 'recharts';
import { Role, Cycle, Cost, User, Timeframe } from '../types';

interface DashboardProps {
  cycles: Cycle[];
  costs: Cost[];
  userRole: Role;
  currentUserId: string;
  teamMembers: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cycles, costs, userRole, currentUserId, teamMembers }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const isAdmin = userRole === 'admin';
  
  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const getTimeframeLabel = useMemo(() => {
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    
    if (timeframe === 'daily') {
      return `Hoje, ${formatDate(now)}`;
    }
    
    if (timeframe === 'weekly') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      return `Semana: ${formatDate(past)} — ${formatDate(now)}`;
    }
    
    if (timeframe === 'monthly') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      return `Mês: ${formatDate(past)} — ${formatDate(now)}`;
    }
    
    return 'Todo o Período Histórico';
  }, [timeframe]);

  const dashboardData = useMemo(() => {
    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    const now = new Date();
    const todayStr = now.toLocaleDateString('pt-BR');
    
    const isWithinTimeframe = (dateStr: string) => {
      if (timeframe === 'all') return true;
      const date = parseDate(dateStr);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeframe === 'daily') return dateStr === todayStr;
      if (timeframe === 'weekly') return diffDays <= 7;
      if (timeframe === 'monthly') return diffDays <= 30;
      return true;
    };

    const filteredCycles = cycles.filter(c => isWithinTimeframe(c.date));
    const filteredCosts = costs.filter(c => isWithinTimeframe(c.date));

    const myCycles = filteredCycles.filter(c => c.operatorId === currentUserId);
    const myCosts = filteredCosts.filter(c => c.operatorId === currentUserId);
    
    const myGrossReturn = myCycles.reduce((acc, c) => acc + c.return, 0);
    const myInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const myExpenses = myCosts.reduce((acc, c) => acc + c.amount, 0);
    
    const myPersonalProfit = (myGrossReturn - myInvested) - myExpenses;
    const myROI = myInvested > 0 ? (myPersonalProfit / myInvested) * 100 : 0;

    let teamCommissions = 0;
    let teamTotalReturn = 0;
    let teamTotalInvested = 0;
    const operatorPerformance: Record<string, { name: string, value: number }> = {};

    if (isAdmin) {
      const teamCycles = filteredCycles.filter(c => c.operatorId !== currentUserId);
      const teamCosts = filteredCosts.filter(c => c.operatorId !== currentUserId);
      const operators = new Set<string>(teamCycles.map(c => c.operatorId));
      
      operators.forEach((opId: string) => {
        const user = teamMembers.find(u => u.id === opId);
        const rate = user?.commission || 0;
        const opCycles = teamCycles.filter(c => c.operatorId === opId);
        const opCosts = teamCosts.filter(c => c.operatorId === opId);
        const opGrossProfit = opCycles.reduce((acc, c) => acc + (c.return - c.invested), 0);
        const opTotalExpenses = opCosts.reduce((acc, c) => acc + c.amount, 0);
        const opNetBase = opGrossProfit - opTotalExpenses;
        const comm = opNetBase > 0 ? (opNetBase * (rate / 100)) : 0;

        teamCommissions += comm;
        teamTotalReturn += opCycles.reduce((acc, c) => acc + c.return, 0);
        teamTotalInvested += opCycles.reduce((acc, c) => acc + c.invested, 0);
        if (!operatorPerformance[opId]) operatorPerformance[opId] = { name: user?.name || 'Op', value: 0 };
        operatorPerformance[opId].value += comm;
      });
    }

    let finalConsolidated = 0;
    if (isAdmin) {
      finalConsolidated = myPersonalProfit + teamCommissions;
    } else {
      const user = teamMembers.find(u => u.id === currentUserId);
      const rate = user?.commission || 0;
      const myNetBase = (myGrossReturn - myInvested) - myExpenses;
      const myCommissionPaid = myNetBase > 0 ? (myNetBase * (rate / 100)) : 0;
      finalConsolidated = myNetBase - myCommissionPaid;
    }

    const chartDataMap: Record<string, any> = {};
    const allDates = Array.from(new Set<string>(filteredCycles.map(c => c.date)));
    allDates.forEach((date: string) => {
      const dayCycles = filteredCycles.filter(c => c.date === date);
      const dayCosts = filteredCosts.filter(c => c.date === date);
      const dayGross = dayCycles.reduce((acc, c) => acc + (c.return - c.invested), 0);
      const dayExp = dayCosts.reduce((acc, c) => acc + c.amount, 0);
      chartDataMap[date] = { 
        date, 
        displayName: date.split('/')[0] + '/' + date.split('/')[1],
        profit: dayGross - dayExp 
      };
    });

    return {
      finalConsolidated,
      myExpenses,
      myPersonalProfit,
      myROI,
      myInvested,
      teamCommissions,
      teamTotalReturn,
      teamTotalInvested,
      chartData: Object.values(chartDataMap).sort((a,b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
      barData: Object.values(operatorPerformance)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin, timeframe]);

  const TimeframeSelector = () => (
    <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1">
      {[
        { id: 'daily', label: 'Hoje' },
        { id: 'weekly', label: '7 Dias' },
        { id: 'monthly', label: '30 Dias' },
        { id: 'all', label: 'Tudo' }
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setTimeframe(item.id as Timeframe)}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            timeframe === item.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-600 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 pb-24 pt-6 animate-in fade-in duration-700">
      
      {/* HEADER COM DATA DINÂMICA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/10">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white leading-none">Dashboard</h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Visão Estratégica</p>
            </div>
          </div>
          <div className="mt-4 px-1">
            <span className="text-xs font-black text-yellow-500/80 uppercase tracking-widest bg-yellow-500/5 px-3 py-1.5 rounded-lg border border-yellow-500/10">
              {getTimeframeLabel}
            </span>
          </div>
        </div>
        <TimeframeSelector />
      </div>
      
      {/* SEÇÃO 1: VISÃO CONSOLIDADA */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Shield size={12} className="text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Visão Consolidada</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0c0c0c] border border-yellow-500/10 p-10 md:p-12 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="absolute top-10 right-12">
               <div className="w-14 h-14 bg-yellow-500/5 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/10">
                 <Shield size={28} />
               </div>
            </div>
            <div className="relative z-10">
               <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-4 block">Resultado Líquido Final</span>
               <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-4">
                 {formatBRL(dashboardData.finalConsolidated)}
               </h3>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] max-w-lg leading-relaxed">Saldo Real (Ganhos + Comissões - Custos Operacionais)</p>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 p-10 md:p-12 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="absolute top-10 right-12">
               <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/10">
                 <DollarSign size={24} />
               </div>
            </div>
            <div className="relative z-10">
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 block">Gastos Operacionais</span>
               <h3 className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter mb-4">
                 {formatBRL(dashboardData.myExpenses)}
               </h3>
               <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Despesas do Período</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: MINHA OPERAÇÃO */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Briefcase size={12} className="text-blue-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Minha Operação (Pessoal)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Briefcase size={18}/></div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Lucro Pessoal</p>
              <h4 className={`text-3xl font-black tracking-tight ${dashboardData.myPersonalProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                {formatBRL(dashboardData.myPersonalProfit)}
              </h4>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Target size={18}/></div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">ROI Pessoal</p>
              <h4 className="text-3xl font-black text-emerald-500 tracking-tight">{dashboardData.myROI.toFixed(2)}%</h4>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Capital Investido Próprio</p>
              <h4 className="text-5xl font-black text-white tracking-tighter">{formatBRL(dashboardData.myInvested)}</h4>
            </div>
            <div className="absolute right-8 bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
               <Wallet size={80} />
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: PERFORMANCE DA EQUIPE */}
      {isAdmin && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Users size={12} className="text-purple-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Performance da Equipe (Rede)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0c0c0c] border border-purple-500/10 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between group">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 transition-transform group-hover:rotate-12"><Gem size={18}/></div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Comissões Recebidas</p>
                <h4 className="text-3xl font-black text-purple-500 tracking-tight">{formatBRL(dashboardData.teamCommissions)}</h4>
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400"><TrendingUp size={18}/></div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Volume Retorno Total</p>
                <h4 className="text-3xl font-black text-white tracking-tight">{formatBRL(dashboardData.teamTotalReturn)}</h4>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] min-h-[160px] flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Capital Total Girado (Rede)</p>
                <h4 className="text-5xl font-black text-white tracking-tighter">{formatBRL(dashboardData.teamTotalInvested)}</h4>
              </div>
              <div className="absolute right-8 bottom-4 opacity-5 pointer-events-none">
                 <Users size={80} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO 4: ANÁLISE VISUAL */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] shadow-xl">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/10"><LineChartIcon size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-[0.2em]">Fluxo Operacional de Lucro</h4>
           </div>
           <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                    <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10, fontWeight: 700}} dy={15} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">{payload[0].payload.date}</p>
                              <p className="text-lg font-black text-yellow-500">{formatBRL(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#eab308" strokeWidth={4} fill="url(#colorProfit)" animationDuration={2000} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] shadow-xl">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 border border-purple-500/10"><BarChart3 size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-[0.2em]">Ranking de Comissões</h4>
           </div>
           <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-5)}>
                    <XAxis dataKey={isAdmin ? "name" : "displayName"} axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 9, fontWeight: 800}} dy={10} />
                    <Tooltip cursor={{fill: 'white', opacity: 0.02}} />
                    <Bar dataKey={isAdmin ? "value" : "profit"} radius={[10, 10, 0, 0]} animationDuration={2000}>
                       {(isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-5)).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#eab308' : '#ca8a04'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </section>

    </div>
  );
};
