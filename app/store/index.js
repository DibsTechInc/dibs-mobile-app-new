import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { dibsFetch } from '../util';
import reducers from '../reducers';

const dibsThunk = thunk.withExtraArgument(dibsFetch);

export default createStore(
  reducers,
  composeWithDevTools(applyMiddleware(dibsThunk))
);
