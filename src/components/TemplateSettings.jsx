/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { changeTemplateAlpha } from '../actions';

class TemplateSettings extends React.Component {
  constructor() {
    super();
    this.onAlphaChange = this.onAlphaChange.bind(this);
  }

  async onAlphaChange(e) {
    const { change_template_alpha: dispatchAlphaChange } = this.props;
    dispatchAlphaChange(e.target.value);
  }

  render() {
    const { templateAlpha } = this.props;
    return (
      <>
        <div id="templatesettings">
          <input
            value={templateAlpha}
            onChange={this.onAlphaChange}
            type="range"
            min={0}
            max={100}
          />
        </div>
      </>
    );
  }
}

function mapStateToProps(state: State) {
  const { templateAlpha } = state.gui;

  return { templateAlpha };
}

function mapDispatchToProps(dispatch) {
  return {
    change_template_alpha(alpha) {
      dispatch(changeTemplateAlpha(alpha));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TemplateSettings);
