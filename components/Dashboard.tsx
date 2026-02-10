import React, { useMemo } from 'react';
import { 
  Shield, 
  DollarSign, 
  Briefcase, 
  Target, 
  Users, 
  TrendingUp, 
  Wallet,
  Receipt,
  ArrowUpRight,
  Gem,
  BarChart3,
  LineChart as LineChartIcon,
  LayoutGrid
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
  
  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const dashboardData = useMemo(() => {
    // 1. DADOS PESSOAIS (Gerente ou Operador Logado)
    const myCycles = cycles.filter(c => c.operatorId === currentUserId);
    const myCosts = costs.filter(c => c.operatorId === currentUserId);
    
    const myGrossReturn = myCycles.reduce((acc, c) => acc + c.return, 0);
    const myInvested = myCycles.reduce((acc, c) => acc + c.invested, 0);
    const myExpenses = myCosts.reduce((acc, c) => acc + c.amount, 0);
    
    // Lucro Pessoal = (Retorno - Investimento) - Despesas
    const myPersonalProfit = (myGrossReturn - myInvested) - myExpenses;
    const myROI = myInvested > 0 ? (myPersonalProfit / myInvested) * 100 : 0;

    // 2. DADOS DA EQUIPE (Apenas se for Admin)
    let teamCommissions = 0;
    let teamTotalReturn = 0;
    let teamTotalInvested = 0;
    const operatorPerformance: Record<string, { name: string, value: number }> = {};

    if (isAdmin) {
      const teamCycles = cycles.filter(c => c.operatorId !== currentUserId);
      const teamCosts = costs.filter(c => c.operatorId !== currentUserId);

      // Agrupar por operador e data para calcular comissão sobre a base líquida diária
      // Fixed: explicitly typed the Set as string to avoid 'unknown' inference in some TS environments
      const operators = new Set<string>(teamCycles.map(c => c.operatorId));
      
      // Fixed: explicitly typed opId as string to fix index signature errors
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

    // 3. RESULTADO LÍQUIDO FINAL CONSOLIDADO
    // Se Admin: Lucro Pessoal + Comissões
    // Se Operador: Lucro Pessoal - Comissão que pagou (já deduzido na lógica anterior do app, mas aqui recalculamos)
    let finalConsolidated = 0;
    if (isAdmin) {
      finalConsolidated = myPersonalProfit + teamCommissions;
    } else {
      // Para o operador, a "Comissão" é um custo.
      const user = teamMembers.find(u => u.id === currentUserId);
      const rate = user?.commission || 0;
      const myNetBase = (myGrossReturn - myInvested) - myExpenses;
      const myCommissionPaid = myNetBase > 0 ? (myNetBase * (rate / 100)) : 0;
      finalConsolidated = myNetBase - myCommissionPaid;
    }

    // Gráfico de Evolução (simplificado por data)
    const chartDataMap: Record<string, any> = {};
    // Fixed: explicitly typed the Set as string to avoid 'unknown' inference
    const allDates = Array.from(new Set<string>(cycles.map(c => c.date)));
    // Fixed: explicitly typed date as string to resolve 'split' and index errors
    allDates.forEach((date: string) => {
      const dayCycles = cycles.filter(c => c.date === date);
      const dayCosts = costs.filter(c => c.date === date);
      
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
      chartData: Object.values(chartDataMap).sort((a,b) => a.date.localeCompare(b.date)),
      barData: Object.values(operatorPerformance)
    };
  }, [cycles, costs, currentUserId, teamMembers, isAdmin]);

  return (
    <div className="space-y-12 pb-24 pt-6 animate-in fade-in duration-700">
      
      {/* SEÇÃO 1: VISÃO CONSOLIDADA */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Shield size={14} className="text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Visão Consolidada</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0c0c0c] border border-yellow-500/10 p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[260px] relative overflow-hidden group">
            <div className="absolute top-8 right-10">
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full">Resultado Líquido Final</span>
            </div>
            <div className="relative z-10">
               <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 mb-6">
                 <Shield size={24} />
               </div>
               <h3 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-2">
                 {formatBRL(dashboardData.finalConsolidated)}
               </h3>
               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Saldo Real (Ganhos + Comissões - Custos Operacionais)</p>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[260px] relative group">
             <div className="absolute top-8 right-10">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Gastos Operacionais</span>
            </div>
            <div className="relative z-10">
               <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-6">
                 <DollarSign size={24} />
               </div>
               <h3 className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter mb-2">
                 {formatBRL(dashboardData.myExpenses)}
               </h3>
               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Despesas do Período</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: MINHA OPERAÇÃO */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Briefcase size={14} className="text-blue-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Minha Operação (Pessoal)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px]">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Lucro Pessoal</p>
              <h4 className={`text-3xl font-black tracking-tight ${dashboardData.myPersonalProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                {formatBRL(dashboardData.myPersonalProfit)}
              </h4>
            </div>
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px]">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">ROI Pessoal</p>
              <h4 className="text-3xl font-black text-blue-500 tracking-tight">{dashboardData.myROI.toFixed(2)}%</h4>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Capital Investido Próprio</p>
              <h4 className="text-4xl font-black text-white tracking-tight">{formatBRL(dashboardData.myInvested)}</h4>
            </div>
            <div className="absolute right-8 bottom-8 opacity-5">
              <Wallet size={60} />
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: PERFORMANCE DA EQUIPE (Apenas Admin) */}
      {isAdmin && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Users size={14} className="text-purple-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Performance da Equipe (Rede)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0c0c0c] border border-purple-500/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px]">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-4">
                <Gem size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Comissões Recebidas</p>
                <h4 className="text-3xl font-black text-purple-500 tracking-tight">{formatBRL(dashboardData.teamCommissions)}</h4>
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px]">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mb-4">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Volume Retorno Total</p>
                <h4 className="text-3xl font-black text-white tracking-tight">{formatBRL(dashboardData.teamTotalReturn)}</h4>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between min-h-[180px] relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Capital Total Girado (Rede)</p>
                <h4 className="text-4xl font-black text-white tracking-tight">{formatBRL(dashboardData.teamTotalInvested)}</h4>
              </div>
              <div className="absolute right-8 bottom-8 opacity-5">
                <Users size={64} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEÇÃO 4: GRÁFICOS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 p-10 rounded-[3rem] shadow-xl">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><LineChartIcon size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest">Fluxo Operacional de Lucro</h4>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dashboardData.chartData}>
                    <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                    <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10}} dy={15} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black border border-white/10 p-4 rounded-xl shadow-2xl">
                              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{payload[0].payload.date}</p>
                              <p className="text-sm font-black text-yellow-500">{formatBRL(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#eab308" strokeWidth={3} fill="url(#colorProfit)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[3rem] shadow-xl">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><BarChart3 size={20}/></div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest">Ranking de Comissões</h4>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={dashboardData.barData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10}} dy={10} />
                    <Tooltip cursor={{fill: 'white', opacity: 0.02}} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1500}>
                       {dashboardData.barData.map((_, index) => (
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