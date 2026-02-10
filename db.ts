
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
    const { data, error } = await supabase.from('users').insert([newUser]).select().single();
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
      deposit: c.deposit || 0,
      redeposit: c.redeposit || 0,
      withdraw: c.withdraw || 0,
      chest: c.chest || 0,
      cooperation: c.cooperation || 0,
      invested: c.invested || 0,
      return: c.return || 0,
      accounts: c.accounts || 1,
      profit: c.profit || 0,
      commissionValue: c.commission_value || 0,
      operatorId: c.operator_id,
      operatorName: c.operator_name,
      ownerAdminId: c.owner_admin_id
    }));
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    const { error } = await supabase.from('cycles').upsert({
      id: cycle.id,
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
      throw error;
    }
  },

  async saveAllCycles(cycles: Cycle[]): Promise<void> {
    for (const c of cycles) await this.saveCycle(c);
  },

  async deleteCycle(id: string): Promise<void> {
    const { error, count } = await supabase
      .from('cycles')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    if (count === 0) throw new Error("Registro não encontrado no banco.");
  },

  // --- CUSTOS ---
  async getCosts(): Promise<Cost[]> {
    const { data, error } = await supabase.from('costs').select('*').order('date', { ascending: false });
    if (error) return [];
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
    const { error } = await supabase.from('costs').upsert({
      id: cost.id,
      name: cost.name,
      date: cost.date,
      amount: cost.amount,
      type: cost.type,
      operator_id: cost.operatorId,
      operator_name: cost.operatorName,
      owner_admin_id: cost.ownerAdminId
    });
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

  // --- SEED DATA (POPULAR PARA TESTE) ---
  async seedData(currentAdmin: User): Promise<void> {
    const operatorNames = ['Ricardo Silva', 'Ana Oliveira'];
    const dummyOperators: User[] = operatorNames.map((name, i) => ({
      id: `op-test-${i}-${Date.now()}`,
      name,
      username: name.split(' ')[0].toLowerCase() + i,
      password: '123',
      role: 'operator',
      commission: i === 0 ? 15 : 20,
      parentId: currentAdmin.id
    }));

    // 1. Criar Operadores
    await this.saveUsers(dummyOperators);

    // 2. Criar Ciclos (Últimos 7 dias)
    const cyclesToInsert: Cycle[] = [];
    const ops = [currentAdmin, ...dummyOperators];
    
    for (let i = 0; i < 15; i++) {
      const targetOp = ops[Math.floor(Math.random() * ops.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 10));
      
      const dep = 100 + Math.random() * 900;
      const redep = Math.random() > 0.5 ? Math.random() * 300 : 0;
      const draw = dep * (0.8 + Math.random() * 0.5);
      const chest = Math.random() * 150;
      const coop = Math.random() * 50;

      const invested = dep + redep;
      const ret = draw + chest + coop;
      const grossProfit = ret - invested;
      const commVal = grossProfit > 0 ? (grossProfit * (targetOp.commission / 100)) : 0;
      const netProfit = grossProfit - commVal;

      cyclesToInsert.push({
        id: `c-test-${i}-${Date.now()}`,
        name: `Operação ${['VIP', 'Alpha', 'Banca', 'Noite'][i % 4]} #${i + 1}`,
        date: date.toLocaleDateString('pt-BR'),
        deposit: Number(dep.toFixed(2)),
        redeposit: Number(redep.toFixed(2)),
        withdraw: Number(draw.toFixed(2)),
        chest: Number(chest.toFixed(2)),
        cooperation: Number(coop.toFixed(2)),
        invested: Number(invested.toFixed(2)),
        return: Number(ret.toFixed(2)),
        accounts: Math.floor(1 + Math.random() * 4),
        profit: Number(netProfit.toFixed(2)),
        commissionValue: Number(commVal.toFixed(2)),
        operatorId: targetOp.id,
        operatorName: targetOp.name,
        ownerAdminId: currentAdmin.id
      });
    }
    await this.saveAllCycles(cyclesToInsert);

    // 3. Criar Custos
    const costTypes: any[] = ['sms', 'proxy', 'ferramenta', 'outros'];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      await this.saveCost({
        id: `cost-test-${i}-${Date.now()}`,
        name: `Gasto de Teste ${i+1}`,
        date: date.toLocaleDateString('pt-BR'),
        amount: 50 + Math.random() * 200,
        type: costTypes[i % 4],
        operatorId: currentAdmin.id,
        operatorName: currentAdmin.name,
        ownerAdminId: currentAdmin.id
      });
    }
  },

  async exportFullBackup(): Promise<string> {
    const [users, cycles, costs] = await Promise.all([this.getUsers(), this.getCycles(), this.getCosts()]);
    return JSON.stringify({ users, cycles, costs, version: '4.5_rebuilt' });
  },

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.users) await this.saveUsers(data.users);
    if (data.cycles) await this.saveAllCycles(data.cycles);
    if (data.costs) for (const cost of data.costs) await this.saveCost(cost);
  }
};
