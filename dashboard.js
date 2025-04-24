// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  let currentFacilityCapacity = 0;
  let selectedSlot = null;

  const facilitySelect = document.getElementById('facilitySelect');
  const datePick       = document.getElementById('datePick');
  const timeSlots      = document.getElementById('timeSlots');
  const groupSize      = document.getElementById('groupSize');
  const bookBtn        = document.getElementById('bookBtn');
  const loading        = document.getElementById('loading');
  const errorMessage   = document.getElementById('errorMessage');

  datePick.valueAsDate = new Date();
  datePick.min = new Date().toISOString().split('T')[0];

  // Load facilities
  fetch('https://backend-k52m.onrender.com/facilities')
    .then(res => res.json())
    .then(facilities => {
      facilities.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.facility_name} (Max: ${f.capacity})`;
        facilitySelect.appendChild(opt);
      });

      if (facilities.length) {
        currentFacilityCapacity = facilities[0].capacity;
        groupSize.max = currentFacilityCapacity;
      }
      updateAvailability();
    })
    .catch(err => {
      console.error('Error loading facilities:', err);
      errorMessage.textContent = 'Failed to load facilities. Please refresh the page.';
    });

  facilitySelect.addEventListener('change', () => {
    const capMatch = facilitySelect.selectedOptions[0].textContent.match(/Max: (\d+)/);
    currentFacilityCapacity = capMatch ? Number(capMatch[1]) : 0;
    groupSize.max = currentFacilityCapacity;
    updateAvailability();
  });
  datePick.addEventListener('change', updateAvailability);
  groupSize.addEventListener('input', updateSlotSelection);
  bookBtn.addEventListener('click', onBook);

  async function updateAvailability() {
    const facilityId = facilitySelect.value;
    const date       = datePick.value;
    if (!facilityId || !date) return;

    loading.style.display = 'block';
    timeSlots.innerHTML    = '';
    bookBtn.disabled       = true;
    errorMessage.textContent = '';
    selectedSlot = null;

    try {
      const res = await fetch(
        `https://backend-k52m.onrender.com/availability?facilityId=${facilityId}&date=${date}`
      );
      if (!res.ok) throw new Error('Failed to load availability');
      const slots = await res.json();

      if (!slots.length) {
        timeSlots.innerHTML = '<p>No available slots for this date</p>';
        return;
      }

      slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.setAttribute('type', 'button');  // ensures no form submit
        btn.className = 'time-slot';
        btn.dataset.start     = slot.start;
        btn.dataset.end       = slot.end;
        btn.dataset.remaining = slot.remainingCapacity;

        const s = new Date(slot.start);
        const e = new Date(slot.end);
        btn.innerHTML = `
          ${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –
          ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <small>${slot.remainingCapacity} spots left</small>
        `;

        btn.addEventListener('click', event => {
          event.preventDefault();           // extra safeguard
          selectTimeSlot(btn, slot);
          updateSlotSelection();
        });

        timeSlots.appendChild(btn);
      });

      updateSlotSelection();
    } catch (err) {
      console.error('Availability error:', err);
      errorMessage.textContent = 'Failed to load availability. Please try again.';
    } finally {
      loading.style.display = 'none';
    }
  }

  function selectTimeSlot(btn, slot) {
    document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSlot = btn;
    bookBtn.disabled = false;
  }

  function updateSlotSelection() {
    const size = parseInt(groupSize.value, 10);
    bookBtn.disabled = isNaN(size) || size < 1 || size > currentFacilityCapacity;

    document.querySelectorAll('.time-slot').forEach(btn => {
      const rem = Number(btn.dataset.remaining);
      const cannotFit = isNaN(size) || size < 1 || size > currentFacilityCapacity || rem < size;
      btn.disabled = cannotFit;
      btn.classList.toggle('unavailable', cannotFit);

      if (btn.classList.contains('selected') && cannotFit) {
        btn.classList.remove('selected');
        selectedSlot = null;
        bookBtn.disabled = true;
      }
    });
  }

  async function onBook() {
    if (!selectedSlot) return;
    bookBtn.disabled = true;
    bookBtn.textContent = 'Processing...';
    errorMessage.textContent = '';

    try {
      const data = {
        user_uid: localStorage.getItem('user_uid'),
        facility_id: facilitySelect.value,
        group_size: parseInt(groupSize.value, 10),
        start_time: selectedSlot.dataset.start,
        end_time: selectedSlot.dataset.end
      };

      const res = await fetch('https://backend-k52m.onrender.com/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Booking failed');
      }
      const result = await res.json();
      alert(`Booking successful! Reference: ${result.bookingId}`);
      updateAvailability();
    } catch (err) {
      console.error('Booking error:', err);
      errorMessage.textContent = err.message;
    } finally {
      bookBtn.disabled = false;
      bookBtn.textContent = 'Confirm Booking';
    }
  }

  
  
   /* // Enable/disable slots based on group size
    function updateSlotSelection() {
      const size = parseInt(groupSize.value, 10);
      bookBtn.disabled = isNaN(size) || size < 1 || size > currentFacilityCapacity;
      document.querySelectorAll('.time-slot').forEach(btn => {
        const rem = Number(btn.dataset.remaining);
        const cannotFit = isNaN(size) || size < 1 || size > currentFacilityCapacity || rem < size;
        btn.disabled = cannotFit;
        btn.classList.toggle('unavailable', cannotFit);
      });
      if (selectedSlot) {
        const rem = Number(selectedSlot.dataset.remaining);
        if (selectedSlot.disabled || rem < size) {
          selectedSlot.classList.remove('selected');
          selectedSlot = null;
          bookBtn.disabled = true;
        }
      }
    }*/
  });
  
