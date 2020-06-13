import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { LinearGradient } from 'expo-linear-gradient';

import Config from '../../../config.json';
import { lightenDarkenColor } from '../../helpers/';
import { HeavyText } from '../styled';

import {
  BLACK,
  WHITE,
} from '../../constants';

const STUDIO_COLOR_LIGHTEST = lightenDarkenColor(Config.STUDIO_COLOR, 40);
const STUDIO_COLOR_LIGHTER = lightenDarkenColor(Config.STUDIO_COLOR, 20);
const STUDIO_COLOR_DARK = lightenDarkenColor(Config.STUDIO_COLOR, -20);

const GradientView = styled.View`
  width: 60%;
`;

const RAFCardContainer = styled.View`
  border-bottom-width: 1px;
  border-color: transparent;
  overflow: hidden;
  width: 260px;
  height: 140px;
  shadow-opacity: 0.1;
  shadow-color: ${BLACK};
`;

const WhiteSquares = styled.View`
  width: 30;
  height: 30;
  border-width: 1;
  border-radius: 10;
  border-color: ${WHITE};
  position: absolute;
  right: ${props => props.right ? props.right : 0};
  bottom: ${props => props.bottom ? props.bottom : 0};
`;

/**
 * @class RAFCard
 * @extends {React.PureComponent}
 */
class RAFCard extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <RAFCardContainer style={{ shadowOffset: { height: 4, width: 2 } }}>
        <LinearGradient
          colors={[STUDIO_COLOR_LIGHTEST, STUDIO_COLOR_LIGHTER, STUDIO_COLOR_DARK]}
          style={{ width: 250, height: 130, justifyContent: 'center', paddingLeft: 20, position: 'relative' }}
        >
          <GradientView>
            <HeavyText color={WHITE} size="35px">
              {this.props.totalReferralCredit}
            </HeavyText>
            <HeavyText color={WHITE} size="18px">
              Referral Credits
            </HeavyText>
          </GradientView>
          <WhiteSquares right={10} bottom={15} />
          <WhiteSquares right={15} bottom={10} />
        </LinearGradient>
      </RAFCardContainer>
    );
  }
}

RAFCard.propTypes = {
  totalReferralCredit: PropTypes.string,
};

export default RAFCard;
