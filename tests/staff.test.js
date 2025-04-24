/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

beforeEach(() => {
  fetch.resetMocks();
  document.body.innerHTML = `
    <button id="load-users">Load Users</button>
    <table id="users-table">
      <tbody></tbody>
    </table>
  `;
  jest.resetModules(); // So we reload staff.js each test
});

test('loads and displays resident users on button click', async () => {
  const mockUsers = [
    { first_name: 'Alice', last_name: 'Smith', role: 'resident', status: 'active' },
    { first_name: 'Bob', last_name: 'Jones', role: 'admin', status: 'active' }
  ];
  
  fetch.mockResponseOnce(JSON.stringify(mockUsers));

  // Import after DOM is set
  await import('../staff.js');

  const loadBtn = document.getElementById('load-users');
  fireEvent.click(loadBtn);

  // Wait for async UI update
  await new Promise(r => setTimeout(r, 0));

  const rows = document.querySelectorAll('#users-table tbody tr');
  expect(rows).toHaveLength(1); // Only 1 resident

  const cells = rows[0].querySelectorAll('td');
  expect(cells[0]).toHaveTextContent('Alice');
  expect(cells[1]).toHaveTextContent('Smith');
  expect(cells[2]).toHaveTextContent('active');
});
