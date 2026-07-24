Non-Functional Requirements
The following non-functional requirements define the quality attributes and operational characteristics that Orvio should satisfy.

NFR-1 Performance
The system shall load any application page within 3 seconds under normal operating conditions.
The system shall process user authentication requests within 2 seconds.
Event search results shall be displayed within 2 seconds.
Event registration requests shall be processed within 3 seconds.
The platform shall support multiple users accessing the system simultaneously without noticeable performance degradation.

NFR-2 Security
User passwords shall be securely hashed before being stored in the database.
All authenticated requests shall require a valid access token.
Role-Based Access Control (RBAC) shall restrict users to authorized resources and actions.
The system shall validate all user inputs to reduce common security vulnerabilities.
Communication between the client and server shall occur over HTTPS in production.

NFR-3 Reliability
The system shall maintain data consistency during user operations.
Event registrations shall not be duplicated under normal operation.
The database shall preserve all event-related information unless deleted by an authorized user.
The application shall recover gracefully from unexpected errors without data corruption.

NFR-4 Availability
The application shall be available whenever the hosting infrastructure is operational.
Planned maintenance shall not result in permanent data loss.
Users shall receive meaningful error messages when services are temporarily unavailable.

NFR-5 Scalability
The system architecture shall support future expansion without major redesign.
Additional modules such as payment processing, certificate generation, and notification services shall be easily integrated.
The database design shall support increasing numbers of users, events, and registrations.

NFR-6 Usability
The user interface shall be simple and intuitive for first-time users.
Navigation between pages shall remain consistent throughout the application.
Forms shall provide clear validation messages when invalid data is entered.
The application shall be responsive and usable on desktops, tablets, and mobile devices.

NFR-7 Maintainability
The project shall follow a modular architecture separating the frontend, backend, and database layers.
Source code shall follow consistent naming conventions and coding standards.
The project shall include clear documentation for setup and development.
The application shall use Git for version control with a structured branching strategy.

NFR-8 Compatibility
The application shall function correctly on the latest versions of Google Chrome, Microsoft Edge, Mozilla Firefox, and Safari.
The platform shall be accessible through modern web browsers without requiring additional plugins.
The frontend shall communicate with the backend through RESTful APIs.

NFR-9 Portability
The application shall be containerized using Docker to simplify deployment.
The system shall be deployable on cloud hosting platforms such as Vercel and Railway without requiring code changes.

NFR-10 Data Integrity
The system shall prevent duplicate event registrations for the same participant.
Registration limits defined by the organizer shall always be enforced.
Attendance records shall only exist for registered participants.
Relationships between users, events, registrations, attendance, and feedback shall remain consistent through database constraints.

NFR-11 Logging and Error Handling
The backend shall log significant application events and errors for debugging purposes.
The system shall display user-friendly error messages instead of exposing internal server details.
Failed operations shall not leave the system in an inconsistent state.

NFR-12 Extensibility
The architecture shall support the addition of future features without requiring significant changes to the existing codebase. Potential future extensions include:
QR-code attendance
Payment gateway integration
Certificate generation
Email and push notifications
AI-powered event recommendations
Mobile application support

