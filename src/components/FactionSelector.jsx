/**
 *
 * @flow
 */

import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

import { selectFaction, fetchFactionIcon } from '../actions';

function getHeightOffset() {
  const offsetTop = 57;
  const offsetBottom = 98;
  const el = 41;

  const menuItems = document.getElementById('menuitems');
  const menuItemsCount = menuItems ? menuItems.childElementCount : 0;

  return menuItemsCount * el + offsetTop + offsetBottom;
}

const FactionSelector = ({
  factions,
  selected_faction: selectedFaction,
  select_faction: dispatchSelectFaction,
  own_factions: ownFactions,
  fetch_faction_icon: dispatchFetchFactionIcon,
}: {
  factions: Array,
  selected_faction: string | undefined,
  select_faction: (faction: string) => void,
  own_factions: Array,
  fetch_faction_icon: (id) => void,
}) => {
  const containerEl = useRef<HTMLDivElement>(null);
  const transitioningTimeoutId = useRef<int>(-1);
  const closing = useRef<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(true);
  const [factionSelectorClosed, setFactionSelectorClosed] = useState<boolean>(
    true,
  );

  const [hoveredFaction, setHoveredFaction] = useState<number>(-1);

  useEffect(() => {
    window.clearTimeout(transitioningTimeoutId.current);
    if (factionSelectorClosed) {
      setTransitioning(true);
    } else {
      transitioningTimeoutId.current = window.setTimeout(() => {
        setTransitioning(false);
        closing.current = false;
      }, 750);
    }
  }, [factionSelectorClosed]);

  const selectedFactionObj = factions.find((f) => f.id === selectedFaction);

  return (
    <>
      <div
        ref={containerEl}
        id="factionselectorcontainer"
        className={`${factionSelectorClosed ? 'factionselectorclosed' : ''} ${
          transitioning || factionSelectorClosed ? 'transitioning' : ''
        }`}
        style={
          factionSelectorClosed
            ? {
              left: `-${
                containerEl.current ? containerEl.current.clientWidth + 16 : 0
              }px`,
            }
            : {}
        }
      >
        <div id="factionselectorwrapper">
          <div
            id="factionselector"
            style={{ maxHeight: `calc(100vh - ${getHeightOffset()}px)` }}
          >
            {ownFactions
              && ownFactions.sort().map((faction, index) => {
                const thisFaction = factions.find((f) => f.id === faction.id);

                // eslint-disable-next-line no-return-assign
                return thisFaction === undefined ? null : (
                  <div
                    key={thisFaction.name.replace(' ', '_')}
                    className={`factionselectorrow ${
                      hoveredFaction === index
                        ? 'factionselectorrowselected'
                        : ''
                    }`}
                    onFocus={() => {}}
                    onMouseOver={() => {
                      if (!closing.current) {
                        setHoveredFaction(index);
                      }
                    }}
                    onMouseLeave={() => setHoveredFaction(-1)}
                    onClick={() => dispatchSelectFaction(thisFaction.id)}
                    role="button"
                    tabIndex={-1}
                  >
                    <div className="factionselectorname">
                      {thisFaction.name}
                    </div>
                    {hoveredFaction === index && (
                      <>
                        <div className="factionselectorlogocontainer">
                          <div className="factionselectorlogobackground" />
                          {thisFaction.icon ? (
                            <>
                              <img
                                className="factionselectorlogo"
                                src={`data:image/png;base64,${thisFaction.icon}`}
                                alt="logo"
                              />
                            </>
                          ) : (
                            (thisFaction.icon === undefined
                              ? dispatchFetchFactionIcon(thisFaction.id)
                              : (thisFaction.icon = null)) || null
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            {selectedFactionObj && (
              <>
                <div
                  className="factionselectorrow factionselectorrowselected"
                  onClick={() => setFactionSelectorClosed(!factionSelectorClosed)}
                  role="button"
                  tabIndex={-1}
                >
                  <div className="factionselectorname">
                    {selectedFactionObj.name}
                  </div>
                  <div className="factionselectorlogocontainer">
                    <div className="factionselectorlogobackground" />
                    <img
                      className="factionselectorlogo"
                      src={`data:image/png;base64,${selectedFactionObj.icon}`}
                      alt="logo"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

function mapStateToProps(state: State) {
  return {
    factions: state.user.factions,
    selected_faction: state.gui.selectedFaction,
    own_factions: state.user.ownFactions,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select_faction(faction: string) {
      dispatch(selectFaction(faction));
    },
    fetch_faction_icon(id) {
      dispatch(fetchFactionIcon(id));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FactionSelector);
