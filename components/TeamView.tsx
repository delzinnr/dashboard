
import React, { useState } from 'react';
import { User as UserIcon, Percent, ShieldCheck, TrendingUp, Users, Plus, X, Trash2, Key } from 'lucide-react';
import { User } from '../types';

interface TeamViewProps {
  users: User[];
  onUpdateCommission: (userId: string, newCommission: number) => void;
  onAddOperator: (user: Omit<User, 'id' | 'role'>) => void;
  onDeleteOperator: (id: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ users, onUpdateCommission, onAddOperator, onDeleteOperator }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOp, setNewOp] = useState({
    name: '',
    username: '',
    password: '',
    commission: 10
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddOperator(newOp);
    setIsModalOpen(false);
    setNewOp({ name: '', username: '', password: '', commission: 10 });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold tracking-widest uppercase rounded">Management</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Gestão de <span className="text-zinc-600">Equipe</span></h1>
          <p className="text-zinc-500 font-medium text-sm">Controle total sobre os membros e acessos da rede</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-3.5 bg-yellow-500 text-black rounded-2xl text-sm font-black hover:bg-yellow-400 transition-all shadow-2xl shadow-yellow-500/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="uppercase tracking-wider">Novo Operador</span>
          </button>
          
          <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
             <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
               <Users size={24} />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase leading-none mb-1">Membros</p>
               <p className="text-xl font-black text-white leading-none">{users.length}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-[#121212] rounded-[2rem] p-8 border border-white/5 relative group hover:border-yellow-500/30 transition-all shadow-2xl overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-all"></div>
            
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">{user.name}</h3>
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={12} className="text-blue-500" />
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">@{user.username}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if(confirm(`Deseja realmente excluir ${user.name}?`)) onDeleteOperator(user.id);
                }}
                className="p-2 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={12} /> Taxa de Comissão
                  </label>
                  <span className="text-lg font-black text-yellow-500">{user.commission}%</span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={user.commission}
                  onChange={(e) => onUpdateCommission(user.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Key size={14} className="text-zinc-700" />
                   <span className="text-[10px] font-bold text-zinc-600 uppercase">Acesso Ativo</span>
                 </div>
                 <TrendingUp size={14} className="text-green-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Operator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/5 shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white">Novo <span className="text-yellow-500">Operador</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Completo</label>
                <input 
                  type="text"
                  placeholder="Nome do operador"
                  className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white"
                  value={newOp.name}
                  onChange={(e) => setNewOp({...newOp, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Usuário</label>
                  <input 
                    type="text"
                    placeholder="Login"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white"
                    value={newOp.username}
                    onChange={(e) => setNewOp({...newOp, username: e.target.value.toLowerCase()})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Senha</label>
                  <input 
                    type="password"
                    placeholder="••••"
                    className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-yellow-500/50 transition-all text-white"
                    value={newOp.password}
                    onChange={(e) => setNewOp({...newOp, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Comissão Inicial</label>
                  <span className="text-lg font-black text-yellow-500">{newOp.commission}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  value={newOp.commission}
                  onChange={(e) => setNewOp({...newOp, commission: parseInt(e.target.value)})}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-yellow-500/20 mt-4"
              >
                Criar Acesso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
