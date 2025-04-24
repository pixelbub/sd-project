// login.test.js
import { signInWithGoogleLogin } from './login.js';

jest.mock('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js', () => ({
  initializeApp: jest.fn()
}));

jest.mock('https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js', () => {
  return {
    getAuth: jest.fn(() => ({})),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn()
  };
});

import { getAuth, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

describe('signInWithGoogleLogin', () => {
  beforeEach(() => {
    fetch.resetMocks();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should redirect admin with active status to a_sHome.html', async () => {
    const mockUser = {
      uid: '12345',
      displayName: 'Admin User'
    };

    signInWithPopup.mockResolvedValue({ user: mockUser });

    fetch.mockResponseOnce(JSON.stringify({
      first_name: 'Admin',
      role: 'admin',
      status: 'active'
    }));

    // Mock alert and location
    global.alert = jest.fn();
    delete window.location;
    window.location = { href: '' };

    await signInWithGoogleLogin();

    expect(localStorage.getItem('user_uid')).toBe('12345');
    expect(window.location.href).toContain('a_sHome.html?first_name=Admin');
  });

  it('should redirect to signup if user is not found', async () => {
    const mockUser = {
      uid: '99999',
      displayName: 'New User'
    };

    signInWithPopup.mockResolvedValue({ user: mockUser });

    fetch.mockResponseOnce(JSON.stringify({ error: 'User not found' }), { status: 404 });

    global.alert = jest.fn();
    delete window.location;
    window.location = { href: '' };

    await signInWithGoogleLogin();

    expect(alert).toHaveBeenCalledWith('User not found');
    expect(window.location.href).toBe('testsignup.html');
  });

  it('should handle signInWithPopup errors gracefully', async () => {
    signInWithPopup.mockRejectedValue(new Error('Auth failed'));

    global.alert = jest.fn();
    await signInWithGoogleLogin();

    expect(alert).toHaveBeenCalledWith('Sign in error: Auth failed');
  });
});
