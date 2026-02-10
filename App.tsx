
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
      console.error("Erro ao carregar dados:", error);
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

  const myAdminId = useMemo(() => {
    if (!currentUser) return '';
    return currentUser.role === 'admin' ? currentUser.id : (currentUser.parentId || '');
  }, [currentUser]);

  // Função para adicionar ou atualizar ciclo
  // Agora não tenta calcular comissão final por linha, apenas armazena o lucro operacional bruto
  const addOrUpdateCycle = async (cycleData: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => {
    if (!currentUser || !myAdminId) return;
    setIsSyncing(true);
    try {
      const grossProfit = cycleData.return - cycleData.invested;
      
      const cycle: Cycle = {
        ...cycleData,
        id: existingId || `c-${Date.now()}`,
        profit: Number(grossProfit.toFixed(2)),
        commissionValue: 0, // Será ignorado e calculado dinamicamente no Dashboard Diário
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        ownerAdminId: myAdminId
      };
      
      await db.saveCycle(cycle);
      await loadAllData(); // Recarrega para garantir sincronia com os custos do dia
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
    setIsSyncing(false);
  };

  const deleteCycle = async (id: string) => {
    if (!confirm('Excluir este ciclo?')) return;
    setIsSyncing(true);
    try {
      await db.deleteCycle(id);
      setCycles(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { alert(err.message); }
    setIsSyncing(false);
  };

  const deleteMultipleCycles = async (ids: string[]) => {
    if (!ids.length || !confirm(`Excluir ${ids.length} ciclos?`)) return;
    setIsSyncing(true);
    try {
      await db.deleteMultipleCycles(ids);
      setCycles(prev => prev.filter(c => !ids.includes(c.id)));
    } catch (err: any) { alert(err.message); }
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
    } catch (err) { alert('Erro ao salvar custo.'); }
    setIsSyncing(false);
  };

  const deleteCost = async (id: string) => {
    if (!confirm('Excluir custo?')) return;
    setIsSyncing(true);
    try {
      await db.deleteCost(id);
      setCosts(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { alert(err.message); }
    setIsSyncing(false);
  };

  const updateCommission = async (userId: string, newCommission: number) => {
    setIsSyncing(true);
    try {
      const allUsers = await db.getUsers();
      const updatedAllUsers = allUsers.map(u => u.id === userId ? { ...u, commission: newCommission } : u);
      await db.saveUsers(updatedAllUsers);
      setUsers(updatedAllUsers);
      // Recarrega tudo para que os cálculos dinâmicos no dashboard reflitam a nova taxa
      await loadAllData();
    } catch (err) { alert('Erro ao atualizar comissão.'); }
    setIsSyncing(false);
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><RefreshCw className="animate-spin text-yellow-500" /></div>;
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
      onExportData={async () => {
        const data = await db.exportFullBackup();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }}
      onImportData={async (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          await db.importBackup(e.target?.result as string);
          await loadAllData();
          alert('Backup restaurado!');
        };
        reader.readAsText(file);
      }}
    >
      {currentView === 'dashboard' && <Dashboard cycles={filteredCycles} costs={filteredCosts} userRole={currentUser.role} currentUserId={currentUser.id} teamMembers={users} />}
      {currentView === 'cycles' && <CyclesView cycles={filteredCycles} onAddCycle={addOrUpdateCycle} onDeleteCycle={deleteCycle} onDeleteMultipleCycles={deleteMultipleCycles} userRole={currentUser.role} />}
      {currentView === 'costs' && <CostsView costs={filteredCosts} onAddCost={addCost} onDeleteCost={deleteCost} userRole={currentUser.role} />}
      {currentView === 'team' && currentUser.role === 'admin' && (
        <TeamView 
          users={myTeam} 
          onUpdateCommission={updateCommission} 
          onAddOperator={async (u) => {
            const op: User = { ...u, id: `op-${Date.now()}`, role: 'operator', parentId: currentUser.id };
            await db.saveUsers([op]);
            await loadAllData();
          }}
          onDeleteOperator={async (id) => {
            await db.deleteUser(id);
            await loadAllData();
          }}
        />
      )}
    </Layout>
  );
};

export default App;
