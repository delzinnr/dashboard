
import React, { useMemo, useState } from 'react';
import { 
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Target,
  Zap,
  LayoutDashboard
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
      default: label = "Período Total";
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

        operatorPerformance.push({
          name: user?.name || opCycles[0]?.operatorName || 'Operador',
          commission: Number(comm.toFixed(2)),
          volume: opRet,
          expenses: opExp,
          netProfit: opNet,
          roi: opInv > 0 ? ((opNet / opInv) * 100).toFixed(1) : '0'
        });
        
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
      barData: operatorPerformance.sort((a,b) => b.commission - a.commission)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin, timeframe, timeframeInfo]);

  const TimeframeSelector = () => (
    <div className="flex bg-[#0c0c0c] p-1.5 rounded-2xl border border-white/5 gap-1">
      {['daily', 'weekly', 'monthly', 'all'].map((id) => (
        <button
          key={id}
          onClick={() => setTimeframe(id as Timeframe)}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            timeframe === id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-600 hover:text-white'
          }`}
        >
          {id === 'daily' ? 'Hoje' : id === 'weekly' ? 'Semana' : id === 'monthly' ? 'Mês' : 'Tudo'}
        </button>
      ))}
    </div>
  );

  const AdminPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl min-w-[240px]">
          <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
             <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black">
               {data.name.charAt(0)}
             </div>
             <div>
               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Operador Ativo</p>
               <p className="text-base font-black text-white">{data.name}</p>
             </div>
          </div>
          
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Volume Bruto</span>
              <span className="text-xs font-black text-white">{formatBRL(data.volume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Despesas SMS/Proxy</span>
              <span className="text-xs font-black text-red-500">-{formatBRL(data.expenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Lucro da Banca</span>
              <span className="text-xs font-black text-emerald-500">{formatBRL(data.netProfit)}</span>
            </div>
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter">Sua Comissão</span>
              <span className="text-lg font-black text-yellow-500">{formatBRL(data.commission)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
            {payload[0].payload.date || payload[0].payload.name}
          </p>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Resultado:</p>
            <p className="text-base font-black text-yellow-500">
              {formatBRL(payload[0].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-[1.25rem] flex items-center justify-center text-yellow-500 border border-yellow-500/10">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-none tracking-tighter">Resumo Executivo</h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 ml-1">Análise de Performance {timeframeInfo.label}</p>
            </div>
          </div>
        </div>
        <TimeframeSelector />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-12 rounded-[3rem] relative overflow-hidden group hover:border-yellow-500/20 transition-all duration-500">
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/5 blur-[120px] rounded-full"></div>
           <div className="relative z-10">
             <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 rounded-full">
               <Zap size={12} fill="currentColor" /> {isAdmin ? 'Consolidado da Rede' : 'Seu Resultado Final'}
             </span>
             <h3 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-6">
               {formatBRL(dashboardData.finalConsolidated)}
             </h3>
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${dashboardData.finalConsolidated >= 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                 {isAdmin ? 'Volume total processado por sua equipe' : 'Lucro líquido após comissões e gastos'}
               </p>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-8">
          {!isAdmin && (
            <div className="flex-1 bg-blue-600/5 border border-blue-600/10 p-10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block">Sua Comissão Gerada</span>
                <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg shadow-lg shadow-blue-600/20">{dashboardData.myCommissionRate}%</span>
              </div>
              <h3 className="text-5xl font-black text-blue-500 tracking-tighter mb-2">
                {formatBRL(dashboardData.myGeneratedCommission)}
              </h3>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Calculado sobre o lucro operacional</p>
            </div>
          )}

          <div className={`flex-1 bg-red-600/5 border border-red-600/10 p-10 rounded-[2.5rem] flex flex-col justify-center ${isAdmin ? 'h-full' : ''}`}>
             <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 block">Custos Totais</span>
             <h3 className="text-5xl font-black text-red-500 tracking-tighter mb-2">
               {formatBRL(dashboardData.myExpenses)}
             </h3>
             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Insumos e Manutenção</p>
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.02] transition-all">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Ganhos em Comissões</p>
              <h4 className="text-4xl font-black text-purple-500 tracking-tighter">{formatBRL(dashboardData.teamCommissions)}</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500"><TrendingUp size={28}/></div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.02] transition-all">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Volume de Retorno</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">{formatBRL(dashboardData.teamTotalReturn)}</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white"><ArrowUpRight size={28}/></div>
          </div>
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between hover:bg-white/[0.02] transition-all">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase mb-3 tracking-widest">Total Investido</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">{formatBRL(dashboardData.teamTotalInvested)}</h4>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white"><Target size={28}/></div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-12 rounded-[3rem]">
           <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl text-yellow-500 flex items-center justify-center"><LineChartIcon size={24}/></div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-[0.3em]">Crescimento Operacional</h4>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Variação de lucro bruto por período</p>
              </div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ffffff03" />
                    <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10}} dy={20} />
                    <YAxis 
                      tickFormatter={(val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#444', fontSize: 9}} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#eab308', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="profit" stroke="#eab308" strokeWidth={5} fill="url(#colorProfit)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-12 rounded-[3rem] flex flex-col">
           <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl text-purple-500 flex items-center justify-center"><BarChart3 size={24}/></div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-[0.3em]">Ranking da Equipe</h4>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Classificado por comissão</p>
                </div>
              </div>
           </div>
           
           <div className="h-[300px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                    layout="vertical" 
                    data={isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-6)}
                    margin={{ left: 0, right: 30 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category"
                      dataKey={isAdmin ? "name" : "displayName"}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#666', fontSize: 10, fontWeight: 'bold'}}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{fill: '#ffffff03'}}
                      content={isAdmin ? <AdminPerformanceTooltip /> : <CustomTooltip />}
                    />
                    <Bar 
                      dataKey={isAdmin ? "commission" : "profit"} 
                      radius={[0, 10, 10, 0]} 
                      barSize={20}
                    >
                       {(isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-6)).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isAdmin ? '#a855f7' : '#eab308'} 
                          />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>

           {isAdmin && dashboardData.barData.length > 0 && (
             <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
               <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">MVP de Volume</span>
                  </div>
                  <span className="text-xs font-black text-white">{dashboardData.barData[0].name}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-purple-500" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tíquete Médio</span>
                  </div>
                  <span className="text-xs font-black text-white">
                    {formatBRL(dashboardData.teamCommissions / dashboardData.barData.length)}
                  </span>
               </div>
             </div>
           )}
        </div>
      </section>
    </div>
  );
};
