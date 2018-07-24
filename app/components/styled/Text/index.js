import styled from 'styled-components';
import { BLACK } from '../../../constants';

export const HeavyText = styled.Text`
  font-family: studio-font-heavy;
  font-size: ${props => props.size ? props.size : '16px'};
  color: ${props => props.color ? props.color : BLACK};
`;

export const NormalText = styled.Text`
  font-family: studio-font;
  font-size: ${props => props.size ? props.size : '16px'};
  color: ${props => props.color ? props.color : BLACK};
`;
