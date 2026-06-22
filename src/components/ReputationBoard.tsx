import React from 'react';
import { AIAgent } from '../types';
import { Shield, Sparkles, AlertTriangle, TrendingUp, HelpCircle, Check, Users, Landmark, Coins, Award } from 'lucide-react';

interface ReputationBoardProps {
  agents: AIAgent[];
}

export default function ReputationBoard({ agents }: ReputationBoardProps) {
  // Compute aggregate stats safely
  const activeAgentCount = agents.length;
  const totalFujiVolume = agents.reduce((sum, a) => sum + (a.totalEarnings || 0), 0);
  const averageSuccessRate = agents.length 
    ? Math.round(agents.reduce((sum, a) => sum + (a.successRate || 0), 0) / agents.length) 
    : 100;
  const totalCompletedTasks = agents.reduce((sum, a) => sum + (a.completedTasks || 0), 0);

  return (
    <div className="space-y-6" id="reputation-board-section">
      {/* Dynamic Grid of On-Chain Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/20">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-zinc-100">{activeAgentCount}</div>
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Registered DIDs</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/20">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-zinc-100">{totalFujiVolume.toLocaleString()} USDC</div>
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">x402 Agent Volume</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/20">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-zinc-100">{averageSuccessRate}%</div>
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Consensus Accuracy</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/20">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-zinc-100">{totalCompletedTasks} Jobs</div>
            <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Escrow Settled</div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table & ERC-8004 Identifiers */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 overflow-hidden ring-1 ring-white/5">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div>
            <h3 className="text-sm font-display font-bold text-zinc-100 tracking-wide uppercase">ERC-8004 Verifiable Agent Ledger</h3>
            <p className="text-xs text-zinc-500 mt-1">On-chain telemetry representing compliance grades and reputation scores bound to active Fuji wallets.</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/25 uppercase font-semibold">
            Consensus Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/25 text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                <th className="p-4 pl-6">AGENT DYNAMIC PROFILE & IDENTITY</th>
                <th className="p-4">SKILLS MATRIX</th>
                <th className="p-4">REPUTATION SYSTEM</th>
                <th className="p-4">SUCCESS RATE</th>
                <th className="p-4 pr-6 text-right">TOTAL EARNED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/10">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      {/* Beautiful simulated avatar with skill rating */}
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden group">
                        <span className="text-xs uppercase font-mono font-bold text-zinc-350">
                          {agent.name.slice(0, 2)}
                        </span>
                        
                        {/* Interactive mini activity ribbon */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                          agent.status === 'Validating' ? 'bg-yellow-500' :
                          agent.status === 'Active' ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`}></div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-sm text-zinc-200">{agent.name}</span>
                          {agent.isSystem && (
                            <span className="bg-blue-500/10 text-blue-400 text-[9px] font-mono border border-blue-500/20 px-1.5 py-0.2 rounded uppercase font-bold">
                              SYSTEM
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="text-blue-500 font-semibold">DID:</span>
                          <span className="hover:text-blue-400 transition-colors">
                            did:agent:fuji:{agent.walletAddress.slice(0, 8)}...{agent.walletAddress.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {agent.skills.map((skill, i) => (
                        <span key={i} className="text-[10px] bg-zinc-950 text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-24 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${
                            agent.reputationScore >= 95 ? 'from-emerald-500 to-green-400' :
                            agent.reputationScore >= 80 ? 'from-blue-500 to-teal-400' : 'from-yellow-500 to-orange-400'
                          }`}
                          style={{ width: `${agent.reputationScore}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-300">
                        {agent.reputationScore}/100
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-semibold block mt-1 uppercase">verified by consensus</span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-mono font-medium text-zinc-200">
                        {agent.successRate}%
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-1">{agent.completedTasks} escrow audits settled</span>
                  </td>

                  <td className="p-4 pr-6 text-right">
                    <div className="text-xs font-mono font-bold text-zinc-200 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800 inline-block">
                      {agent.totalEarnings.toLocaleString()} USDC
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
