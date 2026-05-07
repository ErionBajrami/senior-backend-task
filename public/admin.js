
'use strict';

(function () {
  var TOKEN_KEY = 'quanos.adminToken';

  function $(sel) {
    return document.querySelector(sel);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function escapeHtml(s) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return map[c];
    });
  }

  async function api(method, path, body) {
    var init = { method: method, headers: {} };
    var token = getToken();
    if (token) init.headers.authorization = 'Bearer ' + token;
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    var res = await fetch(path, init);
    var data = null;
    try {
      data = await res.json();
    } catch (e) {

    }
    if (!res.ok) {
      var err = new Error((data && data.message) || 'HTTP ' + res.status);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  function showError(elId, msg) {
    var el = $('#' + elId);
    if (el) el.textContent = msg;
  }
  function clearError(elId) {
    var el = $('#' + elId);
    if (el) el.textContent = '';
  }
  function clearAllErrors() {
    ['login-error', 'form-error', 'list-error'].forEach(clearError);
  }

  function showLogin() {
    $('#login').hidden = false;
    $('#manage').hidden = true;
  }
  function showManage() {
    $('#login').hidden = true;
    $('#manage').hidden = false;
  }

  function fillForm(link) {
    var f = $('#link-form');
    f.elements.id.value = link.id || '';
    f.elements.title.value = link.title || '';
    f.elements.url.value = link.url || '';
    f.elements.category.value = link.category || '';
    f.elements.iconUrl.value = link.iconUrl || '';
    f.elements.displayOrder.value = link.displayOrder == null ? 0 : link.displayOrder;
    f.elements.description.value = link.description || '';
    f.elements.isActive.checked = link.isActive !== false;
    $('#save-btn').textContent = link.id ? 'Update' : 'Create';
    $('#form-title').textContent = link.id ? 'Edit link' : 'Add link';
    $('#active-field').style.display = link.id ? 'flex' : 'none';
  }

  function clearForm() {
    var f = $('#link-form');
    f.reset();
    f.elements.id.value = '';
    $('#save-btn').textContent = 'Create';
    $('#form-title').textContent = 'Add link';
    $('#active-field').style.display = 'none';
    clearError('form-error');
  }

  function rowHtml(link) {
    var data = encodeURIComponent(JSON.stringify(link));
    return (
      '<tr>' +
      '<td>' +
      escapeHtml(link.displayOrder) +
      '</td>' +
      '<td>' +
      escapeHtml(link.title) +
      '</td>' +
      '<td>' +
      escapeHtml(link.category || '—') +
      '</td>' +
      '<td><a href="' +
      escapeHtml(link.url) +
      '" target="_blank" rel="noopener">' +
      escapeHtml(link.url) +
      '</a></td>' +
      '<td>' +
      (link.isActive ? '✓' : '✗') +
      '</td>' +
      '<td>' +
      escapeHtml(link.clickCount) +
      '</td>' +
      '<td class="actions">' +
      '<button class="secondary edit" data-link="' +
      escapeHtml(data) +
      '">Edit</button>' +
      '<button class="danger delete" data-id="' +
      escapeHtml(link.id) +
      '" data-title="' +
      escapeHtml(link.title) +
      '">Delete</button>' +
      '</td>' +
      '</tr>'
    );
  }

  async function refreshTable() {
    clearError('list-error');
    try {
      var links = await api('GET', '/v1/admin/links');
      var tbody = $('#links-table tbody');
      if (!links || links.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No links yet — add one above.</td></tr>';
        return;
      }
      tbody.innerHTML = links.map(rowHtml).join('');
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        showLogin();
        showError('login-error', 'Session expired. Please sign in again.');
      } else {
        showError('list-error', err.message);
      }
    }
  }

  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors();
    var fd = new FormData(e.target);
    try {
      var result = await api('POST', '/v1/auth/login', {
        username: fd.get('username'),
        password: fd.get('password'),
      });
      setToken(result.token);
      e.target.reset();
      showManage();
      clearForm();
      await refreshTable();
    } catch (err) {
      showError('login-error', err.message || 'Login failed');
    }
  });

  $('#logout').addEventListener('click', function () {
    clearToken();
    clearForm();
    showLogin();
  });

  $('#link-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError('form-error');
    var fd = new FormData(e.target);
    var id = fd.get('id');
    var body = {
      title: fd.get('title'),
      url: fd.get('url'),
      description: fd.get('description') || null,
      iconUrl: fd.get('iconUrl') || null,
      category: fd.get('category') || null,
      displayOrder: Number(fd.get('displayOrder') || 0),
    };
    try {
      if (id) {
        body.isActive = fd.get('isActive') === 'on';
        await api('PUT', '/v1/admin/links/' + encodeURIComponent(id), body);
      } else {
        await api('POST', '/v1/admin/links', body);
      }
      clearForm();
      await refreshTable();
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        showLogin();
        showError('login-error', 'Session expired. Please sign in again.');
      } else {
        showError('form-error', err.message);
      }
    }
  });

  $('#reset-btn').addEventListener('click', clearForm);

  $('#links-table').addEventListener('click', async function (e) {
    var t = e.target;
    if (t.classList.contains('edit')) {
      var link = JSON.parse(decodeURIComponent(t.dataset.link));
      fillForm(link);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (t.classList.contains('delete')) {
      var id = t.dataset.id;
      var title = t.dataset.title;
      if (
        confirm(
          'Soft-delete "' +
            title +
            '"?\n\nIt will be hidden from the public landing page but kept in the admin list (you can re-activate it later).',
        )
      ) {
        try {
          await api('DELETE', '/v1/admin/links/' + encodeURIComponent(id));
          await refreshTable();
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      }
    }
  });

  if (getToken()) {
    showManage();
    clearForm();
    refreshTable();
  } else {
    showLogin();
  }
})();
