
import React, { useMemo, useState } from 'react';
import { 
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Target,
  Zap,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  RotateCcw
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
  const [dateOffset, setDateOffset] = useState(0); // 0 = atual, -1 = anterior, etc.
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
    const targetDate = new Date(now);

    // Ajusta a data alvo baseada no offset e no timeframe
    if (timeframe === 'daily') {
      targetDate.setDate(now.getDate() + dateOffset);
    } else if (timeframe === 'weekly') {
      targetDate.setDate(now.getDate() + (dateOffset * 7));
    } else if (timeframe === 'monthly') {
      targetDate.setMonth(now.getMonth() + dateOffset);
    }

    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    
    // Início e fim da semana da data alvo
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Início e fim do mês da data alvo
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    let label = '';
    const isPresent = dateOffset === 0;

    switch(timeframe) {
      case 'daily': 
        label = isPresent ? "Hoje" : formatDate(targetDate); 
        break;
      case 'weekly': 
        label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`; 
        break;
      case 'monthly': 
        label = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        break;
      default: 
        label = "Histórico Completo";
    }

    return { label, startOfWeek, endOfWeek, startOfMonth, endOfMonth, targetDate, isPresent };
  }, [timeframe, dateOffset]);

  const dashboardData = useMemo(() => {
    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, targetDate } = timeframeInfo;
    const targetDateStr = targetDate.toLocaleDateString('pt-BR');
    
    const isWithinTimeframe = (dateStr: string) => {
      if (timeframe === 'all') return true;
      const date = parseDate(dateStr);
      if (timeframe === 'daily') return dateStr === targetDateStr;
      if (timeframe === 'weekly') return date >= startOfWeek && date <= endOfWeek;
      if (timeframe === 'monthly') return date >= startOfMonth && date <= endOfMonth;
      return true;
    };

    const filteredCycles = cycles.filter(c => isWithinTimeframe(c.date));
    const filteredCosts = costs.filter(c => isWithinTimeframe(c.date));

    // Filtragem específica por usuário/admin
    const myCycles = filteredCycles.filter(c => c.operatorId === currentUserId);
    const myCosts = filteredCosts.filter(c => c.operatorId === currentUserId);
    
    const myGrossReturn = myCycles.reduce((acc, c) => acc + c.return, 0);
    const myInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const myExpenses = myCosts.reduce((acc, c) => acc + c.amount, 0);
    
    const myOperationalProfit = (myGrossReturn - myInvested) - myExpenses;
    const currentUserProfile = teamMembers.find(u => u.id === currentUserId);
    const myCommissionRate = currentUserProfile?.commission || 0;
    const myGeneratedCommission = myOperationalProfit > 0 ? (myOperationalProfit * (myCommissionRate / 100)) : 0;
    const myNetRealProfit = myOperationalProfit - myGeneratedCommission;

    let teamCommissions = 0;
    let teamTotalReturn = 0;
    let teamTotalInvested = 0;
    const operatorPerformance: any[] = [];

    if (isAdmin) {
      const uniqueOpIds = new Set(filteredCycles.map(c => c.operatorId));
      uniqueOpIds.forEach(opId => {
        const user = teamMembers.find(u => u.id === opId);
        const rate = user?.commission || 0;
        
        const opCycles = filteredCycles.filter(fc => fc.operatorId === opId);
        const opCosts = filteredCosts.filter(fc => fc.operatorId === opId);
        
        const opRet = opCycles.reduce((acc, curr) => acc + curr.return, 0);
        const opInv = opCycles.reduce((acc, curr) => acc + curr.invested, 0);
        const opExp = opCosts.reduce((acc, curr) => acc + curr.amount, 0);
        
        const opNet = (opRet - opInv) - opExp;
        const comm = opNet > 0 ? (opNet * (rate / 100)) : 0;

        if (opRet > 0 || opInv > 0 || opExp > 0) {
          operatorPerformance.push({
            name: user?.name || opCycles[0]?.operatorName || 'Operador',
            commission: Number(comm.toFixed(2)),
            volume: opRet,
            expenses: opExp,
            netProfit: opNet
          });
          
          teamCommissions += comm;
          teamTotalReturn += opRet;
          teamTotalInvested += opInv;
        }
      });
    }

    const chartDataMap: Record<string, any> = {};
    filteredCycles.forEach(c => {
      if (!chartDataMap[c.date]) {
        chartDataMap[c.date] = { 
          date: c.date, 
          displayName: c.date.split('/')[0] + '/' + c.date.split('/')[1],
          profit: 0
        };
      }
      chartDataMap[c.date].profit += (c.return - c.invested);
    });

    return {
      finalConsolidated: isAdmin ? (myOperationalProfit + teamCommissions) : myNetRealProfit,
      myExpenses: isAdmin ? (filteredCosts.reduce((acc, c) => acc + c.amount, 0)) : myExpenses,
      myGeneratedCommission,
      myCommissionRate,
      teamCommissions,
      teamTotalReturn,
      teamTotalInvested,
      chartData: Object.values(chartDataMap).sort((a,b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
      barData: operatorPerformance.sort((a,b) => b.commission - a.commission)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin, timeframe, timeframeInfo]);

  const changePeriod = (dir: 'prev' | 'next') => {
    setDateOffset(prev => dir === 'prev' ? prev - 1 : prev + 1);
  };

  const resetPeriod = () => {
    setDateOffset(0);
  };

  const TimeframeSelector = () => (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1 overflow-x-auto scrollbar-hide">
        {['daily', 'weekly', 'monthly', 'all'].map((id) => (
          <button
            key={id}
            onClick={() => { setTimeframe(id as Timeframe); setDateOffset(0); }}
            className={`px-4 md:px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              timeframe === id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-600 hover:text-white'
            }`}
          >
            {id === 'daily' ? 'Hoje' : id === 'weekly' ? 'Semana' : id === 'monthly' ? 'Mês' : 'Tudo'}
          </button>
        ))}
      </div>

      {timeframe !== 'all' && (
        <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1">
          <button onClick={() => changePeriod('prev')} className="p-2.5 text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <button onClick={resetPeriod} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateOffset === 0 ? 'text-zinc-700 pointer-events-none' : 'text-yellow-500 hover:bg-yellow-500/10'}`}>
            <RotateCcw size={14} className="inline mr-1" /> Atual
          </button>
          <button onClick={() => changePeriod('next')} className="p-2.5 text-zinc-500 hover:text-white transition-colors">
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 px-0 md:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/5 shadow-inner">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white leading-none tracking-tighter uppercase">Painel <span className="text-zinc-600">Master</span></h1>
            <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.3em] mt-2 block">
              {timeframeInfo.label}
            </p>
          </div>
        </div>
        <TimeframeSelector />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={48} className="text-yellow-500" /></div>
           <div className="relative z-10">
             <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10 rounded-lg">
               Lucro Líquido Consolidado
             </span>
             <h3 className={`text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-6 transition-all ${dashboardData.finalConsolidated >= 0 ? 'text-white' : 'text-red-500'}`}>
               {formatBRL(dashboardData.finalConsolidated)}
             </h3>
             <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                 <div className={`w-2 h-2 rounded-full ${dashboardData.finalConsolidated >= 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saldo Real Disponível</span>
               </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6 md:gap-8">
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-center">
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">Retorno Total</span>
             <h3 className="text-4xl md:text-5xl font-black text-emerald-500 tracking-tighter mb-2">
               {formatBRL(isAdmin ? dashboardData.teamTotalReturn : dashboardData.teamTotalReturn)}
             </h3>
             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest uppercase">Volume Bruto em {timeframeInfo.label}</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-center">
             <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 block">Custos Totais</span>
             <h3 className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter mb-2">
               {formatBRL(dashboardData.myExpenses)}
             </h3>
             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest uppercase">Insumos SMS/Proxy no período</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0c0c0c] border border-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem]">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400"><LineChartIcon size={24}/></div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-[0.3em]">Curva de Performance</h4>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Evolução do lucro bruto diário</p>
                </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ffffff03" />
                    <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{fill: '#333', fontSize: 10}} dy={20} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}
                      itemStyle={{ color: '#eab308', fontSize: '12px', fontWeight: '900' }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#eab308" strokeWidth={4} fill="url(#colorProfit)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem]">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400"><BarChart3 size={24}/></div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-[0.3em]">Operadores Ativos</h4>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Volume por membro da equipe</p>
              </div>
           </div>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {dashboardData.barData.length > 0 ? dashboardData.barData.map((op, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-yellow-500/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-xs text-zinc-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors uppercase">
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{op.name}</p>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Comissão: {formatBRL(op.commission)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">{formatBRL(op.netProfit)}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Resultado Banca</p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-700">
                  <RotateCcw size={24} className="mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sem movimentação registrada</p>
                </div>
              )}
           </div>
        </div>
      </section>
    </div>
  );
};
