import { stringify } from 'qs';
import moment from 'moment';
import {
  SET_EVENTS,
  SET_EVENT_SOLD_OUT,
  SET_EVENTS_LOADING_TRUE,
  SET_EVENTS_LOADING_FALSE,
  SETTING_EVENT_VIA_ACTION,
} from '../constants/EventConstants';
import { getEventsOnCurrentDate } from '../../selectors/Events';
import { setCurrentDate } from '../CurrentDateActions';
