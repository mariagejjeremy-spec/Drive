# Feature: multi upload, bulk delete, invite-password

- Added backend endpoints:
  - POST /api/uploads  (multi image upload, protected by invite password or authenticated user)
  - DELETE /api/images (bulk delete, protected similarly)
- Added DB migration to create images table
- Added a simple model (src/models/images.js) using pg
- Added middleware to accept an invite password via header/body/query when no authenticated user
- Added a React component (src/components/MobileUploader.jsx) for mobile upload + multi-select delete
- Added .env.example with INVITE_PASSWORD
