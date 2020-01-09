/*
 * functionf for validation of user input
 * @flow
 */

// eslint-disable-next-line no-useless-escape, max-len
const mailTester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

export function validateEMail(email) {
  if (!email) return "Email can't be empty.";
  if (email.length < 5) return 'Email should be at least 5 characters long.';
  if (email.length > 40) return "Email can't be longer than 40 characters.";
  if (email.indexOf('.') === -1) return 'Email should at least contain a dot';
  if (email.split('').filter((x) => x === '@').length !== 1) {
    return 'Email should contain a @';
  }
  if (!mailTester.test(email)) return 'Your Email looks shady';
  return false;
}

export function validateName(name) {
  if (!name) return "Name can't be empty.";
  if (name.length < 4) return 'Name must be at least 4 characters long';
  if (name.length > 26) return 'Name must be shorter than 26 characters';
  if (
    name.indexOf('@') !== -1
    || name.indexOf('/') !== -1
    || name.indexOf('\\') !== -1
    || name.indexOf('>') !== -1
    || name.indexOf('<') !== -1
    || name.indexOf('#') !== -1
  ) {
    return 'Name contains invalid character like @, /, \\ or #';
  }
  return false;
}

export function sanitizeName(name) {
  name = name.substring(0, 25);
  // just sanitizes @ for now, other characters do not seem
  // problematic, even thought that we rule them out in validateName
  name = name.replace(/@/g, 'at');
  return name;
}

export function validatePassword(password) {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (password.length > 60) {
    return 'Password must be shorter than 60 characters.';
  }
  return false;
}

export function validateFactionPassword(password) {
  if (password.length === 0) return 'Must enter password to join private faction.';
  return false;
}

export function validateFactionName(name) {
  if (name.length < 4) return 'Name must be at least 4 characters long.';
  if (name.length > 50) return 'Name must be shorter than 50 characters long.';
  return false;
}

export function validateFactionIcon(icon) {
  if (icon.length === 0) return 'You must choose an icon for your faction.';
  return false;
}

/*
 * makes sure that responses from the api
 * includes errors when failure occures
 */
export async function parseAPIresponse(response) {
  try {
    const resp = await response.json();
    if (!response.ok && !resp.errors) {
      return {
        errors: ['Could not connect to server, please try again later :('],
      };
    }
    return resp;
  } catch (e) {
    return {
      errors: ['I think we experienced some error :('],
    };
  }
}
