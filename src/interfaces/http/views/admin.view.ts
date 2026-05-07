export function renderAdminPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quanos — Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/static/styles.css">
  <link rel="stylesheet" href="/static/admin.css">
</head>
<body>
  <nav class="topbar">
    <a href="/" class="back-link" title="Back to landing page">
      <span aria-hidden="true">←</span>
      <span>Back to links</span>
    </a>
  </nav>
  <header>
    <h1>Admin</h1>
    <p class="subtitle">Manage Developer Tool links.</p>
  </header>
  <main>
    <section id="login">
      <form id="login-form" novalidate>
        <h2>Sign in</h2>
        <label class="field">
          <span>Username</span>
          <input name="username" required autocomplete="username">
        </label>
        <label class="field">
          <span>Password</span>
          <input name="password" type="password" required autocomplete="current-password">
        </label>
        <div class="form-actions">
          <button type="submit">Sign in</button>
        </div>
        <div id="login-error" class="error" role="alert"></div>
      </form>
    </section>

    <section id="manage" hidden>
      <div class="toolbar">
        <h2 id="form-title">Add link</h2>
        <button id="logout" type="button" class="secondary">Sign out</button>
      </div>

      <form id="link-form">
        <input type="hidden" name="id">
        <div class="form-grid">
          <label class="field">
            <span>Title <em>required</em></span>
            <input name="title" required minlength="1" maxlength="200" placeholder="GitHub">
          </label>
          <label class="field">
            <span>URL <em>required</em></span>
            <input name="url" type="url" required maxlength="2048" placeholder="https://github.com">
          </label>
          <label class="field">
            <span>Category</span>
            <input name="category" maxlength="50" placeholder="Category">
          </label>
          <label class="field">
            <span>Icon URL</span>
            <input name="iconUrl" type="url" maxlength="2048" placeholder="https://cdn.simpleicons.org/github">
          </label>
          <label class="field">
            <span>Display order</span>
            <input name="displayOrder" type="number" min="0" max="1000000" value="0">
          </label>
          <label class="field full">
            <span>Description</span>
            <textarea name="description" maxlength="2000" rows="2" placeholder="Optional"></textarea>
          </label>
          <label class="field checkbox" id="active-field">
            <input name="isActive" type="checkbox" checked>
            <span>Active <em>uncheck to soft-delete</em></span>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" id="save-btn">Create</button>
          <button type="button" id="reset-btn" class="secondary">Clear form</button>
        </div>
        <div id="form-error" class="error" role="alert"></div>
      </form>

      <h2>All links</h2>
      <div id="list-error" class="error" role="alert"></div>
      <div class="table-wrap">
        <table id="links-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Category</th>
              <th>URL</th>
              <th>Active</th>
              <th>Clicks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
  </main>
  <footer>
    <p>Quanos admin</p>
  </footer>
  <script src="/static/admin.js"></script>
</body>
</html>`;
}
