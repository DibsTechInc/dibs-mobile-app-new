import styled from 'styled-components';
import { Dimensions } from 'react-native';
import { WHITE } from '../../../constants';

export const FlexCenter = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const SpaceBetweenRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

export const MaterialPanelView = styled.View`
  background-color: ${WHITE};
  border-radius: ${props => (props.borderRadius || '3px')};
  height: ${props => (props.height ? props.height : 'auto')};
  width: ${props => (props.width || (Dimensions.get('window').width - 20))};
  margin: 10px;
  border-width: 0.3;
  border-color: #ddd;
  border-top-width: 0;
  border-left-width: 0;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 4;
  elevation: 3;
`;

