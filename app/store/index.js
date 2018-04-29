import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { dibsFetch } from '../util';
import reducers from '../reducers';

export default createStore(reducers, applyMiddleware(thunk.withExtraArgument(dibsFetch)));
