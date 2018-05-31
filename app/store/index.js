import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { dibsFetch } from '../util';
import reducers from '../reducers';
import subscribeToAlerts from './subscribe-to-alerts';

const dibsThunk = thunk.withExtraArgument(dibsFetch);

const store = createStore(
  reducers,
  composeWithDevTools(applyMiddleware(dibsThunk))
);

store.subscribe(subscribeToAlerts.bind(null, store));

export default store;
