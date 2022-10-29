export default class Commands {
  static START = '/start';
  static NEW_SHIFTS = '/newshifts';
  static REMOVE_SHIFTS = '/removeshifts';
  static SHOW_SHIFTS = '/shifts';
  static CALCULATE_PAYMENT = '/payment';
  static SETTINGS = '/settings';
  static list = [
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
}
