/* @flow */

import type { Action } from '../actions/types';
import type { ColorIndex } from '../core/Palette';
import type { Cell } from '../core/Cell';

export type GUIState = {
  showGrid: boolean,
  showPixelNotify: boolean,
  selectedColor: ColorIndex,
  hover: ?Cell,
  pixelsPlaced: number,
  autoZoomIn: boolean,
  notification: string,
  isPotato: boolean,
  isLightGrid: boolean,
  compactPalette: boolean,
  paletteOpen: boolean,
  menuOpen: boolean,
  selectedFaction: string | undefined,
  templateAlpha: number,
  templateOpen: boolean,
  templateEnabled: boolean,
};

const initialState: GUIState = {
  showGrid: false,
  showPixelNotify: false,
  selectedColor: 3,
  hover: null,
  pixelsPlaced: 0,
  autoZoomIn: false,
  notification: null,
  isPotato: false,
  isLightGrid: false,
  compactPalette: false,
  paletteOpen: true,
  menuOpen: false,
  selectedFaction: undefined,
  templateAlpha: 50,
  templateOpen: false,
  templateEnabled: false,
};

export default function gui(
  state: GUIState = initialState,
  action: Action,
): GUIState {
  switch (action.type) {
    case 'TOGGLE_GRID': {
      return {
        ...state,
        showGrid: !state.showGrid,
      };
    }

    case 'TOGGLE_PIXEL_NOTIFY': {
      return {
        ...state,
        showPixelNotify: !state.showPixelNotify,
      };
    }

    case 'TOGGLE_AUTO_ZOOM_IN': {
      return {
        ...state,
        autoZoomIn: !state.autoZoomIn,
      };
    }

    case 'TOGGLE_POTATO_MODE': {
      return {
        ...state,
        isPotato: !state.isPotato,
      };
    }

    case 'TOGGLE_LIGHT_GRID': {
      return {
        ...state,
        isLightGrid: !state.isLightGrid,
      };
    }

    case 'TOGGLE_COMPACT_PALETTE': {
      return {
        ...state,
        compactPalette: !state.compactPalette,
      };
    }

    case 'TOGGLE_OPEN_PALETTE': {
      return {
        ...state,
        paletteOpen: !state.paletteOpen,
      };
    }

    case 'TOGGLE_OPEN_MENU': {
      return {
        ...state,
        menuOpen: !state.menuOpen,
      };
    }

    case 'SELECT_COLOR': {
      const { compactPalette } = state;
      let { paletteOpen } = state;
      if (compactPalette || window.innerWidth < 300) {
        paletteOpen = false;
      }
      return {
        ...state,
        paletteOpen,
        selectedColor: action.color,
      };
    }

    case 'SET_NOTIFICATION': {
      return {
        ...state,
        notification: action.notification,
      };
    }

    case 'UNSET_NOTIFICATION': {
      return {
        ...state,
        notification: null,
      };
    }

    case 'SET_HOVER': {
      const { hover } = action;
      return {
        ...state,
        hover,
      };
    }

    case 'PLACE_PIXEL': {
      let { pixelsPlaced } = state;
      pixelsPlaced += 1;
      return {
        ...state,
        pixelsPlaced,
      };
    }

    case 'UNSET_HOVER': {
      return {
        ...state,
        hover: null,
      };
    }

    case 'RECIEVE_OWN_FACTIONS': {
      const { ownFactions } = action;

      if (ownFactions.length > 0 && state.selectedFaction === undefined) {
        return {
          ...state,
          selectedFaction: ownFactions[0].id,
        };
      }

      return state;
    }

    case 'SELECT_FACTION': {
      const { select } = action;

      return {
        ...state,
        selectedFaction: select,
      };
    }

    case 'CHANGE_TEMPLATE_ALPHA': {
      const { alpha } = action;

      return {
        ...state,
        templateAlpha: alpha,
      };
    }

    case 'TOGGLE_TEMPLATE_OPEN': {
      const { templateOpen } = state;

      return {
        ...state,
        templateOpen: !templateOpen,
      };
    }

    case 'TOGGLE_TEMPLATE_ENABLE': {
      const { templateEnabled } = state;

      return {
        ...state,
        templateEnabled: !templateEnabled,
      };
    }

    default:
      return state;
  }
}
