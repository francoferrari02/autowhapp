const { google } = require('googleapis');
const { authorize } = require('./auth');

function saveEvent(gmail, startDate, startHour, endDate, endHour, name, description = '', place = '', repetition = null, colorId = '1') {
    authorize(async (auth) => {
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            // Step 1: List all calendars
            const res = await calendar.calendarList.list();
            const calendars = res.data.items;

            let matchedCalendarId = null;

            // Step 2: Iterate through calendars and look for metadata event
            for (const cal of calendars) {
                const eventsRes = await calendar.events.list({
                calendarId: cal.id,
                timeMin: new Date('1990-01-01T00:00:00Z').toISOString(),
                timeMax: new Date('1990-01-02T00:00:00Z').toISOString(),
                singleEvents: true,
                });

                const events = eventsRes.data.items || [];
                const hasMatch = events.some(e => e.summary === gmail);
                if (hasMatch) {
                matchedCalendarId = cal.id;
                break;
                }
            }

            if (!matchedCalendarId) {
                console.error(`❌ No calendar found with metadata event for ${gmail}`);
                return;
            }

            // Step 3: Build event object
            const event = {
                summary: name,
                location: place,
                description: description,
                start: {
                dateTime: `${startDate}T${startHour}`,
                timeZone: 'America/Argentina/Buenos_Aires',
                },
                end: {
                dateTime: `${endDate}T${endHour}`,
                timeZone: 'America/Argentina/Buenos_Aires',
                },
                colorId: colorId,
            };

            if (repetition) {
                event.recurrence = [`RRULE:${repetition}`];
            }

            // Step 4: Insert event into matched calendar
            calendar.events.insert({
                auth: auth,
                calendarId: matchedCalendarId,
                resource: event,
            }, (err, res) => {
                if (err) return console.error('The API returned an error: ' + err);
                console.log('✅ Event created:', res.data.htmlLink);
            });

        } catch (err) {
            console.error('❌ Error saving event:', err);
        }
    });
}

module.exports = saveEvent;
