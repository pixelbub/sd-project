/**
 * @jest-environment jsdom
 */

const { initBookingManager, updateBookingStatus, formatFirestoreTimestamp } = require('./a_booking_man');

// Mock global fetch
global.fetch = jest.fn();

describe('formatFirestoreTimestamp', () => {
  it('formats string date', () => {
    const dateStr = '2024-01-01T12:00:00Z';
    const formatted = formatFirestoreTimestamp(dateStr);
    expect(formatted).toContain('2024');
  });

  it('formats Firestore timestamp object', () => {
    const ts = { seconds: 1704100800 }; // Jan 1, 2024
    const formatted = formatFirestoreTimestamp(ts);
    expect(formatted).toContain('2024');
  });

  it('formats Date object', () => {
    const d = new Date('2024-01-01');
    const formatted = formatFirestoreTimestamp(d);
    expect(formatted).toContain('2024');
  });

  it('returns fallback on invalid input', () => {
    expect(formatFirestoreTimestamp(undefined)).toBe('Invalid date');
    expect(formatFirestoreTimestamp({})).toBe('Invalid date');
  });
});

describe('initBookingManager', () => {
  let loadBtn, tableBody;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="load-bookings">Load Upcoming Bookings</button>
      <table id="bookings-table"><tbody></tbody></table>
    `;
    loadBtn = document.getElementById('load-bookings');
    tableBody = document.querySelector('#bookings-table tbody');

    fetch.mockClear();
    initBookingManager();
  });

  it('loads and displays bookings', async () => {
    const bookings = [
      { id: '1', facilityId: 'Court 1', startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T11:00:00Z', status: 'pending' },
      { id: '2', facilityId: 'Court 2', startTime: '2024-01-01T12:00:00Z', endTime: '2024-01-01T13:00:00Z', status: 'approved' },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => bookings,
    });

    loadBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for microtasks

    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(1); // Only one pending booking
    expect(rows[0].textContent).toContain('Court 1');
  });

  it('shows message when no bookings found', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    loadBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(tableBody.textContent).toContain('No upcoming bookings found');
  });

  it('shows error message on fetch fail', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    loadBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(tableBody.textContent).toContain('Error loading bookings');
  });

  it('clicking approve or block calls updateBookingStatus', async () => {
    const bookings = [
      { id: '1', facilityId: 'Court 1', startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T11:00:00Z', status: 'pending' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => bookings,
    });

    loadBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    const approveBtn = document.querySelector('.approve-btn');
    const blockBtn = document.querySelector('.block-btn');

    // Mock fetch for PATCH
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Booking approved' }),
    });

    // Spy on alert
    window.alert = jest.fn();

    approveBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.alert).toHaveBeenCalledWith('Booking approved');
  });
});

describe('updateBookingStatus', () => {
  it('sends PATCH request and removes row', async () => {
    const row = document.createElement('tr');
    document.body.appendChild(row);

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Updated' }),
    });

    window.alert = jest.fn();

    await updateBookingStatus('abc123', 'approved', row);

    expect(fetch).toHaveBeenCalledWith(
      'https://backend-k52m.onrender.com/bookings/abc123/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      })
    );

    expect(window.alert).toHaveBeenCalledWith('Updated');
    expect(document.body.contains(row)).toBe(false); // Row removed
  });

  it('shows error on network fail', async () => {
    fetch.mockRejectedValueOnce(new Error('Server is down'));
    window.alert = jest.fn();

    await updateBookingStatus('abc123', 'approved', null);

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Error updating booking'));
  });

  it('shows alert when bookingId is missing', async () => {
    window.alert = jest.fn();

    await updateBookingStatus(null, 'approved', null);

    expect(window.alert).toHaveBeenCalledWith('Error: No booking ID found');
  });
});
