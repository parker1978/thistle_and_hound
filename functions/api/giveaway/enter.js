import {route, submitEntry} from '../../../server/giveaway.js';

export const onRequestPost = route(submitEntry);
