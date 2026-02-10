
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onImportData(e.target.files[0])} accept=".json" className="hidden" />

      {/* Header Compacto para Mobile */}
      <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-black text-[9px] italic">SMK</div>
          <span className="font-bold text-sm tracking-tight">Finance<span className="text-yellow-500">Master</span></span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentView === item.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden xs:flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/5">
            {isSyncing || isSeeding ? <Loader2 size={10} className="text-yellow-500 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
            <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{(isSyncing || isSeeding) ? 'Sinc' : 'Online'}</span>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentUser.role === 'admin' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                {currentUser.role === 'admin' ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
              </div>
              <ChevronDown size={12} className="text-zinc-500 mr-1" />
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 mt-3 w-52 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Opções</p>
                </div>
                
                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={handleSeedData} disabled={isSeeding} className="w-full flex items-center gap-3 px-3 py-2.5 text-yellow-500/80 hover:bg-yellow-500/5 rounded-xl text-[11px] font-bold">
                      <Database size={14} />Gerar Dados Teste
                    </button>
                    <div className="h-px bg-white/5 my-1"></div>
                  </>
                )}

                <button onClick={() => { onExportData(); setShowUserDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-white/5 rounded-xl text-[11px] font-bold">
                  <Download size={14} />Backup Local
                </button>
                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={() => { fileInputRef.current?.click(); setShowUserDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-white/5 rounded-xl text-[11px] font-bold">
                      <Upload size={14} />Importar Backup
                    </button>
                    <button onClick={() => confirm('Isso apagará TUDO. Deseja continuar?') && db.clearAllData()} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-900 hover:text-red-500 hover:bg-red-500/5 rounded-xl text-[11px] font-bold mt-1">
                      <Trash2 size={14} />Resetar Sistema
                    </button>
                  </>
                )}
                <div className="border-t border-white/5 mt-1 pt-1">
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-[11px] font-bold">
                    <LogOut size={14} />Encerrar Sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo com Padding Mobile Seguro */}
      <main className="flex-1 pt-14 pb-20 lg:pb-10 px-4 md:px-10 max-w-[1400px] mx-auto w-full">
        {children}
      </main>

      {/* Navegação Mobile (Estilo App) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${
              currentView === item.id ? 'text-yellow-500 scale-110' : 'text-zinc-600'
            }`}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
