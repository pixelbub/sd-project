*1 - Login, Registration, and Authentication*

Test 1.1 – Login via 3rd Party
Given the user is not logged in
When the user clicks “Continue with Google”
Then the system should redirect to Google's login screen
And return the user to the app upon successful login

Test 1.2 – Role Assignment on First Login
Given a new user logs in for the first time
When they authenticate successfully
They should be assigned their chosen role in the DB
And set as pending if they selected Admin or Facility Staff or Accepted is the selected Resident


*2 - User Management*

Test 2.1 – View Unverified Users
Given the admin is logged in
When they open the “View Users” page
Then a list of users should be visible

Test 2.2 – Approve User
Given a user is pending verification
When the admin approves the user
Then the user’s status should update in the database
And the user should be granted access according to their role

Test 2.3 – Assign Role
Given a user exists
When an admin selects a new role and confirms
Then the role should be updated in the database
And the user’s permissions should update accordingly

Test 2.4 – Revoke Access
Given a user exists
When the admin revokes access
Then the user should no longer be able to log in or use the system

*Booking System*

Test 3.1 – Make a Booking
Given a resident is logged in
When they select a facility and time slot and submit
Then the system should check availability
And create a pending booking if available
And show a confirmation message

Test 3.2 – Booking Conflict
Given a time slot is already booked
When another resident tries to book the same slot
Then the system should show an error and suggest retrying

Test 3.3 – Admin Approves Booking
Given a booking is pending
When the admin approves the booking
Then the status should be updated to approved in the system
And the resident should be notified

Test 3.4 – Admin Blocks Booking
Given a booking is pending
When the admin blocks the booking
Then the status should be updated to blocked
And the resident should be notified







