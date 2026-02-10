
import { createClient } from '@supabase/supabase-js';
import { User, Cycle, Cost } from './types';

const SUPABASE_URL = 'https://hgrmuhkxkkslmdppshlr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mvz8gI6q3iRondz9dDdCuQ_T6GS9PSe'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const db = {
  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return (data || []).map(u => ({
      id: String(u.id),
      name: u.name,
      username: u.username,
      password: u.password,
      role: u.role,
      commission: u.commission,
      parentId: u.parent_id
    }));
  },

  async login(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: String(data.id),
      name: data.name,
      username: data.username,
      password: data.password,
      role: data.role,
      commission: data.commission,
      parentId: data.parent_id
    };
  },

  async registerAdmin(userData: Omit<User, 'id' | 'role' | 'commission'>): Promise<User> {
    const newUser = {
      id: `admin-${Date.now()}`,
      name: userData.name,
      username: userData.username.toLowerCase(),
      password: userData.password,
      role: 'admin',
      commission: 0
    };
    const { data, error } = await supabase.from('users').insert([newUser]).select().single();
    if (error) throw new Error(error.message);
    return {
      id: String(data.id),
      name: data.name,
      username: data.username,
      password: data.password,
      role: data.role,
      commission: data.commission,
      parentId: data.parent_id
    };
  },

  async saveUsers(users: User[]): Promise<void> {
    for (const user of users) {
      await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        commission: user.commission,
        parent_id: user.parentId
      });
    }
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', String(id));
    if (error) throw error;
  },

  // --- CICLOS ---
  async getCycles(): Promise<Cycle[]> {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .order('date', { ascending: false });

    if (error) return [];

    return (data || []).map(c => ({
      id: String(c.id),
      name: c.name,
      date: c.date,
      deposit: Number(c.deposit || 0),
      redeposit: Number(c.redeposit || 0),
      withdraw: Number(c.withdraw || 0),
      chest: Number(c.chest || 0),
      cooperation: Number(c.cooperation || 0),
      invested: Number(c.invested || 0),
      return: Number(c.return || 0),
      accounts: Number(c.accounts || 1),
      profit: Number(c.profit || 0),
      commissionValue: Number(c.commission_value || 0),
      operatorId: c.operator_id,
      operatorName: c.operator_name,
      ownerAdminId: c.owner_admin_id
    }));
  },

  // Função genérica de Salvar (Cria ou Atualiza)
  async saveCycle(cycle: Cycle): Promise<void> {
    const { error } = await supabase.from('cycles').upsert({
      id: String(cycle.id),
      name: cycle.name,
      date: cycle.date,
      deposit: cycle.deposit,
      redeposit: cycle.redeposit,
      withdraw: cycle.withdraw,
      chest: cycle.chest,
      cooperation: cycle.cooperation,
      invested: cycle.invested,
      return: cycle.return,
      accounts: cycle.accounts,
      profit: cycle.profit,
      commission_value: cycle.commissionValue,
      operator_id: cycle.operatorId,
      operator_name: cycle.operatorName,
      owner_admin_id: cycle.ownerAdminId
    });

    if (error) {
      console.error("Erro ao salvar ciclo:", error);
      throw new Error(`Falha ao salvar: ${error.message}`);
    }
  },

  async saveAllCycles(cycles: Cycle[]): Promise<void> {
    const payload = cycles.map(cycle => ({
      id: String(cycle.id),
      name: cycle.name,
      date: cycle.date,
      deposit: cycle.deposit,
      redeposit: cycle.redeposit,
      withdraw: cycle.withdraw,
      chest: cycle.chest,
      cooperation: cycle.cooperation,
      invested: cycle.invested,
      return: cycle.return,
      accounts: cycle.accounts,
      profit: cycle.profit,
      commission_value: cycle.commissionValue,
      operator_id: cycle.operatorId,
      operator_name: cycle.operatorName,
      owner_admin_id: cycle.ownerAdminId
    }));

    const { error } = await supabase.from('cycles').upsert(payload);
    if (error) throw new Error(`Falha ao salvar múltiplos ciclos: ${error.message}`);
  },

  async deleteCycle(id: string): Promise<void> {
    if (!id) return;
    
    const { error } = await supabase
      .from('cycles')
      .delete()
      .eq('id', String(id));

    if (error) {
      console.error("Erro de exclusão no Supabase (Cycles):", error);
      throw new Error(`Erro ao deletar do banco: ${error.message}`);
    }
  },

  async deleteMultipleCycles(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const { error } = await supabase
      .from('cycles')
      .delete()
      .in('id', ids.map(id => String(id)));

    if (error) throw new Error(error.message);
  },

  // --- CUSTOS ---
  async getCosts(): Promise<Cost[]> {
    const { data, error } = await supabase.from('costs').select('*').order('date', { ascending: false });
    if (error) return [];
    return (data || []).map(c => ({
      id: String(c.id),
      name: c.name,
      date: c.date,
      amount: Number(c.amount || 0),
      type: c.type,
      operatorId: c.operator_id,
      operatorName: c.operator_name,
      ownerAdminId: c.owner_admin_id
    }));
  },

  async saveCost(cost: Cost): Promise<void> {
    const { error } = await supabase.from('costs').upsert({
      id: String(cost.id),
      name: cost.name,
      date: cost.date,
      amount: cost.amount,
      type: cost.type,
      operator_id: cost.operatorId,
      operator_name: cost.operatorName,
      owner_admin_id: cost.ownerAdminId
    });
    if (error) {
      console.error("Erro ao salvar custo:", error);
      throw error;
    }
  },

  async deleteCost(id: string): Promise<void> {
    const { error } = await supabase
      .from('costs')
      .delete()
      .eq('id', String(id));
      
    if (error) {
      console.error("Erro de exclusão no Supabase (Costs):", error);
      throw error;
    }
  },

  async clearAllData(): Promise<void> {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },

  async seedData(currentAdmin: User): Promise<void> {
     // Implementação de semente
  },

  async exportFullBackup(): Promise<string> {
    const [users, cycles, costs] = await Promise.all([this.getUsers(), this.getCycles(), this.getCosts()]);
    return JSON.stringify({ users, cycles, costs, version: '5.1_fixed' });
  },

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.users) await this.saveUsers(data.users);
    if (data.cycles) for (const c of data.cycles) await this.saveCycle(c);
    if (data.costs) for (const c of data.costs) await this.saveCost(c);
  }
};
