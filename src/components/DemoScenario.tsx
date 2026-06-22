import React, { useState } from 'react';
import { Play, CheckCircle2, ChevronRight, Coins, ShieldAlert, BadgeInfo, Wand2, Loader2, Sparkles } from 'lucide-react';
import { TxTelemetry, EscrowState, AIAgent } from '../types';
import { db } from '../firebase';
import { doc, setDoc, addDoc, collection, updateDoc } from 'firebase/firestore';

interface DemoScenarioProps {
  onAddTx: (tx: TxTelemetry) => void;
  onUpdateEscrow: (state: EscrowState) => void;
  onRefreshTasks: () => void;
  onRefreshAgents: () => void;
  agents: AIAgent[];
  walletAddress: string;
}

interface Step {
  id: number;
  label: string;
  desc: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

export default function DemoScenario({
  onAddTx,
  onUpdateEscrow,
  onRefreshTasks,
  onRefreshAgents,
  agents,
  walletAddress
}: DemoScenarioProps) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: "Identity Generation", desc: "ResearchBot claims ERC-8004 identity on Fuji C-Chain", status: 'idle' },
    { id: 2, label: "Advertise Task Specs", desc: "Task sponsored. Pre-funds 250 USDC reward pool into escrow contract", status: 'idle' },
    { id: 3, label: "Autonomous Bid Lock", desc: "NewsBot locks 25 USDC required collateral stake on Avalanche", status: 'idle' },
    { id: 4, label: "Deliver AI Work Outputs", desc: "NewsBot executes data-scrape and submits synthesis reports to cloud ledger", status: 'idle' },
    { id: 5, label: "Gemini Smart Audit", desc: "ValidatorBot Pro queries AI analysis report & issues rating score", status: 'idle' },
    { id: 6, label: "Escrow Settlement", desc: "Releases bounty reward, returns collateral, and updates global reputation database", status: 'idle' }
  ]);

  const updateStepStatus = (id: number, status: Step['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleRunDemo = async () => {
    if (running) return;
    setRunning(true);
    
    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle' })));

    let researchAgentId = 'agent-researcher';
    let newsAgentId = 'agent-newswriter';
    let validatorAgentId = 'agent-validator';

    // Step 1: Create identities if needed
    setCurrentStep(1);
    updateStepStatus(1, 'running');
    await new Promise(r => setTimeout(r, 1500));
    
    // Register ResearchBot
    const rTx: TxTelemetry = {
      id: `dem-1-${Date.now()}`,
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      blockNumber: 15420500,
      from: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
      to: '0x3e1765c9700B0224A1a329FCD6dfFC0B8760773d', // AgentRegistry
      value: '0 AVAX',
      gasUsed: 210000,
      type: 'IDENTITY_REGISTRATION',
      timestamp: Date.now(),
      details: 'ERC-8004 DID validation complete. Bound did:agent:fuji:0x89205a3a... to ResearchBot v2.4.'
    };
    onAddTx(rTx);
    updateStepStatus(1, 'success');

    // Step 2: Advertise Task Spec
    setCurrentStep(2);
    updateStepStatus(2, 'running');
    await new Promise(r => setTimeout(r, 1800));

    const demoTaskTitle = "Q2 DeFI Performance Matrix Summarization - Avalanche";
    const demoTaskDesc = "Autonomous retrieval, processing, and multi-protocol evaluation of yield metrics on dynamic Fuji subnet pools. Format results in Markdown brief.";
    
    let createdTaskId = `task-demo-${Date.now()}`;
    
    const taskData = {
      title: demoTaskTitle,
      description: demoTaskDesc,
      requiredSkills: ["Crypto Analysis"],
      budget: 250,
      collateral: 25,
      status: 'Open',
      posterId: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5', // ResearchBot wallet
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Store in Firestore
    await setDoc(doc(db, "tasks", createdTaskId), taskData);
    onRefreshTasks();

    const tTx: TxTelemetry = {
      id: `dem-2-${Date.now()}`,
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      blockNumber: 15420502,
      from: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
      to: '0xbf9c3bEDFcc233d6b63Ad32fB2D5Cc527e02377d', // Marketplace smart-contract
      value: '250 USDC',
      gasUsed: 195000,
      type: 'ESCROW_FUND',
      timestamp: Date.now(),
      details: `Escrow prefunded successfully: 250 USDC rewards locked for task specification mapping: ${createdTaskId.slice(0,8)}.`
    };
    onAddTx(tTx);

    // Set Escrow state
    onUpdateEscrow({
      taskId: createdTaskId,
      balance: 250,
      depositor: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
      beneficiary: '0x0000000000000000000000000000000000000000',
      collateralStaked: 0,
      status: 'Locked',
      x402Route: `x402:route:fuji:${createdTaskId}-init`
    });

    updateStepStatus(2, 'success');

    // Step 3: Autonomous Bid Lock (NewsBot accepts)
    setCurrentStep(3);
    updateStepStatus(3, 'running');
    await new Promise(r => setTimeout(r, 1600));

    await updateDoc(doc(db, "tasks", createdTaskId), {
      status: 'InProgress',
      workerId: newsAgentId,
      validatorId: validatorAgentId,
      updatedAt: Date.now()
    });
    
    await updateDoc(doc(db, "agents", newsAgentId), {
      status: 'Active'
    });
    onRefreshTasks();
    onRefreshAgents();

    const aTx: TxTelemetry = {
      id: `dem-3-${Date.now()}`,
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      blockNumber: 15420506,
      from: '0x3910A2B12F6AdF3De4cd236045418Be7024ea12', // NewsBot wallet
      to: '0xbf9c3bEDFcc233d6b63Ad32fB2D5Cc527e02377d',
      value: '25 USDC (Staked)',
      gasUsed: 230000,
      type: 'COLLATERAL_LOCKED',
      timestamp: Date.now(),
      details: `NewsBot v1.9 committed collateral stake. Escrow #3876 collateral lock finalized.`
    };
    onAddTx(aTx);

    onUpdateEscrow({
      taskId: createdTaskId,
      balance: 250,
      depositor: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
      beneficiary: '0x3910A2B12F6AdF3De4cd23659a84a2ca4923e',
      collateralStaked: 25,
      status: 'Locked',
      x402Route: `x402:route:fuji:${createdTaskId}-locked`
    });

    updateStepStatus(3, 'success');

    // Step 4: Deliver AI Work Output
    setCurrentStep(4);
    updateStepStatus(4, 'running');
    await new Promise(r => setTimeout(r, 2000));

    const sampleDeFiReport = `### Avalanche Q2 2026 DeFi Ecosystem Performance Report
    
#### 1. Core SUB Pools Performance:
* Benqi liquid staking yields spiked to **7.2% APR** due to increases in AVAX delegation rate.
* TraderJoe Liquidity Book registered **$42M in 24hr volume**, tracking standard Gwei metrics.
* x402 micro-payment channels completed 4,200 agent audit payouts.

#### 2. Risk Evaluation Vector:
* Dynamic liquidity slip remains within **0.04% threshold limits**.
* Consensus score verified healthy. Smart contract parameters are operational.`;

    await updateDoc(doc(db, "tasks", createdTaskId), {
      status: 'Submitted',
      submissionOutput: sampleDeFiReport,
      updatedAt: Date.now()
    });
    onRefreshTasks();

    const sTx: TxTelemetry = {
      id: `dem-4-${Date.now()}`,
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      blockNumber: 15420510,
      from: '0x3910A2B12F6AdF3De4cd236045418Be7024ea12',
      to: '0x7eDe68dfC9F800B022A1a32a673d32fB2D5D4bEa', // Escrowcontract
      value: '0 USDC',
      gasUsed: 110000,
      type: 'SUBMISSION',
      timestamp: Date.now(),
      details: `Audit deliverable storage hashes logged to block 15420510.`
    };
    onAddTx(sTx);

    updateStepStatus(4, 'success');

    // Step 5: Gemini Smart Audit (ValidatorBot Pro reviews the work output!)
    setCurrentStep(5);
    updateStepStatus(5, 'running');
    
    let auditResult;
    try {
      // Call standard Gemini express API endpoint
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: demoTaskTitle,
          taskDescription: demoTaskDesc,
          submittedWork: sampleDeFiReport,
          skillsRequired: ["Crypto Analysis"]
        })
      });

      if (response.ok) {
        auditResult = await response.json();
      } else {
        throw new Error("API Route not available");
      }
    } catch (e) {
      console.warn("Direct API check failed or API route is not available (e.g. static host). Running client-side validation simulation...", e);
      auditResult = {
        success: true,
        qualityScore: 94,
        technicalCompliance: true,
        analysis: "[STATIC MOCK VALIDATOR] DeFi report fulfills compliance parameters. Data granularity and Subnet tracking scores are satisfactory.",
        decision: "APPROVE_AND_RELEASE_PAYMENT",
        aiValidated: false
      };
    }
    
    const isApproved = auditResult.decision === 'APPROVE_AND_RELEASE_PAYMENT';
    const score = auditResult.qualityScore || 94;
    const analysis = auditResult.analysis || "DeFi report fulfills compliance parameters. Data granularity and Subnet tracking scores are satisfactory.";

    updateStepStatus(5, 'success');

      // Step 6: Escrow Settlement
      setCurrentStep(6);
      updateStepStatus(6, 'running');
      await new Promise(r => setTimeout(r, 1800));

      await updateDoc(doc(db, "tasks", createdTaskId), {
        status: isApproved ? 'Completed' : 'Refunded',
        validationOutput: {
          qualityScore: score,
          technicalCompliance: auditResult.technicalCompliance ?? true,
          analysis: analysis,
          decision: auditResult.decision ?? 'APPROVE_AND_RELEASE_PAYMENT',
          timestamp: Date.now()
        },
        updatedAt: Date.now()
      });

      // Update NewsBot stats
      const newsBot = agents.find(a => a.id === newsAgentId);
      if (newsBot) {
        await updateDoc(doc(db, "agents", newsAgentId), {
          status: 'Idle',
          totalEarnings: newsBot.totalEarnings + 250,
          completedTasks: newsBot.completedTasks + 1,
          reputationScore: 99
        });
      }
      
      onRefreshTasks();
      onRefreshAgents();

      // Emit settlement telemetry
      const vTx: TxTelemetry = {
        id: `dem-5-${Date.now()}`,
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        blockNumber: 15420515,
        from: '0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9', // Validator wallet
        to: '0x1C22FC90F800B022a1a329FCD6dfFC0bd876077c', // Reputation contract
        value: '0 USDC',
        gasUsed: 280000,
        type: 'VALIDATOR_PROOF',
        timestamp: Date.now(),
        details: `ValidatorBot Pro settled verification proof on-chain (Score: ${score}/100). Signed and authorized release clearance.`
      };
      onAddTx(vTx);

      const dTx: TxTelemetry = {
        id: `dem-6-${Date.now()}`,
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        blockNumber: 15420518,
        from: '0x7eDe68dfC9F800B022A1a32a673d32fB2D5D4bEa', // Escrow
        to: '0x3910A2B12F6AdF3De4cd236045418Be7024ea12', // NewsBot
        value: '250 USDC',
        gasUsed: 130200,
        type: 'ESCROW_RELEASE',
        timestamp: Date.now(),
        details: `x402: Bounty reward (250 USDC) disbursed. newsBot collateral (25 USDC) refund executed on Fuji C-Chain.`
      };
      onAddTx(dTx);

      onUpdateEscrow({
        taskId: createdTaskId,
        balance: 0,
        depositor: '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
        beneficiary: '0x3910A2B12F6AdF3De4cd236045418Be7024ea12',
        collateralStaked: 0,
        status: 'Released',
        x402Route: `x402:route:fuji:${createdTaskId}-settled`
      });

      updateStepStatus(6, 'success');
      alert("Demo Loop Completed successfully! NewsBot reputation scores have updated on-chain.");

    } catch (e) {
      console.error(e);
      updateStepStatus(5, 'error');
    } finally {
      setRunning(false);
      setCurrentStep(null);
    }
  };

  return (
    <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 space-y-5 hover:border-zinc-700/50 transition-all shadow-xl shadow-black/30 ring-1 ring-white/5" id="demo-scenario-runner-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-505 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Wand2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1">
              Live Demo Loop
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </h3>
            <p className="text-[11px] text-zinc-500">Auto-execute entire agency workflow pipeline using live Gemini code audit checks.</p>
          </div>
        </div>

        <button
          onClick={handleRunDemo}
          disabled={running}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-display text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50 font-mono tracking-wider cursor-pointer"
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              RUNNING...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              TRIGGER LOOP
            </>
          )}
        </button>
      </div>

      {/* Visual Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-1">
        {steps.map((s, idx) => {
          const isCurrent = currentStep === s.id;
          return (
            <div 
              key={s.id} 
              className={`p-3 rounded-lg border text-center flex flex-col justify-between h-28 relative transition-all ${
                s.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 animate-pulse-once' :
                s.status === 'running' ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/40' :
                s.status === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                'bg-zinc-950/40 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                <span className="font-bold opacity-60">PHASE 0{s.id}</span>
                {s.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {s.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
              </div>

              <div>
                <h4 className={`text-[11px] font-display font-bold leading-tight ${
                  s.status === 'success' ? 'text-emerald-300' :
                  s.status === 'running' ? 'text-indigo-200' :
                  'text-zinc-400'
                }`}>
                  {s.label}
                </h4>
                <p className="text-[9px] text-zinc-500 mt-1 leading-snug truncate-none font-sans line-clamp-2">
                  {s.desc}
                </p>
              </div>

              {idx < 5 && (
                <div className="hidden md:block absolute -right-2 top-11 transform -translate-y-1/2 z-10 text-zinc-700">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850 flex items-start gap-2 text-[10.5px] font-mono text-zinc-500 leading-relaxed">
        <BadgeInfo className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-zinc-300 font-semibold uppercase font-sans">Blockchain Sandbox Architecture:</span> All smart locks, collateral stakes, reputation ratings, and identity mappings are fully bound and managed inside persistent Google Firestore collections. It exactly mirrors standard Fuji C-Chain EVM transaction behaviors.
        </div>
      </div>
    </div>
  );
}
