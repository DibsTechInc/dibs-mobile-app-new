import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import nodeEmoji from 'node-emoji';

/**
 * @class Emoji
 * @extends {React.PureComponent}
 */
class Emoji extends React.PureComponent {
  /**
   * render
   * @returns {JSX.Element} HTML
   */
  render() {
    const emoji = nodeEmoji.get(this.props.name);
    return (
      <Text>
        {emoji}
      </Text>
    );
  }
}

Emoji.propTypes = {
  name: PropTypes.string,
};

export default Emoji;
