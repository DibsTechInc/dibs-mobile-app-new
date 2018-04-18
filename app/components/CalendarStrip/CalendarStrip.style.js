import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    //CALENDAR STYLES
    calendarContainer: {
        overflow: 'hidden'
    },
    datesStrip: {
        flexDirection: 'row'
    },
    calendarDates: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    calendarHeader: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom:10,
        marginTop:10,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    icon: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    },

    //CALENDAR DAY
    dateContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        width: 43,
        height: 43,
        borderRadius: 43 / 2
    },
    dateName: {
        fontSize: 10,
        textAlign: 'center'
    },
    weekendDateName: {
        fontSize: 10,
        color: '#000',
        textAlign: 'center'
    },
    dateNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    weekendDateNumber: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    disabledDateName: {
        fontSize: 10,
        color: 'darkgray',
        textAlign: 'center',
    },
    disabledDateNumber: {
        fontSize: 18,
        color: 'darkgray',
        fontWeight: 'bold',
        textAlign: 'center'
    },
});
