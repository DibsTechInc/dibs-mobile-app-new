import { AsyncStorage } from 'react-native';

import {
  SET_USER,
  GET_USER,
  SET_USER_AUTH_STATUS_ROUTE,
} from '../../constants/UserConstants';

export function setUser(payload) {
  return { type: SET_USER, payload };
}

export function setUserAuthStatusRoute(payload) {
  return { type: SET_USER_AUTH_STATUS_ROUTE, payload }
}

export function validateEmail(email) {
  return async function innerValidateEmail(dispatch) {
    const query = 'http://a989a625.ngrok.io/api/user/email/verify';
    const ENTER_PASSWORD_ROUTE = 'Password';

    try {
      let res = await fetch(query, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          validate: true,
        })
      });

      res = await res.json();

      if (res.success) return dispatch(setUserAuthStatusRoute('Login'));
      if (res.message === 'No user with that email') return dispatch(setUserAuthStatusRoute('Register'));
    } catch (err) {
      console.log(err);
    }
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
      // auth-related work in progress
      // onValueChange('STORAGE_KEY', res.token);
      dispatch(setUser(res.user))
      cb();
    })
    .catch(err => {
      console.log(err);
    });
  } 
}

// works tested
export function userLogin(email, password, cb = () => {}) {
  return async function innerUserLogin(dispatch, getState) {
    const query = 'http://a989a625.ngrok.io/api/user/login';

    try {
      let res = await fetch(query, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      res = await res.json();
      await AsyncStorage.setItem('STORAGE_KEY', res.token);
      dispatch(setUser(res.user));
      cb();
    } catch (err) {
      console.log(err);
    }
  }
}

export function logOutUser(cb = () => {}) {
  return async function innerLogOutUser(dispatch, getState) {
    await AsyncStorage.removeItem('STORAGE_KEY');
    dispatch(setUser(null));
    cb();
  }
}
