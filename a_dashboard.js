// a_dashboard.js

// Utility to scroll to a section by ID
function scrollToSection(id) {
  const section = document.getElementById(id);
  section.querySelector('details').open = true; // make sure it's expanded
  section.scrollIntoView({ behavior: 'smooth' });
}


// Global Chart references
let facilityChart;
let eventChart;
let bookingChart;

// Fetch current month as YYYY-MM string
function getSelectedMonth() {
  return document.getElementById('globalMonth').value || new Date().toISOString().slice(0, 7);
}

// Filter closures to only those overlapping selected month
function filterClosuresByMonth(closures, monthYYYYMM) {
  const [y, m] = monthYYYYMM.split('-').map(n => parseInt(n, 10));
  const monthStart = new Date(y, m - 1, 1, 0, 0, 0);
  const monthEnd = new Date(y, m, 0, 23, 59, 59);

  return closures.filter(c => {
    const start = new Date(c.start_time);
    const end = new Date(c.end_time);
    return start < monthEnd && end > monthStart;
  }).map(c => ({
    start: new Date(c.start_time),
    end: new Date(c.end_time),
    reason: c.reason
  }));
}

// Facility Closure Chart and Table Loader
async function loadFacilityData() {
  const facilityId = document.getElementById('facilitySelect').value;
  const [year, month] = getSelectedMonth().split('-').map(Number);

  if (!facilityId || !year || !month) {
    return alert('Please select both facility and month');
  }

  const res = await fetch(`https://backend-k52m.onrender.com/closures?facilityId=${facilityId}&month=${year}-${String(month).padStart(2, '0')}`);
  const closures = await res.json();

  // Update details table
  const reasonsTbody = document.querySelector('#facilityDetailsTable tbody');
  reasonsTbody.innerHTML = '';
  const intervals = [];

  closures.forEach(c => {
    const s = new Date(c.start_time).getTime();
    const e = new Date(c.end_time).getTime();
    intervals.push([s, e]);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(s).toLocaleString()}</td>
      <td>${new Date(e).toLocaleString()}</td>
      <td>${c.reason}</td>
    `;
    reasonsTbody.appendChild(tr);
  });

  const closedMs = mergeAndTotal(intervals);
  const closedH = closedMs / (1000 * 60 * 60);
  const totalH = hoursInMonth(year, month);
  const openH = totalH - closedH;

  // Update summary table
  const summaryTbody = document.querySelector('#facilityStatsTable tbody');
  summaryTbody.innerHTML = `
    <tr>
      <td>${facilityId}</td>
      <td>${year}-${String(month).padStart(2, '0')}</td>
      <td>${closedH.toFixed(2)}</td>
      <td>${openH.toFixed(2)}</td>
    </tr>
  `;

  // Update pie chart
  const ctx = document.getElementById('facilityPieChart').getContext('2d');
  if (facilityChart) facilityChart.destroy();
  facilityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Closed Hours', 'Open Hours'],
      datasets: [{ data: [closedH, openH], backgroundColor: ['#e74c3c', '#2ecc71'] }]
    },
    options: { responsive: true }
  });
}
function hoursInMonth(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return (end - start) / (1000 * 60 * 60);
}

function mergeAndTotal(intervals) {
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [prevStart, prevEnd] = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    if (start <= prevEnd) {
      prevEnd = Math.max(prevEnd, end);
    } else {
      total += prevEnd - prevStart;
      [prevStart, prevEnd] = [start, end];
    }
  }

  total += prevEnd - prevStart;
  return total;
}


// Load facility options on page load
async function loadFacilities() {
  const res = await fetch('https://backend-k52m.onrender.com/facilities');
  const list = await res.json();
  const sel = document.getElementById('facilitySelect');
  sel.innerHTML = '<option value="" disabled selected>Select…</option>';
  list.forEach(f => {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.name || f.id;
    sel.appendChild(o);
  });
}

// Event Attendance Chart and Table Loader
async function loadEventData() {
  const res = await fetch(`https://backend-k52m.onrender.com/admin/events/attendance`);
  const data = await res.json();

  const ctx = document.getElementById('eventBarChart').getContext('2d');
  if (eventChart) eventChart.destroy();
  eventChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.title),
      datasets: [{
        label: 'Expected Attendance',
        data: data.map(d => d.attendance || d.expected || 0),
        backgroundColor: '#3498db'
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const rows = data.map(d => `<tr><td>${d.title}</td><td>${new Date(d.start_time).toISOString().split('T')[0]}</td><td>${d.attendance || d.expected || 0}</td></tr>`).join('');
  document.querySelector('#eventTable tbody').innerHTML = rows;
}

// Booking Frequency Chart and Table Loader
async function loadBookingData() {
  const month = getSelectedMonth();
  const res = await fetch(`https://backend-k52m.onrender.com/bookings?status=approved`);
  const data = await res.json();

  const [y, m] = month.split('-').map(n => parseInt(n, 10));
  const monthStart = new Date(y, m - 1, 1, 0, 0, 0);
  const monthEnd = new Date(y, m, 0, 23, 59, 59);

  // Filter bookings to selected month
  const filtered = data.filter(b => {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    return start < monthEnd && end > monthStart;
  });

  // Count per facility
  const counts = {};
  filtered.forEach(b => {
    counts[b.facilityId] = (counts[b.facilityId] || 0) + 1;
  });

  const chartData = Object.entries(counts).map(([facilityId, count]) => ({ facilityId, count }));

  const ctx = document.getElementById('bookingBarChart').getContext('2d');
  if (bookingChart) bookingChart.destroy();
  bookingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.facilityId),
      datasets: [{
        label: 'Times Booked',
        data: chartData.map(d => d.count),
        backgroundColor: '#9b59b6'
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const rows = chartData.map(d => `<tr><td>${d.facilityId}</td><td>${d.count}</td></tr>`).join('');
  document.querySelector('#freqTable tbody').innerHTML = rows;
}

// Export helpers
function downloadCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  const rows = Array.from(table.querySelectorAll('tr'));
  const csv = rows.map(row =>
    Array.from(row.cells).map(cell => `"${cell.innerText}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function downloadChartPNG(chart, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = chart.toBase64Image();
  link.click();
}

function downloadPDF(chart, tableId, title) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(title, 10, 10);
  doc.addImage(chart.toBase64Image(), 'PNG', 10, 20, 180, 100);
  doc.autoTable({ html: `#${tableId}`, startY: 130 });
  doc.save(`${title}.pdf`);
}

// Attach Export Events
window.addEventListener('DOMContentLoaded', () => {
  loadFacilities();
  document.getElementById('globalMonth').value = new Date().toISOString().slice(0, 7);

  document.getElementById('refreshAllBtn').addEventListener('click', () => {
    loadFacilityData();
    loadEventData();
    loadBookingData();
  });

  document.getElementById('refreshFacilityBtn').addEventListener('click', loadFacilityData);
  document.getElementById('refreshEventBtn').addEventListener('click', loadEventData);
  document.getElementById('refreshBookingBtn').addEventListener('click', loadBookingData);

  document.getElementById('exportFacilityCsvBtn').addEventListener('click', () =>
    downloadCSV('facilityStatsTable', 'facility_summary.csv')
  );
  document.getElementById('exportFacilityChartBtn').addEventListener('click', () =>
    downloadChartPNG(facilityChart, 'facility_chart.png')
  );
  document.getElementById('exportFacilityPdfBtn').addEventListener('click', () =>
    downloadPDF(facilityChart, 'facilityStatsTable', 'Facility Closure Summary')
  );

  document.getElementById('exportEventCsvBtn').addEventListener('click', () =>
    downloadCSV('eventTable', 'event_attendance.csv')
  );
  document.getElementById('exportEventChartBtn').addEventListener('click', () =>
    downloadChartPNG(eventChart, 'event_chart.png')
  );
  document.getElementById('exportEventPdfBtn').addEventListener('click', () =>
    downloadPDF(eventChart, 'eventTable', 'Event Attendance')
  );

  document.getElementById('exportBookingCsvBtn').addEventListener('click', () =>
    downloadCSV('freqTable', 'booking_frequency.csv')
  );
  document.getElementById('exportBookingChartBtn').addEventListener('click', () =>
    downloadChartPNG(bookingChart, 'booking_chart.png')
  );
  document.getElementById('exportBookingPdfBtn').addEventListener('click', () =>
    downloadPDF(bookingChart, 'freqTable', 'Facility Booking Frequency')
  );
});
