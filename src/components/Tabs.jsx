import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Tab from './Tab';

class Tabs extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Array).isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      activeTab: this.props.children.filter((c) => c !== undefined)[0].props
        .label,
    };

    const { onloaded } = props;
    if (onloaded) {
      const { activeTab } = this.state;
      onloaded(activeTab);
    }
  }

  onClickTabItem = (tab) => {
    const { on_tab_click: onTabClick } = this.props;
    this.setState({ activeTab: tab });
    if (onTabClick !== undefined) {
      onTabClick(tab);
    }
  };

  render() {
    const {
      onClickTabItem,
      props: { children },
      state: { activeTab },
    } = this;

    return (
      <div className="tabs">
        <ol className="tab-list">
          {children.map((child) => {
            if (!child) return undefined;
            const { label } = child.props;

            return (
              <Tab
                activeTab={activeTab}
                key={label}
                label={label}
                onClick={onClickTabItem}
              />
            );
          })}
        </ol>
        <div className="tab-content">
          {children.map((child) => {
            if (!child) return undefined;
            if (child.props.label !== activeTab) return undefined;
            return child.props.children;
          })}
        </div>
      </div>
    );
  }
}

export default Tabs;
