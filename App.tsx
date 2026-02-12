
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CyclesView } from './components/CyclesView';
import { TeamView } from './components/TeamView';
import { LoginView } from './components/LoginView';
import { CostsView } from './components/CostsView';
import { View, Cycle, User, Cost } from './types';
import { db } from './db';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { currentUser, isLoggedIn, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllData = useCallback(async () => {
    if (!isLoggedIn) return;
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
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  }, [loadAllData, isLoggedIn]);

  const myAdminId = useMemo(() => {
    if (!currentUser) return '';
    return currentUser.role === 'admin' ? currentUser.id : (currentUser.parentId || '');
  }, [currentUser]);

  const addOrUpdateCycle = async (cycleData: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => {
    if (!currentUser || !myAdminId) return;
    setIsSyncing(true);
    try {
      const grossProfit = cycleData.return - cycleData.invested;
      const cycle: Cycle = {
        ...cycleData,
        id: existingId || `c-${Date.now()}`,
        profit: Number(grossProfit.toFixed(2)),
        commissionValue: 0,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        ownerAdminId: myAdminId
      };
      await db.saveCycle(cycle);
      await loadAllData();
      showToast(existingId ? 'Ciclo atualizado com sucesso!' : 'Novo ciclo registrado!');
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
      showToast('Ciclo removido com sucesso!');
    } catch (err: any) { alert(err.message); }
    setIsSyncing(false);
  };

  const deleteMultipleCycles = async (ids: string[]) => {
    if (!ids.length || !confirm(`Excluir ${ids.length} ciclos?`)) return;
    setIsSyncing(true);
    try {
      await db.deleteMultipleCycles(ids);
      setCycles(prev => prev.filter(c => !ids.includes(c.id)));
      showToast(`${ids.length} ciclos removidos com sucesso!`);
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
      showToast('Despesa lançada com sucesso!');
    } catch (err) { alert('Erro ao salvar custo.'); }
    setIsSyncing(false);
  };

  const deleteCost = async (id: string) => {
    if (!confirm('Excluir custo?')) return;
    setIsSyncing(true);
    try {
      await db.deleteCost(id);
      setCosts(prev => prev.filter(c => c.id !== id));
      showToast('Despesa removida!');
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
      await loadAllData();
      showToast('Comissão atualizada!');
    } catch (err) { alert('Erro ao atualizar comissão.'); }
    setIsSyncing(false);
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><RefreshCw className="animate-spin text-yellow-500" /></div>;
  if (!isLoggedIn || !currentUser) return <LoginView />;

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
      onLogout={logout} 
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
            showToast('Novo operador adicionado!');
          }}
          onDeleteOperator={async (id) => {
            await db.deleteUser(id);
            await loadAllData();
            showToast('Operador removido.');
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <CheckCircle2 size={18} className="text-yellow-500" />
            <span className="text-xs font-black uppercase tracking-widest text-white">{toast.message}</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
