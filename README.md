# MyMusic: Event-Driven Music Search Platform for DJs

MyMusic is a modular, event-driven music search and notification system designed for DJs and music enthusiasts. Built with TypeScript and Express.js, and deployed on Google Cloud Platform, MyMusic automates music discovery across multiple platforms, delivering results and notifications with high reliability, scalability, and security.

---

## Architecture Overview

- **Modular Services:**

  - `core-service`: Orchestrates user queries, manages business logic, and coordinates search workflows.
  - `tei-manager`: Manages user taste embeddings, provides inference APIs, and supports personalization.
  - `tei-service`: Stateless microservice for scalable, secure taste embedding inference (HuggingFace TEI).
  - `notifications`: Handles outbound notifications (SMS, email, frontend), decoupled from core logic.
  - `youtube-function`: Google Cloud Function for YouTube music search and metadata extraction.

- **Event-Driven Communication:**

  - Google Pub/Sub is used for decoupled, asynchronous messaging between services and functions.
  - Google Scheduler triggers periodic search events.

- **Persistence & State:**

  - Google Datastore is used for scalable, NoSQL persistence of user queries, search results, and taste vectors.

- **Security & Identity:**

  - Firebase Auth for user authentication and session management.
  - Google Secret Manager and Workload Identity for secure secret and credential management in production.
  - `.env` files and service account keys for local development.

- **Containerization & Deployment:**
  - All services are containerized with Docker and deployed to Google Cloud Run for scalability and reliability.
  - Platform-specific integrations (e.g., YouTube) are implemented as Google Cloud Functions.

---

## System Patterns & Design Principles

- **Separation of Concerns:**

  - Clear boundaries between routes, controllers, and services in each module.
  - Singleton clients for Datastore and other shared resources.

- **Factory & Modular Patterns:**

  - Factory pattern for notification channels (SMS, email, etc.), enabling easy extensibility.
  - Modular folder structure: `/src` for components, `/types` for TypeScript types, `/utils` for shared utilities.

- **Event-Driven & Asynchronous:**

  - Pub/Sub enables loose coupling and scalable event processing.
  - Batch processing for notifications and taste embedding updates.

- **Security Best Practices:**
  - Workload Identity and Secret Manager in production; `.env` and service accounts for local dev.
  - All sensitive operations and model endpoints are secured.

---

## Service Breakdown

### Core Service

- Express.js REST API for user queries and orchestration.
- Integrates with Datastore for persistence and Pub/Sub for event-driven workflows.
- Handles validation, error handling, and schema management.

### TEI Manager

- Manages user taste embeddings and inference APIs.
- Integrates with HuggingFace models for batch and real-time inference.
- Sends "taste-updated" events to Pub/Sub after updates.

### TEI Service

- Stateless microservice for scalable taste embedding inference.
- Exposes REST API for embedding generation.
- Secured via service accounts and environment variables.

### Notifications

- Cloud Run Job for batch notification processing.
- Channel factory for SMS, email, and future extensibility.
- Integrates with Pub/Sub for event-driven delivery.

### YouTube Function

- Google Cloud Function (TypeScript) for music search and metadata extraction.
- Integrates with YouTube Data API and normalizes track metadata.
- Triggered by Pub/Sub and returns results to core-service.

---

## Technology Stack

- **Languages & Frameworks:** TypeScript, Node.js, Express.js
- **Cloud Platform:** Google Cloud Platform (Cloud Run, Functions, Pub/Sub, Datastore, Scheduler, Secret Manager)
- **Authentication:** Firebase Auth
- **ML/AI:** HuggingFace TEI for taste embeddings
- **Containerization:** Docker
- **Config:** dotenv, .env files

---

## Security & Operations

- **Production:** Workload Identity, Secret Manager, and service-to-service authentication.
- **Development:** `.env` files and service account keys for local testing.
- **Monitoring & Logging:** All services are designed for observability and operational insight.

---

## Development & Contribution

1. Clone the repository and install dependencies in each service folder.
2. Set up `.env` files and service account keys for local development.
3. Use Docker for local builds and testing.
4. Deploy to Google Cloud Run and Functions as described in each service's documentation.

---

## Persistent Documentation

All architectural, design, and task context is maintained in `.github/memory-bank/` as markdown files for each service. This enables persistent, AI-friendly documentation and rapid onboarding for new contributors.

---

## Engineering Rigor

- Modular, event-driven, and cloud-native architecture.
- Security best practices for secret and credential management.
- Persistent, structured documentation for maintainability and onboarding.
- Designed for extensibility, scalability, and operational excellence.

---

## Contact & Hiring

This project demonstrates advanced cloud architecture, event-driven design, and engineering best practices. For more details or to discuss opportunities, please contact the maintainer.
