import { AsyncStorage } from 'react-native';
import { createAction } from 'redux-actions';
import {
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  PASSWORD_RESET_ROUTE,
} from '../../constants/RouteConstants';
import Config from '../../../config.json';
import {
  requestCreditCardInfo,
  removeCreditCard,
  requestUserEvents,
  setUpcomingEvents,
  clearCart,
  refreshCart,
  enqueueApiError,
} from '../index';

export const setUser = createAction('SET_USER', payload => payload);

/**
 * @param {Object} user json to set in state
 * @returns {function} thunk
 */
export function refreshUser(user) {
  return function innerRefreshUser(dispatch) {
    dispatch(setUser(user));
    dispatch(refreshCart());
  };
}

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function logOutUser() {
  return async function innerLogOutUser(dispatch) {
    try {
      await AsyncStorage.removeItem(Config.USER_TOKEN_KEY);
      dispatch(setUser({}));
      dispatch(removeCreditCard());
      dispatch(setUpcomingEvents([]));
      dispatch(clearCart());
    } catch (err) {
      console.log(err);
    }
  };
}


/**
 * @returns {function} thunk
 */
export function recordStudioVisit() {
  return async function innerRecordStudioVisit(dispatch, getState, dibsFetch) {
    try {
      await dibsFetch(`/api/user/visit/${Config.DIBS_STUDIO_ID}`, {
        method: 'POST',
        requiresAuth: true,
      });
    } catch (err) {
      console.log(err);
    }
  };
}

/**
 * @param {boolean} [showAlert=true] if false will not show native alert on fail
 * @returns {function} thunk
 */
export function requestUserData(showAlert = true) {
  return async function innerRequestUserData(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestCreditCardInfo());
        dispatch(requestUserEvents());
      } else if (showAlert) {
        await AsyncStorage.removeItem(Config.USER_TOKEN_KEY);
        dispatch(logOutUser());
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (err) {
      console.log(err);
      if (showAlert) dispatch(enqueueApiError({ title: 'Uh oh!', message: 'Something went wrong loading your account.' }));
      else throw err;
    }
  };
}

/**
 * @param {string} email validates email
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function validateEmail(email, callback) {
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
      if (res.message === 'Needs to reset password') {
        return callback(PASSWORD_RESET_ROUTE);
      }
      if (res.message === 'No user with that email') {
        return callback(REGISTER_ROUTE);
      }
      dispatch(enqueueApiError({ title: 'Uh oh!', message: `${res.message}.` }));
      return callback(null);
    } catch (err) {
      console.log(err);
      dispatch(enqueueApiError({ title: 'Uh oh!', message: 'Something went wrong validating your email.' }));
      return callback(null);
    }
  };
}

/**
 * @param {object} payload user registration data
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function signUpUser(payload, callback) {
  return async function innerSignUpUser(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/register', {
        method: 'POST',
        body: {
          ...payload,
          signupMethod: 'Mobile App',
        },
      });
      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestUserEvents());
        return callback();
      }
      if (res.accountDisabled) {
        throw new Error('Account disabled');
      }
      dispatch(enqueueApiError({ title: 'Uh oh!', message: `${res.message}.` }));
      return callback(res);
    } catch (err) {
      console.log(err);
      dispatch(enqueueApiError({ title: 'Uh oh!', message: 'Something went wrong during registration.' }));
      return callback(err);
    }
  };
}

/**
 * @param {string} email of user
 * @param {string} password user entered
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function submitLogin(email, password, callback) {
  return async function innerUserLogin(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/login', {
        method: 'POST',
        body: {
          email,
          password,
        },
      });
      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(recordStudioVisit());
        dispatch(requestCreditCardInfo());
        dispatch(requestUserEvents());
        callback(res);
      } else {
        dispatch(enqueueApiError({ title: 'Uh oh!', message: `${res.message}.` }));
        callback(res);
      }
    } catch (err) {
      dispatch(enqueueApiError({ title: 'Uh oh!', message: 'Something went wrong logging you in.' }));
      console.log(err);
    }
  };
}

/**
 * updateUser
 * @param {Object} payload from the request
 * @param {function} callback callback function
 * @returns {function} redux thunk
 */
export function updateUser(payload, callback) {
  return async function innerUpdateUser(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }
      callback(res);
    } catch (err) {
      console.log(err);
      callback({ message: 'Something went wrong updating your account.' });
    }
  };
}

/**
 * @param {Object} payload from the request
 * @param {function} callback callback function
 * @returns {function} redux thunk
 */
export function updateUserPassword(payload, callback) {
  return async function innerUpdateUserPassword(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/update-password', {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }

      callback(res);
    } catch (err) {
      console.log(err);
      callback(null);
    }
  };
}

/**
 * @param {string} list add or remove
 * @param {string} email email of user
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function updateUserEmailPreferences(list) {
  return async function innerUpdateUserEmailPreferences(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch(`/api/user/email/suppression-list/${list}`, {
        method: 'PUT',
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
      }
    } catch (err) {
      console.log(err);
    }
  };
}
/**
 * @param {String} email of user
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function createPasswordResetLink(email, callback = () => {}) {
  return async function innerCreatePasswordResetLink(dispatch, getState, dibsFetch) {
    try {
      const { success, message } = await dibsFetch('/api/user/password/reset', {
        method: 'POST',
        body: { email, fromWidget: true, studioId: Config.DIBS_STUDIO_ID },
      });
      return callback(null, { success, message });
    } catch (err) {
      console.log(err);
      return callback(null, { success: false, message: 'Something went wrong sending your password reset email.' });
    }
  };
}

/**
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function disableUserAccount(callback) {
  return async function innerDisableUserAccount(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user', {
        requiresAuth: true,
        method: 'DELETE',
      });

      if (res.success) {
        dispatch(logOutUser());
      }

      dispatch(enqueueApiError({ title: 'Uh oh!', message: `${res.message}.` }));
      callback(res);
    } catch (err) {
      dispatch(enqueueApiError({ title: 'Uh oh!', message: 'There was a problem deactivating your account.' }));
      console.log(err);
      callback(err);
    }
  };
}

/**
 * @param {string} email user email
 * @param {password} password user's password
 * @param {function} callback callback
 * @returns {function} redux thunk
 */
export function reactivateUserAccount(email, password, callback) {
  return async function innerReactivateUserAccount(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/reactivate', {
        method: 'PUT',
        body: {
          email,
          password,
        },
      });

      callback(res);
    } catch (err) {
      console.log(err);
      callback(err);
    }
  };
}
