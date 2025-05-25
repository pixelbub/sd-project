/**
 * Unit tests for booking management functionality
 * @jest-environment jsdom
 */

// Import the necessary modules for testing
import '@testing-library/jest-dom';
import { fireEvent, waitFor } from '@testing-library/dom';
import fetchMock from 'jest-fetch-mock';

// Import the functions from our module
const bookingManager = require('../a_booking_man');
const { initBookingManager, updateBookingStatus, formatFirestoreTimestamp } = bookingManager;

// Setup fetch mock
fetchMock.enableMocks();

// Helper to create a mock booking object
function createMockBooking(id, facilityId, startTime, endTime, status = 'pending') {
  return {
    id,
    facilityId,
    startTime,
    endTime,
    status
  };
}

describe('Booking Management', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear mocks
    fetchMock.resetMocks();
    
    // Setup DOM structure
    document.body.innerHTML = `
      <button id="load-bookings">Load Pending Bookings</button>
      <table id="bookings-table">
        <tbody></tbody>
      </table>
    `;
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Spy on alert
    global.alert = jest.fn();
    
    // Manually trigger initialization (instead of waiting for DOMContentLoaded)
    initBookingManager();
  });

  // Cleanup after each test
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('should not initialize if elements are not found', () => {
    // Clear the DOM
    document.body.innerHTML = '';
    
    // Call init function
    initBookingManager();
    
    // No errors should occur even though elements are missing
    expect(document.body.innerHTML).toBe('');
  });

  test('should display message when no bookings found', async () => {
    // Mock empty bookings response
    fetchMock.mockResponseOnce(JSON.stringify([]));
    
    // Get elements
    const loadButton = document.getElementById('load-bookings');
    const tableBody = document.querySelector('#bookings-table tbody');
    
    // Click the load button
    fireEvent.click(loadButton);
    
    // Wait for data to load
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(tableBody.innerHTML).toContain('<tr><td colspan=\"5\">No upcoming bookings found</td></tr>');
    });
  });

  test('should handle server error when loading bookings', async () => {
    // Mock error response
    fetchMock.mockRejectOnce(new Error('Network failure'));
    
    // Get elements
    const loadButton = document.getElementById('load-bookings');
    const tableBody = document.querySelector('#bookings-table tbody');
    
    // Click the load button
    fireEvent.click(loadButton);
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load bookings:', expect.any(Error));
      expect(tableBody.innerHTML).toContain('Error loading bookings: Network failure');
    });
    
    // Verify button returns to original state
    expect(loadButton.disabled).toBe(false);
    expect(loadButton.textContent).toBe('Load Upcoming Bookings');
  });

  test('should handle non-OK response when loading bookings', async () => {
    // Mock non-OK response
    fetchMock.mockResponseOnce('', { status: 500 });
    
    // Get elements
    const loadButton = document.getElementById('load-bookings');
    const tableBody = document.querySelector('#bookings-table tbody');
    
    // Click the load button
    fireEvent.click(loadButton);
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(tableBody.innerHTML).toContain('Error loading bookings: Server error: 500');
    });
  });

  test('should alert if no booking ID is found when updating status', async () => {
    // Create a row without booking ID
    const row = document.createElement('tr');
    
    // Call updateBookingStatus directly without ID
    await updateBookingStatus(null, 'approved', row);
    
    // Verify alert
    expect(global.alert).toHaveBeenCalledWith('Error: No booking ID found');
  });

  test('should format Firestore timestamp correctly', () => {
    // Test various timestamp formats
    
    // Date object
    const dateObj = new Date('2023-05-03T12:00:00');
    expect(formatFirestoreTimestamp(dateObj)).toBe(dateObj.toLocaleString());
    
    // String date
    expect(formatFirestoreTimestamp('2023-05-03T12:00:00')).toBe(new Date('2023-05-03T12:00:00').toLocaleString());
    
    // Invalid string
    expect(formatFirestoreTimestamp('not-a-date')).toBe('Invalid date');
    
    // Firestore timestamp object with toDate
    const firestoreTimestamp = { toDate: () => new Date('2023-05-03T12:00:00') };
    expect(formatFirestoreTimestamp(firestoreTimestamp)).toBe(firestoreTimestamp.toDate().toLocaleString());
    
    // Object with seconds
    const secondsTimestamp = { seconds: 1620000000 };
    expect(formatFirestoreTimestamp(secondsTimestamp)).toBe(new Date(1620000000 * 1000).toLocaleString());
    
    // Null value
    expect(formatFirestoreTimestamp(null)).toBe('Invalid date');
    
    // Undefined value
    expect(formatFirestoreTimestamp(undefined)).toBe('Invalid date');
    
    // Value that throws an error
    const badValue = {
      get seconds() { throw new Error('Test error'); }
    };
    expect(formatFirestoreTimestamp(badValue)).toBe('Date error');
  });
  
});
