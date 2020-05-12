/*
 *
 * @flow
 */


/*
 * splits chat message into array of what it represents
 * [[type, text],[type, text], ...]
 * type:
 *   't': text
 *   'p': ping
 *   'c': coordinates
 *   'm': mention of somebody else
 *  nameRegExp has to be in the form of:
      new RegExp(`(^|\\s+)(@${ownName})(\\s+|$)`, 'g');
 */
const linkRegExp = /(#[a-z]*,-?[0-9]*,-?[0-9]*(,-?[0-9]+)?)/gi;
const linkRegExpFilter = (val, ind) => ((ind % 3) !== 2);
const mentionRegExp = /(^|\s+)(@\S+)/g;
const spaceFilter = (val, ind) => (val !== ' ' && (ind !== 0 | val !== ''));

function splitChatMessageRegexp(
  msgArray,
  regExp,
  ident,
  filter = () => true,
) {
  return msgArray.map((msgPart) => {
    const [type, part] = msgPart;
    if (type !== 't') {
      return [msgPart];
    }
    return part
      .split(regExp)
      .filter(filter)
      .map((stri, i) => {
        if (i % 2 === 0) {
          return ['t', stri];
        }
        return [ident, stri];
      })
      .filter((el) => !!el[1]);
  }).flat(1);
}

function splitChatMessage(message, nameRegExp = null) {
  if (!message) {
    return null;
  }
  let arr = [['t', message.trim()]];
  arr = splitChatMessageRegexp(arr, linkRegExp, 'c', linkRegExpFilter);
  if (nameRegExp) {
    arr = splitChatMessageRegexp(arr, nameRegExp, 'p', spaceFilter);
  }
  arr = splitChatMessageRegexp(arr, mentionRegExp, 'm', spaceFilter);
  return arr;
}

export default splitChatMessage;
