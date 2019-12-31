import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { NormalText } from '../../styled';
import { WHITE } from '../../../constants';
import Config from '../../../../config.json';

const FilterStyledButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  align-self: flex-start;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  margin-bottom: 10px;
  border-color: ${props => props.isSelected ? Config.STUDIO_COLOR : WHITE};
  background-color: ${props => props.isSelected ? WHITE : Config.STUDIO_COLOR};
  border-radius: 10px;
  border-width: 1px;
`;

const FilterText = styled(NormalText)`
  color: ${props => props.isSelected ? Config.STUDIO_COLOR : WHITE}
`;

/**
 * @class FilterButton
 * @extends {React.PureComponent}
 */
class FilterButton extends React.PureComponent {
  /**
   * @constructor
   * @constructs FilterButton
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);

    this.onHandleLocationChange = this.onHandleLocationChange.bind(this);
  }
  /**
   * @return {undefined}
   */
  onHandleLocationChange() {
    this.props.handleLocationChange(this.props.location);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const applySettings = this.props.isDefaultFilter || (this.props.selectedLocationId === this.props.location.value);
    return (
      <FilterStyledButton isSelected={applySettings} onPress={this.onHandleLocationChange}>
        <FilterText isSelected={applySettings}>{this.props.name}</FilterText>
      </FilterStyledButton>
    );
  }
}

FilterButton.defaultProps = {
  isDefaultFilter: false,
};

FilterButton.propTypes = {
  name: PropTypes.string.isRequired,
  isDefaultFilter: PropTypes.bool,
  handleLocationChange: PropTypes.func,
  location: PropTypes.shape(),
  selectedLocationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default FilterButton;
