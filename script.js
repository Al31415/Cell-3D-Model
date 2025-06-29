import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// --- SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.AmbientLight(0x666666));
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(10, 50, 20);
scene.add(light);

// --- UI & STATE ---
const label = document.getElementById('label');
const zoomOutBtn = document.getElementById('zoom-out-btn');
let currentView = 'chromosome'; // 'chromosome', 'chromatinFiber', 'chromatin', or 'dna'
let interactiveObjects = [];
let chromosomeModel, chromatinFiberModel, chromatinModel, dnaModel, transcriptionModel;
let highlightedMeshes = [];

// --- MODEL GENERATION ---

// LEVEL 3: Metaphase Chromosome
function createChromosomeModel() {
    const model = new THREE.Group();
    const chromosomeInteractiveObjects = [];
    model.userData.interactiveObjects = chromosomeInteractiveObjects;

    const material = new THREE.MeshPhongMaterial({ color: 0xB06D7F, shininess: 40 });
    const centromereGeom = new THREE.SphereGeometry(20, 32, 16);
    const centromere = new THREE.Mesh(centromereGeom, material);
    model.add(centromere);

    const armPoints = [
        new THREE.Vector3(0, 15, 0), new THREE.Vector3(20, 70, 0), new THREE.Vector3(25, 130, 20),
        new THREE.Vector3(0, 15, 0), new THREE.Vector3(-20, 70, 0), new THREE.Vector3(-25, 130, -20),
        new THREE.Vector3(0, -15, 0), new THREE.Vector3(20, -70, 0), new THREE.Vector3(25, -130, -20),
        new THREE.Vector3(0, -15, 0), new THREE.Vector3(-20, -70, 0), new THREE.Vector3(-25, -130, 20)
    ];

    for (let i = 0; i < 4; i++) {
        const curve = new THREE.CatmullRomCurve3([armPoints[i*3], armPoints[i*3+1], armPoints[i*3+2]]);
        const points = curve.getPoints(30);
        for(let j=0; j < points.length; j += 3) { // Create clickable segments
            const segment = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 8), material.clone());
            segment.position.copy(points[j]);
            segment.userData = { name: `Chromatin Domain ${i*10 + j/3 + 1}`, type: 'chromosome_domain' };
            chromosomeInteractiveObjects.push(segment);
            model.add(segment);
        }
    }
    return model;
}

// LEVEL 2: Chromatin Fiber (30nm Solenoid)
function createChromatinFiberModel() {
    const model = new THREE.Group();
    const fiberInteractiveObjects = [];
    model.userData.interactiveObjects = fiberInteractiveObjects;

    const fiberRadius = 30, fiberHeight = 200, numTurns = 5, nucleosomesPerTurn = 6;
    const totalNucleosomes = numTurns * nucleosomesPerTurn;
    const nucleosomeGeom = new THREE.SphereGeometry(6, 16, 12); // Simplified nucleosome representation
    const nucleosomeMaterial = new THREE.MeshPhongMaterial({ color: 0x6E4D6E, shininess: 30 });

    for (let i = 0; i < totalNucleosomes; i++) {
        const angle = (i / nucleosomesPerTurn) * Math.PI * 2;
        const y = (i / totalNucleosomes - 0.5) * fiberHeight;
        const x = Math.cos(angle) * fiberRadius, z = Math.sin(angle) * fiberRadius;

        const nucleosomeProxy = new THREE.Mesh(nucleosomeGeom, nucleosomeMaterial.clone());
        nucleosomeProxy.position.set(x, y, z);
        nucleosomeProxy.userData = { name: `Nucleosome Cluster ${i + 1}`, type: 'fiber_cluster' };
        model.add(nucleosomeProxy);
        fiberInteractiveObjects.push(nucleosomeProxy);
    }
    return model;
}

// LEVEL 1: Chromatin (Nucleosomes)
function createChromatinModel() {
    const model = new THREE.Group();
    const dnaPathPoints = [];
    const nucleosomeCount = 10, histoneRadius = 8, dnaWraps = 1.65, nucleosomeRise = 10;
    const histoneGeom = new THREE.SphereGeometry(1, 32, 16);
    const histoneMaterial = new THREE.MeshPhongMaterial({ color: 0x8A6E99, shininess: 50 });
    const transcriptionComplexSite = 5;

    // Common vectors for DNA wrapping, to be used in the loop
    const histoneUp = new THREE.Vector3(0.2, 1, 0).normalize(), histoneSide = new THREE.Vector3(1, 0, 0.2).normalize();
    const histoneForward = new THREE.Vector3().crossVectors(histoneUp, histoneSide);
    const wrapTurns = dnaWraps * 2 * Math.PI;

    for (let i = 0; i < nucleosomeCount; i++) {
        const angle = i * 1.0, x = Math.cos(angle) * 30, y = i * nucleosomeRise, z = Math.sin(angle) * 30;
        const currentEntityPos = new THREE.Vector3(x, y, z);

        // --- Link to the previous DNA segment if it exists ---
        if (dnaPathPoints.length > 0) {
            const prevPoint = dnaPathPoints[dnaPathPoints.length - 1];
            let entryPoint;

            if (i === transcriptionComplexSite) {
                // For the transcription complex, we create a longer, straighter linker DNA.
                // The "entry point" is the center of where the complex will be.
                entryPoint = currentEntityPos;
            } else {
                // For a normal histone, the entry point is the start of its DNA wrap.
                const wrapStartAngle = -wrapTurns / 2;
                entryPoint = currentEntityPos.clone()
                    .add(histoneSide.clone().multiplyScalar(Math.cos(wrapStartAngle) * histoneRadius))
                    .add(histoneForward.clone().multiplyScalar(Math.sin(wrapStartAngle) * histoneRadius));
            }

            const controlPoint = new THREE.Vector3().lerpVectors(prevPoint, entryPoint, 0.5).add(new THREE.Vector3(0, -20, 0));
            const linkerPoints = new THREE.CatmullRomCurve3([prevPoint, controlPoint, entryPoint]).getPoints(20);
            dnaPathPoints.push(...linkerPoints.slice(1)); // slice(1) to avoid duplicating the connection point
        }

        // --- Add the current entity (Histone or Transcription Complex) and its DNA path ---
        if (i === transcriptionComplexSite) {
            // The DNA path just passes through the center of the complex site.
            // The linkers on either side create the 'open' DNA segment.
            if (dnaPathPoints.length === 0) { // Handle case where complex is first in chain
                dnaPathPoints.push(currentEntityPos);
            }

            // Add models for the complex, centered at this position.
            const polymeraseGeom = new THREE.SphereGeometry(10, 32, 16);
            const polymeraseMat = new THREE.MeshPhongMaterial({color: 0xE67E22, shininess: 80});
            const polymerase = new THREE.Mesh(polymeraseGeom, polymeraseMat);
            polymerase.position.copy(currentEntityPos).add(new THREE.Vector3(0, 5, 0));
            polymerase.scale.set(1, 1.3, 0.8);
            polymerase.userData = { name: 'RNA Polymerase', type: 'transcription_complex' };
            model.add(polymerase);
            
            const tfGeom = new THREE.SphereGeometry(3, 16, 12);
            const tfMat1 = new THREE.MeshPhongMaterial({color: 0x2980B9});
            const tfMat2 = new THREE.MeshPhongMaterial({color: 0x27AE60});

            const tf1 = new THREE.Mesh(tfGeom, tfMat1);
            tf1.position.copy(currentEntityPos).add(new THREE.Vector3(-12, -2, 3));
            tf1.userData = { name: 'General Transcription Factor', type: 'transcription_complex' };
            const tf2 = new THREE.Mesh(tfGeom, tfMat2);
            tf2.position.copy(currentEntityPos).add(new THREE.Vector3(12, -2, -3));
            tf2.userData = { name: 'General Transcription Factor', type: 'transcription_complex' };
            model.add(tf1, tf2);

        } else {
            // Add a normal histone protein complex.
            const histone = new THREE.Mesh(histoneGeom, histoneMaterial.clone());
            histone.scale.setScalar(histoneRadius);
            histone.position.copy(currentEntityPos);
            histone.userData = { name: 'Histone Protein Complex', type: 'histone' };
            model.add(histone);

            // Add the DNA points wrapping around the histone.
            const wrapPoints = [];
            for (let j = 0; j <= 60; j++) {
                const t = j / 60, wrapAngle = t * wrapTurns - wrapTurns / 2;
                const point = currentEntityPos.clone()
                    .add(histoneSide.clone().multiplyScalar(Math.cos(wrapAngle) * histoneRadius))
                    .add(histoneForward.clone().multiplyScalar(Math.sin(wrapAngle) * histoneRadius));
                wrapPoints.push(point);
            }
            
            // If we created a linker, we've already added the entry point.
            if (dnaPathPoints.length > 0) {
                 dnaPathPoints.push(...wrapPoints.slice(1));
            } else {
                 dnaPathPoints.push(...wrapPoints);
            }
        }
    }
    const dnaCurve = new THREE.CatmullRomCurve3(dnaPathPoints);
    const dnaTube = new THREE.Mesh(new THREE.TubeGeometry(dnaCurve, dnaPathPoints.length * 2, 0.5, 8), new THREE.MeshPhongMaterial({ color: 0x0952A2 }));
    model.add(dnaTube);
    return model;
}

// LEVEL 0 - Transcription Animation
function createTranscribingDnaModel() {
    const model = new THREE.Group();
    const dnaInteractiveObjects = [];
    model.userData.interactiveObjects = dnaInteractiveObjects;
    
    // Most of this is similar to createDnaModel, but with additions for transcription
    const materials = {
        A: new THREE.MeshPhongMaterial({ name: 'Adenine', color: 0x0952A2 }), T: new THREE.MeshPhongMaterial({ name: 'Thymine', color: 0xDB4D56 }),
        G: new THREE.MeshPhongMaterial({ name: 'Guanine', color: 0x59A651 }), C: new THREE.MeshPhongMaterial({ name: 'Cytosine', color: 0xF2D670 }),
        SUGAR: new THREE.MeshPhongMaterial({ name: 'Deoxyribose Sugar', color: 0x8A6E99 }), PHOSPHATE: new THREE.MeshPhongMaterial({ name: 'Phosphate Group', color: 0xF5A623 }),
        H_BOND: new THREE.MeshPhongMaterial({ color: 0xEEEEEE, shininess: 100 }),
        RNA_URACIL: new THREE.MeshPhongMaterial({ color: 0x9B59B6 }) // Uracil for RNA
    };
    const basePairs = 40, helixRadius = 8, basePairSpacing = 3.4;

    // Generate the DNA strand that will be transcribed
    const dnaStrandPath = new THREE.CatmullRomCurve3(
        Array.from({ length: basePairs }, (_, i) => new THREE.Vector3(0, (i - basePairs / 2) * basePairSpacing, 0))
    );
    model.userData.dnaStrandPath = dnaStrandPath;

    // Simplified DNA representation for this scene
    const dnaGeom1 = new THREE.TubeGeometry(dnaStrandPath, 128, 0.4, 8);
    const dnaMesh1 = new THREE.Mesh(dnaGeom1, materials.SUGAR);
    dnaMesh1.position.x = -helixRadius;
    const dnaMesh2 = new THREE.Mesh(dnaGeom1.clone(), materials.PHOSPHATE);
    dnaMesh2.position.x = helixRadius;
    model.add(dnaMesh1, dnaMesh2);

    // Rungs (base pairs)
    for (let i = 0; i < basePairs; i++) {
        const yPos = (i - basePairs / 2) * basePairSpacing;
        const rungGeom = new THREE.CylinderGeometry(0.2, 0.2, helixRadius * 2);
        const rung = new THREE.Mesh(rungGeom, materials.H_BOND);
        rung.position.y = yPos;
        rung.rotation.z = Math.PI / 2;
        model.add(rung);
    }

    // Add RNA Polymerase
    const polymeraseGeom = new THREE.SphereGeometry(12, 32, 16);
    const polymeraseMat = new THREE.MeshPhongMaterial({ color: 0xE67E22, shininess: 80, transparent: true, opacity: 0.8 });
    const polymerase = new THREE.Mesh(polymeraseGeom, polymeraseMat);
    polymerase.scale.set(1.2, 1, 0.8);
    polymerase.userData = { name: 'RNA Polymerase', type: 'transcription_enzyme' };
    model.add(polymerase);
    dnaInteractiveObjects.push(polymerase);
    model.userData.polymerase = polymerase;

    // Add emerging RNA strand
    const rnaPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, -5, 5)];
    const rnaCurve = new THREE.CatmullRomCurve3(rnaPoints);
    const rnaGeom = new THREE.TubeGeometry(rnaCurve, 8, 0.3, 8);
    const rnaStrand = new THREE.Mesh(rnaGeom, materials.RNA_URACIL);
    rnaStrand.userData = { name: 'Emerging RNA Strand', type: 'transcription_product' };
    model.add(rnaStrand);
    dnaInteractiveObjects.push(rnaStrand);
    model.userData.rnaStrand = rnaStrand;
    model.userData.rnaPoints = rnaPoints;

    // Animation state
    model.userData.transcriptionProgress = 0; // Goes from 0 to 1

    return model;
}

// LEVEL 0: Detailed DNA Strand
function createDnaModel() {
    const model = new THREE.Group();
    const dnaInteractiveObjects = [];
    model.userData.interactiveObjects = dnaInteractiveObjects;
    
    const atomData = {
        'Adenine': 'C, H, N', 'Guanine': 'C, H, N, O', 'Cytosine': 'C, H, N, O',
        'Thymine': 'C, H, N, O', 'Deoxyribose Sugar': 'C, H, O', 'Phosphate Group': 'P, O',
    };
    model.userData.atomData = atomData;

    const materials = {
        A: new THREE.MeshPhongMaterial({ name: 'Adenine', color: 0x0952A2 }), T: new THREE.MeshPhongMaterial({ name: 'Thymine', color: 0xDB4D56 }),
        G: new THREE.MeshPhongMaterial({ name: 'Guanine', color: 0x59A651 }), C: new THREE.MeshPhongMaterial({ name: 'Cytosine', color: 0xF2D670 }),
        SUGAR: new THREE.MeshPhongMaterial({ name: 'Deoxyribose Sugar', color: 0x8A6E99 }), PHOSPHATE: new THREE.MeshPhongMaterial({ name: 'Phosphate Group', color: 0xF5A623 }),
        H_BOND: new THREE.MeshPhongMaterial({ color: 0xEEEEEE, shininess: 100 })
    };
    const purineGeom = new THREE.BoxGeometry(3.0, 1, 1.5), pyrimidineGeom = new THREE.BoxGeometry(2.2, 1, 1.5);
    const sugarGeom = new THREE.IcosahedronGeometry(0.8), phosphateGeom = new THREE.SphereGeometry(0.5);
    const hBondGeom = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    
    let nucleotideIdCounter = 0;
    const basePairs = 20, helixRadius = 8, basePairSpacing = 3.4;
    const sugarPositions = [[], []];

    for (let i = 0; i < basePairs; i++) {
        const yPos = (i - basePairs / 2) * basePairSpacing;
        const angle = i * THREE.MathUtils.degToRad(36);
        const p1 = new THREE.Vector3(helixRadius * Math.cos(angle), yPos, helixRadius * Math.sin(angle));
        const sugar1 = new THREE.Mesh(sugarGeom, materials.SUGAR.clone());
        sugar1.position.copy(p1);
        sugar1.userData = { name: materials.SUGAR.name, nucleotideId: nucleotideIdCounter, type: 'dna_component' };
        sugarPositions[0].push(p1);
        const p2 = new THREE.Vector3(helixRadius * Math.cos(angle + Math.PI), yPos, helixRadius * Math.sin(angle + Math.PI));
        const sugar2 = new THREE.Mesh(sugarGeom, materials.SUGAR.clone());
        sugar2.position.copy(p2);
        sugar2.userData = { name: materials.SUGAR.name, nucleotideId: nucleotideIdCounter + 1, type: 'dna_component' };
        sugarPositions[1].push(p2);

        let base1, base2, numHBonds;
        if (Math.random() > 0.5) {
            base1 = new THREE.Mesh(purineGeom, materials.A.clone());
            base1.userData = { name: materials.A.name, nucleotideId: nucleotideIdCounter, type: 'dna_component' };
            base2 = new THREE.Mesh(pyrimidineGeom, materials.T.clone());
            base2.userData = { name: materials.T.name, nucleotideId: nucleotideIdCounter + 1, type: 'dna_component' };
            numHBonds = 2;
        } else {
            base1 = new THREE.Mesh(purineGeom, materials.G.clone());
            base1.userData = { name: materials.G.name, nucleotideId: nucleotideIdCounter, type: 'dna_component' };
            base2 = new THREE.Mesh(pyrimidineGeom, materials.C.clone());
            base2.userData = { name: materials.C.name, nucleotideId: nucleotideIdCounter + 1, type: 'dna_component' };
            numHBonds = 3;
        }
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        base1.position.copy(p1).lerp(midPoint, 0.4);
        base1.lookAt(p2);
        base2.position.copy(p2).lerp(midPoint, 0.4);
        base2.lookAt(p1);
        model.add(sugar1, base1, sugar2, base2);
        dnaInteractiveObjects.push(sugar1, base1, sugar2, base2);

        const bondVec = new THREE.Vector3().subVectors(base2.position, base1.position);
        for(let j=0; j < numHBonds; j++) {
            const hBond = new THREE.Mesh(hBondGeom, materials.H_BOND.clone());
            const offset = new THREE.Vector3(0, (j - (numHBonds - 1) / 2) * 0.4, 0);
            hBond.position.copy(base1.position).lerp(base2.position, 0.5).add(offset);
            hBond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bondVec.clone().normalize());
            hBond.scale.y = bondVec.length();
            hBond.userData = { name: 'Hydrogen Bond', type: 'dna_component' };
            dnaInteractiveObjects.push(hBond);
            model.add(hBond);
        }
        nucleotideIdCounter += 2;
    }
    for (let strand = 0; strand < 2; strand++) {
        for (let i = 0; i < basePairs - 1; i++) {
            const phosphate = new THREE.Mesh(phosphateGeom, materials.PHOSPHATE.clone());
            phosphate.position.copy(sugarPositions[strand][i]).lerp(sugarPositions[strand][i+1], 0.5);
            phosphate.userData = { name: 'Phosphate Group', nucleotideId: i * 2 + strand, type: 'dna_component' };
            dnaInteractiveObjects.push(phosphate);
            model.add(phosphate);
        }
    }
    return model;
}

// --- INTERACTION & VIEW MANAGEMENT ---
function switchToDnaView(target) {
    currentView = 'dna';
    if (chromatinModel) chromatinModel.visible = false;
    if (!dnaModel) {
        dnaModel = createDnaModel();
        scene.add(dnaModel);
    }
    // Calculate world position
    const worldPosition = new THREE.Vector3();
    target.getWorldPosition(worldPosition);
    dnaModel.position.copy(worldPosition);

    dnaModel.visible = true;
    zoomOutBtn.innerText = 'Zoom Out to Nucleosomes';
    zoomOutBtn.style.display = 'block';
    controls.target.copy(dnaModel.position);
    camera.position.copy(dnaModel.position).add(new THREE.Vector3(0, 0, 70));
    interactiveObjects = dnaModel.userData.interactiveObjects;
}

function switchToChromatinView(target) {
    currentView = 'chromatin';
    if (chromatinFiberModel) chromatinFiberModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (!chromatinModel) {
        chromatinModel = createChromatinModel();
        scene.add(chromatinModel);
    }
    chromatinModel.visible = true;
    // Calculate world position
    const worldPosition = new THREE.Vector3();
    target.getWorldPosition(worldPosition);
    chromatinModel.position.copy(worldPosition);

    zoomOutBtn.innerText = 'Zoom Out to Chromatin Fiber';
    zoomOutBtn.style.display = 'block';
    // Adjust camera relative to new position
    const targetPos = new THREE.Vector3();
    chromatinModel.getWorldPosition(targetPos).add(new THREE.Vector3(0, 45, 0));
    controls.target.copy(targetPos);
    camera.position.copy(targetPos).add(new THREE.Vector3(0, 5, 200));
    interactiveObjects = chromatinModel.children.filter(c => c.userData.type === 'histone' || c.userData.type === 'transcription_complex');
}

function switchToChromatinFiberView(target) {
    currentView = 'chromatinFiber';
    if (chromosomeModel) chromosomeModel.visible = false;
    if (chromatinModel) chromatinModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (transcriptionModel) transcriptionModel.visible = false;
    if (!chromatinFiberModel) {
        chromatinFiberModel = createChromatinFiberModel();
        scene.add(chromatinFiberModel);
    }
    chromatinFiberModel.visible = true;
    
    if (target) {
        const worldPosition = new THREE.Vector3();
        target.getWorldPosition(worldPosition);
        chromatinFiberModel.position.copy(worldPosition);
    }

    zoomOutBtn.innerText = 'Zoom Out to Chromosome';
    zoomOutBtn.style.display = 'block';
    const targetPos = new THREE.Vector3();
    chromatinFiberModel.getWorldPosition(targetPos);
    controls.target.copy(targetPos);
    camera.position.copy(targetPos).add(new THREE.Vector3(0, 0, 400));
    interactiveObjects = chromatinFiberModel.userData.interactiveObjects;
}

function switchToChromosomeView() {
    currentView = 'chromosome';
    if (chromatinFiberModel) chromatinFiberModel.visible = false;
    if (!chromosomeModel) {
        chromosomeModel = createChromosomeModel();
        scene.add(chromosomeModel);
    }
    chromosomeModel.visible = true;
    zoomOutBtn.style.display = 'none';
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, 550); // Zoom out even more
    interactiveObjects = chromosomeModel.userData.interactiveObjects;
}

function switchToTranscriptionView(target) {
    currentView = 'transcription';
    if (chromatinModel) chromatinModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (!transcriptionModel) {
        transcriptionModel = createTranscribingDnaModel();
        scene.add(transcriptionModel);
    }
    // Calculate world position to place the animation
    const worldPosition = new THREE.Vector3();
    target.getWorldPosition(worldPosition);
    transcriptionModel.position.copy(worldPosition);

    transcriptionModel.visible = true;
    transcriptionModel.userData.transcriptionProgress = 0; // Reset animation
    
    zoomOutBtn.innerText = 'Zoom Out to Nucleosomes';
    zoomOutBtn.style.display = 'block';
    controls.target.copy(transcriptionModel.position);
    camera.position.copy(transcriptionModel.position).add(new THREE.Vector3(50, 0, 80));
    interactiveObjects = transcriptionModel.userData.interactiveObjects;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let highlightedMesh = null;
window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Move label with mouse
    label.style.left = `${e.clientX + 15}px`;
    label.style.top = `${e.clientY}px`;
});
window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);
    if (intersects.length === 0) return;

    const clickedObject = intersects[0].object;

    switch (currentView) {
        case 'chromosome':
            switchToChromatinFiberView(clickedObject);
            break;
        case 'chromatinFiber':
            switchToChromatinView(clickedObject);
            break;
        case 'chromatin':
            if (clickedObject.userData.type === 'histone' || clickedObject.userData.type === 'transcription_complex') {
                switchToDnaView(clickedObject);
            }
            break;
        case 'transcription':
            if (clickedObject.userData.type === 'transcription_enzyme' || clickedObject.userData.type === 'transcription_product') {
                switchToTranscriptionView(clickedObject);
            }
            break;
    }
});
zoomOutBtn.addEventListener('click', () => {
    switch (currentView) {
        case 'dna':
        case 'transcription':
            switchToChromatinView(chromatinFiberModel); // Pass a dummy target
            break;
        case 'chromatin':
            switchToChromatinFiberView(chromosomeModel); // Pass a dummy target
            break;
        case 'chromatinFiber':
            switchToChromosomeView();
            break;
    }
});

// --- MAIN ---
switchToChromosomeView();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    highlightedMeshes.forEach(m => m.material.emissive.setHex(0x000000));
    highlightedMeshes = [];
    if (highlightedMesh) {
        highlightedMesh.material.emissive.setHex(0x000000);
        highlightedMesh = null;
    }
    label.style.display = 'none';
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
        const primaryHoveredObj = intersects[0].object;
        const userData = primaryHoveredObj.userData;
        
        switch (currentView) {
            case 'chromosome':
                if (userData.type === 'chromosome_domain') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    label.innerText = userData.name;
                    label.style.display = 'block';
                }
                break;
            case 'chromatinFiber':
                if (userData.type === 'fiber_cluster') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    label.innerText = userData.name;
                    label.style.display = 'block';
                }
                break;
            case 'chromatin':
                if (userData.type === 'histone' || userData.type === 'transcription_complex') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    let labelText = userData.name;
                    if(userData.type === 'transcription_complex') {
                        labelText += " (Click to see transcription)"
                    }
                    label.innerText = labelText;
                    label.style.display = 'block';
                }
                break;
            case 'dna':
                if (userData.type === 'dna_component') {
                    if (userData.nucleotideId !== undefined) {
                        const nucleotideId = userData.nucleotideId;
                        const atomData = dnaModel.userData.atomData;
                        const nucleotideParts = interactiveObjects.filter(m => m.userData.nucleotideId === nucleotideId);
                        nucleotideParts.forEach(m => m.material.emissive.setHex(0x555555));
                        highlightedMeshes = nucleotideParts;

                        const primaryName = userData.name;
                        let labelText = `HOVERING: ★ ${primaryName}\n(Atoms: ${atomData[primaryName]})\n\n--- FULL NUCLEOTIDE ---`;
                        nucleotideParts.forEach(mesh => {
                            if (mesh.userData.name !== 'Hydrogen Bond') labelText += `\n• ${mesh.userData.name}`;
                        });
                        label.innerText = labelText;
                        label.style.display = 'block';
                    } else { // Hydrogen bond
                        highlightedMesh = primaryHoveredObj;
                        highlightedMesh.material.emissive.setHex(0xaaaaaa);
                        label.innerText = userData.name;
                        label.style.display = 'block';
                    }
                }
                break;
            case 'transcription':
                if (userData.type === 'transcription_enzyme' || userData.type === 'transcription_product') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    label.innerText = userData.name;
                    label.style.display = 'block';
                }
                break;
        }
    }

    if (chromosomeModel && chromosomeModel.visible) chromosomeModel.rotation.y += 0.0003;
    if (chromatinFiberModel && chromatinFiberModel.visible) chromatinFiberModel.rotation.y += 0.0005;
    if (chromatinModel && chromatinModel.visible) chromatinModel.rotation.y += 0.001;
    if (dnaModel && dnaModel.visible) dnaModel.rotation.y += 0.005;
    
    // --- Transcription Animation ---
    if (transcriptionModel && transcriptionModel.visible) {
        const data = transcriptionModel.userData;
        data.transcriptionProgress = (data.transcriptionProgress + 0.001) % 1.0;
        
        // Move polymerase along the DNA path
        const polymerasePos = data.dnaStrandPath.getPointAt(data.transcriptionProgress);
        data.polymerase.position.copy(polymerasePos);

        // Grow the RNA strand
        const rnaPointCount = data.rnaPoints.length;
        const lastRnaPoint = data.rnaPoints[rnaPointCount - 1];
        
        // Add a new point if the polymerase has moved far enough
        const newRnaPoint = polymerasePos.clone().add(new THREE.Vector3(15, -rnaPointCount * 0.5, 0));
        if (newRnaPoint.distanceTo(lastRnaPoint) > 1.0) {
            data.rnaPoints.push(newRnaPoint);
            if (data.rnaPoints.length > 30) data.rnaPoints.shift(); // Keep it from getting too long
        }

        // Update the RNA tube geometry
        const oldRnaGeom = data.rnaStrand.geometry;
        data.rnaStrand.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(data.rnaPoints), 32, 0.3, 8);
        oldRnaGeom.dispose(); // Clean up old geometry
    }
    
    renderer.render(scene, camera);
}

animate(); 