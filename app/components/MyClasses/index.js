import React from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import SettingsList from 'react-native-settings-list';
import { withNavigation } from 'react-navigation';

import {
  getDetailedUpcomingEvents,
  getDetailedPastEvents,
} from '../../selectors';

import { FadeInView } from '../shared';

import {
  WHITE,
  DEFAULT_BG,
  LIGHT_GREY,
  GREY,
  CLASS_INFO_ROUTE,
} from '../../constants';
import Header from '../Header';

const titleBoxStyle = {
  backgroundColor: WHITE,
  flex: 1,
  marginLeft: 15,
  flexDirection: 'row',
  minHeight: 50,
};

/**
 * @class MyClasses
 * @extends {React.PureComponent}
 */
class MyClasses extends React.PureComponent {
  /**
   * @constructor
   * @constructs MyClasses
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.upcomingClasses = this.generateClassList.bind(this, 'upcomingEvents');
    this.pastClasses = this.generateClassList.bind(this, 'pastEvents');
  }
   /**
   * @param {array} classList - array of objects
   * @returns {undefined}
   */
  generateClassList(classList) {
    const map = {
      upcomingEvents: 'upcoming',
      pastEvents: 'past',
    };

    const emptyDisplay = (
      <SettingsList.Item
        title={`No ${map[classList]} classes`}
        titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
        titleBoxStyle={titleBoxStyle}
        hasNavArrow={false}
      />
    );

    if (!this.props[classList].length) {
      return emptyDisplay;
    }

    return this.props[classList].map(item =>
      (<SettingsList.Item
        key={item.eventid}
        title={`${item.shortDayOfWeek} ${item.shortEventDate}`}
        titleStyle={{ fontFamily: 'studio-font', fontSize: 16 }}
        titleInfo={item.name}
        titleInfoStyle={{ color: GREY, fontFamily: 'studio-font', fontSize: 16 }}
        titleBoxStyle={titleBoxStyle}
        onPress={this.handleOnPressClassDetail.bind(this, item, classList)}
      />)
      );
  }
   /**
   * @param {object} props - array of objects
   * @param {string} classListName - name of the array
   * @returns {undefined}
   */
  handleOnPressClassDetail(props, classListName) {
    const isTransactionHistory = classListName === 'pastEvents';
    this.props.navigation.navigate(CLASS_INFO_ROUTE, { ...props, isTransactionHistory });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <FadeInView style={{ backgroundColor: DEFAULT_BG }}>
        <Header title="My Classes" />
        <View style={{ backgroundColor: DEFAULT_BG, flex: 1 }}>
          <SettingsList backgroundColor={WHITE} borderColor={LIGHT_GREY} defaultItemSize={50}>
            <SettingsList.Header headerStyle={{ marginTop: -20 }} />
            <SettingsList.Item
              hasNavArrow={false}
              title="Upcoming Classes"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            {this.upcomingClasses()}
            <SettingsList.Item
              hasNavArrow={false}
              title="Past Classes"
              titleStyle={{ color: GREY, fontFamily: 'studio-font-heavy', fontSize: 16 }}
              titleBoxStyle={titleBoxStyle}
            />
            {this.pastClasses()}
          </SettingsList>
        </View>
      </FadeInView>
    );
  }
}

MyClasses.propTypes = {
  upcomingEvents: PropTypes.arrayOf(PropTypes.shape()), // used in func generateClassList
  pastEvents: PropTypes.arrayOf(PropTypes.shape()), // used in func generateClassList
  navigation: PropTypes.shape(),
};

const mapStateToProps = state => ({
  upcomingEvents: getDetailedUpcomingEvents(state),
  pastEvents: getDetailedPastEvents(state),
});

const MyClassesWithNavigation = withNavigation(MyClasses);

export default connect(mapStateToProps)(MyClassesWithNavigation);

