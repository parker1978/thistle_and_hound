import {route, draw} from '../../../server/giveaway.js';

export const onRequestPost = route(draw);
