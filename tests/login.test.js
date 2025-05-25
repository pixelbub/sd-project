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
  <button onclick="signInWithGoogleLogin()">Login with Google</button>
`;

// Mock global functions
global.alert = jest.fn();
global.fetch = jest.fn();
global.console.log = jest.fn();
global.console.error = jest.fn();
global.localStorage = {
  setItem: jest.fn(),
  getItem: jest.fn()
};

// Import our module after setting up mocks
const loginModule = require('../login.js');

describe('Login Module', () => {
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
    
    // Setup location mock
    delete window.location;
    window.location = { href: '' };
    
    // Setup fetch mock response for successful login
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'admin',
          status: 'active'
        })
      })
    );
    
    // Setup Firebase auth mock response
    signInWithPopup.mockResolvedValue({
      user: {
        uid: 'test-uid-123',
        displayName: 'John Doe'
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

  test('signInWithGoogleLogin redirects pending admin users correctly', async () => {
    // Setup fetch to return pending admin
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'admin',
          status: 'pending'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert messages
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    expect(alert).toHaveBeenCalledWith('Your account is still pending approval. .');
    
    // Verify redirect happened to dashboard
    expect(window.location.href).toBe('dashboard.html?first_name=John');
  });

  test('signInWithGoogleLogin blocks admin users with blocked status', async () => {
    // Setup fetch to return blocked admin
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'admin',
          status: 'blocked'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert messages
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    expect(alert).toHaveBeenCalledWith('Your account has been blocked. Please contact support.');
    
    // Verify no redirect happened (stays empty)
    expect(window.location.href).toBe('');
  });

  test('signInWithGoogleLogin redirects active facility-staff users correctly', async () => {
    // Setup fetch to return active facility-staff
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'facility-staff',
          status: 'active'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert was shown
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    
    // Verify redirect happened to facility staff home
    expect(window.location.href).toBe('staffHome.html?first_name=John');
  });

  test('signInWithGoogleLogin redirects pending facility-staff users correctly', async () => {
    // Setup fetch to return pending facility-staff
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'facility-staff',
          status: 'pending'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert messages
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    expect(alert).toHaveBeenCalledWith('Your account is still pending approval. .');
    
    // Verify redirect happened to dashboard
    expect(window.location.href).toBe('dashboard.html?first_name=John');
  });

  test('signInWithGoogleLogin blocks facility-staff users with blocked status', async () => {
    // Setup fetch to return blocked facility-staff
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'facility-staff',
          status: 'blocked'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert messages
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    expect(alert).toHaveBeenCalledWith('Your account has been blocked. Please contact support.');
    
    // Verify no redirect happened
    expect(window.location.href).toBe('');
  });

  test('signInWithGoogleLogin redirects resident users correctly', async () => {
    // Setup fetch to return resident
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'resident',
          status: 'active'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert was shown
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    
    // Verify redirect happened to resident dashboard
    expect(window.location.href).toBe('dashboard.html?first_name=John');
  });

  test('signInWithGoogleLogin blocks resident users with blocked status', async () => {
    // Setup fetch to return blocked resident
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          first_name: 'John',
          role: 'resident',
          status: 'blocked'
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify alert messages
    expect(alert).toHaveBeenCalledWith('Welcome back, John!');
    expect(alert).toHaveBeenCalledWith('Your account has been blocked. Please contact support.');
    
    // Verify no redirect happened
    expect(window.location.href).toBe('');
  });

  test('redirects to signup when user not found', async () => {
    // Setup fetch to return user not found error
    global.fetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: () => Promise.resolve({ 
          error: 'User not found' 
        })
      })
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify error alert was shown
    expect(alert).toHaveBeenCalledWith('User not found');
    
    // Verify redirect to signup page
    expect(window.location.href).toBe('testsignup.html');
  });

  test('handles network error when calling the backend', async () => {
    // Setup fetch to throw network error
    global.fetch.mockImplementation(() => 
      Promise.reject(new Error('Network failure'))
    );
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify error alert was shown
    expect(alert).toHaveBeenCalledWith('Network error: Network failure');
  });

  test('handles Google sign-in failure', async () => {
    // Setup Google sign-in to fail
    signInWithPopup.mockRejectedValue(new Error('Google authentication failed'));
    
    // Call the function
    window.signInWithGoogleLogin();
    
    // Wait for all promises to resolve
    await new Promise(process.nextTick);
    
    // Verify error alert was shown
    expect(alert).toHaveBeenCalledWith('Sign in error: Google authentication failed');
  });
});
