/* @flow */

import { joinOnId } from '../core/utils';

import type { Action } from '../actions/types';

export type UserState = {
  name: string,
  id: number,
  center: Cell,
  wait: ?Date,
  coolDown: ?number, // ms
  placeAllowed: boolean,
  online: ?number,
  // messages are sent by api/me, like not_verified status
  messages: Array,
  mailreg: boolean,
  // stats
  totalPixels: number,
  dailyTotalPixels: number,
  ranking: number,
  dailyRanking: number,
  // global stats
  totalRanking: Object,
  totalDailyRanking: Object,
  // user factions
  ownFactions: Array | undefined,
  // all factions
  factions: Array,
  // chat
  chatMessages: Array,
  // minecraft
  minecraftname: string,
  // if user is using touchscreen
  isOnMobile: boolean,
  bannedFactionMembers: Map<string, Array>,
};

const initialState: UserState = {
  name: null,
  id: undefined,
  center: [0, 0],
  wait: null,
  coolDown: null,
  placeAllowed: true,
  online: null,
  messages: [],
  mailreg: false,
  totalRanking: {},
  totalDailyRanking: {},
  ownFactions: undefined,
  factions: [],
  chatMessages: [['info', 'Welcome to the PixelPlanet Chat']],
  minecraftname: null,
  isOnMobile: false,
  bannedFactionMembers: new Map<string, Array>(),
};

export default function user(
  state: UserState = initialState,
  action: Action,
): UserState {
  switch (action.type) {
    case 'COOLDOWN_SET': {
      const { coolDown } = action;
      return {
        ...state,
        coolDown,
      };
    }

    case 'COOLDOWN_END': {
      return {
        ...state,
        coolDown: null,
        wait: null,
      };
    }

    case 'SET_PLACE_ALLOWED': {
      const { placeAllowed } = action;
      return {
        ...state,
        placeAllowed,
      };
    }

    case 'SET_WAIT': {
      const { wait: duration } = action;

      const wait = duration ? new Date(Date.now() + duration) : null;

      return {
        ...state,
        wait,
      };
    }

    case 'SET_MOBILE': {
      const { mobile: isOnMobile } = action;
      return {
        ...state,
        isOnMobile,
      };
    }

    case 'PLACE_PIXEL': {
      let { totalPixels, dailyTotalPixels } = state;
      totalPixels += 1;
      dailyTotalPixels += 1;
      return {
        ...state,
        totalPixels,
        dailyTotalPixels,
      };
    }

    case 'RECEIVE_ONLINE': {
      const { online } = action;
      return {
        ...state,
        online,
      };
    }

    case 'RECEIVE_CHAT_MESSAGE': {
      const { name, text } = action;
      let { chatMessages } = state;
      if (chatMessages.length > 50) {
        chatMessages = chatMessages.slice(-50);
      }
      return {
        ...state,
        chatMessages: chatMessages.concat([[name, text]]),
      };
    }

    case 'RECEIVE_CHAT_HISTORY': {
      const { data: chatMessages } = action;
      return {
        ...state,
        chatMessages,
      };
    }

    case 'RECEIVE_COOLDOWN': {
      const { waitSeconds } = action;
      const wait = waitSeconds
        ? new Date(Date.now() + waitSeconds * 1000)
        : null;
      return {
        ...state,
        wait,
        coolDown: null,
      };
    }

    case 'RECEIVE_ME': {
      const {
        name,
        id,
        mailreg,
        totalPixels,
        dailyTotalPixels,
        ranking,
        dailyRanking,
        minecraftname,
      } = action;
      const messages = action.messages ? action.messages : [];
      return {
        ...state,
        name,
        id,
        messages,
        mailreg,
        totalPixels,
        dailyTotalPixels,
        ranking,
        dailyRanking,
        minecraftname,
      };
    }

    case 'RECEIVE_STATS': {
      const { totalRanking, totalDailyRanking } = action;
      return {
        ...state,
        totalRanking,
        totalDailyRanking,
      };
    }

    case 'RECIEVE_FACTIONS': {
      const { factions }: { factions: Array } = action;
      let newFactions = state.factions;

      // Delete non-private factions that weren't returned from the server
      state.factions.forEach((ef, index) => {
        if (!factions.find((f) => f.id === ef.id) && !ef.private) {
          newFactions.splice(index, 1);
        }
      });

      factions.forEach((faction) => {
        faction.private = false;
        if (newFactions.findIndex((f) => f.id === faction.id) > -1) {
          // eslint-disable-next-line max-len
          newFactions = newFactions.map((fa) => (fa.id === faction.id ? { ...fa, ...faction } : fa));
        } else {
          newFactions.push(faction);
        }
      });

      return {
        ...state,
        factions: newFactions
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    case 'LOADING_ICON': {
      const { id } = action;

      return {
        ...state,
        factions: state.factions.map((faction) => (faction.id === id
          ? {
            ...faction,
            icon: null,
          }
          : faction)),
      };
    }

    case 'RECIEVE_FACTION_ICON': {
      const { icon, factionFor } = action;

      return {
        ...state,
        factions: state.factions.map((faction) => (faction.id === factionFor
          ? {
            ...faction,
            icon,
          }
          : faction)),
      };
    }

    case 'RECIEVE_FACTION_INFO': {
      const { info } = action;

      return {
        ...state,
        factions: state.factions.find((f) => f.id === info.id)
          ? state.factions.map((faction) => (faction.id === info.id ? info : faction))
          : [...state.factions, info],
      };
    }

    case 'RECIEVE_OWN_FACTIONS': {
      const { ownFactions } = action;
      const { factions } = state;

      return {
        ...state,
        ownFactions,
        factions: joinOnId(ownFactions, factions, 'id')
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    case 'RECIEVE_OWN_FACTION': {
      const { ownFaction } = action;
      const { factions } = state;

      return {
        ...state,
        // eslint-disable-next-line max-len
        ownFactions: [...state.ownFactions, ownFaction].sort((a, b) => a.name.localeCompare(b.name)),
        // eslint-disable-next-line max-len
        factions: joinOnId([ownFaction], factions, 'id').sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    case 'SET_FACTION_INVITE': {
      const { id, invite } = action;
      const { factions } = state;

      return {
        ...state,
        factions: factions.map((f) => (f.id === id ? { ...f, invite } : f)),
      };
    }

    case 'SET_NAME': {
      const { name } = action;
      return {
        ...state,
        name,
      };
    }

    case 'SET_MINECRAFT_NAME': {
      const { minecraftname } = action;
      return {
        ...state,
        minecraftname,
      };
    }

    case 'REM_FROM_MESSAGES': {
      const { message } = action;
      const messages = [...state.messages];
      const index = messages.indexOf(message);
      if (index > -1) {
        messages.splice(index);
      }
      return {
        ...state,
        messages,
      };
    }

    case 'SET_MAILREG': {
      const { mailreg } = action;
      return {
        ...state,
        mailreg,
      };
    }

    case 'DELETE_FACTION': {
      const { index } = action;
      state.ownFactions.splice(index, 1);
      state.factions.splice(index, 1);
      return {
        ...state,
        ownFactions: state.ownFactions.slice(),
        factions: state.factions.slice(),
      };
    }

    case 'DELETE_OWN_FACTION': {
      const { index } = action;
      state.ownFactions.splice(index, 1);
      return {
        ...state,
        ownFactions: state.ownFactions.slice(),
      };
    }

    case 'REMOVE_USER_FACTION': {
      const { userId, factionId } = action;
      const faction = state.factions.find((f) => f.id === factionId);
      const userIndex = faction.Users.findIndex((u) => u.id === userId);

      faction.Users.splice(userIndex, 1);

      return {
        ...state,
        factions: state.factions.slice(),
      };
    }

    case 'SET_USER_RANK': {
      const { userId, factionId, admin } = action;
      const faction = state.factions.find((f) => f.id === factionId);
      const u = faction.Users.find((fu) => fu.id === userId);

      u.UserFactions.admin = admin;

      return {
        ...state,
        factions: state.factions.slice(),
      };
    }

    case 'RESET_USER_FACTIONS': {
      return {
        ...state,
        ownFactions: undefined,
        factions: [],
      };
    }

    case 'RECEIVE_FACTION_BANNED_MEMBERS': {
      const { bannedFactionMembers } = state;
      const { factionId, banned } = action;

      return {
        ...state,
        bannedFactionMembers: new Map(
          bannedFactionMembers.set(factionId, banned),
        ),
      };
    }

    case 'HANDLE_FACTION_MEMBER_UNBAN': {
      const { factionId, userId } = action;
      const { bannedFactionMembers } = state;

      const factionBanList = bannedFactionMembers.get(factionId);
      const userIndex = factionBanList.findIndex((u) => u.id === userId);

      factionBanList.splice(userIndex, 1);

      return {
        ...state,
        bannedFactionMembers: new Set(
          bannedFactionMembers.set(factionId, factionBanList.slice()),
        ),
      };
    }

    default:
      return state;
  }
}
