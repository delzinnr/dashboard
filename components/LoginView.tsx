
import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, UserPlus, Fingerprint } from 'lucide-react';
import { User as UserType } from '../types';
import { db } from '../db';

interface LoginViewProps {
  users: UserType[];
  onLogin: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Para cadastro
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [databaseEmpty, setDatabaseEmpty] = useState(false);

  useEffect(() => {
    const checkDb = async () => {
      const hasUsers = await db.hasUsers();
      setDatabaseEmpty(!hasUsers);
      if (!hasUsers) setIsRegisterMode(true);
    };
    checkDb();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!name || !username || !password) {
          setError('Preencha todos os campos.');
          setIsLoading(false);
          return;
        }
        const newUser = await db.registerAdmin({ name, username, password });
        onLogin(newUser);
      } else {
        const user = await db.login(username, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Usuário ou senha incorretos.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-yellow-500/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse"></div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[2.5rem] text-black text-3xl font-black italic mb-6 shadow-2xl shadow-yellow-500/20 animate-in zoom-in duration-700">
            SMK
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Finance<span className="text-yellow-500">Master</span></h1>
          <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px]">
            {isRegisterMode ? 'Configuração de Gerente Master' : 'Acesso Restrito ao Sistema'}
          </p>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegisterMode && (
              <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                    <Fingerprint size={18} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white placeholder:text-zinc-700"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white placeholder:text-zinc-700"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/5 p-4 rounded-xl border border-red-500/10 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-yellow-500/20 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Finalizar Cadastro' : 'Autenticar'}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {!databaseEmpty && (
            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-yellow-500 transition-colors"
              >
                {isRegisterMode ? 'Já tenho acesso' : 'Cadastrar novo gerente'}
              </button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-zinc-700" />
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">Servidor em Nuvem Ativo</span>
          </div>
        </div>

        <p className="mt-8 text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; 2025 SMK Finance Master. Cloud Integrated.
        </p>
      </div>
    </div>
  );
};
