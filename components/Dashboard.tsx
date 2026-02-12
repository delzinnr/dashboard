
import React, { useMemo, useState } from 'react';
import { 
  Shield, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Gem,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Clock,
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
  
  const formatBRL = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const timeframeInfo = useMemo(() => {
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let label = '';
    switch(timeframe) {
      case 'daily': label = "Hoje: " + formatDate(now); break;
      case 'weekly': label = "Semana: " + formatDate(startOfWeek) + " - " + formatDate(endOfWeek); break;
      case 'monthly': 
        const monthName = now.toLocaleString('pt-BR', { month: 'long' });
        label = "Mês de " + (monthName.charAt(0).toUpperCase() + monthName.slice(1)); 
        break;
      default: label = "Todo o Período Histórico";
    }

    return { label, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  }, [timeframe]);

  const dashboardData = useMemo(() => {
    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    const { startOfWeek, endOfWeek, startOfMonth, endOfMonth } = timeframeInfo;
    const now = new Date();
    const todayStr = now.toLocaleDateString('pt-BR');
    
    const isWithinTimeframe = (dateStr: string) => {
      if (timeframe === 'all') return true;
      const date = parseDate(dateStr);
      if (timeframe === 'daily') return dateStr === todayStr;
      if (timeframe === 'weekly') return date >= startOfWeek && date <= endOfWeek;
      if (timeframe === 'monthly') return date >= startOfMonth && date <= endOfMonth;
      return true;
    };

    const filteredCycles = cycles.filter(c => isWithinTimeframe(c.date));
    const filteredCosts = costs.filter(c => isWithinTimeframe(c.date));

    const myCycles = filteredCycles.filter(c => c.operatorId === currentUserId);
    const myCosts = filteredCosts.filter(c => c.operatorId === currentUserId);
    
    const myGrossReturn = myCycles.reduce((acc, c) => acc + c.return, 0);
    const myInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const myExpenses = myCosts.reduce((acc, c) => acc + c.amount, 0);
    
    // Lucro Operacional (Banca - Despesas)
    const myOperationalProfit = (myGrossReturn - myInvested) - myExpenses;

    const currentUserProfile = teamMembers.find(u => u.id === currentUserId);
    const myCommissionRate = currentUserProfile?.commission || 0;
    
    // Comissão gerada para o gerente baseada no lucro operacional
    const myGeneratedCommission = myOperationalProfit > 0 ? (myOperationalProfit * (myCommissionRate / 100)) : 0;

    // Ganho Real do Operador: Lucro Operacional - Comissão Gerente
    const myNetRealProfit = myOperationalProfit - myGeneratedCommission;

    let teamCommissions = 0;
    let teamTotalReturn = 0;
    let teamTotalInvested = 0;
    const operatorPerformance: Record<string, { name: string, value: number, volume: number }> = {};

    if (isAdmin) {
      const uniqueOpIds = new Set(filteredCycles.map(c => c.operatorId));
      uniqueOpIds.forEach(opId => {
        if (opId === currentUserId) return;
        const user = teamMembers.find(u => u.id === opId);
        const rate = user?.commission || 0;
        
        const opCycles = filteredCycles.filter(fc => fc.operatorId === opId);
        const opCosts = filteredCosts.filter(fc => fc.operatorId === opId);
        
        const opRet = opCycles.reduce((acc, curr) => acc + curr.return, 0);
        const opInv = opCycles.reduce((acc, curr) => acc + curr.invested, 0);
        const opExp = opCosts.reduce((acc, curr) => acc + curr.amount, 0);
        
        const opNet = (opRet - opInv) - opExp;
        const comm = opNet > 0 ? (opNet * (rate / 100)) : 0;

        operatorPerformance[opId] = { 
          name: user?.name || opCycles[0]?.operatorName || 'Operador', 
          value: Number(comm.toFixed(2)), 
          volume: opRet 
        };
        
        teamCommissions += comm;
        teamTotalReturn += opRet;
        teamTotalInvested += opInv;
      });
    }

    const chartDataMap: Record<string, any> = {};
    filteredCycles.forEach(c => {
      if (!chartDataMap[c.date]) {
        chartDataMap[c.date] = { 
          date: c.date, 
          displayName: c.date.split('/')[0] + '/' + c.date.split('/')[1],
          profit: 0,
          gross: 0
        };
      }
      chartDataMap[c.date].gross += c.return;
      chartDataMap[c.date].profit += (c.return - c.invested);
    });

    return {
      finalConsolidated: isAdmin ? (myOperationalProfit + teamCommissions) : myNetRealProfit,
      myExpenses,
      myGeneratedCommission,
      myCommissionRate,
      teamCommissions,
      teamTotalReturn,
      teamTotalInvested,
      chartData: Object.values(chartDataMap).sort((a,b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
      barData: Object.values(operatorPerformance).sort((a,b) => b.value - a.value)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin, timeframe, timeframeInfo]);

  const TimeframeSelector = () => (
    <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1">
      {['daily', 'weekly', 'monthly', 'all'].map((id) => (
        <button
          key={id}
          onClick={() => setTimeframe(id as Timeframe)}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            timeframe === id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-600 hover:text-white'
          }`}
        >
          {id === 'daily' ? 'Hoje' : id === 'weekly' ? 'Semana' : id === 'monthly' ? 'Mês' : 'Tudo'}
        </button>
      ))}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
            {payload[0].payload.date || payload[0].payload.name}
          </p>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Valor do Registro:</p>
            <p className="text-sm font-black text-yellow-500">
              {formatBRL(payload[0].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 pb-24 pt-6 animate-in fade-in duration-700">
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
        </div>
        <TimeframeSelector />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-yellow-500/10 p-10 rounded-[2.5rem] relative overflow-hidden group">
           <div className="relative z-10">
             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-4 block">
               {isAdmin ? 'Resultado Líquido Final' : 'Meu Lucro Real (Líquido)'}
             </span>
             <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-4">
               {formatBRL(dashboardData.finalConsolidated)}
             </h3>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
               {isAdmin ? 'Saldo Consolidado da Rede' : 'Seu Ganho após todas as deduções'}
             </p>
           </div>
        </div>

        <div className="flex flex-col gap-6">
          {!isAdmin && (
            <div className="flex-1 bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2rem] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] block">Comissão gerada para o gerente</span>
                <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">{dashboardData.myCommissionRate}%</span>
              </div>
              <h3 className="text-4xl font-black text-blue-500 tracking-tighter mb-1">
                {formatBRL(dashboardData.myGeneratedCommission)}
              </h3>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Referente ao lucro operacional</p>
            </div>
          )}

          <div className={`flex-1 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-center ${isAdmin ? 'h-full' : ''}`}>
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 block">Gastos Operacionais</span>
             <h3 className="text-4xl font-black text-red-500 tracking-tighter mb-1">
               {formatBRL(dashboardData.myExpenses)}
             </h3>
             <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Custos Deduzidos</p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c0c0c] border border-purple-500/10 p-8 rounded-[2rem]">
            <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Comissões (Ganhos Rede)</p>
            <h4 className="text-3xl font-black text-purple-500">{formatBRL(dashboardData.teamCommissions)}</h4>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem]">
            <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Volume Saída (Rede)</p>
            <h4 className="text-3xl font-black text-white">{formatBRL(dashboardData.teamTotalReturn)}</h4>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem]">
            <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Capital Girado (Rede)</p>
            <h4 className="text-3xl font-black text-white">{formatBRL(dashboardData.teamTotalInvested)}</h4>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><LineChartIcon size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-[0.2em]">Evolução do Saldo (Banca)</h4>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 10}} dy={15} />
                    <YAxis 
                      tickFormatter={(val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#444', fontSize: 9}} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#eab308', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="profit" stroke="#eab308" strokeWidth={4} fill="url(#colorProfit)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><BarChart3 size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-[0.2em]">Performance Equipe</h4>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-5)}>
                    <XAxis dataKey={isAdmin ? "name" : "displayName"} axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 9}} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: '#ffffff05'}}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey={isAdmin ? "value" : "profit"} radius={[8, 8, 0, 0]}>
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
