import { t, auth } from '../common';

/**
 * Ensures the user is logged in.
 */
export const userRequired = auth.policy.userRequired;

/**
 * Ensure the user can [READ] the message.
 */
export const read: t.IAuthPolicy = {
  name: 'MSG/read',
  eval(e) {
    console.log(`\nTODO 🐷  policy - read \n`);
  },
};

/**
 * Ensure the user can [SAVE] the message.
 */
export const save: t.IAuthPolicy = {
  name: 'MSG/save',
  eval(e) {
    console.log(`\nTODO 🐷  policy - save \n`);
  },
};
