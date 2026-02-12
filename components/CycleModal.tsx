
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
  const defaultForm = { 
    name: '', 
    date: new Date().toLocaleDateString('pt-BR'), 
    deposit: 0, 
    redeposit: 0, 
    withdraw: 0, 
    chest: 0, 
    cooperation: 0, 
    accounts: 1 
  };

  const [formData, setFormData] = useState(defaultForm);

  const formatBRL = (val: number | undefined | null) => 
    (val ?? 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  useEffect(() => {
    if (isOpen) {
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
        setFormData(defaultForm);
      }
    }
  }, [editingCycle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name || 'Banca S/N',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="relative bg-[#0c0c0c] w-full max-w-xl rounded-[3rem] border border-white/10 shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              {editingCycle ? 'Atualizar' : 'Lançar'} <span className="text-yellow-500">Ciclo</span>
            </h2>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocolo Operacional</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 text-zinc-500 hover:text-white rounded-2xl transition-all border border-white/5"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Descrição da Operação</label>
              <input type="text" className="w-full bg-black border border-white/5 rounded-2xl py-5 px-8 text-white outline-none focus:border-yellow-500/40 transition-all font-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Banca Madrugada" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Data do Registro</label>
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-8 text-zinc-600 text-sm font-black tracking-[0.2em]">{formData.date}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] border-b border-white/5 pb-4">Volume de Entrada</p>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><Flame size={12} className="text-orange-500"/> Depósito Inicial</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-4 px-6 text-base text-white outline-none focus:border-yellow-500/30 font-black" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><RefreshCw size={12} className="text-blue-500"/> Redepósitos</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-4 px-6 text-base text-white outline-none focus:border-yellow-500/30 font-black" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} />
                   </div>
                </div>
             </div>

             <div className="space-y-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] border-b border-white/5 pb-4">Volume de Saída</p>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><LogOut size={12} className="text-emerald-500"/> Saque Total</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-4 px-6 text-base text-white outline-none focus:border-emerald-500/30 font-black" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><Wallet size={12} className="text-yellow-500"/> Baú/Reserva</label>
                     <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-xl py-4 px-6 text-base text-white outline-none focus:border-yellow-500/30 font-black" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2"><Users size={14}/> Cooperação</label>
              <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-2xl py-5 px-8 text-white outline-none focus:border-white/20 transition-all font-black" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Contas Geradas</label>
              <input type="number" className="w-full bg-black border border-white/5 rounded-2xl py-5 px-8 text-white outline-none focus:border-white/20 transition-all font-black" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1">Expectativa de Ganho</p>
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Resultado líquido da banca</p>
             </div>
             <span className={`text-4xl font-black tracking-tighter ${currentProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
               {formatBRL(currentProfit)}
             </span>
          </div>

          <div className="flex gap-6 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-yellow-500/20 transition-all active:scale-95">
              {editingCycle ? 'Atualizar Protocolo' : 'Salvar Registro Operacional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
