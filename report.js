// Export the functions for testing
export function loadFacilities(facilitySelect) {
  return fetch('https://backend-k52m.onrender.com/facilities')
    .then(res => res.json())
    .then(facilities => {
      facilities.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.facility_name;
        facilitySelect.appendChild(opt);
      });
      return facilities;
    });
}

export async function handleReportSubmit(e, user_uid, formMsg, reportForm, facilitySelect) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const facility_id = facilitySelect.value;

  const reportData = {
    user_uid,
    title,
    description,
    facility_id,
    status: 'pending'
  };

  const res = await fetch('https://backend-k52m.onrender.com/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });

  if (res.ok) {
    formMsg.textContent = 'Report submitted!';
    formMsg.style.color = 'green';
    reportForm.reset();
    return true;
  } else {
    const err = await res.json();
    formMsg.textContent = 'Failed to submit report: ' + err.error;
    formMsg.style.color = 'red';
    return false;
  }
}

export async function fetchNotifications(user_uid) {
  const res = await fetch(`https://backend-k52m.onrender.com/notifications?user_uid=${user_uid}`);
  const { unreadCount, notifications } = await res.json();

  // Update notification badge
  document.getElementById('notificationBadge').textContent = unreadCount;

  // Render notifications
  const notifList = document.getElementById('notificationList');
  notifList.innerHTML = '';
  notifications.forEach(n => {
    const li = document.createElement('li');
    li.textContent = n.message;
    if (!n.read) li.classList.add('unread');
    notifList.appendChild(li);
  });

  return { unreadCount, notifications };
}

export async function loadUserReports(user_uid, reportsTableBody) {
  const res = await fetch(`https://backend-k52m.onrender.com/reports?user_uid=${user_uid}`);
  const reports = await res.json();

  reportsTableBody.innerHTML = ''; // Clear current table

  reports.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.title}</td>
      <td>${r.status}</td>
      <td>${r.description}</td>
      <td>${r.facility_name || 'N/A'}</td>
      <td>${r.feedback || ''}</td>
    `;
    reportsTableBody.appendChild(tr);
  });

  return reports;
}

// Keep the original initialization code
document.addEventListener('DOMContentLoaded', () => {
  const reportForm = document.getElementById('reportForm');
  const reportsTableBody = document.getElementById('reportsTableBody');
  const facilitySelect = document.getElementById('facilitySelect');
  const formMsg = document.getElementById('formMsg');

  const user_uid = localStorage.getItem('user_uid');

  // Load facilities into the select dropdown
  loadFacilities(facilitySelect);

  // Submit report
  reportForm.addEventListener('submit', async (e) => {
    const result = await handleReportSubmit(e, user_uid, formMsg, reportForm, facilitySelect);
    if (result) {
      loadUserReports(user_uid, reportsTableBody);
    }
  });

  // Load user's own reports
  loadUserReports(user_uid, reportsTableBody);
});
