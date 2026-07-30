                    +----------------------+
                    |        User          |
                    | Organizer / Student  |
                    +----------+-----------+
                               |
                               | HTTPS
                               v
                    +----------------------+
                    |   Next.js Frontend   |
                    | (App Router + React) |
                    +----------+-----------+
                               |
                Server Actions / Supabase Client
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
      +------------------+          +----------------------+
      |  Supabase Auth   |          | Supabase PostgreSQL  |
      | Authentication   |          | Events, Profiles,    |
      | Session Mgmt     |          | Registrations, etc.  |
      +------------------+          +----------------------+