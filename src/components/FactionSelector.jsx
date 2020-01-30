/**
 *
 * @flow
 */

import React, {
  useState, useEffect, useRef, useLayoutEffect,
} from 'react';
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
  // Flag for if the faction loader is loaded and ready to transition
  const hasLoaded = useRef<boolean>(false);
  // Faction icon container ref
  const containerEl = useRef<HTMLDivElement>(null);
  // Faction icon ref
  const iconEl = useRef<HTMLImageElement>(null);
  // Faction selector ref
  const selectorEl = useRef<HTMLDivElement>(null);
  // Store timeout id for tracking transitions
  const transitioningTimeoutId = useRef<int>(-1);
  // Transitioning lock ref, prevent hovering while transitions are active
  const closing = useRef<boolean>(false);
  // Width of the faction selector
  const [width, setWidth] = useState<number>(0);
  // Height tracking of the faction icon img element
  const [height, setHeight] = useState<number>(-1);
  // Transitioning state for class names
  const [transitioning, setTransitioning] = useState<boolean>(false);
  // Selector closed
  const [factionSelectorClosed, setFactionSelectorClosed] = useState<boolean>(
    true,
  );
  // Faction hovered over
  const [hoveredFaction, setHoveredFaction] = useState<number>(-1);
  // Toggle transparent bottom row, can't be transparent unless completely closed, but must be transparent when closed to fit in with the rest of the UI
  const [transparentBase, setTransparentBase] = useState<boolean>(true);
  // Toggle disabled scrolling for faction selector
  const disableScrolling = useRef<boolean>(true);
  // Ignore onScroll if waiting for animation frame
  const ticking = useRef<boolean>(false);

  const onScroll = (e: Event) => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        if (e.target === selectorEl.current && disableScrolling.current) {
          selectorEl.current.scrollTo(0, selectorEl.current.scrollHeight);
        }
        ticking.current = false;
      });

      ticking.current = true;
    }
  };

  useEffect(() => {
    // Start listening for scroll events
    window.addEventListener('scroll', onScroll, { capture: true });

    // Functions returned from use effects with empty dependencies run on unload
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (!factionSelectorClosed) {
      if (selectorEl.current) {
        disableScrolling.current = true;
        selectorEl.current.scrollTo(0, selectorEl.current.scrollHeight);
      }
    }
  }, [factionSelectorClosed]);

  // Set transitions class names and lock
  useEffect(() => {
    window.clearTimeout(transitioningTimeoutId.current);
    if (factionSelectorClosed && hasLoaded.current) {
      setTransitioning(true);
      transitioningTimeoutId.current = window.setTimeout(() => {
        setTransparentBase(true);
        // 0.75s in the CSS transitions
      }, 750);
    } else if (hasLoaded.current) {
      setTransparentBase(false);
      transitioningTimeoutId.current = window.setTimeout(() => {
        setTransitioning(false);
        closing.current = false;
        disableScrolling.current = false;
        // 0.75s in the CSS transitions
      }, 750);
    }
  }, [factionSelectorClosed]);

  useLayoutEffect(() => {
    if (ownFactions && ownFactions.length > 0) {
      requestAnimationFrame(() => {
        setTransitioning(true);
        hasLoaded.current = true;
      });
    }
  }, [width]);

  // When the faction lists change, work out the width of the selector, required for hiding it on the left
  useEffect(() => {
    const wid = containerEl.current ? containerEl.current.clientWidth + 17 : 0;
    setWidth(wid);
  }, [ownFactions, factions]);

  // useLayoutEffect, called after all element mutations, before the browser paints
  // When the selected faction changes, or the icon ref is set, work out the height of the icon, minus padding (.height instead of .clientHeight)
  useLayoutEffect(() => {
    setHeight(iconEl.current ? iconEl.current.height : -1);
  }, [selectedFaction, iconEl.current]);

  // The current selected faction information
  const selectedFactionObj = factions.find((f) => f.id === selectedFaction);

  return (
    <>
      <div
        ref={containerEl}
        id="factionselectorcontainer"
        className={`${factionSelectorClosed ? 'factionselectorclosed' : ''} ${
          transitioning || factionSelectorClosed ? 'transitioning' : ''
        } ${transitioning ? 'slidetransition' : ''}`}
        style={
          factionSelectorClosed
            ? {
              left: `-${width}px`,
            }
            : {}
        }
      >
        <div id="factionselectorwrapper">
          <div
            id="factionselector"
            style={{ maxHeight: `calc(100vh - ${getHeightOffset()}px)` }}
            ref={selectorEl}
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
                              {/* If the icon is available */}
                              <img
                                className="factionselectorlogo"
                                src={`data:image/png;base64,${thisFaction.icon}`}
                                alt="logo"
                              />
                            </>
                          ) : (
                            <>
                              {/* Faction not fetched, set to null to remember that it has been fetched until the icon comes through */}
                              {(thisFaction.icon === undefined
                                ? dispatchFetchFactionIcon(thisFaction.id)
                                : (thisFaction.icon = null))
                                || null /* Always return null, don't show anything from here */}
                            </>
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
                  className={`factionselectorrow factionselectorrowselected ${
                    transparentBase ? 'transparentbase ' : ''
                  }`}
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
                      ref={iconEl}
                      className="factionselectorlogo"
                      src={`data:image/png;base64,${selectedFactionObj.icon}`}
                      alt="logo"
                      /* Keep height of the icon odd, prevents icon jumping up and down by 1 pixel when closing or opening the selector */
                      style={height % 2 === 0 ? { paddingBottom: '1px' } : {}}
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
