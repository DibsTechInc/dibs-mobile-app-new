import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation } from 'react-navigation';
import { Svg, Path } from 'react-native-svg';

import { GREY, TEXT_GREY, DARK_TEXT_GREY, SCHEDULE_ROUTE } from '../../../../constants';
import { SpaceBetweenRow, HeavyText } from '../../../styled';

const Container = styled.View`
  align-items: center;
  flex: 1;
  width: 100%;
`;

const SwipeInstructions = styled.Text`
  color: ${TEXT_GREY};
  font-family: flex-font;
  font-size: 10;
  margin-top: -5;
`;

const TopRow = SpaceBetweenRow.extend`
  align-items: center;
  margin-top: 5;
  padding-horizontal: 15;
  width: 100%;
`;

const UpNext = styled.Text`
  color: ${GREY};
  font-size: 12;
`;

const UpcomingClassLink = styled.TouchableOpacity`
  align-items: center;
  flex-direction: row;
`;

const ViewMore = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 12;
  margin-right: 5;
`;

const ArrowPath = props => (
  <Path
    d={props.d}
    strokeWidth="2"
    strokeLinecap="round"
    stroke={DARK_TEXT_GREY}
    fill="none"
  />
);

ArrowPath.propTypes = { d: PropTypes.string.isRequired };

/**
 * @class Unexpanded
 * @extends {React.PureComponent}
 */
class Unexpanded extends React.PureComponent {
  /**
   * @constructor
   * @constructs Unexpanded
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.navigateToUpcoming = this.navigateToUpcoming.bind(this);
  }
  /**
   * @returns {undefined}
   */
  navigateToUpcoming() {
    this.props.navigation.navigate(SCHEDULE_ROUTE);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        <SwipeInstructions>
          Swipe up to view more details.
        </SwipeInstructions>
        <TopRow>
          <UpNext>
            Up next...
          </UpNext>
          <UpcomingClassLink onPress={this.navigateToUpcoming}>
            <ViewMore>
              VIEW MORE
            </ViewMore>
            <Svg width={20} height={15}>
              <ArrowPath d="M 2 7.5 L 18 7.5" />
              <ArrowPath d="M 12 2 L 18 7.5 L 12 13" />
            </Svg>
          </UpcomingClassLink>
        </TopRow>
      </Container>
    );
  }
}

Unexpanded.propTypes = {
  navigation: PropTypes.shape().isRequired,
};

export default withNavigation(Unexpanded);
