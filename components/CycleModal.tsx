
import React, { useState, useEffect } from 'react';
import { X, Flame, RefreshCw, LogOut, Wallet, Users, Layout, Calculator, Calendar, ArrowRightLeft, Percent } from 'lucide-react';
import { Cycle } from '../types';
import { useAuth } from '../AuthContext';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Cycle, 'id' | 'profit' | 'operatorId' | 'operatorName' | 'commissionValue' | 'ownerAdminId'>, existingId?: string) => void;
  editingCycle?: Cycle | null;
}

export const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, onSave, editingCycle }) => {
  const { currentUser } = useAuth();
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
  const estimatedCommission = currentProfit > 0 ? (currentProfit * ((currentUser?.commission || 0) / 100)) : 0;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050505] md:bg-black/95 md:backdrop-blur-2xl p-0 md:p-6">
      {/* Container Principal: Reduzido para max-w-lg (Compacto) */}
      <div className="relative bg-[#080808] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-[2rem] border-none md:border md:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header Compacto */}
        <div className="flex-none bg-[#0a0a0a] border-b border-white/5 px-6 md:px-8 py-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">
              {editingCycle ? 'Atualizar' : 'Lançar'} <span className="text-yellow-500">Registro</span>
            </h2>
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Protocolo de Ciclo SMK v6.5</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide pb-24 md:pb-8">
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Identificação</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-500 transition-all font-bold text-sm" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  placeholder="Nome da Banca" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Data Operacional</label>
                <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-zinc-500 text-xs font-black flex justify-between items-center">
                  {formData.date}
                  <Calendar size={12} className="opacity-30" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Entradas */}
              <div className="p-4 bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl space-y-4">
                <p className="text-[8px] font-black uppercase text-blue-500 tracking-widest border-b border-blue-500/10 pb-2">Entradas</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-zinc-600 uppercase">Dep. Inicial</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-lg py-2 px-3 text-xs text-white font-black" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-zinc-600 uppercase">Redepósitos</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-lg py-2 px-3 text-xs text-white font-black" value={formData.redeposit} onChange={e => setFormData({...formData, redeposit: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Saídas */}
              <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl space-y-4">
                <p className="text-[8px] font-black uppercase text-emerald-500 tracking-widest border-b border-emerald-500/10 pb-2">Saídas</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-zinc-600 uppercase">Saque Total</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-lg py-2 px-3 text-xs text-white font-black" value={formData.withdraw} onChange={e => setFormData({...formData, withdraw: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-zinc-600 uppercase">Baú/Reserva</span>
                    <input type="number" step="0.01" className="w-full bg-black border border-white/5 rounded-lg py-2 px-3 text-xs text-white font-black" value={formData.chest} onChange={e => setFormData({...formData, chest: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Cooperação</label>
                <input type="number" step="0.01" className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-xs text-white font-black" value={formData.cooperation} onChange={e => setFormData({...formData, cooperation: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-600 ml-1">Contas Geradas</label>
                <input type="number" className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-xs text-white font-black" value={formData.accounts} onChange={e => setFormData({...formData, accounts: Number(e.target.value)})} />
              </div>
            </div>
          </div>

          {/* Resumo Financeiro e Comissão */}
          <div className="bg-gradient-to-br from-white/[0.02] to-transparent p-6 rounded-2xl border border-white/5 space-y-4">
             <div className="flex justify-between items-center">
                <div>
                   <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Lucro Operacional</p>
                   <h4 className={`text-2xl font-black tracking-tighter ${currentProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                     {formatBRL(currentProfit)}
                   </h4>
                </div>
                <div className="text-right">
                   <div className="flex items-center justify-end gap-1 mb-1">
                     <Percent size={10} className="text-yellow-500/50" />
                     <p className="text-[8px] font-black uppercase text-yellow-500 tracking-widest">Ganhos ({currentUser?.commission}%)</p>
                   </div>
                   <h4 className="text-xl font-black text-yellow-500 tracking-tighter">
                     {formatBRL(estimatedCommission)}
                   </h4>
                </div>
             </div>
          </div>

          {/* Ações Finais */}
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors order-2 md:order-1"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-yellow-500/10 transition-all active:scale-95 order-1 md:order-2"
            >
              {editingCycle ? 'Salvar Registro' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
