import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withNavigation } from 'react-navigation';
import { Svg, Path } from 'react-native-svg';

import { GREY, TEXT_GREY, DARK_TEXT_GREY, SOFT_GREY, UPCOMING_CLASS_ROUTE } from '../../../../constants';
import { SpaceBetweenRow, HeavyText, FlexRow } from '../../../styled';
import EventListItem from './EventListItem';
import NoEvents from './NoEvents';

const Container = styled.View`
  align-items: center;
  flex: 1;
  width: 100%;
`;

const SwipeInstructions = styled.Text`
  color: ${TEXT_GREY};
  font-family: flex-font;
  font-size: 14;
  margin-top: -5;
`;

const TopRow = SpaceBetweenRow.extend`
  align-items: center;
  margin-vertical: 5;
  padding-horizontal: 15;
  width: 100%;
`;

const UpNext = styled.Text`
  color: ${GREY};
  font-size: 14;
  font-family: flex-font;
`;

const UpcomingClassLink = styled.TouchableOpacity`
  align-items: center;
  flex-direction: row;
`;

const ViewMore = HeavyText.extend`
  color: ${DARK_TEXT_GREY};
  font-size: 14;
  font-family: flex-font;
  margin-right: 5;
`;

const PageControl = FlexRow.extend`
  justify-content: space-between;
  margin-top: 15;
  width: 150;
`;

const EventNumber = styled.Text`
  color: ${TEXT_GREY};
  font-size: 16;
  font-family: flex-font;
`;

const ArrowContainer = styled.TouchableOpacity`
  align-items: center;
  width: 30;
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
    this.state = { currentIndex: 0 };
    this.navigateToUpcoming = this.navigateToUpcoming.bind(this);
    this.showNextEvent = this.showNextEvent.bind(this);
    this.showPrevEvent = this.showPrevEvent.bind(this);
  }
  /**
   * @returns {undefined}
   */
  navigateToUpcoming() {
    this.props.navigation.navigate(UPCOMING_CLASS_ROUTE);
  }
  /**
   * @returns {undefined}
   */
  showNextEvent() {
    this.setState({ currentIndex: this.state.currentIndex + 1 });
  }
  /**
   * @returns {undefined}
   */
  showPrevEvent() {
    this.setState({ currentIndex: this.state.currentIndex - 1 });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container>
        {this.props.events.length ? (
          <SwipeInstructions style={{ marginBottom: this.props.isUpcomingClassesPage ? 20 : 0 }}>
            Swipe up to view more details.
          </SwipeInstructions>
        ) : null}
        {this.props.isUpcomingClassesPage ? null : (
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
        )}
        {this.props.events.length ? (
          <EventListItem {...this.props.events[this.state.currentIndex]} />
        ) : (
          <NoEvents />
        )}
        {this.props.events.length > 1 ? (
          <PageControl>
            <ArrowContainer
              onPress={this.showPrevEvent}
              disabled={this.state.currentIndex === 0}
            >
              <Svg width={30} height={20}>
                <Path
                  d="M 18 2 L 12 10 L 18 18"
                  fill="none"
                  stroke={this.state.currentIndex ? TEXT_GREY : SOFT_GREY}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </Svg>
            </ArrowContainer>
            <EventNumber>
              {this.state.currentIndex + 1} / {this.props.events.length}
            </EventNumber>
            <ArrowContainer
              onPress={this.showNextEvent}
              disabled={this.state.currentIndex === (this.props.events.length - 1)}
            >
              <Svg width={30} height={20}>
                <Path
                  d="M 12 2 L 18 10 L 12 18"
                  fill="none"
                  stroke={(
                    this.state.currentIndex === (this.props.events.length - 1) ?
                      SOFT_GREY : TEXT_GREY
                  )}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </Svg>
            </ArrowContainer>
          </PageControl>
        ) : null}
      </Container>
    );
  }
}

Unexpanded.propTypes = {
  navigation: PropTypes.shape().isRequired,
  events: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  isUpcomingClassesPage: PropTypes.bool.isRequired,
};

export default withNavigation(Unexpanded);
