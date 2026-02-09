
export type Role = 'admin' | 'operator';
export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all';
export type CostType = 'sms' | 'proxy' | 'ferramenta' | 'outros';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  commission: number;
  avatar?: string;
  parentId?: string; // ID do Admin que criou este operador
}

export interface Cycle {
  id: string;
  name: string;
  date: string; // Formato DD/MM/YYYY
  invested: number;
  return: number;
  accounts: number;
  profit: number;
  commissionValue: number;
  operatorId: string;
  operatorName: string;
  ownerAdminId: string; // ID do Admin dono deste dado
}

export interface Cost {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: CostType;
  operatorId: string;
  operatorName: string;
  ownerAdminId: string; // ID do Admin dono deste dado
}

export type View = 'dashboard' | 'cycles' | 'costs' | 'team' | 'goals';
