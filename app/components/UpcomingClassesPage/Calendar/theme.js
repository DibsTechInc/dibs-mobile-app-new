import Config from '../../../../config.json';
import { WHITE } from '../../../constants';

export default {
  'stylesheet.calendar.header': {
    monthText: { color: WHITE, fontFamily: 'flex-font-heavy', fontSize: 18 },
    arrow: { paddingVertical: 0, paddingHorizontal: 30 },
    dayHeader: { color: WHITE, fontFamily: 'flex-font', fontSize: 14 },
  },
  'stylesheet.calendar.main': {
    container: { backgroundColor: Config.STUDIO_COLOR },
    monthView: { backgroundColor: Config.STUDIO_COLOR, paddingTop: 10 },
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
