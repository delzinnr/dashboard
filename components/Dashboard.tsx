
import React, { useMemo } from 'react';
import { 
  Shield, 
  DollarSign, 
  Briefcase, 
  Target, 
  Users, 
  TrendingUp, 
  Wallet,
  LineChart as LineChartIcon,
  BarChart3
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
import { Role, Cycle, Cost, User } from '../types';

interface DashboardProps {
  cycles: Cycle[];
  costs: Cost[];
  userRole: Role;
  currentUserId: string;
  teamMembers: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cycles, costs, userRole, currentUserId, teamMembers }) => {
  const isAdmin = userRole === 'admin';
  
  // Formatação estrita com 2 casas decimais
  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const dashboardData = useMemo(() => {
    const myCycles = cycles.filter(c => c.operatorId === currentUserId);
    const visibleCostsForExpensesCard = isAdmin 
      ? costs.filter(c => c.operatorId === currentUserId) 
      : costs.filter(c => c.operatorId === currentUserId);

    const dataByDate: Record<string, { date: string, net: number, gross: number, costs: number, commission: number }> = {};
    const operatorStats: Record<string, { name: string, value: number }> = {};

    const allDates = Array.from(new Set([...cycles.map(c => c.date), ...costs.map(c => c.date)]));

    allDates.forEach(date => {
      if (!dataByDate[date]) dataByDate[date] = { date, net: 0, gross: 0, costs: 0, commission: 0 };
      
      const operatorsInDay = new Set([
        ...cycles.filter(c => c.date === date).map(c => c.operatorId),
        ...costs.filter(c => c.date === date).map(c => c.operatorId)
      ]);

      operatorsInDay.forEach(opId => {
        const user = teamMembers.find(u => u.id === opId) || (opId === currentUserId ? teamMembers.find(u => u.id === currentUserId) : null);
        const rate = user?.commission || 0;
        
        const opGross = cycles.filter(c => c.date === date && c.operatorId === opId).reduce((acc, c) => acc + (c.return - c.invested), 0);
        const opCosts = costs.filter(c => c.date === date && c.operatorId === opId).reduce((acc, c) => acc + c.amount, 0);
        
        const base = opGross - opCosts;
        const commValue = base > 0 ? (base * (rate / 100)) : 0;
        const netValue = base - commValue;

        dataByDate[date].gross += opGross;
        dataByDate[date].costs += opCosts;
        
        if (isAdmin) {
          const isMe = opId === currentUserId;
          const myContribution = isMe ? (opGross - opCosts) : commValue;
          dataByDate[date].net += myContribution;
          
          if (!isMe) {
            if (!operatorStats[opId]) operatorStats[opId] = { name: user?.name || 'Operador', value: 0 };
            operatorStats[opId].value += commValue;
          }
        } else {
          if (opId === currentUserId) {
            dataByDate[date].net += netValue;
          }
        }
      });
    });

    const sortedChartData = Object.keys(dataByDate).sort((a, b) => {
      const [da, ma, aa] = a.split('/').map(Number);
      const [db, mb, ab] = b.split('/').map(Number);
      return new Date(aa, ma-1, da).getTime() - new Date(ab, mb-1, db).getTime();
    }).map(d => ({
      ...dataByDate[d],
      displayName: d.split('/')[0] + '/' + d.split('/')[1]
    }));

    const personalInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const totalCommissionsReceived = Object.values(operatorStats).reduce((acc, o) => acc + o.value, 0);
    const finalNetResult = sortedChartData.reduce((acc, d) => acc + d.net, 0);
    const totalExpensesPeriod = visibleCostsForExpensesCard.reduce((acc, c) => acc + c.amount, 0);

    return {
      finalNetResult,
      totalExpensesPeriod,
      personalNet: isAdmin ? (finalNetResult - totalCommissionsReceived) : finalNetResult,
      personalROI: personalInvested > 0 ? (((isAdmin ? (finalNetResult - totalCommissionsReceived) : finalNetResult) / personalInvested) * 100) : 0,
      personalInvested,
      totalCommissionsReceived,
      teamReturnTotal: cycles.reduce((acc, c) => acc + c.return, 0),
      teamInvestedTotal: cycles.reduce((acc, c) => acc + c.invested, 0),
      chartData: sortedChartData,
      barData: Object.values(operatorStats).filter(o => o.value !== 0)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between gap-10">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Movimentado:</span>
              <span className="text-xs font-black text-white">{formatBRL(data.gross)}</span>
            </div>
            <div className="h-px bg-white/5 my-1" />
            <div className="flex justify-between gap-10">
              <span className="text-[10px] text-yellow-500 font-black uppercase">Saldo Líquido:</span>
              <span className="text-xs font-black text-yellow-500">{formatBRL(data.net)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 pt-4">
      
      {/* SEÇÃO 1: VISÃO CONSOLIDADA */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Shield size={14} className="text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Visão Consolidada</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0c0c0c] to-[#080808] border border-yellow-500/20 p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[220px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[80px] -mr-32 -mt-32 group-hover:bg-yellow-500/10 transition-all duration-1000"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                <Shield size={24} />
              </div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Resultado Líquido Final</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-1 drop-shadow-lg">
                {formatBRL(dashboardData.finalNetResult)}
              </h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">Saldo Real (Ganhos + Comissões - Custos Operacionais)</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c0c0c] to-[#080808] border border-red-500/10 p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[220px] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 blur-[60px] -mr-24 -mt-24 group-hover:bg-red-500/10 transition-all duration-1000"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Gastos Operacionais</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black text-red-500 tracking-tighter mb-1">
                {formatBRL(dashboardData.totalExpensesPeriod)}
              </h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">Despesas do Período</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: MINHA OPERAÇÃO */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Briefcase size={14} className="text-blue-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Minha Operação (Pessoal)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] hover:border-emerald-500/30 transition-all shadow-lg">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/10">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Lucro Pessoal</p>
              <h4 className="text-3xl font-black text-white tracking-tight">{formatBRL(dashboardData.personalNet)}</h4>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] hover:border-blue-500/30 transition-all shadow-lg">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/10">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">ROI Pessoal</p>
              <h4 className="text-3xl font-black text-blue-500 tracking-tight">{dashboardData.personalROI.toFixed(2)}%</h4>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-zinc-500/30 transition-all shadow-lg">
             <div className="absolute right-8 bottom-8 text-white/5 group-hover:text-white/10 transition-colors">
                <Wallet size={64} />
             </div>
             <div>
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Capital Investido Próprio</p>
               <h4 className="text-3xl font-black text-white tracking-tight">{formatBRL(dashboardData.personalInvested)}</h4>
             </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: PERFORMANCE DA EQUIPE */}
      {isAdmin && (
        <section className="space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Users size={14} className="text-purple-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Performance da Equipe (Rede)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0c0c0c] border border-purple-500/10 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] hover:border-purple-500/30 transition-all shadow-lg">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/10">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Comissões Recebidas</p>
                <h4 className="text-3xl font-black text-purple-500 tracking-tight">{formatBRL(dashboardData.totalCommissionsReceived)}</h4>
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] hover:border-zinc-500/30 transition-all shadow-lg">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border border-white/5">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Volume Retorno Total</p>
                <h4 className="text-3xl font-black text-white tracking-tight">{formatBRL(dashboardData.teamReturnTotal)}</h4>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-zinc-500/30 transition-all shadow-lg">
               <div className="absolute right-8 bottom-8 text-white/5 group-hover:text-white/10 transition-colors">
                  <Users size={64} />
               </div>
               <div>
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Capital Total Girado (Rede)</p>
                 <h4 className="text-3xl font-black text-zinc-400 tracking-tight">{formatBRL(dashboardData.teamInvestedTotal)}</h4>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO 4: GRÁFICOS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/10"><LineChartIcon size={18} /></div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Evolução de Saldo Diário</h4>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Desempenho Financeiro Temporal</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.chartData}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="displayName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#444', fontSize: 10, fontWeight: 700}}
                  dy={15}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#eab308" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 border border-purple-500/10"><BarChart3 size={18} /></div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                {isAdmin ? 'Ranking de Comissões' : 'Histórico Recente'}
              </h4>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Performance Comparativa</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-7)}>
                <XAxis 
                  dataKey={isAdmin ? "name" : "displayName"} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#444', fontSize: 9, fontWeight: 800}}
                  dy={10}
                />
                <Tooltip 
                  cursor={{fill: 'white', opacity: 0.05}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black text-white uppercase">{formatBRL(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey={isAdmin ? "value" : "net"} radius={[8, 8, 0, 0]} animationDuration={1500}>
                  {(isAdmin ? dashboardData.barData : dashboardData.chartData.slice(-7)).map((entry, index) => (
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
