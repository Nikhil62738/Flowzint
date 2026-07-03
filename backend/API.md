# Backend API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require:

```http
Authorization: Bearer <jwt>
```

## Auth

`POST /auth/register`

```json
{
  "name": "Demo Admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

`POST /auth/login`

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

`GET /auth/me`

Returns the authenticated user profile.

## Conversations

`POST /conversations/message`

Creates a conversation if needed, analyzes emotion, generates the AI response, checks escalation, and saves both messages.

```json
{
  "content": "This is urgent, our production account is locked!",
  "language": "en"
}
```

`POST /conversations/:id/message`

Adds a message to an existing conversation.

`GET /conversations`

Lists the authenticated user's conversations. Admins see all conversations.

`GET /conversations/:id`

Returns one conversation and its messages.

`POST /conversations/:id/summary`

Generates and stores a concise conversation summary.

## Analytics

`GET /analytics/dashboard`

Admin/agent only. Returns cards, emotion distribution, frustrated users, and recent conversations.
