
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Fingerprint, Check } from 'lucide-react';
import { db } from '../db';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLogin: (user: UserType, remember: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!name.trim() || !username.trim() || !password.trim()) throw new Error('Preencha todos os campos.');
        const newUser = await db.registerAdmin({ name, username, password });
        onLogin(newUser, rememberMe);
      } else {
        const user = await db.login(username, password);
        if (user) onLogin(user, rememberMe);
        else throw new Error('Usuário ou senha incorretos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-yellow-500 rounded-2xl items-center justify-center text-black text-2xl font-black italic mb-4 shadow-xl shadow-yellow-500/10">SMK</div>
          <h1 className="text-2xl font-black text-white">Finance<span className="text-yellow-500">Master</span></h1>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">
            {isRegisterMode ? 'Nova Conta Master' : 'Autenticação de Segurança'}
          </p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Nome</label>
                <div className="relative group">
                  <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                  <input type="text" placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-white focus:border-yellow-500/50 outline-none" required />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Usuário</label>
              <div className="relative group">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-white focus:border-yellow-500/50 outline-none" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Senha</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-white focus:border-yellow-500/50 outline-none" required />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => setRememberMe(!rememberMe)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-yellow-500 border-yellow-500' : 'bg-black border-white/10'}`}>
                {rememberMe && <Check size={14} className="text-black" strokeWidth={4} />}
              </button>
              <span className="text-[10px] font-black uppercase text-zinc-500">Manter conectado</span>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2"><AlertCircle size={14}/> {error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
              {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : (
                <>{isRegisterMode ? 'Criar Conta' : 'Acessar'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setError(''); setIsRegisterMode(!isRegisterMode); }} className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-yellow-500 transition-colors">
              {isRegisterMode ? 'Já tenho conta Master' : 'Criar novo Gerente Master'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
