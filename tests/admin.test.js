// tests/admin.test.js

import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

// Import the real admin panel script (it will attach event listeners)
import '../src/admin';

describe('Admin panel - Load Users', () => {
  beforeEach(() => {
    // Set up minimal DOM elements that admin.js expects
    document.body.innerHTML = `
      <button id="load-users">Load Users</button>
      <table id="users-table">
        <tbody></tbody>
      </table>
    `;

    // Mock fetch globally
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { uid: '1', first_name: 'Alice', last_name: 'Smith', role: 'admin', status: 'active' },
        { uid: '2', first_name: 'Bob', last_name: 'Brown', role: 'user', status: 'pending' },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('loads users and populates the table on button click', async () => {
    const loadUsersBtn = document.getElementById('load-users');

    fireEvent.click(loadUsersBtn);

    // Wait for the DOM to update after async code
    await new Promise((resolve) => setTimeout(resolve, 0));

    const rows = document.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(2);

    expect(rows[0].textContent).toContain('Alice');
    expect(rows[1].textContent).toContain('Bob');

    // Check status dropdown for first user
    const select = rows[0].querySelector('select');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('active');
  });
});
