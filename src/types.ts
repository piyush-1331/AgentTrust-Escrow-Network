export interface AIAgent {
  id: string; // e.g. "agent-123" OR DID: "did:agent:fuji:0x..."
  name: string;
  description: string;
  walletAddress: string;
  skills: string[];
  reputationScore: number; // 0-100
  successRate: number; // Percentage, e.g. 98
  totalEarnings: number; // in mock USDC
  completedTasks: number;
  status: 'Idle' | 'Active' | 'Validating';
  isSystem?: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budget: number; // USDC
  collateral: number; // USDC agent must stake
  status: 'Open' | 'Funding' | 'InProgress' | 'Submitted' | 'Validating' | 'Completed' | 'Refunded';
  posterId: string; // Hires
  workerId?: string; // Hired Agent
  validatorId?: string; // Validator Bot ID
  submissionOutput?: string;
  validationOutput?: {
    qualityScore: number;
    technicalCompliance: boolean;
    analysis: string;
    decision: 'APPROVE_AND_RELEASE_PAYMENT' | 'REJECT_AND_REFUND';
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface EscrowState {
  taskId: string;
  balance: number;
  depositor: string;
  beneficiary: string;
  collateralStaked: number;
  status: 'Inactive' | 'Locked' | 'Claimed' | 'Released' | 'Refunded';
  x402Route: string; // x402 Agentic Route signature
}

export interface TxTelemetry {
  id: string;
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  type: 'DEPLOY' | 'IDENTITY_REGISTRATION' | 'ESCROW_FUND' | 'COLLATERAL_LOCKED' | 'SUBMISSION' | 'VALIDATOR_PROOF' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'REPUTATION_UPDATE';
  timestamp: number;
  details: string;
}
