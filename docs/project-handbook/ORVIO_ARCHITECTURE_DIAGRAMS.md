# ORVIO ? Architecture and Workflow Diagrams

Audit: **20 October 2026**, repository **955f1af**. These editable Mermaid blocks match the diagrams in the [complete handbook](ORVIO_COMPLETE_HANDBOOK.md). All source paths are relative to the project root.

The configured Supabase project was not available through the connector, so SQL diagrams describe repository definitions, not freshly verified deployed objects. Safe Node checks passed 190 tests and lint; type checking/build failed on missing local Playwright dependency. See the [implementation audit](ORVIO_IMPLEMENTATION_STATUS.md).

## 1. High-level system architecture

Current Next.js/Supabase communication paths. The browser header also reads its own profile role. FastAPI is not integrated; production hosting is unverified.

Evidence: `frontend/lib/services/server/events.ts`; `frontend/lib/supabase/`; `frontend/lib/actions/`; `frontend/lib/services/banners.ts`.

```mermaid
flowchart LR
    U[Browser user] --> UI[React client components]
    U --> P[Next.js proxy and server pages]
    UI --> A[Next.js server actions]
    P --> S[Server services and cookie client]
    A --> S
    UI --> BC[Supabase browser client]
    BC --> AU[Supabase Auth]
    BC --> ST[Supabase Storage event-banners]
    BC --> API[Supabase data API]
    S --> AU
    S --> API
    API --> DB[PostgreSQL tables with RLS]
    API --> RPC[Public invoker RPC wrappers]
    RPC --> PR[Private definer functions]
    PR --> DB
```

## 2. Authentication sequence

Repository-defined signup trigger and login/cookie flow. The trigger attachment is modeled by the disposable baseline and assumed by upgrades; hosted confirmation settings and trigger attachment were not freshly inspected.

Evidence: `frontend/components/auth/`; `frontend/lib/supabase/middleware.ts`; `supabase/tests/baseline.sql`; `supabase/migrations/20261011054251_complete_event_registrations.sql`.

```mermaid
sequenceDiagram
    actor User
    participant Form as Browser auth form
    participant Auth as Supabase Auth
    participant DB as PostgreSQL
    participant Proxy as Next.js proxy
    participant Page as Server page
    User->>Form: Submit signup and full name
    Form->>Auth: signUp with full_name metadata
    Auth->>DB: Insert auth.users
    DB->>DB: Existing trigger calls handle_new_user
    DB->>DB: Insert profiles with participant role
    Auth-->>Form: Session or confirmation-required response
    Form->>Proxy: Navigate to dashboard
    Proxy->>Auth: getUser using cookies
    alt No valid session
        Proxy-->>User: Redirect to login with internal return path
        User->>Form: Submit email and password
        Form->>Auth: signInWithPassword
        Auth-->>Form: Session cookies or error
        Form->>Proxy: Navigate to safe return path
        Proxy->>Auth: Verify user and refresh cookies
    end
    Proxy->>Page: Continue authenticated request
    Page->>DB: Read permitted profile and application data
    Page-->>User: Render page
```

## 3. Role-based access overview

Participant and organizer share the authenticated-member paths. Ownership governs pending editing/withdrawal and attendee management. Admin adds platform authority but not arbitrary direct registration writes.

Evidence: `frontend/lib/services/server/events.ts`; `frontend/lib/services/server/admin.ts`; `frontend/lib/auth-routing.ts`; `supabase/tests/baseline.sql`.

```mermaid
flowchart TD
    G[Guest] --> V[Approved discovery and details]
    M[Authenticated participant or organizer] --> V
    M --> C[Create pending event]
    M --> O[Edit or delete own pending event]
    M --> R[Own registrations and history]
    M --> T[Attendees of owned events]
    A[Admin] --> M
    A --> D[Admin dashboard and user roles]
    A --> E[All event moderation and attendee views]
```

## 4. Event approval workflow

Normal creation inserts pending; admin review approves or rejects. Pending withdrawal is hard deletion. This diagram is the review story, not a universal admin state-transition restriction.

Evidence: `frontend/components/events/CreateEventForm.tsx`; `frontend/components/admin/AdminEventActions.tsx`; `frontend/lib/actions/events.ts`; `frontend/lib/services/server/events.ts`.

```mermaid
flowchart TD
    F[Authenticated member submits form] --> V[Server validates details and identity]
    V --> P[Insert own pending event]
    P --> Q[Admin review queue]
    Q --> D{Admin decision}
    D --> A[Set approved]
    D --> R[Set rejected]
    A --> L[Public discovery and eligible registration]
    R --> H[Hidden from approved discovery]
```

## 5. Event lifecycle state diagram

UI-exposed transitions are shown. Admin database/service updates are not constrained to this graph; allowed status values can be assigned without a source-state check, including pending through a crafted permitted call. Admin deletion is available in every state, and no automatic completion scheduler exists.

Evidence: `frontend/components/admin/AdminEventManageActions.tsx`; `frontend/lib/services/server/events.ts`; `supabase/tests/baseline.sql`.

```mermaid
stateDiagram-v2
    [*] --> pending: Authenticated creation
    pending --> pending: Owner edits details
    pending --> approved: Admin approves
    pending --> rejected: Admin rejects
    pending --> cancelled: Admin cancels
    pending --> [*]: Owner withdraws by deletion
    approved --> completed: Admin completes
    approved --> cancelled: Admin cancels
    approved --> rejected: Admin rejects
    rejected --> approved: Admin approves
    rejected --> cancelled: Admin cancels
    completed --> approved: Admin approves
    completed --> rejected: Admin rejects
    completed --> cancelled: Admin cancels
    cancelled --> approved: Admin approves
    cancelled --> rejected: Admin rejects
    note right of approved
        UI transitions shown.
        Admin database updates are not a strict state machine.
        Admin deletion is available in every state.
    end note
```

## 6. Registration sequence

Server validates UUID/Auth; SQL derives identity and serializes supported registrations with an event-row lock. The post-write summary is a separate request, so summary failure does not roll back an already-committed registration. Actual SQL concurrency was not rerun in this audit.

Evidence: `frontend/components/events/RegisterEventButton.tsx`; `frontend/lib/actions/registrations.ts`; `frontend/lib/services/server/registrations.ts`; `supabase/migrations/20261011054251_complete_event_registrations.sql`.

```mermaid
sequenceDiagram
    actor Member
    participant UI as Registration button
    participant Action as Next.js action
    participant Service as Registration service
    participant RPC as Public RPC wrapper
    participant DB as Private function and PostgreSQL
    Member->>UI: Register for event
    UI->>Action: registerForEventAction(eventId)
    Action->>Service: registerForEvent(eventId)
    Service->>Service: Validate UUID and getUser
    Service->>RPC: register_for_event(p_event_id)
    RPC->>DB: Execute private function
    DB->>DB: Read auth.uid and lock event FOR UPDATE
    DB->>DB: Check approval, time, duplicate and capacity
    alt Eligible
        DB->>DB: Insert active registration and commit
        DB-->>Action: Success through RPC and service
        Action->>DB: registration_summaries
        DB-->>Action: Authoritative count and personal state
        Action-->>UI: ok and summary with paths revalidated
        UI-->>Member: Registered state and count
    else Rejected
        DB-->>Service: Symbolic SQL error
        Service-->>Action: RegistrationError with safe message
        Action-->>UI: Error result
        UI-->>Member: Explanation and refreshed availability
    end
```

## 7. Database ER diagram

Repository model reconstructed from the disposable test baseline plus three upgrades. auth.users is shown only with fields used by this model, not its entire managed schema. Auth/profile key constraints permit zero or one profile, while the trigger intends one. Banner URLs are not foreign keys to Storage objects.

Evidence: `supabase/tests/baseline.sql`; `supabase/migrations/20261011054251_complete_event_registrations.sql`; `supabase/migrations/20261014122006_add_event_categories_and_banners.sql`.

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : "identity profile"
    PROFILES ||--o{ EVENTS : creates
    PROFILES ||--o{ REGISTRATIONS : participates
    EVENTS ||--o{ REGISTRATIONS : receives
    AUTH_USERS {
        uuid id PK
        jsonb raw_user_meta_data
    }
    PROFILES {
        uuid id PK, FK
        text full_name
        text role
        timestamptz created_at
        timestamptz updated_at
    }
    EVENTS {
        uuid id PK
        uuid created_by FK
        text title
        text description
        text venue
        text category
        text banner_url
        integer max_participants
        text status
        timestamptz event_datetime
        timestamptz created_at
        timestamptz updated_at
    }
    REGISTRATIONS {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        text status
        timestamptz registered_at
        timestamptz cancelled_at
    }
```
