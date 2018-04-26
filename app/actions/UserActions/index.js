import { AsyncStorage } from 'react-native';

import {
  SET_USER,
} from '../../constants/UserConstants';

export function setUser(payload) {
  return { type: SET_USER, payload };
}

function onValueChange(item, selectedValue) {
  try {
    await AsyncStorage.setItem(item, selectedValue);
  } catch (err) {
    console.log('AsyncStorage error: ' + error.message);
  }
}

/**
 * requestUserData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestUserData(cb) {
  return async function innerRequestUserData(dispatch, getState) {
    const token = await AsyncStorage.getItem('STORAGE_KEY');

    if (!token) {
      return cb();
    }

    const query = '';

    fetch(query, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
      }
    })
      .then(res => res.json())
      .then((res) => {
        console.log(res, 'what dis')
        dispatch(setUser(res.user));
        cb();
      })
      .catch(error => {
        // set error here
        console.log(error);
      });
  }
}

export function signUpUser(payload, cb) {
  return async function innerSignInUser(dispatch, getState) {
    const query = '';

    const {
      email,
      password,
      signupMethod,
      signupStudioId,
      signupStudioSource,
      signupDibsStudioId,
      address,
      birthday,
      city,
      state,
      zip,
      referredBy,
    } = payload;

    fetch(query, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password,
        signupMethod,
        signupStudioId,
        signupStudioSource,
        signupDibsStudioId,
        address,
        birthday,
        city,
        state,
        zip,
        referredBy,
      },
    })
    .then(res => res.json())
    .then(res => {
      onValueChange('STORAGE_KEY', res.token);
      dispatch(setUser(res.user))
      cb();
    })
    .catch(err => {
      console.log(err);
    });
  } 
}

export function userLogin(email, password) {
  return async function innerUserLogin(dispatch, getState) {
    const query = '';

    fetch(query, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        email,
        password
      }
    })
    .then(res => res.json())
    .then(res => {
      onValueChange('STORAGE_KEY', res.token);
    })
    .catch(err => {
      console.log(err);
    })
  }
}

export function logOutUser() {
  return async function innerLogOutUser(dispatch, getState) {
    await AsyncStorage.removeItem('STORAGE_KEY');
    dispatch(setUser(null));
  }
}
