/**
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';

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
    require('./admin.js'); // This will bind events to DOM

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

    // Act
    const loadUsersBtn = container.querySelector('#load-users');
    loadUsersBtn.click();

    // Wait for DOM updates
    await new Promise(setImmediate);

    const rows = container.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].cells[0].textContent).toBe('Alice');
    expect(rows[0].cells[1].textContent).toBe('Smith');
    expect(rows[1].cells[0].textContent).toBe('Bob');
    expect(rows[1].cells[2].textContent).toBe('driver');
  });

  it('shows alert and removes row on delete', async () => {
    // Arrange mock response for initial load
    const mockUsers = [
      { uid: '1', first_name: 'Test', last_name: 'User', role: 'driver', status: 'active' }
    ];
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockUsers }) // Load users
      .mockResolvedValueOnce({ ok: true }); // Delete user

    window.alert = jest.fn(); // Mock alert

    // Act
    const loadUsersBtn = container.querySelector('#load-users');
    loadUsersBtn.click();

    await new Promise(setImmediate);

    const deleteBtn = container.querySelector('button:nth-of-type(2)');
    deleteBtn.click();

    await new Promise(setImmediate);

    const rows = container.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(0);
    expect(window.alert).toHaveBeenCalledWith('User Test deleted.');
  });
});
