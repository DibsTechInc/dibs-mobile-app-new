import { AsyncStorage } from 'react-native';
import Config from '../../config.json';

console.log('\n\n\n\n\n\n\n',Config);

export async function dibsFetch(path, {
  type = 'json',
  body,
  requiresAuth = false,
  ...opts
} = {}) {
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
  let res = await fetch(`${Config.DIBS_HOST}${path}`, options);
  if (type === 'json') res = await res.json();
  return res;
}
