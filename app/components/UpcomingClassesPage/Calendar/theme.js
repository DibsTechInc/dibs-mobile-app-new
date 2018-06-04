import Config from '../../../../config.json';
import { WHITE, HEIGHT } from '../../../constants';

export default {
  'stylesheet.calendar.header': {
    monthText: { color: WHITE, fontFamily: 'studio-font-heavy', fontSize: 16 },
    arrow: { paddingVertical: 0, paddingHorizontal: 30 },
    dayHeader: { color: WHITE, fontFamily: 'studio-font', fontSize: 16 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  'stylesheet.calendar.main': {
    container: { backgroundColor: Config.STUDIO_COLOR, paddingHorizontal: 15 },
    monthView: { backgroundColor: Config.STUDIO_COLOR, paddingTop: 2 },
    week: {
      marginTop: (HEIGHT / 200),
      marginBottom: (HEIGHT / 200),
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  },
  'stylesheet.day.basic': {
    disabledText: {
      color: WHITE,
      opacity: 0.7,
    },
    text: {
      color: WHITE,
      opacity: 1,
      marginTop: 3,
    },
    todayText: {
      color: WHITE,
    },
    selected: {
      backgroundColor: Config.STUDIO_HIGHLIGHT_COLOR,
      borderRadius: 16,
    },
    selectedText: {
      color: Config.STUDIO_TEXT_COLOR,
      opacity: 1,
    },
    selectedDot: {
      backgroundColor: Config.STUDIO_COLOR,
    },
    dot: {
      backgroundColor: WHITE,
      marginTop: 3,
      width: 4,
      height: 4,
      borderRadius: 2,
    },
  },
};
