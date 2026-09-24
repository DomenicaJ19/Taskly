const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const appEl = document.getElementById("app");
const todayName = DAYS[(new Date().getDay() + 6) % 7];
const parseReady =
  typeof Parse !== "undefined" &&
  window.back4appConfig &&
  window.back4appConfig.appId &&
  window.back4appConfig.jsKey &&
  !String(window.back4appConfig.appId).includes("YOUR_");

let mode = "login";
let currentUser = null;
let tasks = [];
let editingTask = null;
let errorMessage = "";

if (parseReady) {
  Parse.initialize(window.back4appConfig.appId, window.back4appConfig.jsKey);
  Parse.serverURL = window.back4appConfig.serverURL;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayName(user) {
  return user.get("email") || user.get("username") || "Signed in";
}

function toTask(object) {
  return {
    id: object.id,
    title: object.get("title") || "",
    notes: object.get("notes") || "",
    day: object.get("day") || "Monday",
    done: Boolean(object.get("done")),
    createdAt: object.createdAt ? object.createdAt.getTime() : 0,
    object,
  };
}

function render() {
  if (!parseReady) {
    appEl.innerHTML = `
      <main class="auth-page">
        <section class="auth-card">
          <div class="brand"><span class="logo">T</span><h1>Taskly</h1></div>
          <p class="lede">Back4App is not configured yet. Open <code>js/config.js</code>, paste your Application ID and JavaScript Key, then refresh this page.</p>
        </section>
      </main>
    `;
    return;
  }

  if (!currentUser) {
    renderAuth();
    return;
  }

  renderBoard();
}

function renderAuth() {
  appEl.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <div class="brand"><span class="logo">T</span><h1>Taskly</h1></div>
        <p class="lede">Plan your week in one place. Sign in to add, edit, and complete tasks for each day.</p>
        <div class="tabs">
          <button type="button" data-mode="login" class="${mode === "login" ? "active" : ""}">Log in</button>
          <button type="button" data-mode="register" class="${mode === "register" ? "active" : ""}">Register</button>
        </div>
        <form id="auth-form">
          <label>Email
            <input name="email" type="email" required autocomplete="email" />
          </label>
          <label>Password
            <input name="password" type="password" required minlength="6" autocomplete="current-password" />
          </label>
          <button class="primary" type="submit">${mode === "login" ? "Log in" : "Create account"}</button>
          <p class="error">${escapeHtml(errorMessage)}</p>
        </form>
      </section>
    </main>
  `;

  appEl.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      errorMessage = "";
      render();
    });
  });

  appEl.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    errorMessage = "";
    try {
      if (mode === "login") {
        currentUser = await Parse.User.logIn(email, password);
      } else {
        const user = new Parse.User();
        user.set("username", email);
        user.set("email", email);
        user.set("password", password);
        currentUser = await user.signUp();
      }
      await loadTasks();
    } catch (error) {
      errorMessage = friendlyAuthError(error);
      render();
    }
  });
}

function renderBoard() {
  const grouped = Object.fromEntries(DAYS.map((day) => [day, []]));
  tasks.forEach((task) => {
    if (grouped[task.day]) grouped[task.day].push(task);
  });

  appEl.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="logo">T</span><h1>Taskly</h1></div>
        <div class="user-meta">
          <span>${escapeHtml(displayName(currentUser))}</span>
          <button class="ghost" id="logout">Log out</button>
        </div>
      </header>
      <section class="add-card">
        <form id="add-form" class="add-row">
          <input name="title" placeholder="Task title" required />
          <input name="notes" placeholder="Notes (optional)" />
          <select name="day">
            ${DAYS.map((day) => `<option ${day === todayName ? "selected" : ""}>${day}</option>`).join("")}
          </select>
          <button class="primary" type="submit">Add task</button>
        </form>
      </section>
      <section class="week">
        ${DAYS.map((day) => {
          const items = grouped[day];
          return `
            <article class="day ${day === todayName ? "today" : ""}">
              <h2>${day} <span class="count">${items.length}</span></h2>
              ${
                items.length
                  ? items.map(taskCard).join("")
                  : `<p class="empty">No tasks yet</p>`
              }
            </article>
          `;
        }).join("")}
      </section>
      ${editingTask ? editModal() : ""}
    </div>
  `;

  appEl.querySelector("#logout").addEventListener("click", async () => {
    await Parse.User.logOut();
    currentUser = null;
    tasks = [];
    editingTask = null;
    render();
  });

  appEl.querySelector("#add-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const Task = Parse.Object.extend("Task");
    const task = new Task();
    task.set("title", String(form.get("title")).trim());
    task.set("notes", String(form.get("notes") || "").trim());
    task.set("day", String(form.get("day")));
    task.set("done", false);
    task.set("user", currentUser);
    const acl = new Parse.ACL(currentUser);
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    task.setACL(acl);
    await task.save();
    event.target.reset();
    await loadTasks();
  });

  appEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const task = tasks.find((item) => item.id === button.dataset.id);
      if (!task) return;
      const action = button.dataset.action;
      if (action === "toggle") {
        task.object.set("done", !task.done);
        await task.object.save();
        await loadTasks();
      }
      if (action === "edit") {
        editingTask = { ...task };
        render();
      }
      if (action === "delete") {
        await task.object.destroy();
        await loadTasks();
      }
    });
  });

  const editForm = appEl.querySelector("#edit-form");
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      editingTask.object.set("title", String(form.get("title")).trim());
      editingTask.object.set("notes", String(form.get("notes") || "").trim());
      editingTask.object.set("day", String(form.get("day")));
      await editingTask.object.save();
      editingTask = null;
      await loadTasks();
    });
    appEl.querySelector("#cancel-edit").addEventListener("click", () => {
      editingTask = null;
      render();
    });
  }
}

function taskCard(task) {
  return `
    <div class="task ${task.done ? "done" : ""}">
      <h3>${escapeHtml(task.title)}</h3>
      ${task.notes ? `<p class="notes">${escapeHtml(task.notes)}</p>` : ""}
      <div class="task-actions">
        <button data-action="toggle" data-id="${task.id}">${task.done ? "Undo" : "Done"}</button>
        <button data-action="edit" data-id="${task.id}">Edit</button>
        <button class="danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </div>
  `;
}

function editModal() {
  return `
    <div class="modal-backdrop">
      <form id="edit-form" class="modal">
        <h2>Edit task</h2>
        <label>Title
          <input name="title" value="${escapeHtml(editingTask.title)}" required />
        </label>
        <label>Notes
          <textarea name="notes" rows="3">${escapeHtml(editingTask.notes || "")}</textarea>
        </label>
        <label>Day
          <select name="day">
            ${DAYS.map(
              (day) =>
                `<option ${day === editingTask.day ? "selected" : ""}>${day}</option>`
            ).join("")}
          </select>
        </label>
        <button class="primary" type="submit">Save</button>
        <button class="ghost" type="button" id="cancel-edit">Cancel</button>
      </form>
    </div>
  `;
}

function friendlyAuthError(error) {
  const code = error?.code;
  if (code === 202 || code === 203) return "That email already has an account.";
  if (code === 101) return "Email or password is incorrect.";
  if (code === 200 || code === 201) return "Enter an email and a password of at least 6 characters.";
  if (code === 125) return "Enter a valid email address.";
  return error.message || "Something went wrong. Try again.";
}

async function loadTasks() {
  const query = new Parse.Query("Task");
  query.equalTo("user", currentUser);
  query.ascending("createdAt");
  const results = await query.find();
  tasks = results.map(toTask);
  render();
}

async function start() {
  if (!parseReady) {
    render();
    return;
  }
  currentUser = Parse.User.current();
  if (currentUser) {
    await loadTasks();
  } else {
    render();
  }
}

start();
