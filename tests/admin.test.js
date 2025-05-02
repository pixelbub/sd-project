// admin.test.js
// require('../admin'); 

// Mock fetch API
global.fetch = jest.fn();

// Setup DOM elements
document.body.innerHTML = `
  <div>
    <button id="load-users">Load Users</button>
    <button id="load-bookings">Load Pending Bookings</button>
    <input id="search-users" type="text" placeholder="Search users">
    <input id="search-bookings" type="text" placeholder="Search bookings">
    
    <table id="users-table">
      <thead>
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    
    <table id="bookings-table">
      <thead>
        <tr>
          <th>Facility</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
`;

// Mock alert
global.alert = jest.fn();

describe('Admin Panel', () => {
  // Set up before each test
  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    alert.mockClear();
    
    // Reset DOM
    document.querySelector('#users-table tbody').innerHTML = '';
    document.querySelector('#bookings-table tbody').innerHTML = '';
    
    // Mock event listeners
    document.addEventListener = jest.fn((event, callback) => {
      if (event === 'DOMContentLoaded') {
        callback();
      }
    });
    
    // Load admin.js
    require('../admin');
  });

  describe('User Management', () => {
    test('loads users successfully', async () => {
      // Mock users data
      const mockUsers = [
        { uid: '1', first_name: 'John', last_name: 'Doe', role: 'member', status: 'active' },
        { uid: '2', first_name: 'Jane', last_name: 'Smith', role: 'admin', status: 'pending' }
      ];
      
      // Mock fetch response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
      
      // Trigger load users
      const loadUsersBtn = document.getElementById('load-users');
      await loadUsersBtn.click();
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/users');
      
      // Check if table is populated
      const rows = document.querySelectorAll('#users-table tbody tr');
      expect(rows.length).toBe(2);
      
      // Verify first row contains correct data
      expect(rows[0].cells[0].textContent).toBe('John');
      expect(rows[0].cells[1].textContent).toBe('Doe');
      expect(rows[0].cells[2].textContent).toBe('member');
      
      // Verify dropdown has the right status selected
      const select = rows[0].cells[3].querySelector('select');
      expect(select.value).toBe('active');
    });
    
    test('handles user load error', async () => {
      // Mock fetch error
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      // Console error spy
      console.error = jest.fn();
      
      // Trigger load users
      const loadUsersBtn = document.getElementById('load-users');
      await loadUsersBtn.click();
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
      expect(alert).toHaveBeenCalledWith('Could not load users. See console for details.');
      
      // Button should be re-enabled
      expect(loadUsersBtn.disabled).toBe(false);
      expect(loadUsersBtn.textContent).toBe('Load Users');
    });
    
    test('updates user status', async () => {
      // First, load users
      const mockUsers = [
        { uid: '1', first_name: 'John', last_name: 'Doe', role: 'member', status: 'active' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
      
      const loadUsersBtn = document.getElementById('load-users');
      await loadUsersBtn.click();
      
      // Mock the update response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Status updated successfully' })
      });
      
      // Get the update button and click it
      const updateBtn = document.querySelector('#users-table tbody tr td:last-child button');
      
      // Change the status
      const select = document.querySelector('#users-table tbody tr select');
      select.value = 'blocked';
      
      await updateBtn.click();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/users/1/status',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked' })
        }
      );
      
      // Verify alert was shown
      expect(alert).toHaveBeenCalledWith('Status updated to "blocked" for John');
    });
    
    test('deletes user', async () => {
      // First, load users
      const mockUsers = [
        { uid: '1', first_name: 'John', last_name: 'Doe', role: 'member', status: 'active' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
      
      const loadUsersBtn = document.getElementById('load-users');
      await loadUsersBtn.click();
      
      // Mock the delete response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' })
      });
      
      // Get the delete button and click it
      const deleteBtn = document.querySelector('#users-table tbody tr td:last-child button:nth-child(2)');
      await deleteBtn.click();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/users/1',
        { method: 'DELETE' }
      );
      
      // Verify alert was shown
      expect(alert).toHaveBeenCalledWith('User John deleted.');
      
      // Check if row was removed
      const rows = document.querySelectorAll('#users-table tbody tr');
      expect(rows.length).toBe(0);
    });
  });

  describe('Booking Management', () => {
    test('loads pending bookings successfully', async () => {
      // Mock bookings data
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        },
        { 
          id: '2', 
          facilityId: 'Pool', 
          startTime: '2023-05-01T10:00:00Z', 
          endTime: '2023-05-01T12:00:00Z', 
          status: 'pending' 
        }
      ];
      
      // Mock fetch response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      // Trigger load bookings
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/bookings?status=pending');
      
      // Check if table is populated
      const rows = document.querySelectorAll('#bookings-table tbody tr');
      expect(rows.length).toBe(2);
      
      // Verify first row contains correct data
      expect(rows[0].cells[0].textContent).toBe('Gym');
      expect(rows[0].cells[3].textContent).toBe('pending');
      
      // Verify data attributes
      expect(rows[0].dataset.bookingId).toBe('1');
    });
    
    test('handles empty bookings', async () => {
      // Mock empty bookings
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });
      
      // Trigger load bookings
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Check if "no bookings" message is displayed
      const tbody = document.querySelector('#bookings-table tbody');
      expect(tbody.innerHTML).toContain('No pending bookings found');
    });
    
    test('approves a booking', async () => {
      // First, load bookings
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Mock the approve response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Booking approved successfully' })
      });
      
      // Get the approve button and click it
      const approveBtn = document.querySelector('#bookings-table tbody tr .approve-btn');
      await approveBtn.click();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/bookings/1/status',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' })
        }
      );
      
      // Verify alert was shown
      expect(alert).toHaveBeenCalledWith('Booking approved successfully');
      
      // Check if row was removed
      const rows = document.querySelectorAll('#bookings-table tbody tr');
      expect(rows.length).toBe(0);
    });
    
    test('blocks a booking', async () => {
      // First, load bookings
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Mock the block response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Booking blocked successfully' })
      });
      
      // Get the block button and click it
      const blockBtn = document.querySelector('#bookings-table tbody tr .block-btn');
      await blockBtn.click();
      
      // Verify fetch was called with correct params
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/bookings/1/status',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked' })
        }
      );
      
      // Verify alert was shown
      expect(alert).toHaveBeenCalledWith('Booking blocked successfully');
    });
  });
  
  describe('Search Functionality', () => {
    test('filters users by search term', async () => {
      // First, load users
      const mockUsers = [
        { uid: '1', first_name: 'John', last_name: 'Doe', role: 'member', status: 'active' },
        { uid: '2', first_name: 'Jane', last_name: 'Smith', role: 'admin', status: 'pending' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });
      
      const loadUsersBtn = document.getElementById('load-users');
      await loadUsersBtn.click();
      
      // Simulate search
      const searchInput = document.getElementById('search-users');
      searchInput.value = 'john';
      const inputEvent = new Event('input');
      searchInput.dispatchEvent(inputEvent);
      
      // Verify filtering
      const rows = document.querySelectorAll('#users-table tbody tr');
      expect(rows[0].style.display).toBe('');  // John row should be visible
      expect(rows[1].style.display).toBe('none'); // Jane row should be hidden
    });
    
    test('filters bookings by search term', async () => {
      // First, load bookings
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        },
        { 
          id: '2', 
          facilityId: 'Pool', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Simulate search
      const searchInput = document.getElementById('search-bookings');
      searchInput.value = 'pool';
      const inputEvent = new Event('input');
      searchInput.dispatchEvent(inputEvent);
      
      // Verify filtering
      const rows = document.querySelectorAll('#bookings-table tbody tr');
      expect(rows[0].style.display).toBe('none');  // Gym row should be hidden
      expect(rows[1].style.display).toBe('');      // Pool row should be visible
    });
  });
  
  describe('Helper Functions', () => {
    test('formats Firestore timestamp correctly', async () => {
      // We'll test by loading a booking and checking the formatted dates
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          // Test different timestamp formats
          startTime: { seconds: 1620000000 }, // Firestore timestamp object
          endTime: '2023-05-01T12:00:00Z',    // ISO string
          status: 'pending' 
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Get the formatted dates
      const row = document.querySelector('#bookings-table tbody tr');
      const startDate = row.cells[1].textContent;
      const endDate = row.cells[2].textContent;
      
      // Verify both formats were correctly processed
      expect(startDate).not.toBe('Invalid date');
      expect(startDate).not.toBe('Date error');
      expect(endDate).not.toBe('Invalid date');
      expect(endDate).not.toBe('Date error');
    });
    
    test('handles error in booking status update', async () => {
      // First, load bookings
      const mockBookings = [
        { 
          id: '1', 
          facilityId: 'Gym', 
          startTime: { seconds: 1620000000 }, 
          endTime: { seconds: 1620003600 }, 
          status: 'pending' 
        }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBookings)
      });
      
      const loadBookingsBtn = document.getElementById('load-bookings');
      await loadBookingsBtn.click();
      
      // Mock the error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      });
      
      // Console error spy
      console.error = jest.fn();
      
      // Get the approve button and click it
      const approveBtn = document.querySelector('#bookings-table tbody tr .approve-btn');
      await approveBtn.click();
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalled();
      expect(alert).toHaveBeenCalledWith('Error updating booking: Server error');
      
      // The row should still be there
      const rows = document.querySelectorAll('#bookings-table tbody tr');
      expect(rows.length).toBe(1);
    });
  });
});

// Test DOM event handlers
describe('Event Handlers', () => {
  test('button click handlers are properly attached', () => {
    // Get buttons
    const loadUsersBtn = document.getElementById('load-users');
    const loadBookingsBtn = document.getElementById('load-bookings');
    
    // Spy on click events
    const usersBtnSpy = jest.spyOn(loadUsersBtn, 'addEventListener');
    const bookingsBtnSpy = jest.spyOn(loadBookingsBtn, 'addEventListener');
    
    // Load admin.js again to see if handlers are attached
    require('../admin');
    
    // Verify that handlers were attached
    expect(usersBtnSpy).toHaveBeenCalled();
    expect(bookingsBtnSpy).toHaveBeenCalled();
  });
});