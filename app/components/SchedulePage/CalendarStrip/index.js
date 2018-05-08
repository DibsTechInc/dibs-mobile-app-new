import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  View,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import styled from 'styled-components';
import moment from 'moment';
import { Svg, Path } from 'react-native-svg';
import { setCurrentDate, addDaysToCurrentDate } from '../../../actions';
import CalendarDay from './CalendarDay';
import { WHITE, OFF_WHITE } from '../../../constants';
import Config from '../../../../config.json';
import { FlexRow, FlexCenter } from '../../styled';

// Just a shallow array of 7 elements

const Container = styled.View`
  background: ${Config.STUDIO_COLOR};
  overflow: hidden;
  padding-bottom: 10;
`;

const CalendarHeader = styled.Text`
  color: ${WHITE};
  font-size: 14;
  text-align: center;
  font-weight: bold;
  margin-bottom: 8;
  margin-top: 4;
`;

const ArrowContainer = FlexCenter.extend`
  flex: 0.1;
`;

const DatesContainer = FlexCenter.extend`
  flex-direction: row;
  flex: 1;
`;

/**
 * @class CalendarStrip
 * @extends Component
 */
class CalendarStrip extends Component {
  /**
   * @static
   * @returns {number} number of days for the calendar to display
   */
  static getNumberOfDaysToDisplay() {
    const { width } = Dimensions.get('window');
    return width > 350 ? 7 : 5;
  }
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

    this.state = {
      numberOfDays: CalendarStrip.getNumberOfDaysToDisplay(),
      startingDate: this.setLocale(moment(this.props.startingDate)),
    };

    // To add for when we handle orientation change
    // Dimensions.addEventListener('change', () => {
    //   this.setState({ numberOfDays: CalendarStrip.getNumberOfDaysToDisplay() });
    // });

    this.resetAnimation();

    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUpdate = this.componentWillUpdate.bind(this);
    this.getDatesForWeek = this.getDatesForWeek.bind(this);
    this.getPreviousDays = this.getPreviousDays.bind(this);
    this.getNextDays = this.getNextDays.bind(this);
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
   * @param {Object} props component will receive
   * @returns {undefined}
   */
  componentWillUpdate(props) {
    if (props.currentDate.toISOString() === this.props.currentDate.toISOString()) {
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
    this.props.setCurrentDate(moment(date));
  }

  /**
   * Set startingDate to the previous set of days
   * @returns {undefined}
   */
  async getPreviousDays() {
    await new Promise(res =>
      this.setState({ startingDate: this.state.startingDate.subtract(this.state.numberOfDays, 'd') }, res));
    this.props.addDaysToCurrentDate(-this.state.numberOfDays);
  }

  /**
   * Set startingDate to the next set of days
   * @returns {undefined}
   */
  async getNextDays() {
    await new Promise(res =>
      this.setState({ startingDate: this.state.startingDate.add(this.state.numberOfDays, 'd') }, res));
    this.props.addDaysToCurrentDate(this.state.numberOfDays);
  }

  /**
   * Get dates for the week based on the startingDate
   * Using isoWeekday so that it will start from Monday
   * @returns {undefined}
   */
  getDatesForWeek() {
    const startDate = moment(this.state.startingDate);
    const dateInfos = [];
    [...Array(this.state.numberOfDays)].forEach((item, index) => {
      const dateInfo = {
        date: null,
        isExpiredDate: null,
      };
      dateInfo.date = this.setLocale(moment(startDate).add(index, 'days'));
      dateInfo.isExpiredDate = dateInfo.date.isBefore(this.props.startingDate);
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
    return date.isSame(this.props.currentDate, 'day');
  }

  /**
   * Function for reseting animations
   * @returns {undefined}
   */
  resetAnimation() {
    this.animatedValue = [];
    [...Array(this.state.numberOfDays)].forEach((value) => {
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
      const animations = [...Array(this.state.numberOfDays)].map(item =>
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
    const lowerBound = this.state.startingDate.clone().subtract(this.state.numberOfDays, 'd').add(1, 'd');
    const canGoBack = lowerBound.isBefore(this.props.startingDate);
    let opacityAnim = 1;
    return (
      <Container>
        <CalendarHeader>
          {this.formatCalendarHeader()}
        </CalendarHeader>
        <FlexRow>
          <ArrowContainer
            onPress={this.getPreviousDays}
            disabled={canGoBack}
          >
            {!canGoBack && (
              <Svg width="20" height="20">
                <Path
                  stroke={WHITE}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  d="M 18 1 L 10 10 L 18 18"
                />
              </Svg>
            )}
          </ArrowContainer>
          <DatesContainer>
            {this.getDatesForWeek().map(({ date, isExpiredDate }, index) => {
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
                    calendarColor={Config.STUDIO_COLOR}
                    highlightColor={OFF_WHITE}
                    dateNameStyle={this.props.dateNameStyle}
                    dateNumberStyle={this.props.dateNumberStyle}
                    weekendDateNameStyle={this.props.weekendDateNameStyle}
                    weekendDateNumberStyle={this.props.weekendDateNumberStyle}
                    selection="background"
                    selectionAnimation={this.props.selectionAnimation}
                    borderHighlightColor={WHITE}
                    highlightDateNameStyle={this.props.highlightDateNameStyle}
                    highlightDateNumberStyle={this.props.highlightDateNumberStyle}
                  />
                </Animated.View>
              );
            })}
          </DatesContainer>
          <ArrowContainer onPress={this.getNextDays}>
            <Svg width="20" height="20">
              <Path
                stroke={WHITE}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                d="M 2 2 L 10 10 L 2 18"
              />
            </Svg>
          </ArrowContainer>
        </FlexRow>
      </Container>
    );
  }
}

/* eslint-disable global-require */
CalendarStrip.defaultProps = {
  startingDate: moment().seconds(0).milliseconds(0),
  calendarHeaderFormat: 'MMMM YYYY',
};

CalendarStrip.propTypes = {
  startingDate: PropTypes.shape(),
  selectedDate: PropTypes.shape(),
  calendarHeaderFormat: PropTypes.string,
  calendarAnimation: PropTypes.shape(),
  selectionAnimation: PropTypes.shape(),
  dateNameStyle: PropTypes.shape(),
  dateNumberStyle: PropTypes.shape(),
  weekendDateNameStyle: PropTypes.shape(),
  weekendDateNumberStyle: PropTypes.shape(),
  highlightDateNameStyle: PropTypes.shape(),
  highlightDateNumberStyle: PropTypes.shape(),
  locale: PropTypes.shape(),
  currentDate: PropTypes.shape(),
  setCurrentDate: PropTypes.func,
  addDaysToCurrentDate: PropTypes.func,
};

const mapStateToProps = state => ({ currentDate: state.currentDate });
const mapDispatchToProps = {
  setCurrentDate,
  addDaysToCurrentDate,
};

export default connect(mapStateToProps, mapDispatchToProps)(CalendarStrip);
