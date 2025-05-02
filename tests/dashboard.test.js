// dashboard.test.js

/**
 * @jest-environment jsdom
 */

describe('Dashboard', () => {
    // Mock DOM elements
    let facilitySelect, datePick, timeSlots, groupSize, bookBtn, loading, errorMessage;
    
    // Mock fetch response data
    const mockFacilities = [
      { id: 1, facility_name: 'Gym', capacity: 30 },
      { id: 2, facility_name: 'Pool', capacity: 20 }
    ];
    
    const mockAvailability = [
      { 
        start: '2025-05-02T09:00:00', 
        end: '2025-05-02T10:00:00', 
        remainingCapacity: 15 
      },
      { 
        start: '2025-05-02T10:00:00', 
        end: '2025-05-02T11:00:00', 
        remainingCapacity: 5 
      }
    ];
    
    const mockBookingResponse = { bookingId: 'BOOK123' };
    
    // Setup spy on console.error
    let consoleErrorSpy;
    
    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <select id="facilitySelect"></select>
        <input type="date" id="datePick">
        <div id="timeSlots"></div>
        <input type="number" id="groupSize" min="1" value="1">
        <button id="bookBtn" disabled>Confirm Booking</button>
        <div id="loading" style="display: none;">Loading...</div>
        <div id="errorMessage"></div>
      `;

      require('../dashboard');
      
      // Get elements
      facilitySelect = document.getElementById('facilitySelect');
      datePick = document.getElementById('datePick');
      timeSlots = document.getElementById('timeSlots');
      groupSize = document.getElementById('groupSize');
      bookBtn = document.getElementById('bookBtn');
      loading = document.getElementById('loading');
      errorMessage = document.getElementById('errorMessage');
      
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'user123'),
          setItem: jest.fn(),
        },
        writable: true
      });
      
      // Mock fetch
      global.fetch = jest.fn();
      
      // Mock alerts
      global.alert = jest.fn();
      
      // Spy on console.error
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Load dashboard.js script - we need to mock this since we're not actually loading the file
      // Instead we'll mock the expected behavior for each test
    });
    
    afterEach(() => {
      jest.resetAllMocks();
      consoleErrorSpy.mockRestore();
    });
    
    test('loads facilities on page load', async () => {
      // Mock successful fetch for facilities
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      // Mock successful fetch for availability
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check if facilities were loaded
      expect(global.fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/facilities');
      expect(facilitySelect.children.length).toBe(2);
      expect(facilitySelect.children[0].textContent).toBe('Gym (Max: 30)');
      expect(facilitySelect.children[1].textContent).toBe('Pool (Max: 20)');
    });
    
    test('handles facility load error', async () => {
      // Mock failed fetch
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check error handling
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(errorMessage.textContent).toBe('Failed to load facilities. Please refresh the page.');
    });
    
    test('updates availability when date changes', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      // First availability fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Reset fetch mock to prepare for next call
      global.fetch.mockReset();
      
      // Mock availability fetch for new date
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { 
            start: '2025-05-03T14:00:00', 
            end: '2025-05-03T15:00:00', 
            remainingCapacity: 25 
          }
        ]
      });
      
      // Change date
      datePick.value = '2025-05-03';
      datePick.dispatchEvent(new Event('change'));
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check if availability was updated
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://backend-k52m.onrender.com/availability')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('date=2025-05-03')
      );
      
      // Check if time slots were updated
      expect(timeSlots.children.length).toBe(1);
    });
    
    test('updates capacity restriction when facility changes', async () => {
      // Setup initial state with facilities
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Initial max should be from first facility (30)
      expect(groupSize.max).toBe(30);
      
      // Reset fetch mock
      global.fetch.mockReset();
      
      // Mock availability fetch for new facility
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Change facility to the second one (Pool with capacity 20)
      facilitySelect.value = '2';
      facilitySelect.dispatchEvent(new Event('change'));
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check if max group size was updated
      expect(groupSize.max).toBe(20);
    });
    
    test('handles time slot selection', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Should now have time slots rendered
      const firstSlot = timeSlots.children[0];
      expect(firstSlot).toBeTruthy();
      
      // Select the first time slot
      firstSlot.click();
      
      // Book button should be enabled
      expect(bookBtn.disabled).toBe(false);
      
      // First slot should have 'selected' class
      expect(firstSlot.classList.contains('selected')).toBe(true);
    });
    
    test('handles successful booking', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Select the first time slot
      const firstSlot = timeSlots.children[0];
      firstSlot.click();
      
      // Reset fetch mock
      global.fetch.mockReset();
      
      // Mock successful booking request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookingResponse
      });
      
      // Mock availability fetch after booking
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Click book button
      bookBtn.click();
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check if booking request was sent
      expect(global.fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/bookings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Check if success alert was shown
      expect(global.alert).toHaveBeenCalledWith(
        'Booking successful! Reference: BOOK123'
      );
    });
    
    test('handles booking error', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Select the first time slot
      const firstSlot = timeSlots.children[0];
      firstSlot.click();
      
      // Reset fetch mock
      global.fetch.mockReset();
      
      // Mock failed booking request
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Slot no longer available' })
      });
      
      // Click book button
      bookBtn.click();
      
      // Wait for promises to resolve
      await Promise.resolve();
      
      // Check error handling
      expect(errorMessage.textContent).toBe('Slot no longer available');
      expect(bookBtn.disabled).toBe(false);
      expect(bookBtn.textContent).toBe('Confirm Booking');
    });
    
    test('disables slots that cannot fit group size', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Get slots
      const firstSlot = timeSlots.children[0]; // 15 spots
      const secondSlot = timeSlots.children[1]; // 5 spots
      
      // First set group size to 10 (both should be enabled)
      groupSize.value = '10';
      groupSize.dispatchEvent(new Event('input'));
      
      // Check slot states
      expect(firstSlot.disabled).toBe(false);
      expect(secondSlot.disabled).toBe(false);
      
      // Now set group size to 10 (second slot should be disabled)
      groupSize.value = '10';
      groupSize.dispatchEvent(new Event('input'));
      
      // Second slot should be enabled (5 spots >= 10)
      expect(secondSlot.disabled).toBe(true);
      expect(secondSlot.classList.contains('unavailable')).toBe(true);
      
      // Select first slot
      firstSlot.click();
      expect(bookBtn.disabled).toBe(false);
      
      // Increase group size beyond capacity
      groupSize.value = '20';
      groupSize.dispatchEvent(new Event('input'));
      
      // Selection should be cleared and both slots disabled
      expect(firstSlot.classList.contains('selected')).toBe(false);
      expect(bookBtn.disabled).toBe(true);
    });
    
    test('handles no available slots', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      // Empty availability
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Should show no slots message
      expect(timeSlots.innerHTML).toContain('No available slots for this date');
    });
    
    test('handles availability fetch error', async () => {
      // Setup initial state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFacilities
      });
      
      // Failed availability fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await Promise.resolve();
      
      // Check error handling
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(errorMessage.textContent).toBe('Failed to load availability. Please try again.');
    });
  });