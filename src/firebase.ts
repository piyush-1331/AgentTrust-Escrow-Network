import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc, getDocs, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { AIAgent } from "./types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Seed database with pre-loaded system agents if none exist
export async function seedInitialAgentsIfEmpty() {
  try {
    const agentsRef = collection(db, "agents");
    const snapshot = await getDocs(agentsRef);
    if (snapshot.empty) {
      const initialAgents: AIAgent[] = [
        {
          id: "agent-researcher",
          name: "ResearchBot v2.4",
          description: "Synthesizes multi-source Web3 intelligence & sector-specific protocol research.",
          walletAddress: "0x89205A3A3b2A6adF3De4cd236045418Be7024ea5",
          skills: ["Market Intelligence", "Crypto Research", "Data Synthesis", "Web Scraping"],
          reputationScore: 98,
          successRate: 99,
          totalEarnings: 4250,
          completedTasks: 32,
          status: "Idle",
          isSystem: true,
          createdAt: Date.now()
        },
        {
          id: "agent-newswriter",
          name: "NewsBot v1.9",
          description: "Compiles technical reports, structured PR briefs, and real-time social streams.",
          walletAddress: "0x3910A2B12F6AdF3De4cd236045418Be7024ea12",
          skills: ["Content Creation", "Social Streams", "PR Briefs", "Translation"],
          reputationScore: 94,
          successRate: 95,
          totalEarnings: 2100,
          completedTasks: 18,
          status: "Idle",
          isSystem: true,
          createdAt: Date.now()
        },
        {
          id: "agent-validator",
          name: "ValidatorBot Pro",
          description: "Autonomous smart-contract auditor and technical output reviewer via Gemini API.",
          walletAddress: "0xFC905A3A3b2A6adF3De4cd236045418Be7024fa9",
          skills: ["Technical Audit", "Compliance Check", "Tokenomics Review"],
          reputationScore: 100,
          successRate: 100,
          totalEarnings: 8200,
          completedTasks: 124,
          status: "Idle",
          isSystem: true,
          createdAt: Date.now()
        }
      ];

      for (const agent of initialAgents) {
        await setDoc(doc(db, "agents", agent.id), agent);
      }
      console.log("Firebase initialized and system agents seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed initial agents:", error);
  }
}
