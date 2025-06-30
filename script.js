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
const modal = document.getElementById('component-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('component-diagram');
const modalDescription = document.getElementById('component-description');
const closeBtn = document.querySelector('.close');

let currentView = 'cell'; // 'cell', 'nucleus', 'chromosome', 'chromatinFiber', 'chromatin', 'dna', or 'transcription'
let interactiveObjects = [];
let cellModel, nucleusModel, chromosomeModel, chromatinFiberModel, chromatinModel, dnaModel, transcriptionModel;
let highlightedMeshes = [];

// Modal functionality
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Component diagram data
const componentDiagrams = {
    // Cell Level Components
    'cell_membrane': {
        title: 'Cell Membrane',
        diagram: createCellMembraneDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Selective Permeability:</strong> Controls what enters and exits the cell</li>
                    <li><strong>Protection:</strong> Provides structural support and protection</li>
                    <li><strong>Cell Signaling:</strong> Contains receptors for communication</li>
                    <li><strong>Transport:</strong> Facilitates active and passive transport</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Phospholipid Bilayer:</strong> Double layer of phospholipids</li>
                    <li><strong>Proteins:</strong> Integral and peripheral membrane proteins</li>
                    <li><strong>Cholesterol:</strong> Maintains membrane fluidity</li>
                    <li><strong>Carbohydrates:</strong> Glycoproteins and glycolipids for recognition</li>
                </ul>
            </div>
        `
    },
    'mitochondria': {
        title: 'Mitochondria',
        diagram: createMitochondriaDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>ATP Production:</strong> Generates cellular energy through oxidative phosphorylation</li>
                    <li><strong>Cellular Respiration:</strong> Breaks down glucose and other molecules</li>
                    <li><strong>Heat Production:</strong> Generates heat as a byproduct</li>
                    <li><strong>Apoptosis:</strong> Regulates programmed cell death</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Outer Membrane:</strong> Smooth outer boundary</li>
                    <li><strong>Inner Membrane:</strong> Folded cristae for increased surface area</li>
                    <li><strong>Matrix:</strong> Contains enzymes for Krebs cycle</li>
                    <li><strong>Intermembrane Space:</strong> Site of proton gradient</li>
                </ul>
            </div>
        `
    },
    'endoplasmic_reticulum': {
        title: 'Endoplasmic Reticulum',
        diagram: createERDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Protein Synthesis:</strong> Rough ER produces proteins</li>
                    <li><strong>Lipid Synthesis:</strong> Smooth ER produces lipids</li>
                    <li><strong>Detoxification:</strong> Breaks down toxins and drugs</li>
                    <li><strong>Calcium Storage:</strong> Regulates calcium levels</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Types:</h4>
                <ul>
                    <li><strong>Rough ER:</strong> Covered with ribosomes for protein synthesis</li>
                    <li><strong>Smooth ER:</strong> No ribosomes, involved in lipid metabolism</li>
                </ul>
            </div>
        `
    },
    'golgi_apparatus': {
        title: 'Golgi Apparatus',
        diagram: createGolgiDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Protein Processing:</strong> Modifies and packages proteins</li>
                    <li><strong>Glycosylation:</strong> Adds carbohydrate groups to proteins</li>
                    <li><strong>Vesicle Formation:</strong> Creates transport vesicles</li>
                    <li><strong>Secretion:</strong> Releases processed molecules</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Cis Face:</strong> Receives vesicles from ER</li>
                    <li><strong>Medial Cisternae:</strong> Processing and modification</li>
                    <li><strong>Trans Face:</strong> Releases processed vesicles</li>
                </ul>
            </div>
        `
    },
    'lysosome': {
        title: 'Lysosome',
        diagram: createLysosomeDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Digestion:</strong> Breaks down cellular waste and debris</li>
                    <li><strong>Autophagy:</strong> Recycles damaged organelles</li>
                    <li><strong>Pathogen Destruction:</strong> Kills bacteria and viruses</li>
                    <li><strong>Apoptosis:</strong> Aids in programmed cell death</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Enzymes:</h4>
                <ul>
                    <li><strong>Hydrolases:</strong> Break down macromolecules</li>
                    <li><strong>Proteases:</strong> Digest proteins</li>
                    <li><strong>Lipases:</strong> Break down lipids</li>
                    <li><strong>Nucleases:</strong> Digest nucleic acids</li>
                </ul>
            </div>
        `
    },
    'ribosome': {
        title: 'Ribosome',
        diagram: createRibosomeDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Protein Synthesis:</strong> Translates mRNA into proteins</li>
                    <li><strong>Translation:</strong> Reads genetic code and builds polypeptides</li>
                    <li><strong>Quality Control:</strong> Ensures proper protein folding</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Large Subunit:</strong> Contains peptidyl transferase activity</li>
                    <li><strong>Small Subunit:</strong> Binds mRNA and tRNA</li>
                    <li><strong>A, P, E Sites:</strong> Binding sites for tRNA molecules</li>
                </ul>
            </div>
        `
    },
    'peroxisome': {
        title: 'Peroxisome',
        diagram: createPeroxisomeDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Detoxification:</strong> Breaks down hydrogen peroxide</li>
                    <li><strong>Fatty Acid Oxidation:</strong> Breaks down long-chain fatty acids</li>
                    <li><strong>Bile Acid Synthesis:</strong> Produces bile acids in liver</li>
                    <li><strong>Plasmalogen Synthesis:</strong> Produces phospholipids</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Enzymes:</h4>
                <ul>
                    <li><strong>Catalase:</strong> Breaks down hydrogen peroxide</li>
                    <li><strong>Oxidases:</strong> Produce hydrogen peroxide</li>
                    <li><strong>Peroxidases:</strong> Use hydrogen peroxide for oxidation</li>
                </ul>
            </div>
        `
    },
    'vesicle': {
        title: 'Vesicle',
        diagram: createVesicleDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Transport:</strong> Moves materials within the cell</li>
                    <li><strong>Secretion:</strong> Releases materials outside the cell</li>
                    <li><strong>Storage:</strong> Stores cellular materials</li>
                    <li><strong>Endocytosis:</strong> Brings materials into the cell</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Types:</h4>
                <ul>
                    <li><strong>Secretory Vesicles:</strong> Release hormones and enzymes</li>
                    <li><strong>Transport Vesicles:</strong> Move materials between organelles</li>
                    <li><strong>Storage Vesicles:</strong> Store nutrients and waste</li>
                </ul>
            </div>
        `
    },
    'cytoskeleton': {
        title: 'Cytoskeleton',
        diagram: createCytoskeletonDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Structural Support:</strong> Maintains cell shape</li>
                    <li><strong>Cell Movement:</strong> Enables cell motility</li>
                    <li><strong>Organelle Transport:</strong> Moves organelles within cell</li>
                    <li><strong>Cell Division:</strong> Forms mitotic spindle</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Components:</h4>
                <ul>
                    <li><strong>Microtubules:</strong> Largest filaments, form mitotic spindle</li>
                    <li><strong>Microfilaments:</strong> Actin filaments for cell movement</li>
                    <li><strong>Intermediate Filaments:</strong> Provide structural support</li>
                </ul>
            </div>
        `
    },
    // Nucleus Level Components
    'nuclear_membrane': {
        title: 'Nuclear Membrane',
        diagram: createNuclearMembraneDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Nuclear Envelope:</strong> Separates nucleus from cytoplasm</li>
                    <li><strong>Selective Transport:</strong> Controls nuclear-cytoplasmic exchange</li>
                    <li><strong>Gene Regulation:</strong> Influences gene expression</li>
                    <li><strong>Structural Support:</strong> Maintains nuclear structure</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Outer Membrane:</strong> Continuous with ER</li>
                    <li><strong>Inner Membrane:</strong> Contains nuclear lamina</li>
                    <li><strong>Nuclear Pores:</strong> Allow selective transport</li>
                    <li><strong>Perinuclear Space:</strong> Space between membranes</li>
                </ul>
            </div>
        `
    },
    'nucleolus': {
        title: 'Nucleolus',
        diagram: createNucleolusDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Ribosome Assembly:</strong> Produces ribosomal subunits</li>
                    <li><strong>rRNA Synthesis:</strong> Transcribes ribosomal RNA</li>
                    <li><strong>Protein Processing:</strong> Processes ribosomal proteins</li>
                    <li><strong>Stress Response:</strong> Responds to cellular stress</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Fibrillar Center:</strong> Contains rDNA</li>
                    <li><strong>Dense Fibrillar Component:</strong> rRNA processing</li>
                    <li><strong>Granular Component:</strong> Ribosome assembly</li>
                </ul>
            </div>
        `
    },
    'nuclear_pore': {
        title: 'Nuclear Pore',
        diagram: createNuclearPoreDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Selective Transport:</strong> Controls nuclear-cytoplasmic exchange</li>
                    <li><strong>mRNA Export:</strong> Exports processed mRNA</li>
                    <li><strong>Protein Import:</strong> Imports nuclear proteins</li>
                    <li><strong>Signal Recognition:</strong> Recognizes nuclear localization signals</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Nuclear Pore Complex:</strong> Large protein complex</li>
                    <li><strong>Central Channel:</strong> Allows passive diffusion</li>
                    <li><strong>Nuclear Basket:</strong> Nuclear side structure</li>
                    <li><strong>Cytoplasmic Filaments:</strong> Cytoplasmic side structure</li>
                </ul>
            </div>
        `
    },
    'chromatin_territory': {
        title: 'Chromatin Territory',
        diagram: createChromatinTerritoryDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Gene Organization:</strong> Organizes genes in 3D space</li>
                    <li><strong>Transcription Regulation:</strong> Influences gene expression</li>
                    <li><strong>Chromosome Structure:</strong> Maintains chromosome integrity</li>
                    <li><strong>DNA Replication:</strong> Coordinates DNA replication</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Euchromatin:</strong> Active, loosely packed regions</li>
                    <li><strong>Heterochromatin:</strong> Inactive, densely packed regions</li>
                    <li><strong>Chromosome Loops:</strong> 3D organization of DNA</li>
                    <li><strong>Nuclear Matrix:</strong> Scaffold for organization</li>
                </ul>
            </div>
        `
    },
    // Chromosome Level Components
    'chromosome_domain': {
        title: 'Chromosome Domain',
        diagram: createChromosomeDomainDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Gene Clustering:</strong> Groups related genes together</li>
                    <li><strong>Transcription Control:</strong> Regulates gene expression</li>
                    <li><strong>DNA Replication:</strong> Coordinates replication timing</li>
                    <li><strong>Chromosome Structure:</strong> Maintains chromosome integrity</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Topologically Associating Domains (TADs):</strong> Self-interacting regions</li>
                    <li><strong>Insulator Elements:</strong> Boundary elements</li>
                    <li><strong>Enhancer-Promoter Loops:</strong> Gene regulation loops</li>
                    <li><strong>Cohesin Complexes:</strong> Maintain loop structure</li>
                </ul>
            </div>
        `
    },
    // Chromatin Fiber Level Components
    'fiber_cluster': {
        title: 'Nucleosome Cluster',
        diagram: createNucleosomeClusterDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>DNA Packaging:</strong> Compacts DNA 7-fold</li>
                    <li><strong>Gene Regulation:</strong> Controls access to DNA</li>
                    <li><strong>Chromatin Structure:</strong> Forms 30nm fiber</li>
                    <li><strong>Transcription Control:</strong> Regulates RNA polymerase access</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Histone Octamer:</strong> 8 histone proteins</li>
                    <li><strong>DNA Wrapping:</strong> 147 bp of DNA wrapped 1.65 times</li>
                    <li><strong>Linker DNA:</strong> 20-80 bp between nucleosomes</li>
                    <li><strong>Histone Tails:</strong> Sites for modifications</li>
                </ul>
            </div>
        `
    },
    // Chromatin Level Components
    'histone': {
        title: 'Histone Protein Complex',
        diagram: createHistoneDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>DNA Packaging:</strong> Wraps and compacts DNA</li>
                    <li><strong>Gene Regulation:</strong> Controls gene expression</li>
                    <li><strong>Chromatin Structure:</strong> Forms nucleosome core</li>
                    <li><strong>Epigenetic Marks:</strong> Carries epigenetic modifications</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Histone Types:</h4>
                <ul>
                    <li><strong>H2A, H2B, H3, H4:</strong> Core histones in octamer</li>
                    <li><strong>H1:</strong> Linker histone</li>
                    <li><strong>Histone Variants:</strong> Specialized histones</li>
                </ul>
            </div>
        `
    },
    'transcription_complex': {
        title: 'Transcription Complex',
        diagram: createTranscriptionComplexDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>RNA Synthesis:</strong> Transcribes DNA to RNA</li>
                    <li><strong>Gene Expression:</strong> Controls protein production</li>
                    <li><strong>Promoter Recognition:</strong> Binds to gene promoters</li>
                    <li><strong>Transcription Regulation:</strong> Responds to signals</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Components:</h4>
                <ul>
                    <li><strong>RNA Polymerase II:</strong> Main transcription enzyme</li>
                    <li><strong>General Transcription Factors:</strong> Required for initiation</li>
                    <li><strong>Mediator Complex:</strong> Links to regulatory proteins</li>
                    <li><strong>Elongation Factors:</strong> Aid in transcription elongation</li>
                </ul>
            </div>
        `
    },
    // DNA Level Components
    'dna_component': {
        title: 'DNA Component',
        diagram: createDNAComponentDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Genetic Information:</strong> Stores genetic code</li>
                    <li><strong>Protein Synthesis:</strong> Template for protein production</li>
                    <li><strong>Inheritance:</strong> Passes genetic information</li>
                    <li><strong>Gene Regulation:</strong> Controls gene expression</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Structure:</h4>
                <ul>
                    <li><strong>Double Helix:</strong> Two complementary strands</li>
                    <li><strong>Base Pairs:</strong> A-T and G-C hydrogen bonding</li>
                    <li><strong>Sugar-Phosphate Backbone:</strong> Structural framework</li>
                    <li><strong>Major/Minor Grooves:</strong> Protein binding sites</li>
                </ul>
            </div>
        `
    },
    // Transcription Level Components
    'transcription_enzyme': {
        title: 'RNA Polymerase',
        diagram: createRNAPolymeraseDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>RNA Synthesis:</strong> Transcribes DNA to RNA</li>
                    <li><strong>Promoter Recognition:</strong> Binds to gene promoters</li>
                    <li><strong>Transcription Initiation:</strong> Starts RNA synthesis</li>
                    <li><strong>Transcription Elongation:</strong> Extends RNA chain</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Mechanism:</h4>
                <ul>
                    <li><strong>Template Strand:</strong> Reads DNA template</li>
                    <li><strong>NTP Addition:</strong> Adds nucleotides to growing RNA</li>
                    <li><strong>Proofreading:</strong> Corrects transcription errors</li>
                    <li><strong>Termination:</strong> Stops at termination signals</li>
                </ul>
            </div>
        `
    },
    'transcription_product': {
        title: 'RNA Strand',
        diagram: createRNAStrandDiagram(),
        description: `
            <div class="component-function">
                <h4>Primary Functions:</h4>
                <ul>
                    <li><strong>Protein Synthesis:</strong> Template for translation</li>
                    <li><strong>Gene Expression:</strong> Carries genetic information</li>
                    <li><strong>Regulation:</strong> Controls gene expression</li>
                    <li><strong>Processing:</strong> Undergoes splicing and modification</li>
                </ul>
            </div>
            <div class="component-function">
                <h4>Types:</h4>
                <ul>
                    <li><strong>mRNA:</strong> Messenger RNA for protein synthesis</li>
                    <li><strong>tRNA:</strong> Transfer RNA for amino acid delivery</li>
                    <li><strong>rRNA:</strong> Ribosomal RNA for ribosome structure</li>
                    <li><strong>snRNA:</strong> Small nuclear RNA for splicing</li>
                </ul>
            </div>
        `
    }
};

function showComponentDetails(componentType, componentName) {
    const component = componentDiagrams[componentType];
    if (component) {
        modalTitle.textContent = component.title;
        modalBody.innerHTML = component.diagram;
        modalDescription.innerHTML = component.description;
        modal.style.display = 'block';
    }
}

// --- MODEL GENERATION ---

// LEVEL 6: Cell Membrane and Cytoplasm
function createCellModel() {
    const model = new THREE.Group();
    const cellInteractiveObjects = [];
    model.userData.interactiveObjects = cellInteractiveObjects;

    // Cell membrane (outer boundary)
    const cellRadius = 200;
    const membraneGeom = new THREE.SphereGeometry(cellRadius, 32, 16);
    const membraneMat = new THREE.MeshPhongMaterial({ 
        color: 0x4CAF50, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const membrane = new THREE.Mesh(membraneGeom, membraneMat);
    membrane.userData = { name: 'Cell Membrane', type: 'cell_membrane' };
    cellInteractiveObjects.push(membrane);
    model.add(membrane);

    // Cytoplasm (inner fluid)
    const cytoplasmGeom = new THREE.SphereGeometry(cellRadius - 5, 32, 16);
    const cytoplasmMat = new THREE.MeshPhongMaterial({ 
        color: 0x81C784, 
        transparent: true, 
        opacity: 0.2 
    });
    const cytoplasm = new THREE.Mesh(cytoplasmGeom, cytoplasmMat);
    cytoplasm.userData = { name: 'Cytoplasm', type: 'cytoplasm' };
    model.add(cytoplasm);

    // Mitochondria
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 60;
        const z = Math.sin(angle) * radius;
        
        const mitoGeom = new THREE.SphereGeometry(8 + Math.random() * 4, 16, 12);
        const mitoMat = new THREE.MeshPhongMaterial({ color: 0xFF9800, shininess: 30 });
        const mito = new THREE.Mesh(mitoGeom, mitoMat);
        mito.position.set(x, y, z);
        mito.userData = { name: `Mitochondria ${i + 1}`, type: 'mitochondria' };
        cellInteractiveObjects.push(mito);
        model.add(mito);
    }

    // Endoplasmic Reticulum
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 60 + Math.random() * 30;
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 40;
        const z = Math.sin(angle) * radius;
        
        const erGeom = new THREE.SphereGeometry(6 + Math.random() * 3, 12, 8);
        const erMat = new THREE.MeshPhongMaterial({ color: 0x9C27B0, shininess: 40 });
        const er = new THREE.Mesh(erGeom, erMat);
        er.position.set(x, y, z);
        er.userData = { name: `Endoplasmic Reticulum ${i + 1}`, type: 'endoplasmic_reticulum' };
        cellInteractiveObjects.push(er);
        model.add(er);
    }

    // Golgi Apparatus
    const golgiGeom = new THREE.SphereGeometry(12, 16, 12);
    const golgiMat = new THREE.MeshPhongMaterial({ color: 0x2196F3, shininess: 50 });
    const golgi = new THREE.Mesh(golgiGeom, golgiMat);
    golgi.position.set(40, 20, 30);
    golgi.userData = { name: 'Golgi Apparatus', type: 'golgi_apparatus' };
    cellInteractiveObjects.push(golgi);
    model.add(golgi);

    // Lysosomes
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 100;
        
        const lysosomeGeom = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6);
        const lysosomeMat = new THREE.MeshPhongMaterial({ color: 0xF44336, shininess: 60 });
        const lysosome = new THREE.Mesh(lysosomeGeom, lysosomeMat);
        lysosome.position.set(x, y, z);
        lysosome.userData = { name: `Lysosome ${i + 1}`, type: 'lysosome' };
        cellInteractiveObjects.push(lysosome);
        model.add(lysosome);
    }

    // Ribosomes (small dots)
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 120;
        const z = (Math.random() - 0.5) * 150;
        
        const ribosomeGeom = new THREE.SphereGeometry(1.5, 6, 4);
        const ribosomeMat = new THREE.MeshPhongMaterial({ color: 0x795548, shininess: 70 });
        const ribosome = new THREE.Mesh(ribosomeGeom, ribosomeMat);
        ribosome.position.set(x, y, z);
        ribosome.userData = { name: `Ribosome ${i + 1}`, type: 'ribosome' };
        cellInteractiveObjects.push(ribosome);
        model.add(ribosome);
    }

    // Peroxisomes
    for (let i = 0; i < 4; i++) {
        const x = (Math.random() - 0.5) * 120;
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 120;
        
        const peroxisomeGeom = new THREE.SphereGeometry(4 + Math.random() * 2, 8, 6);
        const peroxisomeMat = new THREE.MeshPhongMaterial({ color: 0x4CAF50, shininess: 50 });
        const peroxisome = new THREE.Mesh(peroxisomeGeom, peroxisomeMat);
        peroxisome.position.set(x, y, z);
        peroxisome.userData = { name: `Peroxisome ${i + 1}`, type: 'peroxisome' };
        cellInteractiveObjects.push(peroxisome);
        model.add(peroxisome);
    }

    // Vesicles
    for (let i = 0; i < 8; i++) {
        const x = (Math.random() - 0.5) * 140;
        const y = (Math.random() - 0.5) * 110;
        const z = (Math.random() - 0.5) * 140;
        
        const vesicleGeom = new THREE.SphereGeometry(2 + Math.random() * 3, 8, 6);
        const vesicleMat = new THREE.MeshPhongMaterial({ 
            color: 0x9E9E9E, 
            shininess: 40,
            transparent: true,
            opacity: 0.8
        });
        const vesicle = new THREE.Mesh(vesicleGeom, vesicleMat);
        vesicle.position.set(x, y, z);
        vesicle.userData = { name: `Vesicle ${i + 1}`, type: 'vesicle' };
        cellInteractiveObjects.push(vesicle);
        model.add(vesicle);
    }

    // Cytoskeleton elements (microtubules)
    for (let i = 0; i < 6; i++) {
        const startPoint = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 100
        );
        const endPoint = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 100
        );
        
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
        const length = direction.length();
        direction.normalize();
        
        const microtubuleGeom = new THREE.CylinderGeometry(0.5, 0.5, length, 6);
        const microtubuleMat = new THREE.MeshPhongMaterial({ color: 0x607D8B, shininess: 30 });
        const microtubule = new THREE.Mesh(microtubuleGeom, microtubuleMat);
        microtubule.position.copy(startPoint).add(direction.clone().multiplyScalar(length / 2));
        microtubule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        microtubule.userData = { name: `Microtubule ${i + 1}`, type: 'cytoskeleton' };
        cellInteractiveObjects.push(microtubule);
        model.add(microtubule);
    }

    return model;
}

// LEVEL 5: Nucleus
function createNucleusModel() {
    const model = new THREE.Group();
    const nucleusInteractiveObjects = [];
    model.userData.interactiveObjects = nucleusInteractiveObjects;

    // Nuclear membrane (outer boundary)
    const nucleusRadius = 80;
    const nuclearMembraneGeom = new THREE.SphereGeometry(nucleusRadius, 32, 16);
    const nuclearMembraneMat = new THREE.MeshPhongMaterial({ 
        color: 0x3F51B5, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const nuclearMembrane = new THREE.Mesh(nuclearMembraneGeom, nuclearMembraneMat);
    nuclearMembrane.userData = { name: 'Nuclear Membrane', type: 'nuclear_membrane' };
    nucleusInteractiveObjects.push(nuclearMembrane);
    model.add(nuclearMembrane);

    // Nucleoplasm (inner fluid)
    const nucleoplasmGeom = new THREE.SphereGeometry(nucleusRadius - 3, 32, 16);
    const nucleoplasmMat = new THREE.MeshPhongMaterial({ 
        color: 0x5C6BC0, 
        transparent: true, 
        opacity: 0.3 
    });
    const nucleoplasm = new THREE.Mesh(nucleoplasmGeom, nucleoplasmMat);
    nucleoplasm.userData = { name: 'Nucleoplasm', type: 'nucleoplasm' };
    model.add(nucleoplasm);

    // Nucleolus
    const nucleolusGeom = new THREE.SphereGeometry(15, 16, 12);
    const nucleolusMat = new THREE.MeshPhongMaterial({ color: 0xFF5722, shininess: 40 });
    const nucleolus = new THREE.Mesh(nucleolusGeom, nucleolusMat);
    nucleolus.position.set(20, 15, -10);
    nucleolus.userData = { name: 'Nucleolus', type: 'nucleolus' };
    nucleusInteractiveObjects.push(nucleolus);
    model.add(nucleolus);

    // Nuclear Pores
    for (let i = 0; i < 12; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const x = nucleusRadius * Math.sin(phi) * Math.cos(theta);
        const y = nucleusRadius * Math.sin(phi) * Math.sin(theta);
        const z = nucleusRadius * Math.cos(phi);
        
        const poreGeom = new THREE.SphereGeometry(2, 8, 6);
        const poreMat = new THREE.MeshPhongMaterial({ color: 0x00BCD4, shininess: 80 });
        const pore = new THREE.Mesh(poreGeom, poreMat);
        pore.position.set(x, y, z);
        pore.userData = { name: `Nuclear Pore ${i + 1}`, type: 'nuclear_pore' };
        nucleusInteractiveObjects.push(pore);
        model.add(pore);
    }

    // Chromatin territories (interphase chromosomes)
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 30 + Math.random() * 20;
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 40;
        const z = Math.sin(angle) * radius;
        
        const territoryGeom = new THREE.SphereGeometry(8 + Math.random() * 4, 12, 8);
        const territoryMat = new THREE.MeshPhongMaterial({ 
            color: 0xB06D7F, 
            transparent: true, 
            opacity: 0.7 
        });
        const territory = new THREE.Mesh(territoryGeom, territoryMat);
        territory.position.set(x, y, z);
        territory.userData = { name: `Chromatin Territory ${i + 1}`, type: 'chromatin_territory' };
        nucleusInteractiveObjects.push(territory);
        model.add(territory);
    }

    return model;
}

// LEVEL 4: Metaphase Chromosome
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

// LEVEL 2: Chromatin (Nucleosomes)
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
function switchToCellView() {
    currentView = 'cell';
    if (nucleusModel) nucleusModel.visible = false;
    if (chromosomeModel) chromosomeModel.visible = false;
    if (chromatinFiberModel) chromatinFiberModel.visible = false;
    if (chromatinModel) chromatinModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (transcriptionModel) transcriptionModel.visible = false;
    
    if (!cellModel) {
        cellModel = createCellModel();
        scene.add(cellModel);
    }
    cellModel.visible = true;
    zoomOutBtn.style.display = 'none'; // No higher level to zoom out to
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, 800); // Zoom out to see entire cell
    interactiveObjects = cellModel.userData.interactiveObjects;
}

function switchToNucleusView(target) {
    currentView = 'nucleus';
    if (cellModel) cellModel.visible = false;
    if (chromosomeModel) chromosomeModel.visible = false;
    if (chromatinFiberModel) chromatinFiberModel.visible = false;
    if (chromatinModel) chromatinModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (transcriptionModel) transcriptionModel.visible = false;
    
    if (!nucleusModel) {
        nucleusModel = createNucleusModel();
        scene.add(nucleusModel);
    }
    nucleusModel.visible = true;
    
    if (target) {
        const worldPosition = new THREE.Vector3();
        target.getWorldPosition(worldPosition);
        nucleusModel.position.copy(worldPosition);
    }
    
    zoomOutBtn.innerText = 'Zoom Out to Cell';
    zoomOutBtn.style.display = 'block';
    controls.target.copy(nucleusModel.position);
    camera.position.copy(nucleusModel.position).add(new THREE.Vector3(0, 0, 300));
    interactiveObjects = nucleusModel.userData.interactiveObjects;
}

function switchToChromosomeView(target) {
    currentView = 'chromosome';
    if (nucleusModel) nucleusModel.visible = false;
    if (chromatinFiberModel) chromatinFiberModel.visible = false;
    if (chromatinModel) chromatinModel.visible = false;
    if (dnaModel) dnaModel.visible = false;
    if (transcriptionModel) transcriptionModel.visible = false;
    
    if (!chromosomeModel) {
        chromosomeModel = createChromosomeModel();
        scene.add(chromosomeModel);
    }
    chromosomeModel.visible = true;
    
    if (target) {
        const worldPosition = new THREE.Vector3();
        target.getWorldPosition(worldPosition);
        chromosomeModel.position.copy(worldPosition);
    }
    
    zoomOutBtn.innerText = 'Zoom Out to Nucleus';
    zoomOutBtn.style.display = 'block';
    controls.target.copy(chromosomeModel.position);
    camera.position.copy(chromosomeModel.position).add(new THREE.Vector3(0, 0, 550));
    interactiveObjects = chromosomeModel.userData.interactiveObjects;
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
window.addEventListener('click', async () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);
    if (intersects.length === 0) return;

    const clickedObject = intersects[0].object;
    const userData = clickedObject.userData;

    // Show component details for all clickable objects
    if (userData.type) {
        showComponentDetails(userData.type, userData.name);
    }

    // Also handle navigation for specific components
    switch (currentView) {
        case 'cell':
            if (userData.type === 'mitochondria' || userData.type === 'endoplasmic_reticulum' || 
                userData.type === 'golgi_apparatus' || userData.type === 'lysosome' || 
                userData.type === 'ribosome' || userData.type === 'peroxisome' || 
                userData.type === 'vesicle' || userData.type === 'cytoskeleton' || 
                userData.type === 'cell_membrane') {
                switchToNucleusView(clickedObject);
            }
            break;
        case 'nucleus':
            if (userData.type === 'chromatin_territory' || userData.type === 'nucleolus' || userData.type === 'nuclear_pore' || userData.type === 'nuclear_membrane') {
                switchToChromosomeView(clickedObject);
            }
            break;
        case 'chromosome':
            switchToChromatinFiberView(clickedObject);
            break;
        case 'chromatinFiber':
            switchToChromatinView(clickedObject);
            break;
        case 'chromatin':
            if (userData.type === 'histone' || userData.type === 'transcription_complex') {
                switchToDnaView(clickedObject);
            }
            break;
        case 'dna':
            if (userData.type === 'dna_component') {
                switchToTranscriptionView(clickedObject);
            }
            break;
        case 'transcription':
            if (userData.type === 'transcription_enzyme' || userData.type === 'transcription_product') {
                switchToTranscriptionView(clickedObject);
            }
            break;
    }
});
zoomOutBtn.addEventListener('click', () => {
    switch (currentView) {
        case 'nucleus':
            switchToCellView();
            break;
        case 'chromosome':
            switchToNucleusView();
            break;
        case 'chromatinFiber':
            switchToChromosomeView();
            break;
        case 'chromatin':
            switchToChromatinFiberView(chromosomeModel); // Pass a dummy target
            break;
        case 'dna':
        case 'transcription':
            switchToChromatinView(chromatinFiberModel); // Pass a dummy target
            break;
    }
});

// --- MAIN ---
console.log('Starting application...');
switchToCellView();
console.log('Cell view initialized');

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
            case 'cell':
                if (userData.type === 'mitochondria' || userData.type === 'endoplasmic_reticulum' || 
                    userData.type === 'golgi_apparatus' || userData.type === 'lysosome' || 
                    userData.type === 'ribosome' || userData.type === 'peroxisome' || 
                    userData.type === 'vesicle' || userData.type === 'cytoskeleton' || 
                    userData.type === 'cell_membrane') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    label.innerText = userData.name;
                    label.style.display = 'block';
                }
                break;
            case 'nucleus':
                if (userData.type === 'chromatin_territory' || userData.type === 'nucleolus' || userData.type === 'nuclear_pore' || userData.type === 'nuclear_membrane') {
                    highlightedMesh = primaryHoveredObj;
                    highlightedMesh.material.emissive.setHex(0x555555);
                    label.innerText = userData.name;
                    label.style.display = 'block';
                }
                break;
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
                    if (userData.uniprotId) {
                        labelText += `\nUniProt: ${userData.uniprotId}`;
                    }
                    if (userData.description) {
                        labelText += `\n${userData.description}`;
                    }
                    if(userData.type === 'transcription_complex') {
                        labelText += "\n(Click to see transcription animation)"
                    } else {
                        labelText += "\n(Click to see DNA structure)"
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
                        labelText += "\n\n(Click to see transcription animation)";
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

    if (cellModel && cellModel.visible) cellModel.rotation.y += 0.0001;
    if (nucleusModel && nucleusModel.visible) nucleusModel.rotation.y += 0.0002;
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

// Diagram creation functions
function createCellMembraneDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <rect x="50" y="100" width="300" height="100" fill="none" stroke="#4CAF50" stroke-width="3"/>
        <circle cx="80" cy="120" r="8" fill="#FF9800"/>
        <circle cx="120" cy="140" r="6" fill="#2196F3"/>
        <circle cx="160" cy="130" r="7" fill="#9C27B0"/>
        <circle cx="200" cy="150" r="5" fill="#F44336"/>
        <circle cx="240" cy="125" r="6" fill="#795548"/>
        <circle cx="280" cy="145" r="7" fill="#607D8B"/>
        <circle cx="320" cy="135" r="6" fill="#4CAF50"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Cell Membrane Structure</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Phospholipid Bilayer with Embedded Proteins</text>
    </svg>`;
}

function createMitochondriaDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <ellipse cx="200" cy="150" rx="80" ry="50" fill="none" stroke="#FF9800" stroke-width="3"/>
        <ellipse cx="200" cy="150" rx="60" ry="35" fill="none" stroke="#FF9800" stroke-width="2"/>
        <path d="M 140 150 Q 180 120 220 150 Q 180 180 140 150" fill="none" stroke="#FF9800" stroke-width="2"/>
        <path d="M 160 150 Q 200 130 240 150 Q 200 170 160 150" fill="none" stroke="#FF9800" stroke-width="2"/>
        <path d="M 180 150 Q 220 140 260 150 Q 220 160 180 150" fill="none" stroke="#FF9800" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Mitochondria Structure</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Outer Membrane, Inner Membrane (Cristae), Matrix</text>
    </svg>`;
}

function createERDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <path d="M 100 100 Q 150 80 200 100 Q 250 120 300 100 Q 350 80 400 100" fill="none" stroke="#9C27B0" stroke-width="3"/>
        <path d="M 100 120 Q 150 100 200 120 Q 250 140 300 120 Q 350 100 400 120" fill="none" stroke="#9C27B0" stroke-width="3"/>
        <path d="M 100 140 Q 150 120 200 140 Q 250 160 300 140 Q 350 120 400 140" fill="none" stroke="#9C27B0" stroke-width="3"/>
        <circle cx="150" cy="110" r="3" fill="#795548"/>
        <circle cx="200" cy="130" r="3" fill="#795548"/>
        <circle cx="250" cy="110" r="3" fill="#795548"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Endoplasmic Reticulum</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Rough ER (with ribosomes) and Smooth ER</text>
    </svg>`;
}

function createGolgiDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <rect x="180" y="80" width="40" height="20" fill="#2196F3" opacity="0.3"/>
        <rect x="175" y="105" width="50" height="20" fill="#2196F3" opacity="0.5"/>
        <rect x="170" y="130" width="60" height="20" fill="#2196F3" opacity="0.7"/>
        <rect x="165" y="155" width="70" height="20" fill="#2196F3" opacity="0.9"/>
        <rect x="160" y="180" width="80" height="20" fill="#2196F3"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Golgi Apparatus</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Cis, Medial, and Trans Cisternae</text>
    </svg>`;
}

function createLysosomeDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="40" fill="#F44336" opacity="0.8"/>
        <circle cx="180" cy="130" r="8" fill="#FF5722"/>
        <circle cx="220" cy="140" r="6" fill="#FF5722"/>
        <circle cx="190" cy="170" r="7" fill="#FF5722"/>
        <circle cx="210" cy="160" r="5" fill="#FF5722"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Lysosome</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Digestive enzymes and cellular waste</text>
    </svg>`;
}

function createRibosomeDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <ellipse cx="200" cy="120" rx="30" ry="20" fill="#795548"/>
        <ellipse cx="200" cy="180" rx="25" ry="15" fill="#795548"/>
        <line x1="200" y1="140" x2="200" y2="165" stroke="#795548" stroke-width="3"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Ribosome</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Large and Small Subunits</text>
    </svg>`;
}

function createPeroxisomeDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="35" fill="#4CAF50" opacity="0.7"/>
        <circle cx="185" cy="135" r="6" fill="#66BB6A"/>
        <circle cx="215" cy="145" r="4" fill="#66BB6A"/>
        <circle cx="195" cy="165" r="5" fill="#66BB6A"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Peroxisome</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Detoxification and fatty acid oxidation</text>
    </svg>`;
}

function createVesicleDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="30" fill="#9E9E9E" opacity="0.6"/>
        <circle cx="190" cy="140" r="8" fill="#757575"/>
        <circle cx="210" cy="160" r="6" fill="#757575"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Vesicle</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Transport and storage of cellular materials</text>
    </svg>`;
}

function createCytoskeletonDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <line x1="100" y1="100" x2="300" y2="200" stroke="#607D8B" stroke-width="4"/>
        <line x1="120" y1="180" x2="280" y2="120" stroke="#607D8B" stroke-width="3"/>
        <line x1="80" y1="150" x2="320" y2="150" stroke="#607D8B" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Cytoskeleton</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Microtubules, microfilaments, and intermediate filaments</text>
    </svg>`;
}

function createNuclearMembraneDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="80" fill="none" stroke="#3F51B5" stroke-width="4"/>
        <circle cx="200" cy="150" r="60" fill="none" stroke="#3F51B5" stroke-width="4"/>
        <circle cx="200" cy="150" r="40" fill="#5C6BC0" opacity="0.3"/>
        <circle cx="160" cy="110" r="3" fill="#00BCD4"/>
        <circle cx="240" cy="130" r="3" fill="#00BCD4"/>
        <circle cx="180" cy="190" r="3" fill="#00BCD4"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Nuclear Membrane</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Double membrane with nuclear pores</text>
    </svg>`;
}

function createNucleolusDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="50" fill="#FF5722"/>
        <circle cx="180" cy="130" r="15" fill="#FF7043" opacity="0.7"/>
        <circle cx="220" cy="140" r="12" fill="#FF7043" opacity="0.7"/>
        <circle cx="190" cy="170" r="10" fill="#FF7043" opacity="0.7"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Nucleolus</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Ribosome assembly and rRNA synthesis</text>
    </svg>`;
}

function createNuclearPoreDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="25" fill="none" stroke="#00BCD4" stroke-width="3"/>
        <circle cx="200" cy="150" r="15" fill="#00BCD4" opacity="0.3"/>
        <line x1="175" y1="150" x2="225" y2="150" stroke="#00BCD4" stroke-width="2"/>
        <line x1="200" y1="125" x2="200" y2="175" stroke="#00BCD4" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Nuclear Pore</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Selective transport between nucleus and cytoplasm</text>
    </svg>`;
}

function createChromatinTerritoryDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="60" fill="#B06D7F" opacity="0.7"/>
        <path d="M 150 120 Q 180 100 210 130 Q 240 160 270 140" fill="none" stroke="#8A6E99" stroke-width="2"/>
        <path d="M 160 180 Q 190 160 220 190 Q 250 220 280 200" fill="none" stroke="#8A6E99" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Chromatin Territory</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">3D organization of chromosome regions</text>
    </svg>`;
}

function createChromosomeDomainDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <rect x="150" y="100" width="100" height="100" fill="#B06D7F" opacity="0.8"/>
        <circle cx="170" cy="120" r="8" fill="#8A6E99"/>
        <circle cx="190" cy="140" r="6" fill="#8A6E99"/>
        <circle cx="210" cy="130" r="7" fill="#8A6E99"/>
        <circle cx="230" cy="150" r="5" fill="#8A6E99"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Chromosome Domain</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Topologically Associating Domains (TADs)</text>
    </svg>`;
}

function createNucleosomeClusterDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="40" fill="#6E4D6E" opacity="0.8"/>
        <circle cx="180" cy="130" r="12" fill="#8A6E99"/>
        <circle cx="220" cy="140" r="10" fill="#8A6E99"/>
        <circle cx="190" cy="170" r="11" fill="#8A6E99"/>
        <circle cx="210" cy="160" r="9" fill="#8A6E99"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Nucleosome Cluster</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Histone octamers with wrapped DNA</text>
    </svg>`;
}

function createHistoneDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="30" fill="#8A6E99"/>
        <path d="M 170 150 Q 200 120 230 150 Q 200 180 170 150" fill="none" stroke="#0952A2" stroke-width="3"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Histone Protein Complex</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">H2A, H2B, H3, H4 octamer with DNA</text>
    </svg>`;
}

function createTranscriptionComplexDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <ellipse cx="200" cy="150" rx="35" ry="25" fill="#E67E22"/>
        <circle cx="180" cy="140" r="8" fill="#2980B9"/>
        <circle cx="220" cy="160" r="8" fill="#27AE60"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">Transcription Complex</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">RNA Polymerase with transcription factors</text>
    </svg>`;
}

function createDNAComponentDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <path d="M 100 100 Q 150 80 200 100 Q 250 120 300 100" fill="none" stroke="#0952A2" stroke-width="3"/>
        <path d="M 100 200 Q 150 220 200 200 Q 250 180 300 200" fill="none" stroke="#DB4D56" stroke-width="3"/>
        <line x1="120" y1="110" x2="120" y2="190" stroke="#EEEEEE" stroke-width="2"/>
        <line x1="150" y1="105" x2="150" y2="195" stroke="#EEEEEE" stroke-width="2"/>
        <line x1="180" y1="110" x2="180" y2="190" stroke="#EEEEEE" stroke-width="2"/>
        <line x1="210" y1="115" x2="210" y2="185" stroke="#EEEEEE" stroke-width="2"/>
        <line x1="240" y1="120" x2="240" y2="180" stroke="#EEEEEE" stroke-width="2"/>
        <line x1="270" y1="115" x2="270" y2="185" stroke="#EEEEEE" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">DNA Double Helix</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Complementary strands with hydrogen bonds</text>
    </svg>`;
}

function createRNAPolymeraseDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <ellipse cx="200" cy="150" rx="40" ry="30" fill="#E67E22"/>
        <path d="M 240 150 Q 260 140 280 150 Q 260 160 240 150" fill="none" stroke="#9B59B6" stroke-width="3"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">RNA Polymerase</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Transcribes DNA to RNA</text>
    </svg>`;
}

function createRNAStrandDiagram() {
    return `<svg width="400" height="300" viewBox="0 0 400 300">
        <path d="M 100 150 Q 150 130 200 150 Q 250 170 300 150" fill="none" stroke="#9B59B6" stroke-width="4"/>
        <circle cx="150" cy="140" r="4" fill="#8E44AD"/>
        <circle cx="200" cy="150" r="4" fill="#8E44AD"/>
        <circle cx="250" cy="160" r="4" fill="#8E44AD"/>
        <text x="200" y="50" text-anchor="middle" fill="#333" font-size="16" font-weight="bold">RNA Strand</text>
        <text x="200" y="70" text-anchor="middle" fill="#666" font-size="12">Single-stranded RNA with uracil</text>
    </svg>`;
} 