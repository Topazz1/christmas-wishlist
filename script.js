import * as THREE from 'three';
import { gsap } from 'gsap';

// --- 1. CONFIGURATION SCÈNE ---
const scene = new THREE.Scene();
const dayColor = new THREE.Color(0xcce0ff); 
const nightColor = new THREE.Color(0x050510); 
const fogColor = new THREE.Color(0xcccccc); 

scene.background = dayColor; 
scene.fog = new THREE.Fog(fogColor, 15, 50); 

const frustumSize = 4.5;
const aspect = window.innerWidth / window.innerHeight;

const orthoCamera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, frustumSize * aspect / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, 1000
);
orthoCamera.position.set(10, 10, 10);
orthoCamera.lookAt(0, 1.5, 0);

const persCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
let activeCamera = orthoCamera;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 15, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);


// --- 2. LE SOL (VERT FORÊT) ---
function createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}
const shadowTexture = createShadowTexture();
const shadowMaterial = new THREE.SpriteMaterial({ map: shadowTexture, transparent: true, depthWrite: false });

const groundGeo = new THREE.CircleGeometry(60, 128); 
const positionAttribute = groundGeo.attributes.position;
for ( let i = 0; i < positionAttribute.count; i ++ ) {
    if(i > 0) {
        const x = positionAttribute.getX( i );
        const y = positionAttribute.getY( i );
        const z = Math.sin(x * 0.2) * 0.5 + Math.cos(y * 0.2) * 0.5 + Math.random() * 0.2; 
        positionAttribute.setZ( i, z );
    }
}
groundGeo.computeVertexNormals();

const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e2f23, 
    roughness: 1, 
    metalness: 0, 
    flatShading: true 
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.25;
ground.receiveShadow = true;
scene.add(ground);


// --- 3. DÉTAILS AU SOL ---
const groundDetailsGroup = new THREE.Group();
scene.add(groundDetailsGroup);

function generateGroundDetails() {
    const minR = 3.5; const maxR = 35;

    // A. PLAQUES DE NEIGE
    const snowGeo = new THREE.CircleGeometry(1, 8);
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    
    for(let i=0; i<80; i++) { 
        const snowPatch = new THREE.Mesh(snowGeo, snowMat);
        const r = minR + Math.random() * (maxR - minR);
        const a = Math.random() * Math.PI * 2;
        const x = Math.cos(a)*r; const z = Math.sin(a)*r;
        if(x > -4 && x < 4 && z > 1 && z < 15) continue; 

        snowPatch.position.set(x, -1.20, z); 
        snowPatch.rotation.x = -Math.PI/2;
        snowPatch.scale.set(1 + Math.random()*2, 1 + Math.random()*2, 1);
        groundDetailsGroup.add(snowPatch);
    }

    // B. ROCHERS
    const rockGeo = new THREE.DodecahedronGeometry(0.3, 0);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for(let i=0; i<50; i++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        const r = minR + Math.random() * (maxR - minR);
        const a = Math.random() * Math.PI * 2;
        const x = Math.cos(a)*r; const z = Math.sin(a)*r;
        if(x > -3 && x < 3 && z > 1 && z < 10) continue;
        rock.position.set(x, -1.1, z);
        rock.scale.setScalar(0.5 + Math.random());
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        groundDetailsGroup.add(rock);
    }

    // C. CADEAUX CACHÉS
    const boxGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const giftColors = [0xd62828, 0x2a9d8f, 0xe9c46a, 0xf4a261]; 
    
    for(let i=0; i<80; i++) { 
        const col = giftColors[Math.floor(Math.random()*giftColors.length)];
        const boxMat = new THREE.MeshLambertMaterial({ color: col });
        const box = new THREE.Mesh(boxGeo, boxMat);
        
        const r = minR + Math.random() * (maxR - minR);
        const a = Math.random() * Math.PI * 2;
        const x = Math.cos(a)*r; const z = Math.sin(a)*r;
        if(x > -3 && x < 3 && z > 1 && z < 10) continue;

        box.position.set(x, -1.1, z);
        box.rotation.y = Math.random() * Math.PI;
        
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.05), new THREE.MeshBasicMaterial({color:0xffffff}));
        box.add(ribbon);
        
        const shadow = new THREE.Sprite(shadowMaterial);
        shadow.scale.set(0.8, 0.8, 1);
        shadow.position.y = -0.14;
        box.add(shadow);

        groundDetailsGroup.add(box);
    }
}
generateGroundDetails();


// --- 4. USINE À ARBRES ---
function createDuoToneCone(radiusBottom, radiusTop, height, c1, c2, yPos) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 4, 1);
    const nonIndexedGeo = geometry.toNonIndexed();
    const colors = [];
    const col1 = new THREE.Color(c1);
    const col2 = new THREE.Color(c2);
    const count = nonIndexedGeo.attributes.position.count;
    for (let i = 0; i < count; i++) {
        const faceIndex = Math.floor(i / 6);
        if (faceIndex % 2 === 0) colors.push(col1.r, col1.g, col1.b);
        else colors.push(col2.r, col2.g, col2.b);
    }
    nonIndexedGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(nonIndexedGeo, material);
    mesh.position.y = yPos; mesh.rotation.y = Math.PI / 4;
    return mesh;
}

function createTreeMesh(scale = 1, type = 'normal') {
    const group = new THREE.Group();
    
    // Couleurs par défaut (Normal/Dark)
    let wood1='#5c4033', wood2='#3e2b22';
    let l1='#1e4d2b', l2='#14331d'; 
    let m1='#265c36', m2='#1a3d24'; 
    let h1='#337a4a', h2='#225231'; 

    // --- CORRECTION COULEURS HERO ---
    if (type === 'hero') {
        // Les couleurs originales vives
        wood1='#7b4917'; wood2='#652b0f';
        l1='#6fca5a'; l2='#4aa031';
        m1='#7fda6b'; m2='#56af3e';
        h1='#8ee87a'; h2='#63be4f';
    } 
    else if (type === 'snow') {
        wood1='#3e3025'; wood2='#2a1d15';
        l1='#dbeff5'; l2='#b0d4e0'; 
        m1='#e6f7fa'; m2='#c4e3eb';
        h1='#ffffff'; h2='#e0f2f7';
    } 
    else if (type === 'autumn') {
        l1='#d66828'; l2='#a34817';
        m1='#e88d4a'; m2='#c46d2f';
        h1='#f0a86c'; h2='#db8e51';
    }

    group.add(createDuoToneCone(0.35, 0.25, 0.7, wood1, wood2, 0.35));
    group.add(createDuoToneCone(1.2, 0.6, 1.1, l1, l2, 1.35));
    group.add(createDuoToneCone(0.9, 0.3, 1.0, m1, m2, 2.15));
    group.add(createDuoToneCone(0.6, 0.0, 0.9, h1, h2, 2.85));
    
    const shadow = new THREE.Sprite(shadowMaterial);
    shadow.scale.set(2.5, 2.5, 1);
    shadow.position.y = 0.05; 
    group.add(shadow);

    group.scale.set(scale, scale, scale);
    return group;
}


// --- 5. ARBRE HÉRO (Avec type 'hero' forcé) ---
const mainTreeGroup = createTreeMesh(1, 'hero'); 
mainTreeGroup.position.y = -1.2;

const starShape = new THREE.Shape();
const outerRadius = 0.28; const innerRadius = 0.12; 
for (let i = 0; i < 5; i++) {
    const aO = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const aI = ((i * 2 + 1) * Math.PI) / 5 - Math.PI / 2;
    i===0 ? starShape.moveTo(Math.cos(aO)*outerRadius, Math.sin(aO)*outerRadius) : starShape.lineTo(Math.cos(aO)*outerRadius, Math.sin(aO)*outerRadius);
    starShape.lineTo(Math.cos(aI)*innerRadius, Math.sin(aI)*innerRadius);
}
starShape.closePath();
const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.05, bevelEnabled: false });
starGeo.center();
const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xfbea64 }));
star.position.y = 3.45; star.name = "MainStar";
mainTreeGroup.add(star);

const canvasHalo = document.createElement('canvas'); canvasHalo.width=64; canvasHalo.height=64;
const ctxHalo = canvasHalo.getContext('2d');
const gradHalo = ctxHalo.createRadialGradient(32,32,0,32,32,32);
gradHalo.addColorStop(0,'rgba(255,200,0,0.5)'); gradHalo.addColorStop(1,'rgba(255,200,0,0)');
ctxHalo.fillStyle=gradHalo; ctxHalo.fillRect(0,0,64,64);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvasHalo), transparent:true, opacity:0.8, blending:THREE.AdditiveBlending }));
halo.scale.set(1.2,1.2,1); star.add(halo);

gsap.to(star.rotation, { y: Math.PI*2, duration:8, repeat:-1, ease:"none" });
gsap.to(star.position, { y: 3.55, duration:2, yoyo:true, repeat:-1, ease:"sine.inOut" });
scene.add(mainTreeGroup);


// --- 6. FORÊT DENSE ---
const forestGroup = new THREE.Group();
scene.add(forestGroup);

function generateEnvironment() {
    const minRadius = 4.0; const maxRadius = 32; 
    const treeCount = 450; 
    
    for(let i = 0; i < treeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = minRadius + Math.pow(Math.random(), 0.8) * (maxRadius - minRadius);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        if(x > -3.5 && x < 3.5 && z > 1.0 && z < 14.0) continue;

        let tree;
        const rand = Math.random();
        if(rand > 0.85) tree = createTreeMesh(0.3 + Math.random()*0.5, 'snow'); 
        else if (rand > 0.80) tree = createTreeMesh(0.3 + Math.random()*0.4, 'autumn');
        else tree = createTreeMesh(0.3 + Math.random()*0.6, 'normal');

        tree.position.set(x, -1.2, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        forestGroup.add(tree);
    }
}
generateEnvironment();


// --- 7. DONNÉES CADEAUX ---
const giftsData = [
    // Cadeau 1
    { 
        title: "Instinct - Tome 2", 
        desc: "Tome 2 d'une saga que j'ai plutot apprécié.", 
        price: "10,95€", 
        link: "https://www.fnac.com/a21712003/Instinct-Tome-2-Instinct-Tome-2-Inoxtag", // Mettre le lien du produit ici
        img: "https://static.fnac-static.com/multimedia/Images/FR/NR/49/c7/22/19056457/1540-1/tsp20251108080819/Instinct-Tome-2.jpg" // Mettre le lien de l'image ici
    },
    // Cadeau 2
    { 
        title: "Cartes Pokemon", 
        desc: "Pas essentiellement celles la.", 
        price: "55€", 
        link: "https://www.amazon.fr/Pok%C3%A9mon-M%C3%A9ga-%C3%89volution-Fantasmagoriques-Carte-boosters/dp/B0FTG12DDK/ref=sr_1_2?dib=eyJ2IjoiMSJ9.yEFmn6g2qawBwlIceX4wrBBP05TOcDrX4mHj-Ajjf2Bu8IAtbjR-qXQ6vo90Rx0h3lg5DULSCukg7GZ0jdHM5nDL49R30YUcbTGG0kpAvBfxyb1U7vLg6fy55DbExNBiNflW3x0i3fTB3zeRa9YyFP9Lb0MBQ_ApQSl2xv92Pfg1VF6U6UKNqB2-L-hW6xPAcFYEKpGPz4KMRM5T_mYtJTTcPizRApQcvTx82D5ja7JDwPFjaWXfdhm66cCeDcrAU_Id-DAw7mEi46VHO-TLObiDilHN2EN-gBgtDv5sGHE.hOyphSICILbRCkwctlx3o9MLsAgQg-JD6h1RwUq5iC0&dib_tag=se&keywords=carte+pokemon&qid=1763581606&sr=8-2", 
        img: "https://m.media-amazon.com/images/I/81hD4FRcrgL._AC_SX425_.jpg" 
    },
    // Cadeau 3
    { 
        title: "Athena (Akropolis)", 
        desc: "Extension d'un super jeu que j'adore.", 
        price: "11,9€", 
        link: "https://www.fnac.com/Jeu-de-strategie-Gigamic-Akropolis-Athena/a20735045/w-4", 
        img: "https://static.fnac-static.com/multimedia/Images/FR/MDMFR/MDM/87/4d/6d/23940487/1540-1/tsp20250522130857/Jeu-de-strategie-Gigamic-Akropolis-Athena.jpg" 
    },
    // Cadeau 4
    { 
        title: "Tableau 1", 
        desc: "Petit tableau sympa, pas top 1 cadeau", 
        price: "44,99€", 
        link: "https://www.amazon.fr/MuchoWow%C2%A9-Impression-Decoration-Peinture-Decoratifs/dp/B0DY1C3D8D/ref=sr_1_23?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=O1DN5HFQ1PNS&dib=eyJ2IjoiMSJ9.TIK7Hv_Y657fqqNeNy1EG9XEbJXoXNV7_3_cTMkpJn7KM_IxRtOFScQvIYArLlJVJJHJylCdCMEoxOR7f5rbN4nx06Q0HZxOmzwAYOowWNvsq8pNBfknyu-1qoIVSZ-doj_ieiY6LD5KsqfTAk57MxV1Am62_FBJxLZ2YpikRfTfnoKKq0HyWdcLOvslvVZ4LS4mtOTXqklfRLsAwuOl9cb3UV-zYdqHuE_Vut8NuQWl1_LzqvGeOVTapyq6WcosiHyan6Oxhu0TdTA-JMjnRa-8Zkj8ejKAE300DRd2Li4.54C10WiABoE-TMlHTyjwUfYltdpOKM_pqLfuaRc8Dco&dib_tag=se&keywords=tableau%2Bdeco%2Bvert%2Baesthetic&qid=1763582082&s=kitchen&sprefix=tableau%2Bdeco%2Bvert%2Baesthetic%2Ckitchen%2C86&sr=1-23&th=1", 
        img: "https://m.media-amazon.com/images/I/51CSXGpkN8L._AC_SX425_.jpg" 
    },
    // Cadeau 5
    { 
        title: "Tableau 2", 
        desc: "Des deux prop. de tableaux je pref elle", 
        price: "24,99€", 
        link: "https://www.amazon.fr/PWAAHDC-impressions-toile-vert-sauge/dp/B0CS952LZ2/ref=sr_1_2?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=O1DN5HFQ1PNS&dib=eyJ2IjoiMSJ9.TIK7Hv_Y657fqqNeNy1EG9XEbJXoXNV7_3_cTMkpJn7KM_IxRtOFScQvIYArLlJVJJHJylCdCMEoxOR7f5rbN4nx06Q0HZxOmzwAYOowWNvsq8pNBfknyu-1qoIVSZ-doj_ieiY6LD5KsqfTAk57MxV1Am62_FBJxLZ2YpikRfTfnoKKq0HyWdcLOvslvVZ4LS4mtOTXqklfRLsAwuOl9cb3UV-zYdqHuE_Vut8NuQWl1_LzqvGeOVTapyq6WcosiHyan6Oxhu0TdTA-JMjnRa-8Zkj8ejKAE300DRd2Li4.54C10WiABoE-TMlHTyjwUfYltdpOKM_pqLfuaRc8Dco&dib_tag=se&keywords=tableau%2Bdeco%2Bvert%2Baesthetic&qid=1763582082&s=kitchen&sprefix=tableau%2Bdeco%2Bvert%2Baesthetic%2Ckitchen%2C86&sr=1-2&th=1", 
        img: "https://m.media-amazon.com/images/I/71O1pjE75bL._AC_SX425_.jpg" 
    },
    // Cadeau 6
    { 
        title: "Tapis fleur", 
        desc: "Un super tapis fleur hyper joli", 
        price: "18,99€ - 25,99€", 
        link: "https://www.amazon.fr/Morbuy-Moelleux-Antid%C3%A9rapant-D%C3%A9coration-Nordique/dp/B0BZ86KVJ4/ref=sr_1_64?dib=eyJ2IjoiMSJ9.42G9aifQNOdaCCkAhoJcivug_1EHpXUat-_9sCPnmEQ6njfLLWxDBOB5iAMb2N4-xwFzZvLLVxzm1z0zbGRD89zyW-MDy8gZ2OaQ1dBmUyPN3y87AdqxrW9mxspDQQEl7WNYgcZ9etJclvMHSpbeB4GnTTzRlJ7n6yxmV4XFyqeDckqcohuqgC3ykRpuUGPYIkn5GnBWe4U7DbShAM3VV1triHH_cfjUT6XO0ZSpPeHBbdbujWON3CTP8TmnrlHtA9t0b9PjPbs5oG2kuACnB5OPe9iVzIX6SFwVx5gyATI.5rQM4JTmAdOj_G8kkz2TdXDZh1YcpdR2ip3unWdqVPU&dib_tag=se&keywords=tapis%2Baesthetic%2Bindie&qid=1763582450&sr=8-64&xpid=wwYeIyAFFlprL&th=1", 
        img: "https://m.media-amazon.com/images/I/51hhYQqkVuL._AC_.jpg" 
    },
    // Cadeau 7
    { 
        title: "Tapis aesthetic", 
        desc: "J'adooooore le style", 
        price: "67,20€", 
        link: "https://www.amazon.fr/PUIOKA-irr%C3%A9guli%C3%A8re-d%C3%A9coratifs-Simples-antid%C3%A9rapants/dp/B0CQRL14FB/ref=sr_1_117?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=3RF0K34RIY46A&dib=eyJ2IjoiMSJ9.M4IYLd7-C-4H380lPO1gQb-Se42TniTEfinYOxjWBA2ZJRFJHQZ7NPbt7wVsyBfcf3kUjACKTRz_r2CkfR5HS3KJzBm0VSNqmJbwoAxm6atI5r_johw90tC0FyeIh94rjEpKlIiXXAHZXF5jryxFMFJ-hfO2hMCV9fFVFXIr5dilJfa8ATJcX9CjDEvtM_8tGiH3RpvcTxacMSfj5PlRlE9sWdDyt8UznX0dwEsOa314G4OSrhywPsAmCvdA4NqySsIPEdl1urV5yOX2sUYSRxWaMlmsJFBO9vTk4xp3hFQ.z18Dk06enwikvFzzvR03yfMvlwzINyH_2bh1rsnl_ho&dib_tag=se&keywords=tapis+forme+aesthetic&qid=1763582554&sprefix=tapis+forme+aesthetic%2Caps%2C123&sr=8-117&xpid=saeTBmtkvYIIF", 
        img: "https://m.media-amazon.com/images/I/61O0TUV-TnL._AC_SX679_.jpg" 
    },
    // Cadeau 8
    { 
        title: "Reveil - Flip", 
        desc: "Reveile que tu retournes pour l'arreter", 
        price: "39,90€", 
        link: "https://www.amazon.fr/Lexon-Lumineux-r%C3%A9versible-Fonction-Rechargeable/dp/B0D3HRX2V7?th=1", 
        img: "https://m.media-amazon.com/images/I/51TLDio9d6L._AC_SX679_.jpg" 
    },
    // Cadeau 9
    { 
        title: "Plante - petite", 
        desc: "Petite plante sympa pour la déco", 
        price: "16,99€", 
        link: "https://www.amazon.fr/Laelfe-Artificielles-Tropicales-Int%C3%A9rieure-Ext%C3%A9rieure/dp/B0CMHBNHJG/ref=sr_1_50?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1K8XVLVC1GM01&dib=eyJ2IjoiMSJ9.PU8DQ1c9P8gDgE5j1neGMx-SW6OT4RmtxELg6zwIW0p5Rrnkh-Ptz3bfFYpaYV9GjooajPrjXPpcKPDsthN1DdtySFQXvzpSoI27rHk9JLn4CWZX1K4yl3TBiyUafeTmAoZuNVw_Tte5plluirq_NA1pxrzzZSCKG-gVW3_BezjIpKjckInA0-JyMBG6foq9_temCMAq3i7sgZNS66NZ1AvSKunZ6zLnTz9B4gVK3OrNKR8BoGoeCPFr9X5gUFwN.2WGyxTWX5B35pB2Bl2dnlYbZ6UkkQ1zkGwQ7f2pz4-s&dib_tag=se&keywords=fausses%2Bplantes%2Baesthetic&qid=1763583070&s=kitchen&sprefix=fausses%2Bplantes%2Baestethic%2Ckitchen%2C101&sr=1-50&xpid=eaThVOXzSN96N&th=1", 
        img: "https://m.media-amazon.com/images/I/71OdCng5o6L._AC_SX679_.jpg" 
    },
    // Cadeau 10
    { 
        title: "Plante - grande", 
        desc: "Grande plante sympa pour la déco", 
        price: "59,99€", 
        link: "https://www.amazon.fr/DOKKOME-Plante-artificielle-160-D%C3%A9coration/dp/B0F4XC55Y4/ref=sr_1_273?__mk_fr_FR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1K8XVLVC1GM01&dib=eyJ2IjoiMSJ9.7I9Ckb-ljw3wBvtd-fbfmXtxcvO1KodcmJ5LD21_pVuwU3EtuZi_0hpOzEKWaAG7LG02k-oRYVAG8YJ7vC2zNtb-bdStqChFttLQgFPzKBI.kwyRBWN-UxrtJ4ZAhkli7MHl1yPI7jExoLM3IxVCMAU&dib_tag=se&keywords=fausses%2Bplantes%2Baesthetic&qid=1763583157&s=kitchen&sprefix=fausses%2Bplantes%2Baestethic%2Ckitchen%2C101&sr=1-273&xpid=eaThVOXzSN96N&th=1", 
        img: "https://m.media-amazon.com/images/I/71mlTdfxUaL._AC_SX679_.jpg" 
    },
    // Cadeau 11
    { 
        title: "Chaussures - New Balance", 
        desc: "Taille 44", 
        price: "119,95€", 
        link: "https://www.zalando.fr/new-balance-740-unisex-baskets-basses-silver-coloured-ne215p05r-d11.html", 
        img: "https://img01.ztat.net/article/spp-media-p1/3c6a92e20c8047eeb56c140dee63423f/d3d37b9644d74fbfb5dddb32c973e76f.jpg?imwidth=1800" 
    },
    // Cadeau 12
    { 
        title: "Chaussures - New Balance", 
        desc: "Taille 44.5", 
        price: "110€", 
        link: "https://www.zalando.fr/new-balance-480-unisex-baskets-basses-navy-ne215p072-k11.html", 
        img: "https://img01.ztat.net/article/spp-media-p1/122abee8e30b4a9eb591626145f22334/84f614f4c94f42209c6d22fd321cecb8.jpg?imwidth=1800" 
    }
];

const clickableGroup = new THREE.Group();
const backgroundStarsGroup = new THREE.Group();
scene.add(clickableGroup);
scene.add(backgroundStarsGroup);


// --- 8. INTERACTION ---
let isSkyView = false;
let isFocusingGift = false;
let hoveredStar = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('star-tooltip');

window.addEventListener('mousemove', (event) => {
    if(!isSkyView || isFocusingGift) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, activeCamera);
    const hits = raycaster.intersectObjects(clickableGroup.children);
    const hitStar = hits.length > 0 ? hits[0] : null;
    if(hitStar) {
        if(hoveredStar !== hitStar.object) {
            if(hoveredStar) unhoverStar(hoveredStar);
            hoverStar(hitStar.object);
        }
    } else {
        if(hoveredStar) unhoverStar(hoveredStar);
    }
});

function hoverStar(star) {
    hoveredStar = star;
    document.body.style.cursor = 'pointer';
    gsap.to(star.scale, { x: 1.1, y: 1.1, duration: 0.3, ease: "back.out(1.7)" });
    star.material.color.setHex(0xffffff);
    const data = star.userData.gift;
    tooltip.style.backgroundImage = `url('${data.img}')`;
    tooltip.classList.add('active');
}

function unhoverStar(star) {
    if(!star) return;
    hoveredStar = null;
    document.body.style.cursor = 'default';
    gsap.to(star.scale, { x: 0.8, y: 0.8, duration: 0.3, ease: "power2.out" });
    star.material.color.setHex(0xffe066);
    tooltip.classList.remove('active');
}

function updateTooltipPosition() {
    if(hoveredStar && isSkyView && !isFocusingGift) {
        const vector = hoveredStar.position.clone();
        vector.project(activeCamera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = (-(vector.y * .5) + .5) * window.innerHeight;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }
}

window.addEventListener('click', (event) => {
    if(isFocusingGift) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, activeCamera);
    const intersectsTree = raycaster.intersectObjects(mainTreeGroup.children, true); 
    const hitMainStar = intersectsTree.find(h => h.object.name === "MainStar" || h.object.parent?.name === "MainStar");
    if(hitMainStar) { isSkyView ? goToTree() : goToSky(); return; }
    if(isSkyView && hoveredStar) {
        const starToFocus = hoveredStar;
        unhoverStar(starToFocus); 
        focusOnGift(starToFocus);
    }
});
document.getElementById('close-btn').addEventListener('click', closeGiftCard);


// --- 9. ANIMATION CAMÉRA ---
function goToSky() {
    isSkyView = true;
    document.getElementById('instruction').style.opacity = 0;
    
    persCamera.position.copy(orthoCamera.position);
    persCamera.rotation.copy(orthoCamera.rotation);
    persCamera.fov = 15; 
    persCamera.updateProjectionMatrix();
    activeCamera = persCamera;

    const tl = gsap.timeline();
    tl.to(persCamera.position, { x: 0, y: 2.0, z: 5.0, duration: 2.5, ease: "power2.inOut" }, 0);
    
    const camParams = { fov: 15, lookY: 1.5 };
    tl.to(camParams, { 
        fov: 60, lookY: 4.5, 
        duration: 2.5, ease: "power2.inOut",
        onUpdate: () => {
            persCamera.fov = camParams.fov;
            persCamera.updateProjectionMatrix();
            persCamera.lookAt(0, camParams.lookY, 0);
        }
    }, 0);
    
    tl.to(scene.background, { r: nightColor.r, g: nightColor.g, b: nightColor.b, duration: 2.5 }, 0);
    tl.to(scene.fog.color, { r: nightColor.r, g: nightColor.g, b: nightColor.b, duration: 2.5 }, 0);
    tl.to(scene.fog, { near: 50, far: 150, duration: 2.5 }, 0);

    if(clickableGroup.children.length === 0) {
        generateClickableStars();
        generateBackgroundStars();
    }
    clickableGroup.visible = true;
    backgroundStarsGroup.visible = true;
}

function goToTree() {
    isSkyView = false;
    document.getElementById('instruction').style.opacity = 1;
    unhoverStar(hoveredStar);
    
    const tl = gsap.timeline({ onComplete: () => { activeCamera = orthoCamera; } });
    tl.to(persCamera.position, { x: 10, y: 10, z: 10, duration: 2, ease: "power2.inOut" }, 0);
    
    const camParams = { fov: 60, lookY: 4.5 };
    tl.to(camParams, {
        fov: 15, lookY: 1.5, duration: 2, ease: "power2.inOut",
        onUpdate: () => {
            persCamera.fov = camParams.fov;
            persCamera.updateProjectionMatrix();
            persCamera.lookAt(0, camParams.lookY, 0);
        }
    }, 0);

    tl.to(scene.background, { r: dayColor.r, g: dayColor.g, b: dayColor.b, duration: 2 }, 0);
    tl.to(scene.fog.color, { r: fogColor.r, g: fogColor.g, b: fogColor.b, duration: 2 }, 0);
    tl.to(scene.fog, { near: 15, far: 50, duration: 2 }, 0);

    clickableGroup.visible = false;
    backgroundStarsGroup.visible = false;
}


// --- 10. ZOOM CADEAU ---
let camStateBeforeZoom = { pos: new THREE.Vector3(), target: new THREE.Vector3() };

function focusOnGift(sprite) {
    isFocusingGift = true;
    camStateBeforeZoom.pos.copy(persCamera.position);
    
    const data = sprite.userData.gift || {};
    
    const tl = gsap.timeline();
    tl.to(persCamera.position, {
        x: sprite.position.x, y: sprite.position.y, z: sprite.position.z + 2.5,
        duration: 1.5, ease: "power2.inOut"
    }, 0);

    const lookTarget = { x: 0, y: 4.5, z: 0 }; 
    tl.to(lookTarget, {
        x: sprite.position.x, y: sprite.position.y, z: sprite.position.z,
        duration: 1.5, ease: "power2.inOut",
        onUpdate: () => persCamera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z)
    }, 0);

    tl.call(() => {
        document.getElementById('gift-title').innerText = data.title;
        document.getElementById('gift-desc').innerText = data.desc;
        document.getElementById('gift-price').innerText = data.price;
        document.getElementById('card-main-image').style.backgroundImage = `url('${data.img}')`;
        
        const btn = document.getElementById('gift-link');
        if(data.link && data.link !== "#") { btn.href = data.link; btn.style.display="inline-block"; } 
        else btn.style.display="none";
        document.getElementById('gift-card').classList.add('visible');
    });
}

function closeGiftCard() {
    document.getElementById('gift-card').classList.remove('visible');
    const tl = gsap.timeline({ onComplete: () => { isFocusingGift = false; }});

    tl.to(persCamera.position, {
        x: camStateBeforeZoom.pos.x, y: camStateBeforeZoom.pos.y, z: camStateBeforeZoom.pos.z,
        duration: 1.5, ease: "power2.inOut"
    }, 0);

    const dir = new THREE.Vector3(); persCamera.getWorldDirection(dir);
    const curTarget = new THREE.Vector3().copy(persCamera.position).add(dir);
    const lookTarget = { x: curTarget.x, y: curTarget.y, z: curTarget.z };

    tl.to(lookTarget, {
        x: 0, y: 4.5, z: 0,
        duration: 1.5, ease: "power2.inOut",
        onUpdate: () => persCamera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z)
    }, 0);
}


// --- 11. GÉNÉRATION ÉTOILES (AVEC COLLISION) ---
function createStarTexture() {
    const c = document.createElement('canvas'); c.width=64; c.height=64;
    const ctx = c.getContext('2d');
    const cx=32, cy=32, oR=28, iR=12, spikes=5;
    let rot=Math.PI/2*3, x=cx, y=cy, step=Math.PI/spikes;
    ctx.beginPath(); ctx.moveTo(cx,cy-oR);
    for(let i=0;i<spikes;i++){
        x=cx+Math.cos(rot)*oR; y=cy+Math.sin(rot)*oR; ctx.lineTo(x,y); rot+=step;
        x=cx+Math.cos(rot)*iR; y=cy+Math.sin(rot)*iR; ctx.lineTo(x,y); rot+=step;
    }
    ctx.closePath();
    ctx.fillStyle='white'; ctx.fill(); ctx.shadowBlur=15; ctx.shadowColor="white"; ctx.fill();
    return new THREE.CanvasTexture(c);
}

function generateClickableStars() {
    const starTex = createStarTexture();
    const mat = new THREE.SpriteMaterial({ map: starTex, color: 0xffe066 });
    
    const generatedPositions = [];

    for(let i=0; i<12; i++) {
        const sprite = new THREE.Sprite(mat.clone());
        
        let valid = false;
        let attempts = 0;
        let rX, rY, rZ;
        const pos = new THREE.Vector3();

        // Boucle anti-collision
        while(!valid && attempts < 50) {
            rX = (Math.random() - 0.5) * 20; 
            rY = 4.5 + Math.random() * 6.5; 
            rZ = -5 + (Math.random() * 4); 
            pos.set(rX, rY, rZ);
            
            valid = true;
            for(const p of generatedPositions) {
                if(pos.distanceTo(p) < 2.5) { // Distance minimale
                    valid = false;
                    break;
                }
            }
            attempts++;
        }
        generatedPositions.push(pos);

        sprite.position.copy(pos);
        sprite.scale.set(0.8, 0.8, 1);
        sprite.userData = { 
            gift: giftsData[i % giftsData.length],
            originalY: rY, 
            timeOffset: Math.random() * 100 
        };
        clickableGroup.add(sprite);
    }
}

function generateBackgroundStars() {
    const starTex = createStarTexture();
    const bgMat = new THREE.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true, opacity: 0.3 });
    for(let i=0; i<800; i++) {
        const s = new THREE.Sprite(bgMat.clone());
        const r = 30 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random()) * 0.9;
        s.position.x = r * Math.sin(phi) * Math.cos(theta);
        s.position.y = r * Math.cos(phi);
        s.position.z = r * Math.sin(phi) * Math.sin(theta);
        const sz = 0.1 + Math.random() * 0.4;
        s.scale.set(sz, sz, 1);
        s.material.opacity = 0.1 + Math.random() * 0.5;
        s.userData = { speed: Math.random() * 3 };
        backgroundStarsGroup.add(s);
    }
}


// --- 12. LOOP ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    
    if(!isSkyView) mainTreeGroup.rotation.y += 0.005;

    if(isSkyView) {
        clickableGroup.children.forEach(star => {
            if(star !== hoveredStar) {
                star.position.y = star.userData.originalY + Math.sin(time + star.userData.timeOffset) * 0.1;
            }
        });
        updateTooltipPosition();
        backgroundStarsGroup.children.forEach(star => {
             star.material.opacity = 0.3 + Math.sin(time * star.userData.speed) * 0.2;
        });
    }
    
    renderer.render(scene, activeCamera);
}
animate();

window.addEventListener('resize', () => {
    const a = window.innerWidth / window.innerHeight;
    orthoCamera.left = frustumSize * a / -2; orthoCamera.right = frustumSize * a / 2;
    orthoCamera.top = frustumSize / 2; orthoCamera.bottom = frustumSize / -2;
    orthoCamera.updateProjectionMatrix();
    persCamera.aspect = a; persCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});