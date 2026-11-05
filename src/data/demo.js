export const initialWorkers = [
  { id: 'WK-1042', name: 'Arun Kumar', role: 'Construction Worker', site: 'North Site', status: 'Safe', battery: 92, lastSeen: 'Just now', initials: 'AK', color: 'blue' },
  { id: 'WK-1038', name: 'Meena Devi', role: 'Street Vendor', site: 'Market Road', status: 'Safe', battery: 78, lastSeen: '1 min ago', initials: 'MD', color: 'violet' },
  { id: 'WK-1016', name: 'Suresh Babu', role: 'Construction Worker', site: 'North Site', status: 'Warning', battery: 46, lastSeen: '2 min ago', initials: 'SB', color: 'green' },
];

export const temperatureData = [
  { time: '08:00', temp: 29, humidity: 61 },
  { time: '09:00', temp: 30, humidity: 59 },
  { time: '10:00', temp: 32, humidity: 58 },
  { time: '11:00', temp: 34, humidity: 63 },
  { time: '12:00', temp: 36, humidity: 67 },
  { time: '13:00', temp: 35, humidity: 70 },
  { time: '14:00', temp: 37, humidity: 72 },
];

export const initialAlerts = [
  { id: 1, workerId: 'WK-1016', type: 'warning', title: 'Elevated heat conditions', detail: 'Suresh Babu · North Site', time: '10:42 AM', state: 'Open' },
  { id: 2, workerId: 'WK-1038', type: 'info', title: 'Device battery running low', detail: 'Meena Devi · Market Road', time: '10:18 AM', state: 'Acknowledged' },
  { id: 3, workerId: 'WK-1042', type: 'success', title: 'Hydration reminder completed', detail: 'Arun Kumar · North Site', time: '09:45 AM', state: 'Completed' },
];
