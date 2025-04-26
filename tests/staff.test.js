/**
 * @jest-environment jsdom
 */

import '../src/staff'; // Import staff.js so the event listeners get attached.

describe('staff.js', () => {
  let loadButton;
  let tableBody;

  beforeEach(() => {
    // Set up a basic DOM structure
    document.body.innerHTML = `
      <button id="load-users">Load Users</button>
      <table id="users-table">
        <tbody></tbody>
      </table>
    `;

    loadButton = document.getElementById('load-users');
    tableBody = document.querySelector('#users-table tbody');

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads and displays users with role "resident"', async () => {
    const mockUsers = [
      { first_name: 'Alice', last_name: 'Smith', role: 'resident', status: 'active' },
      { first_name: 'Bob', last_name: 'Jones', role: 'admin', status: 'active' },
      { first_name: 'Charlie', last_name: 'Brown', role: 'resident', status: 'inactive' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    // Simulate button click
    loadButton.click();

    // Wait for async operations to complete
    await new Promise(process.nextTick);

    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2); // Only 'resident' users

    expect(rows[0].textContent).toContain('Alice');
    expect(rows[0].textContent).toContain('Smith');
    expect(rows[0].textContent).toContain('active');

    expect(rows[1].textContent).toContain('Charlie');
    expect(rows[1].textContent).toContain('Brown');
    expect(rows[1].textContent).toContain('inactive');
  });

  it('displays alert and logs error when fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockRejectedValueOnce(new Error('Network error'));

    loadButton.click();
    await new Promise(process.nextTick);

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Could not load users. See console for details.');

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('displays alert and logs error when server responds with error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    loadButton.click();
    await new Promise(process.nextTick);

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Could not load users. See console for details.');

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
