/**
 * @jest-environment jsdom
 */

// Set up Jest mocks
jest.mock('localStorage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}), { virtual: true });

// Mock global objects before importing
global.fetch = jest.fn();
global.alert = jest.fn();
global.console.error = jest.fn();

// Create proper mock for localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

// Create proper mock for window
const originalWindow = { ...window };
window.addEventListener = jest.fn();
window.location = { reload: jest.fn() };
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Now import the functions
const { safeToDate, calculateDaysLeft, loadEvents, rsvp, cancelRsvp } = require('../events');

// Setup DOM mocks
beforeAll(() => {
  // Create a more detailed mock for event cards
  const createEventCard = () => {
    const card = {
      className: '',
      style: {},
      innerHTML: '',
      appendChild: jest.fn(),
      addEventListener: jest.fn(),
      querySelector: jest.fn()
    };
    
    // Set up the querySelector to return different buttons
    card.querySelector.mockImplementation(selector => {
      if (selector === '.cancel') {
        return {
          addEventListener: jest.fn((_event, handler) => {
            // Store the handler so we can call it in tests
            card.cancelHandler = handler;
          }),
          dataset: { eventId: '123' }
        };
      } else if (selector === '.submit') {
        return {
          addEventListener: jest.fn((_event, handler) => {
            // Store the handler so we can call it in tests
            card.submitHandler = handler;
          }),
          dataset: { eventId: '456' },
          previousElementSibling: { value: '2' }
        };
      }
      return null;
    });
    
    return card;
  };
  
  // Mock DOM elements
  const mockElements = {
    loading: { 
      style: { display: 'block' },
      textContent: 'Loading...'
    },
    'events-container': {
      style: { display: 'none' },
      appendChild: jest.fn(card => {
        // Store the card in a container property for later testing
        if (!mockElements['events-container'].cards) {
          mockElements['events-container'].cards = [];
        }
        mockElements['events-container'].cards.push(card);
        return card;
      })
    },
    'no-events': {
      style: { display: 'none' }
    }
  };
  
  // Mock document methods
  document.getElementById = jest.fn(id => mockElements[id]);
  document.createElement = jest.fn(() => createEventCard());
});

describe('Event Management Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('safeToDate', () => {
    test('should return null for falsy inputs', () => {
      expect(safeToDate(null)).toBeNull();
      expect(safeToDate(undefined)).toBeNull();
      expect(safeToDate('')).toBeNull();
      expect(safeToDate(0)).toBeNull();
    });
    
    test('should convert Firebase timestamp to Date', () => {
      const mockFirebaseTimestamp = {
        toDate: jest.fn(() => new Date('2025-05-18'))
      };
      
      const result = safeToDate(mockFirebaseTimestamp);
      expect(mockFirebaseTimestamp.toDate).toHaveBeenCalled();
      expect(result instanceof Date).toBeTruthy();
    });
    
    test('should convert string to Date', () => {
      const dateStr = '2025-05-18T12:00:00';
      const result = safeToDate(dateStr);
      
      expect(result instanceof Date).toBeTruthy();
      expect(result.toISOString().slice(0, 10)).toBe('2025-05-18');
    });
    
    test('should handle invalid date inputs', () => {
      const invalidObj = {
        toDate: () => { throw new Error('Invalid date'); }
      };
      
      expect(safeToDate(invalidObj)).toBeNull();
      expect(safeToDate('not-a-date')).not.toBeNull(); // JS will make a Date object, even if invalid
    });
  });
  
  describe('calculateDaysLeft', () => {
    let realDate;
    
    beforeEach(() => {
      // Mock the current date
      realDate = global.Date;
      const mockDate = new Date('2025-05-18T10:00:00Z');
      global.Date = jest.fn(() => mockDate);
      global.Date.UTC = realDate.UTC;
      global.Date.parse = realDate.parse;
      global.Date.now = jest.fn(() => mockDate.getTime());
      
      // Allow new Date to work normally when given arguments
      global.Date.mockImplementation((...args) => {
        if (args.length) {
          return new realDate(...args);
        }
        return mockDate;
      });
    });
    
    afterEach(() => {
      global.Date = realDate;
    });
    
    test('should return 0 for today', () => {
      const today = new Date('2025-05-18');
      expect(calculateDaysLeft(today)).toBe(0);
    });
    
    test('should return positive days for future dates', () => {
      const tomorrow = new Date('2025-05-19');
      const nextWeek = new Date('2025-05-25');
      
      expect(calculateDaysLeft(tomorrow)).toBe(1);
      expect(calculateDaysLeft(nextWeek)).toBe(7);
    });
    
    test('should return negative days for past dates', () => {
      const yesterday = new Date('2025-05-17');
      const lastWeek = new Date('2025-05-11');
      
      expect(calculateDaysLeft(yesterday)).toBe(-1);
      expect(calculateDaysLeft(lastWeek)).toBe(-7);
    });
  });
  
  describe('loadEvents', () => {
    test('should show alert if no user is logged in', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await loadEvents();
      
      expect(alert).toHaveBeenCalledWith('No user logged in');
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('should fetch events and user RSVPs and set up event listeners', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      // Mock successful API responses
      const mockEvents = [
        { 
          id: '123', 
          private: false, 
          title: 'Test Event', 
          startTime: '2025-06-01T10:00:00', 
          endTime: '2025-06-01T12:00:00',
          facilityId: 'facility1',
          description: 'Test description'
        },
        { 
          id: '456', 
          private: false,
          title: 'Second Event',
          startTime: '2025-06-02T10:00:00', 
          endTime: '2025-06-02T12:00:00',
          facilityId: 'facility2',
          description: 'Another event'
        }
      ];
      
      const mockRsvps = [
        { event_id: '123' } // User has RSVP'd to first event
      ];
      
      fetch.mockImplementation((url) => {
        if (url.includes('/events/upcoming')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockEvents)
          });
        } else if (url.includes('/users/')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockRsvps)
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      await loadEvents();
      
      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/events/upcoming');
      expect(fetch).toHaveBeenCalledWith('https://backend-k52m.onrender.com/users/user123/rsvps');
      
      // Verify DOM updates
      const container = document.getElementById('events-container');
      const loading = document.getElementById('loading');
      expect(loading.style.display).toBe('none');
      expect(container.style.display).toBe('grid');
      expect(container.appendChild).toHaveBeenCalledTimes(2); // 2 events
      
      // Test that the event listeners were set up
      const cards = container.cards;
      expect(cards).toHaveLength(2);
      
      // Verify first card (with cancel button) and test its handler
      const firstCard = cards[0];
      expect(firstCard.querySelector).toHaveBeenCalledWith('.cancel');
      expect(firstCard.cancelHandler).toBeDefined();
      
      // Verify second card (with submit button) and test its handler
      const secondCard = cards[1];
      expect(secondCard.querySelector).toHaveBeenCalledWith('.submit');
      expect(secondCard.submitHandler).toBeDefined();
      
      // Test that event handlers work correctly by simulating clicks
      
      // Mock for cancelRsvp test
      mockLocalStorage.getItem.mockReturnValue('user123');
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });
      
      // Call the cancel handler directly
      await firstCard.cancelHandler();
      
      // Verify cancelRsvp was called correctly
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/events/123/rsvp',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid: 'user123' })
        }
      );
      
      // Mock for rsvp test
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });
      
      // Call the submit handler directly
      await secondCard.submitHandler();
      
      // Verify rsvp was called correctly
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/events/456/rsvp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid: 'user123', count: 2 })
        }
      );
    });
    
    test('should show no-events message when no public events exist', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      // Mock API responses with only private events
      const mockEvents = [
        { id: '123', private: true, title: 'Private Event 1' },
        { id: '456', private: true, title: 'Private Event 2' }
      ];
      
      const mockRsvps = [];
      
      fetch.mockImplementation((url) => {
        if (url.includes('/events/upcoming')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockEvents)
          });
        } else if (url.includes('/users/')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockRsvps)
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      await loadEvents();
      
      // Verify DOM updates for no events
      const noEvents = document.getElementById('no-events');
      const loading = document.getElementById('loading');
      const container = document.getElementById('events-container');
      
      expect(loading.style.display).toBe('none');
      expect(noEvents.style.display).toBe('block');
      expect(container.appendChild).not.toHaveBeenCalled();
    });
    
    test('should handle API errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      // Mock API failure
      fetch.mockRejectedValue(new Error('Network error'));
      
      await loadEvents();
      
      // Verify error handling
      const loading = document.getElementById('loading');
      expect(loading.textContent).toBe('Failed to load events.');
      expect(console.error).toHaveBeenCalled;
    });
    
    test('should handle different date scenarios and display appropriate message', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      // Set up a known date for testing
      const realDate = global.Date;
      const mockToday = new Date('2025-05-18T10:00:00Z');
      global.Date = jest.fn(() => mockToday);
      global.Date.UTC = realDate.UTC;
      global.Date.parse = realDate.parse;
      global.Date.now = jest.fn(() => mockToday.getTime());
      
      // Allow new Date to work normally when given arguments
      global.Date.mockImplementation((...args) => {
        if (args.length) {
          return new realDate(...args);
        }
        return mockToday;
      });
      
      // Test events with different dates
      const mockEvents = [
        { 
          id: '1', 
          private: false, 
          title: 'Today Event', 
          startTime: '2025-05-18T10:00:00', // Today
          endTime: '2025-05-18T12:00:00'
        },
        { 
          id: '2', 
          private: false, 
          title: 'Tomorrow Event', 
          startTime: '2025-05-19T10:00:00', // Tomorrow (1 day)
          endTime: '2025-05-19T12:00:00'
        },
        { 
          id: '3', 
          private: false, 
          title: 'Future Event', 
          startTime: '2025-05-25T10:00:00', // More than 1 day in future
          endTime: '2025-05-25T12:00:00'
        },
        { 
          id: '4', 
          private: false, 
          title: 'Past Event', 
          startTime: '2025-05-17T10:00:00', // Past event
          endTime: '2025-05-17T12:00:00'
        },
        {
          id: '5',
          private: false,
          title: 'Invalid Date Event',
          startTime: null, // No date
          endTime: null
        }
      ];
      
      const mockRsvps = [];
      
      fetch.mockImplementation((url) => {
        if (url.includes('/events/upcoming')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockEvents)
          });
        } else if (url.includes('/users/')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockRsvps)
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      await loadEvents();
      
      // Reset the Date mock
      global.Date = realDate;
      
      // Verify that 5 cards were created (one for each event)
      const container = document.getElementById('events-container');
      expect(container.appendChild).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('rsvp', () => {
    /*test('should submit RSVP with guest count', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {
        previousElementSibling: { value: '3' }
      };
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });
      
      await rsvp('123', mockBtn);
      
      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/events/123/rsvp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid: 'user123', count: 3 })
        }
      );
      
      // Verify UI updates
      expect(alert).toHaveBeenCalledWith('RSVP confirmed for 3 guest(s)');
      expect(window.location.reload).toHaveBeenCalled();
    });*/
    
    test('should handle invalid guest input and default to 1', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {
        previousElementSibling: { value: 'not-a-number' }
      };
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });
      
      await rsvp('123', mockBtn);
      
      // Verify API call uses default value of 1
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/events/123/rsvp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid: 'user123', count: 1 })
        }
      );
    });
    
    test('should handle failed RSVP', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {
        previousElementSibling: { value: '2' }
      };
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'Event is full' })
      });
      
      await rsvp('123', mockBtn);
      
      // Verify error message
      expect(alert).toHaveBeenCalledWith('Failed to RSVP: Event is full');
    });
    
    test('should handle RSVP with no specific error message', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {
        previousElementSibling: { value: '2' }
      };
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false }) // No error message
      });
      
      await rsvp('123', mockBtn);
      
      // Verify default error message
      expect(alert).toHaveBeenCalledWith('Failed to RSVP: Unknown error');
    });
    
    test('should handle RSVP API errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {
        previousElementSibling: { value: '1' }
      };
      
      fetch.mockRejectedValue(new Error('Network failure'));
      
      await rsvp('123', mockBtn);
      
      // Verify error handling
      expect(alert).toHaveBeenCalledWith('Error sending RSVP: Network failure');
    });
  });
  
  describe('cancelRsvp', () => {
    /*test('should cancel RSVP successfully', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {};
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true })
      });
      
      await cancelRsvp('123', mockBtn);
      
      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/events/123/rsvp',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid: 'user123' })
        }
      );
      
      // Verify UI updates
      expect(alert).toHaveBeenCalledWith('RSVP cancelled');
      expect(window.location.reload).toHaveBeenCalled();
    });*/
    
    test('should handle failed cancellation', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {};
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'RSVP not found' })
      });
      
      await cancelRsvp('123', mockBtn);
      
      // Verify error message
      expect(alert).toHaveBeenCalledWith('Failed to cancel RSVP: RSVP not found');
    });
    
    test('should handle cancellation with no specific error message', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {};
      
      fetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false }) // No error message
      });
      
      await cancelRsvp('123', mockBtn);
      
      // Verify default error message
      expect(alert).toHaveBeenCalledWith('Failed to cancel RSVP: Unknown error');
    });
    
    test('should handle cancellation API errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('user123');
      
      const mockBtn = {};
      
      fetch.mockRejectedValue(new Error('Server error'));
      
      await cancelRsvp('123', mockBtn);
      
      // Verify error handling
      expect(alert).toHaveBeenCalledWith('Error cancelling RSVP: Server error');
    });
  });
  
  /*test('should register DOMContentLoaded event listener', () => {
    // Verify that the event listener was registered
    expect(window.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', loadEvents);
  });*/
});
