
import { createClient } from '@supabase/supabase-js';
import { User, Cycle, Cost } from './types';

// Configurações do seu servidor Supabase
const SUPABASE_URL = 'https://hgrmuhkxkkslmdppshlr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mvz8gI6q3iRondz9dDdCuQ_T6GS9PSe'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const db = {
  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }

    return (data || []).map(u => ({
      id: u.id,
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
      id: data.id,
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

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
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
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        commission: user.commission,
        parent_id: user.parentId
      });
      if (error) console.error("Erro ao salvar usuário:", error);
    }
  },

  async deleteUser(id: string): Promise<void> {
    await supabase.from('users').delete().eq('id', id);
  },

  // --- CICLOS ---
  async getCycles(): Promise<Cycle[]> {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("Erro ao buscar ciclos:", error);
      return [];
    }

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      date: c.date,
      invested: c.invested,
      return: c.return,
      accounts: c.accounts,
      profit: c.profit,
      commissionValue: c.commission_value,
      operatorId: c.operator_id,
      operatorName: c.operator_name,
      ownerAdminId: c.owner_admin_id
    }));
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    const { error } = await supabase.from('cycles').insert([{
      id: cycle.id,
      name: cycle.name,
      date: cycle.date,
      invested: cycle.invested,
      return: cycle.return,
      accounts: cycle.accounts,
      profit: cycle.profit,
      commission_value: cycle.commissionValue,
      operator_id: cycle.operatorId,
      operator_name: cycle.operatorName,
      owner_admin_id: cycle.ownerAdminId
    }]);

    if (error) throw error;
  },

  async saveAllCycles(cycles: Cycle[]): Promise<void> {
    for (const c of cycles) {
      // Fix: In saveAllCycles, we must use the properties defined in the Cycle interface (camelCase)
      await supabase.from('cycles').upsert({
        id: c.id,
        name: c.name,
        date: c.date,
        invested: c.invested,
        return: c.return,
        accounts: c.accounts,
        profit: c.profit,
        commission_value: c.commissionValue,
        operator_id: c.operatorId,
        operator_name: c.operatorName,
        owner_admin_id: c.ownerAdminId
      });
    }
  },

  async deleteCycle(id: string): Promise<void> {
    await supabase.from('cycles').delete().eq('id', id);
  },

  // --- CUSTOS ---
  async getCosts(): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("Erro ao buscar custos:", error);
      return [];
    }

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      date: c.date,
      amount: c.amount,
      type: c.type,
      operatorId: c.operator_id,
      operatorName: c.operator_name,
      ownerAdminId: c.owner_admin_id
    }));
  },

  async saveCost(cost: Cost): Promise<void> {
    const { error } = await supabase.from('costs').insert([{
      id: cost.id,
      name: cost.name,
      date: cost.date,
      amount: cost.amount,
      type: cost.type,
      operator_id: cost.operatorId,
      operator_name: cost.operatorName,
      owner_admin_id: cost.ownerAdminId
    }]);

    if (error) throw error;
  },

  async deleteCost(id: string): Promise<void> {
    await supabase.from('costs').delete().eq('id', id);
  },

  async clearAllData(): Promise<void> {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },

  async exportFullBackup(): Promise<string> {
    const [users, cycles, costs] = await Promise.all([
      this.getUsers(),
      this.getCycles(),
      this.getCosts()
    ]);
    return JSON.stringify({ users, cycles, costs, version: '4.1_supabase' });
  },

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.users) await this.saveUsers(data.users);
    if (data.cycles) await this.saveAllCycles(data.cycles);
    if (data.costs) {
      for (const cost of data.costs) {
        await this.saveCost(cost);
      }
    }
  }
};
