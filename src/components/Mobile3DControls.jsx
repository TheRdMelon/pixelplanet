/*
 *
 * @flow
 * Menu for WASD keys for mobile users
 */

import React from 'react';

import { getRenderer } from '../ui/renderer';

const btnStyle = {
  fontSize: 34,
};

function move(action, bool) {
  const renderer = getRenderer();
  switch (action) {
    case 'FORWARD': {
      renderer.controls.moveForward = bool;
      break;
    }
    case 'BACKWARD': {
      renderer.controls.moveBackward = bool;
      break;
    }
    case 'LEFT': {
      renderer.controls.moveLeft = bool;
      break;
    }
    case 'RIGHT': {
      renderer.controls.moveRight = bool;
      break;
    }
    case 'UP': {
      renderer.controls.moveUp = bool;
      break;
    }
    case 'DOWN': {
      renderer.controls.moveDown = bool;
      break;
    }
    default:
      break;
  }
}

function cancelMovement() {
  const renderer = getRenderer();
  renderer.controls.moveForward = false;
  renderer.controls.moveBackward = false;
  renderer.controls.moveLeft = false;
  renderer.controls.moveRight = false;
  renderer.controls.moveUp = false;
  renderer.controls.moveDown = false;
}

class Mobile3DControls extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            // left: 46,
            left: 57,
            // bottom: 128,
            bottom: 139,
          }}
          onMouseDown={() => {
            move('FORWARD', true);
          }}
          onMouseUp={() => {
            move('FORWARD', false);
          }}
          onTouchStart={() => {
            move('FORWARD', true);
          }}
          onTouchEnd={() => {
            move('FORWARD', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          ↑
        </div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            // left: 46,
            left: 57,
            bottom: 98,
          }}
          onMouseDown={() => {
            move('BACKWARD', true);
          }}
          onMouseUp={() => {
            move('BACKWARD', false);
          }}
          onTouchStart={() => {
            move('BACKWARD', true);
          }}
          onTouchEnd={() => {
            move('BACKWARD', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          ↓
        </div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            left: 16,
            bottom: 98,
          }}
          onMouseDown={() => {
            move('LEFT', true);
          }}
          onMouseUp={() => {
            move('LEFT', false);
          }}
          onTouchStart={() => {
            move('LEFT', true);
          }}
          onTouchEnd={() => {
            move('LEFT', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          ←
        </div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            // left: 76,
            left: 98,
            bottom: 98,
          }}
          onMouseDown={() => {
            move('RIGHT', true);
          }}
          onMouseUp={() => {
            move('RIGHT', false);
          }}
          onTouchStart={() => {
            move('RIGHT', true);
          }}
          onTouchEnd={() => {
            move('RIGHT', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          →
        </div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            // left: 76,
            left: 16,
            bottom: 139,
          }}
          onMouseDown={() => {
            move('UP', true);
          }}
          onMouseUp={() => {
            move('UP', false);
          }}
          onTouchStart={() => {
            move('UP', true);
          }}
          onTouchEnd={() => {
            move('UP', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          ↖
        </div>
        <div
          className="actionbuttons"
          role="button"
          tabIndex={0}
          style={{
            ...btnStyle,
            // left: 76,
            left: 98,
            bottom: 139,
          }}
          onMouseDown={() => {
            move('DOWN', true);
          }}
          onMouseUp={() => {
            move('DOWN', false);
          }}
          onTouchStart={() => {
            move('DOWN', true);
          }}
          onTouchEnd={() => {
            move('DOWN', false);
          }}
          onTouchCancel={cancelMovement}
          onMouseLeave={cancelMovement}
        >
          ↘
        </div>
      </div>
    );
  }
}

export default Mobile3DControls;
