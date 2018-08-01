import React from 'react';
import { connect } from 'react-redux';
import { Calendar, Permissions } from 'expo';
import PropTypes from 'prop-types';

import { TouchableOpacity } from 'react-native';
import AddToCalendarIcon from './Icons/AddToCalendarIcon';
import { enqueueNotice } from '../../actions';


/**
 * @class AddToCalendarButton
 * @extends {React.PureComponent}
 */
class AddToCalendarButton extends React.PureComponent {
  /**
   * @constructor
   * @constructs AddToCalendarButton
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.handleOnPress = this.handleOnPress.bind(this);
    this.askCalendarPermission = this.askCalendarPermission.bind(this);
    this.alertIfRemoteNotificationsDisabledAsync = this.alertIfRemoteNotificationsDisabledAsync.bind(this);
  }
  /**
   * @returns {undefined}
   */
  componentDidMount() {
    this.alertIfRemoteNotificationsDisabledAsync();
  }
  /**
   * @returns {undefined}
   */
  async askCalendarPermission() {
    await Permissions.askAsync(Permissions.CALENDAR);
  }
  /**
   * @returns {undefined}
   */
  async alertIfRemoteNotificationsDisabledAsync() {
    const { status } = await Permissions.getAsync(Permissions.CALENDAR);
    if (status !== 'granted') {
      this.props.enqueueNotice({
        title: 'Permission to access Calendar',
        message: 'Give the app permission to access Calendar in order to easily add upcoming classes to your calendar.',
        buttons: [
          { text: 'Ok', onPress: this.askCalendarPermission },
        ],
      });
    }
  }
  /**
   * @returns {undefined}
   */
  async handleOnPress() {
    const details = {
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      title: this.props.title,
      location: this.props.location,
      timeZone: this.props.timeZone,
    };

    try {
      await Calendar.createEventAsync(Calendar.DEFAULT, details);
      this.props.enqueueNotice({ title: 'Success!', message: 'Event has been added to your calendar.' });
    } catch (err) {
      if (err.message === 'Missing calendar permission.') {
        this.askCalendarPermission();
      }
    }
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <TouchableOpacity onPress={this.handleOnPress}>
        <AddToCalendarIcon />
      </TouchableOpacity>
    );
  }
}

AddToCalendarButton.propTypes = {
  title: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  location: PropTypes.string,
  timeZone: PropTypes.string,
  enqueueNotice: PropTypes.func,
};

const mapDispatchToProps = {
  enqueueNotice,
};

export default connect(null, mapDispatchToProps)(AddToCalendarButton);
