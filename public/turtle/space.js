// Created by Bjorn Sandvik - thematicmapping.org
(function () {

	var webglEl = document.getElementById('webgl');

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(webglEl);
		return;
	}

	var width  = window.innerWidth,
		height = window.innerHeight;

	// Earth params
	var radius   = 0.5,
	    segments = 32,
	    rotation = 6;  

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
	camera.position.z = 20.0;

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5,3,5);
	scene.add(light);

    var loader = new THREE.GLTFLoader();
    loader.load('turtle.glb', function (glb) {
        window.test2 = glb.scene;
        scene.add(glb.scene);
        window.test = scene;
        const children = glb.scene.children;
        for (let cnt = 0; cnt < children.length; cnt++) {
            //children[cnt].scale.x *= -1;
            //children[cnt].scale.y *= -1;
            const child = children[cnt].children;
            if (children[cnt].material) {
                const material = children[cnt].material.name;
                console.log(material);
                if (material == "canvas") {
                    console.log("Found material");
                    children[cnt].material = new THREE.MeshPhongMaterial({
                        map:         new THREE.TextureLoader().load('../tiles/texture.png?a=b'),
                        bumpMap:     new THREE.TextureLoader().load('../images/elev_bump_4k2.jpg'),
                        bumpScale:   0.04,
                    });
                    //children[cnt].material.side = THREE.DoubleSide;
                }
            }
            for (let xnt = 0; xnt < child.length; xnt++) {
                const material = child[xnt].material.name;
                console.log(material);
                if (material == "canvas") {
                    console.log("Found material");
                    child[xnt].material = new THREE.MeshPhongMaterial({
                        map:         new THREE.TextureLoader().load('../tiles/texture.png?a=b'),
                        bumpMap:     new THREE.TextureLoader().load('../images/elev_bump_4k2.jpg'),
                        bumpScale:   0.04,
                    });
                    //children[cnt].material.side = THREE.DoubleSide;
                }
            }
        } 
        //glb.animations;
        //glb.scene;
        //glb.scenes;
        //glb.cameras;
        //glb.asset;
    }, function (xhr) {console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, function (error) {console.log('An error happened', error);
    });

    //var sphere = createSphere(radius, segments);
	//sphere.rotation.y = rotation; 
	//scene.add(sphere)

    //var clouds = createClouds(radius, segments);
	//clouds.rotation.y = rotation * 10;
	//scene.add(clouds)

	var stars = createStars(90, 64);
	scene.add(stars);

	var controls = new THREE.TrackballControls(camera);

	webglEl.appendChild(renderer.domElement);

	render();

	function render() {
		controls.update();
		//sphere.rotation.y += 0.0005;
		//clouds.rotation.y += 0.005;		
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}

	function createSphere(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshPhongMaterial({
				map:         THREE.ImageUtils.loadTexture('../tiles/texture.png'),
				bumpMap:     THREE.ImageUtils.loadTexture('../images/elev_bump_4k.jpg'),
				bumpScale:   0.004,
				//specularMap: THREE.ImageUtils.loadTexture('images/water_4k.png'),
				//specular:    new THREE.Color('grey')								
			})
		);
	}

	function createClouds(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius + 0.005, segments, segments),			
			new THREE.MeshPhongMaterial({
				map:         THREE.ImageUtils.loadTexture('../images/fair_clouds_dark_4k.png'),
				transparent: true
			})
		);		
	}

	function createStars(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments), 
			new THREE.MeshBasicMaterial({
				map:  THREE.ImageUtils.loadTexture('../images/galaxy_starfield.png'), 
				side: THREE.BackSide
			})
		);
	}

}());
