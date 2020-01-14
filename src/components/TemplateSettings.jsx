/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdCompare, MdCancel } from 'react-icons/md';
import { changeTemplateAlpha, toggleTemplateOpen } from '../actions';

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
    const {
      template_alpha: templateAlpha,
      template_open: templateOpen,
      toggle_template_open: dispatchToggleTemplateOpen,
    } = this.props;
    return (
      <>
        <div id="templatesettings">
          <div
            className="templatebutton"
            style={{ position: 'relative' }}
            onClick={dispatchToggleTemplateOpen}
            style={{ border: 'none', backgroundColor: 'rgba(0, 0, 0, 0)' }}
          >
            <MdCompare
              className="templatetoggle"
              style={templateOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <MdCancel
              className="templatetoggle"
              style={templateOpen ? { opacity: 1 } : { opacity: 0 }}
            />
          </div>
          <input
            id="templatealphaslider"
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
  const { templateAlpha, templateOpen } = state.gui;

  return { template_alpha: templateAlpha, template_open: templateOpen };
}

function mapDispatchToProps(dispatch) {
  return {
    change_template_alpha(alpha) {
      dispatch(changeTemplateAlpha(alpha));
    },
    toggle_template_open() {
      dispatch(toggleTemplateOpen());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TemplateSettings);
