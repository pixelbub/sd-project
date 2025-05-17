    function safeToDate(ts) {
      if (!ts) return null;
      try {
        return ts.toDate ? ts.toDate() : new Date(ts);
      } catch {
        return null;
      }
    }

    function calculateDaysLeft(date) {
      
      const now = new Date();
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffMs = start - today;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    async function loadEvents() {
      const user_uid = localStorage.getItem('user_uid');
      if (!user_uid) return alert('No user logged in');

      try {
        const [eventRes, rsvpRes] = await Promise.all([
          fetch('/events/upcoming'),
          fetch(`/users/${user_uid}/rsvps`)
        ]);

        const events = await eventRes.json();
        const userRsvps = await rsvpRes.json();
        const rsvpEventIds = userRsvps.map(r => r.event_id);

        document.getElementById('loading').style.display = 'none';
        const container = document.getElementById('events-container');
        const noEvents = document.getElementById('no-events');

        const publicEvents = events.filter(e => !e.private);

        if (publicEvents.length === 0) {
          noEvents.style.display = 'block';
          return;
        }

        container.style.display = 'grid';

        publicEvents.forEach(event => {
          const card = document.createElement('article');
          card.className = 'event-card';

          const startDate = safeToDate(event.startTime);
          const endDate = safeToDate(event.endTime);

          const startStr = startDate && !isNaN(startDate) ? startDate.toLocaleString() : 'Unknown Start';
          const endStr = endDate && !isNaN(endDate) ? endDate.toLocaleString() : 'Unknown End';
          const facility = event.facilityId || 'Not specified';
          const title = event.title || 'Untitled Event';
          const description = event.description || '';

          let daysLeftText = '';
          if (startDate) {
            const daysLeft = calculateDaysLeft(startDate);
            if (daysLeft > 1) daysLeftText = `${daysLeft} days left`;
            else if (daysLeft === 1) daysLeftText = `1 day left`;
            else if (daysLeft === 0) daysLeftText = `Today`;
            else daysLeftText = `Started`;
          }

          card.innerHTML = `
            <div class="event-title">${title}</div>
            <div class="event-detail"><strong>Facility:</strong> ${facility}</div>
            <div class="event-detail"><strong>Start:</strong> ${startStr}</div>
            <div class="event-detail"><strong>End:</strong> ${endStr}</div>
            ${daysLeftText ? `<div class="days-left">${daysLeftText}</div>` : ''}
            <div class="event-detail">${description}</div>
            <div class="rsvp-section">
              ${
                rsvpEventIds.includes(event.id)
                  ? `<button class="rsvp-btn cancel" data-event-id="${event.id}">Cancel RSVP
                  <img src = "images/submit_confirmBtn.PNG" alt = "Icon", style="height:36px; vertical-align: middle; margin-right: 5px;"></button>`
                  : `
                    <input type="number" min="1" value="1" class="guest-count" placeholder="Guests" />
                    <button class="rsvp-btn submit" data-event-id="${event.id}">RSVP
                    <img src = "images/submit_confirmBtn.PNG" alt = "Icon", style="height:36px; vertical-align: middle; margin-right: 5px;"></button>
                  `
              }
            </div>
          `;

          container.appendChild(card);

          const cancelBtn = card.querySelector('.cancel');
          const submitBtn = card.querySelector('.submit');

          if (cancelBtn) {
            cancelBtn.addEventListener('click', () =>
              cancelRsvp(cancelBtn.dataset.eventId, cancelBtn)
            );
          }

          if (submitBtn) {
            submitBtn.addEventListener('click', () =>
              rsvp(submitBtn.dataset.eventId, submitBtn)
            );
          }
        });

      } catch (err) {
        document.getElementById('loading').textContent = 'Failed to load events.';
        console.error('Error loading events:', err);
      }
    }

    async function rsvp(eventId, btn) {
      const guestInput = btn.previousElementSibling;
      const count = parseInt(guestInput.value) || 1;
      const user_uid = localStorage.getItem('user_uid');

      try {
        const res = await fetch(`/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid, count })
        });

        const data = await res.json();
        if (data.success) {
          alert(`RSVP confirmed for ${count} guest(s)`);
          window.location.reload();
        } else {
          alert('Failed to RSVP: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('RSVP error:', err);
        alert('Error sending RSVP: ' + err.message);
      }
    }

    async function cancelRsvp(eventId, btn) {
    const user_uid = localStorage.getItem('user_uid');
      try {
        const res = await fetch(`/events/${eventId}/rsvp`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_uid })
        });

        const data = await res.json();
        if (data.success) {
          alert('RSVP cancelled');
          window.location.reload();
        } else {
          alert('Failed to cancel RSVP: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Cancel RSVP error:', err);
        alert('Error cancelling RSVP: ' + err.message);
      }
    }

    window.addEventListener('DOMContentLoaded', loadEvents);
