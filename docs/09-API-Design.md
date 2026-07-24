# API Design

## Overview

Orvio follows a RESTful API architecture. The frontend communicates with the FastAPI backend through REST endpoints, while authentication and session management are handled by Supabase Authentication.

### Base URL

```
/api
```

### Authentication

Authentication is managed using **Supabase Auth**.

Protected endpoints require a valid Supabase access token in the Authorization header.

```
Authorization: Bearer <access_token>
```

---

# Module 1 - Users

---

## Get Current User

**Endpoint**

```
GET /api/users/me
```

**Description**

Returns the authenticated user's profile.

**Authentication**

Required

**Response**

```json
{
    "id": "uuid",
    "name": "John Doe",
    "email": "john@email.com",
    "role": "organizer"
}
```

---

## Update Profile

**Endpoint**

```
PUT /api/users/me
```

**Description**

Updates the authenticated user's profile.

**Authentication**

Required

**Request**

```json
{
    "name": "John Doe"
}
```

**Response**

```json
{
    "message": "Profile updated successfully"
}
```

---

# Module 2 - Events

---

## Get All Events

**Endpoint**

```
GET /api/events
```

**Description**

Returns all published events.

**Query Parameters**

| Parameter | Description |
|-----------|-------------|
| search | Search by title |
| category | Filter by category |
| page | Pagination |

Example

```
GET /api/events?category=Workshop&page=1
```

---

## Get Event Details

```
GET /api/events/{event_id}
```

Returns detailed information about a specific event.

---

## Create Event

```
POST /api/events
```

**Authentication**

Organizer only

**Request**

```json
{
  "title":"AI Workshop",
  "description":"Introduction to AI",
  "category":"Workshop",
  "location":"VIT Chennai",
  "is_online":false,
  "meeting_link":null,
  "start_datetime":"2026-08-01T10:00:00",
  "end_datetime":"2026-08-01T13:00:00",
  "registration_deadline":"2026-07-31T23:59:00",
  "capacity":100,
  "visibility":"public",
  "approval_required":false
}
```

---

## Update Event

```
PUT /api/events/{event_id}
```

Organizer can update their own event.

---

## Delete Event

```
DELETE /api/events/{event_id}
```

Organizer can delete their own event.

---

## Get My Events

```
GET /api/events/my-events
```

Returns all events created by the logged-in organizer.

---

# Module 3 - Registrations

---

## Register for Event

```
POST /api/events/{event_id}/register
```

Registers the current user.

Business Rules

- Event must be published.
- Registration deadline must not have passed.
- Capacity must not be full.
- Duplicate registrations are not allowed.

---

## Cancel Registration

```
DELETE /api/events/{event_id}/register
```

Cancels the participant's registration.

---

## View My Registrations

```
GET /api/registrations/me
```

Returns all registrations of the logged-in participant.

---

## View Participants

```
GET /api/events/{event_id}/participants
```

Organizer only.

Returns every participant registered for the event.

---

## Update Registration Status

```
PATCH /api/registrations/{registration_id}/status
```

**Request**

```json
{
    "status":"approved"
}
```

or

```json
{
    "status":"rejected"
}
```

---

## Mark Attendance

```
PATCH /api/registrations/{registration_id}/attendance
```

**Request**

```json
{
    "attended": true
}
```

Marks a participant as attended.

---

# Module 4 - Feedback

---

## Submit Feedback

```
POST /api/events/{event_id}/feedback
```

Only participants who attended the event can submit feedback.

**Request**

```json
{
    "rating":5,
    "comment":"Excellent event!"
}
```

---

## View Feedback

```
GET /api/events/{event_id}/feedback
```

Returns all feedback for an event.

---

# Module 5 - Admin

---

## Get All Users

```
GET /api/admin/users
```

Administrator only.

---

## Delete User

```
DELETE /api/admin/users/{user_id}
```

Administrator only.

---

## Get All Events

```
GET /api/admin/events
```

Administrator only.

---

## Delete Event

```
DELETE /api/admin/events/{event_id}
```

Administrator only.

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource Created |
| 204 | Resource Deleted |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

# API Modules Summary

| Module | Endpoints |
|----------|-----------|
| Users | 2 |
| Events | 6 |
| Registrations | 6 |
| Feedback | 2 |
| Admin | 4 |

**Total Backend Endpoints:** **20**

---

# Authentication

Authentication endpoints are **not implemented in the backend**.

Orvio uses **Supabase Authentication** for:

- User Registration
- User Login
- User Logout
- Password Reset
- Email Verification
- Session Management

The frontend authenticates users through Supabase and sends the access token to the backend using the `Authorization` header. The backend validates this token before processing protected requests.