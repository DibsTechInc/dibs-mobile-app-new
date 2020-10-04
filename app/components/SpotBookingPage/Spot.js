import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
  LIGHT_GREY,
  GREY,
  BLACK,
  WHITE,
  ROOM_INSTRUCTOR_PLACEHOLDER,
  ROOM_ITEMS_ID,
} from '../../constants';

import { NormalText } from '../styled';
import Config from '../../../config.json';

const BaseSpot = styled.View`
  width: 25px;
  height: 25px;
  margin: 4px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
`;

const UnavailableSpot = styled(BaseSpot)`
  border-width: 1;
  background-color: ${LIGHT_GREY};
  border-color: ${LIGHT_GREY};
`;

const InstructorSpot = styled(BaseSpot)`
  width: 40px;
  height: 40px;
  border-width: 1;
  background-color: transparent;
  border-color: ${BLACK};
  overflow: hidden;
`;

const InstructorImage = styled.Image`
  width: 40px;
  height: 40px;
`;

const AvailableSpot = styled.TouchableOpacity`
  width: 25px;
  height: 25px;
  margin: 4px;
  border-width: 1;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${props => props.userSelected ? Config.STUDIO_COLOR : WHITE};
  border-color: ${props => props.userSelected ? Config.STUDIO_COLOR : BLACK};
`;

const DisplayText = styled(NormalText)`
  color: ${props => props.userSelected ? WHITE : BLACK};
`;

/**
 * @class Spot
 * @extends {React.PureComponent}
 */
class Spot extends React.PureComponent {
  /**
   * @constructor
   * @constructs Spot
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.toggleSpotInCart = this.toggleSpotInCart.bind(this);
  }

  /**
   * @returns {function} spot toggle method
   */
  toggleSpotInCart() {
    const { id, x, y, eventid, userSelected, source_id } = this.props;
    return userSelected
      ? this.props.removeSpotFromCart(eventid, { id, x, y, source_id })
      : this.props.setSpotInCart(eventid, { id, x, y, source_id });
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const hasCustomRoomConfigs = this.props.customRoomUrl && this.props.top_position && this.props.left_position;
    const displayID = this.props.displayZingfitId ? this.props.source_id : this.props.id;
    const instructorImgUrl = this.props.instructorImageURL || ROOM_INSTRUCTOR_PLACEHOLDER;
    const customPositioning = hasCustomRoomConfigs
      ? {
        top: `${this.props.top_position}%`,
        left: `${this.props.left_position}%`,
        position: 'absolute',
      }
      : {};

    switch (true) {
      case this.props.instructorImageURL && this.props.type === 'INSTRUCTOR':
        return (
          <InstructorSpot>
            <InstructorImage
              source={{ uri: instructorImgUrl }}
            />
          </InstructorSpot>
        );

      case this.props.empty || !displayID || displayID >= ROOM_ITEMS_ID:
        return <BaseSpot />;

      case !this.props.available || this.props.type === 'BROKEN':
        return (
          <UnavailableSpot
            style={{
              borderColor: hasCustomRoomConfigs ? BLACK : 'transparent',
              ...customPositioning,
            }}
          >
            <NormalText style={{ color: GREY }}>
              {displayID}
            </NormalText>
          </UnavailableSpot>
        );

      default:
        return (
          <AvailableSpot
            style={customPositioning}
            onPress={this.toggleSpotInCart}
            userSelected={this.props.userSelected}
          >
            <DisplayText
              userSelected={this.props.userSelected}
            >
              {displayID}
            </DisplayText>
          </AvailableSpot>
        );
    }
  }
}

Spot.propTypes = {
  id: PropTypes.number,
  displayZingfitId: PropTypes.bool,
  empty: PropTypes.bool,
  source_id: PropTypes.string,
  available: PropTypes.bool,
  setSpotInCart: PropTypes.func,
  userSelected: PropTypes.bool,
  x: PropTypes.number,
  y: PropTypes.number,
  eventid: PropTypes.number,
  removeSpotFromCart: PropTypes.func,
  type: PropTypes.string,
  instructorImageURL: PropTypes.string,
  customRoomUrl: PropTypes.string,
  top_position: PropTypes.number,
  left_position: PropTypes.number,
};

export default Spot;
