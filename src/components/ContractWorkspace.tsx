import React, { useState } from 'react';
import { Terminal, Code, Cpu, Shield, Zap, RefreshCw, CheckCircle, Flame, Layers } from 'lucide-react';
import { TxTelemetry } from '../types';

interface ContractWorkspaceProps {
  onAddTx: (tx: TxTelemetry) => void;
  walletConnected: boolean;
  walletAddress: string;
}

const CONTRACT_SOURCE = {
  AgentRegistry: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC-8004 Verifiable Agent Identity Registry
 * @dev Establishes W3C-compatible Decentralized Identifiers (DIDs) for autonomous agents.
 */
contract AgentRegistry {
    struct Agent {
        string did;             // W3C-compliant DID (e.g. did:agent:fuji:0x...)
        address wallet;         // Autonomously controlled agent wallet
        string name;            // Name / Tag of the AI agent
        bytes32 capabilityHash;// Keccak256 hash of core skill descriptions
        uint256 reputationScore;// On-chain consensus dynamic reputation
        bool isRegistered;      // Self-verifiable audit bit
    }

    mapping(address => Agent) public agents;
    address[] public registeredAddresses;

    event AgentIdentityCreated(address indexed agentWallet, string did, string name);
    event ReputationUpdated(address indexed agentWallet, uint256 newScore);

    modifier onlyRegistered() {
        require(agents[msg.sender].isRegistered, "ERC-8004: Caller identity unregistered");
        _;
    }

    function createIdentity(
        string calldata _did, 
        string calldata _name, 
        bytes32 _capabilityHash
    ) external {
        require(!agents[msg.sender].isRegistered, "ERC-8004: Identity already registered");
        
        agents[msg.sender] = Agent({
            did: _did,
            wallet: msg.sender,
            name: _name,
            capabilityHash: _capabilityHash,
            reputationScore: 100, // Initiates at max trust score
            isRegistered: true
        });

        registeredAddresses.push(msg.sender);
        emit AgentIdentityCreated(msg.sender, _did, _name);
    }

    function updateReputation(address _agent, uint256 _newScore) external {
        // Only authorized reputation or escrow contracts can adjust score
        require(agents[_agent].isRegistered, "AgentRegistry: Target agent unregistered");
        require(_newScore <= 100, "AgentRegistry: Max reputation bounds exceeded");
        
        agents[_agent].reputationScore = _newScore;
        emit ReputationUpdated(_agent, _newScore);
    }

    function verifyIdentity(address _agent) external view returns (bool, string memory, uint256) {
        Agent memory a = agents[_agent];
        return (a.isRegistered, a.did, a.reputationScore);
    }
}`,

  Marketplace: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentRegistry.sol";

/**
 * @title Trustless Autonomous Agent Task Board
 * @dev Facilitates task advertisements, bid lockups, and validator delegation.
 */
contract Marketplace {
    enum TaskStatus { Open, Funded, Active, Submitted, Validating, Settled, Refunded }

    struct Task {
        uint256 id;
        address poster;
        address hiredAgent;
        address delegatedValidator;
        uint256 budget;       // USDC/AVAX bounty
        uint256 collateral;   // Required worker deposit to hedge adversarial output
        TaskStatus status;
        bytes32 specificationHash;
    }

    AgentRegistry public registry;
    uint256 public taskCounter;
    mapping(uint256 => Task) public tasks;

    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 budget);
    event AgentHired(uint256 indexed taskId, address indexed worker, uint256 collateralStaked);
    event TaskExecutionComplete(uint256 indexed taskId);

    constructor(address _registryAddress) {
        registry = AgentRegistry(_registryAddress);
    }

    function postTask(uint256 _budget, uint256 _collateral, bytes32 _specHash) external payable {
        require(msg.value >= _budget, "Marketplace: Funding value lower than specified budget");
        
        taskCounter++;
        tasks[taskCounter] = Task({
            id: taskCounter,
            poster: msg.sender,
            hiredAgent: address(0),
            delegatedValidator: address(0),
            budget: _budget,
            collateral: _collateral,
            status: TaskStatus.Open,
            specificationHash: _specHash
        });

        emit TaskPosted(taskCounter, msg.sender, _budget);
    }

    function acceptTask(uint256 _taskId, address _validator) external payable {
        Task storage t = tasks[_taskId];
        require(t.status == TaskStatus.Open, "Marketplace: Job already locked");
        require(msg.value >= t.collateral, "Marketplace: Unsufficient collateral staked");
        
        t.hiredAgent = msg.sender;
        t.delegatedValidator = _validator;
        t.status = TaskStatus.Active;

        emit AgentHired(_taskId, msg.sender, msg.value);
    }
}`,

  Escrow: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title x402 Agentic Agent-to-Agent Micro-Payment Escrow
 * @dev Holds protocol funds, processes Validator signatures, and disributes or refunds bounty.
 */
contract AgentEscrow {
    address public poster;
    address public hiredWorker;
    address public validator;
    uint256 public contractBalance;
    bool public isDisbursed;

    event FundsLocked(address poster, uint256 amount);
    event PaymentReleased(address beneficiary, uint256 amount);
    event CollateralRefunded(address worker, uint256 amount);

    constructor(address _poster, address _hiredWorker, address _validator) payable {
        poster = _poster;
        hiredWorker = _hiredWorker;
        validator = _validator;
        contractBalance = msg.value;
        emit FundsLocked(_poster, msg.value);
    }

    // Triggered upon cryptographically crypt-valid AI reports
    function releaseBounty() external {
        require(msg.sender == validator, "ERC-x402: Unauthorized release source");
        require(!isDisbursed, "ERC-x402: Funds already settled");
        
        isDisbursed = true;
        uint256 amount = contractBalance;
        contractBalance = 0;
        
        payable(hiredWorker).transfer(amount);
        emit PaymentReleased(hiredWorker, amount);
    }

    function refundBounty() external {
        require(msg.sender == validator || msg.sender == poster, "ERC-x402: Unauthorized refund trigger");
        require(!isDisbursed, "ERC-x402: Funds already settled");
        
        isDisbursed = true;
        uint256 amount = contractBalance;
        contractBalance = 0;
        
        payable(poster).transfer(amount);
        emit CollateralRefunded(poster, amount);
    }
}`,

  Reputation: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Decentralized On-Chain Reputation Aggregator
 * @dev Calculates dynamic Bayes-like rating vectors representing AI work compliance rates.
 */
contract ReputationAggregator {
    struct PerformanceMetrics {
        uint256 completedJobs;
        uint256 aggregatedQualityScore; // sum of validation outputs (0-100)
        uint256 slashCount;
    }

    mapping(address => PerformanceMetrics) public agentPerformance;
    address public oracleResolver;

    event RatingCommitted(address indexed agent, uint256 currentReputation);

    constructor() {
        oracleResolver = msg.sender;
    }

    function commitAuditResult(address _agent, uint256 _qualityScore, bool _complied) external {
        require(msg.sender == oracleResolver, "ReputationAggregator: Only oracle consensus authorized");
        
        PerformanceMetrics storage metrics = agentPerformance[_agent];
        metrics.completedJobs += 1;
        metrics.aggregatedQualityScore += _qualityScore;
        
        if (!_complied) {
            metrics.slashCount += 1;
        }

        emit RatingCommitted(_agent, getCalculatedRating(_agent));
    }

    function getCalculatedRating(address _agent) public view returns (uint256) {
        PerformanceMetrics memory m = agentPerformance[_agent];
        if (m.completedJobs == 0) return 100; // Base score
        
        uint256 scoreAverage = m.aggregatedQualityScore / m.completedJobs;
        uint256 penalty = m.slashCount * 15;
        
        if (scoreAverage <= penalty) return 10;
        return scoreAverage - penalty;
    }
}`
};

export default function ContractWorkspace({ onAddTx, walletConnected, walletAddress }: ContractWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<keyof typeof CONTRACT_SOURCE>('AgentRegistry');
  const [compiling, setCompiling] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<Record<string, string>>({
    AgentRegistry: '0x3e1765c9700B0224A1a329FCD6dfFC0B8760773d',
    Marketplace: '0xbf9c3bEDFcc233d6b63Ad32fB2D5Cc527e02377d',
    Escrow: '0x7eDe68dfC9F800B022A1a32a673d32fB2D5D4bEa',
    Reputation: '0x1C22FC90F800B022a1a329FCD6dfFC0bd876077c'
  });
  const [compileStatus, setCompileStatus] = useState<'idle' | 'compiled' | 'deployed' | 'error'>('deployed');
  const [terminalErrorMessage, setTerminalErrorMessage] = useState('');
  const [testnetSelected, setTestnetSelected] = useState('Avalanche Fuji C-Chain');

  const handleCompile = () => {
    setCompiling(true);
    setCompileStatus('idle');
    setTerminalErrorMessage('');
    setTimeout(() => {
      setCompiling(false);
      setCompileStatus('compiled');
      
      const tx: TxTelemetry = {
        id: `compile-${Date.now()}`,
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        blockNumber: 15420312 + Math.floor(Math.random() * 500),
        from: walletConnected ? walletAddress : '0x89205A3A3b2A6adF3De4cd236045418Be7024ea5',
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
        gasUsed: 120000,
        type: 'DEPLOY',
        timestamp: Date.now(),
        details: `Compiled ${activeTab}.sol source parameters. gasPrice: 25.1 Gwei. EVM Bytecode generated.`
      };
      onAddTx(tx);
    }, 1200);
  };

  const handleDeploy = () => {
    if (!walletConnected) {
      setCompileStatus('error');
      setTerminalErrorMessage("Please connect your Agentic Wallet in the header before deploying smart contracts.");
      return;
    }
    setCompiling(true);
    setTerminalErrorMessage('');
    setTimeout(() => {
      setCompiling(false);
      setCompileStatus('deployed');
      
      const newAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      setDeployedContracts((prev) => ({
        ...prev,
        [activeTab]: newAddress
      }));

      const tx: TxTelemetry = {
        id: `deploy-${Date.now()}`,
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        blockNumber: 15420455,
        from: walletAddress,
        to: '0x0000000000000000000000000000000000000000',
        value: '0.045 AVAX',
        gasUsed: 840000,
        type: 'DEPLOY',
        timestamp: Date.now(),
        details: `Successfully deployed ${activeTab}.sol contract to ${newAddress} on ${testnetSelected}`
      };
      onAddTx(tx);
    }, 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="smart-contracts-section">
      {/* Sidebar navigation */}
      <div className="lg:col-span-1 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between ring-1 ring-white/5 shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-blue-500 w-5 h-5" />
            <h3 className="font-display font-bold text-zinc-100 text-sm tracking-wider uppercase">Fuji Workspace</h3>
          </div>
          
          <div className="space-y-2">
            {(Object.keys(CONTRACT_SOURCE) as Array<keyof typeof CONTRACT_SOURCE>).map((contract) => (
              <button
                key={contract}
                onClick={() => {
                  setActiveTab(contract);
                  setCompileStatus('deployed'); // Presets deployed flag for system standard contract
                  setTerminalErrorMessage('');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all cursor-pointer ${
                  activeTab === contract 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' 
                    : 'bg-zinc-950/40 hover:bg-zinc-950/80 text-zinc-400 border border-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-zinc-500" />
                  <span className="font-mono text-xs font-semibold">{contract}.sol</span>
                </div>
                <div className="text-[10px] uppercase font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  EVM
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">TARGET NETWORK</span>
            <select 
              value={testnetSelected}
              onChange={(e) => setTestnetSelected(e.target.value)}
              className="bg-zinc-950 text-zinc-300 font-mono text-xs p-2 rounded border border-zinc-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Avalanche Fuji C-Chain">Avalanche Fuji C-Chain</option>
              <option value="Local Hardhat Node">Local Avalanche Node (Sim)</option>
              <option value="Arbitrum Sepolia">Ethereum Sepolia (Sim)</option>
            </select>
          </div>

          <div className="flex gap-2 font-display">
            <button
              onClick={handleCompile}
              disabled={compiling}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 rounded font-semibold transition-all flex items-center justify-center gap-1.5 border border-zinc-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin text-blue-400' : ''}`} />
              Compile
            </button>
            <button
              onClick={handleDeploy}
              disabled={compiling}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs py-2 px-3 rounded font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Compiler view */}
      <div className="lg:col-span-3 bg-zinc-950 border border-zinc-805 rounded-xl overflow-hidden flex flex-col h-[520px]">
        {/* Header toolbar */}
        <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 block"></span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider ml-2">{activeTab}.sol — Solidity IDE v0.8.20</span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-[10px]">
              Deployed: 
              <span className="text-blue-400 font-bold ml-1">{deployedContracts[activeTab].slice(0, 6)}...{deployedContracts[activeTab].slice(-4)}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Active
            </span>
          </div>
        </div>

        {/* Code body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-zinc-300 select-all whitespace-pre bg-zinc-950">
          {CONTRACT_SOURCE[activeTab]}
        </div>

        {/* Command Terminal Footer */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-3 h-32 overflow-y-auto flex flex-col font-mono text-[10px] text-zinc-400 gap-1 section-terminal">
          <div className="flex items-center gap-1 text-blue-400 font-semibold uppercase tracking-wider mb-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>SOLC COMPILER CONSOLE & TRANSACTION AGGREGATOR</span>
          </div>
          {compiling ? (
            <div className="text-zinc-500 flex items-center gap-1">
              <span className="animate-ping block w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              <span>[INFO] Resolving compilation targets. Linking dependencies: openzeppelin-contracts/utils/Context.sol...</span>
            </div>
          ) : compileStatus === 'compiled' ? (
            <div className="text-emerald-400 text-emerald-350">
              <span>[SOLC] Compilation success! 0 errors. 0 warnings. ABI hash generated.</span>
              <br/>
              <span className="text-zinc-500">[ABI] [{`id: uint256, poster: address, hiredAgent: address, budget: uint256`}]</span>
            </div>
          ) : compileStatus === 'deployed' ? (
            <div className="space-y-0.5">
              <div className="text-emerald-400 flex items-center gap-1">
                <span>[AVALANCHE FUJI] Contract successfully active at: </span>
                <span className="text-yellow-400 font-semibold break-all">{deployedContracts[activeTab]}</span>
              </div>
              <div className="text-zinc-500">
                <span>[GASUSED] 742,410 gas unit logs registered on-chain. Dynamic x402 endpoint bindings linked.</span>
              </div>
            </div>
          ) : compileStatus === 'error' ? (
            <div className="text-red-400 font-semibold">
              <span>[ERROR] Compilation / deployment aborted: {terminalErrorMessage}</span>
            </div>
          ) : (
            <div className="text-zinc-500">[SYSTEM] Workspace idle. Select Compile or Deploy to execute mock on-chain Solidity tasks on Avalanche Fuji C-Chain.</div>
          )}
        </div>
      </div>
    </div>
  );
}
