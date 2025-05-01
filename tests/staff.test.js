/**
 * @jest-environment jsdom
 */

describe('staff.js', () => {
    let loadButton, tableBody;
  
    beforeEach(() => {
      // Set up minimal DOM structure
      document.body.innerHTML = `
        <button id="load-users">Load Users</button>
        <table id="users-table">
          <tbody></tbody>
        </table>
      `;
  
      // Load script *after* setting up DOM
      require('../staff'); // adjust if necessary
  
      // Fire DOMContentLoaded manually
      document.dispatchEvent(new Event('DOMContentLoaded'));
  
      loadButton = document.getElementById('load-users');
      tableBody = document.querySelector('#users-table tbody');
    });
  
    afterEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });
  
    test('loads and displays residents on button click', async () => {
      const mockUsers = [
        { first_name: 'Alice', last_name: 'Smith', status: 'active', role: 'resident' },
        { first_name: 'Bob', last_name: 'Jones', status: 'inactive', role: 'admin' },
      ];
  
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });
  
      loadButton.click();
      await Promise.resolve(); await Promise.resolve(); // flush async
  
      const rows = tableBody.querySelectorAll('tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('Alice');
      expect(rows[0].textContent).toContain('Smith');
      expect(rows[0].textContent).toContain('active');
    });
  
    test('handles fetch error gracefully', async () => {
        // Mock a failed fetch response
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: false,  // This simulates a server error (non-2xx status)
          status: 500 // Internal server error
        });
      
        // Spy on console.error and alert to check that they're called
        console.error = jest.fn();
        window.alert = jest.fn();
      
        // Get the DOM elements
        const loadButton = document.getElementById('load-users');
        const tableBody = document.querySelector('#users-table tbody');
      
        // Simulate button click
        loadButton.click();
      
        // Wait for the async operation to finish
        await Promise.resolve(); // Resolves all promises, ensuring async code has run
      
        // Ensure the error handler was triggered
        expect(console.error).toHaveBeenCalledWith('Failed to load users:', expect.any(Error));
        expect(window.alert).toHaveBeenCalledWith('Could not load users. See console for details.');
    });

    test('handles empty user list gracefully', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce([]), // Empty user list
        });
      
        const loadButton = document.getElementById('load-users');
        const tableBody = document.querySelector('#users-table tbody');
      
        loadButton.click();
        await Promise.resolve();
      
        // Expect no rows in the table
        const rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toBe(0);
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
      
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        });
      
        loadButton.click();
        await Promise.resolve(); await Promise.resolve(); // flush async
      
        const rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toBe(1);
        expect(rows[0].textContent).toContain('Charlie');
        expect(rows[0].textContent).toContain(''); // Empty string for last_name
        expect(rows[0].textContent).toContain('active');
    });
});
  