
import { User, Cycle, Cost } from './types';

// Simulação de Banco de Dados Local Robusto
const STORAGE_KEYS = {
  USERS: 'smk_users',
  CYCLES: 'smk_cycles',
  COSTS: 'smk_costs'
};

const getStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const db = {
  // --- AUTENTICAÇÃO ---
  async login(username: string, password: string): Promise<User | null> {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    // Comparação case-insensitive para username
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    return user || null;
  },

  async hasUsers(): Promise<boolean> {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    return users.length > 0;
  },

  async registerAdmin(userData: Omit<User, 'id' | 'role' | 'commission'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `admin-${Date.now()}`,
      role: 'admin',
      commission: 0
    };
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
       throw new Error("Este usuário já está cadastrado.");
    }
    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    return getStorage<User[]>(STORAGE_KEYS.USERS, []);
  },

  async saveUsers(users: User[]): Promise<void> {
    // A função saveUsers recebe a lista COMPLETA de todos os usuários do sistema
    setStorage(STORAGE_KEYS.USERS, users);
  },

  async deleteUser(id: string): Promise<void> {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []).filter(u => u.id !== id);
    setStorage(STORAGE_KEYS.USERS, users);
  },

  // --- CICLOS ---
  async getCycles(): Promise<Cycle[]> {
    return getStorage<Cycle[]>(STORAGE_KEYS.CYCLES, []);
  },

  async saveCycle(cycle: Cycle): Promise<void> {
    const cycles = getStorage<Cycle[]>(STORAGE_KEYS.CYCLES, []);
    cycles.unshift(cycle);
    setStorage(STORAGE_KEYS.CYCLES, cycles);
  },

  async saveAllCycles(cycles: Cycle[]): Promise<void> {
    setStorage(STORAGE_KEYS.CYCLES, cycles);
  },

  async deleteCycle(id: string): Promise<void> {
    const cycles = getStorage<Cycle[]>(STORAGE_KEYS.CYCLES, []).filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.CYCLES, cycles);
  },

  // --- CUSTOS ---
  async getCosts(): Promise<Cost[]> {
    return getStorage<Cost[]>(STORAGE_KEYS.COSTS, []);
  },

  async saveCost(cost: Cost): Promise<void> {
    const costs = getStorage<Cost[]>(STORAGE_KEYS.COSTS, []);
    costs.unshift(cost);
    setStorage(STORAGE_KEYS.COSTS, costs);
  },

  async deleteCost(id: string): Promise<void> {
    const costs = getStorage<Cost[]>(STORAGE_KEYS.COSTS, []).filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.COSTS, costs);
  },

  // --- BACKUP ---
  async exportFullBackup(): Promise<string> {
    const data = {
      users: await this.getUsers(),
      cycles: await this.getCycles(),
      costs: await this.getCosts(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.users) setStorage(STORAGE_KEYS.USERS, data.users);
    if (data.cycles) setStorage(STORAGE_KEYS.CYCLES, data.cycles);
    if (data.costs) setStorage(STORAGE_KEYS.COSTS, data.costs);
  },

  async clearAllData(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    window.location.reload();
  }
};
