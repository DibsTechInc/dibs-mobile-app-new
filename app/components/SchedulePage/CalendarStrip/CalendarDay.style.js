import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
    fontFamily: 'studio-font-heavy',
    textAlign: 'center',
  },
  dateNumber: {
    fontSize: 14,
    fontFamily: 'studio-font',
    textAlign: 'center',
  },
  disabledDateName: {
    fontSize: 10,
    fontFamily: 'studio-font-heavy',
    color: 'darkgray',
    textAlign: 'center',
  },
  disabledDateNumber: {
    fontSize: 10,
    fontFamily: 'studio-font',
    color: 'darkgray',
    textAlign: 'center',
  },
  highlightDateNameStyle: {
    fontSize: 12,
    fontFamily: 'studio-font-heavy',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highlightDateNumberStyle: {
    fontSize: 14,
    fontFamily: 'studio-font',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
