import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // CALENDAR STYLES
  calendarContainer: {
    overflow: 'hidden',
  },
  datesStrip: {
    flexDirection: 'row',
  },
  calendarDates: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  // CALENDAR DAY
  dateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: 43,
    height: 43,
    borderRadius: 43 / 2,
  },
  dateName: {
    fontSize: 12,
    fontFamily: 'flex-font',
    textAlign: 'center',
  },
  weekendDateName: {
    fontSize: 12,
    fontFamily: 'flex-font',
    color: '#fff',
    textAlign: 'center',
  },
  dateNumber: {
    fontSize: 18,
    fontFamily: 'flex-font-heavy',
    textAlign: 'center',
  },
  weekendDateNumber: {
    fontSize: 18,
    fontFamily: 'flex-font-heavy',
    color: '#fff',
    textAlign: 'center',
  },
  disabledDateName: {
    fontSize: 10,
    fontFamily: 'flex-font',
    color: 'darkgray',
    textAlign: 'center',
  },
  disabledDateNumber: {
    fontSize: 10,
    fontFamily: 'flex-font-heavy',
    color: 'darkgray',
    textAlign: 'center',
  },
  highlightDateNameStyle: {
    fontSize: 12,
    fontFamily: 'flex-font',
    color: 'blue',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highlightDateNumberStyle: {
    fontSize: 16,
    fontFamily: 'flex-font',
    color: 'blue',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
