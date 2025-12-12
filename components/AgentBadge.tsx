import React from 'react';
import { AgentType } from '../types';

interface Props {
  type: AgentType;
}

const AgentBadge: React.FC<Props> = ({ type }) => {
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
  let label = "SYSTEM";
  let description = "Banking System Core";

  switch (type) {
    case AgentType.AMA:
      colorClass = "bg-purple-50 text-purple-700 border-purple-200";
      label = "AMA";
      description = "Account Management";
      break;
    case AgentType.TPA:
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      label = "TPA";
      description = "Transaction Processing";
      break;
    case AgentType.CSA:
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      label = "CSA";
      description = "Customer Support";
      break;
    case AgentType.FRA:
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      label = "FRA";
      description = "Financial Reporting";
      break;
    case AgentType.DISPATCHER:
      colorClass = "bg-slate-800 text-white border-slate-900";
      label = "ROUTING";
      description = "Analyzing Intent...";
      break;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium border ${colorClass} transition-all duration-300 animate-fadeIn`}>
      <span className="font-bold tracking-wider">{label}</span>
      <div className="w-px h-3 bg-current opacity-20"></div>
      <span className="opacity-90">{description}</span>
    </div>
  );
};

export default AgentBadge;