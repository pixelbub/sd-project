/**
 * @jest-environment jsdom
 */

// Mock Firebase modules
jest.mock('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js', () => ({
    initializeApp: jest.fn().mockReturnValue({})
  }), { virtual: true });
  
  jest.mock('https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js', () => ({
    getAuth: jest.fn().mockReturnValue({}),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      addScope: jest.fn()
    })),
    signInWithPopup: jest.fn()
  }), { virtual: true });
  
  // Setup DOM elements before importing the module
  document.body.innerHTML = `
    <input id="first-name" value="John" />
    <input id="last-name" value="Doe" />
    <select id="role">
      <option value="">Select a role</option>
      <option value="admin">Admin</option>
      <option value="facility-staff">Facility Staff</option>
      <option value="resident">Resident</option>
    </select>
    <button onclick="signInWithGoogle()">Sign in with Google</button>
  `;
  
  // Mock global functions
  global.alert = jest.fn();
  global.fetch = jest.fn();
  global.console.log = jest.fn();
  global.console.error = jest.fn();
  
  // Import our module after setting up mocks
  const signupModule = require('../signup.js');
  
  describe('Signup Module', () => {
    // Get references to the mocked Firebase modules
    const firebaseApp = require('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
    const { 
      getAuth, 
      GoogleAuthProvider, 
      signInWithPopup 
    } = require('https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js');
    
    // Store original location to restore later
    const originalLocation = window.location;
    
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
      
      // Reset DOM elements
      document.getElementById('first-name').value = 'John';
      document.getElementById('last-name').value = 'Doe';
      document.getElementById('role').value = 'admin';
      
      // Setup location mock
      delete window.location;
      window.location = { href: '' };
      
      // Setup fetch mock response
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          json: () => Promise.resolve({ first_name: 'John' })
        })
      );
      
      // Setup Firebase auth mock response
      signInWithPopup.mockResolvedValue({
        user: {
          uid: 'test-uid-123'
        }
      });
      
      GoogleAuthProvider.credentialFromResult = jest.fn().mockReturnValue({
        accessToken: 'mock-access-token'
      });
    });
    
    // Restore original location after each test
    afterEach(() => {
      window.location = originalLocation;
    });
  
    test('signInWithGoogle redirects admin users correctly', async () => {
      // Setup
      document.getElementById('role').value = 'admin';
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify Google sign-in was attempted
      expect(signInWithPopup).toHaveBeenCalled();
      
      // Verify user data was sent to the backend
      expect(fetch).toHaveBeenCalledWith(
        'https://backend-k52m.onrender.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: 'test-uid-123', 
            role: 'admin',
            first_name: 'John',
            last_name: 'Doe'
          })
        })
      );
      
      // Verify redirect happened
      expect(window.location.href).toBe('dashboard.html?firstname=John');
    });
  
    test('signInWithGoogle redirects facility-staff users correctly', async () => {
      // Setup
      document.getElementById('role').value = 'facility-staff';
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify correct redirection
      expect(window.location.href).toBe('dashboard.html?firstname=John');
    });
  
    test('signInWithGoogle redirects resident users correctly', async () => {
      // Setup
      document.getElementById('role').value = 'resident';
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify correct redirection
      expect(window.location.href).toBe('dashboard.html?firstname=John');
    });
  
    /*test('shows error when role is not selected', async () => {
      // Setup
      document.getElementById('role').value = '';
      
      // Call the function
      window.signInWithGoogle();
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('Please select a role before continuing.');
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });*/
  
    test('handles user already exists error correctly', async () => {
      // Setup fetch to return user exists error
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          json: () => Promise.resolve({ 
            error: 'User already exists with this UID' 
          })
        })
      );
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('User already exists. Please log in instead.');
      
      // Verify redirect to login page
      expect(window.location.href).toBe('index.html');
    });
  
    test('handles general error in user creation', async () => {
      // Setup fetch to return general error
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          json: () => Promise.resolve({ 
            error: 'Database connection error' 
          })
        })
      );
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('Error saving user: Database connection error');
    });
  
    test('handles non-JSON response from server', async () => {
      // Setup fetch to return non-JSON response
      global.fetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          headers: {
            get: jest.fn().mockReturnValue('text/html')
          },
          text: () => Promise.resolve('Internal Server Error')
        })
      );
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('Network error: Server returned non-JSON response: Internal Server Error');
    });
  
    test('handles network error', async () => {
      // Setup fetch to throw network error
      global.fetch.mockImplementation(() => 
        Promise.reject(new Error('Network failure'))
      );
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('Network error: Network failure');
    });
  
    test('handles Google sign-in failure', async () => {
      // Setup Google sign-in to fail
      signInWithPopup.mockRejectedValue(new Error('Google authentication failed'));
      
      // Call the function
      window.signInWithGoogle();
      
      // Wait for all promises to resolve
      await new Promise(process.nextTick);
      
      // Verify error alert was shown
      expect(alert).toHaveBeenCalledWith('Google authentication failed');
    });
  });
  
