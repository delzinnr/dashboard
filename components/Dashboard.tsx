
import React, { useMemo, useState } from 'react';
import { 
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Percent,
  TrendingUp
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

const formatBRL = (val: number | undefined | null) => 
  (val ?? 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f0f0f] border-2 border-white/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2">
          {data.dateLabel || label}
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1 text-white/50">Variação Líquida do Dia</p>
            <p className={`text-sm font-black ${data.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatBRL(data.profit)}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-[8px] font-black text-yellow-500 uppercase tracking-widest leading-none mb-1">Saldo Real Acumulado</p>
            <p className="text-xl font-black text-white leading-none tracking-tighter">
              {formatBRL(payload[0].value)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label, isAdmin }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f0f] border-2 border-white/20 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-2">{label}</p>
        <div>
          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">
            {isAdmin ? 'Comissão Gerada' : 'Lucro Líquido'}
          </p>
          <p className={`text-base font-black ${isAdmin ? 'text-yellow-500' : (payload[0].value >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
            {formatBRL(payload[0].value)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ cycles, costs, userRole, currentUserId, teamMembers }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [dateOffset, setDateOffset] = useState(0); 
  const isAdmin = userRole === 'admin';

  const timeframeInfo = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(now);

    if (timeframe === 'daily') {
      targetDate.setDate(now.getDate() + dateOffset);
    } else if (timeframe === 'weekly') {
      targetDate.setDate(now.getDate() + (dateOffset * 7));
    } else if (timeframe === 'monthly') {
      targetDate.setMonth(now.getMonth() + dateOffset);
    }

    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    let label = '';
    const isPresent = dateOffset === 0;

    switch(timeframe) {
      case 'daily': label = isPresent ? "Hoje" : formatDate(targetDate); break;
      case 'weekly': label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`; break;
      case 'monthly': label = targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }); break;
      default: label = "Histórico Completo";
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

    // Cálculos Operador
    const myCycles = filteredCycles.filter(c => c.operatorId === currentUserId);
    const myCosts = filteredCosts.filter(c => c.operatorId === currentUserId);
    const myGrossReturn = myCycles.reduce((acc, c) => acc + c.return, 0);
    const myInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const myExpenses = myCosts.reduce((acc, c) => acc + c.amount, 0);
    const myOpProfit = (myGrossReturn - myInvested) - myExpenses;

    const currentUserProfile = teamMembers.find(u => u.id === currentUserId);
    const myRate = currentUserProfile?.commission || 0;
    const myGeneratedComm = myOpProfit > 0 ? (myOpProfit * (myRate / 100)) : 0;

    let teamCommsTotal = 0;
    let totalReturnVal = 0;
    let opPerf: any[] = [];

    if (isAdmin) {
      const uniqueOpIds = new Set(filteredCycles.map(c => c.operatorId));
      uniqueOpIds.forEach(opId => {
        const user = teamMembers.find(u => u.id === opId);
        const rate = user?.commission || 0;
        const opC = filteredCycles.filter(fc => fc.operatorId === opId);
        const opE = filteredCosts.filter(fc => fc.operatorId === opId).reduce((acc, c) => acc + c.amount, 0);
        const r = opC.reduce((acc, c) => acc + c.return, 0);
        const i = opC.reduce((acc, c) => acc + c.invested, 0);
        const n = (r - i) - opE;
        const comm = n > 0 ? (n * (rate / 100)) : 0;
        if (r > 0 || i > 0 || opE > 0) {
          opPerf.push({ name: user?.name || 'Operador', netProfit: n, commission: comm });
          teamCommsTotal += comm;
          totalReturnVal += r;
        }
      });
    }

    // Lógica para Gráfico de Evolução (Saldo Real Líquido)
    const datesSet = new Set([...filteredCycles.map(c => c.date), ...filteredCosts.map(c => c.date)]);
    const chartDataMap: Record<string, any> = {};

    datesSet.forEach(dateStr => {
      const dayCycles = filteredCycles.filter(c => c.date === dateStr);
      const dayCosts = filteredCosts.filter(c => c.date === dateStr);
      let dayDelta = 0;

      if (isAdmin) {
        // Lucro próprio do admin no dia
        const myDayCycles = dayCycles.filter(c => c.operatorId === currentUserId);
        const myDayCosts = dayCosts.filter(c => c.operatorId === currentUserId);
        const myDayGross = myDayCycles.reduce((acc, c) => acc + (c.return - c.invested), 0);
        const myDayExp = myDayCosts.reduce((acc, c) => acc + c.amount, 0);
        
        // Comissões recebidas no dia de outros operadores
        let dayCommsReceived = 0;
        teamMembers.forEach(member => {
          if (member.id === currentUserId) return;
          const opDayCycles = dayCycles.filter(c => c.operatorId === member.id);
          const opDayCosts = dayCosts.filter(c => c.operatorId === member.id);
          const opDayGross = opDayCycles.reduce((acc, c) => acc + (c.return - c.invested), 0);
          const opDayExp = opDayCosts.reduce((acc, c) => acc + c.amount, 0);
          const opDayNet = opDayGross - opDayExp;
          if (opDayNet > 0) {
            dayCommsReceived += opDayNet * (member.commission / 100);
          }
        });

        dayDelta = (myDayGross - myDayExp) + dayCommsReceived;
      } else {
        // Lucro líquido do operador no dia (já descontando o que paga de comissão)
        const myDayCycles = dayCycles.filter(c => c.operatorId === currentUserId);
        const myDayCosts = dayCosts.filter(c => c.operatorId === currentUserId);
        const myDayGross = myDayCycles.reduce((acc, c) => acc + (c.return - c.invested), 0);
        const myDayExp = myDayCosts.reduce((acc, c) => acc + c.amount, 0);
        const myDayNet = myDayGross - myDayExp;
        const myDayCommToPay = myDayNet > 0 ? myDayNet * (myRate / 100) : 0;
        
        dayDelta = myDayNet - myDayCommToPay;
      }

      chartDataMap[dateStr] = {
        dateLabel: dateStr,
        displayName: dateStr.split('/')[0] + '/' + dateStr.split('/')[1],
        profit: dayDelta,
        rawDate: parseDate(dateStr)
      };
    });

    const sortedDates = Object.values(chartDataMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    let cumulative = 0;
    const chartData = sortedDates.map(d => {
      cumulative += d.profit;
      return { ...d, cumulativeProfit: cumulative };
    });

    return {
      finalRealProfit: isAdmin ? (myOpProfit + teamCommsTotal) : (myOpProfit - myGeneratedComm),
      commissionToShow: isAdmin ? teamCommsTotal : myGeneratedComm,
      totalReturnVal: isAdmin ? totalReturnVal : myGrossReturn,
      totalExpenses: filteredCosts.reduce((acc, c) => acc + c.amount, 0),
      chartData,
      opPerf: opPerf.sort((a,b) => b.commission - a.commission)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin, timeframe, timeframeInfo]);

  const changePeriod = (dir: 'prev' | 'next') => setDateOffset(prev => dir === 'prev' ? prev - 1 : prev + 1);
  const resetPeriod = () => setDateOffset(0);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Finance <span className="text-zinc-600">Master</span></h1>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1 italic">{timeframeInfo.label}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto w-full md:w-auto">
            {['daily', 'weekly', 'monthly', 'all'].map((id) => (
              <button
                key={id}
                onClick={() => { setTimeframe(id as Timeframe); setDateOffset(0); }}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  timeframe === id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {id === 'daily' ? 'Hoje' : id === 'weekly' ? 'Semana' : id === 'monthly' ? 'Mês' : 'Histórico'}
              </button>
            ))}
          </div>

          {timeframe !== 'all' && (
            <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/10 gap-1 w-full md:w-auto justify-center">
              <button onClick={() => changePeriod('prev')} className="p-2.5 text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={resetPeriod} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${dateOffset === 0 ? 'text-zinc-700 pointer-events-none' : 'text-yellow-500'}`}><RotateCcw size={14} className="inline mr-1"/> Atual</button>
              <button onClick={() => changePeriod('next')} className="p-2.5 text-zinc-400 hover:text-white transition-colors"><ChevronRight size={16}/></button>
            </div>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500"><Zap size={64} className="text-yellow-500" /></div>
           <div className="relative z-10">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 block">Saldo Real Consolidado</span>
             <h3 className={`text-5xl md:text-8xl font-black tracking-tighter mb-4 ${dashboardData.finalRealProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
               {formatBRL(dashboardData.finalRealProfit)}
             </h3>
             <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full">
                   <div className={`w-2 h-2 rounded-full ${dashboardData.finalRealProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                   <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Saldo Líquido</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/10 rounded-full">
                   <Percent size={10} className="text-yellow-500" />
                   <span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest">
                     {isAdmin ? 'Total Comissões' : 'Minha Comissão'}: {formatBRL(dashboardData.commissionToShow)}
                   </span>
                </div>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.02] transition-colors">
             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 block">Volume Bruto</span>
             <h3 className="text-3xl font-black text-white">{formatBRL(dashboardData.totalReturnVal)}</h3>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.02] transition-colors">
             <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 block">Custos Gerais</span>
             <h3 className="text-3xl font-black text-white">{formatBRL(dashboardData.totalExpenses)}</h3>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0c0c0c] border border-white/10 p-8 md:p-10 rounded-[2.5rem] h-[450px] flex flex-col">
           <div className="flex justify-between items-start mb-10">
              <div>
                <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-2">
                  <LineChartIcon size={14} className="text-yellow-500" /> Evolução do Saldo Líquido
                </h4>
                <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">Patrimônio Real Acumulado no Período</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white">{formatBRL(dashboardData.finalRealProfit)}</span>
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Fechamento</p>
              </div>
           </div>
           <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis 
                      dataKey="displayName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#ffffff', fontSize: 10, fontWeight: 800}} 
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 2 }} />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeProfit" 
                      stroke="#eab308" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                      animationDuration={1500}
                      dot={{ r: 4, fill: '#eab308', strokeWidth: 2, stroke: '#0a0a0a' }}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#eab308', strokeWidth: 2 }}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/10 p-8 md:p-10 rounded-[2.5rem] h-[450px] flex flex-col">
           <div className="flex justify-between items-start mb-8">
             <div>
              <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-2">
                <BarChart3 size={14} className="text-yellow-500" /> Performance da Equipe
              </h4>
              <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">
                {isAdmin ? 'Comissões geradas por operador' : 'Performance Individual Líquida'}
              </p>
             </div>
             <TrendingUp size={20} className="text-emerald-500 opacity-30" />
           </div>
           
           <div className="flex-1 w-full overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.opPerf} layout="vertical" margin={{ left: -5, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#ffffff', fontSize: 11, fontWeight: 900}}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                      content={<CustomBarTooltip isAdmin={isAdmin} />}
                    />
                    <Bar 
                      dataKey={isAdmin ? "commission" : "netProfit"} 
                      radius={[0, 8, 8, 0]} 
                      barSize={20}
                    >
                      {dashboardData.opPerf.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isAdmin ? '#eab308' : (entry.netProfit >= 0 ? '#10b981' : '#ef4444')} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {dashboardData.opPerf.length > 0 ? dashboardData.opPerf.slice(0, 3).map((op, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center font-black text-[10px] text-white">
                          {op.name.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-white">{op.name}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black ${isAdmin ? 'text-yellow-500' : 'text-emerald-500'}`}>
                          {formatBRL(isAdmin ? op.commission : op.netProfit)}
                        </p>
                        <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">
                          {isAdmin ? 'Comissão' : 'Líquido'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-4 text-zinc-700">
                      <p className="text-[9px] font-black uppercase tracking-widest italic">Aguardando novos ciclos...</p>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};
