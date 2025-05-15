// Main initialization function
const initBookingManager = () => {
    const loadBookingsBtn = document.getElementById('load-bookings');
    const bookingsTableBody = document.querySelector('#bookings-table tbody');
    if (!loadBookingsBtn || !bookingsTableBody) return;
    
    loadBookingsBtn.addEventListener('click', async () => {
      loadBookingsBtn.disabled = true;
      loadBookingsBtn.textContent = 'Loading…';
      try {
        const response = await fetch('/bookings?status=pending');
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const bookings = await response.json();
        bookingsTableBody.innerHTML = '';
        if (bookings.length === 0) {
          bookingsTableBody.innerHTML = '<tr><td colspan="5">No pending bookings found</td></tr>';
          return;
        }
        bookings.forEach(booking => {
          const row = document.createElement('tr');
          row.dataset.bookingId = booking.id;
          // Facility
          ['facilityId', 'startTime', 'endTime', 'status'].forEach((key, i) => {
            const cell = document.createElement('td');
            if (key === 'startTime' || key === 'endTime') {
              cell.textContent = formatFirestoreTimestamp(booking[key]);
            } else {
              cell.textContent = booking[key] || (key === 'facilityId' ? 'N/A' : 'pending');
            }
            row.appendChild(cell);
          });
          // Actions (Approve + Block)
          const actionsCell = document.createElement('td');
          ['approved', 'blocked'].forEach((action, idx) => {
            const btn = document.createElement('button');
            btn.textContent = action.charAt(0).toUpperCase() + action.slice(1);
            btn.style.marginLeft = idx ? '8px' : '0';
            btn.addEventListener('click', () => updateBookingStatus(row.dataset.bookingId, action, row));
            actionsCell.appendChild(btn);
          });
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
};
  
  // Helpers
async function updateBookingStatus(bookingId, status, rowElement) {
    if (!bookingId) {
      alert('Error: No booking ID found');
      return;
    }
    try {
      const res = await fetch(
        `/bookings/${bookingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      alert(result.message || `Booking ${status} successfully`);
      rowElement.remove();
    } catch (err) {
      console.error('Error updating booking:', err);
      alert(`Error updating booking: ${err.message}`);
    }
}
  
function formatFirestoreTimestamp(timestamp) {
    try {
      if (timestamp instanceof Date) return timestamp.toLocaleString();
      if (typeof timestamp === 'string') {
        const d = new Date(timestamp);
        return isNaN(d) ? 'Invalid date' : d.toLocaleString();
      }
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString();
      }
      if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }
      return 'Invalid date';
    } catch {
      return 'Date error';
    }
}
  
  // Initialization on page load
document.addEventListener('DOMContentLoaded', initBookingManager);
  
// Export for testing - only used in test environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initBookingManager,
      updateBookingStatus,
      formatFirestoreTimestamp
    };
}
  