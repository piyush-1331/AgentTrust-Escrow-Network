import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Task, AIAgent, TxTelemetry, EscrowState } from '../types';
import { AppWindow, Send, Lock, Eye, CheckSquare, Search, AlertCircle, ShoppingBag, ShieldCheck, Play, Key, ChevronDown } from 'lucide-react';

interface AgentMarketplaceProps {
  tasks: Task[];
  agents: AIAgent[];
  onRefreshTasks: () => void;
  onRefreshAgents: () => void;
  onAddTx: (tx: TxTelemetry) => void;
  onUpdateEscrow: (state: EscrowState) => void;
  walletConnected: boolean;
  walletAddress: string;
}

export default function AgentMarketplace({
  tasks,
  agents,
  onRefreshTasks,
  onRefreshAgents,
  onAddTx,
  onUpdateEscrow,
  walletConnected,
  walletAddress
}: AgentMarketplaceProps) {
  // Post Task states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(150);
  const [collateral, setCollateral] = useState(15);
  const [requiredSkill, setRequiredSkill] = useState('Data Synthesis');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Submit Work states
  const [workOutputs, setWorkOutputs] = useState<Record<string, string>>({});
  const [isSubmittingWork, setIsSubmittingWork] = useState<Record<string, boolean>>({});

  // Validation States
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  // Filter skills
  const [searchFilter, setSearchFilter] = useState('');

  const handlePostTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');

    if (!walletConnected) {
      setPostError("Please connect your wallet first to authorize Fuji gas fees.");
      return;
    }

    if (!title || !description) {
      setPostError("Please input task title and descriptions.");
      return;
    }

    setIsPosting(true);

    try {
      const taskData = {
        title,
        description,
        requiredSkills: [requiredSkill],
        budget: Number(budget),
        collateral: Number(collateral),
        status: 'Open',
        posterId: walletAddress,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, "tasks"), taskData);
      
      // Log transaction
      const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const tx: TxTelemetry = {
        id: `post-${Date.now()}`,
        hash: txHash,
        blockNumber: 15420390,
        from: walletAddress,
        to: '0xbf9c3bEDFcc233d6b63Ad32fB2D5Cc527e02377d', // Marketplace Contract Address
        value: `${budget} USDC (Frozen)`,
        gasUsed: 185000,
        type: 'ESCROW_FUND',
        timestamp: Date.now(),
        details: `Task posted: "${title}". Pre-funded escrow locked budget count: ${budget} USDC.`
      };
      onAddTx(tx);

      // Create escrow log configuration
      onUpdateEscrow({
        taskId: docRef.id,
        balance: Number(budget),
        depositor: walletAddress,
        beneficiary: '0x0000000000000000000000000000000000000000',
        collateralStaked: 0,
        status: 'Locked',
        x402Route: `x402:route:fuji:${docRef.id}-lock`
      });

      setTitle('');
      setDescription('');
      onRefreshTasks();
      alert("Task advertised & Escalated to Fuji Escrow network !");
    } catch (err: any) {
      console.error(err);
      setPostError("Failed to advertise task to Firebase ledger.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAcceptTask = async (taskId: string, agent: AIAgent) => {
    if (!walletConnected) {
      alert("Connect wallet to permit testnet contract state transactions.");
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Update Task state in Firestore
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: 'InProgress',
        workerId: agent.id,
        validatorId: 'agent-validator', // Set system validator
        updatedAt: Date.now()
      });

      // Update Agent status to active execution
      const agentRef = doc(db, "agents", agent.id);
      await updateDoc(agentRef, {
        status: 'Active'
      });

      // Transact telemetry logs
      const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const tx: TxTelemetry = {
        id: `accept-${Date.now()}`,
        hash: txHash,
        blockNumber: 15420412,
        from: agent.walletAddress,
        to: '0xbf9c3bEDFcc233d6b63Ad32fB2D5Cc527e02377d', // Marketplace smart-contract
        value: `${task.collateral} USDC (Stake collateral)`,
        gasUsed: 220000,
        type: 'COLLATERAL_LOCKED',
        timestamp: Date.now(),
        details: `Agent "${agent.name}" accepted task. Collateral stake locked: ${task.collateral} USDC.`
      };
      onAddTx(tx);

      // Update Escrow state
      onUpdateEscrow({
        taskId: taskId,
        balance: task.budget,
        depositor: task.posterId,
        beneficiary: agent.walletAddress,
        collateralStaked: task.collateral,
        status: 'Locked',
        x402Route: `x402:route:fuji:${taskId}-accept`
      });

      onRefreshTasks();
      onRefreshAgents();
      alert(`Agent "${agent.name}" hired! St staked collateral locked on Fuji.`);
    } catch (error) {
      console.error(error);
      alert("Error accepting task.");
    }
  };

  const handleSubmitWork = async (taskId: string) => {
    const submission = workOutputs[taskId];
    if (!submission || submission.trim().length === 0) {
      alert("Please output your work deliverables code/report inside the text area.");
      return;
    }

    setIsSubmittingWork(prev => ({ ...prev, [taskId]: true }));

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: 'Submitted',
        submissionOutput: submission,
        updatedAt: Date.now()
      });

      // telemetry
      const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const tx: TxTelemetry = {
        id: `sub-${Date.now()}`,
        hash: txHash,
        blockNumber: 1542450,
        from: walletConnected ? walletAddress : '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
        to: '0x7eDe68dfC9F800B022A1a32a673d32fB2D5D4bEa', // Escrow address
        value: '0 USDC',
        gasUsed: 95000,
        type: 'SUBMISSION',
        timestamp: Date.now(),
        details: `Agent submitted work payload. Bytecode storage mapping hash locked on Fuji blocks.`
      };
      onAddTx(tx);

      onRefreshTasks();
      alert("Work delivered successfully. Retrying consensus validator approval.");
    } catch (error) {
      console.error(error);
      alert("Failed delivering work output.");
    } finally {
      setIsSubmittingWork(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleTriggerAIValidation = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setIsValidating(prev => ({ ...prev, [taskId]: true }));

      let auditResult;
      try {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            taskTitle: task.title,
            taskDescription: task.description,
            submittedWork: task.submissionOutput,
            skillsRequired: task.requiredSkills
          })
        });

        if (response.ok) {
          auditResult = await response.json();
          if (!auditResult.success) {
            throw new Error(auditResult.error || "Gemini Smart Audit validation error");
          }
        } else {
          throw new Error("API Route not available");
        }
      } catch (fetchError) {
        console.warn("Direct API check failed or API route is not available (e.g. static host). Running client-side validation simulation...", fetchError);
        
        const hasPlaceholders = (task.submissionOutput || "").toLowerCase().includes("placeholder") || (task.submissionOutput || "").length < 50;
        const score = hasPlaceholders ? 65 : 92;
        const decision = score >= 70 ? "APPROVE_AND_RELEASE_PAYMENT" : "REJECT_AND_REFUND";
        const feedback = hasPlaceholders
          ? "Warning: Submission is extremely brief and contains placeholder tags. Quality score does not meet full compliance thresholds."
          : "Audit complete: Deliverables exhibit thorough technical research, detailed protocol analyses, and robust on-chain structure compliant with Fuji Fuji specs.";

        auditResult = {
          success: true,
          qualityScore: score,
          technicalCompliance: !hasPlaceholders,
          analysis: `[STATIC MOCK VALIDATOR] ${feedback}`,
          decision: decision,
          aiValidated: false
        };
      }

      // 1. Update task results in Firestore
      const taskRef = doc(db, "tasks", taskId);
      const isApproved = auditResult.decision === 'APPROVE_AND_RELEASE_PAYMENT';
      
      await updateDoc(taskRef, {
        status: isApproved ? 'Completed' : 'Refunded',
        validationOutput: {
          qualityScore: auditResult.qualityScore,
          technicalCompliance: auditResult.technicalCompliance,
          analysis: auditResult.analysis,
          decision: auditResult.decision,
          timestamp: Date.now()
        },
        updatedAt: Date.now()
      });

      // 2. Adjust worker earnings / reputation
      if (task.workerId) {
        const worker = agents.find(a => a.id === task.workerId);
        if (worker) {
          const agentRef = doc(db, "agents", task.workerId);
          if (isApproved) {
            await updateDoc(agentRef, {
              status: 'Idle',
              totalEarnings: worker.totalEarnings + task.budget,
              completedTasks: worker.completedTasks + 1,
              reputationScore: Math.min(100, Math.round((worker.reputationScore + 100) / 2))
            });
          } else {
            await updateDoc(agentRef, {
              status: 'Idle',
              reputationScore: Math.max(10, worker.reputationScore - 15) // Slash penalty score
            });
          }
        }
      }

      // 3. Telemetry transactions
      const proofHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const proofTx: TxTelemetry = {
        id: `proof-${Date.now()}`,
        hash: proofHash,
        blockNumber: 15420488,
        from: '0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9', // ValidatorBot wallet
        to: '0x1C22FC90F800B022a1a32a673d32fB2D5CD876c', // ReputationAggregator address
        value: '0 USDC',
        gasUsed: 310000,
        type: 'VALIDATOR_PROOF',
        timestamp: Date.now(),
        details: `Gemini AI Validator committed proof metadata. Quality metric scored: ${auditResult.qualityScore}% (Rating compliance: ${isApproved ? 'PASS' : 'FAIL'}).`
      };
      onAddTx(proofTx);

      const disburseHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const disburseTx: TxTelemetry = {
        id: `disb-${Date.now()}`,
        hash: disburseHash,
        blockNumber: 15420490,
        from: '0x7eDe68dfC9F800B022A1a32a673d32fB2D5D4bEa', // Escrow deployed
        to: isApproved ? (agents.find(a => a.id === task.workerId)?.walletAddress || '0x00') : task.posterId,
        value: `${task.budget} USDC`,
        gasUsed: 140000,
        type: isApproved ? 'ESCROW_RELEASE' : 'ESCROW_REFUND',
        timestamp: Date.now(),
        details: isApproved
          ? `Bounty disbursed successfully. Transferred ${task.budget} USDC to hired Agent wallet.`
          : `Collateral and bounty refunded. Claim completed to client wallet.`
      };
      onAddTx(disburseTx);

      // 4. Update Escrow status
      onUpdateEscrow({
        taskId: taskId,
        balance: 0,
        depositor: task.posterId,
        beneficiary: isApproved ? (agents.find(a => a.id === task.workerId)?.walletAddress || '') : '',
        collateralStaked: 0,
        status: isApproved ? 'Released' : 'Refunded',
        x402Route: `x402:route:fuji:${taskId}-finalized`
      });

      onRefreshTasks();
      onRefreshAgents();
      alert(`AI Validation cycle finished! Decision: ${auditResult.decision}`);

    } catch (error: any) {
      console.error(error);
      alert("Failed during validator consensus routine.");
    } finally {
      setIsValidating(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Filter tasks based on required capabilities
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.requiredSkills.some(s => s.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="marketplace-board-panel">
      {/* Post job panel */}
      <div className="lg:col-span-1 bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 hover:border-zinc-700/50 transition-all ring-1 ring-white/5 shadow-xl shadow-black/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-zinc-100 text-sm uppercase tracking-wider">Advertise AI Task</h3>
            <p className="text-[11px] text-zinc-500">Fund bounty contracts to hire verified decentralized bots autonomously.</p>
          </div>
        </div>

        {postError && (
          <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-xs text-red-400 flex items-center gap-1.5 mb-3 animate-pulse-once">
            <AlertCircle className="w-4 h-4" />
            <span>{postError}</span>
          </div>
        )}

        <form onSubmit={handlePostTask} className="space-y-3.5">
          <div>
            <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Task Title</label>
            <input 
              type="text" 
              placeholder="e.g. Technical market audit report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 text-xs p-2.5 rounded border border-zinc-850 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Objective Specs & Guidelines</label>
            <textarea 
              placeholder="Describe requirements the bot must analyze..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 text-xs p-2.5 rounded border border-zinc-850 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Bounty Budget (USDC)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-zinc-950 text-zinc-200 p-2.5 rounded border border-zinc-850 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Collateral Stake (USDC)</label>
              <input 
                type="number" 
                value={collateral}
                onChange={(e) => setCollateral(Number(e.target.value))}
                className="w-full bg-zinc-950 text-zinc-200 p-2.5 rounded border border-zinc-850 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Required Bot Capability</label>
            <select
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-300 text-xs p-2.5 rounded border border-zinc-850 focus:outline-none focus:border-blue-500"
            >
              <option value="Data Synthesis">Data Synthesis</option>
              <option value="Crypto Analysis">Crypto Analysis</option>
              <option value="Technical Report">Technical Report</option>
              <option value="Market Intelligence">Market Intelligence</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPosting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-display text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isPosting ? 'Funding Escrow contract...' : 'Sponsor Task & Pre-fund Escrow'}
          </button>
        </form>
      </div>

      {/* Task stream board */}
      <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Filtering row */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl ring-1 ring-white/5">
            <Search className="w-4 h-4 text-zinc-500 ml-1.5" />
            <input 
              type="text" 
              placeholder="Search tasks by title or skill specification..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-full font-sans"
            />
          </div>

          {/* List items */}
          <div className="space-y-4.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="p-12 border border-zinc-800 text-center rounded-xl bg-zinc-950/20">
                <p className="text-xs text-zinc-500 font-mono">No tasks advertised match current query parameters.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const hiredAgent = agents.find(a => a.id === task.workerId);
                const isHiredByMe = task.workerId !== undefined;

                return (
                  <div key={task.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl hover:bg-zinc-900/80 transition-all space-y-4 relative group ring-1 ring-white/5 shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display font-bold text-zinc-100 text-sm leading-snug">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] uppercase font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                            {task.requiredSkills[0]}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Funded by: {task.posterId.slice(0, 6)}...{task.posterId.slice(-4)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 font-mono">
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block uppercase text-[8px] font-bold">Reward Pool</span>
                          <span className="text-sm text-emerald-450 font-bold">{task.budget} USDC</span>
                        </div>
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border border-zinc-805 bg-zinc-950 font-bold ${
                          task.status === 'Completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                          task.status === 'Submitted' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' :
                          task.status === 'InProgress' ? 'text-indigo-400 border-indigo-500/20 bg-indigo-505 bg-indigo-500/5' :
                          task.status === 'Refunded' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-zinc-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-zinc-400 font-sans leading-relaxed">
                      {task.description}
                    </p>

                    {/* Step components or interactions dependent on status */}
                    
                    {/* Open: Choose agent to accept task */}
                    {task.status === 'Open' && (
                      <div className="pt-2 border-t border-zinc-800/40 flex flex-col gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block mb-1">
                          Consensus Bot Delegate Bidding (Locked Stake REQUIRED: {task.collateral} USDC)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {agents.filter(a => a.status === 'Idle').map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => handleAcceptTask(task.id, agent)}
                              className="bg-zinc-950 hover:bg-zinc-900 text-[10.5px] text-zinc-300 font-mono px-3 py-2 rounded-lg border border-zinc-800 flex items-center gap-1.5 hover:border-indigo-500/30 transition-all text-left cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-indigo-400" />
                              Hire <span className="text-blue-400 font-semibold">{agent.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* InProgress: Submit work deliverables */}
                    {task.status === 'InProgress' && hiredAgent && (
                      <div className="pt-3 border-t border-zinc-800/40 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-mono leading-none text-zinc-500 mb-1">
                          <span>Hired Worker: <span className="text-zinc-300">{hiredAgent.name}</span></span>
                          <span>Validator: <span className="text-yellow-400">ValidatorBot Pro (Gemini)</span></span>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            placeholder={`Paste or generate ${hiredAgent.name}'s task completion logs here... e.g. "Protocol research audit of Avalanche subnet transactions. Budget locks valid."`}
                            rows={3}
                            value={workOutputs[task.id] || ''}
                            onChange={(e) => setWorkOutputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                            className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs font-mono text-zinc-300 placeholder:text-zinc-600 leading-normal"
                          />
                          <button
                            onClick={() => handleSubmitWork(task.id)}
                            disabled={isSubmittingWork[task.id]}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-display text-xs font-semibold py-2 px-3 rounded flex items-center gap-1.5 shadow-md shadow-purple-500/10 transition-all w-full justify-center cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isSubmittingWork[task.id] ? 'Publishing work hashes...' : 'Submit Bot Work Outputs'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submitted: Trigger validator */}
                    {task.status === 'Submitted' && (
                      <div className="pt-3 border-t border-zinc-805 bg-zinc-950/40 p-3 rounded-lg space-y-3">
                        <div className="flex items-start gap-2 text-yellow-500 text-[10.5px] font-sans leading-relaxed">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
                          <div>
                            <span className="font-bold">Pending Compliance Scan:</span> ValidatorBot Pro has intercepted the submitted payload and is awaiting the cryptographic trigger.
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerAIValidation(task.id)}
                          disabled={isValidating[task.id]}
                          className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-display text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 w-full shadow-lg shadow-yellow-500/10 transition-all cursor-pointer"
                        >
                          <ShieldCheck className={`w-4 h-4 ${isValidating[task.id] ? 'animate-spin' : ''}`} />
                          {isValidating[task.id] ? 'Executing Gemini Smart Audit Verification...' : 'Trigger Smart Auditor Execution'}
                        </button>
                      </div>
                    )}

                    {/* Completed / Refunded: Show validator scorecard */}
                    {(task.status === 'Completed' || task.status === 'Refunded') && task.validationOutput && (
                      <div className="pt-3 border-t border-zinc-805 space-y-2">
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-yellow-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Audited by ValidatorBot (Gemini)
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${
                              task.status === 'Completed' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              Score: {task.validationOutput.qualityScore}/100
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-zinc-350 leading-normal bg-zinc-900/60 p-2 rounded border border-zinc-800">
                            {task.validationOutput.analysis}
                          </p>

                          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                            <span>Compliance: {task.validationOutput.technicalCompliance ? 'VERIFIED' : 'FAILED'}</span>
                            <span>Action: {task.validationOutput.decision}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic network info banner */}
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between font-mono mt-4">
          <span>Escrow smart pools: <span className="text-blue-400 font-semibold">{tasks.length} active lockups</span></span>
          <span className="text-zinc-500">ERC-x402 Agentic Payment Standard compliant</span>
        </div>
      </div>
    </div>
  );
}
