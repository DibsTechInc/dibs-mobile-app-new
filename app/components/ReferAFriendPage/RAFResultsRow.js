import React from 'react';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { HeavyText, NormalText } from '../styled';
import { Emoji } from '../shared';

import {
  WHITE,
  LIGHT_GREY,
} from '../../constants';

const RAFRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  background-color: ${WHITE};
  width: 100%;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${LIGHT_GREY};
`;

/**
 * @class RAFResultsRow
 * @extends {React.PureComponent}
 */
class RAFResultsRow extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const leftText = this.props.hasLink ?
      (
        <TouchableOpacity onPress={this.props.toggleShouldFocus}>
          <NormalText color={this.props.leftTextColor}>
            {this.props.leftText}
          </NormalText>
        </TouchableOpacity>
      ) :
      (
        <NormalText color={this.props.leftTextColor}>
          {this.props.leftText}
        </NormalText>
      );

    const rightText = this.props.earned ?
      (
        <HeavyText color={this.props.rightTextColor}>
          <Emoji name="moneybag" /> {this.props.rightText}
        </HeavyText>
      ) :
      (
        <NormalText color={this.props.rightTextColor}>
          {this.props.rightText}
        </NormalText>
      );

    if (this.props.isHeader) {
      return (
        <RAFRow>
          <HeavyText color={this.props.leftTextColor}>
            {this.props.leftText}
          </HeavyText>
          <HeavyText color={this.props.rightTextColor}>
            {this.props.rightText}
          </HeavyText>
        </RAFRow>
      );
    }

    return (
      <RAFRow>
        {leftText}
        {rightText}
      </RAFRow>
    );
  }
}

RAFResultsRow.defaultProps = {
  earned: false,
};

RAFResultsRow.propTypes = {
  leftText: PropTypes.string,
  rightText: PropTypes.string,
  leftTextColor: PropTypes.string,
  rightTextColor: PropTypes.string,
  earned: PropTypes.bool,
  isHeader: PropTypes.bool,
  hasLink: PropTypes.bool,
  toggleShouldFocus: PropTypes.func,
};

export default RAFResultsRow;
