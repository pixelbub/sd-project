// index.js
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin using your service account JSON.
// Make sure the file path is correct and that the file is deployed along with your app.
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "sd-project-c2b6c",
    clientEmail: "firebase-adminsdk-fbsvc@sd-project-c2b6c.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC79ANVPZcMyla5\n3Y96UjNDQjnF0PQE0cSUV820UPJMWTyKnAi7pjroPVf29zQOSXA6EVGCqXACHo9/\nLe8AK4OiCpTxUT4QxO+6cUgOJa3QEkXck+jDe+gpPTkSp5jb5QXVW0p3cIvSpRsP\nfiN9o5LfSfnzblxKdtvej36fhMLjjUxZcSt2GsvlrKCf7Dgm7IRlvvuc/LW2zbzs\nR6/ZblXZyeAvJ9h5rZaWBJjE7fPq/tgJklIHMNyjnS4W05d84EOZW5Gc/bZXE3Xq\nRcd+5Qjsuzatd7FzK5lGSe0qz1MOblkTk6U1h9UpS8osJmJUlBzhzzDjnLznJUJ3\n4CEz/HNnAgMBAAECggEAASj55kpJhuIu09nau1oLh/Q+MArgnrD+wh2inuTLAg6g\n8YgSA7p8bZeHVfZjo1zvrOQTeTd7gf/XSeUqLvmVx+fB0JV8SRU2F5QAalnwLzMV\nrE1bZ+15WtvOYN+Y8W6B8TWtiXwv2L59IsTYCjv6uZcWzFpXhnwiUkbXdLuYilf/\nsguN23+g0kjPiWoHU5s9YmzJGhwAwxKh7vN4Luu4gw59cKZOm1926wiZ0D8F8b9H\noMdEPjjEQblWIOBtXZUYfjcoqDQK7O/oa7W1hngC2J/1uPkfUOsWwpITvu22R3Nj\nBgAho/Qyv9AKEQ1IZzX6sFKR4bH79qx9UDo3FT/m0QKBgQDz5X4y7Ty+1JXRWgQQ\n/2D7IsYlzvMLdFCgqFQxt6qxAlQdn7p3H55ouF0QciZrBKnkLyPijeNOfRQFR4/e\n0BtP/rRDd+ylX2PG4q2xcGHjCNSA0jup49gp2H4ZntnQ82fr0PVuwTa9e2WCS7bo\niomk3AZdmNydvppNkUdw+jYq8QKBgQDFR85TUdDf3wIJrBNaVRIHarxgyduL1WI1\nhxkQZYsLMVPnLc6ucwNJZbYvgCI7hGj3nRvUvfbdRDjghsO57z8MuO+IxgIcsEa3\nLsAgEfhZEUZfMbiGHDOtqqfeTVSgEHpCnLSXOySpjR+iAR/C5BA6cTXeMxo05Imy\n8addVzaT1wKBgHAbUMK/4Wgl9ydfpPbbLAzDkyjV00m0kUsHlIu1zLPISjnDrcYL\ntpiUBdMFZTtTzXOhZ3E/nvf47jbvCeZ06dj/ToSknxX0nrxQfV5ONfBRorwD5oDU\nxguWA4BrT9uHxoDSb74U+cBm8+XMP6rr4xDwQczL8rxfXDXDTX9Uw4lBAoGAeAhH\nllRqdTwX3lCveb/W92JO+cj35u3PEmh/rIVMA2Rg+4DYhzX9YvQa1G3u5i2bPEWA\nQIHQqTIwNRRqFEBoKVKAk8R+Vnw+mog8Z4bnhzHGkncLIbYZD2qNNunwOm+sI8l6\n66UVmn/+JjDu5UKkSRrGvspzAImo6pKz1UwSLgMCgYEAlLpEWP/YSdGeADGJFw5o\nkZ5wN+8BKGhDkCe7pAYPQRqmKzqaVrgJvNdnE53G12pc2YNkGmzPvNxnAS6uLGDx\n/ly7i0h1zHJ29VCh7CLCgImas2g3yWvtY9JR1Cicu9rR9Xqaq6jybBf+iacIFkcF\nFOJvqFgHgDlY49wFo7bTZiw=\n-----END PRIVATE KEY-----\n"
  })
});

// Initialize Firestore
const db = admin.firestore();

const app = express();
// Use the dynamic port provided by Render, falling back to 3000 if needed.
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Optional: Set COOP header to avoid some popup warnings.
// NOTE: Adjust this only if it fits your security model.
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Configure CORS.
// Add all origins you expect (both your deployed front-end and local testing).
app.use(
  cors({
    origin: ['https://tinogozho.github.io', 'http://localhost:8000']
  })
);

app.get('/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // User not found – advise them to sign up.
      return res.status(404).json({ error: 'User not found, please sign up first.' });
    }

    // Return the user's data (for now, just the first name).
    const userData = userDoc.data();
    res.json({ 
      success: true, 
      first_name: userData.first_name, 
      role: userData.role 
    });
    
  } catch (error) {
    console.error('Error fetching user document:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST endpoint to add/update a user document in Firestore.
// index.js (backend)
app.post('/users', async (req, res) => {
  try {
    const { uid, role, first_name, last_name } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: 'Missing uid or role' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // User already exists
      return res.status(400).json({ error: 'User already exists. Please log in instead.' });
    }

    // Create new user
    await userRef.set({
      role,
      first_name,
      last_name,
      status: 'pending'
    });

    console.log(`User document for ${uid} created successfully.`);

    res.json({ success: true, first_name, role });

  } catch (error) {
    console.error('Error writing document: ', error);
    res.status(500).json({ error: error.message });
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

