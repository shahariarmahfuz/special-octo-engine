# Social Media MVP (JSON Storage)

Facebook-like social media MVP running on Node.js + TypeScript with local JSON storage and local file uploads. This project is designed for **Render Free Web Service** and **does not use any database**.

## ⚠️ Storage Limitation (Render Free Tier)
Render free-tier web services use **ephemeral filesystems**. Any JSON data or uploaded media stored in `src/storage/` can be **cleared on redeploy or restart**. Use this project for demos or testing only.

## Tech Stack
- Node.js + TypeScript
- Express
- Socket.IO
- JWT auth
- bcrypt password hashing
- multer for file uploads
- JSON file persistence
- zod for validation
- helmet + cors + rate-limit for security

## Folder Structure
```
project-root/
  src/
    app.ts
    server.ts
    config/
    modules/
      auth/
      users/
      profiles/
      posts/
      comments/
      reactions/
      shares/
      chats/
      messages/
    storage/
      data/
        users.json
        profiles.json
        posts.json
        comments.json
        reactions.json
        shares.json
        chats.json
        messages.json
      uploads/
    lib/
      fileStore.ts
      writeLock.ts
      authMiddleware.ts
      validators.ts
      errorHandler.ts
  package.json
  tsconfig.json
  .env.example
  README.md
  render.yaml (optional)
```

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Render Deployment (Free Tier)
1. Create a new **Web Service** on Render.
2. Choose **Node.js** runtime.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables from `.env.example`.

## API Routes
### Auth
- POST `/auth/signup`
- POST `/auth/login`
- POST `/auth/logout`
- GET `/auth/me`

### Profile
- GET `/users/me`
- PATCH `/users/me`
- GET `/profiles/:username`
- PATCH `/profiles/me`

### Posts
- POST `/posts`
- GET `/feed`
- GET `/posts/:id`
- DELETE `/posts/:id`

### Engagement
- POST `/posts/:id/like`
- DELETE `/posts/:id/like`
- POST `/posts/:id/comments`
- GET `/posts/:id/comments`
- POST `/posts/:id/share`

### Chat
- GET `/chats`
- POST `/chats/dm`
- GET `/chats/:id/messages`

### Socket.IO Events
- Auth on connection via `auth.token` or `query.token`
- `dm:message` → send message
- `dm:message:new` → broadcast new message
- `typing` (optional)

## Notes
- All data is stored in `src/storage/data/*.json`.
- Uploaded media files are stored in `src/storage/uploads` and served from `/uploads`.
- Writes are serialized via a simple write lock to reduce JSON corruption in concurrent writes.
