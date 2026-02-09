
import { User, Cycle, Cost } from './types';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase fornecida pelo usuário
const supabaseUrl = 'https://hgrmuhkxkkslmdppshlr.supabase.co';
// Utilizamos a API_KEY configurada no ambiente para autenticação segura
const supabaseKey = process.env.API_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_USERS: User[] = [
  { id: 'admin-1', name: 'Gerente Geral', username: 'admin', password: '123', role: 'admin', commission: 0 },
  { id: 'op-1', name: 'Operador Carlos', username: 'carlos', password: '123', role: 'operator', commission: 15 },
  { id: 'op-2', name: 'Operador Ana', username: 'ana', password: '123', role: 'operator', commission: 10 },
];

export const db = {
  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    
    if (error || !data || data.length === 0) {
      // Se a tabela estiver vazia, tenta popular com os usuários iniciais pela primeira vez
      const saved = localStorage.getItem('fm_db_users_synced');
      if (!saved) {
        await supabase.from('users').insert(INITIAL_USERS);
        localStorage.setItem('fm_db_users_synced', 'true');
        return INITIAL_USERS;
      }
      return [];
    }
    return data as User[];
  },

  async saveUsers(users: User[]): Promise<void> {
    // Upsert para salvar ou atualizar múltiplos usuários
    const { error } = await supabase.from('users').upsert(users);
    if (error) throw error;
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
    return data as Cycle[];
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    const { error } = await supabase.from('cycles').insert([cycle]);
    if (error) throw error;
  },

  async saveAllCycles(cycles: Cycle[]): Promise<void> {
    const { error } = await supabase.from('cycles').upsert(cycles);
    if (error) throw error;
  },

  async deleteCycle(id: string): Promise<void> {
    const { error } = await supabase.from('cycles').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CUSTOS ---
  async getCosts(): Promise<Cost[]> {
    const { data, error } = await supabase.from('costs').select('*');
    if (error) return [];
    return data as Cost[];
  },

  async saveCost(cost: Cost): Promise<void> {
    const { error } = await supabase.from('costs').insert([cost]);
    if (error) throw error;
  },

  async deleteCost(id: string): Promise<void> {
    const { error } = await supabase.from('costs').delete().eq('id', id);
    if (error) throw error;
  },

  // --- FERRAMENTAS ---
  async exportFullBackup(): Promise<string> {
    const [users, cycles, costs] = await Promise.all([
      this.getUsers(),
      this.getCycles(),
      this.getCosts()
    ]);
    return JSON.stringify({ users, cycles, costs, exportedAt: new Date().toISOString() }, null, 2);
  },

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.users) await supabase.from('users').upsert(data.users);
    if (data.cycles) await supabase.from('cycles').upsert(data.cycles);
    if (data.costs) await supabase.from('costs').upsert(data.costs);
  },

  async clearAllData(): Promise<void> {
    // Limpeza radical para manutenção
    await Promise.all([
      supabase.from('cycles').delete().neq('id', '0'),
      supabase.from('costs').delete().neq('id', '0'),
      supabase.from('users').delete().neq('role', 'admin')
    ]);
    window.location.reload();
  }
};
