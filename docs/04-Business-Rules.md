Business Rules
Business rules define the operational policies that govern how Orvio functions.

BR-1 User Registration
Every user must create an account before accessing protected features of the platform.

BR-2 Event Ownership
Every event must have exactly one organizer.
An organizer may create multiple events.

BR-3 Event Visibility
Each event must be either:
Public
Private
Only public events are visible to all users.
Private events are visible only to eligible participants.

BR-4 Event Capacity
Every event shall have a maximum participant capacity.
The system shall not allow registrations beyond this limit.

BR-5 Registration Deadline
Each event must define a registration deadline.
Registrations shall automatically close after the deadline.

BR-6 Duplicate Registration
A participant may register only once for a particular event.

BR-7 Approval Workflow
If organizer approval is enabled for an event:
New registrations shall remain in Pending status.
The organizer may Approve or Reject the registration.
If approval is disabled, registrations shall be confirmed automatically.

BR-8 Attendance
Only registered participants may be marked as attended.
Attendance cannot be modified after the event has ended unless performed by an administrator.

BR-9 Feedback
Only participants who attended an event may submit feedback.
Each participant may submit only one feedback entry per event.

BR-10 Event Modification
Only the organizer who created an event may edit or delete it.
Administrators may override this restriction.

BR-11 Event Status
Every event shall exist in one of the following states:
Draft
Published
Completed
Cancelled
Only Published events may accept registrations.

BR-12 User Permissions
Participants cannot create events.
Only Organizers and Administrators can publish events.
Administrators have unrestricted access across the platform.

BR-13 Data Integrity
Deleting an event shall also remove all associated:
Registrations
Attendance records
Feedback
to preserve database consistency.

BR-14 Authentication
Only authenticated users may register for events or create events.
Guests may browse only publicly available events.
BR-15 Organizer Responsibility
Organizers are responsible for maintaining accurate event information including date, venue, capacity, and eligibility requirements.


