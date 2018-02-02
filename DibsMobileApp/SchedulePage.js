'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';

export default class SchedulePage extends Component<{}> {
    render() {
        return (
        <View style={styles.container}>
            <Text style={styles.description}>
            Flex Studios schedule will be here asdlfkasldkfjkals!
            </Text>
            <Text style={styles.description}>
            Book a class at Flex!
            </Text>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    description: {
        marginBottom: 20,
        fontSize: 18,
        textAlign: 'center',
        color: '#656565'
    },
    container: {
        padding: 30,
        marginTop: 65,
        alignItems: 'center'
    },
});