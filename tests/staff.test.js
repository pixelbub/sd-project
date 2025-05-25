/**
 * @jest-environment jsdom
 */

describe('staff.js', () => {
  let loadButton, tableBody, notifBtn, notifPopup, notifList, notifCount;
  
  beforeEach(() => {
    // Mock fetch globally before loading the script
    global.fetch = jest.fn();
    
    // Set up minimal DOM structure with notification elements
    document.body.innerHTML = `
      <button id="load-users">Load Users</button>
      <table id="users-table">
        <tbody></tbody>
      </table>
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <span id="notifCount"></span>
        <footer></footer>
      </div>
    `;
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('user123');
    
    // We need to mock fetch for notifications before loading the script
    // This prevents the initial fetchUnreadNotifications call from failing
    global.fetch.mockImplementation((url) => {
      if (url.includes('notifications/unread')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Load script *after* setting up DOM and mocking fetch
    jest.isolateModules(() => {
      require('../staff'); // adjust if necessary
    });
    
    // Fire DOMContentLoaded manually
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Get DOM elements
    loadButton = document.getElementById('load-users');
    tableBody = document.querySelector('#users-table tbody');
    notifBtn = document.getElementById('notifBtn');
    notifPopup = document.getElementById('notifPopup');
    notifList = document.getElementById('notifList');
    notifCount = document.getElementById('notifCount');
  });
  
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    global.fetch.mockClear();
  });
  
  test('loads and displays only residents on button click', async () => {
    const mockUsers = [
      { first_name: 'Alice', last_name: 'Smith', status: 'active', role: 'resident' },
      { first_name: 'Bob', last_name: 'Jones', status: 'inactive', role: 'admin' }, // Should be filtered out
      { first_name: 'Charlie', last_name: 'Davis', status: 'active', role: 'resident' }
    ];
    
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url === 'https://backend-k52m.onrender.com/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Initial button state
    expect(loadButton.disabled).toBe(false);
    expect(loadButton.textContent).toBe('Load Users');
    
    // Click load button
    loadButton.click();
    
    // Button should be disabled and show loading
    expect(loadButton.disabled).toBe(true);
    expect(loadButton.textContent).toBe('Loading…');
    
    // Wait for async operations
    await Promise.resolve(); 
    await Promise.resolve();
    
    // Check final button state
    expect(loadButton.disabled).toBe(false);
    expect(loadButton.textContent).toBe('Load Users');
    
    // Verify only residents are displayed
    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2); // Only the two residents
    
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[0].textContent).toContain('Smith');
    expect(rows[0].textContent).toContain('active');
    
    expect(rows[1].textContent).toContain('Charlie');
    expect(rows[1].textContent).toContain('Davis');
    expect(rows[1].textContent).toContain('active');
    
    // Verify Bob (admin) is not displayed
    expect(tableBody.textContent).not.toContain('Bob');
    expect(tableBody.textContent).not.toContain('Jones');
  });
  
  test('handles fetch error gracefully', async () => {
    // Mock a failed fetch response
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url === 'https://backend-k52m.onrender.com/users') {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      }
      // For notifications endpoint, return empty array
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Spy on console.error and alert
    console.error = jest.fn();
    window.alert = jest.fn();
    
    // Simulate button click
    loadButton.click();
    
    // Wait for async operations
    await Promise.resolve();
    await Promise.resolve();
    
    // Ensure error handler was triggered
    expect(console.error).toHaveBeenCalledWith('Failed to load users:', expect.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Could not load users. See console for details.');
    
    // Check button state is restored
    expect(loadButton.disabled).toBe(false);
    expect(loadButton.textContent).toBe('Load Users');
  });
  
  test('handles empty user list gracefully', async () => {
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url === 'https://backend-k52m.onrender.com/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      // For other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    loadButton.click();
    await Promise.resolve();
    await Promise.resolve();
    
    // Expect no rows in the table
    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(0);
    
    // Check button state is restored
    expect(loadButton.disabled).toBe(false);
    expect(loadButton.textContent).toBe('Load Users');
  });
  
  test('handles missing user properties gracefully', async () => {
    const mockUsers = [
      { 
        first_name: 'Charlie', 
        last_name: null,      // null property should trigger the ?? branch
        status: 'active', 
        role: 'resident' 
      }
    ];
    
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url === 'https://backend-k52m.onrender.com/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        });
      }
      // For other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    loadButton.click();
    await Promise.resolve();
    await Promise.resolve();
    
    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Charlie');
    expect(rows[0].cells[1].textContent).toBe(''); // Empty string for last_name
    expect(rows[0].textContent).toContain('active');
  });
  
  // Tests for the notification system
  test('toggles notification popup when notification button is clicked', () => {
    // Initially hidden
    expect(notifPopup.style.display).toBe('none');
    
    // First click - show popup
    notifBtn.click();
    expect(notifPopup.style.display).toBe('block');
    
    // Second click - hide popup
    notifBtn.click();
    expect(notifPopup.style.display).toBe('none');
  });
  
  test('fetches and displays unread notifications on popup toggle', async () => {
    const mockNotifications = [
      { id: '1', message: 'New message', userId: 'user123' },
      { id: '2', message: 'System update', userId: 'user123' }
    ];
    
    // Reset and set up mock for notifications endpoint
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url === 'https://backend-k52m.onrender.com/notifications/unread/user123') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNotifications)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // First re-initialize the notification system by triggering the DOM load event
    // This ensures we have the most up-to-date notification state
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for any pending promises
    await Promise.resolve();
    
    // Then trigger the notification fetch by clicking the button
    notifBtn.click();
    
    // Wait for fetch promises to resolve
    await Promise.resolve();
    await Promise.resolve();
    
    // Verify notification count is displayed
    expect(notifCount.textContent).toBe('2');
    expect(notifCount.style.display).toBe('inline-block');
    
    // Verify notification items are displayed
    const items = notifList.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('New message');
    expect(items[1].textContent).toContain('System update');
    
    // Each item should have a 'Mark as read' button
    const buttons = notifList.querySelectorAll('li button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('Mark as read ');
  });
  
  test('displays message when no notifications exist', async () => {
    // Reset and set up mock for empty notifications
    global.fetch.mockReset();
    global.fetch.mockImplementation((url) => {
      if (url.includes('notifications/unread')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // First re-initialize by triggering DOM load
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for initial fetch
    await Promise.resolve();
    await Promise.resolve();
    
    // Verify notification count is hidden
    expect(notifCount.style.display).toBe('none');
    
    // Open popup to trigger fetch
    notifBtn.click();
    
    // Wait for any promises
    await Promise.resolve();
    
    // Verify "No new notifications" message
    expect(notifList.innerHTML).toContain('No new notifications');
  });
  
  test('handles notification fetch error gracefully', async () => {
    // Reset mock
    global.fetch.mockReset();
    console.error = jest.fn(); // Spy on console.error
    
    global.fetch.mockImplementation((url) => {
      if (url.includes('notifications/unread')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Re-initialize by triggering DOM load - this will trigger the error
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for any pending promises
    await Promise.resolve();
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error loading notifications:',
      expect.any(Error)
    );
  });
});
