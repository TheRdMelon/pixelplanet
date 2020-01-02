(function () {
  function checkMaterial(object) {
      if (object.material) {
          const materialName = object.material.name;
          if (materialName == "canvas") {
              console.log("Found material");
              object.material = canvasTexture;
              return true;
          }
      }
      return false;
  }

  function parseHashCoords() {
      try {
          const hash = window.location.hash;
          const array = hash.substring(1).split(',');
          const ident = array.shift(); 
          const [id, size, x, y] = array.map((z) => parseInt(z));
          if (!ident || isNaN(x) || isNaN(y) || isNaN(id) || isNaN(size)) {
              throw "NaN";
          }
          return [ident, id, size, x, y];
      } catch (error) {
          return ['d', 0, 65536, 0, 0];
      };
  }

  function rotateToCoords(canvasSize, object, coords) {
      console.log("Rotate to", coords);
      const [x, y] = coords;
      const rotOffsetX = 0;
      const rotOffsetY = 3 * Math.PI / 2;
      const rotX = -y * Math.PI / canvasSize;
      const rotY = -x * 2 * Math.PI / canvasSize;
      object.rotation.x += rotOffsetX + rotX;
      object.rotation.y += rotOffsetY + rotY;
  }

	var webglEl = document.getElementById('webgl');

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(webglEl);
		return;
	}

  const [canvasIdent, canvasId, canvasSize, x, y] = parseHashCoords();

  const canvasTexture = new THREE.MeshPhongMaterial({
      map:         new THREE.TextureLoader().load(`../tiles/${canvasId}/texture.png`),
      bumpMap:     new THREE.TextureLoader().load((canvasId == 0) ? 'normal.jpg' : 'normalm.jpg'),
      bumpScale:   0.02,
      specularMap: new THREE.TextureLoader().load((canvasId == 0) ? 'specular.jpg' : 'specularm.jpg'),
      specular: new THREE.Color('grey')
  });

	var width  = window.innerWidth,
		height = window.innerHeight;

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
	camera.position.z = 4.0;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 0.7);
	light.position.set(10,6,10);
	scene.add(light);

    var object = null;
    var loader = new THREE.GLTFLoader();
    loader.load('globe.glb', function (glb) {
        scene.add(glb.scene);
        const children = glb.scene.children;
        for (let cnt = 0; cnt < children.length; cnt++) {
            //children[cnt].scale.x *= -1;
            //children[cnt].scale.y *= -1;
            if (checkMaterial(children[cnt]))
                object = children[cnt];
            const grandchildren = children[cnt].children;
            for (let xnt = 0; xnt < grandchildren.length; xnt++) {
                if (checkMaterial(grandchildren[xnt]))
                    object = children[cnt];
                //children[cnt].material.side = THREE.DoubleSide;
            }
        } 
        rotateToCoords(canvasSize, object, [x, y]);
    }, function (xhr) {console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {console.log('An error happened', error);
    });

    
	// Earth params
	var radius   = 0.5,
	    segments = 32,
	    rotation = 6;  


	var stars = createStars(90, 64);
	scene.add(stars);

	var controls = new THREE.TrackballControls(camera);

	webglEl.appendChild(renderer.domElement);

	render();

	function render() {
		controls.update();
		if (object) object.rotation.y += 0.0005;
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}

	function createStars(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments), 
			new THREE.MeshBasicMaterial({
				map:  THREE.ImageUtils.loadTexture('starfield.png'), 
				side: THREE.BackSide
			})
		);
	}

  setInterval(onDocumentMouseMove, 1000);

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var lastView = [0, 0];
  const coorbox = document.getElementById("coorbox");
  function onDocumentMouseMove(event) {
      if (event) {
          mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
          mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      } else {
          mouse.x = 0.0;
          mouse.y = 0.0;
      }

      raycaster.setFromCamera( mouse, camera );
      var intersects = raycaster.intersectObject( object );

      const elem = document.getElementsByTagName("BODY")[0];
      if(intersects.length > 0) {
          const { x, y } = intersects[0].uv;
          const xabs = Math.floor((x - 0.5) * canvasSize);
          const yabs = Math.floor((0.5 - y) * canvasSize);
          //console.log(`On ${xabs} / ${yabs} cam: ${camera.position.z}`);
          coorbox.innerHTML = `(${xabs}, ${yabs})`;
          elem.style.cursor = 'move';
      } else {
          elem.style.cursor = 'default';
      }
  }

  function onDocumentDblClick(event) {
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );
      var intersects = raycaster.intersectObject( object );

      if(intersects.length > 0) {
          const { x, y } = intersects[0].uv;
          const xabs = Math.round((x - 0.5) * canvasSize);
          const yabs = Math.round((0.5 - y) * canvasSize);
          window.location.href = `../#${canvasIdent},${xabs},${yabs},0`;
      }
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('dblclick', onDocumentDblClick, false);

}());
