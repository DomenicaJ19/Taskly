# Taskly

Taskly is a weekly task manager. Sign in, then add, view, edit, complete, and delete tasks for each day of the week.

## Deployed app

Coming soon (Netlify). Deploy once when the app is finished to stay within the free plan.

## Demo video

Coming soon (unlisted YouTube, 3–5 minutes).

## What it does

- Register, log in, and log out with email and password
- See a Monday–Sunday board of your tasks
- Create, read, update, and delete tasks
- Tasks are stored in Back4App (Parse) in a `Task` class and belong only to the signed-in user

## Technologies

- HTML, CSS, and JavaScript
- [Back4App](https://www.back4app.com/) (Parse Server) for authentication and the database
- [Netlify](https://www.netlify.com/) for hosting (after the app is complete)

## Setup instructions

1. Clone this repository:

   ```bash
   git clone https://github.com/DomenicaJ19/Taskly.git
   cd Taskly
   ```

2. Create a free Back4App app at [https://www.back4app.com](https://www.back4app.com):
   - Dashboard → **App Settings → Security & Keys**
   - Copy **Application ID** and **JavaScript Key**
3. Paste those values into `js/config.js`.
4. In Back4App, open **Database → Browser**:
   - Create a class named `Task` if it does not exist yet (the app can also create it on first save)
   - Add columns if you want them visible in the dashboard: `title` (String), `notes` (String), `day` (String), `done` (Boolean), `user` (Pointer → `_User`)
   - Open **Security** / Class Level Permissions for `Task`:
     - Turn **off** public read and public write
     - Allow **authenticated** users to create
     - Keep object ACLs so only the owner can read, update, and delete
5. Open the app with a local static server:

   ```bash
   python3 -m http.server 5173
   ```

   Then visit `http://localhost:5173`.

## Project structure

- `SPEC.md` — short plan written before coding
- `index.html` — app shell
- `css/style.css` — layout and styles
- `js/app.js` — login screen, week board, and CRUD
- `js/config.js` — Back4App Application ID and JavaScript Key
