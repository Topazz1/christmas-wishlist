import * as THREE from 'three';
import { gsap } from 'gsap';

// --- 1. INITIALISATION ---
const scene = new THREE.Scene();
// On force le fond bleu du CSS à travers le canvas
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 9); // Caméra un peu plus basse et reculée
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Pour que ce soit net sur mobile
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- 2. LUMIÈRES ---
// MeshBasicMaterial n'a pas besoin de lumière, mais on en met une douce pour l'ambiance si on change de matériau plus tard
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// --- 3. CRÉATION DU SAPIN (Style "Image Plate") ---
const treeGroup = new THREE.Group();
treeGroup.position.y = -1.5; // On descend l'arbre pour le centrer visuellement

// --- Couleurs inspirées de ton image (Verts foncés et plats) ---
const colors = {
    trunk: 0x5d4037,  // Marron foncé
    level1: 0x1b5e20, // Vert très foncé (bas)
    level2: 0x2e7d32, // Vert moyen
    level3: 0x388e3c, // Vert un peu plus clair (haut)
    star: 0xffeb3b    // Jaune vif
};

// Matériaux "Basic" = Pas d'ombres, couleur pure (rendu 2D)
const trunkMat = new THREE.MeshBasicMaterial({ color: colors.trunk });
const level1Mat = new THREE.MeshBasicMaterial({ color: colors.level1 });
const level2Mat = new THREE.MeshBasicMaterial({ color: colors.level2 });
const level3Mat = new THREE.MeshBasicMaterial({ color: colors.level3 });

// Tronc
const trunkGeo = new THREE.BoxGeometry(1, 1.5, 1);
const trunk = new THREE.Mesh(trunkGeo, trunkMat);
trunk.position.y = 0.75;
treeGroup.add(trunk);

// Fonction pour créer un étage triangulaire
function createLevel(radius, height, y, material) {
    // 4 segments = Pyramide à base carrée
    const geo = new THREE.ConeGeometry(radius, height, 4, 1);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = y;
    // IMPORTANT : Rotation de 45 degrés (PI/4) pour présenter une face plate à la caméra
    mesh.rotation.y = Math.PI / 4; 
    return mesh;
}

// Création des 3 étages (plus larges et plats comme l'image)
const level1 = createLevel(3.5, 2.5, 2.0, level1Mat);
const level2 = createLevel(2.8, 2.2, 3.5, level2Mat);
const level3 = createLevel(2.0, 1.8, 4.8, level3Mat);

treeGroup.add(level1);
treeGroup.add(level2);
treeGroup.add(level3);

// L'ÉTOILE (Hexagone Jaune)
// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
// 6 segments = Hexagone
const starGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 6);
const starMat = new THREE.MeshBasicMaterial({ color: colors.star });
const star = new THREE.Mesh(starGeo, starMat);
star.position.y = 6.2;
star.rotation.x = Math.PI / 2; // On la met debout face caméra
star.name = "MainStar"; 

// Petite animation de l'étoile (flotte)
gsap.to(star.position, { y: 6.5, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
// Animation de rotation de l'étoile sur elle-même (axe Z car on l'a pivotée)
gsap.to(star.rotation, { z: Math.PI * 2, duration: 6, repeat: -1, ease: "linear" });

treeGroup.add(star);
scene.add(treeGroup);

// --- 4. LOGIQUE D'ANIMATION & INTERACTION ---

// Objet pour stocker l'état de la rotation (pour éviter le bug du "this")
const animationState = {
    treeRotationSpeed: 0.005
};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', onMouseClick);

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    // On teste l'intersection avec l'étoile spécifiquement, ou tout le groupe
    const intersects = raycaster.intersectObjects(treeGroup.children);

    if (intersects.length > 0) {
        // On vérifie si on a cliqué sur l'étoile
        // Note: Parfois on clique un peu à côté, donc on lance la magie si on touche n'importe quoi de l'arbre pour simplifier, 
        // ou tu peux filtrer par 'intersects[0].object.name === "MainStar"'
        if (intersects[0].object.name === "MainStar") {
            startChristmasMagic();
        }
    }
}

function startChristmasMagic() {
    // On retire l'écouteur pour ne pas recliquer
    window.removeEventListener('click', onMouseClick);

    const tl = gsap.timeline();

    // 1. L'étoile monte
    tl.to(star.position, { y: 15, duration: 2, ease: "power2.in" }, 0);

    // 2. La caméra recule un peu et regarde le ciel
    tl.to(camera.position, { y: 5, z: 2, duration: 2.5, ease: "power2.inOut" }, 0.5);
    tl.to(camera.rotation, { x: Math.PI / 2, duration: 2.5, ease: "power2.inOut" }, 0.5);

    // 3. On arrête la rotation de l'arbre doucement
    tl.to(animationState, { treeRotationSpeed: 0, duration: 1 }, 0);

    // 4. Changement de fond (Nuit)
    tl.to(document.body.style, { 
        backgroundColor: '#0b0b1a', // Bleu nuit très foncé
        duration: 2 
    }, 1);

    // 5. Apparition des étoiles cadeaux à la fin
    tl.call(generateWishlistStars, [], 2.5);
    
    // Réactiver le clic pour les cadeaux après l'anim
    tl.call(() => { window.addEventListener('click', onMouseClickWishlist); }, [], 3);
}

// --- 5. WISHLIST ---
const wishlistStars = new THREE.Group();
scene.add(wishlistStars);

const wishlistData = [
    { title: "PS5 Pro", description: "La puissance ultime !", link: "#" },
    { title: "LEGO Rivendell", description: "Le set du Seigneur des Anneaux.", link: "#" },
    { title: "Carte Cadeau", description: "Toujours utile.", link: "#" },
    { title: "Voyage au Japon", description: "Le rêve absolu.", link: "#" },
    { title: "Nouveau Mac", description: "Pour coder encore plus.", link: "#" }
];

function generateWishlistStars() {
    const starGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    wishlistData.forEach((gift, i) => {
        const s = new THREE.Mesh(starGeo, starMat);
        // Position aléatoire dans le ciel (au dessus de la caméra qui regarde en haut)
        // x: -10 à 10, y: 10 à 30 (haut), z: -10 à 10
        s.position.set(
            (Math.random() - 0.5) * 20, 
            10 + Math.random() * 20, 
            (Math.random() - 0.5) * 20
        );
        s.userData = { gift: gift };
        
        // Animation d'apparition
        s.scale.set(0,0,0);
        gsap.to(s.scale, { x: 1, y: 1, z: 1, duration: 0.5, delay: i * 0.1 });
        
        wishlistStars.add(s);
    });
}

function onMouseClickWishlist(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(wishlistStars.children);
    
    if (intersects.length > 0) {
        const gift = intersects[0].object.userData.gift;
        showGiftCard(gift);
    }
}

function showGiftCard(data) {
    const card = document.getElementById('gift-card');
    document.getElementById('gift-title').innerText = data.title;
    card.querySelector('p').innerText = data.description;
    card.classList.add('visible');
}

window.closeGiftCard = () => {
    document.getElementById('gift-card').classList.remove('visible');
}

// --- BOUCLE D'ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    
    // Rotation de l'arbre via l'état
    treeGroup.rotation.y += animationState.treeRotationSpeed;
    
    // Faire scintiller les étoiles cadeaux
    wishlistStars.children.forEach(s => {
        s.scale.setScalar(1 + Math.sin(Date.now() * 0.005 + s.position.x) * 0.2);
    });

    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});