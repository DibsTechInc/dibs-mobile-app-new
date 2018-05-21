import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Dimensions } from 'react-native';

import backgroundImg from '../../../assets/img/main-page.png';
import {
  BLACK,
  WHITE,
  TRANSPARENT,
  LIGHT_GREY,
  SCHEDULE_ROUTE,
  PROFILE_ROUTE,
  UPCOMING_CLASS_ROUTE,
} from '../../constants';
import { FadeInView, CustomStatusBar } from '../shared';
import {
  getUserFirstName,
  getStudioName,
  getUserHasUpcomingEvents,
} from '../../selectors';
import Header from '../Header';
import { HeavyText, FlexRow } from '../styled';
import IconLink from './IconLink';
import UpcomingEventSlider from './UpcomingEventSlider';

const BackgroundImage = styled.Image`
  left: 0;
  height: ${Dimensions.get('window').height};
  opacity: 0.25;
  position: absolute;
  right: 0;
  top: 0;
`;

const Content = styled.View`
  flex: 1;
  justify-content: ${props => (props.hasUpcomingClasses ? 'center' : 'flex-end')}
  margin-bottom: ${props => (props.hasUpcomingClasses ? 50 : 150)};
`;

const Greeting = HeavyText.extend`
  color: ${WHITE};
  font-size: 32;
  padding-horizontal: 20;
`;

const Welcome = styled.Text`
  color: ${LIGHT_GREY};
  font-size: 14;
  font-family: 'flex-font';
  padding-horizontal: 20;
`;

const IconRow = FlexRow.extend`
  align-items: flex-end;
  margin-top: 15;
  width: 100%;
`;

/**
 * @class MainPage
 * @extends {React.PureComponent}
 */
class MainPage extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} XML
   */
  render() {
    return (
      <FadeInView style={{ position: 'relative', backgroundColor: BLACK }}>
        <CustomStatusBar backgroundColor={'transparent'} barStyle="light-content" />
        <BackgroundImage source={backgroundImg} />
        {/* <Header
          iconColor={WHITE}
          backgroundColor={TRANSPARENT}
        /> */}
        <Content hasUpcomingClasses={this.props.hasUpcomingClasses}>
          <Greeting>
            Hi {this.props.userFirstName}!
          </Greeting>
          <Welcome>
            Welcome to {this.props.studioName}
          </Welcome>
          <IconRow>
            <IconLink
              iconName="calendar"
              text={'BOOK\nCLASSES'}
              route={SCHEDULE_ROUTE}
            />
            <IconLink
              iconName="arrow-up"
              text={'VIEW\nUPCOMING'}
              route={UPCOMING_CLASS_ROUTE}
            />
            <IconLink
              iconName="user"
              text={'MANAGE\nACCOUNT'}
              route={PROFILE_ROUTE}
              lastIcon
            />
          </IconRow>
        </Content>
        {this.props.hasUpcomingClasses ? <UpcomingEventSlider /> : null}
      </FadeInView>
    );
  }
}

MainPage.propTypes = {
  userFirstName: PropTypes.string.isRequired,
  studioName: PropTypes.string.isRequired,
  hasUpcomingClasses: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  studioName: getStudioName(state),
  hasUpcomingClasses: getUserHasUpcomingEvents(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
