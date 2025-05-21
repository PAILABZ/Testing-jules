// tesseract.js - Three.js Tesseract Visualization

// Imports for Three.js core and addons
import * as THREE from '../three.module.js'; // Assuming three.module.js is in js/
import { EffectComposer } from './threejs_addons/EffectComposer.js';
import { RenderPass } from './threejs_addons/RenderPass.js';
import { UnrealBloomPass } from './threejs_addons/UnrealBloomPass.js';
// ShaderPass and CopyShader might be implicitly imported by EffectComposer/UnrealBloomPass from their relative paths
// If not, they would need to be explicitly imported if ShaderPass is used directly.

let scene, camera, renderer, tesseractMesh, tesseractVerticesGroup;
let composer; // For post-processing
let animationFrameId; 
let isTesseractInitialized = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
// windowHalfX and windowHalfY are not strictly needed if using clientX/Y with getBoundingClientRect

function initTesseract() {
    if (isTesseractInitialized) return;

    const container = document.getElementById('tesseract-canvas-container');
    if (!container) {
        console.error('Tesseract canvas container not found!');
        return;
    }
    container.innerHTML = ''; // Clear container in case of re-initialization

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4; // Adjusted for tesseract size

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft white light
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x00A9E0, 0.8, 100); // Aero Blue
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xFF00FF, 0.6, 100); // Neon Pink
    pointLight2.position.set(-5, -3, 2);
    scene.add(pointLight2);


    // Tesseract Geometry
    const vertices4D = [];
    for (let i = 0; i < 16; i++) {
        vertices4D.push([
            (i & 1) ? 1 : -1, (i & 2) ? 1 : -1,
            (i & 4) ? 1 : -1, (i & 8) ? 1 : -1
        ]);
    }
    
    const scaleFactor = 1.5; // Fixed scale for initial setup
    const projectedVertices = vertices4D.map(v4 => 
        new THREE.Vector3(v4[0] * scaleFactor, v4[1] * scaleFactor, v4[2] * scaleFactor)
    );

    const edges = [];
    for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
            let diff = 0;
            for(let k=0; k<4; k++) if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
            if (diff === 1) {
                edges.push(projectedVertices[i]);
                edges.push(projectedVertices[j]);
            }
        }
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(edges);
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFF00FF, // Neon Pink
        linewidth: 1.5, // Will likely render as 1px on most systems
        transparent: true,
        opacity: 0.85
    });
    tesseractMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(tesseractMesh);

    // Glossy Vertices
    tesseractVerticesGroup = new THREE.Group(); // Group to hold all vertex spheres
    const vertexGeometry = new THREE.SphereGeometry(0.07, 16, 12); // Small spheres
    const vertexMaterial = new THREE.MeshStandardMaterial({
        color: 0xADD8E6, // Light Blue (Aero)
        metalness: 0.3,
        roughness: 0.1,
        emissive: 0x0078D4, // Aero Blue emissive for a bit of self-glow
        emissiveIntensity: 0.3
    });

    projectedVertices.forEach(pv => {
        const vertexSphere = new THREE.Mesh(vertexGeometry, vertexMaterial);
        vertexSphere.position.copy(pv);
        tesseractVerticesGroup.add(vertexSphere);
    });
    tesseractMesh.add(tesseractVerticesGroup); // Add vertices group as child of lines mesh for unified rotation


    // Post-Processing - Bloom Effect
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const unrealBloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        1.1, // strength (adjusted from 1.3)
        0.45, // radius (adjusted from 0.6)
        0.15  // threshold (adjusted from 0.1)
    );
    composer.addPass(unrealBloomPass);
    
    // Event Listeners
    container.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    
    isTesseractInitialized = true;
    startTesseractAnimation(); 
}

function onMouseMove(event) {
    const container = document.getElementById('tesseract-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    mouseX = (event.clientX - rect.left - (rect.width / 2));
    mouseY = (event.clientY - rect.top - (rect.height / 2));

    targetRotationX = mouseY * 0.003; // Adjusted sensitivity
    targetRotationY = mouseX * 0.003;
}

function onWindowResize() {
    const container = document.getElementById('tesseract-canvas-container');
    if (!container || !renderer || !camera || !composer) return;

    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    composer.setSize(newWidth, newHeight); // Important for bloom pass
}

function animateTesseract() {
    if (!tesseractMesh) return; 

    animationFrameId = requestAnimationFrame(animateTesseract);

    // Default rotation (applied to the parent LineSegments mesh)
    tesseractMesh.rotation.x += 0.002;
    tesseractMesh.rotation.y += 0.003;
    tesseractMesh.rotation.z += 0.001; 

    // Mouse interaction based rotation (smoothed)
    tesseractMesh.rotation.y += (targetRotationY - tesseractMesh.rotation.y) * 0.05;
    tesseractMesh.rotation.x += (targetRotationX - tesseractMesh.rotation.x) * 0.05;
    
    // renderer.render(scene, camera); // Replaced by composer
    composer.render();
}

function startTesseractAnimation() {
    if (!isTesseractInitialized) {
        console.warn("Tesseract not initialized. Call initTesseract() first.");
        return;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); 
    }
    animateTesseract();
}

function stopTesseractAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Make functions globally accessible for script.js
window.initTesseract = initTesseract;
window.startTesseractAnimation = startTesseractAnimation;
window.stopTesseractAnimation = stopTesseractAnimation;
window.isTesseractInitialized = isTesseractInitialized; // Expose this flag too
