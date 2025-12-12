export enum AgentType {
  DISPATCHER = 'DISPATCHER',
  AMA = 'AMA', // Account Management Agent
  TPA = 'TPA', // Transaction Processing Agent
  CSA = 'CSA', // Customer Support Agent
  FRA = 'FRA', // Financial Reporting Agent
  USER = 'USER',
  SYSTEM = 'SYSTEM'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  detectedAgent?: AgentType;
  isStreaming?: boolean;
}

export interface QuickAction {
  label: string;
  prompt: string;
  category: 'info' | 'transaction' | 'account' | 'report';
}