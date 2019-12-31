import styled from 'styled-components';
import { Dimensions } from 'react-native';
import { WHITE, LIGHT_GREY, BLACK } from '../../../constants';
import Config from '../../../../config.json';

export const FlexCenter = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const FlexRow = styled.View`
  flex-direction: row;
`;

export const RightAlignedColumn = styled.View`
  align-items: flex-end;
`;

export const SpaceBetweenRow = styled(FlexRow)`
  justify-content: space-between;
`;

export const StudioColorBottomBorder = styled.View`
  border-bottom-width: 1;
  border-color: ${Config.STUDIO_COLOR}
`;

export const MaterialPanelView = styled.View`
  background-color: ${WHITE};
  border-radius: ${props => (props.borderRadius || '3px')};
  border-color: ${LIGHT_GREY};
  border-left-width: 0;
  border-top-width: 0;
  border-bottom-width: 1;
  border-bottom-color: ${props => props.isCartPage ? LIGHT_GREY : 'transparent'};
  elevation: 3;
  height: ${props => (props.height ? props.height : 'auto')};
  padding-horizontal: ${props => props.isCartPage ? '10px' : 0};
  padding-top: 15px;
  padding-bottom: 20px;
  shadow-color: ${LIGHT_GREY};
  shadow-opacity: 0.1;
  shadow-radius: 5;
  width: ${props => (props.width || (Dimensions.get('window').width))};
`;

export const Overlay = styled.View`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

export const ElevatedView = styled.View`
  justify-content: space-between;
  align-items: flex-start;
  border-top-width: 1;
  border-left-width: 1;
  border-color: ${LIGHT_GREY};
  elevation: 3;
  background-color: ${WHITE};
  shadow-color: ${BLACK};
  shadow-opacity: 0.02;
  margin: 10px;
  padding: ${props => props.noPadding ? '0px' : '20px'};
`;

