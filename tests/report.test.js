// reports.test.js
import { jest } from '@jest/globals';
import { 
  loadFacilities, 
  handleReportSubmit, 
  fetchNotifications, 
  loadUserReports 
} from '../report.js';

describe('Reports Module', () => {
  // Store original implementations to restore them after tests
  let originalFetch;
  let originalConsoleLog;
  let originalConsoleError;
  let originalAlert;
  
  // Mock elements
  let mockReportForm;
  let mockReportsTableBody;
  let mockFacilitySelect;
  let mockFormMsg;
  let mockNotificationBadge;
  let mockNotificationList;

  // Mock data
  const mockReports = [
    { 
      id: '1', 
      title: 'Report 1', 
      description: 'First report', 
      facility_name: 'Facility A', 
      user_uid: 'user123', 
      status: 'pending',
      feedback: ''
    },
    { 
      id: '2', 
      title: 'Report 2', 
      description: 'Second report', 
      facility_name: null, 
      user_uid: 'user456', 
      status: 'in_progress',
      feedback: 'Working on it'
    }
  ];

  const mockFacilities = [
    { id: '1', facility_name: 'Facility A' },
    { id: '2', facility_name: 'Facility B' }
  ];

  const mockNotifications = {
    unreadCount: 3,
    notifications: [
      { id: 1, message: 'Your report was approved', read: false },
      { id: 2, message: 'New update available', read: false },
      { id: 3, message: 'Old notification', read: true }
    ]
  };

  // Setup function to create DOM elements
  function setupDom() {
    // Clear document body
    document.body.innerHTML = '';
    
    // Create mock DOM structure
    mockReportForm = document.createElement('form');
    mockReportForm.id = 'reportForm';
    
    const titleInput = document.createElement('input');
    titleInput.id = 'title';
    titleInput.type = 'text';
    mockReportForm.appendChild(titleInput);
    
    const descInput = document.createElement('textarea');
    descInput.id = 'description';
    mockReportForm.appendChild(descInput);
    
    mockFacilitySelect = document.createElement('select');
    mockFacilitySelect.id = 'facilitySelect';
    mockReportForm.appendChild(mockFacilitySelect);
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit';
    mockReportForm.appendChild(submitBtn);
    
    mockFormMsg = document.createElement('div');
    mockFormMsg.id = 'formMsg';
    
    mockReportsTableBody = document.createElement('tbody');
    mockReportsTableBody.id = 'reportsTableBody';
    
    const table = document.createElement('table');
    table.appendChild(mockReportsTableBody);
    
    mockNotificationBadge = document.createElement('span');
    mockNotificationBadge.id = 'notificationBadge';
    
    mockNotificationList = document.createElement('ul');
    mockNotificationList.id = 'notificationList';
    
    document.body.appendChild(mockReportForm);
    document.body.appendChild(mockFormMsg);
    document.body.appendChild(table);
    document.body.appendChild(mockNotificationBadge);
    document.body.appendChild(mockNotificationList);
  }

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Store original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    // Store original alert
    originalAlert = global.alert;
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock alert
    global.alert = jest.fn();
    
    // Setup DOM elements
    setupDom();
    
    // Mock fetch
    global.fetch = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    global.alert = originalAlert;
    
    // Clean up event listeners by removing elements
    document.body.innerHTML = '';
    
    // Clean up DOM events
    jest.restoreAllMocks();
  });

  // Test for loading facilities
  test('loadFacilities should fetch and populate the facility dropdown', async () => {
    // Setup fetch mock to return facilities
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFacilities)
    });
    
    // Call the function
    await loadFacilities(mockFacilitySelect);
    
    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/facilities');
    
    // Verify options were added to the select
    expect(mockFacilitySelect.children.length).toBe(2);
    expect(mockFacilitySelect.children[0].value).toBe('1');
    expect(mockFacilitySelect.children[0].textContent).toBe('Facility A');
    expect(mockFacilitySelect.children[1].value).toBe('2');
    expect(mockFacilitySelect.children[1].textContent).toBe('Facility B');
  });
  
  // Test for facility fetch error
  test('loadFacilities should handle fetch errors gracefully', async () => {
    // Setup fetch mock to throw an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Expect the function to reject with an error
    await expect(loadFacilities(mockFacilitySelect)).rejects.toThrow();
  });

  // Test for handleReportSubmit - success case
  test('handleReportSubmit should submit report data successfully', async () => {
    // Fill form data
    document.getElementById('title').value = 'Test Report';
    document.getElementById('description').value = 'Test Description';
    
    // Add an option to facility select
    const option = document.createElement('option');
    option.value = '1';
    option.textContent = 'Facility A';
    mockFacilitySelect.appendChild(option);
    mockFacilitySelect.value = '1';
    
    // Setup fetch mock for successful submission
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' })
    });
    
    // Create a submit event
    const submitEvent = new Event('submit');
    submitEvent.preventDefault = jest.fn();
    
    // Mock user_uid
    const user_uid = 'test-user-123';
    
    // Call the function
    const result = await handleReportSubmit(submitEvent, user_uid, mockFormMsg, mockReportForm, mockFacilitySelect);
    
    // Verify preventDefault was called
    expect(submitEvent.preventDefault).toHaveBeenCalled();
    
    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend-k52m.onrender.com/reports',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_uid: 'test-user-123',
          title: 'Test Report',
          description: 'Test Description',
          facility_id: '1',
          status: 'pending'
        })
      }
    );
    
    // Verify success message
    expect(mockFormMsg.textContent).toBe('Report submitted!');
    expect(mockFormMsg.style.color).toBe('green');
    
    // Verify form was reset
    expect(document.getElementById('title').value).toBe('');
    expect(document.getElementById('description').value).toBe('');
    
    // Verify result
    expect(result).toBe(true);
  });
  
  // Test for handleReportSubmit - error case
  test('handleReportSubmit should handle submission errors', async () => {
    // Fill form data
    document.getElementById('title').value = 'Test Report';
    document.getElementById('description').value = 'Test Description';
    
    // Setup fetch mock for failed submission
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid data' })
    });
    
    // Create a submit event
    const submitEvent = new Event('submit');
    submitEvent.preventDefault = jest.fn();
    
    // Mock user_uid
    const user_uid = 'test-user-123';
    
    // Call the function
    const result = await handleReportSubmit(submitEvent, user_uid, mockFormMsg, mockReportForm, mockFacilitySelect);
    
    // Verify error message
    expect(mockFormMsg.textContent).toBe('Failed to submit report: Invalid data');
    expect(mockFormMsg.style.color).toBe('red');
    
    // Verify form was not reset (values still present)
    expect(document.getElementById('title').value).toBe('Test Report');
    expect(document.getElementById('description').value).toBe('Test Description');
    
    // Verify result
    expect(result).toBe(false);
  });
  
  // Test for loadUserReports function - success case
  test('loadUserReports should fetch and display reports successfully', async () => {
    // Setup fetch mock to return reports
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReports)
    });

    // Mock user_uid
    const user_uid = 'test-user-123';

    // Call the function we're testing
    const reports = await loadUserReports(user_uid, mockReportsTableBody);
    
    // Verify fetch was called with correct URL including user_uid
    expect(global.fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/reports?user_uid=test-user-123');
    
    // Verify reports were added to the table
    const rows = mockReportsTableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2);
    
    // Verify first report data
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('Report 1');
    expect(firstRowCells[1].textContent).toBe('pending');
    expect(firstRowCells[2].textContent).toBe('First report');
    expect(firstRowCells[3].textContent).toBe('Facility A');
    expect(firstRowCells[4].textContent).toBe('');
    
    // Verify second report data (with null facility_name)
    const secondRowCells = rows[1].querySelectorAll('td');
    expect(secondRowCells[0].textContent).toBe('Report 2');
    expect(secondRowCells[1].textContent).toBe('in_progress');
    expect(secondRowCells[2].textContent).toBe('Second report');
    expect(secondRowCells[3].textContent).toBe('N/A'); // null facility_name should show as 'N/A'
    expect(secondRowCells[4].textContent).toBe('Working on it');
    
    // Verify returned reports
    expect(reports).toEqual(mockReports);
  });
  
  // Test for loadUserReports function - error case
  test('loadUserReports should handle error when fetch fails', async () => {
    // Setup fetch mock to throw an error
    const errorMessage = 'Network error';
    global.fetch.mockRejectedValueOnce(new Error(errorMessage));
    
    // Mock user_uid
    const user_uid = 'test-user-123';
    
    // Call the function and expect it to reject
    await expect(loadUserReports(user_uid, mockReportsTableBody)).rejects.toThrow('Network error');
  });
  
  // Test for fetchNotifications function
  test('fetchNotifications should fetch and display notifications', async () => {
    // Setup fetch mock
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotifications)
    });
    
    // Mock user_uid
    const user_uid = 'test-user-123';
    
    // Call the function
    const result = await fetchNotifications(user_uid);
    
    // Verify fetch was called with user_uid
    expect(global.fetch).toHaveBeenCalledWith('/notifications?user_uid=test-user-123');
    
    // Verify badge was updated
    expect(document.getElementById('notificationBadge').textContent).toBe('3');
    
    // Verify notifications were rendered
    const items = document.getElementById('notificationList').querySelectorAll('li');
    expect(items.length).toBe(3);
    
    // Check unread class
    expect(items[0].classList.contains('unread')).toBe(true);
    expect(items[1].classList.contains('unread')).toBe(true);
    expect(items[2].classList.contains('unread')).toBe(false);
    
    // Check content
    expect(items[0].textContent).toBe('Your report was approved');
    expect(items[1].textContent).toBe('New update available');
    expect(items[2].textContent).toBe('Old notification');
    
    // Check returned data
    expect(result).toEqual(mockNotifications);
  });
  
  // Test for fetchNotifications - error case
  test('fetchNotifications should handle fetch errors', async () => {
    // Setup fetch mock to throw error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Mock user_uid
    const user_uid = 'test-user-123';
    
    // Call function and expect it to throw
    await expect(fetchNotifications(user_uid)).rejects.toThrow('Network error');
  });
  
  // Integration test - Test DOM content loaded event with all functions working together
  test('integration test - all functions should work together', async () => {
    // Create a fake DOMContentLoaded event handler to mimic the one in the file
    const domContentLoaded = () => {
      // Mock localStorage.getItem for user_uid
      const user_uid = 'test-user-123';
      
      // Load facilities
      loadFacilities(mockFacilitySelect)
        .catch(error => console.error('Failed to load facilities:', error));
        
      // Add submit event handler
      mockReportForm.addEventListener('submit', async (e) => {
        const result = await handleReportSubmit(e, user_uid, mockFormMsg, mockReportForm, mockFacilitySelect);
        if (result) {
          loadUserReports(user_uid, mockReportsTableBody);
        }
      });
      
      // Load user reports
      loadUserReports(user_uid, mockReportsTableBody)
        .catch(error => console.error('Failed to load reports:', error));
    };
    
    // Setup fetch mocks for all calls
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFacilities)
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReports)
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' })
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReports)
    });
    
    // Call the handler
    domContentLoaded();
    
    // Wait for all promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify facilities were loaded
    expect(mockFacilitySelect.children.length).toBe(2);
    
    // Verify reports were loaded
    expect(mockReportsTableBody.querySelectorAll('tr').length).toBe(2);
    
    // Test the form submission
    document.getElementById('title').value = 'Integration Test';
    document.getElementById('description').value = 'Testing the whole flow';
    mockFacilitySelect.value = '1';
    
    // Submit the form
    const submitEvent = new Event('submit');
    submitEvent.preventDefault = jest.fn();
    mockReportForm.dispatchEvent(submitEvent);
    
    // Wait for all promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verify success message
    expect(mockFormMsg.textContent).toBe('Report submitted!');
    expect(mockFormMsg.style.color).toBe('green');
    
    // Verify form was reset
    expect(document.getElementById('title').value).toBe('');
    expect(document.getElementById('description').value).toBe('');
  });
});
