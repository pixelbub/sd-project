// reports.test.js
import { jest } from '@jest/globals';
import { 
  setupReportsHandlers, 
  loadAllReports, 
  addEventListeners, 
  updateReport 
} from '../a_report.js';

describe('Reports Module', () => {
  // Store original implementations to restore them after tests
  let originalFetch;
  let originalConsoleLog;
  let originalConsoleError;
  let originalAlert;
  
  // Mock elements
  let mockLoadReportsBtn;
  let mockReportsTableBody;
  let mockDocumentBody;

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

  // Setup function to create DOM elements
  function setupDom() {
    // Clear document body
    document.body.innerHTML = '';
    
    // Create mock DOM structure
    mockLoadReportsBtn = document.createElement('button');
    mockLoadReportsBtn.id = 'load-reports';
    mockLoadReportsBtn.textContent = 'Load Reports';
    
    mockReportsTableBody = document.createElement('tbody');
    mockReportsTableBody.id = 'reportsTableBody';
    
    const table = document.createElement('table');
    table.appendChild(mockReportsTableBody);
    
    document.body.appendChild(mockLoadReportsBtn);
    document.body.appendChild(table);
    
    mockDocumentBody = document.body;
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

  // Test for the setupReportsHandlers function
  test('setupReportsHandlers should attach event listeners to DOM elements', () => {
    // Spy on addEventListener to verify it's called
    const addEventListenerSpy = jest.spyOn(mockLoadReportsBtn, 'addEventListener');
    
    // Call the function we're testing
    setupReportsHandlers();
    
    // Verify addEventListener was called
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  // Test for the edge case where DOM elements are not found
  test('setupReportsHandlers should not attach event listeners if DOM elements are missing', () => {
    // Clear the DOM
    document.body.innerHTML = '';
    
    // Spy on fetch to verify it's not called
    const fetchSpy = jest.spyOn(global, 'fetch');
    
    // Call the function we're testing
    setupReportsHandlers();
    
    // Create a button and click it to verify no event handler was attached
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.click();
    
    // Verify fetch was not called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // Test for loadAllReports function - success case
  test('loadAllReports should fetch and display reports successfully', async () => {
    // Setup fetch mock to return reports
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports)
    });

    // Call the function we're testing
    await loadAllReports(mockLoadReportsBtn, mockReportsTableBody);
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/admin/reports');
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalledWith('Fetch /admin/reports →', 200);
    expect(console.log).toHaveBeenCalledWith('Got reports:', mockReports);
    
    // Verify the button state during and after loading
    expect(mockLoadReportsBtn.disabled).toBe(false);
    expect(mockLoadReportsBtn.textContent).toBe('Load Reports');
    
    // Verify reports were added to the table
    const rows = mockReportsTableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2);
    
    // Verify first report data
    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('Report 1');
    expect(firstRowCells[1].textContent).toBe('First report');
    expect(firstRowCells[2].textContent).toBe('Facility A');
    
    // Verify second report data (with null facility_name)
    const secondRowCells = rows[1].querySelectorAll('td');
    expect(secondRowCells[0].textContent).toBe('Report 2');
    expect(secondRowCells[1].textContent).toBe('Second report');
    expect(secondRowCells[2].textContent).toBe('N/A'); // null facility_name should show as 'N/A'
    
    // Verify status select options
    const statusSelect = rows[0].querySelector('.statusSelect');
    expect(statusSelect).not.toBeNull();
    expect(statusSelect.dataset.id).toBe('1');
    expect(statusSelect.value).toBe('pending');
    
    // Verify feedback input
    const feedbackInput = rows[0].querySelector('.feedbackInput');
    expect(feedbackInput).not.toBeNull();
    expect(feedbackInput.value).toBe('');
  });
  
  // Test for loadAllReports function - error case
  test('loadAllReports should handle error when fetch fails', async () => {
    // Setup fetch mock to throw an error
    const errorMessage = 'Network error';
    global.fetch.mockRejectedValueOnce(new Error(errorMessage));
    
    // Call the function we're testing
    await loadAllReports(mockLoadReportsBtn, mockReportsTableBody);
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Verify error was displayed
    expect(mockReportsTableBody.innerHTML).toContain('Error loading reports: Network error');
    
    // Verify button is re-enabled
    expect(mockLoadReportsBtn.disabled).toBe(false);
    expect(mockLoadReportsBtn.textContent).toBe('Load Reports');
  });
  
  // Test for loadAllReports function - HTTP error
  test('loadAllReports should handle HTTP error response', async () => {
    // Setup fetch mock to return an error status
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    });
    
    // Call the function we're testing
    await loadAllReports(mockLoadReportsBtn, mockReportsTableBody);
    
    // Verify error was displayed
    expect(mockReportsTableBody.innerHTML).toContain('Error loading reports: 403 Forbidden');
    
    // Verify button is re-enabled
    expect(mockLoadReportsBtn.disabled).toBe(false);
    expect(mockLoadReportsBtn.textContent).toBe('Load Reports');
  });
  
  // Test for updateReport function
  test('updateReport should send PATCH request with correct data', async () => {
    // Setup fetch mock to return success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
    
    // Call the function we're testing
    await updateReport('123', { status: 'solved' });
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend-k52m.onrender.com/reports/123',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'solved' })
      }
    );
    
    // Verify alert was called
    expect(global.alert).toHaveBeenCalledWith('Update successful');
  });
  
  // Test for updateReport function - error case
  test('updateReport should handle error response', async () => {
    // Setup fetch mock to return an error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });
    
    // Call the function we're testing
    await updateReport('123', { status: 'solved' });
    
    // Verify alert was called with error message
    expect(global.alert).toHaveBeenCalledWith('Update failed: Unauthorized');
  });
  
  // Test for updateReport function - network error
  test('updateReport should handle network error', async () => {
    // Setup fetch mock to throw a network error
    const errorMessage = 'Network failure';
    global.fetch.mockRejectedValueOnce(new Error(errorMessage));
    
    // Call the function we're testing
    await updateReport('123', { status: 'solved' });
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Error updating report:', expect.any(Error));
    
    // Verify alert was called with error message
    expect(global.alert).toHaveBeenCalledWith(`Error updating report: ${errorMessage}`);
  });
  
  // Test for end-to-end integration
  test('should handle the full reports workflow', async () => {
    // Setup fetch mock for reports
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports)
    });
    
    // Setup fetch mock for update
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
    
    // Call setupReportsHandlers to attach event listeners
    setupReportsHandlers();
    
    // Trigger the click event on the load button
    mockLoadReportsBtn.click();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify reports were loaded
    expect(mockReportsTableBody.querySelectorAll('tr').length).toBe(2);
    
    // Find the status select and change its value
    const statusSelect = document.querySelector('.statusSelect');
    statusSelect.value = 'solved';
    statusSelect.dispatchEvent(new Event('change'));
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify update was successful
    expect(global.alert).toHaveBeenCalledWith('Update successful');
  });
});
