import { Inngest } from "inngest";

// Define the event types for our application
type Events = {
  "workflow.execute": {
    data: {
      executionId: string;
      nodes: any[];
      edges: any[];
    };
  };
  "user.reward_xp": {
    data: {
      userId: string;
      type: "EXECUTE_WORKFLOW" | "COMPLETE_LESSON" | "CREATE_WORKFLOW" | "PUBLISH_TEMPLATE" | "DAILY_STREAK";
      metadata?: Record<string, any>;
    };
  };
  "user.login": {
    data: {
      userId: string;
    };
  };
  "user.leveled_up": {
    data: {
      userId: string;
      level: number;
    };
  };
};

// Initialize a client to send and receive events
export const inngest = new Inngest({ 
  id: "buildrax-ai",
  schemas: {
    events: {} as Record<keyof Events, any> // Simplify for now to catch all events correctly
  } 
});
