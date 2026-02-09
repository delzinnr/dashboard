
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
  Database,
  Download,
  Upload,
  Trash2
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'cycles' as View, icon: RefreshCcw, label: 'Ciclos' },
    { id: 'costs' as View, icon: Receipt, label: 'Custos' },
    ...(currentUser.role === 'admin' ? [{ id: 'team' as View, icon: UsersIcon, label: 'Equipe' }] : []),
    { id: 'goals' as View, icon: Target, label: 'Metas' },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
  };

  const handleClearData = () => {
    if (confirm('ATENÇÃO: Isso apagará todos os dados locais e restaurará o sistema. Continuar?')) {
      db.clearAllData();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-black font-black text-sm italic">SMK</div>
            <span className="font-bold tracking-tight text-lg">Finance<span className="text-yellow-500">Master</span></span>
          </div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentView === item.id ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <item.icon size={18} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full">
            {isSyncing ? (
              <><Loader2 size={12} className="text-yellow-500 animate-spin" /><span className="text-[9px] font-black uppercase text-yellow-500/80 tracking-widest">Sincronizando</span></>
            ) : (
              <><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div><span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Online</span></>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${currentUser.role === 'admin' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                {currentUser.role === 'admin' ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
              </div>
              <span className="text-xs font-bold hidden sm:block">{currentUser.name}</span>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            {showUserDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 mb-2">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Banco de Dados</p>
                </div>
                
                <button onClick={onExportData} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                  <Download size={16} />Exportar Backup
                </button>
                
                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                      <Upload size={16} />Importar Dados
                    </button>
                    <button onClick={handleClearData} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl text-xs font-bold transition-all mt-2 border-t border-white/5 pt-4">
                      <Trash2 size={16} />Resetar Sistema
                    </button>
                  </>
                )}

                <div className="border-t border-white/5 mt-2 pt-2">
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all">
                    <LogOut size={16} />Sair do Sistema
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-[1600px] mx-auto">{children}</main>
    </div>
  );
};
