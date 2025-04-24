// app.js

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const loadButton = document.getElementById('load-users');
  const tableBody  = document.querySelector('#users-table tbody');

  // Handler for loading users
  loadButton.addEventListener('click', async () => {
    loadButton.disabled = true;
    loadButton.textContent = 'Loading…';
  
    try {
      const res = await fetch('https://backend-k52m.onrender.com/users');
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
});  