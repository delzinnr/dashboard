
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CyclesView } from './components/CyclesView';
import { TeamView } from './components/TeamView';
import { LoginView } from './components/LoginView';
import { CostsView } from './components/CostsView';
import { View, Cycle, User, Cost } from './types';
import { db } from './db';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedUser = localStorage.getItem('fm_current_user') || sessionStorage.getItem('fm_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
      }

      const [fetchedUsers, fetchedCycles, fetchedCosts] = await Promise.all([
        db.getUsers(),
        db.getCycles(),
        db.getCosts()
      ]);
      setUsers(fetchedUsers);
      setCycles(fetchedCycles);
      setCosts(fetchedCosts);
    } catch (error) {
      console.error("Erro ao carregar dados do servidor:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleLogin = (user: User, remember: boolean) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setCurrentView('dashboard');
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('fm_is_logged', 'true');
    storage.setItem('fm_current_user', JSON.stringify(user));
    loadAllData();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('fm_is_logged');
    localStorage.removeItem('fm_current_user');
    sessionStorage.removeItem('fm_is_logged');
    sessionStorage.removeItem('fm_current_user');
  };

  const handleExportData = async () => {
    setIsSyncing(true);
    try {
      const data = await db.exportFullBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-smk-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert('Erro ao exportar dados.');
    }
    setIsSyncing(false);
  };

  const handleImportData = async (file: File) => {
    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await db.importBackup(json);
        await loadAllData();
        alert('Dados sincronizados com o banco de dados!');
      } catch (err) {
        alert('Erro ao importar arquivo.');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const myAdminId = useMemo(() => {
    if (!currentUser) return '';
    return currentUser.role === 'admin' ? currentUser.id : (currentUser.parentId || '');
  }, [currentUser]);

  const addOrUpdateCycle = async (cycleData: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => {
    if (!currentUser || !myAdminId) return;
    setIsSyncing(true);
    try {
      const grossProfit = cycleData.return - cycleData.invested;
      const commValue = grossProfit > 0 ? (grossProfit * (currentUser.commission / 100)) : 0;
      const netProfit = grossProfit - commValue;
      
      const cycle: Cycle = {
        ...cycleData,
        id: existingId || `c-${Date.now()}`,
        profit: Number(netProfit.toFixed(2)),
        commissionValue: Number(commValue.toFixed(2)),
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        ownerAdminId: myAdminId
      };
      
      await db.saveCycle(cycle);
      
      if (existingId) {
        setCycles(prev => prev.map(c => c.id === existingId ? cycle : c));
      } else {
        setCycles(prev => [cycle, ...prev]);
      }
    } catch (err: any) {
      alert(`Erro ao salvar no servidor: ${err.message || 'Verifique se as novas colunas foram adicionadas ao Supabase.'}`);
    }
    setIsSyncing(false);
  };

  const addCost = async (newCost: Omit<Cost, 'id' | 'operatorId' | 'operatorName' | 'ownerAdminId'>) => {
    if (!currentUser || !myAdminId) return;
    setIsSyncing(true);
    try {
      const cost: Cost = {
        ...newCost,
        id: `exp-${Date.now()}`,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        ownerAdminId: myAdminId
      };
      await db.saveCost(cost);
      setCosts(prev => [cost, ...prev]);
    } catch (err) {
      alert('Erro ao salvar custo no servidor.');
    }
    setIsSyncing(false);
  };

  const deleteCost = async (id: string) => {
    if (!confirm('Excluir este custo permanentemente do banco?')) return;
    setIsSyncing(true);
    try {
      await db.deleteCost(id);
      setCosts(prev => prev.filter(c => c.id !== id));
    } catch (err) { alert('Erro ao excluir no servidor.'); }
    setIsSyncing(false);
  };

  const deleteCycle = async (id: string) => {
    if (!confirm('Excluir este ciclo permanentemente do banco?')) return;
    setIsSyncing(true);
    try {
      await db.deleteCycle(id);
      setCycles(prev => prev.filter(c => c.id !== id));
    } catch (err) { 
      console.error(err);
      alert('Erro ao excluir no servidor.'); 
    }
    setIsSyncing(false);
  };

  const updateCommission = async (userId: string, newCommission: number) => {
    setIsSyncing(true);
    try {
      const allUsers = await db.getUsers();
      const updatedAllUsers = allUsers.map(u => u.id === userId ? { ...u, commission: newCommission } : u);
      await db.saveUsers(updatedAllUsers);
      setUsers(updatedAllUsers);
      
      const allCycles = await db.getCycles();
      const updatedAllCycles = allCycles.map(c => {
        if (c.operatorId === userId) {
          const grossProfit = c.return - c.invested;
          const newCommValue = grossProfit > 0 ? (grossProfit * (newCommission / 100)) : 0;
          const newNetProfit = grossProfit - newCommValue;
          return { 
            ...c, 
            commissionValue: Number(newCommValue.toFixed(2)),
            profit: Number(newNetProfit.toFixed(2))
          };
        }
        return c;
      });
      await db.saveAllCycles(updatedAllCycles);
      setCycles(updatedAllCycles);
    } catch (err) { alert('Erro ao atualizar no servidor.'); }
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-yellow-500 mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Conectando ao Servidor...</p>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) return <LoginView onLogin={handleLogin} />;

  const filteredCycles = currentUser.role === 'admin' 
    ? cycles.filter(c => c.ownerAdminId === currentUser.id)
    : cycles.filter(c => c.operatorId === currentUser.id);

  const filteredCosts = currentUser.role === 'admin' 
    ? costs.filter(c => c.ownerAdminId === currentUser.id)
    : costs.filter(c => c.operatorId === currentUser.id);

  const myTeam = users.filter(u => u.parentId === currentUser.id);

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      isSyncing={isSyncing}
      onExportData={handleExportData}
      onImportData={handleImportData}
    >
      {currentView === 'dashboard' && <Dashboard cycles={filteredCycles} costs={filteredCosts} userRole={currentUser.role} currentUserId={currentUser.id} />}
      {currentView === 'cycles' && <CyclesView cycles={filteredCycles} onAddCycle={addOrUpdateCycle} onDeleteCycle={deleteCycle} userRole={currentUser.role} />}
      {currentView === 'costs' && <CostsView costs={filteredCosts} onAddCost={addCost} onDeleteCost={deleteCost} userRole={currentUser.role} />}
      {currentView === 'team' && currentUser.role === 'admin' && (
        <TeamView 
          users={myTeam} 
          onUpdateCommission={updateCommission} 
          onAddOperator={async (u) => {
            setIsSyncing(true);
            try {
              const op: User = { ...u, id: `op-${Date.now()}`, role: 'operator', parentId: currentUser.id };
              await db.saveUsers([op]);
              const updatedFullList = await db.getUsers();
              setUsers(updatedFullList);
            } catch (err) { alert('Erro ao criar operador no servidor.'); }
            setIsSyncing(false);
          }}
          onDeleteOperator={async (id) => {
            setIsSyncing(true);
            try {
              await db.deleteUser(id);
              const updatedFullList = await db.getUsers();
              setUsers(updatedFullList);
            } catch (err) { alert('Erro ao remover operador no servidor.'); }
            setIsSyncing(false);
          }}
        />
      )}
      {(currentView === 'team' || currentView === 'goals') && currentUser.role !== 'admin' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500 text-center px-6">
          <ShieldAlert size={48} className="mb-4 text-zinc-800" />
          <p className="text-xl font-black uppercase tracking-widest text-zinc-700">Acesso Restrito</p>
          <p className="text-sm mt-2">Esta seção é exclusiva para Gerentes Master.</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
