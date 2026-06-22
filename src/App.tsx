import React, { useState, useEffect } from 'react';
import { db, seedInitialAgentsIfEmpty } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AIAgent, Task, EscrowState, TxTelemetry } from './types';
import AgentMarketplace from './components/AgentMarketplace';
import AgentRegistryForm from './components/AgentRegistryForm';
import ReputationBoard from './components/ReputationBoard';
import EscrowTelemetry from './components/EscrowTelemetry';
import ContractWorkspace from './components/ContractWorkspace';
import DemoScenario from './components/DemoScenario';
import { 
  Terminal, ShieldCheck, ShoppingBag, LayoutDashboard, Code, 
  HelpCircle, Cpu, Radio, Award, UserPlus, RefreshCw, Key, Wallet 
} from 'lucide-react';

const STATIC_ESCROWS: EscrowState[] = [
  {
    taskId: "task-escrow-101",
    balance: 150,
    depositor: "0x89205A3A3b2A6adF3De4cd236045418Be7024ea5",
    beneficiary: "0x3910A2B12F6AdF3De4cd236045418Be7024ea12",
    collateralStaked: 15,
    status: "Released",
    x402Route: "x402:route:fuji:task-escrow-101-finalized"
  },
  {
    taskId: "task-escrow-102",
    balance: 400,
    depositor: "0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9",
    beneficiary: "0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9",
    collateralStaked: 40,
    status: "Locked",
    x402Route: "x402:route:fuji:task-escrow-102-lock"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'registry' | 'reputation' | 'contracts' | 'telemetry'>('marketplace');
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [escrowStates, setEscrowStates] = useState<EscrowState[]>(STATIC_ESCROWS);
  const [txList, setTxList] = useState<TxTelemetry[]>([
    {
      id: "genesis-tx-1",
      hash: "0x9c3bfcc233d6b63ad32fb2d5cc527e02377da1a329fcd6dffc0b8760773d3e17",
      blockNumber: 15420100,
      from: "0x0000000000000000000000000000000000000000",
      to: "0x3e1765c9700B0224A1a329FCD6dfFC0B8760773d",
      value: "0 AVAX",
      gasUsed: 420000,
      type: "DEPLOY",
      timestamp: Date.now() - 3600000 * 2,
      details: "Genesis Registry contract deployed on Avalanche Fuji Testnet. Standard ERC-8004 capabilities linked."
    }
  ]);

  // Handle Simulated Wallet State
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState('0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9');
  const [walletBalance, setWalletBalance] = useState({ avax: 24.85, usdc: 3500 });

  // Initialize and Seed Database
  useEffect(() => {
    const initDb = async () => {
      await seedInitialAgentsIfEmpty();
    };
    initDb();
  }, []);

  // Listen for Realtime Agents updates from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "agents"), (snapshot) => {
        const list: AIAgent[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AIAgent);
        });
        setAgents(list);
      });
      return unsub;
    } catch (error) {
      console.error("Firestore agents sub error:", error);
    }
  }, []);

  // Listen for Realtime Tasks updates from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
        const list: Task[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(list);
      });
      return unsub;
    } catch (error) {
      console.error("Firestore tasks sub error:", error);
    }
  }, []);

  // Action helpers to add transaction metrics
  const handleAddTx = (newTx: TxTelemetry) => {
    setTxList(prev => [newTx, ...prev]);
    // Deduct simulated gaz and balance safely
    if (newTx.type === 'DEPLOY' || newTx.type === 'IDENTITY_REGISTRATION') {
      setWalletBalance(prev => ({ ...prev, avax: Math.max(0, Number((prev.avax - 0.05).toFixed(4))) }));
    } else if (newTx.type === 'ESCROW_FUND') {
      const valueMatch = newTx.value.match(/(\d+)/);
      const amount = valueMatch ? Number(valueMatch[0]) : 0;
      setWalletBalance(prev => ({ ...prev, usdc: Math.max(0, prev.usdc - amount), avax: Number((prev.avax - 0.002).toFixed(4)) }));
    }
  };

  const handleUpdateEscrow = (state: EscrowState) => {
    setEscrowStates(prev => {
      const index = prev.findIndex(e => e.taskId === state.taskId);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = state;
        return copy;
      } else {
        return [state, ...prev];
      }
    });
  };

  const connectWalletSim = () => {
    if (walletConnected) {
      setWalletConnected(false);
    } else {
      setWalletConnected(true);
      setWalletAddress('0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''));
      setWalletBalance({ avax: 50.00, usdc: 5000 });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between" id="applet-viewport">
      {/* Immersive Professional Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-zinc-700/50 shadow-md">
              <Cpu className="w-5 h-5 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-lg tracking-wider text-zinc-100 uppercase">AgentTrust</h1>
                <span className="bg-red-500/10 text-red-500 text-[9px] font-mono border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold">
                  FUJI TESTNET
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono tracking-tight uppercase">x402 agentic escrow & reputation consensus framework</p>
            </div>
          </div>

          {/* Web3 Sim Wallet Controls */}
          <div className="flex items-center gap-4">
            {walletConnected && (
              <div className="hidden md:flex items-center border border-zinc-800 bg-zinc-900 rounded-xl p-2.5 font-mono text-[11px] gap-4">
                <div className="text-right">
                  <span className="text-zinc-500 block text-[9px] font-bold uppercase">WALLET BALANCE</span>
                  <div className="text-zinc-200 font-bold flex gap-3">
                    <span className="text-yellow-400">{walletBalance.avax} AVAX</span>
                    <span className="text-emerald-400">{walletBalance.usdc.toLocaleString()} USDC</span>
                  </div>
                </div>
                <div className="border-l border-zinc-800 h-6 shrink-0" />
                <div className="text-left">
                  <span className="text-zinc-500 block text-[9px] font-bold uppercase">Consensus Persona</span>
                  <span className="text-blue-400 font-semibold">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                </div>
              </div>
            )}

            <button
              onClick={connectWalletSim}
              className={`font-semibold py-2 px-4 rounded-xl text-xs font-display flex items-center gap-1.5 transition-all border ${
                walletConnected
                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10'
              }`}
            >
              <Wallet className="w-4 h-4" />
              {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-8">
        
        {/* Dynamic Demo scenario launcher at very top */}
        <DemoScenario 
          onAddTx={handleAddTx}
          onUpdateEscrow={handleUpdateEscrow}
          onRefreshTasks={() => {}}
          onRefreshAgents={() => {}}
          agents={agents}
          walletAddress={walletAddress}
        />

        {/* Dynamic navigation tab toolbar */}
        <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-display font-semibold transition-all uppercase tracking-wider relative ${
              activeTab === 'marketplace' ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Agent Marketplace
            {activeTab === 'marketplace' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-display font-semibold transition-all uppercase tracking-wider relative ${
              activeTab === 'registry' ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Agent Registry
            {activeTab === 'registry' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('reputation')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-display font-semibold transition-all uppercase tracking-wider relative ${
              activeTab === 'reputation' ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Award className="w-4 h-4" />
            Reputation Matrix
            {activeTab === 'reputation' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-display font-semibold transition-all uppercase tracking-wider relative ${
              activeTab === 'contracts' ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Code className="w-4 h-4" />
            Smart Contracts (EVM)
            {activeTab === 'contracts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-display font-semibold transition-all uppercase tracking-wider relative ${
              activeTab === 'telemetry' ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Escrow Telemetry
            {activeTab === 'telemetry' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>}
          </button>
        </div>

        {/* Active Route View Content */}
        <div className="pt-2">
          {activeTab === 'marketplace' && (
            <AgentMarketplace 
              tasks={tasks}
              agents={agents}
              onRefreshTasks={() => {}}
              onRefreshAgents={() => {}}
              onAddTx={handleAddTx}
              onUpdateEscrow={handleUpdateEscrow}
              walletConnected={walletConnected}
              walletAddress={walletAddress}
            />
          )}

          {activeTab === 'registry' && (
            <div className="max-w-xl mx-auto">
              <AgentRegistryForm 
                onAgentRegistered={() => setActiveTab('reputation')}
                onAddTx={handleAddTx}
                walletConnected={walletConnected}
                walletAddress={walletAddress}
              />
            </div>
          )}

          {activeTab === 'reputation' && (
            <ReputationBoard agents={agents} />
          )}

          {activeTab === 'contracts' && (
            <ContractWorkspace 
              onAddTx={handleAddTx}
              walletConnected={walletConnected}
              walletAddress={walletAddress}
            />
          )}

          {activeTab === 'telemetry' && (
            <EscrowTelemetry 
              txList={txList}
              escrowStates={escrowStates}
              onClearTelemetry={() => setTxList([])}
            />
          )}
        </div>
      </main>

      {/* Cyber footer info */}
      <footer className="border-t border-zinc-850 bg-zinc-950 px-6 py-4 mt-12 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
        <span>© 2026 AgentTrust Escrow Network. Underlay nodes synced securely.</span>
        <div className="flex gap-4">
          <span className="hover:text-blue-400 transition-colors uppercase">Fuji-Explorer Link</span>
          <span className="hover:text-blue-400 transition-colors uppercase">x402 Docs</span>
        </div>
      </footer>
    </div>
  );
}
