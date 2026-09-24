import {route, exportEntries} from '../../../server/giveaway.js';

export const onRequestGet = route(exportEntries);
