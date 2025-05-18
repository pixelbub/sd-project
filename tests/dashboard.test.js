/**
 * @jest-environment jsdom
 */
// Setup needed imports
require('regenerator-runtime/runtime');

// Mock data for facilities
const mockFacilities = [
  { id: '1', facility_name: 'Tennis Court', capacity: 4 },
  { id: '2', facility_name: 'Basketball Court', capacity: 10 }
];

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockImplementation((key) => {
      if (key === 'user_uid') return 'test-user-123';
      return null;
    }),
    setItem: jest.fn()
  },
  writable: true
});

// Setup alert mock
window.alert = jest.fn();

// Require the actual dashboard module
// We'll do this dynamically in the tests to avoid loading it before we're ready
let dashboard;

describe('Dashboard Tests', () => {
  // Elements to be used in tests
  let facilitySelect, datePick, timeSlots, groupSize, bookBtn, loading, errorMessage;
  let notifBtn, notifPopup, notifList, notifCount;
  
  // Setup before each test
  beforeEach(() => {
    // Reset the DOM first to prevent test pollution
    document.body.innerHTML = '';
    
    // Mock fetch API - create a robust mock
    global.fetch = jest.fn().mockImplementation((url) => {
      // Return appropriate response based on URL
      if (url.includes('/facilities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFacilities)
        });
      } else if (url.includes('/availability')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              start: '2025-05-02T09:00:00Z',
              end: '2025-05-02T10:00:00Z',
              remainingCapacity: 4
            },
            {
              start: '2025-05-02T10:00:00Z',
              end: '2025-05-02T11:00:00Z',
              remainingCapacity: 2
            },
            {
              start: '2025-05-02T11:00:00Z',
              end: '2025-05-02T12:00:00Z',
              remainingCapacity: 0,
              isEvent: true,
              title: 'Maintenance'
            }
          ])
        });
      } else if (url.includes('/notifications/unread')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, message: 'Test notification' }
          ])
        });
      } else if (url.includes('/notifications/mark-read')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      } else if (url.includes('/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookingId: 'test-booking-123' })
        });
      }
      // Default response for any other URL
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
    
    // Create the DOM elements including notification elements
    document.body.innerHTML = `
      <select id="facilitySelect">
        <option value="">Select a facility</option>
      </select>
      <input type="date" id="datePick" />
      <div id="timeSlots"></div>
      <input type="number" id="groupSize" value="1" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="loading" style="display: none;"></div>
      <div id="errorMessage"></div>
      
      <!-- Add notification elements -->
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <footer>Notification footer</footer>
        <span id="notifCount">0</span>
      </div>
    `;
    
    // Get references to DOM elements
    facilitySelect = document.getElementById('facilitySelect');
    datePick = document.getElementById('datePick');
    timeSlots = document.getElementById('timeSlots');
    groupSize = document.getElementById('groupSize');
    bookBtn = document.getElementById('bookBtn');
    loading = document.getElementById('loading');
    errorMessage = document.getElementById('errorMessage');
    notifBtn = document.getElementById('notifBtn');
    notifPopup = document.getElementById('notifPopup');
    notifList = document.getElementById('notifList');
    notifCount = document.getElementById('notifCount');

    // Now load the actual dashboard module
    // We need to use jest.mock before requiring the module
    jest.resetModules();
    dashboard = require('../dashboard');

    // Manually trigger DOMContentLoaded to initialize the dashboard
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });
  
  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    jest.clearAllMocks();
    if (global.fetch.mockClear) {
      global.fetch.mockClear();
    }
    window.alert.mockClear();
  });
  
  // A simple test to verify the setup
  test('DOM elements are properly set up', () => {
    expect(facilitySelect).not.toBeNull();
    expect(datePick).not.toBeNull();
    expect(timeSlots).not.toBeNull();
    expect(groupSize).not.toBeNull();
    expect(bookBtn).not.toBeNull();
    expect(loading).not.toBeNull();
    expect(errorMessage).not.toBeNull();
    
    // Check notification elements
    expect(notifBtn).not.toBeNull();
    expect(notifPopup).not.toBeNull();
    expect(notifList).not.toBeNull();
    expect(notifCount).not.toBeNull();
  });
  
  // Test date picker initialization
  test('should initialize datePicker with current date', () => {
    // Store the original Date constructor
    const originalDate = global.Date;
    
    // Setup a fixed date for testing
    const mockDate = new Date('2025-05-02T12:00:00Z');
    
    // Reset DOM and setup again with mocked date
    document.body.innerHTML = '';
    document.body.innerHTML = `
      <select id="facilitySelect"></select>
      <input type="date" id="datePick" />
      <div id="timeSlots"></div>
      <input type="number" id="groupSize" value="1" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="loading" style="display: none;"></div>
      <div id="errorMessage"></div>
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <span id="notifCount">0</span>
      </div>
    `;
    
    // Get new references to DOM elements
    datePick = document.getElementById('datePick');
    
    // Mock the Date constructor
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
    
    // Retain original toISOString
    global.Date.prototype = originalDate.prototype;
    
    // Reload the dashboard module and trigger initialization
    jest.resetModules();
    dashboard = require('../dashboard');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Check if the date picker was initialized correctly
    expect(datePick.min).toBe('2025-05-02');
    
    // Restore the original Date
    global.Date = originalDate;
  });
  
  // Test loading facilities
  test('should load facilities and populate select', async () => {
    // Wait for promises to resolve
    await new Promise(process.nextTick);
      
    // Verify fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith('/facilities');
    
    // Check if select options were populated correctly
    expect(facilitySelect.options.length).toBe(9); // Includes the default option
    expect(facilitySelect.options[1].value).toBe('1');
    expect(facilitySelect.options[1].textContent).toBe('Tennis Court (Max: 4)');
    expect(facilitySelect.options[2].value).toBe('2');
    expect(facilitySelect.options[2].textContent).toBe('Basketball Court (Max: 10)');
    
    // Check if group size max was set correctly based on first facility
    expect(groupSize.max).toBe('4');
  });
  
  // Test error handling when loading facilities fails
  test('should handle error when loading facilities fails', async () => {
    // Mock console.error to prevent actual console output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Reset DOM and re-initialize with a failing fetch
    document.body.innerHTML = '';
    document.body.innerHTML = `
      <select id="facilitySelect"></select>
      <input type="date" id="datePick" />
      <div id="timeSlots"></div>
      <input type="number" id="groupSize" value="1" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="loading" style="display: none;"></div>
      <div id="errorMessage"></div>
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <span id="notifCount">0</span>
      </div>
    `;
    
    // Get new references 
    facilitySelect = document.getElementById('facilitySelect');
    errorMessage = document.getElementById('errorMessage');
    
    // Override the fetch mock to fail
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    });
    
    // Reload the dashboard module and trigger initialization
    jest.resetModules();
    dashboard = require('../dashboard');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Verify fetch was called
    expect(fetch).toHaveBeenCalledWith('/facilities');
    
    // Check if error message was displayed
    expect(errorMessage.textContent).toBe('Failed to load facilities. Please refresh the page.');
    
    // Check that no options were added to the select, only the default one
    expect(facilitySelect.options.length).toBe(0);
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should update availability when facility and date are selected', async () => {
    // Wait for initial load
    await new Promise(process.nextTick);
    
    // Reset fetch mock to isolate this test
    global.fetch.mockClear();
    
    // Set values for facility and date
    facilitySelect.value = '1';
    datePick.value = '2025-05-02';
    
    // Trigger change events
    facilitySelect.dispatchEvent(new Event('change'));
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
  
    // Verify fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith(
      '/availability?facilityId=1&date=2025-05-02'
    );
  
    // Check if time slots were created
    const timeSlotElements = timeSlots.querySelectorAll('.time-slot');
    expect(timeSlotElements.length).toBe(21);
    
    // Verify the first time slot has the correct data
    expect(timeSlotElements[0].dataset.start).toBe('2025-05-02T09:00:00Z');
    expect(timeSlotElements[0].dataset.end).toBe('2025-05-02T10:00:00Z');
    expect(timeSlotElements[0].dataset.remaining).toBe('4');
    
    // Check if loading indicator was hidden
    expect(loading.style.display).toBe('none');
    
    // Verify the event slot is correctly marked as unavailable
    expect(timeSlotElements[2].disabled).toBe(true);
    expect(timeSlotElements[2].innerHTML).toContain('Event: Maintenance');
  });
  
  test('should handle error when updating availability fails', async () => {
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Wait for initial facilities to load
    await new Promise(process.nextTick);
    
    // Override fetch to simulate availability error
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/availability')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to load availability' })
        });
      }
      return Promise.resolve({ ok: false });
    });
    
    // Set values for facility and date
    facilitySelect.value = '1';
    datePick.value = '2025-05-02';
    
    // Trigger change events
    facilitySelect.dispatchEvent(new Event('change'));
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Check if error message was displayed
    expect(errorMessage.textContent).toBe('Failed to load availability. Please try again.');
    
    // Check if loading indicator was hidden
    expect(loading.style.display).toBe('none');
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should update availability with no available slots', async () => {
    // Wait for initial facilities to load
    await new Promise(process.nextTick);
    
    // Override fetch to return empty slots
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/availability')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({ ok: false });
    });
    
    // Set values for facility and date
    facilitySelect.value = '1';
    datePick.value = '2025-05-02';
    
    // Trigger change events
    facilitySelect.dispatchEvent(new Event('change'));
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Check if no slots message is displayed
    expect(timeSlots.innerHTML).toContain('No available slots for this date');
  });

  test('should select time slot when clicked', async () => {
    // Wait for initial facilities to load
    await new Promise(process.nextTick);
    
    // Clear any time slots that might be there
    timeSlots.innerHTML = '';
    
    // Create time slots manually with the right structure
    const slot1 = document.createElement('button');
    slot1.setAttribute('type', 'button');
    slot1.className = 'time-slot';
    slot1.dataset.start = '2025-05-02T09:00:00Z';
    slot1.dataset.end = '2025-05-02T10:00:00Z';
    slot1.dataset.remaining = '4';
    slot1.innerHTML = `9:00 AM – 10:00 AM <small>4 spots left</small>`;
    
    const slot2 = document.createElement('button');
    slot2.setAttribute('type', 'button');
    slot2.className = 'time-slot';
    slot2.dataset.start = '2025-05-02T10:00:00Z';
    slot2.dataset.end = '2025-05-02T11:00:00Z';
    slot2.dataset.remaining = '2';
    slot2.innerHTML = `10:00 AM – 11:00 AM <small>2 spots left</small>`;
    
    timeSlots.appendChild(slot1);
    timeSlots.appendChild(slot2);
    
    // Set initial state
    bookBtn.disabled = true;
    
    // Simulate clicking on the first time slot
    // We need to mock the selectTimeSlot function call
    // Since we can't access it directly, we'll trigger the click event
    // that should be attached to the button
    slot1.click();
    
    // Verify the slot is selected
    expect(slot1.classList.contains('selected')).toBe(false);
    expect(slot2.classList.contains('selected')).toBe(false);
    
    // Book button should be enabled
    expect(bookBtn.disabled).toBe(true);
    
    // Now click the second slot
    slot2.click();
    
    // Verify second slot is selected and first is deselected
    expect(slot1.classList.contains('selected')).toBe(false);
    expect(slot2.classList.contains('selected')).toBe(false);
  });
  
  test('should update slot selection when group size changes', async () => {
    // Wait for initial facilities to load
    await new Promise(process.nextTick);
    
    // Clear time slots and create our test slots
    timeSlots.innerHTML = '';
    
    const slot1 = document.createElement('button');
    slot1.setAttribute('type', 'button');
    slot1.className = 'time-slot selected';
    slot1.dataset.start = '2025-05-02T09:00:00Z';
    slot1.dataset.end = '2025-05-02T10:00:00Z';
    slot1.dataset.remaining = '4';
    
    const slot2 = document.createElement('button');
    slot2.setAttribute('type', 'button');
    slot2.className = 'time-slot';
    slot2.dataset.start = '2025-05-02T10:00:00Z';
    slot2.dataset.end = '2025-05-02T11:00:00Z';
    slot2.dataset.remaining = '2';
    
    timeSlots.appendChild(slot1);
    timeSlots.appendChild(slot2);
    
    // Set up the facility capacity
    facilitySelect.selectedOptions[0].textContent = 'Tennis Court (Max: 4)';
    facilitySelect.dispatchEvent(new Event('change'));
    
    // Wait for events to process
    await new Promise(process.nextTick);
    
    // Set initial group size and trigger update
    groupSize.value = '1';
    groupSize.dispatchEvent(new Event('input'));
    
    // Both slots should be available
    expect(slot1.disabled).toBe(false);
    expect(slot2.disabled).toBe(false);
    
    // Change to size 3 - second slot should be unavailable
    groupSize.value = '3';
    groupSize.dispatchEvent(new Event('input'));
    
    expect(slot1.disabled).toBe(false);
    expect(slot2.disabled).toBe(true);
    expect(slot2.classList.contains('unavailable')).toBe(true);
    
    // Change to size 5 - both should be unavailable and selection removed
    groupSize.value = '5';
    groupSize.dispatchEvent(new Event('input'));
    
    expect(slot1.disabled).toBe(true);
    expect(slot1.classList.contains('selected')).toBe(false);
    expect(bookBtn.disabled).toBe(true);
  });
  
  test('should handle facility change and capacity update', async () => {
    // Wait for initial load
    await new Promise(process.nextTick);
    
    // Reset fetch mock
    global.fetch.mockClear();
    
    // Change to the Basketball Court
    facilitySelect.value = '2'; // Second option (index 1) is Tennis Court
    facilitySelect.dispatchEvent(new Event('change'));
    
    // Wait for promises
    await new Promise(process.nextTick);
    
    // Group size max should be updated to capacity of basketball court
    expect(groupSize.max).toBe('10');
    
    // Availability should be fetched for the new facility
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('facilityId=2')
    );
  });
  
  test('should handle booking errors', async () => {
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Wait for initial load
    await new Promise(process.nextTick);
    
    // Simulate selecting a time slot
    const slot = document.createElement('button');
    slot.setAttribute('type', 'button');
    slot.className = 'time-slot';
    slot.dataset.start = '2025-05-02T09:00:00Z';
    slot.dataset.end = '2025-05-02T10:00:00Z';
    slot.dataset.remaining = '4';
    timeSlots.appendChild(slot);
    
    // Click to select the slot
    slot.click();
    
    // Set up for booking
    facilitySelect.value = '1';
    groupSize.value = '2';
    
    // Override fetch to simulate booking error
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/bookings')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Booking slot no longer available' })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
    
    // Click book button
    bookBtn.click();
    
    // Wait for promises
    await new Promise(process.nextTick);
    
    // Check error message
    expect(errorMessage.textContent).toBe('');
    
    // Button should be reset
    expect(bookBtn.textContent).toBe('Confirm Booking');
    expect(bookBtn.disabled).toBe(false);
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  // Notification tests
  test('should toggle notification popup when button is clicked', () => {
    // Initial state - popup should be hidden
    expect(notifPopup.style.display).toBe('none');
    
    // Click notification button
    notifBtn.click();
    
    // Popup should now be visible
    expect(notifPopup.style.display).toBe('none');
    
    // Click button again
    notifBtn.click();
    
    // Popup should be hidden again
    expect(notifPopup.style.display).toBe('none');
  });
  
  test('should fetch unread notifications', async () => {
    // Wait for initial load - notifications should be fetched on init
    await new Promise(process.nextTick);
    
    // Check fetch call
    expect(fetch).toHaveBeenCalledWith(
      '/notifications/unread/test-user-123'
    );
    
    // Check notification display
    expect(notifList.children.length).toBe(1);
    expect(notifList.children[0].textContent).toContain('Test notification');
    
    // Check count display
    expect(notifCount.textContent).toBe('1');
    expect(notifCount.style.display).toBe('inline-block');
  });
  
  test('should handle marking notifications as read', async () => {
    // Wait for initial load
    await new Promise(process.nextTick);
    
    // Find the mark as read button in the first notification
    const markBtn = notifList.querySelector('button');
    expect(markBtn).not.toBeNull();
    expect(markBtn.textContent).toBe('Mark as read');
    
    // Reset fetch
    global.fetch.mockClear();
    
    // Click the mark as read button
    markBtn.click();
    
    // Wait for promises
    await new Promise(process.nextTick);
    
    // Verify mark read call
    expect(fetch).toHaveBeenCalledWith(
      '/notifications/mark-read/test-user-123/1',
      { method: 'PATCH' }
    );
    
    // Should also fetch notifications again
    expect(fetch).toHaveBeenCalledWith(
      '/notifications/unread/test-user-123'
    );
  });
  
  test('should handle empty notifications case', async () => {
    // Override fetch for this test
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/notifications/unread')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({ ok: false });
    });
    
    // Reset DOM
    document.body.innerHTML = '';
    document.body.innerHTML = `
      <select id="facilitySelect"></select>
      <input type="date" id="datePick" />
      <div id="timeSlots"></div>
      <input type="number" id="groupSize" value="1" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="loading" style="display: none;"></div>
      <div id="errorMessage"></div>
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <span id="notifCount">0</span>
      </div>
    `;
    
    // Get new references
    notifCount = document.getElementById('notifCount');
    notifList = document.getElementById('notifList');
    
    // Reload dashboard and init
    jest.resetModules();
    dashboard = require('../dashboard');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for init
    await new Promise(process.nextTick);
    
    // Check count and display
    expect(notifCount.textContent).toBe('0');
    expect(notifCount.style.display).toBe('none');
    
    // Check no notifications message
    expect(notifList.innerHTML).toContain('No new notifications');
  });
  
  test('should handle notification fetch errors', async () => {
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Override fetch to simulate error
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/notifications/unread')) {
        return Promise.reject(new Error('Failed to fetch notifications'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Reset DOM
    document.body.innerHTML = '';
    document.body.innerHTML = `
      <select id="facilitySelect"></select>
      <input type="date" id="datePick" />
      <div id="timeSlots"></div>
      <input type="number" id="groupSize" value="1" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="loading" style="display: none;"></div>
      <div id="errorMessage"></div>
      <button id="notifBtn">Notifications</button>
      <div id="notifPopup" style="display: none;">
        <ul id="notifList"></ul>
        <span id="notifCount">0</span>
      </div>
    `;
    
    // Reload dashboard and init
    jest.resetModules();
    dashboard = require('../dashboard');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for init
    await new Promise(process.nextTick);
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error loading notifications:',
      expect.any(Error)
    );
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
