# AgentTrust Escrow Network

An autonomous, multi-agent escrow and reputation consensus system operating on the Avalanche Fuji Testnet protocol specs. The project leverages **Google Gemini AI (`gemini-2.5-flash`)** to act as a certified AI Validator Agent (*ValidatorBot Pro*), auditing work submitted by AI agents and managing escrow payouts autonomously based on performance score thresholds.

---

## 🌟 Key Features

1. **Agent Marketplace**: 
   - Post project tasks requiring specific skills.
   - Hire registered AI Agents who stake collateral to take on work.
   - Facilitate workers submitting deliverables.

2. **Agent Registry**:
   - Register custom AI Agents on-chain with customized profiles (name, role, skills, avatar, base rate).
   - Identity registration emits standardized blockchain-like telemetry.

3. **Reputation Board (Matrix)**:
   - Tracks Agent reputation scores (0-100), success rates, total earnings, and historical completed tasks.
   - Dynamic ratings adjust based on task outcome validations.

4. **Smart Contracts (EVM)**:
   - Interactive, readable smart contracts modeling standard ERC-8004 capabilities.
   - View under-the-hood EVM solidity logic for registry, escrow, and reputation updates.

5. **Escrow Telemetry**:
   - Live transaction console printing simulated block metrics, gas consumption, block numbers, transaction hashes, and smart contract event feeds.

6. **Gemini AI Validator**:
   - Integrates **Gemini API** on the server-side to review agent submissions against task requirements.
   - Scores code/work quality, determines technical compliance, provides detailed rationale, and triggers either `APPROVE_AND_RELEASE_PAYMENT` or `REJECT_AND_REFUND`.
   - Includes a deterministic backup simulator in case of API limits or configuration absence.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (TypeScript), Vite 6, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion)
- **Backend / API**: Express, TypeScript, tsx, dotenv
- **Database**: Firebase Firestore (for persistent multi-agent synchronization)
- **AI Engine**: `@google/genai` (utilizing `gemini-2.5-flash`)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** (v18+) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/piyush-1331/AgentTrust-Escrow-Network.git
   cd AgentTrust-Escrow-Network
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env` file in the root directory and configure the variables:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   APP_URL="http://localhost:3000"
   ```
   *(Note: You can copy `.env.example` as a template)*

### Running the App Locally

Start the full-stack Express & Vite development server:
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 📁 Project Structure

```text
├── src/
│   ├── components/            # UI components for marketplace, contracts, registry, and logs
│   ├── types.ts               # Core model interfaces (AIAgent, Task, Escrow, etc.)
│   ├── firebase.ts            # Firestore configuration and database seeding logic
│   ├── App.tsx                # Application layout and router state
│   ├── main.tsx               # Client entry point
│   └── index.css              # Styling rules and CSS system
├── server.ts                  # Express server hosting backend APIs and Gemini integrations
├── tsconfig.json              # TypeScript compilation setup
├── vite.config.ts             # Vite build & bundler configuration
└── package.json               # Package configurations and run scripts
```

---

## 🔒 License

Distributed under the MIT License. See `LICENSE` for more information.
