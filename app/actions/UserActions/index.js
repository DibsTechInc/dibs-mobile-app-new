import { AsyncStorage } from 'react-native';
import { createAction } from 'redux-actions';
import { LOGIN_ROUTE, REGISTER_ROUTE } from '../../constants/RouteConstants';
import Config from '../../../config.json';

export const setUser = createAction('SET_USER', payload => payload);

/**
 * @param {string} email validates email
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function validateEmail(email, callback = () => {}) {
  return async function innerValidateEmail(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/email/verify', {
        method: 'POST',
        body: {
          email,
          validate: true,
        },
      });
      if (res.success) {
        return callback(LOGIN_ROUTE);
      }
      if (res.message === 'No user with that email') {
        return callback(REGISTER_ROUTE);
      }
      return callback(null);
    } catch (err) {
      console.log(err);
      return callback(null);
    }
  };
}

/*** in progress */
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

/**
 * @param {string} email of user
 * @param {string} password user entered
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function submitLogin(email, password) {
  return async function innerUserLogin(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/login', {
        method: 'POST',
        body: {
          email,
          password,
        },
      });
      if (res.success) dispatch(setUser(res.user));
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
  };
}

export function logOutUser(callback = () => {}) {
  return async function innerLogOutUser(dispatch) {
    try {
      await AsyncStorage.removeItem(Config.USER_TOKEN_KEY);
      dispatch(setUser({}));
      callback();
    } catch (err) {
      console.log(err);
    }
  };
}
