/**
 * Original from OrbitControl of the three.js package from
 *
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author ScieCode / http://github.com/sciecode
 *
 * Changes for smooth key movement from
 *
 * @author hf / http://github.com/pixelplanetdev
 */

/* eslint-disable no-console */

import {
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  Vector3,
} from 'three';
import { onViewFinishChange, setViewCoordinates } from '../actions';
import { THREE_CANVAS_HEIGHT } from '../core/constants';

// This set of controls performs orbiting, dollying (zooming),
// and panning and smooth moving by keys.
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey,
//          or arrow keys / touch: two-finger move

class VoxelPainterControls extends EventDispatcher {
  constructor(object, domElement, store) {
    super();
    if (domElement === undefined) {
      console.warn(
        // eslint-disable-next-line max-len
        'THREE.VoxelPainterControls: The second parameter "domElement" is now mandatory.',
      );
    }
    if (domElement === document) {
      console.error(
        // eslint-disable-next-line max-len
        'THREE.VoxelPainterControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.',
      );
    }

    this.object = object;
    this.domElement = domElement;
    this.store = store;

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vector3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0;
    this.maxZoom = Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    this.minAzimuthAngle = -Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.05;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    // Set to false to disable panning
    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true; // if true, pan in screen-space
    this.keyPanSpeed = 20.0; // pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    // Mouse buttons
    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    };

    // Touch fingers
    this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    //
    // internals
    //

    const scope = this;

    const changeEvent = { type: 'change' };
    const startEvent = { type: 'start' };
    const endEvent = { type: 'end' };

    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6,
    };

    let state = STATE.NONE;

    const EPS = 0.000001;

    // current position in spherical coordinates
    const spherical = new Spherical();
    const sphericalDelta = new Spherical();

    this.moveLeft = false;
    this.moveRight = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveUp = false;
    this.moveDown = false;

    let scale = 1;
    const panOffset = new Vector3();
    let zoomChanged = false;

    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();

    const panStart = new Vector2();
    const panEnd = new Vector2();
    const panDelta = new Vector2();

    const dollyStart = new Vector2();
    const dollyEnd = new Vector2();
    const dollyDelta = new Vector2();

    function getAutoRotationAngle() {
      return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed;
    }

    function getZoomScale() {
      return 0.95 ** scope.zoomSpeed;
    }

    function rotateLeft(angle) {
      sphericalDelta.theta -= angle;
    }

    function rotateUp(angle) {
      sphericalDelta.phi -= angle;
    }

    const v = new Vector3();
    const panLeft = (distance, objectMatrix) => {
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
      v.multiplyScalar(-distance);

      panOffset.add(v);
    };

    const panUp = (distance, objectMatrix) => {
      if (scope.screenSpacePanning === true) {
        v.setFromMatrixColumn(objectMatrix, 1);
      } else {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.crossVectors(scope.object.up, v);
      }

      v.multiplyScalar(distance);

      panOffset.add(v);
    };

    // deltaX and deltaY are in pixels; right and down are positive
    const pan = (deltaX, deltaY) => {
      const element = scope.domElement;

      if (scope.object.isPerspectiveCamera) {
        // perspective
        const { position } = scope.object;
        v.copy(position).sub(scope.target);
        let targetDistance = v.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0);

        // we use only clientHeight here so aspect ratio does not distort speed
        panLeft(
          (2 * deltaX * targetDistance) / element.clientHeight,
          scope.object.matrix,
        );
        panUp(
          (2 * deltaY * targetDistance) / element.clientHeight,
          scope.object.matrix,
        );
      } else if (scope.object.isOrthographicCamera) {
        // orthographic
        panLeft(
          // eslint-disable-next-line max-len
          (deltaX * (scope.object.right - scope.object.left))
            / scope.object.zoom
            / element.clientWidth,
          scope.object.matrix,
        );
        panUp(
          // eslint-disable-next-line max-len
          (deltaY * (scope.object.top - scope.object.bottom))
            / scope.object.zoom
            / element.clientHeight,
          scope.object.matrix,
        );
      } else {
        // camera neither orthographic nor perspective
        console.warn(
          // eslint-disable-next-line max-len
          'WARNING: VoxelPainterControls.js encountered an unknown camera type - pan disabled.',
        );
        scope.enablePan = false;
      }
    };

    function dollyIn(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale /= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(
          scope.minZoom,
          Math.min(scope.maxZoom, scope.object.zoom * dollyScale),
        );
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn(
          // eslint-disable-next-line max-len
          'WARNING: VoxelPainterControls.js encountered an unknown camera type - dolly/zoom disabled.',
        );
        scope.enableZoom = false;
      }
    }

    function dollyOut(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale *= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(
          scope.minZoom,
          Math.min(scope.maxZoom, scope.object.zoom / dollyScale),
        );
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn(
          // eslint-disable-next-line max-len
          'WARNING: VoxelPainterControls.js encountered an unknown camera type - dolly/zoom disabled.',
        );
        scope.enableZoom = false;
      }
    }

    //
    // event callbacks - update the object state
    //

    function handleMouseDownRotate(event) {
      rotateStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownDolly(event) {
      dollyStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownPan(event) {
      panStart.set(event.clientX, event.clientY);
    }

    function handleMouseMoveRotate(event) {
      rotateEnd.set(event.clientX, event.clientY);

      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      rotateLeft((Math.PI * rotateDelta.x) / element.clientHeight); // yes, height
      rotateUp((Math.PI * rotateDelta.y) / element.clientHeight);
      rotateStart.copy(rotateEnd);
      scope.update();
    }

    function handleMouseMoveDolly(event) {
      dollyEnd.set(event.clientX, event.clientY);

      dollyDelta.subVectors(dollyEnd, dollyStart);
      if (dollyDelta.y > 0) {
        dollyIn(getZoomScale());
      } else if (dollyDelta.y < 0) {
        dollyOut(getZoomScale());
      }
      dollyStart.copy(dollyEnd);
      scope.update();
    }

    function handleMouseMovePan(event) {
      panEnd.set(event.clientX, event.clientY);

      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
      scope.update();
    }

    function handleMouseUp(/* event */) {
      // no-op
    }

    function handleMouseWheel(event) {
      if (event.deltaY < 0) {
        dollyOut(getZoomScale());
      } else if (event.deltaY > 0) {
        dollyIn(getZoomScale());
      }
      scope.update();
    }

    function handleTouchStartRotate(event) {
      if (event.touches.length === 1) {
        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        rotateStart.set(x, y);
      }
    }

    function handleTouchStartPan(event) {
      if (event.touches.length === 1) {
        panStart.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

        panStart.set(x, y);
      }
    }

    function handleTouchStartDolly(event) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      dollyStart.set(0, distance);
    }

    function handleTouchStartDollyPan(event) {
      if (scope.enableZoom) handleTouchStartDolly(event);
      if (scope.enablePan) handleTouchStartPan(event);
    }

    function handleTouchStartDollyRotate(event) {
      if (scope.enableZoom) handleTouchStartDolly(event);
      if (scope.enableRotate) handleTouchStartRotate(event);
    }

    function handleTouchMoveRotate(event) {
      if (event.touches.length === 1) {
        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

        rotateEnd.set(x, y);
      }

      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      rotateLeft((2 * Math.PI * rotateDelta.x) / element.clientHeight);
      rotateUp((2 * Math.PI * rotateDelta.y) / element.clientHeight);
      rotateStart.copy(rotateEnd);
    }

    function handleTouchMovePan(event) {
      if (event.touches.length === 1) {
        panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
      } else {
        const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        panEnd.set(x, y);
      }
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
    }

    function handleTouchMoveDolly(event) {
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyEnd.set(0, distance);
      dollyDelta.set(0, (dollyEnd.y / dollyStart.y) ** scope.zoomSpeed);
      dollyIn(dollyDelta.y);
      dollyStart.copy(dollyEnd);
    }

    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event);
      if (scope.enablePan) handleTouchMovePan(event);
    }

    function handleTouchMoveDollyRotate(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event);
      if (scope.enableRotate) handleTouchMoveRotate(event);
    }

    function handleTouchEnd(/* event */) {
      // no-op
    }

    //
    // event handlers - FSM: listen for events and reset state
    //
    //
    function onDocumentKeyDown(event) {
      if (scope.enabled === false) return;
      // ignore key presses if modal is open or chat is used
      if (
        event.target.nodeName === 'INPUT'
        || event.target.nodeName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          scope.moveForward = true;
          break;

        case 37: // left
        case 65: // a
          scope.moveLeft = true;
          break;

        case 40: // down
        case 83: // s
          scope.moveBackward = true;
          break;

        case 39: // right
        case 68: // d
          scope.moveRight = true;
          break;

        case 69: // E
          scope.moveUp = true;
          break;

        case 67: // C
          scope.moveDown = true;
          break;
        default:
          break;
      }
    }

    function onDocumentKeyUp(event) {
      if (scope.enabled === false) return;
      // ignore key presses if modal is open or chat is used
      if (
        event.target.nodeName === 'INPUT'
        || event.target.nodeName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          scope.moveForward = false;
          break;

        case 37: // left
        case 65: // a
          scope.moveLeft = false;
          break;

        case 40: // down
        case 83: // s
          scope.moveBackward = false;
          break;

        case 39: // right
        case 68: // d
          scope.moveRight = false;
          break;

        case 69: // E
          scope.moveUp = false;
          break;

        case 67: // C
          scope.moveDown = false;
          break;
        default:
          break;
      }
    }

    function onMouseMove(event) {
      if (scope.enabled === false) return;

      event.preventDefault();

      switch (state) {
        case STATE.ROTATE:
          handleMouseMoveRotate(event);
          break;
        case STATE.DOLLY:
          handleMouseMoveDolly(event);
          break;
        case STATE.PAN:
          handleMouseMovePan(event);
          break;
        default:
          break;
      }
    }

    function onMouseUp(event) {
      if (scope.enabled === false) return;

      handleMouseUp(event);
      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('mouseup', onMouseUp, false);
      scope.dispatchEvent(endEvent);
      state = STATE.NONE;
    }

    function onMouseWheel(event) {
      if (
        scope.enabled === false
        || scope.enableZoom === false
        || (state !== STATE.NONE && state !== STATE.ROTATE)
      ) return;

      event.preventDefault();
      event.stopPropagation();

      scope.dispatchEvent(startEvent);
      handleMouseWheel(event);
      scope.dispatchEvent(endEvent);
    }

    function onTouchStart(event) {
      if (scope.enabled === false) return;

      event.preventDefault();

      switch (event.touches.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false) return;

              handleTouchStartRotate(event);
              state = STATE.TOUCH_ROTATE;
              break;

            case TOUCH.PAN:
              if (scope.enablePan === false) return;

              handleTouchStartPan(event);
              state = STATE.TOUCH_PAN;
              break;

            default:
              state = STATE.NONE;
          }

          break;

        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false) {
                return;
              }

              handleTouchStartDollyPan(event);
              state = STATE.TOUCH_DOLLY_PAN;
              break;

            case TOUCH.DOLLY_ROTATE:
              if (scope.enableZoom === false && scope.enableRotate === false) {
                return;
              }

              handleTouchStartDollyRotate(event);
              state = STATE.TOUCH_DOLLY_ROTATE;
              break;

            default:
              state = STATE.NONE;
          }

          break;

        default:
          state = STATE.NONE;
      }

      if (state !== STATE.NONE) {
        scope.dispatchEvent(startEvent);
      }
    }

    function onTouchMove(event) {
      if (scope.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false) return;

          handleTouchMoveRotate(event);
          scope.update();
          break;

        case STATE.TOUCH_PAN:
          if (scope.enablePan === false) return;

          handleTouchMovePan(event);
          scope.update();
          break;

        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false) {
            return;
          }

          handleTouchMoveDollyPan(event);
          scope.update();
          break;

        case STATE.TOUCH_DOLLY_ROTATE:
          if (scope.enableZoom === false && scope.enableRotate === false) {
            return;
          }

          handleTouchMoveDollyRotate(event);
          scope.update();
          break;

        default:
          state = STATE.NONE;
      }
    }

    function onTouchEnd(event) {
      if (scope.enabled === false) return;

      handleTouchEnd(event);
      scope.dispatchEvent(endEvent);
      state = STATE.NONE;
    }

    function onContextMenu(event) {
      if (scope.enabled === false) return;

      event.preventDefault();
    }

    function onMouseDown(event) {
      if (scope.enabled === false) return;

      // Prevent the browser from scrolling.
      event.preventDefault();

      // Manually set the focus since calling preventDefault above
      // prevents the browser from setting it automatically.
      if (scope.domElement.focus) {
        scope.domElement.focus();
      } else {
        window.focus();
      }

      let mouseAction;

      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT;
          break;

        case 1:
          mouseAction = scope.mouseButtons.MIDDLE;
          break;

        case 2:
          mouseAction = scope.mouseButtons.RIGHT;
          break;

        default:
          mouseAction = -1;
      }

      switch (mouseAction) {
        case MOUSE.DOLLY:
          handleMouseDownDolly(event);
          state = STATE.DOLLY;
          break;

        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey) {
            handleMouseDownPan(event);
            state = STATE.PAN;
          } else {
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          }
          break;

        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey) {
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          } else {
            handleMouseDownPan(event);
            state = STATE.PAN;
          }
          break;

        default:
          state = STATE.NONE;
      }

      if (state !== STATE.NONE) {
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        scope.dispatchEvent(startEvent);
      }
    }

    scope.domElement.addEventListener('contextmenu', onContextMenu, false);

    scope.domElement.addEventListener('mousedown', onMouseDown, false);
    scope.domElement.addEventListener('wheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('keyup', onDocumentKeyUp, false);

    scope.domElement.addEventListener('touchstart', onTouchStart, false);
    scope.domElement.addEventListener('touchend', onTouchEnd, false);
    scope.domElement.addEventListener('touchmove', onTouchMove, false);

    // make sure element can receive keys.

    if (scope.domElement.tabIndex === -1) {
      scope.domElement.tabIndex = 0;
    }

    //
    // public methods
    //

    this.getPolarAngle = () => spherical.phi;

    this.getAzimuthalAngle = () => spherical.theta;

    this.saveState = () => {
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };

    this.reset = () => {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;

      scope.object.updateProjectionMatrix();
      scope.dispatchEvent(changeEvent);

      scope.update();

      state = STATE.NONE;
    };

    this.setView = (view) => {
      if (view.length !== 3) {
        return;
      }
      scope.target.set(...view);
    };

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = (() => {
      const offset = new Vector3();

      // so camera.up is the orbit axis
      const quat = new Quaternion().setFromUnitVectors(
        object.up,
        new Vector3(0, 1, 0),
      );
      const quatInverse = quat.clone().inverse();

      const lastPosition = new Vector3();
      const lastQuaternion = new Quaternion();

      // const rotationFinishThreshold = Math.PI / 180 / 4;
      let updateTime = Date.now();

      const direction = new Vector3();
      const velocity = new Vector3();
      let prevTime = Date.now();
      const vec = new Vector3();

      return function update() {
        const time = Date.now();

        const delta = (time - prevTime) / 1000.0;
        velocity.x -= velocity.x * 40.0 * delta;
        velocity.y -= velocity.y * 40.0 * delta;
        velocity.z -= velocity.z * 40.0 * delta;
        const length = velocity.length();
        if (length < 1 || length > 10) {
          velocity.set(0, 0, 0);
        }

        const {
          moveRight,
          moveLeft,
          moveUp,
          moveDown,
          moveForward,
          moveBackward,
        } = scope;

        direction.x = Number(moveRight) - Number(moveLeft);
        direction.y = Number(moveUp) - Number(moveDown);
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.normalize();

        if (moveLeft || moveRight) {
          velocity.x -= direction.x * 1000.0 * delta;
        }
        if (moveUp || moveDown) {
          velocity.y -= direction.y * 1000.0 * delta;
        }
        if (moveForward || moveBackward) {
          velocity.z -= direction.z * 500.0 * delta;
        }

        vec.setFromMatrixColumn(scope.object.matrix, 0);
        vec.crossVectors(scope.object.up, vec);
        vec.multiplyScalar(-velocity.z * delta);
        vec.y += -velocity.y * delta;
        panOffset.add(vec);
        vec.setFromMatrixColumn(scope.object.matrix, 0);
        vec.multiplyScalar(-velocity.x * delta);
        panOffset.add(vec);

        prevTime = time;

        const { position } = scope.object;

        offset.copy(position).sub(scope.target);

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion(quat);

        // angle from z-axis around y-axis
        spherical.setFromVector3(offset);

        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle());
        }

        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor;
          spherical.phi += sphericalDelta.phi * scope.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }

        // restrict theta to be between desired limits
        spherical.theta = Math.max(
          scope.minAzimuthAngle,
          Math.min(scope.maxAzimuthAngle, spherical.theta),
        );

        // restrict phi to be between desired limits
        spherical.phi = Math.max(
          scope.minPolarAngle,
          Math.min(scope.maxPolarAngle, spherical.phi),
        );
        spherical.makeSafe();

        spherical.radius *= scale;

        // restrict radius to be between desired limits
        spherical.radius = Math.max(
          scope.minDistance,
          Math.min(scope.maxDistance, spherical.radius),
        );

        // move target to panned location
        if (panOffset.length() > 1000) {
          panOffset.set(0, 0, 0);
        }
        if (scope.enableDamping === true) {
          scope.target.addScaledVector(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }
        /*
        if (scope.target.y < 10.0) {
          scope.target.y = 10.0;
        }
        */

        // clamp to boundaries
        const { canvasSize } = scope.store.getState().canvas;
        const bound = canvasSize / 2;
        scope.target.clamp(
          {
            x: -bound,
            y: 10,
            z: -bound,
          },
          {
            x: bound,
            y: THREE_CANVAS_HEIGHT,
            z: bound,
          },
        );

        offset.setFromSpherical(spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion(quatInverse);
        position.copy(scope.target).add(offset);
        scope.object.lookAt(scope.target);

        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;
          panOffset.multiplyScalar(1 - scope.dampingFactor);

          if (panOffset.length() < 0.2 && panOffset.length() !== 0.0) {
            panOffset.set(0, 0, 0);
            scope.store.dispatch(setViewCoordinates(scope.target.toArray()));
            scope.store.dispatch(onViewFinishChange());
          } else if (panOffset.length() !== 0.0) {
            const curTime = Date.now();
            if (curTime > updateTime + 500) {
              updateTime = curTime;
              scope.store.dispatch(setViewCoordinates(scope.target.toArray()));
              scope.store.dispatch(onViewFinishChange());
            }
          }
          /*
          if (Math.abs(sphericalDelta.theta) < rotationFinishThreshold
            && sphericalDelta.theta != 0.0
            && Math.abs(sphericalDelta.phi) < rotationFinishThreshold
            && sphericalDelta.phi != 0.0) {
            sphericalDelta.set(0, 0, 0);
            console.log(`rotation finished`);
          }
          */
        } else {
          sphericalDelta.set(0, 0, 0);
          panOffset.set(0, 0, 0);
        }

        scale = 1;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if (
          zoomChanged
          || lastPosition.distanceToSquared(scope.object.position) > EPS
          || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS
        ) {
          scope.dispatchEvent(changeEvent);

          lastPosition.copy(scope.object.position);
          lastQuaternion.copy(scope.object.quaternion);
          zoomChanged = false;

          return true;
        }

        return false;
      };
    })();

    this.dispose = () => {
      scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
      scope.domElement.removeEventListener('mousedown', onMouseDown, false);
      scope.domElement.removeEventListener('wheel', onMouseWheel, false);

      scope.domElement.removeEventListener('touchstart', onTouchStart, false);
      scope.domElement.removeEventListener('touchend', onTouchEnd, false);
      scope.domElement.removeEventListener('touchmove', onTouchMove, false);

      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('mouseup', onMouseUp, false);
      document.removeEventListener('keydown', onDocumentKeyDown, false);
      document.removeEventListener('keyup', onDocumentKeyUp, false);

      // scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
    };

    this.update();
  }
}

// VoxelPainterControls.prototype = Object.create(EventDispatcher.prototype);
// VoxelPainterControls.prototype.constructor = VoxelPainterControls;

export default VoxelPainterControls;
