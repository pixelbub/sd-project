
describe('Events Module Pure Functions', () => {
    // Import only the pure functions that we can test reliably
    const { safeToDate, calculateDaysLeft } = require('../events.js');
    
    // Test safeToDate function
    describe('safeToDate function', () => {
      test('should return null for falsy input', () => {
        expect(safeToDate(null)).toBeNull();
        expect(safeToDate(undefined)).toBeNull();
        expect(safeToDate('')).toBeNull();
        expect(safeToDate(0)).toBeNull();
      });
      
      test('should convert string to Date', () => {
        const dateStr = '2025-05-17T12:00:00';
        const result = safeToDate(dateStr);
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe(new Date(dateStr).toISOString());
      });
      
      test('should use toDate method if available', () => {
        const mockFirestoreTimestamp = {
          toDate: jest.fn(() => new Date('2025-05-17T12:00:00'))
        };
        const result = safeToDate(mockFirestoreTimestamp);
        expect(mockFirestoreTimestamp.toDate).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Date);
      });
      
      test('should return null for invalid date inputs that throw errors', () => {
        const invalidDate = { 
          toDate: () => { throw new Error('Invalid date'); } 
        };
        expect(safeToDate(invalidDate)).toBeNull();
      });
    });
    
    // Test calculateDaysLeft function
    describe('calculateDaysLeft function', () => {
      test('should return 0 for today', () => {
        const today = new Date();
        expect(calculateDaysLeft(today)).toBe(0);
      });
      
      test('should return 1 for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(calculateDaysLeft(tomorrow)).toBe(1);
      });
      
      test('should return correct days for future date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        expect(calculateDaysLeft(futureDate)).toBe(5);
      });
      
      test('should return negative days for past date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        expect(calculateDaysLeft(pastDate)).toBe(-3);
      });
    });
  });
  
