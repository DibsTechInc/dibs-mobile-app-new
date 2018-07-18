import { AsyncStorage } from 'react-native';
import Sentry from 'sentry-expo';
import Config from '../../config.json';
import store from '../store';
import { enqueueConnectionError } from '../actions';

let lastCheck;

const HOST = __DEV__ ? Config.DIBS_HOST : 'https://www.ondibs.com';

/**
 * @returns {undefined}
 */
async function checkNetworkConnection() {
  if (lastCheck && (Date.now() - lastCheck < 15e3)) return;
  const googleCall = await fetch('https://google.com', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: 0,
    },
  });
  lastCheck = Date.now();
  if (googleCall.status !== 200) {
    store.dispatch(enqueueConnectionError({ title: 'Error!', message: 'You must be connected to the internet to use this app.' }));
    throw new Error('Not connected to the internet');
  }
}

/**
 * @param {function} refreshToken when making authenticated requests
 * @param {string} path to route on Dibs server
 * @param {Object} opts options for fetch call and some custom ones
 * @returns {Object} response from Dibs server
 */
async function dibsFetch(refreshToken, path, {
  type = 'json',
  body,
  requiresAuth = false,
  ...opts
} = {}) {
  await checkNetworkConnection();
  const headers = {};
  switch (type) {
    case 'json':
    default:
      headers.Accept = 'application/json';
      headers['Content-Type'] = 'application/json';
  }
  if (requiresAuth) {
    const token = await AsyncStorage.getItem(Config.USER_TOKEN_KEY);
    headers.Authorization = `Bearer ${token}`;
  }
  const options = { headers, ...opts };
  if (body) options.body = JSON.stringify(body);
  let res = await fetch(`${HOST}${path}`, options);
  if (type === 'json') {
    try {
      res = await res.json();
    } catch (err) {
      Sentry.captureException(new Error(err));
      throw err;
    }
  }
  if ((requiresAuth || /login|register/.test(path)) && res.success) refreshToken(path, res);
  return res;
}

/**
 * @param {string} path to route on Dibs server
 * @param {Object} res response body of parent request
 * @returns {Promise<undefined>} refreshes the user's JWT
 */
async function refreshUserToken(path, res) {
  try {
    if (/logout/.test(path)) return;
    if (/login|register/.test(path) && res.token) {
      await AsyncStorage.setItem(Config.USER_TOKEN_KEY, res.token);
      return;
    }
    const response = await dibsFetch(() => {}, '/api/user/refresh-token', {
      method: 'GET',
      requiresAuth: true,
    });
    if (response.success) await AsyncStorage.setItem(Config.USER_TOKEN_KEY, response.token);
  } catch (err) {
    Sentry.captureException(new Error(err));
    console.error(err);
  }
}

export default dibsFetch.bind(null, refreshUserToken);
