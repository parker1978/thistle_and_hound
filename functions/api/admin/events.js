import {route, listEvents} from '../../../server/giveaway.js';

export const onRequestGet = route(listEvents);
