import mongoose from "mongoose";
import dbConnect from "./src/lib/mongodb";
import { Mission } from "./src/lib/models/Mission";

const missions = [
  {
    title: "The Hello World Agent",
    description: "Learn the basics of BuildRAX by creating your first AI agent that responds to a simple text input.",
    xpReward: 500,
    levelRequired: 1,
    order: 1,
    steps: [
      {
        title: "Clone the Starter Template",
        description: "Go to Templates and clone the 'Basic Text Bot' template.",
        type: "BUILD",
      },
      {
        title: "Execute the Workflow",
        description: "Open the builder and run the workflow once to see it in action.",
        type: "EXECUTE",
      },
    ],
    badge: "Novice Creator",
  },
  {
    title: "RAG Master: Part 1",
    description: "Connect your agent to a PDF memory source to enable document-based question answering.",
    xpReward: 2000,
    levelRequired: 5,
    order: 2,
    steps: [
      {
        title: "Add a Memory Node",
        description: "Drag a Memory node onto the canvas and connect it to an LLM node.",
        type: "BUILD",
      },
      {
        title: "Successful Retrieval",
        description: "Run a query that successfully retrieves information from the uploaded PDF.",
        type: "EXECUTE",
      },
    ],
    badge: "Memory Weaver",
  },
];

async function seed() {
  await dbConnect();
  console.log("Connected to MongoDB");

  await Mission.deleteMany({});
  console.log("Cleared existing missions");

  await Mission.insertMany(missions);
  console.log("Seeded missions successfully");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
