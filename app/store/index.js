import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { dibsFetch } from '../util';
import reducers from '../reducers';

console.log(process.env.NODE_ENV);

export default createStore(
  reducers,
  composeWithDevTools(applyMiddleware(thunk.withExtraArgument(dibsFetch)))
);
