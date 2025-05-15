
document.addEventListener('DOMContentLoaded', () => {
  const loadButton = document.getElementById('load-users');
  const tableBody  = document.querySelector('#users-table tbody');

  // Handler for loading users
  loadButton.addEventListener('click', async () => {
    loadButton.disabled = true;
    loadButton.textContent = 'Loading…';
  
    try {
      const res = await fetch('/users');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const users = await res.json();
  
      tableBody.innerHTML = '';
  
      // filter by resident role
      users
        .filter(u => u.role === 'resident')
        .forEach(user => {
          const row = document.createElement('tr');
          ['first_name','last_name','status'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = user[key] ?? '';
            row.appendChild(td);
          });
          tableBody.appendChild(row);
        });
  
    } catch (err) {
      console.error('Failed to load users:', err);
      alert('Could not load users. See console for details.');
    } finally {
      loadButton.disabled = false;
      loadButton.textContent = 'Load Users';
    }
  });
    // 🔔 Notification system
 // Notification toggle logic
const notifBtn = document.getElementById('notifBtn');
const notifPopup = document.getElementById('notifPopup');
const notifList = document.getElementById('notifList');
const notifCount = document.getElementById('notifCount');
const notifFooter = notifPopup.querySelector('footer');
const userUid = localStorage.getItem('user_uid');

notifBtn.addEventListener('click', () => {
  if (notifPopup.style.display === 'none' || notifPopup.style.display === '') {
    notifPopup.style.display = 'block';
  } else {
    notifPopup.style.display = 'none';
  }
});

// Fetch unread notifications
async function fetchUnreadNotifications() {
  try {
    const res = await fetch(`https://backend-k52m.onrender.com/notifications/unread/${userUid}`);
    const notifications = await res.json();

    notifCount.textContent = notifications.length;
    notifCount.style.display = notifications.length ? 'inline-block' : 'none';

    notifList.innerHTML = notifications.length === 0
      ? '<li>No new notifications</li>'
      : '';

    notifications.forEach(n => {
      const li = document.createElement('li');
      li.textContent = n.message;

      const markBtn = document.createElement('button');
      markBtn.textContent = 'Mark as read';
      markBtn.style.marginLeft = '10px';
      markBtn.addEventListener('click', async () => {
        await fetch(`https://backend-k52m.onrender.com/mark-read/${userUid}/${n.id}`, {
          method: 'PATCH'
        });
        await fetchUnreadNotifications();
      });

      li.appendChild(markBtn);
      notifList.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

// Initial load
fetchUnreadNotifications();
});  
