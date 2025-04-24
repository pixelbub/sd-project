/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

describe('Admin Panel Functionality', () => {
  let container;

  beforeEach(() => {
    // Load HTML into DOM
    const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
    document.documentElement.innerHTML = html.toString();

    // Append the script file manually
    jest.resetModules(); // Clear cache between tests
    require('../public/admin.js'); // Adjust path as needed

    container = document.body;
  });

  afterEach(() => {
    fetch.mockClear();
  });

  it('loads and displays users when Load Users button is clicked', async () => {
    // Arrange mock response
    const mockUsers = [
      {
        uid: '1',
        first_name: 'Alice',
        last_name: 'Smith',
        role: 'admin',
        status: 'active'
      },
      {
        uid: '2',
        first_name: 'Bob',
        last_name: 'Jones',
        role: 'driver',
        status: 'pending'
      }
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    const loadUsersBtn = container.querySelector('#load-users');
    loadUsersBtn.click();

    await new Promise(setImmediate);

    const rows = container.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].cells[0].textContent).toBe('Alice');
    expect(rows[1].cells[0].textContent).toBe('Bob');
  });
});
