// admin.js

document.addEventListener('DOMContentLoaded', () => {
  // Buttons
  const loadUsersBtn = document.getElementById('load-users');
  const loadBookingsBtn = document.getElementById('load-bookings');
  const tableBody = document.querySelector('#users-table tbody');
  const bookingsTableBody = document.querySelector('#bookings-table tbody');

  // Helper to clear table
  function clearUsersTable() {
    tableBody.innerHTML = '';
  }

  function clearBookingsTable() {
    bookingsTableBody.innerHTML = '';
  }

  // 1) USER MANAGEMENT: load, update status, delete
  loadUsersBtn.addEventListener('click', async () => {
    loadUsersBtn.disabled = true;
    loadUsersBtn.textContent = 'Loading…';
    try {
      const response = await fetch('https://backend-k52m.onrender.com/users');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const users = await response.json();

      clearUsersTable();

      users.forEach(user => {
        const row = document.createElement('tr');

        // first_name, last_name, role
        ['first_name', 'last_name', 'role'].forEach(key => {
          const cell = document.createElement('td');
          cell.textContent = user[key] ?? '';
          row.appendChild(cell);
        });

        // Status dropdown cell
        const statusCell = document.createElement('td');
        const select = document.createElement('select');
        ['pending', 'active', 'blocked'].forEach(optionValue => {
          const option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue;
          if (user.status === optionValue) option.selected = true;
          select.appendChild(option);
        });
        statusCell.appendChild(select);
        row.appendChild(statusCell);

        // Actions cell (Update + Delete)
        const actionsCell = document.createElement('td');

        // Update button
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(
              `https://backend-k52m.onrender.com/users/${user.uid}/status`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: select.value })
              }
            );
            if (!res.ok) throw new Error(`Failed to update status: ${res.status}`);
            alert(`Status updated to "${select.value}" for ${user.first_name}`);
          } catch (err) {
            console.error('Status update failed:', err);
            alert('Error updating status. See console.');
          }
        });
        actionsCell.appendChild(updateBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginLeft = '8px';
        deleteBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(
              `https://backend-k52m.onrender.com/users/${user.uid}`,
              { method: 'DELETE' }
            );
            if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
            alert(`User ${user.first_name} deleted.`);
            row.remove();
          } catch (err) {
            console.error('Delete failed:', err);
            alert('Error deleting user. See console.');
          }
        });
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Failed to load users:', err);
      alert('Could not load users. See console for details.');
    } finally {
      loadUsersBtn.disabled = false;
      loadUsersBtn.textContent = 'Load Users';
    }
  });

  // 2) BOOKING MANAGEMENT
  loadBookingsBtn.addEventListener('click', async () => {
    loadBookingsBtn.disabled = true;
    loadBookingsBtn.textContent = 'Loading…';
    try {
      const response = await fetch('https://backend-k52m.onrender.com/bookings?status=pending');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const bookings = await response.json();
      clearBookingsTable();

      if (bookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="5">No pending bookings found</td></tr>';
        return;
      }

      bookings.forEach(booking => {
        const row = document.createElement('tr');
        row.dataset.bookingId = booking.id;

        // Facility
        const facilityCell = document.createElement('td');
        facilityCell.textContent = booking.facilityId || 'N/A';
        row.appendChild(facilityCell);

        // Start Time
        const startCell = document.createElement('td');
        startCell.textContent = formatFirestoreTimestamp(booking.startTime);
        row.appendChild(startCell);

        // End Time
        const endCell = document.createElement('td');
        endCell.textContent = formatFirestoreTimestamp(booking.endTime);
        row.appendChild(endCell);

        // Status
        const statusCell = document.createElement('td');
        statusCell.textContent = booking.status || 'pending';
        row.appendChild(statusCell);

        // Actions
        const actionsCell = document.createElement('td');
        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Approve';
        approveBtn.classList.add('approve-btn');
        approveBtn.addEventListener('click', async () => {
          await updateBookingStatus(row.dataset.bookingId, 'approved', row);
        });
        actionsCell.appendChild(approveBtn);

        const blockBtn = document.createElement('button');
        blockBtn.textContent = 'Block';
        blockBtn.classList.add('block-btn');
        blockBtn.style.marginLeft = '8px';
        blockBtn.addEventListener('click', async () => {
          await updateBookingStatus(row.dataset.bookingId, 'blocked', row);
        });
        actionsCell.appendChild(blockBtn);

        row.appendChild(actionsCell);
        bookingsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Failed to load bookings:', err);
      bookingsTableBody.innerHTML = `<tr><td colspan="5">Error loading bookings: ${err.message}</td></tr>`;
    } finally {
      loadBookingsBtn.disabled = false;
      loadBookingsBtn.textContent = 'Load Pending Bookings';
    }
  });

  // Search inputs
  const userSearchInput    = document.getElementById('search-users');
  const bookingSearchInput = document.getElementById('search-bookings');

  userSearchInput.addEventListener('input', () => {
    const q = userSearchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
      const first = row.cells[0]?.textContent.toLowerCase() || '';
      const last  = row.cells[1]?.textContent.toLowerCase() || '';
      const show = first.includes(q) || last.includes(q);
      row.style.display = show ? '' : 'none';
    });
  });

  bookingSearchInput.addEventListener('input', () => {
    const q = bookingSearchInput.value.trim().toLowerCase();
    const rows = document.querySelectorAll('#bookings-table tbody tr');
    rows.forEach(row => {
      const cellText = row.cells[0]?.textContent.toLowerCase() || '';
      const show = cellText.includes(q);
      row.style.display = show ? '' : 'none';
    });
  });

  // Helper: update booking status
  async function updateBookingStatus(bookingId, status, rowElement) {
    if (!bookingId) {
      console.error('No booking ID provided');
      alert('Error: No booking ID found');
      return;
    }
    try {
      const response = await fetch(
        `https://backend-k52m.onrender.com/bookings/${bookingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      const result = await response.json();
      alert(result.message || `Booking ${status} successfully`);
      rowElement.remove();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert(`Error updating booking: ${err.message}`);
    }
  }

  // Helper: format Firestore timestamp
  function formatFirestoreTimestamp(timestamp) {
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      if (timestamp && typeof timestamp === 'object') {
        if (typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toLocaleString();
        }
        if (timestamp.seconds) {
          const date = new Date(timestamp.seconds * 1000);
          return date.toLocaleString();
        }
      }
      return 'Invalid date';
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Date error';
    }
  }

});
