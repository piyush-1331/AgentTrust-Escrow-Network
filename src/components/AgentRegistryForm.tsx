import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { AIAgent, TxTelemetry } from '../types';
import { Plus, UserCheck, Shield, Key, AlertCircle, HelpCircle } from 'lucide-react';

interface AgentRegistryFormProps {
  onAgentRegistered: () => void;
  onAddTx: (tx: TxTelemetry) => void;
  walletConnected: boolean;
  walletAddress: string;
}

const COMMON_SKILLS = [
  "SEO Research", "Data Synthesis", "Market Intelligence", "Crypto Analysis", 
  "Technical Report", "Oracle Auditing", "Translation Service", "Sentiment Mining", "Code Synthesis"
];

export default function AgentRegistryForm({ onAgentRegistered, onAddTx, walletConnected, walletAddress }: AgentRegistryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMesssage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!walletConnected) {
      setErrorMessage("Please connect agent wallet in the header before starting ERC-8004 identity registration!");
      return;
    }

    if (!name || !description) {
      setErrorMessage("Please complete all registry input fields.");
      return;
    }

    if (selectedSkills.length === 0) {
      setErrorMessage("Please select at least one agent skill or capability.");
      return;
    }

    setIsSubmitting(true);

    try {
      const agentId = `agent-${Date.now()}`;
      const didHash = `did:agent:fuji:${walletAddress.toLowerCase()}`;
      
      const newAgent: AIAgent = {
        id: agentId,
        name: name,
        description: description,
        walletAddress: walletAddress,
        skills: selectedSkills,
        reputationScore: 100, // Initiates at pristine score
        successRate: 100,
        totalEarnings: 0,
        completedTasks: 0,
        status: 'Idle',
        createdAt: Date.now()
      };

      // Store in firestore database
      await setDoc(doc(db, "agents", agentId), newAgent);

      // Log transaction telemetry
      const tx: TxTelemetry = {
        id: `reg-${Date.now()}`,
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        blockNumber: 15420380,
        from: walletAddress,
        to: '0x3e1765c9700B0224A1a329FCD6dfFC0B8760773d', // Deployed AgentRegistry address
        value: '0 AVAX (Claim identity fee: 0.01 AVAX)',
        gasUsed: 232000,
        type: 'IDENTITY_REGISTRATION',
        timestamp: Date.now(),
        details: `ERC-8004 Identity Registration complete. DID binding linked: ${didHash}`
      };
      
      onAddTx(tx);
      
      // Reset Registry controls
      setName('');
      setDescription('');
      setSelectedSkills([]);
      onAgentRegistered();
      
      setSuccessMessage(`Identity registered successfully! DID set: ${didHash}`);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to register agent identity to on-chain Firestore ledger.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-805 rounded-xl p-6 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/30" id="agent-registry-form">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-display font-bold text-zinc-100 tracking-wide uppercase">ERC-8004 Agent Registry</h3>
          <p className="text-[11px] text-zinc-500">Formulate and deploy secure W3C-compatible Agentic DIDs bound on-chain to Avalanche wallet keys.</p>
        </div>
      </div>

      {errorMesssage && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg border border-red-500/20 text-xs flex items-center gap-2 mb-4 animate-pulse-once">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMesssage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/20 text-xs flex items-center gap-2 mb-4">
          <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-mono overflow-auto">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Agent Name & Tag</label>
          <input 
            type="text" 
            placeholder="e.g., SentimentMiner v1.2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-zinc-950 text-zinc-200 text-xs p-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Agent Objective & Directive Description</label>
          <textarea 
            placeholder="Summarize the core execution logic, data scraping targets, or analysis patterns the AI Agent executes upon hiring."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-zinc-950 text-zinc-200 text-xs p-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Capabilities / Core Skills</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SKILLS.map((skill) => {
              const selected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  disabled={isSubmitting}
                  className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    selected 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 flex items-center justify-between text-[11px] font-mono mt-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Key className="w-3.5 h-3.5" />
            <span>Target Wallet ID:</span>
          </div>
          <span className="text-blue-400 select-all font-semibold">
            {walletConnected ? `${walletAddress.slice(0, 16)}...${walletAddress.slice(-12)}` : 'Unconnected Wallet'}
          </span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-display text-xs font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isSubmitting ? "Registering Agent ID..." : "Register & Bind ERC-8004 DID"}
        </button>
      </form>
    </div>
  );
}
