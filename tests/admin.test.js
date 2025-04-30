/**
 * @jest-environment jsdom
 */

import '../src/admin';
import { fireEvent } from '@testing-library/dom';

// Mock global fetch
global.fetch = jest.fn();

// This import is needed for the `.not.toBeInTheDocument()` matcher
import '@testing-library/jest-dom';

beforeEach(() => {
  document.body.innerHTML = `
    <button id="load-users">Load Users</button>
    <button id="load-bookings">Load Pending Bookings</button>
    <input id="search-users" />
    <input id="search-bookings" />
    <table id="users-table"><tbody></tbody></table>
    <table id="bookings-table"><tbody></tbody></table>
  `;
  jest.clearAllMocks();
});

describe('Admin Panel', () => {
  it('loads users and populates the table', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { uid: '1', first_name: 'Alice', last_name: 'Smith', role: 'admin', status: 'active' },
        { uid: '2', first_name: 'Bob', last_name: 'Brown', role: 'user', status: 'pending' }
      ],
    });

    const loadUsersBtn = document.getElementById('load-users');
    fireEvent.click(loadUsersBtn);

    await new Promise(r => setTimeout(r, 0));

    const rows = document.querySelectorAll('#users-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[1].textContent).toContain('Bob');
  });

  it('updates user status when clicking Update', async () => {
    // Setup table manually
    document.querySelector('#users-table tbody').innerHTML = `
      <tr>
        <td>Alice</td><td>Smith</td><td>admin</td>
        <td><select><option value="pending">pending</option><option value="active" selected>active</option></select></td>
        <td><button>Update</button><button>Delete</button></td>
      </tr>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Status updated' }),
    });

    const updateBtn = document.querySelector('button');
    fireEvent.click(updateBtn);

    await new Promise(r => setTimeout(r, 0));

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/'), expect.objectContaining({
      method: 'PATCH',
    }));
  });

  it('deletes a user when clicking Delete', async () => {
    document.querySelector('#users-table tbody').innerHTML = `
      <tr id="user-row">
        <td>Alice</td><td>Smith</td><td>admin</td>
        <td><select><option value="pending">pending</option></select></td>
        <td><button>Update</button><button id="delete-btn">Delete</button></td>
      </tr>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'User deleted' }),
    });

    const deleteBtn = document.getElementById('delete-btn');
    fireEvent.click(deleteBtn);

    await new Promise(r => setTimeout(r, 0));

    const userRow = document.getElementById('user-row');
    expect(userRow).not.toBeInTheDocument();
  });

  it('loads pending bookings into the bookings table', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'b1', facilityId: 'Gym', startTime: new Date().toISOString(), endTime: new Date().toISOString(), status: 'pending' }
      ],
    });

    const loadBookingsBtn = document.getElementById('load-bookings');
    fireEvent.click(loadBookingsBtn);

    await new Promise(r => setTimeout(r, 0));

    const bookingRows = document.querySelectorAll('#bookings-table tbody tr');
    expect(bookingRows.length).toBe(1);
    expect(bookingRows[0].textContent).toContain('Gym');
  });

  it('approves a booking when Approve button clicked', async () => {
    document.querySelector('#bookings-table tbody').innerHTML = `
      <tr data-booking-id="b1">
        <td>Gym</td><td>Start</td><td>End</td><td>pending</td>
        <td>
          <button class="approve-btn">Approve</button>
          <button class="block-btn">Block</button>
        </td>
      </tr>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Booking approved' }),
    });

    const approveBtn = document.querySelector('.approve-btn');
    fireEvent.click(approveBtn);

    await new Promise(r => setTimeout(r, 0));

    const bookingRow = document.querySelector('[data-booking-id="b1"]');
    expect(bookingRow).not.toBeInTheDocument();
  });

  it('blocks a booking when Block button clicked', async () => {
    document.querySelector('#bookings-table tbody').innerHTML = `
      <tr data-booking-id="b2">
        <td>Gym</td><td>Start</td><td>End</td><td>pending</td>
        <td>
          <button class="approve-btn">Approve</button>
          <button class="block-btn">Block</button>
        </td>
      </tr>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Booking blocked' }),
    });

    const blockBtn = document.querySelector('.block-btn');
    fireEvent.click(blockBtn);

    await new Promise(r => setTimeout(r, 0));

    const bookingRow = document.querySelector('[data-booking-id="b2"]');
    expect(bookingRow).not.toBeInTheDocument();
  });

  it('filters users when typing into user search input', async () => {
    document.querySelector('#users-table tbody').innerHTML = `
      <tr><td>Alice</td><td>Smith</td></tr>
      <tr><td>Bob</td><td>Brown</td></tr>
    `;

    const searchInput = document.getElementById('search-users');
    fireEvent.input(searchInput, { target: { value: 'alice' } });

    const rows = document.querySelectorAll('#users-table tbody tr');
    expect(rows[0].style.display).toBe('');
    expect(rows[1].style.display).toBe('none');
  });

  it('filters bookings when typing into booking search input', async () => {
    document.querySelector('#bookings-table tbody').innerHTML = `
      <tr><td>Gym</td></tr>
      <tr><td>Pool</td></tr>
    `;

    const searchInput = document.getElementById('search-bookings');
    fireEvent.input(searchInput, { target: { value: 'gym' } });

    const rows = document.querySelectorAll('#bookings-table tbody tr');
    expect(rows[0].style.display).toBe('');
    expect(rows[1].style.display).toBe('none');
  });

  it('shows error if loading users fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const loadUsersBtn = document.getElementById('load-users');
    fireEvent.click(loadUsersBtn);

    await new Promise(r => setTimeout(r, 0));

    expect(fetch).toHaveBeenCalled();
  });

  it('shows error if loading bookings fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const loadBookingsBtn = document.getElementById('load-bookings');
    fireEvent.click(loadBookingsBtn);

    await new Promise(r => setTimeout(r, 0));

    expect(fetch).toHaveBeenCalled();
  });
});
