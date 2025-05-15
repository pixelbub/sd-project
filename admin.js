document.addEventListener('DOMContentLoaded', () => {
  const loadUsersBtn = document.getElementById('load-users');
  const tableBody = document.querySelector('#users-table tbody');

  fetch('/api/hello')
  .then(res => res.json())
  .then(data => {
    console.log(data.message); // Should print: Hello from backend!
  });
  

  if (!loadUsersBtn || !tableBody ) return;

  loadUsersBtn.addEventListener('click', async () => {
    loadUsersBtn.disabled = true;
    loadUsersBtn.textContent = 'Loading…';
    try {
      const response = await fetch('/users');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const users = await response.json();

      // Clear existing rows
      tableBody.innerHTML = '';

      users.forEach(user => {
        const row = document.createElement('tr');

        // first_name, last_name, role
        ['first_name', 'last_name','uid','role'].forEach(key => {
          const cell = document.createElement('td');
          cell.textContent = user[key] ?? '';
          row.appendChild(cell);
        });

        // Status dropdown
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

        // Actions (Update + Delete)
        const actionsCell = document.createElement('td');

        // Update button
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.addEventListener('click', async () => {
          try {
            const res = await fetch(
              `/users/${user.uid}/status`,
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
              `/users/${user.uid}`,
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


});

