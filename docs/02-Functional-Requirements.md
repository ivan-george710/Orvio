Functional Requirements
The following functional requirements describe the core functionalities that Orvio must provide to its users.

FR-1 User Authentication
The system shall allow users to create an account using their email address.
The system shall allow registered users to log in securely.
The system shall allow authenticated users to log out.
The system shall allow users to update their profile information.

FR-2 User Roles
The system shall support three user roles:
Participant
Organizer
Administrator
The system shall restrict access to features based on the authenticated user's role.

FR-3 Event Creation
The system shall allow organizers to create new events.
Each event shall contain:
Event Title
Description
Category
Date
Time
Venue or Online Meeting Link
Registration Deadline
Maximum Participant Capacity
Event Banner (Optional)
Eligibility Rules
Approval Requirement
The system shall validate all mandatory fields before publishing an event.

FR-4 Event Management
The system shall allow organizers to edit their own events.
The system shall allow organizers to delete their own events.
The system shall display all events created by the organizer.

FR-5 Event Discovery
The system shall allow participants to browse all available public events.
The system shall allow users to search events using keywords.
The system shall allow users to filter events based on:
Category
Date
Location
Organizer
The system shall display detailed information for every event.

FR-6 Event Registration
The system shall allow eligible participants to register for events.
The system shall prevent duplicate registrations.
The system shall prevent registrations after the registration deadline.
The system shall prevent registrations when the maximum participant capacity has been reached.
The system shall display the participant's registration status.

FR-7 Registration Approval
The system shall allow organizers to require approval before confirming registrations.
The system shall allow organizers to approve or reject pending registrations.
The system shall notify the registration status within the user's dashboard.

FR-8 Participant Management
The system shall allow organizers to view all registered participants.
The system shall allow organizers to search participant records.
The system shall display participant registration status.

FR-9 Attendance Management
The system shall allow organizers to mark participant attendance.
The system shall maintain attendance records for every event.
Attendance shall only be recorded for registered participants.

FR-10 Feedback Management
The system shall allow participants to submit ratings and feedback after an event.
The system shall restrict feedback submission to registered participants.
The system shall allow organizers to view participant feedback.

FR-11 Dashboard
The participant dashboard shall display:
Upcoming events
Registered events
Past events
Registration status
The organizer dashboard shall display:
Events created
Total registrations
Attendance statistics
Recent participant activity
The administrator dashboard shall display:
Total users
Total events
Platform activity
User management options



FR-12 Analytics
The system shall generate basic analytics for organizers including:
Total registrations
Attendance count
Attendance percentage
Participant feedback summary

FR-13 Administration
The system shall allow administrators to:
View all users
View all events
Remove inappropriate events
Disable user accounts when necessary

FR-14 Security
The system shall require authentication before accessing protected resources.
The system shall ensure users can access only resources permitted by their assigned role.
The system shall securely store user credentials.

FR-15 Data Persistence
The system shall store all application data in a PostgreSQL database.
The system shall preserve event, participant, registration, attendance, and feedback records until explicitly deleted by authorized users.

