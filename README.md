# Community Sports Facility Management Web-App

[![codecov](https://codecov.io/github/pixelbub/sd-project/graph/badge.svg?token=7PNF4KTZZB)](https://codecov.io/github/pixelbub/sd-project)

## Site Link
https://victorious-bush-007efa41e.6.azurestaticapps.net/

## Overview
A web app used to manage shared community sports facillities. The app supports time-slot booking and maintenance reporting which allows residents, staff and admin to interact with facility resources efficiently. It also includes Google authentication, role-based access control, and a dashboard with exportable reports.

## Features
- Google authentication for all users
- Admin/staff suer management (add/delete/block users)
- Facility booking and booking approval system
- Event publishing, viewing and RSVP
- Maintenance issue reporting and status tracking
- Dashboard with stats and downloadable reports (PDF)
- Real time notifications for status updates

## Tech Stack 
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Authentication: Firebase
- Database: Firebase Firestore
- CI/CD: Github Actions
- Testing: Jest

## Roles
- **Resident**: Book facilities, report issues.
  
  **Login**: wstill675@gmail.com
  **Password**: WillStill99@?

- **Staff**: Update maintenance status  
  **Login**: thecarguido@gmail.com  
  **Password**: lightningMcQu33n

- **Admin**: Manage users and bookings, create events, view facility insights  
  **Login**: tina.nina33341@gmail.com  
  **Password**: tinanina333


## Running the App Locally

### Frontend Only

1. **Clone the repository**

   ```bash
   git clone https://github.com/pixelbub/sd-project.git
   cd sd-project
   ```

2. **Start a local server**

   ```bash
   python -m http.server 8000
   ```

3. **Open your browser and go to:**

   ```
   http://localhost:8000/
   ```

This will allow you to test the frontend locally.

---

### Full Stack (Frontend + Backend)

#### Step 1: Clone the Frontend  
Follow the instructions in the **Frontend Only** section above.

#### Step 2: Clone and Run the Backend

1. **Clone the backend repository**
   ```bash
   git clone https://github.com/TinoGozho/backend.git
   cd backend
   ```
2. **Initialize and run the backend**
   ```bash
   npm init -y
   npm install cors  # If you don’t have cors installed
   node index.js
   ```
3. **Update API URLs in the frontend**

   In your frontend JavaScript files, replace any instance of:
   ```
   https://backendk52m.onrender.com/
   ```
   with:
   ```
   http://localhost:3000/
   ```


