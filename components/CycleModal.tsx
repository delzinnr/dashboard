
import React, { useState } from 'react';
import { X, Flame, RefreshCw } from 'lucide-react';
import { Cycle } from '../types';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>) => void;
}

export const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', date: new Date().toLocaleDateString('pt-BR'), deposit: 0, redeposit: 0, withdraw: 0, chest: 0, cooperation: 0, accounts: 1 });

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative bg-[#121212] w-full max-w-lg rounded-[2rem] border border-white/5 shadow-2xl p-6 md:p-10 my-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Novo <span className="text-yellow-500">Ciclo</span></h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Nome da Operação</label><input type="text" className="w-full bg-black border border-white/5 rounded-xl py-3.5 px-4 text-sm text-white outline-none focus:border-yellow-500/50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Banca Noite" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Data</label><input type="text" className="w-full bg-black/50 border border-white/5 rounded-xl py-3.5 px-4 text-sm text-zinc-500 outline-none" value={formData.date} readOnly /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-1.5"><Flame size={10} className="text-orange-500"/> Depósito</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3.5 px-4 text-sm text-white outline-none" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-1.5"><RefreshCw size={10} className="text-blue-500"/> Re-depósito</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3.5 px-4 text-sm text-white outline-none" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Saque</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-3 text-xs text-white outline-none" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Baú</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-3 text-xs text-white outline-none" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Coop.</label><input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3 px-3 text-xs text-white outline-none" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} /></div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Accounts Geradas</label>
            <input type="number" className="w-full bg-black border border-white/5 rounded-xl py-3.5 px-4 text-sm text-white outline-none" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase text-zinc-600">Cancelar</button>
            <button type="submit" className="flex-1 bg-yellow-500 text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-500/10 hover:bg-yellow-400">Salvar Ciclo</button>
          </div>
        </form>
      </div>
    </div>
  );
};
