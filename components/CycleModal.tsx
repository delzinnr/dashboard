
import React, { useState, useEffect } from 'react';
import { X, Flame, RefreshCw, LogOut, Wallet, Users } from 'lucide-react';
import { Cycle } from '../types';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>) => void;
  editingCycle?: Cycle | null;
}

export const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onSave, editingCycle }) => {
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

  const formatBRL = (val: number) => 
    val.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  useEffect(() => {
    if (editingCycle) {
      setFormData({
        name: editingCycle.name,
        date: editingCycle.date,
        deposit: editingCycle.deposit || 0,
        redeposit: editingCycle.redeposit || 0,
        withdraw: editingCycle.withdraw || 0,
        chest: editingCycle.chest || 0,
        cooperation: editingCycle.cooperation || 0,
        accounts: editingCycle.accounts || 1
      });
    } else {
      setFormData({ 
        name: '', 
        date: new Date().toLocaleDateString('pt-BR'), 
        deposit: 0, 
        redeposit: 0, 
        withdraw: 0, 
        chest: 0, 
        cooperation: 0, 
        accounts: 1 
      });
    }
  }, [editingCycle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name || 'Novo Ciclo',
      date: formData.date,
      deposit: Number(formData.deposit),
      redeposit: Number(formData.redeposit),
      withdraw: Number(formData.withdraw),
      chest: Number(formData.chest),
      cooperation: Number(formData.cooperation),
      invested: Number(formData.deposit) + Number(formData.redeposit),
      return: Number(formData.withdraw) + Number(formData.chest) + Number(formData.cooperation),
      accounts: Number(formData.accounts)
    });
  };

  const currentInvested = Number(formData.deposit) + Number(formData.redeposit);
  const currentReturn = Number(formData.withdraw) + Number(formData.chest) + Number(formData.cooperation);
  const currentProfit = currentReturn - currentInvested;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div className="relative bg-[#0c0c0c] w-full max-w-lg rounded-[2.5rem] border border-white/5 shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black uppercase tracking-widest text-white">
            {editingCycle ? 'Editar' : 'Lançar'} <span className="text-yellow-500">Ciclo</span>
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 text-zinc-500 hover:text-white rounded-xl transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Descrição</label>
              <input type="text" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-yellow-500/30 transition-all font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Banca Madrugada" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Data Fixada</label>
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-zinc-600 text-sm font-bold tracking-widest">{formData.date}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem]">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Entrada</p>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 flex items-center gap-1.5"><Flame size={10} className="text-orange-500"/> Depósito</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500/20 font-bold" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 flex items-center gap-1.5"><RefreshCw size={10} className="text-blue-500"/> Re-dep.</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500/20 font-bold" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} />
                   </div>
                </div>
             </div>

             <div className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem]">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Saída</p>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 flex items-center gap-1.5"><LogOut size={10} className="text-emerald-500"/> Saque</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-emerald-500/20 font-bold" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 flex items-center gap-1.5"><Wallet size={10} className="text-yellow-500"/> Baú</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-yellow-500/20 font-bold" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-1.5"><Users size={12}/> Cooperação</label>
              <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-white/20 transition-all font-bold" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Contas Geradas</label>
              <input type="number" className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-white/20 transition-all font-bold" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
             <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-zinc-600">Lucro Operacional Estimado</span>
                <span className={currentProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatBRL(currentProfit)}</span>
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-[11px] font-black uppercase text-zinc-600 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl transition-all font-black">
              {editingCycle ? 'Atualizar Dados' : 'Gravar Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
