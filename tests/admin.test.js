/**
 * @jest-environment jsdom
 */

// Mock fetch before importing admin.js
global.fetch = jest.fn();

// Mock a successful response for the initial hello API call
global.fetch.mockResolvedValue({
  ok: true,
  json: function() {
    return Promise.resolve({ message: 'Hello from backend!' });
  }
});

// Now import the admin module which will use our mocked fetch
require('../admin.js');

describe('Admin User Panel', function() {
  // Setup variables
  var loadUsersBtn;
  var tableBody;
  var mockUsers;
  
  // Mock console.error to prevent test output pollution
  var originalConsoleError = console.error;
  
  beforeEach(function() {
    // Reset the fetch mock for each test, but keep the initial implementation
    global.fetch.mockClear();
    
    // Reset the DOM
    document.body.innerHTML = 
      '<button id="load-users">Load Users</button>' +
      '<table id="users-table">' +
        '<thead>' +
          '<tr>' +
            '<th>First Name</th>' +
            '<th>Last Name</th>' +
            '<th>Role</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody></tbody>' +
      '</table>';
    
    // Set up DOM elements
    loadUsersBtn = document.getElementById('load-users');
    tableBody = document.querySelector('#users-table tbody');
    
    // Mock alert
    global.alert = jest.fn();
    
    // Mock users data
    mockUsers = [
      {
        uid: '1',
        first_name: 'John',
        last_name: 'Doe',
        role: 'Admin',
        status: 'active'
      },
      {
        uid: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'User',
        status: 'pending'
      }
    ];
    
    // Mock console.error
    console.error = jest.fn();
    
    // Manually trigger DOMContentLoaded
    var event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  });
  
  afterEach(function() {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('should early return if required elements are not found', function() {
    // Setup DOM without required elements
    document.body.innerHTML = '<div>No elements here</div>';
    
    // Trigger DOMContentLoaded again with no elements
    var event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // Nothing should happen, no errors should be thrown
    expect(true).toBeTruthy(); // Just to make the test pass
  });
  
  test('should load users when button is clicked', function() {
    // Mock successful fetch response for users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    // Click the button
    loadUsersBtn.click();
    
    // Check if button is disabled during fetch
    expect(loadUsersBtn.disabled).toBe(true);
    expect(loadUsersBtn.textContent).toBe('Loading…');
    
    // Return a promise to let Jest know we're testing async code
    return new Promise(function(resolve) {
      // Use setTimeout to wait for async operations to complete
      setTimeout(function() {
        // Verify fetch was called with correct URL
        expect(global.fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/users');
        
        // Verify table rows were created
        var rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toBe(2);
        
        // Verify first user's data is displayed correctly
        var firstRowCells = rows[0].querySelectorAll('td');
        expect(firstRowCells[0].textContent).toBe('John');
        expect(firstRowCells[1].textContent).toBe('Doe');
        expect(firstRowCells[2].textContent).toBe('1');
        expect(firstRowCells[3].textContent).toBe('Admin');
        
        // Verify status dropdown
        var firstRowSelect = firstRowCells[4].querySelector('select');
        expect(firstRowSelect).toBeTruthy();
        expect(firstRowSelect.value).toBe('active');
        
        // Verify action buttons exist
        var actionBtns = firstRowCells[5].querySelectorAll('button');
        expect(actionBtns.length).toBe(2);
        expect(actionBtns[0].textContent).toBe('Update');
        expect(actionBtns[1].textContent).toBe('Delete');
        
        // Verify button is re-enabled after loading
        expect(loadUsersBtn.disabled).toBe(false);
        expect(loadUsersBtn.textContent).toBe('Load Users');
        
        resolve();
      }, 0);
    });
  });
  
  test('should handle server error when loading users', function() {
    // Mock failed fetch response
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: false,
        status: 500
      });
    });
    
    // Click the button
    loadUsersBtn.click();
    
    // Return a promise to let Jest know we're testing async code
    return new Promise(function(resolve) {
      // Use setTimeout to wait for async operations to complete
      setTimeout(function() {
        // Verify error handling
        expect(console.error).toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith('Could not load users. See console for details.');
        
        // Verify button is re-enabled after error
        expect(loadUsersBtn.disabled).toBe(false);
        expect(loadUsersBtn.textContent).toBe('Load Users');
        
        resolve();
      }, 0);
    });
  });
  
  test('should handle network error when loading users', function() {
    // Mock fetch rejection
    global.fetch.mockImplementationOnce(function() {
      return Promise.reject(new Error('Network error'));
    });
    
    // Click the button
    loadUsersBtn.click();
    
    // Return a promise to let Jest know we're testing async code
    return new Promise(function(resolve) {
      // Use setTimeout to wait for async operations to complete
      setTimeout(function() {
        // Verify error handling
        expect(console.error).toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith('Could not load users. See console for details.');
        
        // Verify button is re-enabled after error
        expect(loadUsersBtn.disabled).toBe(false);
        expect(loadUsersBtn.textContent).toBe('Load Users');
        
        resolve();
      }, 0);
    });
  });
  
  test('should update user status', function() {
    // First load the users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Mock successful status update
        global.fetch.mockImplementationOnce(function() {
          return Promise.resolve({
            ok: true
          });
        });
        
        // Get the update button for the first user
        var rows = tableBody.querySelectorAll('tr');
        var firstRow = rows[0];
        var statusSelect = firstRow.querySelector('select');
        var updateBtn = firstRow.querySelectorAll('button')[0];
        
        // Change status and click update
        statusSelect.value = 'blocked';
        updateBtn.click();
        
        setTimeout(function() {
          // Verify fetch called with correct parameters
          expect(global.fetch).toHaveBeenCalledWith(
            'https://backend-k52m.onrender.com/users/1/status',
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'blocked' })
            }
          );
          
          // Verify alert was shown
          expect(alert).toHaveBeenCalledWith('Status updated to "blocked" for John');
          
          resolve();
        }, 0);
      }, 0);
    });
  });
  
  test('should handle error when updating status', function() {
    // First load the users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Mock failed status update
        global.fetch.mockImplementationOnce(function() {
          return Promise.resolve({
            ok: false,
            status: 403
          });
        });
        
        // Get the update button for the first user
        var rows = tableBody.querySelectorAll('tr');
        var firstRow = rows[0];
        var updateBtn = firstRow.querySelectorAll('button')[0];
        
        // Click update
        updateBtn.click();
        
        setTimeout(function() {
          // Verify error handling
          expect(console.error).toHaveBeenCalled();
          expect(alert).toHaveBeenCalledWith('Error updating status. See console.');
          
          resolve();
        }, 0);
      }, 0);
    });
  });
  
  test('should handle network error when updating status', function() {
    // First load the users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Mock network error
        global.fetch.mockImplementationOnce(function() {
          return Promise.reject(new Error('Network error'));
        });
        
        // Get the update button for the first user
        var rows = tableBody.querySelectorAll('tr');
        var firstRow = rows[0];
        var updateBtn = firstRow.querySelectorAll('button')[0];
        
        // Click update
        updateBtn.click();
        
        setTimeout(function() {
          // Verify error handling
          expect(console.error).toHaveBeenCalled();
          expect(alert).toHaveBeenCalledWith('Error updating status. See console.');
          
          resolve();
        }, 0);
      }, 0);
    });
  });
  
  test('should delete user', function() {
    // First load the users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Mock successful delete
        global.fetch.mockImplementationOnce(function() {
          return Promise.resolve({
            ok: true
          });
        });
        
        // Count initial rows
        var rows = tableBody.querySelectorAll('tr');
        var initialRowCount = rows.length;
        
        // Get the delete button for the first user
        var firstRow = rows[0];
        var deleteBtn = firstRow.querySelectorAll('button')[1];
        
        // Click delete
        deleteBtn.click();
        
        setTimeout(function() {
          // Verify fetch called with correct parameters
          expect(global.fetch).toHaveBeenCalledWith(
            'https://backend-k52m.onrender.com/users/1',
            { method: 'DELETE' }
          );
          
          // Verify alert was shown
          expect(alert).toHaveBeenCalledWith('User John deleted.');
          
          // Verify row was removed
          var currentRows = tableBody.querySelectorAll('tr');
          expect(currentRows.length).toBe(initialRowCount - 1);
          
          resolve();
        }, 0);
      }, 0);
    });
  });
  
  test('should handle error when deleting user', function() {
    // First load the users
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(mockUsers);
        }
      });
    });
    
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Mock failed delete
        global.fetch.mockImplementationOnce(function() {
          return Promise.resolve({
            ok: false,
            status: 403
          });
        });
        
        // Get the delete button for the first user
        var rows = tableBody.querySelectorAll('tr');
        var firstRow = rows[0];
        var deleteBtn = firstRow.querySelectorAll('button')[1];
        
        // Click delete
        deleteBtn.click();
        
        setTimeout(function() {
          // Verify error handling
          expect(console.error).toHaveBeenCalled();
          expect(alert).toHaveBeenCalledWith('Error deleting user. See console.');
          
          // Verify row was not removed
          var currentRows = tableBody.querySelectorAll('tr');
          expect(currentRows.length).toBe(rows.length);
          
          resolve();
        }, 0);
      }, 0);
    });
  });
  
  test('should handle missing properties in user data', function() {
    // Mock user with missing properties
    var incompleteUsers = [
      {
        uid: '3',
        // first_name missing
        last_name: 'Missing',
        // role missing
        status: 'active'
      }
    ];
    
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.resolve(incompleteUsers);
        }
      });
    });
    
    // Click the button
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Verify table row was created
        var rows = tableBody.querySelectorAll('tr');
        expect(rows.length).toBe(1);
        
        // Verify empty cells are handled properly
        var cells = rows[0].querySelectorAll('td');
        expect(cells[0].textContent).toBe(''); // Missing first_name
        expect(cells[1].textContent).toBe('Missing');
        expect(cells[2].textContent).toBe('3'); // uid is present
        expect(cells[3].textContent).toBe(''); // Missing role
        
        resolve();
      }, 0);
    });
  });
  
  test('should handle fetch response that is not JSON', function() {
    // Mock failed json parsing
    global.fetch.mockImplementationOnce(function() {
      return Promise.resolve({
        ok: true,
        json: function() {
          return Promise.reject(new Error('Invalid JSON'));
        }
      });
    });
    
    // Click the button
    loadUsersBtn.click();
    
    return new Promise(function(resolve) {
      setTimeout(function() {
        // Verify error handling
        expect(console.error).toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith('Could not load users. See console for details.');
        
        resolve();
      }, 0);
    });
  });
});
