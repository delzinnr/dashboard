
import React, { useState, useEffect } from 'react';
import { X, Flame, RefreshCw, LogOut, Wallet, Users, Layout, Calculator, Calendar, ArrowRightLeft } from 'lucide-react';
import { Cycle } from '../types';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => void;
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
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
    }, editingCycle?.id);
  };

  const currentInvested = Number(formData.deposit) + Number(formData.redeposit);
  const currentReturn = Number(formData.withdraw) + Number(formData.chest) + Number(formData.cooperation);
  const currentProfit = currentReturn - currentInvested;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050505] md:bg-black/95 md:backdrop-blur-2xl">
      {/* Container Principal: FULL SCREEN NO MOBILE */}
      <div className="relative bg-[#080808] w-full h-full md:h-auto md:max-h-[95vh] md:max-w-4xl md:rounded-[3rem] border-none md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header Fixo */}
        <div className="flex-none bg-[#0a0a0a] border-b border-white/5 px-6 md:px-12 py-6 md:py-8 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white">
              {editingCycle ? 'Atualizar' : 'Novo'} <span className="text-yellow-500">Registro</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Protocolo de Ciclo SMK v6.2</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 text-zinc-400 hover:text-white rounded-2xl transition-all border border-white/5 active:scale-90"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scrollbar-hide pb-32">
          
          {/* Identificação e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest flex items-center gap-2">
                <Layout size={12} className="text-yellow-500"/> Identificação da Banca
              </label>
              <input 
                type="text" 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-yellow-500 transition-all font-bold text-base" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="Ex: Banca Madrugada" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 tracking-widest flex items-center gap-2">
                <Calendar size={12}/> Data do Registro
              </label>
              <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-zinc-500 text-sm font-black tracking-widest flex items-center justify-between">
                {formData.date}
                <span className="text-[8px] px-2 py-1 bg-white/5 rounded uppercase">Consolidado</span>
              </div>
            </div>
          </div>

          {/* Seções de Fluxo - Grid Dinâmico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Bloco Entradas */}
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em]">Volume de Entrada</span>
                <Flame size={14} className="text-blue-500" />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Depósito Inicial</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs">R$</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg text-white outline-none font-black" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Redepósitos</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs">R$</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg text-white outline-none font-black" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco Saídas */}
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em]">Volume de Saída</span>
                <LogOut size={14} className="text-emerald-500" />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Saque Total</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs">R$</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg text-white outline-none font-black" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Baú / Reserva</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs">R$</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-6 text-lg text-white outline-none font-black" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dados Auxiliares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2">
                <Users size={14}/> Cooperação
              </label>
              <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-black" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 flex items-center gap-2">
                <Calculator size={14}/> Contas Geradas
              </label>
              <input type="number" className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-black" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
            </div>
          </div>

          {/* Resultado Final Consolidado */}
          <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
             <div className="text-center md:text-left">
                <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] mb-3">Expectativa de Ganho</p>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <ArrowRightLeft size={12} className="text-zinc-700" />
                  <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.2em]">Resultado Líquido da Banca</p>
                </div>
             </div>
             <div className="flex flex-col items-center md:items-end">
               <span className={`text-5xl md:text-7xl font-black tracking-tighter ${currentProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} transition-all`}>
                 {formatBRL(currentProfit)}
               </span>
             </div>
          </div>

          {/* Botões de Ação Final - FIXOS NA BASE NO MOBILE */}
          <div className="fixed md:relative bottom-0 left-0 right-0 p-6 md:p-0 bg-[#080808]/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none flex flex-col md:flex-row gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors order-2 md:order-1"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-yellow-500/20 transition-all active:scale-95 order-1 md:order-2"
            >
              {editingCycle ? 'Salvar Registro Operacional' : 'Confirmar Registro Operacional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
