import React from 'react';
import { TxTelemetry, EscrowState } from '../types';
import { Activity, ShieldCheck, Terminal, AlertTriangle, ArrowRight, CornerDownRight, RefreshCw, Radio } from 'lucide-react';

interface EscrowTelemetryProps {
  txList: TxTelemetry[];
  escrowStates: EscrowState[];
  onClearTelemetry?: () => void;
}

export default function EscrowTelemetry({ txList, escrowStates, onClearTelemetry }: EscrowTelemetryProps) {
  // Sort transactions in reverse-chronological order (newest first)
  const sortedTx = [...txList].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="escrow-telemetry-section">
      {/* Visual Contract States Grid */}
      <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-zinc-100 text-sm tracking-wide uppercase">x402 Escrow States</h3>
            </div>
            <span className="flex items-center h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 mb-4 font-sans leading-relaxed">
            Active smart lock balances representing frozen worker deposits and task rewards secured on Fuji Testnet.
          </p>

          <div className="space-y-3.5">
            {escrowStates.length === 0 ? (
              <div className="text-center p-6 bg-zinc-950/40 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 font-mono">No active escrow records locked.</p>
              </div>
            ) : (
              escrowStates.map((escrow) => (
                <div key={escrow.taskId} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">
                      ESCROW #{escrow.taskId.slice(-4)}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                      escrow.status === 'Released' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      escrow.status === 'Locked' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      escrow.status === 'Claimed' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {escrow.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 text-center">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Bounty Balance</span>
                      <span className="text-zinc-100 font-bold">{escrow.balance} USDC</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 text-center">
                      <span className="text-zinc-500 block text-[8px] uppercase font-bold">Staked Collateral</span>
                      <span className="text-zinc-100 font-bold">{escrow.collateralStaked} USDC</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 text-[9px] font-mono leading-none">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Depositor:</span>
                      <span className="text-zinc-400">{escrow.depositor.slice(0, 8)}...{escrow.depositor.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Beneficiary:</span>
                      <span className="text-zinc-400">{escrow.beneficiary.slice(0, 8)}...{escrow.beneficiary.slice(-6)}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-t border-zinc-800/60 mt-2.5 pt-2">
                      <span className="text-zinc-500 text-[8px] uppercase font-bold flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                        x402 Payment Route Signature
                      </span>
                      <span className="text-zinc-400 bg-zinc-950 p-1 rounded font-mono break-all text-[8px] border border-zinc-800/80">
                        {escrow.x402Route}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action-flow infographic */}
        <div className="mt-6 p-4 bg-zinc-950/40 rounded-lg border border-zinc-850/85 text-[10px] font-mono text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-400 uppercase font-bold text-[9px] tracking-wide mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Agentic Payments Protocol (x402)</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-center inline-block">1</span>
            <span>Depositor pre-funds reward balance</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-center inline-block">2</span>
            <span>Worker commits collateral deposit</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-center inline-block">3</span>
            <span>Gemini Validator posts proof check on-chain</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-center inline-block">4</span>
            <span>Escrow self-executes pay release/refund</span>
          </div>
        </div>
      </div>

      {/* Transaction Feed Ledger */}
      <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between ring-1 ring-white/5 shadow-xl shadow-black/30">
        <div>
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <Terminal className="text-blue-500 w-5 h-5" />
              <h3 className="font-display font-bold text-zinc-100 text-sm tracking-wide uppercase">Fuji Transaction Telemetry</h3>
            </div>
            {onClearTelemetry && (
              <button 
                onClick={onClearTelemetry}
                className="text-[10px] text-zinc-500 hover:text-blue-400 font-mono transition-colors uppercase font-bold cursor-pointer"
              >
                Clear Logs
              </button>
            )}
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[460px] overflow-y-auto">
            {sortedTx.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-xs text-zinc-500 font-mono">No network transactions emitted yet.</p>
              </div>
            ) : (
              sortedTx.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-zinc-950/20 transition-all font-mono text-[10.5px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        tx.type === 'DEPLOY' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        tx.type === 'IDENTITY_REGISTRATION' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        tx.type === 'ESCROW_FUND' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.type === 'COLLATERAL_LOCKED' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        tx.type === 'SUBMISSION' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        tx.type === 'VALIDATOR_PROOF' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold truncate max-w-[120px] lg:max-w-none">
                        TX: {tx.hash.slice(0, 14)}...{tx.hash.slice(-10)}
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-zinc-350 leading-normal mb-1">{tx.details}</p>

                  <div className="flex items-center gap-4 text-zinc-500 text-[9px] pt-1">
                    <span>From: <span className="text-zinc-400">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span></span>
                    <span>To: <span className="text-zinc-400">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span></span>
                    <span>Gas: <span className="text-zinc-400">{tx.gasUsed.toLocaleString()} units</span></span>
                    <span className="text-blue-500 font-bold ml-auto hover:underline cursor-pointer">
                      <a href={`https://fuji.snowtrace.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                        Explorer ↗
                      </a>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Base telemetry block info */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between font-mono text-[10px] text-zinc-500">
          <span>Active Nodes: <span className="text-zinc-300 font-bold">120 Fuji Validators</span></span>
          <span>Block Height: <span className="text-emerald-400 font-bold">15,420,495</span></span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span>
            Avalanche Fuji Network Active
          </span>
        </div>
      </div>
    </div>
  );
}
