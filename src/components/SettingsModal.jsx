/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';
import MdToggleButtonHover from './MdToggleButtonHover';
import {
  toggleGrid,
  togglePixelNotify,
  toggleMute,
  toggleAutoZoomIn,
  toggleCompactPalette,
  toggleChatNotify,
  togglePotatoMode,
  toggleLightGrid,
  toggleHistoricalView,
  selectStyle,
} from '../actions';

import type { State } from '../reducers';


const flexy = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  boxSizing: 'border-box',
  flex: '1 1 auto',
};

const itemStyles = {
  ...flexy,
  flexDirection: 'column',
  marginBottom: 20,
};

const titleStyles = {
  flex: '1 1 auto',
};

const rowStyles = {
  ...flexy,
  flexDirection: 'row',
};

const SettingsItemSelect = ({
  title, description, values, selected, onSelect,
}) => (
  <div style={itemStyles}>
    <div style={rowStyles}>
      <h3 style={titleStyles} className="modaltitle">{title}</h3>
      <select
        onChange={(e) => {
          const sel = e.target;
          onSelect(sel.options[sel.selectedIndex].value);
        }}
      >
        {
          values.map((value) => (
            <option
              selected={value === selected}
              value={value}
            >
              {value}
            </option>
          ))
        }
      </select>
    </div>
    {description && <div className="modaldesc">{description} </div>}
    <div className="modaldivider" />
  </div>
);

const SettingsItem = ({
  title, description, keyBind, value, onToggle,
}) => (
  <div style={itemStyles}>
    <div style={rowStyles}>
      <h3
        style={titleStyles}
        className="modaltitle"
      >
        {title} {keyBind && <kbd>{keyBind}</kbd>}
      </h3>
      <MdToggleButtonHover value={value} onToggle={onToggle} />
    </div>
    {description && <div className="modaldesc">{description} </div>}
    <div className="modaldivider" />
  </div>
);

function SettingsModal({
  isMuted,
  isGridShown,
  isPixelNotifyShown,
  isPotato,
  isLightGrid,
  isHistoricalView,
  onMute,
  autoZoomIn,
  compactPalette,
  selectedStyle,
  onToggleGrid,
  onTogglePixelNotify,
  onToggleAutoZoomIn,
  onToggleCompactPalette,
  onToggleChatNotify,
  onTogglePotatoMode,
  onToggleLightGrid,
  onToggleHistoricalView,
  onSelectStyle,
  chatNotify,
}) {
  return (
    <Modal title="Settings">
      <p style={{ paddingLeft: '5%', paddingRight: '5%', paddingTop: 30 }}>
        <SettingsItem
          title="Show Grid"
          description="Turn on grid to highlight pixel borders."
          keyBind="G"
          value={isGridShown}
          onToggle={onToggleGrid}
        />
        <SettingsItem
          title="Show Pixel Activity"
          description="Show circles where pixels are placed."
          keyBind="X"
          value={isPixelNotifyShown}
          onToggle={onTogglePixelNotify}
        />
        <SettingsItem
          title="Disable Game Sounds"
          // eslint-disable-next-line max-len
          description="All sound effects except Chat Notification will be disabled."
          keyBind="M"
          value={isMuted}
          onToggle={onMute}
        />
        <SettingsItem
          title="Enable chat notifications"
          description="Play a sound when new chat messages arrive"
          value={chatNotify}
          onToggle={onToggleChatNotify}
        />
        <SettingsItem
          title="Auto Zoom In"
          // eslint-disable-next-line max-len
          description="Zoom in instead of placing a pixel when you tap the canvas and your zoom is small."
          value={autoZoomIn}
          onToggle={onToggleAutoZoomIn}
        />
        <SettingsItem
          title="Compact Palette"
          // eslint-disable-next-line max-len
          description="Display Palette in a compact form that takes less screen space."
          value={compactPalette}
          onToggle={onToggleCompactPalette}
        />
        <SettingsItem
          title="Potato Mode"
          description="For when you are playing on a potato."
          value={isPotato}
          onToggle={onTogglePotatoMode}
        />
        <SettingsItem
          title="Light Grid"
          description="Show Grid in white instead of black."
          value={isLightGrid}
          onToggle={onToggleLightGrid}
        />
        { (window.backupurl)
          ? (
            <SettingsItem
              title="Historical View"
              description="Check out past versions of the canvas."
              value={isHistoricalView}
              onToggle={onToggleHistoricalView}
            />
          ) : null }
        {(typeof window.availableStyles !== 'undefined') && (
          <SettingsItemSelect
            title="Themes"
            description="How pixelplanet should look like."
            values={Object.keys(window.availableStyles)}
            selected={selectedStyle}
            onSelect={onSelectStyle}
          />
        )}
      </p>
    </Modal>
  );
}

function mapStateToProps(state: State) {
  const { mute, chatNotify } = state.audio;
  const {
    showGrid,
    showPixelNotify,
    autoZoomIn,
    compactPalette,
    isPotato,
    isLightGrid,
    style: selectedStyle,
  } = state.gui;
  const isMuted = mute;
  const {
    isHistoricalView,
  } = state.canvas;
  const isGridShown = showGrid;
  const isPixelNotifyShown = showPixelNotify;
  return {
    isMuted,
    isGridShown,
    isPixelNotifyShown,
    autoZoomIn,
    compactPalette,
    chatNotify,
    isPotato,
    isLightGrid,
    isHistoricalView,
    selectedStyle,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onMute() {
      dispatch(toggleMute());
    },
    onToggleGrid() {
      dispatch(toggleGrid());
    },
    onTogglePixelNotify() {
      dispatch(togglePixelNotify());
    },
    onToggleAutoZoomIn() {
      dispatch(toggleAutoZoomIn());
    },
    onToggleCompactPalette() {
      dispatch(toggleCompactPalette());
    },
    onToggleChatNotify() {
      dispatch(toggleChatNotify());
    },
    onTogglePotatoMode() {
      dispatch(togglePotatoMode());
    },
    onToggleLightGrid() {
      dispatch(toggleLightGrid());
    },
    onToggleHistoricalView() {
      dispatch(toggleHistoricalView());
    },
    onSelectStyle(style) {
      dispatch(selectStyle(style));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
