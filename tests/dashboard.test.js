// __tests__/dashboard.test.js

/**
 * To run these tests, make sure you have jest and jsdom installed:
 * npm install --save-dev jest jsdom
 *
 * Ensure that your dashboard.js exports the functions you want to test, for example:
 *
 * // dashboard.js
 * export function sum(a, b) { return a + b; }
 * export function selectTimeSlot(btn, slot) { /* ... */ }
 * export function updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedSlotRef }) { /* ... */ }
 *
 * Then in your package.json scripts:
 * "test": "jest"
 */

import { JSDOM } from 'jsdom';
import { sum, selectTimeSlot, updateSlotSelection } from '../dashboard';

// Helper to create a button element mimicking time-slot
function createTimeSlot(dataset) {
  const btn = document.createElement('button');
  btn.className = 'time-slot';
  Object.keys(dataset).forEach(key => {
    btn.dataset[key] = dataset[key];
  });
  return btn;
}

describe('sum()', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});

describe('selectTimeSlot()', () => {
  let dom;
  let slotsContainer;
  let btn1, btn2;
  let selected;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body><div id="timeSlots"></div><button id="bookBtn"></button></body>`);
    global.document = dom.window.document;
    global.window = dom.window;

    slotsContainer = document.getElementById('timeSlots');
    btn1 = createTimeSlot({ start: '2025-04-24T10:00:00', end: '2025-04-24T11:00:00', remaining: '5' });
    btn2 = createTimeSlot({ start: '2025-04-24T11:00:00', end: '2025-04-24T12:00:00', remaining: '2' });
    slotsContainer.appendChild(btn1);
    slotsContainer.appendChild(btn2);

    // reference for selectedSlot by selectTimeSlot
    selected = { current: null };
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'bookBtn') return document.querySelector('#bookBtn');
      return null;
    });
  });

  test('marks only clicked slot as selected and enables bookBtn', () => {
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.disabled = true;

    selectTimeSlot(btn1, { start: btn1.dataset.start, end: btn1.dataset.end, remainingCapacity: btn1.dataset.remaining }, selected);

    expect(btn1.classList.contains('selected')).toBe(true);
    expect(btn2.classList.contains('selected')).toBe(false);
    expect(bookBtn.disabled).toBe(false);
    expect(selected.current).toBe(btn1);
  });
});

describe('updateSlotSelection()', () => {
  let dom; let groupSize; let bookBtn; let slots; let currentCapacity;
  let selectedRef;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body>
      <input id="groupSize" type="number" />
      <button id="bookBtn">Confirm Booking</button>
      <div id="timeSlots"></div>
    </body>`);
    global.document = dom.window.document;
    global.window = dom.window;

    groupSize = document.getElementById('groupSize');
    bookBtn   = document.getElementById('bookBtn');
    currentCapacity = 5;
    slots = [
      createTimeSlot({ remaining: '5' }),
      createTimeSlot({ remaining: '2' }),
    ];
    slots.forEach(btn => document.getElementById('timeSlots').appendChild(btn));
    selectedRef = { current: null };
  });

  test('disables bookBtn if groupSize is invalid', () => {
    groupSize.value = '';
    updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedRef });
    expect(bookBtn.disabled).toBe(true);

    groupSize.value = '0';
    updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedRef });
    expect(bookBtn.disabled).toBe(true);

    groupSize.value = '10';
    updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedRef });
    expect(bookBtn.disabled).toBe(true);
  });

  test('disables individual slots when remaining < groupSize', () => {
    groupSize.value = '3';
    updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedRef });

    expect(slots[0].disabled).toBe(false);
    expect(slots[1].disabled).toBe(true);
    expect(slots[1].classList.contains('unavailable')).toBe(true);
  });

  test('deselects selectedRef if not enough remaining capacity', () => {
    groupSize.value = '3';
    // simulate a selected slot that's insufficient
    selectedRef.current = slots[1];
    slots[1].classList.add('selected');

    updateSlotSelection({ groupSize, bookBtn, slots, currentCapacity, selectedRef });

    expect(slots[1].classList.contains('selected')).toBe(false);
    expect(selectedRef.current).toBe(null);
    expect(bookBtn.disabled).toBe(true);
  });
});
