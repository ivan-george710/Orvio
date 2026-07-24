USERS
Column
Type
Constraints
id
UUID
Primary Key
name
VARCHAR(100)
NOT NULL
email
VARCHAR(255)
UNIQUE, NOT NULL
password_hash
TEXT
NOT NULL
role
ENUM
participant, organizer, admin
created_at
TIMESTAMP
DEFAULT NOW()
updated_at
TIMESTAMP
DEFAULT NOW()






2. Events
Stores all events created by organizers.
Column
Type
Constraints
id
UUID
Primary Key
organizer_id
UUID
FK → users.id
title
VARCHAR(255)
NOT NULL
description
TEXT
NOT NULL
category
VARCHAR(50)
NOT NULL
banner_url
TEXT
NULL
location
VARCHAR(255)
NULL
is_online
BOOLEAN
DEFAULT FALSE
meeting_link
TEXT
NULL
start_datetime
TIMESTAMP
NOT NULL
end_datetime
TIMESTAMP
NOT NULL
registration_deadline
TIMESTAMP
NOT NULL
capacity
INTEGER
NOT NULL
visibility
ENUM
public, private
approval_required
BOOLEAN
DEFAULT FALSE
status
ENUM
draft, published, completed, cancelled
created_at
TIMESTAMP
DEFAULT NOW()
updated_at
TIMESTAMP
DEFAULT NOW()



3. Registrations
Represents a participant registering for an event.
Column
Type
Constraints
id
UUID
Primary Key
event_id
UUID
FK → events.id
user_id
UUID
FK → users.id
status
ENUM
pending, approved, rejected, cancelled
attended
BOOLEAN
DEFAULT FALSE
checked_in_at
TIMESTAMP
NULL
registered_at
TIMESTAMP
DEFAULT NOW()






4. Feedback
Stores participant feedback after attending an event.
Column
Type
Constraints
id
UUID
Primary Key
event_id
UUID
FK → events.id
user_id
UUID
FK → users.id
rating
INTEGER
CHECK (rating BETWEEN 1 AND 5)
comment
TEXT
NULL
submitted_at
TIMESTAMP
DEFAULT NOW()


Cardinality
Relationship
Type
User → Events
One-to-Many
User → Registrations
One-to-Many
Event → Registrations
One-to-Many
User → Feedback
One-to-Many
Event → Feedback
One-to-Many
Users ↔ Events
Many-to-Many (through Registrations)

Enums
User Role
participant
organizer
admin

Event Status
draft
published
completed
cancelled

Event Visibility
public
private

Registration Status
pending
approved
rejected
cancelled

