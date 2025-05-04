document.addEventListener('DOMContentLoaded', () => {
  const loadReportsBtn     = document.getElementById('load-reports');
  const reportsTableBody   = document.getElementById('reportsTableBody');

  if (!loadReportsBtn || !reportsTableBody) return;

  // Attach click to load reports on demand
  loadReportsBtn.addEventListener('click', loadAllReports);
  
  async function loadAllReports() {
    loadReportsBtn.disabled = true;
    loadReportsBtn.textContent = 'Loading…';
    try {
      const res = await fetch('https://backend-k52m.onrender.com/admin/reports');
      console.log('Fetch /admin/reports →', res.status);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const reports = await res.json();
      console.log('Got reports:', reports);

      reportsTableBody.innerHTML = '';
      
      reports.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.title}</td>
          <td>${r.description}</td>
          <td>${r.facility_name || 'N/A'}</td>
          <td>${r.user_uid}</td>
          <td>
            <select class="statusSelect" data-id="${r.id}">
              <option value="pending"     ${r.status==='pending'?     'selected':''}>Pending</option>
              <option value="in_progress" ${r.status==='in_progress'? 'selected':''}>In Progress</option>
              <option value="solved"      ${r.status==='solved'?      'selected':''}>Solved</option>
            </select>
          </td>
          <td>
            <input type="text" class="feedbackInput" data-id="${r.id}"
                   placeholder="Feedback…" value="${r.feedback||''}" />
            <button class="saveBtn" data-id="${r.id}">💾</button>
          </td>`;
        reportsTableBody.appendChild(tr);
      });

      // Now that rows are in the DOM, wire up their event listeners
      addEventListeners();

    } catch (err) {
      reportsTableBody.innerHTML = `
        <tr><td colspan="6" style="color:red">
          Error loading reports: ${err.message}
        </td></tr>`;
      console.error(err);
    } finally {
      loadReportsBtn.disabled = false;
      loadReportsBtn.textContent = 'Load Reports';
    }
  }

  // Helper: attach change on status selects and click on save buttons
  function addEventListeners() {
    // Status change
    document.querySelectorAll('.statusSelect').forEach(select => {
      select.addEventListener('change', async () => {
        const reportId = select.dataset.id;
        const newStatus = select.value;
        await updateReport(reportId, { status: newStatus });
      });
    });

    // Save feedback
    document.querySelectorAll('.saveBtn').forEach(button => {
      button.addEventListener('click', async () => {
        const reportId = button.dataset.id;
        const feedbackInput = document.querySelector(`.feedbackInput[data-id="${reportId}"]`);
        const feedback = feedbackInput.value.trim();
        await updateReport(reportId, { feedback });
      });
    });
  }

  // Helper: PATCH update a report
  async function updateReport(reportId, update) {
    try {
      const res = await fetch(`https://backend-k52m.onrender.com/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
      if (!res.ok) {
        const error = await res.json();
        alert(`Update failed: ${error.error}`);
      } else {
        alert('Update successful');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      alert(`Error updating report: ${err.message}`);
    }
  }
});