
import React, { useState } from 'react';
import { X, Flame, RefreshCw, LogOut, Wallet, Users, LayoutDashboard } from 'lucide-react';
import { Cycle } from '../types';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue'>) => void;
}

export const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toLocaleDateString('pt-BR'),
    deposit: 0,
    redeposit: 0,
    withdraw: 0,
    chest: 0,
    cooperation: 0,
    accounts: 1
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name || 'Novo Ciclo',
      date: formData.date,
      invested: Number(formData.deposit) + Number(formData.redeposit),
      return: Number(formData.withdraw) + Number(formData.chest) + Number(formData.cooperation),
      accounts: Number(formData.accounts)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#121212] w-full max-w-lg rounded-3xl border border-white/5 shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">Registrar <span className="text-yellow-500">Ciclo</span></h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Nome</label>
              <input type="text" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-yellow-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500">Data</label>
              <input type="text" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white" value={formData.date} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><Flame size={12} className="text-orange-500"/> Depósito</label>
              <input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><RefreshCw size={12} className="text-blue-500"/> Re-depósito</label>
              <input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-zinc-500 uppercase">Saque</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-zinc-500 uppercase">Baú</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-zinc-500 uppercase">Coop.</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} /></div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase">Contas Criadas</label>
            <input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
          </div>

          <button type="submit" className="w-full bg-yellow-500 py-4 rounded-2xl font-black uppercase tracking-widest text-black hover:bg-yellow-400 mt-4">Confirmar Ciclo</button>
        </form>
      </div>
    </div>
  );
};
