
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
  parentId?: string;
}

export interface Cycle {
  id: string;
  name: string;
  date: string;
  deposit: number;
  redeposit: number;
  withdraw: number;
  chest: number;
  cooperation: number;
  invested: number;
  return: number;
  accounts: number;
  profit: number; // Agora representa o Lucro Bruto da operação (Retorno - Investimento)
  commissionValue: number; // Será calculado dinamicamente ou mantido como referência
  operatorId: string;
  operatorName: string;
  ownerAdminId: string;
}

export interface Cost {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: CostType;
  operatorId: string;
  operatorName: string;
  ownerAdminId: string;
}

export type View = 'dashboard' | 'cycles' | 'costs' | 'team' | 'goals';
