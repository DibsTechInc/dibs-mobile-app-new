import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import CalendarDay from './CalendarDay';
import styles from './CalendarStrip.style';

// Just a shallow array of 7 elements
const arr = [];
for (let i = 0; i < 7; i += 1) {
  arr.push(i);
}

/**
 * @class CalendarStrip
 * @extends Component
 */
class CalendarStrip extends Component {
    /**
     * @constructor
     * @constructs CalendarStrip
     * @param {Object} props for component
     */
  constructor(props) {
    super(props);
    if (props.locale && props.locale.name && props.locale.config) {
      moment.locale(props.locale.name, props.locale.config);
    } else if (props.locale) {
      throw new Error('Locale prop is not in the correct format. \b Locale has to be in form of object, with params NAME and CONFIG!');
    }

    const startingDate = this.setLocale(moment(this.props.startingDate));
    const selectedDate = this.setLocale(moment(this.props.selectedDate));
    const currentDate = this.setLocale(moment(this.props.currentDate));

    this.state = {
      startingDate,
      selectedDate,
      currentDate,
    };

    this.resetAnimation();

    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUpdate = this.componentWillUpdate.bind(this);
    this.getDatesForWeek = this.getDatesForWeek.bind(this);
    this.getPreviousWeek = this.getPreviousWeek.bind(this);
    this.getNextWeek = this.getNextWeek.bind(this);
    this.onDateSelected = this.onDateSelected.bind(this);
    this.isDateSelected = this.isDateSelected.bind(this);
    this.formatCalendarHeader = this.formatCalendarHeader.bind(this);
    this.animate = this.animate.bind(this);
    this.resetAnimation = this.resetAnimation.bind(this);
  }
  /**
   * starts animation
   * @returns {undefined}
   */
  componentDidMount() {
    this.animate();
  }

  /**
   * @param {Object} props that component will receive
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (props.selectedDate !== this.props.selectedDate) {
      const selectedDate = this.setLocale(moment(props.selectedDate));
      this.setState({ selectedDate });
    }
  }

  /**
   * @param {Object} nextProps component will receive
   * @param {Object} nextState component will receive
   * @returns {undefined}
   */
  componentWillUpdate(nextProps, nextState) {
    if (nextState.selectedDate === this.state.selectedDate) {
      this.resetAnimation();
      this.animate();
    }
  }

  /**
   * @param {Object} date selected
   * @returns {undefined}
   */
  onDateSelected(date) {
    const invalidSelection = date.isBefore(this.state.startingDate);
    if (invalidSelection) {
      return;
    }
    this.setState({ selectedDate: date });
    if (this.props.onDateSelected) {
      this.props.onDateSelected(date);
    }
  }

  /**
   * Set startingDate to the previous week
   * @returns {undefined}
   */
  getPreviousWeek() {
    this.setState({ startingDate: this.state.startingDate.subtract(1, 'w') });
  }

  /**
   * Set startingDate to the next week
   * @returns {undefined}
   */
  getNextWeek() {
    this.setState({ startingDate: this.state.startingDate.add(1, 'w') });
  }

  /**
   * Get dates for the week based on the startingDate
   * Using isoWeekday so that it will start from Monday
   * @returns {undefined}
   */
  getDatesForWeek() {
    const startDate = moment(this.state.startingDate);
    const dateInfos = [];

    arr.forEach((item, index) => {
      const dateInfo = {
        date: null,
        isExpiredDate: null,
      };
      dateInfo.date = this.setLocale(moment(startDate).add(index, 'days'));
      dateInfo.isExpiredDate = dateInfo.date.isBefore(this.state.currentDate);

      dateInfos.push(dateInfo);
    });

    return dateInfos;
  }

  /**
   * Function that checks if the locale is passed to the component and sets it to the passed moment instance
   * @param {Object} momentInstance set locale of moment instance
   * @returns {Object} moment instance with that set locale
   */
  setLocale(momentInstance) {
    if (this.props.locale) {
      return momentInstance.locale(this.props.locale.name);
    }
    return momentInstance;
  }

  /**
   * Function to check if provided date is the same as selected one, hence date is selected
   * using isSame moment query with 'day' param so that it check years, months and day
   * @param {Object} date you are comparing to the selected date
   * @returns {boolean} if they are the same date
   */
  isDateSelected(date) {
    return date.isSame(this.state.selectedDate, 'day');
  }

  /**
   * Function for reseting animations
   * @returns {undefined}
   */
  resetAnimation() {
    this.animatedValue = [];
    arr.forEach((value) => {
      this.animatedValue[value] = new Animated.Value(0);
    });
  }

  /**
   * Function to animate showing the CalendarDay elements.
   * Possible cases for animations are sequence and parallel
   * @returns {undefined}
   */
  animate() {
    if (this.props.calendarAnimation) {
      const animations = arr.map(item =>
        Animated.timing(
          this.animatedValue[item],
          {
            toValue: 1,
            duration: this.props.calendarAnimation.duration,
            easing: Easing.linear,
          }
        )
      );
      if (this.props.calendarAnimation.type.toLowerCase() === 'sequence') {
        Animated.sequence(animations).start();
      } else if (this.props.calendarAnimation.type.toLowerCase() === 'parallel') {
        Animated.parallel(animations).start();
      } else {
        throw new Error('CalendarStrip Error! Type of animation is incorrect!');
      }
    }
  }

  /**
   * Function that formats the calendar header
   * It also formats the month section if the week is in between months
   * @returns {string} formatted calendar header
   */
  formatCalendarHeader() {
    const firstDay = this.getDatesForWeek()[0].date;
    const lastDay = this.getDatesForWeek()[this.getDatesForWeek().length - 1].date;
    let monthFormatting = '';
    // Parsing the month part of the user defined formating
    if ((this.props.calendarHeaderFormat.match(/Mo/g) || []).length > 0) {
      monthFormatting = 'Mo';
    } else if ((this.props.calendarHeaderFormat.match(/M/g) || []).length > 0) {
      for (let i = (this.props.calendarHeaderFormat.match(/M/g) || []).length; i > 0; i -= 1) {
        monthFormatting += 'M';
      }
    }
    if (firstDay.month() === lastDay.month()) {
      return firstDay.format(this.props.calendarHeaderFormat);
    }
    if (firstDay.year() !== lastDay.year()) {
      return `${firstDay.format(this.props.calendarHeaderFormat)} / ${lastDay.format(this.props.calendarHeaderFormat)}`;
    }
    return `${monthFormatting.length > 1 ? firstDay.format(monthFormatting) : ''} ${monthFormatting.length > 1 ? '/' : ''} ${lastDay.format(this.props.calendarHeaderFormat)}`;
  }

  /**
   * @returns {JSX} XML
   */
  render() {
    const oneWeekAgo = this.state.startingDate.clone().subtract(1, 'w').add(1, 'd');
    const canGoBack = oneWeekAgo.isBefore(this.state.currentDate);

    let opacityAnim = 1;
    const datesRender = this.getDatesForWeek().map(({ date, isExpiredDate }, index) => {
      if (this.props.calendarAnimation) {
        opacityAnim = this.animatedValue[index];
      }

      return (
        <Animated.View key={date} style={{ opacity: opacityAnim, flex: 1 }}>
          <CalendarDay
            date={date}
            isExpiredDate={isExpiredDate}
            key={date}
            selected={this.isDateSelected(date)}
            onDateSelected={this.onDateSelected}
            calendarColor={this.props.calendarColor}
            highlightColor={this.props.highlightColor}
            dateNameStyle={this.props.dateNameStyle}
            dateNumberStyle={this.props.dateNumberStyle}
            weekendDateNameStyle={this.props.weekendDateNameStyle}
            weekendDateNumberStyle={this.props.weekendDateNumberStyle}
            selection={this.props.selection}
            selectionAnimation={this.props.selectionAnimation}
            borderHighlightColor={this.props.borderHighlightColor}
            highlightDateNameStyle={this.props.highlightDateNameStyle}
            highlightDateNumberStyle={this.props.highlightDateNumberStyle}
          />
        </Animated.View>
      );
    });
    return (
      <View style={[styles.calendarContainer, { backgroundColor: this.props.calendarColor }, this.props.style]}>
        <Text style={[styles.calendarHeader, this.props.calendarHeaderStyle]}>{this.formatCalendarHeader()}</Text>
        <View style={styles.datesStrip}>
          <TouchableOpacity style={[styles.iconContainer, this.props.iconContainer]} onPress={this.getPreviousWeek} disabled={canGoBack}>
            {!canGoBack && <Image style={[styles.icon, this.props.iconStyle, this.props.iconLeftStyle]} source={this.props.iconLeft} />}
          </TouchableOpacity>
          <View style={styles.calendarDates}>
            {datesRender}
          </View>
          <TouchableOpacity style={[styles.iconContainer, this.props.iconContainer]} onPress={this.getNextWeek}>
            <Image style={[styles.icon, this.props.iconStyle, this.props.iconRightStyle]} source={this.props.iconRight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

/* eslint-disable global-require */
CalendarStrip.defaultProps = {
  startingDate: moment().seconds(0).milliseconds(0),
  currentDate: moment().seconds(0).milliseconds(0),
  iconLeft: require('./img/left-arrow-black.png'),
  iconRight: require('./img/right-arrow-black.png'),
  calendarHeaderFormat: 'MMMM YYYY',
};

CalendarStrip.propTypes = {
  style: PropTypes.shape(),
  calendarColor: PropTypes.string,
  highlightColor: PropTypes.string,
  borderHighlightColor: PropTypes.string,
  currentDate: PropTypes.shape(),
  startingDate: PropTypes.shape(),
  selectedDate: PropTypes.shape(),
  onDateSelected: PropTypes.func,
  iconLeft: PropTypes.shape(),
  iconRight: PropTypes.shape(),
  iconStyle: PropTypes.shape(),
  iconLeftStyle: PropTypes.shape(),
  iconRightStyle: PropTypes.shape(),
  iconContainer: PropTypes.shape(),
  calendarHeaderStyle: PropTypes.shape(),
  calendarHeaderFormat: PropTypes.string,
  calendarAnimation: PropTypes.shape(),
  selection: PropTypes.string,
  selectionAnimation: PropTypes.shape(),
  dateNameStyle: PropTypes.shape(),
  dateNumberStyle: PropTypes.shape(),
  weekendDateNameStyle: PropTypes.shape(),
  weekendDateNumberStyle: PropTypes.shape(),
  highlightDateNameStyle: PropTypes.shape(),
  highlightDateNumberStyle: PropTypes.shape(),
  locale: PropTypes.shape(),
};

export default CalendarStrip;
