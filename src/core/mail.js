/*
 * functions for mail verify
 * @flow
 */

// must use require for arguments
import Sequelize from 'sequelize';
import logger from './logger';

import { HOUR, MINUTE } from './constants';
import { HOSTURL } from './config';
import { DailyCron, HourlyCron } from '../utils/cron';

import RegUser from '../data/models/RegUser';

const sendmail = require('sendmail')({ silent: true });


// TODO make code expire
class MailProvider {
  verify_codes: Object;

  constructor() {
    this.clear_codes = this.clear_codes.bind(this);

    this.verify_codes = {};
    HourlyCron.hook(this.clear_codes);
    DailyCron.hook(MailProvider.clean_users);
  }

  send_verify_mail(to, name) {
    const past_mail = this.verify_codes[to];
    if (past_mail) {
      const min_left = Math.floor(past_mail.timestamp / MINUTE + 15 - Date.now() / MINUTE);
      if (min_left > 0) {
        logger.info(`Verify mail for ${to} - already sent, ${min_left} minutes left`);
        return `We already sent you a verification mail, you can request another one in ${min_left} minutes.`;
      }
    }
    logger.info(`Sending verification mail to ${to} / ${name}`);
    const code = this.set_code(to);
    const verify_url = `${HOSTURL}/api/auth/verify?token=${code}`;
    sendmail({
      from: 'donotreply@pixelplanet.fun',
      to,
      replyTo: 'donotreply@pixelplanet.fun',
      subject: `Welcome ${name} to PixelPlanet, plese verify your mail`,
      text: `Hello,\nwelcome to our little community of pixelplacers, to use your account, you have to verify your mail. You can do that here:\n ${verify_url} \nHave fun and don't hesitate to contact us if you encouter any problems :)\nThanks`,
    }, (err, reply) => {
      if (err) {
        logger.error(err & err.stack);
      }
    });
    return null;
  }

  async send_passd_reset_mail(to, ip) {
    const past_mail = this.verify_codes[to];
    if (past_mail) {
      if (Date.now() < past_mail.timestamp + 15 * MINUTE) {
        logger.info(`Password reset mail for ${to} requested by ${ip} - already sent`);
        return 'We already sent you a mail with instructions. Please wait before requesting another mail.';
      }
    }
    const reguser = await RegUser.findOne({ where: { email: to } });
    if (past_mail || !reguser) {
      logger.info(`Password reset mail for ${to} requested by ${ip} - mail not found`);
      return "Couldn't find this mail in our database";
    }
    /*
     * not sure if this is needed yet
     * does it matter if spaming password reset mails or verifications mails?
     *
    if(!reguser.verified) {
      logger.info(`Password reset mail for ${to} requested by ${ip} - mail not verified`);
      return "Can't reset password of unverified account.";
    }
    */

    logger.info(`Sending Password reset mail to ${to}`);
    const code = this.set_code(to);
    const restore_url = `${HOSTURL}/reset_password?token=${code}`;
    sendmail({
      from: 'donotreply@pixelplanet.fun',
      to,
      replyTo: 'donotreply@pixelplanet.fun',
      subject: 'You forgot your password for PixelPlanet? Get a new one here',
      text: `Hello,\nYou requested to get a new password. You can change your password within the next 30min here:\n ${restore_url} \nHave fun and don't hesitate to contact us if you encouter any problems :)\nIf you did not request this mail, please just ignore it (the ip that requested this mail was ${ip}).\nThanks`,
    }, (err, reply) => {
      if (err) {
        logger.error(err & err.stack);
      }
    });
    return null;
  }

  set_code(email) {
    const code = MailProvider.create_code();
    this.verify_codes[email] = {
      code,
      timestamp: Date.now(),
    };
    return code;
  }

  async clear_codes() {
    const cur_time = Date.now();
    const to_delete = [];
    for (const iteremail in this.verify_codes) {
      if (cur_time > this.verify_codes[iteremail].timestamp + HOUR) {
        to_delete.push(iteremail);
      }
    }
    to_delete.forEach((email) => {
      logger.info(`Mail Code for ${email} expired`);
      delete this.verify_codes[email];
    });
  }

  // Note: code gets deleted on check
  check_code(code) {
    let email = null;
    for (const iteremail in this.verify_codes) {
      if (this.verify_codes[iteremail].code == code) {
        email = iteremail;
        break;
      }
    }
    if (!email) {
      logger.info(`Mail Code ${code} not found.`);
      return false;
    }
    logger.info(`Got Mail Code from ${email}.`);
    delete this.verify_codes[email];
    return email;
  }

  async verify(code) {
    const email = this.check_code(code);
    if (!email) return false;

    const reguser = await RegUser.findOne({ where: { email } });
    if (!reguser) {
      logger.error(`${email} does not exist in database`);
      return false;
    }
    await reguser.update({
      mailVerified: true,
      verificationReqAt: null,
    });
    return true;
  }

  static create_code() {
    const part1 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const part2 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `${part1}-${part2}`;
  }

  static clean_users() {
    // delete users that requier verification for more than 4 days
    /*
    RegUser.destroy({
      where: {
        verificationReqAt: {
          [Sequelize.Op.lt]: Sequelize.literal('CURRENT_TIMESTAMP - INTERVAL 4 DAY'),
        },
        // NOTE: this means that minecraft verified accounts do not get deleted
        verified: 0,
      },
    });
    */
  }
}

export const mailProvider = new MailProvider();

export default mailProvider;
