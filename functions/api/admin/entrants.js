import {route, listEntrants} from '../../../server/giveaway.js';

export const onRequestGet = route(listEntrants);
