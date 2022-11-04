const Commands = {
  'START': '/start',
  'NEW_SHIFTS': '/newshifts',
  'REMOVE_SHIFTS': '/removeshifts',
  'SHOW_SHIFTS': '/shifts',
  'CALCULATE_PAYMENT': '/payment',
  'SETTINGS': '/settings',
};

Commands.list =
[
  {
    'command': Commands.START,
    'description': 'Initial command',
  },
  {
    'command': Commands.NEW_SHIFTS,
    'description': 'Add new shifts to your schedule',
  },
  {
    'command': Commands.REMOVE_SHIFTS,
    'description': 'Removes shift from your schedule',
  },
  {
    'command': Commands.SHOW_SHIFTS,
    'description': 'Shows the full list of your shifts',
  },
  {
    'command': Commands.CALCULATE_PAYMENT,
    'description': 'Calculates salary for the last month',
  },
  {
    'command': Commands.SETTINGS,
    'description': 'Edit your preferences',
  },
];

export { Commands };
