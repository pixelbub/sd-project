/** @jest-environment jsdom */

// a_dashboard.test.js
// Comprehensive unit tests for a_dashboard.js using Jest and JSDOM

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

document.body.innerHTML = '';

describe('a_dashboard.js utilities and loaders', () => {
  // Import functions (ensure a_dashboard.js uses module.exports or export syntax)
  const {
    scrollToSection,
    getSelectedMonth,
    filterClosuresByMonth,
    mergeAndTotal,
    hoursInMonth,
    loadFacilityData,
    loadEventData,
    loadBookingData,
    downloadCSV,
    downloadChartPNG,
    downloadPDF,
  } = require('../a_dashboard');

  beforeEach(() => {
    fetchMock.resetMocks();
    document.body.innerHTML = '';
    jest.clearAllMocks();
    // Clear any global Chart or jsPDF stubs
    delete global.Chart;
    delete window.jspdf;

    // Mock getContext for canvas
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      // Add minimal mocks or full as needed
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    });
  });

  // Pure functions
  test('mergeAndTotal merges overlapping intervals correctly', () => {
    const intervals = [[0, 10], [5, 15], [20, 25], [24, 30]];
    expect(mergeAndTotal(intervals)).toBe(25);
  });

  test('hoursInMonth for April 2025 is 720', () => {
    expect(hoursInMonth(2025, 4)).toBe(720);
  });

  // DOM-centric utilities
  test('getSelectedMonth falls back to current month', () => {
    const input = document.createElement('input');
    input.id = 'globalMonth';
    input.value = '';
    document.body.appendChild(input);
    const today = new Date().toISOString().slice(0, 7);
    expect(getSelectedMonth()).toBe(today);
  });

  test('scrollToSection expands details and scrolls', () => {
    const section = document.createElement('div');
    section.id = 'sec';
    const details = document.createElement('details');
    details.open = false;
    section.appendChild(details);
    document.body.appendChild(section);
    section.scrollIntoView = jest.fn();

    scrollToSection('sec');
    expect(details.open).toBe(true);
    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  // Loader functions
  test('loadFacilityData populates tables and chart', async () => {
    document.body.innerHTML = `
      <select id="facilitySelect"><option value="f1">f1</option></select>
      <input id="globalMonth" value="2025-05" />
      <table id="facilityDetailsTable"><tbody></tbody></table>
      <table id="facilityStatsTable"><tbody></tbody></table>
      <canvas id="facilityPieChart"></canvas>
    `;
    const mockClosures = [
      { start_time: '2025-05-01T00:00:00Z', end_time: '2025-05-02T00:00:00Z', reason: 'R1' }
    ];
    fetchMock.mockResponseOnce(JSON.stringify(mockClosures));

    // Stub Chart.js
    global.Chart = class { constructor(_, cfg) { this.cfg = cfg; } destroy() {} };

    await loadFacilityData();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/closures?facilityId=f1'));
    expect(document.querySelectorAll('#facilityDetailsTable tbody tr').length).toBe(1);
    expect(document.querySelectorAll('#facilityStatsTable tbody tr').length).toBe(1);
  });

  test('loadEventData populates event table and chart', async () => {
    document.body.innerHTML = `
      <canvas id="eventBarChart"></canvas>
      <table id="eventTable"><tbody></tbody></table>
    `;
    const events = [
      { title: 'E1', start_time: '2025-05-01T00:00:00Z', attendance: 10 },
      { title: 'E2', start_time: '2025-05-02T00:00:00Z', expected: 5 }
    ];
    fetchMock.mockResponseOnce(JSON.stringify(events));
    global.Chart = class { constructor(_, cfg) { this.cfg = cfg; } destroy() {} };

    await loadEventData();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/admin/events/attendance'));
    expect(document.querySelectorAll('#eventTable tbody tr').length).toBe(2);
  });

  test('loadBookingData filters and populates booking table and chart', async () => {
    document.body.innerHTML = `
      <input id="globalMonth" value="2025-05" />
      <canvas id="bookingBarChart"></canvas>
      <table id="freqTable"><tbody></tbody></table>
    `;
    const bookings = [
      { facilityId: 'X', startTime: '2025-05-10T00:00:00Z', endTime: '2025-05-10T01:00:00Z' },
      { facilityId: 'Y', startTime: '2025-04-01T00:00:00Z', endTime: '2025-04-02T00:00:00Z' }
    ];
    fetchMock.mockResponseOnce(JSON.stringify(bookings));
    global.Chart = class { constructor(_, cfg) { this.cfg = cfg; } destroy() {} };

    await loadBookingData();
    const rows = document.querySelectorAll('#freqTable tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('X');
  });

  test('downloadChartPNG uses chart.toBase64Image and downloads', () => {
    const fakeChart = { toBase64Image: () => 'dataimg' };
    const link = { click: jest.fn() };
    jest.spyOn(document, 'createElement').mockReturnValue(link);

    downloadChartPNG(fakeChart, 'chart.png');
    expect(link.href).toBe('dataimg');
    expect(link.download).toBe('chart.png');
    expect(link.click).toHaveBeenCalled();
  });

  test('downloadPDF calls jsPDF methods correctly', () => {
    const addImage = jest.fn();
    const autoTable = jest.fn();
    const text = jest.fn();
    const save = jest.fn();
    window.jspdf = { jsPDF: jest.fn(() => ({ text, addImage, autoTable, save })) };
    const chart = { toBase64Image: () => 'img' };

    downloadPDF(chart, 'tbl', 'T');
    expect(window.jspdf.jsPDF).toHaveBeenCalled();
    expect(text).toHaveBeenCalledWith('T', 10, 10);
    expect(addImage).toHaveBeenCalledWith('img', 'PNG', 10, 20, 180, 100);
    expect(autoTable).toHaveBeenCalledWith({ html: '#tbl', startY: 130 });
    expect(save).toHaveBeenCalledWith('T.pdf');
  });
});
