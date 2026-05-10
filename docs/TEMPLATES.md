# BuildRAX Template Catalog

BuildRAX templates are backend architecture blueprints. They help users start from a recognizable product pattern instead of a blank canvas.

The MVP catalog contains 100 templates across 10 categories.

## How To Use Templates

For non-technical users, templates are examples of how common products work behind the scenes. For technical users, templates are starter graphs that can be modified, reviewed, simulated, diagrammed, and exported.

Recommended flow:

1. Pick the closest template.
2. Open it in the builder.
3. Add or remove nodes.
4. Configure custom dependencies and outputs.
5. Run review.
6. Run simulation.
7. Generate Mermaid.
8. Export handoff artifacts.

## Template Categories

### B2B SaaS

Useful for subscription software, workspace products, team tools, and customer-facing business apps.

| Template | Description |
|---|---|
| User Authentication SaaS | Reusable backend architecture template for user authentication SaaS. |
| Multi-Tenant SaaS Workspace | Reusable backend architecture template for multi-tenant SaaS workspace. |
| Subscription Billing SaaS | Reusable backend architecture template for subscription billing SaaS. |
| Usage-Based Credits SaaS | Reusable backend architecture template for usage-based credits SaaS. |
| Team Collaboration SaaS | Reusable backend architecture template for team collaboration SaaS. |
| Project Management SaaS | Reusable backend architecture template for project management SaaS. |
| CRM Lead Management | Reusable backend architecture template for CRM lead management. |
| Customer Support Ticketing | Reusable backend architecture template for customer support ticketing. |
| Document Approval SaaS | Reusable backend architecture template for document approval SaaS. |
| B2B Reporting Dashboard | Reusable backend architecture template for B2B reporting dashboard. |

Example journey: choose "Multi-Tenant SaaS Workspace," add RBAC, add Audit Log, run review, then export developer handoff.

### B2C App

Useful for consumer mobile and web apps.

| Template | Description |
|---|---|
| Consumer App Onboarding | Reusable backend architecture template for consumer app onboarding. |
| Social Feed App | Reusable backend architecture template for social feed app. |
| Chat App | Reusable backend architecture template for chat app. |
| Video Calling App | Reusable backend architecture template for video calling app. |
| Dating App Matchmaking | Reusable backend architecture template for dating app matchmaking. |
| Fitness Tracking App | Reusable backend architecture template for fitness tracking app. |
| Learning App | Reusable backend architecture template for learning app. |
| Food Delivery App | Reusable backend architecture template for food delivery app. |
| Ride Booking App | Reusable backend architecture template for ride booking app. |
| Push Notification Engagement | Reusable backend architecture template for push notification engagement. |

Example journey: choose "Chat App," add WebSocket, add Notification, add Metrics, simulate happy path and timeout behavior.

### Marketplace

Useful for two-sided marketplaces, service marketplaces, escrow flows, listings, disputes, and payouts.

| Template | Description |
|---|---|
| Two-Sided Marketplace | Reusable backend architecture template for two-sided marketplace. |
| Creator Marketplace | Reusable backend architecture template for creator marketplace. |
| Freelance Marketplace with Escrow | Reusable backend architecture template for freelance marketplace with escrow. |
| Service Booking Marketplace | Reusable backend architecture template for service booking marketplace. |
| Real Estate Listing Marketplace | Reusable backend architecture template for real estate listing marketplace. |
| Rental Marketplace | Reusable backend architecture template for rental marketplace. |
| B2B Vendor Marketplace | Reusable backend architecture template for B2B vendor marketplace. |
| Job Marketplace | Reusable backend architecture template for job marketplace. |
| Expert Consultation Marketplace | Reusable backend architecture template for expert consultation marketplace. |
| Dispute Resolution Marketplace | Reusable backend architecture template for dispute resolution marketplace. |

Example journey: choose "Freelance Marketplace with Escrow," add Payment Gateway, Wallet, Audit Log, and Saga for partial failure recovery.

### AI Product

Useful for AI SaaS, RAG systems, AI agents, moderation, generation, and AI review tools.

| Template | Description |
|---|---|
| AI Chatbot SaaS | Reusable backend architecture template for AI chatbot SaaS. |
| RAG Knowledge Base | Reusable backend architecture template for RAG knowledge base. |
| AI Agent Tool Calling | Reusable backend architecture template for AI agent tool calling. |
| AI Content Generation | Reusable backend architecture template for AI content generation. |
| AI Image/Video Generation | Reusable backend architecture template for AI image/video generation. |
| AI Code Documentation | Reusable backend architecture template for AI code documentation. |
| AI Customer Support Automation | Reusable backend architecture template for AI customer support automation. |
| AI Lead Scoring | Reusable backend architecture template for AI lead scoring. |
| AI Moderation | Reusable backend architecture template for AI moderation. |
| AI Workflow Review | Reusable backend architecture template for AI workflow review. |

Example journey: choose "RAG Knowledge Base," add Vector Search, Guardrail, Output Parser, Credit Meter, and Metrics.

### Data & Analytics

Useful for event pipelines, dashboards, ETL, segmentation, attribution, and reporting.

| Template | Description |
|---|---|
| Event Tracking Pipeline | Reusable backend architecture template for event tracking pipeline. |
| Realtime Dashboard | Reusable backend architecture template for realtime dashboard. |
| ETL Data Pipeline | Reusable backend architecture template for ETL data pipeline. |
| Customer Segmentation | Reusable backend architecture template for customer segmentation. |
| Funnel Analytics | Reusable backend architecture template for funnel analytics. |
| Revenue Analytics | Reusable backend architecture template for revenue analytics. |
| Anomaly Detection | Reusable backend architecture template for anomaly detection. |
| Data Warehouse Sync | Reusable backend architecture template for data warehouse sync. |
| Report Generation | Reusable backend architecture template for report generation. |
| Attribution Tracking | Reusable backend architecture template for attribution tracking. |

Example journey: choose "ETL Data Pipeline," add Queue, Worker, Dead Letter Queue, Metrics, and Report Export.

### Fintech & Payments

Useful for wallets, escrow, billing, refunds, KYC, payouts, reconciliation, and fraud detection.

| Template | Description |
|---|---|
| Digital Wallet | Reusable backend architecture template for digital wallet. |
| Escrow Payment | Reusable backend architecture template for escrow payment. |
| Subscription Renewal | Reusable backend architecture template for subscription renewal. |
| Invoice Payment | Reusable backend architecture template for invoice payment. |
| Refund Processing | Reusable backend architecture template for refund processing. |
| Fraud Detection Payment | Reusable backend architecture template for fraud detection payment. |
| KYC Verification | Reusable backend architecture template for KYC verification. |
| Payout Management | Reusable backend architecture template for payout management. |
| Credit-Based Usage Billing | Reusable backend architecture template for credit-based usage billing. |
| Financial Reconciliation | Reusable backend architecture template for financial reconciliation. |

Example journey: choose "Digital Wallet," add Database Transaction, Audit Log, Saga, Alert, and Dead Letter Queue.

### Internal Tools

Useful for admin systems, approvals, inventory, support, incident response, and compliance.

| Template | Description |
|---|---|
| Admin Dashboard | Reusable backend architecture template for admin dashboard. |
| User Management Admin | Reusable backend architecture template for user management admin. |
| Content Moderation Dashboard | Reusable backend architecture template for content moderation dashboard. |
| Support Operations Dashboard | Reusable backend architecture template for support operations dashboard. |
| Approval Management | Reusable backend architecture template for approval management. |
| Inventory Management | Reusable backend architecture template for inventory management. |
| Logistics Tracking | Reusable backend architecture template for logistics tracking. |
| HRMS Leave Approval | Reusable backend architecture template for HRMS leave approval. |
| Incident Management | Reusable backend architecture template for incident management. |
| Compliance Reporting | Reusable backend architecture template for compliance reporting. |

Example journey: choose "Approval Management," add RBAC, State Machine, Notification, Audit Log, and Report Export.

### Developer Tools

Useful for engineering platforms, docs, CI/CD, feature flags, testing, monitoring, secrets, and API key management.

| Template | Description |
|---|---|
| API Documentation Generator | Reusable backend architecture template for API documentation generator. |
| Backend Scaffold Generator | Reusable backend architecture template for backend scaffold generator. |
| CI/CD Pipeline | Reusable backend architecture template for CI/CD pipeline. |
| Feature Flag System | Reusable backend architecture template for feature flag system. |
| API Load Testing | Reusable backend architecture template for API load testing. |
| Webhook Testing | Reusable backend architecture template for webhook testing. |
| Error Monitoring | Reusable backend architecture template for error monitoring. |
| Secret Management | Reusable backend architecture template for secret management. |
| Multi-Environment Config | Reusable backend architecture template for multi-environment config. |
| Developer API Key Management | Reusable backend architecture template for developer API key management. |

Example journey: choose "Developer API Key Management," add API Key Auth, Rate Limiter, Credit Meter, Audit Log, and Metrics.

### Creator & Media

Useful for campaigns, uploads, live streams, scheduling, creator payouts, and media analytics.

| Template | Description |
|---|---|
| Creator Campaign Platform | Reusable backend architecture template for creator campaign platform. |
| AI-UGC Campaign | Reusable backend architecture template for AI-UGC campaign. |
| Video Upload & Processing | Reusable backend architecture template for video upload and processing. |
| Live Streaming | Reusable backend architecture template for live streaming. |
| Content Scheduling | Reusable backend architecture template for content scheduling. |
| Influencer Payout | Reusable backend architecture template for influencer payout. |
| Campaign Analytics | Reusable backend architecture template for campaign analytics. |
| Brand-Creator Escrow | Reusable backend architecture template for brand-creator escrow. |

Example journey: choose "Video Upload & Processing," add Object Storage, Queue, Worker, Dead Letter Queue, Notification, and Metrics.

### Operations & Automation

Useful for lead routing, marketing automation, onboarding, churn prevention, procurement, policy enforcement, bot detection, and monitoring.

| Template | Description |
|---|---|
| Lead Routing Automation | Reusable backend architecture template for lead routing automation. |
| Email Marketing Automation | Reusable backend architecture template for email marketing automation. |
| Customer Onboarding Automation | Reusable backend architecture template for customer onboarding automation. |
| Churn Prevention | Reusable backend architecture template for churn prevention. |
| Vendor Onboarding | Reusable backend architecture template for vendor onboarding. |
| Procurement Approval | Reusable backend architecture template for procurement approval. |
| Policy Violation Detection | Reusable backend architecture template for policy violation detection. |
| Bot Detection | Reusable backend architecture template for bot detection. |
| Campaign Launch Management | Reusable backend architecture template for campaign launch management. |
| Ad Revenue Monitoring | Reusable backend architecture template for ad revenue monitoring. |
| SLA Breach Escalation | Reusable backend architecture template for SLA breach escalation. |
| Fraud Ops Review Queue | Reusable backend architecture template for fraud ops review queue. |

Example journey: choose "Lead Routing Automation," add Rule Engine, CRM integration as a Custom Node, Queue, Worker, Notification, and Alert.
