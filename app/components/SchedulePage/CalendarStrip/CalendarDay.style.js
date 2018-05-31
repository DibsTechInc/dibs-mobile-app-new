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
    fontSize: 16,
    fontFamily: 'flex-font-heavy',
    textAlign: 'center',
  },
  dateNumber: {
    fontSize: 18,
    fontFamily: 'flex-font',
    textAlign: 'center',
  },
  disabledDateName: {
    fontSize: 10,
    fontFamily: 'flex-font-heavy',
    color: 'darkgray',
    textAlign: 'center',
  },
  disabledDateNumber: {
    fontSize: 10,
    fontFamily: 'flex-font',
    color: 'darkgray',
    textAlign: 'center',
  },
  highlightDateNameStyle: {
    fontSize: 16,
    fontFamily: 'flex-font-heavy',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highlightDateNumberStyle: {
    fontSize: 16,
    fontFamily: 'flex-font',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
