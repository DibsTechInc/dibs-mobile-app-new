import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { WHITE, LIGHT_GREY } from '../../constants';
import { addCreditLoadToCart, removeCreditLoadFromCart } from '../../actions';
import { FlexRow, HeavyText } from '../styled';
import Overlay from './PurchaseItem/Overlay';
import Button from './PurchaseItem/Button';

const Container = styled(FlexRow)`
  align-items: center;
  justify-content: space-between;
  background: ${WHITE},
  border-bottom-width: 1;
  border-bottom-color: ${LIGHT_GREY};
  overflow: hidden;
  padding-top: 20;
  padding-bottom: ${props => (props.showOverlay ? 40 : 20)};
`;

const MarginedView = styled.View`
  margin-horizontal: 25;
`;

const DescriptionView = styled(MarginedView)`
  width: 50%;
`;

const PayAmount = styled(HeavyText)`
  font-size: 18px;
`;

/**
 * @class CreditLoadItem
 * @extends {React.PureComponent}
 */
class CreditLoadItem extends React.PureComponent {
  /**
   * @constructor
   * @constructs EventListItem
   * @param {Object} props for component
   */
  constructor(props) {
    super(props);
    this.state = { showOverlay: false };
    this.showOverlayAndStartTimer = this.showOverlayAndStartTimer.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
  }
  /**
   * @param {Object} props for component
   * @returns {undefined}
   */
  componentWillReceiveProps(props) {
    if (this.props.quantity !== props.quantity && props.quantity) {
      this.showOverlayAndStartTimer();
    }
    if (!props.quantity) {
      this.setState({ showOverlay: false });
    }
  }
  /**
   * @returns {undefined}
   */
  componentWillUnmount() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
  }
  /**
   * @returns {undefined}
   */
  addToCart() {
    this.props.addCreditLoadToCart(this.props.id);
  }
  /**
   * @returns {undefined}
   */
  removeFromCart() {
    this.props.removeCreditLoadFromCart(this.props.id);
  }
  /**
   * @returns {undefined}
   */
  showOverlayAndStartTimer() {
    if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
    this.setState({ showOverlay: true });
    this.overlayTimeout = setTimeout(() => {
      this.setState({ showOverlay: false });
      this.overlayTimeout = null;
    }, 5000);
  }
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    return (
      <Container showOverlay={this.state.showOverlay}>
        {this.state.showOverlay ? (
          <Overlay
            {...this.props}
            removeItem={this.removeFromCart}
            addToCart={this.addToCart}
            fromPackage
          />
        ) : undefined}
        <DescriptionView>
          <PayAmount>
            {this.props.formattedPayAmount}
          </PayAmount>
          <HeavyText>
            Receive {this.props.formattedReceiveAmount}
          </HeavyText>
        </DescriptionView>
        <MarginedView>
          <Button
            {...this.props}
            text="Buy"
            addToCart={this.addToCart}
            showOverlay={this.showOverlayAndStartTimer}
          />
        </MarginedView>
      </Container>
    );
  }
}

CreditLoadItem.propTypes = {
  id: PropTypes.number.isRequired,
  formattedPayAmount: PropTypes.string.isRequired,
  formattedReceiveAmount: PropTypes.string.isRequired,
  addCreditLoadToCart: PropTypes.func.isRequired,
  removeCreditLoadFromCart: PropTypes.func.isRequired,
  quantity: PropTypes.number.isRequired,
};

// const mapStateToProps = state => ({});
const mapDispatchToProps = {
  addCreditLoadToCart,
  removeCreditLoadFromCart,
};

export default connect(null, mapDispatchToProps)(CreditLoadItem);
