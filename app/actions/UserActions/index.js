import { AsyncStorage } from 'react-native';
import { createAction } from 'redux-actions';

export const setUser = createAction('SET_USER', payload => payload);

/**
 * @param {string} email validates email
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function validateEmail(email, callback = () => {}) {
  return async function innerValidateEmail(dispatch, getState, dibsFetch) {
    try {
      const path = '/api/user/email/verify';
      const res = await dibsFetch(path, {
        method: 'POST',
        body: {
          email,
          validate: true,
        },
      });
      if (res.success) {
        return callback('Login');
      }
      if (res.message === 'No user with that email') {
        return callback('Register');
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

export function userLogin(email, password, callback = () => {}) {
  return async function innerUserLogin(dispatch, getState, dibsFetch) {
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
          password,
        })
      });

      res = await res.json();
      await AsyncStorage.setItem('STORAGE_KEY', res.token);
      dispatch(setUser(res.user));
      callback();
    } catch (err) {
      console.log(err);
    }
  }
}

export function logOutUser(callback = () => {}) {
  return async function innerLogOutUser(dispatch) {
    await AsyncStorage.removeItem('STORAGE_KEY');
    dispatch(setUser({}));
    callback();
  };
}
