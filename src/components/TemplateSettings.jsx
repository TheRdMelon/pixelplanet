/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdCompare, MdCancel } from 'react-icons/md';
import MdToggleButtonHover from './MdToggleButtonHover';
import {
  changeTemplateAlpha,
  toggleTemplateOpen,
  toggleTemplateEnable,
} from '../actions';

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
      template_enable: templateEnable,
      toggle_template_open: dispatchToggleTemplateOpen,
      toggle_template_enable: dispatchToggleTemplateEnable,
    } = this.props;
    return (
      <>
        <div
          id="templatesettings"
          style={templateOpen ? {} : { maxWidth: '36px' }}
        >
          <div className="templatebutton" onClick={dispatchToggleTemplateOpen}>
            <MdCompare
              className="templatetoggle"
              style={templateOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <MdCancel
              className="templatetoggle"
              style={templateOpen ? { opacity: 1 } : { opacity: 0 }}
            />
          </div>
          <p className="templatesettingstext">Opacity:</p>
          <input
            id="templatealphaslider"
            value={templateAlpha}
            onChange={this.onAlphaChange}
            disabled={!templateEnable}
            type="range"
            min={0}
            max={100}
          />
          <p className="templatesettingstext">Enabled:</p>
          <div id="templateenable">
            <MdToggleButtonHover
              value={templateEnable}
              onToggle={dispatchToggleTemplateEnable}
            />
          </div>
        </div>
      </>
    );
  }
}

function mapStateToProps(state: State) {
  const { templateAlpha, templateOpen, templateEnabled } = state.gui;

  return {
    template_alpha: templateAlpha,
    template_open: templateOpen,
    template_enable: templateEnabled,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    change_template_alpha(alpha) {
      dispatch(changeTemplateAlpha(alpha));
    },
    toggle_template_open() {
      dispatch(toggleTemplateOpen());
    },
    toggle_template_enable() {
      dispatch(toggleTemplateEnable());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TemplateSettings);
