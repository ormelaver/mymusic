MyMusic - The app that searches music automatically for you!
Just sign up, set the term, platform, and interval - and the app will search music for you in the relevant platforms.

Technologies we use:
1. Firebase Auth for user authentication.
2. Google Cloud Run for containerization of the core service that's in charge of communicating with the database.
3. Google Datastore as a database.
4. Google Functions that do the actual search and emit an event when a new result is detected.
5. Gemini API to verify result relevance.
6. Google Scheduler that triggers the Function every 24 hours.
7. Google Pub/Sub for messaging.
8. Written in Node.js with Typescript.
