/**
 *
 * @flow
 */

import React from 'react';

import baseCss from './base.tcss';

const Style: React.FC<{}> = (props) => {
  const { children } = props;

  return (
    <div>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: baseCss }} />
      {children}
    </div>
  );
};

export default Style;
