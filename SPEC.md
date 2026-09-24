# Taskly — App Spec

Taskly is a simple weekly task manager. Users sign in, then add, view, edit, complete, and delete tasks for each day of the week so they can plan the week in one place.

## Data

Each **task** belongs to the signed-in user and has:

- `title` (required)
- `notes` (optional)
- `day` (Monday–Sunday)
- `done` (true/false)
- `user` (pointer to the Parse User)

Stored in Back4App (Parse) class: `Task`

## Pages

- **Login / Register** — email and password
- **Week board** — seven day columns; users can create, read, update, and delete their own tasks
- **Logout** from the week board

## Login

Yes. Users must be registered and logged in before they can create or change tasks. Each user only sees their own tasks.
