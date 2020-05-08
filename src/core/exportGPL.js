/*
 *
 * @flow
 */

function appendNumberText(number) {
  let appendStr = `${number} `;
  if (number < 10) appendStr += '  ';
  else if (number < 100) appendStr += ' ';
  return appendStr;
}
function appendHexColorText(clr) {
  let appendStr = ' #';
  clr.forEach((z) => {
    if (z < 16) appendStr += '0';
    appendStr += z.toString(16);
  });
  return appendStr;
}


function printGIMPPalette(title, description, colors) {
  let text = `GIMP Palette
#Palette Name: Pixelplanet${title}
#Description: ${description}
#Colors: ${colors.length}`;
  colors.forEach((clr) => {
    text += '\n';
    clr.forEach((z) => {
      text += appendNumberText(z);
    });
    text += appendHexColorText(clr);
  });
  return text;
}

export default printGIMPPalette;
