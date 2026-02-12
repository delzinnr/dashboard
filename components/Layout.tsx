
import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  RefreshCcw, 
  Users as UsersIcon, 
  Target, 
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Receipt,
  Loader2,
  Download,
  Upload,
  Trash2,
  Database
} from 'lucide-react';
import { View, User } from '../types';
import { db } from '../db';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
  isSyncing?: boolean;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  currentUser, 
  onLogout, 
  isSyncing = false,
  onExportData,
  onImportData
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Início' },
    { id: 'cycles' as View, icon: RefreshCcw, label: 'Ciclos' },
    { id: 'costs' as View, icon: Receipt, label: 'Custos' },
    ...(currentUser.role === 'admin' ? [{ id: 'team' as View, icon: UsersIcon, label: 'Equipe' }] : []),
    { id: 'goals' as View, icon: Target, label: 'Metas' },
  ];

  const handleSeedData = async () => {
    if (!confirm('Deseja gerar dados de teste? Isso adicionará novos operadores, ciclos e custos para demonstração.')) return;
    setIsSeeding(true);
    try {
      await db.seedData(currentUser);
      alert('Dados de teste gerados com sucesso!');
      window.location.reload();
    } catch (err) {
      alert('Erro ao gerar dados de teste.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-x-hidden">
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onImportData(e.target.files[0])} accept=".json" className="hidden" />

      {/* Header Fixo com Camada de Vidro (Glassmorphism) */}
      <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 z-[60] px-4 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-black text-xs italic shadow-lg shadow-yellow-500/20">SMK</div>
          <div className="flex flex-col">
            <span className="font-bold text-sm md:text-base tracking-tight leading-none">Finance<span className="text-yellow-500">Master</span></span>
            <span className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Sytem v6.0</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                currentView === item.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <item.icon size={14} strokeWidth={3} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            {isSyncing || isSeeding ? <Loader2 size={12} className="text-yellow-500 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{(isSyncing || isSeeding) ? 'Sincronizando' : 'Operacional'}</span>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentUser.role === 'admin' ? 'bg-yellow-500 text-black shadow-inner shadow-black/10' : 'bg-blue-600 text-white'}`}>
                {currentUser.role === 'admin' ? <ShieldCheck size={16} strokeWidth={2.5} /> : <UserIcon size={16} strokeWidth={2.5} />}
              </div>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 mt-4 w-64 bg-[#0f0f0f] border border-white/10 rounded-[2rem] shadow-2xl p-3 z-[70] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="px-4 py-3 border-b border-white/5 mb-2">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Perfil Autenticado</p>
                  <p className="text-sm font-black text-white truncate">{currentUser.name}</p>
                </div>
                
                <div className="space-y-1">
                  {currentUser.role === 'admin' && (
                    <button onClick={handleSeedData} disabled={isSeeding} className="w-full flex items-center gap-3 px-4 py-3 text-yellow-500/80 hover:bg-yellow-500/5 rounded-xl text-[11px] font-bold transition-colors">
                      <Database size={16} />Gerar Dados de Teste
                    </button>
                  )}

                  <button onClick={() => { onExportData(); setShowUserDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 rounded-xl text-[11px] font-bold transition-colors">
                    <Download size={16} />Fazer Backup Local
                  </button>
                  
                  {currentUser.role === 'admin' && (
                    <>
                      <button onClick={() => { fileInputRef.current?.click(); setShowUserDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 rounded-xl text-[11px] font-bold transition-colors">
                        <Upload size={16} />Importar Backup
                      </button>
                      <button onClick={() => confirm('Isso apagará TUDO localmente. Deseja continuar?') && db.clearAllData()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-xl text-[11px] font-bold mt-1 transition-all">
                        <Trash2 size={16} />Limpar Instância
                      </button>
                    </>
                  )}
                </div>

                <div className="border-t border-white/5 mt-2 pt-2">
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl text-[11px] font-black uppercase tracking-widest">
                    <LogOut size={16} />Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container com Padding Estratégico para compensar o Header */}
      <main className="flex-1 w-full pt-20 md:pt-32 pb-24 lg:pb-16 px-4 md:px-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Navegação Mobile com Glassmorphism */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl z-[60] flex items-center justify-around px-2 shadow-2xl">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300 ${
              currentView === item.id ? 'text-yellow-500 -translate-y-1' : 'text-zinc-600'
            }`}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
