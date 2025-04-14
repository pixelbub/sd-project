// signup.test.js
import { signInWithGoogle } from './signup';

jest.mock('./firebaseConfig.js', () => {
  return {
    auth: {},
    GoogleAuthProvider: class {
      static credentialFromResult(result) {
        return { accessToken: 'mockToken' };
      }
    },
    signInWithPopup: jest.fn(() =>
      Promise.resolve({
        user: { uid: '12345', email: 'test@example.com' },
      })
    ),
  };
});

describe('signInWithGoogle', () => {
  it('should return user info on successful sign-in', async () => {
    const user = await signInWithGoogle();
    expect(user.uid).toBe('12345');
  });

  it('should throw an error on failure', async () => {
    const { signInWithPopup } = require('./firebaseConfig.js');
    signInWithPopup.mockImplementationOnce(() => Promise.reject(new Error('Popup failed')));
    
    await expect(signInWithGoogle()).rejects.toThrow('Popup failed');
  });
});
