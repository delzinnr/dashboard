
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, ShieldAlert, RefreshCw } from 'lucide-react';
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => sessionStorage.getItem('fm_is_logged') === 'true');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('fm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedCycles, fetchedCosts] = await Promise.all([
        db.getUsers(),
        db.getCycles(),
        db.getCosts()
      ]);
      setUsers(fetchedUsers);
      setCycles(fetchedCycles);
      setCosts(fetchedCosts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleLogin = (user: User) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    sessionStorage.setItem('fm_is_logged', 'true');
    sessionStorage.setItem('fm_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    sessionStorage.removeItem('fm_is_logged');
    sessionStorage.removeItem('fm_current_user');
  };

  const handleExportData = async () => {
    setIsSyncing(true);
    const data = await db.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-finance-master-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
        alert('Dados importados com sucesso!');
      } catch (err) {
        alert('Erro ao importar arquivo. Verifique o formato.');
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const addCycle = async (newCycle: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue'>) => {
    if (!currentUser) return;
    setIsSyncing(true);
    const profit = newCycle.return - newCycle.invested;
    const commValue = profit > 0 ? (profit * (currentUser.commission / 100)) : 0;
    const cycle: Cycle = {
      ...newCycle,
      id: Math.random().toString(36).substr(2, 9),
      profit,
      commissionValue: commValue,
      operatorId: currentUser.id,
      operatorName: currentUser.name
    };
    await db.saveCycle(cycle);
    setCycles(prev => [cycle, ...prev]);
    setIsSyncing(false);
  };

  const addCost = async (newCost: Omit<Cost, 'id' | 'operatorId' | 'operatorName'>) => {
    if (!currentUser) return;
    setIsSyncing(true);
    const cost: Cost = {
      ...newCost,
      id: Math.random().toString(36).substr(2, 9),
      operatorId: currentUser.id,
      operatorName: currentUser.name
    };
    await db.saveCost(cost);
    setCosts(prev => [cost, ...prev]);
    setIsSyncing(false);
  };

  const deleteCost = async (id: string) => {
    setIsSyncing(true);
    await db.deleteCost(id);
    setCosts(prev => prev.filter(c => c.id !== id));
    setIsSyncing(false);
  };

  const deleteCycle = async (id: string) => {
    setIsSyncing(true);
    await db.deleteCycle(id);
    setCycles(prev => prev.filter(c => c.id !== id));
    setIsSyncing(false);
  };

  const updateCommission = async (userId: string, newCommission: number) => {
    setIsSyncing(true);
    const updatedUsers = users.map(u => u.id === userId ? { ...u, commission: newCommission } : u);
    await db.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    const updatedCycles = cycles.map(c => {
      if (c.operatorId === userId) {
        const newCommValue = c.profit > 0 ? (c.profit * (newCommission / 100)) : 0;
        return { ...c, commissionValue: newCommValue };
      }
      return c;
    });
    await db.saveAllCycles(updatedCycles);
    setCycles(updatedCycles);
    setIsSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-10">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[2rem] flex items-center justify-center text-black font-black text-2xl animate-bounce mb-8">SMK</div>
        <RefreshCw className="animate-spin text-yellow-500 mb-2" size={24} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Sincronizando Banco de Dados</p>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) return <LoginView users={users} onLogin={handleLogin} />;

  const filteredCycles = currentUser.role === 'admin' ? cycles : cycles.filter(c => c.operatorId === currentUser.id);
  const filteredCosts = currentUser.role === 'admin' ? costs : costs.filter(c => c.operatorId === currentUser.id);

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
      {currentView === 'dashboard' && <Dashboard cycles={filteredCycles} costs={filteredCosts} userRole={currentUser.role} />}
      {currentView === 'cycles' && <CyclesView cycles={filteredCycles} onAddCycle={addCycle} onDeleteCycle={deleteCycle} userRole={currentUser.role} />}
      {currentView === 'costs' && <CostsView costs={filteredCosts} onAddCost={addCost} onDeleteCost={deleteCost} userRole={currentUser.role} />}
      {currentView === 'team' && currentUser.role === 'admin' && (
        <TeamView 
          users={users.filter(u => u.role === 'operator')} 
          onUpdateCommission={updateCommission} 
          onAddOperator={async (u) => {
            setIsSyncing(true);
            const op: User = { ...u, id: `op-${Math.random().toString(36).substr(2, 9)}`, role: 'operator' };
            const up = [...users, op];
            await db.saveUsers(up);
            setUsers(up);
            setIsSyncing(false);
          }}
          onDeleteOperator={async (id) => {
            setIsSyncing(true);
            const up = users.filter(u => u.id !== id);
            await db.saveUsers(up);
            setUsers(up);
            setIsSyncing(false);
          }}
        />
      )}
      {(currentView === 'team' || currentView === 'goals') && currentUser.role !== 'admin' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
          <ShieldAlert size={48} className="mb-4 text-zinc-800" />
          <p className="text-xl font-black uppercase tracking-widest text-zinc-700">Acesso Restrito</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
