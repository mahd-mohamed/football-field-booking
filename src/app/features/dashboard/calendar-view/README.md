# Comprehensive Calendar Component

## Description
A FullCalendar component for displaying bookings, matches, and team schedules in the football pitch booking system.

## Features

### 📅 Event Display
- **Bookings**: Display all bookings with their details
- **Matches**: Display scheduled matches
- **Training**: Display team training sessions

### 🎨 Design
- Modern design using Angular Material
- Full English language support (LTR)
- Distinctive colors for each event type
- Responsive design

### 🔧 Interaction
- Click on events to view details
- Edit and delete capabilities through dialog
- Real-time calendar updates

## Files

```
calendar-view/
├── calendar-view.ts              # Main component
├── calendar-view.html            # HTML template
├── calendar-view.css             # CSS styles
├── event-details-dialog/         # Details dialog component
│   ├── event-details-dialog.ts
│   ├── event-details-dialog.html
│   └── event-details-dialog.css
└── README.md                     # This file
```

## Usage

### Adding the component to a page
```html
<app-calendar-view></app-calendar-view>
```

### Accessing the calendar
```
/dashboard/calendar
```

## Customization

### Changing colors
You can customize event colors in the CSS file:

```css
.booking-color {
  background: linear-gradient(45deg, #4caf50, #66bb6a);
}

.match-color {
  background: linear-gradient(45deg, #ff9800, #ffb74d);
}

.schedule-color {
  background: linear-gradient(45deg, #9c27b0, #ba68c8);
}
```

### Adding new event types
1. Add the new type in `EventDetailsData`
2. Add event handler in `handleEventClick`
3. Add icon and color in dialog

## Requirements

### Required packages
```json
{
  "@fullcalendar/core": "^6.1.18",
  "@fullcalendar/daygrid": "^6.1.18",
  "@fullcalendar/timegrid": "^6.1.18",
  "@fullcalendar/interaction": "^6.1.18",
  "@fullcalendar/angular": "^6.1.18",
  "@fortawesome/fontawesome-free": "^6.4.0"
}
```

### Required services
- `BookingService`: For managing bookings
- `Match`: For managing matches
- `Team`: For managing teams
- `Place`: For managing places
- `User`: For managing users

## Supported Events

### Bookings
- Display place name
- Date and time
- Booker name
- Price
- Booking status

### Matches
- Display participating teams
- Score (if available)
- Match type
- Pitch
- Match status

### Training Sessions
- Team name
- Training type
- Location
- Description

## Service Integration

### Loading data
```typescript
private async loadCalendarEvents() {
  const [bookings, matches, teams] = await Promise.all([
    this.bookingService.getBookings(),
    this.matchService.getBookingMatches().toPromise(),
    this.teamService.getTeams().toPromise()
  ]);
  // Convert data to calendar events
}
```

### Handling event clicks
```typescript
private handleEventClick(info: EventClickArg) {
  const eventData = info.event.extendedProps as any;
  
  if (eventData['type'] === 'booking') {
    this.showBookingDetails(eventData['data']);
  }
  // ... handle other types
}
```

## Future Development

### Proposed features
- [ ] Filter events by type
- [ ] Add new events from calendar
- [ ] Export calendar
- [ ] Notifications for upcoming events
- [ ] Share calendar with teams

### Performance improvements
- [ ] Progressive data loading
- [ ] Data caching
- [ ] Optimize data queries

## Troubleshooting

### Common issues
1. **Events not showing**: Check if data exists in localStorage
2. **Loading errors**: Verify service calls are correct
3. **Design issues**: Ensure FontAwesome is loaded

### Quick fixes
```bash
# Reinstall packages
npm install --legacy-peer-deps

# Clear cache
npm cache clean --force

# Restart server
ng serve
```

## Contributing

To add new features or improve the component:

1. Create a new branch
2. Add the feature with tests
3. Ensure LTR compatibility
4. Submit Pull Request

## License

This component is part of the football pitch booking project and is subject to the same license terms. 