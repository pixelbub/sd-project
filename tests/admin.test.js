//admin.test.js
/**
 * @jest-environment jsdom
 */
//import '@testing-library/jest-dom';

require('@testing-library/jest-dom');
import { fireEvent } from '@testing-library/dom';

describe('Admin panel - Load Users', () => {
  beforeEach(() => {
    // Set up basic DOM structure
    document.body.innerHTML = `
      <button id="load-users">Load Users</button>
      <table id="users-table">
        <tbody></tbody>
      </table>
    `;

    require('../src/admin');

    // Mocking the fetch functionality globally
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { uid: '1', first_name: 'Alice', last_name: 'Smith', role: 'admin', status: 'active' },
        { uid: '2', first_name: 'Bob', last_name: 'Brown', role: 'user', status: 'pending' }
      ],
    });

    // Mock the button click handler to populate the table
    const loadUsersBtn = document.getElementById('load-users');
    loadUsersBtn.addEventListener('click', async () => {
      const response = await fetch();
      const users = await response.json();
      const tbody = document.querySelector('#users-table tbody');
      users.forEach((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.first_name} ${user.last_name}</td>
          <td>${user.role}</td>
          <td>
            <select>
              <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
            </select>
          </td>
        `;
        tbody.appendChild(row);
      });
    });
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('loads users and populates the table on button click', async () => {
    const loadUsersBtn = document.getElementById('load-users');
    fireEvent.click(loadUsersBtn);

    // Wait for the DOM to update (simulate async)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check the rows in the table
    const rows = document.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(2);  // Ensure that two rows are created
    expect(rows[0].textContent).toContain('Alice');  // Ensure Alice is present
    expect(rows[1].textContent).toContain('Bob');    // Ensure Bob is present

    // Check if a status dropdown exists and contains the correct value
    const select = rows[0].querySelector('select');
    expect(select).toBeInTheDocument();  // Ensure the select element exists
    expect(select.value).toBe('active'); // Ensure the selected value is "active"
  });
});
