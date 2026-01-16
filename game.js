// Tonnetz Music Grid Game
// A 3D game with neo-Riemannian Tonnetz grid and MIDI chord playback

// ============================================
// AUDIO SYSTEM - Web Audio API for MIDI tones
// ============================================

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.activeOscillators = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
        this.initialized = true;
    }

    // Convert MIDI note number to frequency
    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    // Play a chord (array of MIDI note numbers)
    playChord(midiNotes, duration = 0.8) {
        if (!this.initialized) return;

        // Stop any currently playing notes
        this.stopAll();

        const now = this.audioContext.currentTime;

        midiNotes.forEach((note, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Use slightly detuned sawtooth for richer sound
            oscillator.type = 'triangle';
            oscillator.frequency.value = this.midiToFrequency(note);

            // ADSR envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05); // Attack
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.15); // Decay
            gainNode.gain.setValueAtTime(0.25, now + duration - 0.2); // Sustain
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + duration);

            this.activeOscillators.push({ oscillator, gainNode });
        });
    }

    stopAll() {
        this.activeOscillators.forEach(({ oscillator, gainNode }) => {
            try {
                gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            } catch (e) {}
        });
        this.activeOscillators = [];
    }
}

// ============================================
// TONNETZ SYSTEM - Neo-Riemannian Theory
// ============================================

class TonnetzSystem {
    constructor() {
        // Note names for display
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Grid dimensions
        this.gridWidth = 12;
        this.gridHeight = 8;
        this.triangleSize = 3; // Size of each triangle cell
        
        // The Tonnetz is a lattice where:
        // - Moving right by 1 = +7 semitones (perfect fifth)
        // - Moving diagonally up-right = +4 semitones (major third)
        // - Moving diagonally up-left = +3 semitones (minor third)
        
        this.fifthInterval = 7;
        this.majorThirdInterval = 4;
        this.minorThirdInterval = 3;
        
        // Generate the Tonnetz grid
        this.grid = this.generateGrid();
        this.triangles = this.generateTriangles();
    }

    generateGrid() {
        // Create a 2D grid of pitch classes for the Tonnetz
        // In the Tonnetz:
        // - Each column step right = perfect fifth (+7 semitones)
        // - Each row step up = major third (+4 semitones)
        // This ensures upward triangles = major triads, downward = minor triads
        const grid = [];
        
        for (let row = 0; row < this.gridHeight + 1; row++) {
            grid[row] = [];
            for (let col = 0; col < this.gridWidth + 1; col++) {
                // Start from C (pitch class 0)
                // Each row up adds a major third (+4)
                // Each column right adds a perfect fifth (+7)
                const pitchClass = (row * this.majorThirdInterval + col * this.fifthInterval) % 12;
                grid[row][col] = pitchClass;
            }
        }
        
        return grid;
    }

    generateTriangles() {
        // Generate triangular cells for the Tonnetz
        // Each upward triangle = major triad, each downward = minor triad
        const triangles = [];
        const triWidth = this.triangleSize;
        const triHeight = this.triangleSize * Math.sqrt(3) / 2;
        
        // In a triangular grid:
        // - Vertices are at grid positions (row, col)
        // - Upward triangle at (row, col) uses vertices: (row, col), (row, col+1), (row+1, col)
        // - Downward triangle at (row, col) uses vertices: (row+1, col), (row, col+1), (row+1, col+1)
        
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                // Visual positions - odd rows offset by half width
                const xOffset = (row % 2) * (triWidth / 2);
                
                // Vertex positions in world space
                const v0 = { x: col * triWidth + xOffset, z: row * triHeight };                    // (row, col)
                const v1 = { x: (col + 1) * triWidth + xOffset, z: row * triHeight };              // (row, col+1)
                const v2 = { x: col * triWidth + triWidth/2 + xOffset, z: (row + 1) * triHeight }; // (row+1, col) - offset for next row
                const v3 = { x: (col + 1) * triWidth + triWidth/2 + xOffset, z: (row + 1) * triHeight }; // (row+1, col+1)
                
                // Get pitch classes from grid
                const pc0 = this.grid[row][col];         // bottom-left
                const pc1 = this.grid[row][col + 1];     // bottom-right  
                const pc2 = this.grid[row + 1][col];     // top-left
                const pc3 = this.grid[row + 1][col + 1]; // top-right
                
                // Upward triangle: v0, v1, v2 (bottom-left, bottom-right, top)
                // Uses grid positions: (row,col), (row,col+1), (row+1,col) 
                // Notes: pc0, pc1, pc2
                // With our grid: pc0=root, pc1=root+7 (fifth), pc2=root+4 (major third)
                // This forms a major triad: root, third, fifth
                // Build chord directly from vertex pitch classes to ensure they match
                const majorChord = [60 + pc0, 60 + pc2, 60 + pc1]; // root, third (pc2), fifth (pc1)
                triangles.push({
                    type: 'major',
                    vertices: [
                        { x: v0.x, z: v0.z, pitchClass: pc0 },
                        { x: v1.x, z: v1.z, pitchClass: pc1 },
                        { x: v2.x, z: v2.z, pitchClass: pc2 }
                    ],
                    center: { 
                        x: (v0.x + v1.x + v2.x) / 3, 
                        z: (v0.z + v1.z + v2.z) / 3 
                    },
                    chord: majorChord,
                    chordName: this.noteNames[pc0],
                    row: row,
                    col: col
                });
                
                // Downward triangle: v2, v1, v3 (top-left, bottom-right, top-right)
                // Uses grid positions: (row+1,col), (row,col+1), (row+1,col+1)
                // Notes: pc2, pc1, pc3
                // With our grid: pc2=root+4, pc1=root+7, pc3=root+11
                // Relative to pc2 as root: pc1=pc2+3, pc3=pc2+7 -> minor triad rooted on pc2
                // Build chord directly from vertex pitch classes
                const minorChord = [60 + pc2, 60 + pc1, 60 + pc3]; // root (pc2), third (pc1), fifth (pc3)
                triangles.push({
                    type: 'minor',
                    vertices: [
                        { x: v2.x, z: v2.z, pitchClass: pc2 },
                        { x: v1.x, z: v1.z, pitchClass: pc1 },
                        { x: v3.x, z: v3.z, pitchClass: pc3 }
                    ],
                    center: { 
                        x: (v2.x + v1.x + v3.x) / 3, 
                        z: (v2.z + v1.z + v3.z) / 3 
                    },
                    chord: minorChord,
                    chordName: this.noteNames[pc2] + 'm',
                    row: row,
                    col: col
                });
            }
        }
        
        return triangles;
    }

    getMajorTriad(row, col) {
        // Major triad: root, major third (+4), perfect fifth (+7)
        const root = this.grid[row][col];
        // All notes in same octave (middle C = 60)
        return [
            60 + root,               // Root
            60 + root + 4,           // Major third
            60 + root + 7            // Perfect fifth
        ];
    }

    getMinorTriad(row, col) {
        // Minor triad: root, minor third (+3), perfect fifth (+7)
        const root = this.grid[row][col];
        // All notes in same octave (middle C = 60)
        return [
            60 + root,               // Root
            60 + root + 3,           // Minor third
            60 + root + 7            // Perfect fifth
        ];
    }

    getChordName(midiNotes, type) {
        const rootNote = midiNotes[0] % 12;
        const noteName = this.noteNames[rootNote];
        return type === 'major' ? noteName : noteName + 'm';
    }

    // Check if a point is inside a triangle
    pointInTriangle(px, pz, triangle) {
        const v = triangle.vertices;
        
        const sign = (p1, p2, p3) => {
            return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
        };
        
        const d1 = sign({ x: px, z: pz }, v[0], v[1]);
        const d2 = sign({ x: px, z: pz }, v[1], v[2]);
        const d3 = sign({ x: px, z: pz }, v[2], v[0]);
        
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        
        return !(hasNeg && hasPos);
    }

    // Find which triangle contains the given point
    findTriangleAtPosition(x, z) {
        for (const triangle of this.triangles) {
            if (this.pointInTriangle(x, z, triangle)) {
                return triangle;
            }
        }
        return null;
    }
}

// ============================================
// GAME CLASS - Main game logic
// ============================================

class TonnetzGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.chordDisplay = document.querySelector('#chord-display .chord-name');
        this.notesDisplay = document.querySelector('#chord-display .notes');
        
        // Initialize systems
        this.audioSystem = new AudioSystem();
        this.tonnetz = new TonnetzSystem();
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Player
        this.player = null;
        this.playerRadius = 0.5;
        this.playerSpeed = 0.00167;
        this.velocity = { x: 0, z: 0 };
        this.friction = 0.95;
        
        // Input state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // Current triangle
        this.currentTriangle = null;
        this.triangleMeshes = [];
        
        // Setup
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        this.addLights();

        // Create Tonnetz grid visualization
        this.createTonnetzGrid();

        // Create player
        this.createPlayer();

        // Add ground
        this.createGround();
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);

        // Point light for player glow
        this.playerLight = new THREE.PointLight(0x4ecdc4, 1, 10);
        this.playerLight.position.set(0, 2, 0);
        this.scene.add(this.playerLight);
    }

    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x16213e,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createTonnetzGrid() {
        const triHeight = this.tonnetz.triangleSize * Math.sqrt(3) / 2;
        
        // Center offset
        const offsetX = -(this.tonnetz.gridWidth * this.tonnetz.triangleSize) / 2;
        const offsetZ = -(this.tonnetz.gridHeight * triHeight) / 2;

        this.tonnetz.triangles.forEach((triangle, index) => {
            // First, apply offset to triangle vertices for collision detection
            triangle.center.x += offsetX;
            triangle.center.z += offsetZ;
            triangle.vertices = triangle.vertices.map(v => ({
                x: v.x + offsetX,
                z: v.z + offsetZ,
                pitchClass: v.pitchClass
            }));

            // Create triangle geometry using the offset vertices
            // Note: Shape uses (x, y) but after rotation -PI/2 around X, y becomes -z
            // So we use -z for the shape's y coordinate to match world space
            const shape = new THREE.Shape();
            shape.moveTo(triangle.vertices[0].x, -triangle.vertices[0].z);
            shape.lineTo(triangle.vertices[1].x, -triangle.vertices[1].z);
            shape.lineTo(triangle.vertices[2].x, -triangle.vertices[2].z);
            shape.lineTo(triangle.vertices[0].x, -triangle.vertices[0].z);

            const geometry = new THREE.ShapeGeometry(shape);
            
            // Color based on chord type
            const hue = triangle.type === 'major' ? 0.55 : 0.75; // Cyan for major, purple for minor
            const saturation = 0.7;
            const lightness = 0.3;
            
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(hue, saturation, lightness),
                roughness: 0.6,
                metalness: 0.3,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.01;
            mesh.userData = { triangleIndex: index };
            
            this.scene.add(mesh);
            this.triangleMeshes.push(mesh);

            // Add edge lines
            const edgeGeometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                triangle.vertices[0].x, 0.02, triangle.vertices[0].z,
                triangle.vertices[1].x, 0.02, triangle.vertices[1].z,
                triangle.vertices[1].x, 0.02, triangle.vertices[1].z,
                triangle.vertices[2].x, 0.02, triangle.vertices[2].z,
                triangle.vertices[2].x, 0.02, triangle.vertices[2].z,
                triangle.vertices[0].x, 0.02, triangle.vertices[0].z
            ]);
            edgeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const edgeMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                opacity: 0.3,
                transparent: true
            });
            const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            this.scene.add(edges);
        });

        // Add note labels at grid vertices
        this.addNoteLabels();
    }

    addNoteLabels() {
        const noteNames = this.tonnetz.noteNames;
        
        // Collect unique vertices from all triangles (already have offset applied)
        // Each vertex now has its pitchClass stored directly
        const vertexMap = new Map();
        
        this.tonnetz.triangles.forEach((triangle) => {
            triangle.vertices.forEach((v) => {
                // Round to avoid floating point issues
                const key = `${v.x.toFixed(2)},${v.z.toFixed(2)}`;
                if (!vertexMap.has(key)) {
                    vertexMap.set(key, { x: v.x, z: v.z, pitchClass: v.pitchClass });
                }
            });
        });
        
        // Create sprites at each unique vertex
        vertexMap.forEach(({ x, z, pitchClass }) => {
            const noteName = noteNames[pitchClass];
            const sprite = this.createTextSprite(noteName);
            sprite.position.set(x, 0.5, z);
            sprite.scale.set(0.8, 0.4, 1);
            this.scene.add(sprite);
        });
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 20px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        return new THREE.Sprite(material);
    }

    createPlayer() {
        // Create player sphere
        const geometry = new THREE.SphereGeometry(this.playerRadius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff6b6b,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xff6b6b,
            emissiveIntensity: 0.2
        });
        
        this.player = new THREE.Mesh(geometry, material);
        this.player.position.set(0, this.playerRadius, 0);
        this.player.castShadow = true;
        this.player.receiveShadow = true;
        
        this.scene.add(this.player);
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start button
        const startBtn = document.getElementById('start-btn');
        const overlay = document.getElementById('start-overlay');
        
        startBtn.addEventListener('click', () => {
            this.audioSystem.init();
            overlay.style.display = 'none';
        });
    }

    updatePlayer() {
        // Apply movement based on key presses
        if (this.keys.w) this.velocity.z -= this.playerSpeed;
        if (this.keys.s) this.velocity.z += this.playerSpeed;
        if (this.keys.a) this.velocity.x -= this.playerSpeed;
        if (this.keys.d) this.velocity.x += this.playerSpeed;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;

        // Update position
        this.player.position.x += this.velocity.x;
        this.player.position.z += this.velocity.z;

        // Simple rotation based on movement
        if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01) {
            this.player.rotation.x += this.velocity.z * 0.5;
            this.player.rotation.z -= this.velocity.x * 0.5;
        }

        // Update player light position
        this.playerLight.position.copy(this.player.position);
        this.playerLight.position.y += 1;

        // Check which triangle the player is in
        this.checkPlayerPosition();
    }

    checkPlayerPosition() {
        const triangle = this.tonnetz.findTriangleAtPosition(
            this.player.position.x,
            this.player.position.z
        );

        if (triangle && triangle !== this.currentTriangle) {
            this.currentTriangle = triangle;
            
            // Highlight current triangle
            this.highlightTriangle(triangle);
            
            // Play chord
            this.audioSystem.playChord(triangle.chord);
            
            // Update display
            this.chordDisplay.textContent = triangle.chordName;
            this.chordDisplay.style.color = triangle.type === 'major' ? '#4ecdc4' : '#a855f7';
            
            // Show vertex notes (which are the chord notes)
            const noteNames = triangle.vertices.map(v => 
                this.tonnetz.noteNames[v.pitchClass]
            ).join(' - ');
            this.notesDisplay.textContent = noteNames;
        }
    }

    highlightTriangle(activeTriangle) {
        this.triangleMeshes.forEach((mesh, index) => {
            const triangle = this.tonnetz.triangles[index];
            const isActive = triangle === activeTriangle;
            
            if (isActive) {
                mesh.material.emissive = new THREE.Color(
                    triangle.type === 'major' ? 0x4ecdc4 : 0xa855f7
                );
                mesh.material.emissiveIntensity = 0.5;
                mesh.material.opacity = 1;
            } else {
                mesh.material.emissive = new THREE.Color(0x000000);
                mesh.material.emissiveIntensity = 0;
                mesh.material.opacity = 0.7;
            }
        });
    }

    updateCamera() {
        // Smooth camera follow
        const targetX = this.player.position.x;
        const targetZ = this.player.position.z + 10;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
        
        // Look at player
        this.camera.lookAt(
            this.player.position.x,
            0,
            this.player.position.z
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.updatePlayer();
        this.updateCamera();

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TonnetzGame();
});
