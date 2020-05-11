/**
 *
 * @flow
 */

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import useWindowSize from '../utils/reactHookResize';
import { showChatModal } from '../actions';

import Chat from './Chat';


function ChatBox({
  chatOpen,
  triggerModal,
}) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      if (chatOpen) setRender(true);
    }, 10);
  }, [chatOpen]);

  const onTransitionEnd = () => {
    if (!chatOpen) setRender(false);
  };

  const { width } = useWindowSize();
  if (width < 604 && chatOpen) {
    triggerModal();
  }

  return (
    (render || chatOpen) && (
      <div
        className={(chatOpen && render) ? 'chatbox show' : 'chatbox'}
        onTransitionEnd={onTransitionEnd}
      >
        <div
          id="chatlink"
          onClick={triggerModal}
          role="button"
          tabIndex={-1}
        >↷</div>
        <Chat />
      </div>
    )
  );
}

function mapStateToProps(state: State) {
  const { chatOpen } = state.modal;
  return { chatOpen };
}

function mapDispatchToProps(dispatch) {
  return {
    triggerModal() {
      dispatch(showChatModal(true));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatBox);
