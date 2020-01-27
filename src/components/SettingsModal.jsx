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
  marginLeft: 0,
  marginRight: 10,
  color: '#4f545c',
  overflow: 'hidden',
  wordWrap: 'break-word',
  lineHeight: '24px',
  fontSize: 16,
  fontWeight: 500,
  marginTop: 0,
  marginBottom: 0,
};

const rowStyles = {
  ...flexy,
  flexDirection: 'row',
};

const descriptionStyle = {
  boxSizing: 'border-box',
  flex: '1 1 auto',
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  lineHeight: '20px',
  fontWeight: 500,
  marginTop: 4,
};

const dividerStyles = {
  boxSizing: 'border-box',
  marginTop: 20,
  height: 1,
  width: '100%',
  backgroundColor: 'hsla(216, 4%, 74%, .3)',
};


const SettingsItem = ({
  title, description, keyBind, value, onToggle,
}) => (
  <div style={itemStyles}>
    <div style={rowStyles}>
      <h3 style={titleStyles}>{title} {keyBind && <kbd>{keyBind}</kbd>}</h3>
      <MdToggleButtonHover value={value} onToggle={onToggle} />
    </div>
    {description && <div style={descriptionStyle}>{description} </div>}
    <div style={dividerStyles} />
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
  onToggleGrid,
  onTogglePixelNotify,
  onToggleAutoZoomIn,
  onToggleCompactPalette,
  onToggleChatNotify,
  onTogglePotatoMode,
  onToggleLightGrid,
  onToggleHistoricalView,
  chatNotify,
}) {
  return (
    <Modal title="Settings">
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
        keyBind="C"
        value={isPixelNotifyShown}
        onToggle={onTogglePixelNotify}
      />
      <SettingsItem
        title="Disable Game Sounds"
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
        description="Zoom in instead of placing a pixel when you tap the canvas and your zoom is small."
        value={autoZoomIn}
        onToggle={onToggleAutoZoomIn}
      />
      <SettingsItem
        title="Compact Palette"
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
