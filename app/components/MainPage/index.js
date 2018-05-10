import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Dimensions } from 'react-native';

import Config from '../../../config.json';
import backgroundImg from '../../../assets/img/main-page.jpg';
import { BLACK, WHITE, TRANSPARENT, LIGHT_GREY, SCHEDULE_ROUTE, PROFILE_ROUTE } from '../../constants';
import { getUserFirstName, getStudioName } from '../../selectors';
import { FadeInView } from '../shared';
import Header from '../Header';
import { HeavyText, FlexRow } from '../styled';
import IconLink from './IconLink';

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
  margin-bottom: 100;
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
        <BackgroundImage source={backgroundImg} />
        <Header
          iconColor={WHITE}
          backgroundColor={TRANSPARENT}
        />
        <Content style={{ justifyContent: 'flex-end' }}>
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
              route={SCHEDULE_ROUTE}
            />
            <IconLink
              iconName="user"
              text={'MANAGE\nACCOUNT'}
              route={PROFILE_ROUTE}
              lastIcon
            />
          </IconRow>
        </Content>
      </FadeInView>
    );
  }
}

MainPage.propTypes = {
  userFirstName: PropTypes.string.isRequired,
  studioName: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  userFirstName: getUserFirstName(state),
  studioName: getStudioName(state),
});
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
