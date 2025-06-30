# API Endpoints

Base URL: `/api`

## Authentication

- `POST /api/auth/register` – Register a new user. Request body: `{ username, email, password }`.
- `POST /api/auth/login` – Authenticate user & get JWT. Request body: `{ email, password }`.
- `GET /api/auth/me` – Get current user data. Header: `Authorization: Bearer <token>`.
- `POST /api/auth/refresh-token` – Refresh access token. Request body: `{ token }`.
- `POST /api/auth/logout` – Logout user / clear refresh token. Header: `Authorization: Bearer <token>`.

## Users

- *(No user-specific endpoints yet.)*

## Reviews

- `GET /api/reviews` – Retrieve all code reviews.
- `GET /api/reviews/:id` – Retrieve a single review by ID.
- `POST /api/reviews` – Create a new review. Header: `Authorization: Bearer <token>`.
- `PUT /api/reviews/:id` – Update an existing review. Header: `Authorization: Bearer <token>`.
- `DELETE /api/reviews/:id` – Delete a review. Header: `Authorization: Bearer <token>`.

## Comments

- `GET /api/comments?reviewId=<id>` – Get comments for a review.
- `POST /api/comments` – Create a new comment. Header: `Authorization: Bearer <token>`. Body: `{ reviewId, content }`.

## Analysis

- `POST /api/analyze` – Submit code for automated analysis. Header: `Authorization: Bearer <token>`. Body: `{ code, language }`.
- `GET /api/analyze/history` – Retrieve analysis history for the current user. Header: `Authorization: Bearer <token>`.

## Feedback

- `POST /api/feedback` – Submit feedback on AI suggestions. Header: `Authorization: Bearer <token>`. Body: `{ codeHash, language, rating, feedback }`.
