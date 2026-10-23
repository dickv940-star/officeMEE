import * as THREE from 'three';
import { AgentCharacter, AgentStatus } from '../../types/office';

export interface HumanoidBones {
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  rightUpperArm: THREE.Group;
  leftLowerArm: THREE.Group;
  rightLowerArm: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftFingers: THREE.Group;
  rightFingers: THREE.Group;
  leftUpperLeg: THREE.Group;
  rightUpperLeg: THREE.Group;
  leftLowerLeg: THREE.Group;
  rightLowerLeg: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
}

export interface HumanoidCharacterInstance {
  id: string;
  group: THREE.Group;
  bones: HumanoidBones;
  statusAura: THREE.Mesh;
  statusBadge: THREE.Sprite;
  currentPoseName: string;
  config: AgentCharacter;
  meshParts: THREE.Object3D[];
  dispose: () => void;
}

// Procedural textures generator for clothing, badges, and status
const sharedMaterialsCache = new Map<string, THREE.Material>();

function getProceduralFabricTexture(colorHex: number, pattern: 'suit' | 'weave' | 'knit'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const baseCol = new THREE.Color(colorHex);
  ctx.fillStyle = `#${baseCol.getHexString()}`;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let x = 0; x < 128; x += 4) {
    ctx.fillRect(x, 0, 2, 128);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  for (let y = 0; y < 128; y += 4) {
    ctx.fillRect(0, y, 128, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStatusBadgeTexture(name: string, role: string, status: AgentStatus): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 80);

  // Rounded pill background
  const r = 16;
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 72, r);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fill();

  let accentColor = '#38bdf8'; // cyan
  if (status === 'thinking') accentColor = '#a855f7'; // purple
  else if (status === 'working') accentColor = '#3b82f6'; // blue
  else if (status === 'success') accentColor = '#10b981'; // emerald
  else if (status === 'failure') accentColor = '#ef4444'; // rose
  else if (status === 'waiting_approval') accentColor = '#f59e0b'; // amber

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Status dot
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(28, 40, 7, 0, Math.PI * 2);
  ctx.fill();

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(name.split(' ')[0], 46, 36);

  // Status text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "JetBrains Mono", monospace';
  const displayStatus = status.replace('_', ' ').toUpperCase();
  ctx.fillText(displayStatus, 46, 56);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHumanoidCharacter(config: AgentCharacter): HumanoidCharacterInstance {
  const root = new THREE.Group();
  root.name = `character_${config.id}`;
  const meshParts: THREE.Object3D[] = [];

  // PBR Materials setup
  const skinMat = new THREE.MeshStandardMaterial({
    color: config.visual.skinColor,
    roughness: 0.75,
    metalness: 0.05
  });

  const suitTexture = getProceduralFabricTexture(config.visual.suitColor, 'suit');
  const suitMat = new THREE.MeshStandardMaterial({
    map: suitTexture,
    color: config.visual.suitColor,
    roughness: 0.65,
    metalness: 0.1
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: config.visual.accentColor,
    roughness: 0.7,
    metalness: 0.08
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: config.visual.hairColor,
    roughness: 0.85,
    metalness: 0.1
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.4
  });

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const glassesMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.8,
    clearcoat: 1.0
  });

  // Hips / Pelvis
  const hips = new THREE.Group();
  hips.name = 'hips';
  hips.position.set(0, 0.95, 0); // standing hip height
  root.add(hips);

  const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.18, 12);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);
  meshParts.push(pelvisMesh);

  // Charlotte's 3D Pencil Skirt
  if (config.visual.hasSkirt) {
    const skirtGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.42, 16);
    skirtGeo.translate(0, -0.21, 0);
    const skirtMesh = new THREE.Mesh(skirtGeo, pantsMat);
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);
    meshParts.push(skirtMesh);
  }

  // Spine
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.1, 0);
  hips.add(spine);

  const lowerTorsoGeo = new THREE.CylinderGeometry(0.19, 0.18, 0.16, 12);
  const lowerTorsoMesh = new THREE.Mesh(lowerTorsoGeo, suitMat);
  lowerTorsoMesh.position.set(0, 0.08, 0);
  lowerTorsoMesh.castShadow = true;
  spine.add(lowerTorsoMesh);
  meshParts.push(lowerTorsoMesh);

  // Chest
  const chest = new THREE.Group();
  chest.name = 'chest';
  chest.position.set(0, 0.16, 0);
  spine.add(chest);

  const chestGeo = new THREE.BoxGeometry(0.38, 0.28, 0.22);
  const chestMesh = new THREE.Mesh(chestGeo, suitMat);
  chestMesh.position.set(0, 0.14, 0);
  chestMesh.castShadow = true;
  chest.add(chestMesh);
  meshParts.push(chestMesh);

  // Shirt collar insert
  const collarGeo = new THREE.BoxGeometry(0.14, 0.22, 0.02);
  const shirtColor = config.visual.shirtColor || 0xffffff;
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 });
  const collarMesh = new THREE.Mesh(collarGeo, shirtMat);
  collarMesh.position.set(0, 0.16, 0.115);
  chest.add(collarMesh);

  // Optional Necktie (William: black tie, Alexander: blue tie)
  if (config.visual.hasTie) {
    const tieMat = new THREE.MeshStandardMaterial({
      color: config.visual.tieColor || 0x1e3a8a,
      roughness: 0.45,
      metalness: 0.1
    });
    const tieKnot = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.045, 4), tieMat);
    tieKnot.rotation.x = Math.PI;
    tieKnot.position.set(0, 0.24, 0.13);
    const tieBlade = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.22, 0.015), tieMat);
    tieBlade.position.set(0, 0.12, 0.13);
    chest.add(tieKnot, tieBlade);
    meshParts.push(tieKnot, tieBlade);
  }

  // Character-specific chest accessories matching 9 PNG source artworks
  if (config.id === 'william-bigboss') {
    // Executive Director Gold Lapel Pin & Pocket Square
    const pinGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.006, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 });
    const pin = new THREE.Mesh(pinGeo, goldMat);
    pin.rotation.x = Math.PI / 2;
    pin.position.set(0.12, 0.22, 0.12);
    const pocketSquare = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.015, 0.008),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    pocketSquare.position.set(0.12, 0.16, 0.12);
    chest.add(pin, pocketSquare);
    meshParts.push(pin, pocketSquare);
  } else if (config.id === 'charlotte-quality-controller') {
    // Elegant Gold Necklace & Pendant
    const necklaceGeo = new THREE.TorusGeometry(0.072, 0.004, 6, 16);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    const necklace = new THREE.Mesh(necklaceGeo, goldMat);
    necklace.rotation.x = Math.PI / 2.2;
    necklace.position.set(0, 0.25, 0.06);
    const pendant = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.016, 4), goldMat);
    pendant.rotation.x = Math.PI;
    pendant.position.set(0, 0.17, 0.125);
    chest.add(necklace, pendant);
    meshParts.push(necklace, pendant);
  } else if (config.id === 'lucas-automation-engineer') {
    // Engineering Lanyard & Access Keycard
    const lanyardMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.24, 0.004), lanyardMat);
    strapL.rotation.z = -0.15;
    strapL.position.set(-0.04, 0.2, 0.12);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.24, 0.004), lanyardMat);
    strapR.rotation.z = 0.15;
    strapR.position.set(0.04, 0.2, 0.12);
    const idBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.006),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 })
    );
    idBadge.position.set(0, 0.06, 0.125);
    chest.add(strapL, strapR, idBadge);
    meshParts.push(strapL, strapR, idBadge);
  } else if (config.id === 'sophia-content-creator') {
    // Chic oversized beige blazer lapels
    const lapelMat = new THREE.MeshStandardMaterial({ color: 0xd6c7b2, roughness: 0.7 });
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.015), lapelMat);
    lapelL.rotation.z = -0.18;
    lapelL.position.set(0.12, 0.14, 0.12);
    const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.015), lapelMat);
    lapelR.rotation.z = 0.18;
    lapelR.position.set(-0.12, 0.14, 0.12);
    chest.add(lapelL, lapelR);
    meshParts.push(lapelL, lapelR);
  } else {
    // Modern minimal security badge
    const badgeGeo = new THREE.BoxGeometry(0.05, 0.035, 0.008);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0.11, 0.18, 0.12);
    chest.add(badgeMesh);
    meshParts.push(badgeMesh);
  }

  // Neck
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.29, 0);
  chest.add(neck);

  const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.set(0, 0.04, 0);
  neck.add(neckMesh);
  meshParts.push(neckMesh);

  // Head
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.1, 0);
  neck.add(head);

  // Stylized professional head
  const headGeo = new THREE.SphereGeometry(0.14, 16, 16);
  headGeo.scale(1, 1.22, 1.05);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 0.12, 0);
  headMesh.castShadow = true;
  head.add(headMesh);
  meshParts.push(headMesh);

  // Hair styles matching the 9 GitHub PNG portraits
  const hairGroup = new THREE.Group();
  hairGroup.position.set(0, 0.14, -0.02);
  if (config.visual.hairStyle === 'long_straight') {
    // Olivia: Long sleek straight dark hair cascading past shoulders
    const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), hairMat);
    topHair.scale.set(1.04, 1.15, 1.08);
    const leftLong = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 10), hairMat);
    leftLong.position.set(0.12, -0.16, 0.02);
    const rightLong = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 10), hairMat);
    rightLong.position.set(-0.12, -0.16, 0.02);
    const backLong = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 12), hairMat);
    backLong.position.set(0, -0.18, -0.08);
    hairGroup.add(topHair, leftLong, rightLong, backLong);
  } else if (config.visual.hairStyle === 'wavy') {
    // Isabella & Charlotte: Wavy voluminous shoulder hair
    const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.152, 14, 14), hairMat);
    topHair.scale.set(1.06, 1.18, 1.12);
    const leftWave = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.38, 10), hairMat);
    leftWave.position.set(0.13, -0.12, 0.01);
    leftWave.rotation.z = -0.15;
    const rightWave = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.38, 10), hairMat);
    rightWave.position.set(-0.13, -0.12, 0.01);
    rightWave.rotation.z = 0.15;
    hairGroup.add(topHair, leftWave, rightWave);
  } else if (config.visual.hairStyle === 'shoulder_layered') {
    // Sophia: Layered chic shoulder cut
    const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), hairMat);
    topHair.scale.set(1.05, 1.15, 1.1);
    const midHair = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 0.28, 12), hairMat);
    midHair.position.set(0, -0.08, -0.03);
    hairGroup.add(topHair, midHair);
  } else if (config.visual.hairStyle === 'center_part') {
    // Alexander: Center-parted curtains style
    const mainHair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), hairMat);
    mainHair.scale.set(1.04, 1.14, 1.08);
    const leftBangs = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), hairMat);
    leftBangs.position.set(0.06, 0.08, 0.12);
    leftBangs.rotation.z = -0.3;
    const rightBangs = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), hairMat);
    rightBangs.position.set(-0.06, 0.08, 0.12);
    rightBangs.rotation.z = 0.3;
    hairGroup.add(mainHair, leftBangs, rightBangs);
  } else if (config.visual.hairStyle === 'short_fade') {
    // William, Lucas, Daniel: Clean modern fade
    const fade = new THREE.Mesh(new THREE.SphereGeometry(0.148, 14, 14), hairMat);
    fade.scale.set(1.02, 1.14, 1.04);
    fade.position.set(0, 0.04, 0);
    hairGroup.add(fade);
  } else {
    // Slick / Ethan / classic
    const slick = new THREE.Mesh(new THREE.SphereGeometry(0.148, 14, 14), hairMat);
    slick.scale.set(1.03, 1.14, 1.1);
    hairGroup.add(slick);
  }
  head.add(hairGroup);
  meshParts.push(hairGroup);

  // Subtle mouth / lipstick
  const mouthColor = config.visual.lipstickColor || 0xb87373;
  const mouthMat = new THREE.MeshStandardMaterial({ color: mouthColor, roughness: 0.5 });
  const mouthGeo = new THREE.BoxGeometry(0.045, 0.012, 0.01);
  const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
  mouthMesh.position.set(0, 0.05, 0.142);
  head.add(mouthMesh);

  // Eyes & Eyelids (for natural blinking and saccades)
  const leftEye = new THREE.Group();
  leftEye.name = 'leftEye';
  leftEye.position.set(0.048, 0.13, 0.128);
  head.add(leftEye);

  const eyeGeo = new THREE.SphereGeometry(0.022, 10, 10);
  const leftEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), pupilMat);
  leftPupil.position.set(0, 0, 0.014);
  leftEye.add(leftEyeWhite, leftPupil);

  const eyelidGeo = new THREE.SphereGeometry(0.025, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const leftEyelid = new THREE.Mesh(eyelidGeo, skinMat);
  leftEyelid.rotation.x = -Math.PI * 0.5; // open
  leftEye.add(leftEyelid);

  const rightEye = new THREE.Group();
  rightEye.name = 'rightEye';
  rightEye.position.set(-0.048, 0.13, 0.128);
  head.add(rightEye);

  const rightEyeWhite = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), pupilMat);
  rightPupil.position.set(0, 0, 0.014);
  rightEye.add(rightEyeWhite, rightPupil);

  const rightEyelid = new THREE.Mesh(eyelidGeo, skinMat);
  rightEyelid.rotation.x = -Math.PI * 0.5; // open
  rightEye.add(rightEyelid);

  // Optional designer glasses
  if (config.visual.hasGlasses) {
    const glasses = new THREE.Group();
    const frameGeo = new THREE.TorusGeometry(0.03, 0.005, 8, 16);
    const leftFrame = new THREE.Mesh(frameGeo, glassesMat);
    leftFrame.position.set(0.048, 0.13, 0.142);
    const rightFrame = new THREE.Mesh(frameGeo, glassesMat);
    rightFrame.position.set(-0.048, 0.13, 0.142);
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 6), glassesMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.132, 0.144);
    glasses.add(leftFrame, rightFrame, bridge);
    head.add(glasses);
    meshParts.push(glasses);
  }

  // Shoulders & Arms
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'leftShoulder';
  leftShoulder.position.set(0.22, 0.24, 0);
  chest.add(leftShoulder);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'leftUpperArm';
  leftUpperArm.position.set(0.05, 0, 0);
  leftShoulder.add(leftUpperArm);

  const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.28, 10);
  upperArmGeo.translate(0, -0.14, 0);
  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, suitMat);
  leftUpperArmMesh.castShadow = true;
  leftUpperArm.add(leftUpperArmMesh);
  meshParts.push(leftUpperArmMesh);

  const leftLowerArm = new THREE.Group();
  leftLowerArm.name = 'leftLowerArm';
  leftLowerArm.position.set(0, -0.28, 0);
  leftUpperArm.add(leftLowerArm);

  const lowerArmGeo = new THREE.CylinderGeometry(0.046, 0.04, 0.26, 10);
  lowerArmGeo.translate(0, -0.13, 0);
  const lowerArmMat = config.visual.shortSleeves ? skinMat : suitMat;
  const leftLowerArmMesh = new THREE.Mesh(lowerArmGeo, lowerArmMat);
  leftLowerArmMesh.castShadow = true;
  leftLowerArm.add(leftLowerArmMesh);
  meshParts.push(leftLowerArmMesh);

  // Wristwatch for Daniel (SEO Specialist)
  if (config.id === 'daniel-seo-specialist') {
    const watchBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.024, 12),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6 })
    );
    watchBand.position.set(0, -0.22, 0);
    const watchBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.008, 10),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.2, metalness: 0.8 })
    );
    watchBezel.rotation.x = Math.PI / 2;
    watchBezel.position.set(0, -0.22, 0.048);
    leftLowerArm.add(watchBand, watchBezel);
    meshParts.push(watchBand, watchBezel);
  }

  const leftHand = new THREE.Group();
  leftHand.name = 'leftHand';
  leftHand.position.set(0, -0.26, 0);
  leftLowerArm.add(leftHand);

  const handGeo = new THREE.BoxGeometry(0.065, 0.08, 0.035);
  handGeo.translate(0, -0.04, 0);
  const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
  leftHand.add(leftHandMesh);
  meshParts.push(leftHandMesh);

  // Digital Tablet for Olivia & Lucas
  if (config.visual.holdingTablet) {
    const tabletGeo = new THREE.BoxGeometry(0.24, 0.32, 0.015);
    const tabletMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2, metalness: 0.8 });
    const tabletMesh = new THREE.Mesh(tabletGeo, tabletMat);
    const tabletScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.21, 0.28),
      new THREE.MeshBasicMaterial({ color: config.id === 'lucas-automation-engineer' ? 0x06b6d4 : 0x38bdf8 })
    );
    tabletScreen.position.z = 0.01;
    tabletMesh.add(tabletScreen);
    tabletMesh.rotation.x = -Math.PI / 3;
    tabletMesh.position.set(0.05, -0.06, 0.12);
    leftHand.add(tabletMesh);
    meshParts.push(tabletMesh);
  } else if (config.id === 'ethan-marketing-strategist') {
    // Marketing Strategy Dossier / Presentation Folder
    const folderGeo = new THREE.BoxGeometry(0.22, 0.3, 0.02);
    const folderMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
    const folder = new THREE.Mesh(folderGeo, folderMat);
    folder.rotation.x = -Math.PI / 3.2;
    folder.position.set(0.04, -0.06, 0.1);
    leftHand.add(folder);
    meshParts.push(folder);
  }

  const leftFingers = new THREE.Group();
  leftFingers.position.set(0, -0.08, 0);
  const fingerGeo = new THREE.BoxGeometry(0.06, 0.04, 0.02);
  fingerGeo.translate(0, -0.02, 0);
  const leftFingersMesh = new THREE.Mesh(fingerGeo, skinMat);
  leftFingers.add(leftFingersMesh);
  leftHand.add(leftFingers);

  // Right Arm
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'rightShoulder';
  rightShoulder.position.set(-0.22, 0.24, 0);
  chest.add(rightShoulder);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'rightUpperArm';
  rightUpperArm.position.set(-0.05, 0, 0);
  rightShoulder.add(rightUpperArm);

  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, suitMat);
  rightUpperArmMesh.castShadow = true;
  rightUpperArm.add(rightUpperArmMesh);
  meshParts.push(rightUpperArmMesh);

  const rightLowerArm = new THREE.Group();
  rightLowerArm.name = 'rightLowerArm';
  rightLowerArm.position.set(0, -0.28, 0);
  rightUpperArm.add(rightLowerArm);

  const rightLowerArmMesh = new THREE.Mesh(lowerArmGeo, lowerArmMat);
  rightLowerArmMesh.castShadow = true;
  rightLowerArm.add(rightLowerArmMesh);
  meshParts.push(rightLowerArmMesh);

  const rightHand = new THREE.Group();
  rightHand.name = 'rightHand';
  rightHand.position.set(0, -0.26, 0);
  rightLowerArm.add(rightHand);

  const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
  rightHand.add(rightHandMesh);
  meshParts.push(rightHandMesh);

  // Digital Stylus Pen for Isabella (Graphic Designer)
  if (config.id === 'isabella-graphic-designer') {
    const penGeo = new THREE.CylinderGeometry(0.005, 0.003, 0.16, 8);
    const penMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.2, metalness: 0.8 });
    const pen = new THREE.Mesh(penGeo, penMat);
    pen.rotation.x = Math.PI / 4;
    pen.position.set(0.02, -0.04, 0.04);
    rightHand.add(pen);
    meshParts.push(pen);
  }

  const rightFingers = new THREE.Group();
  rightFingers.position.set(0, -0.08, 0);
  const rightFingersMesh = new THREE.Mesh(fingerGeo, skinMat);
  rightFingers.add(rightFingersMesh);
  rightHand.add(rightFingers);

  // Legs & Feet (skirt-aware)
  const legMat = config.visual.hasSkirt ? skinMat : pantsMat;

  const legGeo = new THREE.CylinderGeometry(0.082, 0.068, 0.44, 10);
  legGeo.translate(0, -0.22, 0);

  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.name = 'leftUpperLeg';
  leftUpperLeg.position.set(0.1, -0.05, 0);
  hips.add(leftUpperLeg);

  const leftUpperLegMesh = new THREE.Mesh(legGeo, legMat);
  leftUpperLegMesh.castShadow = true;
  leftUpperLeg.add(leftUpperLegMesh);
  meshParts.push(leftUpperLegMesh);

  const lowerLegGeo = new THREE.CylinderGeometry(0.066, 0.052, 0.42, 10);
  lowerLegGeo.translate(0, -0.21, 0);

  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.name = 'leftLowerLeg';
  leftLowerLeg.position.set(0, -0.44, 0);
  leftUpperLeg.add(leftLowerLeg);

  const leftLowerLegMesh = new THREE.Mesh(lowerLegGeo, legMat);
  leftLowerLegMesh.castShadow = true;
  leftLowerLeg.add(leftLowerLegMesh);
  meshParts.push(leftLowerLegMesh);

  // Specialized shoes: sneakers (Alexander), heels (Charlotte/Sophia), flats (Olivia), oxfords
  const leftFoot = new THREE.Group();
  leftFoot.name = 'leftFoot';
  leftFoot.position.set(0, -0.42, 0);
  leftLowerLeg.add(leftFoot);

  if (config.visual.shoeType === 'sneakers') {
    // Alexander: White leather sneakers with gum/tan sole accent
    const sneakerGeo = new THREE.BoxGeometry(0.095, 0.06, 0.22);
    sneakerGeo.translate(0, -0.03, 0.06);
    const sneakerMesh = new THREE.Mesh(sneakerGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    sneakerMesh.castShadow = true;
    const soleGeo = new THREE.BoxGeometry(0.1, 0.02, 0.23);
    soleGeo.translate(0, -0.06, 0.06);
    const soleMesh = new THREE.Mesh(soleGeo, new THREE.MeshStandardMaterial({ color: 0xc89d7c, roughness: 0.7 }));
    leftFoot.add(sneakerMesh, soleMesh);
    meshParts.push(sneakerMesh, soleMesh);
  } else if (config.visual.shoeType === 'heels') {
    // Charlotte & Sophia: High heel pump
    const pumpGeo = new THREE.BoxGeometry(0.08, 0.05, 0.18);
    pumpGeo.translate(0, -0.025, 0.05);
    const pumpMesh = new THREE.Mesh(pumpGeo, shoeMat);
    const heelPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.07, 8),
      shoeMat
    );
    heelPost.position.set(0, -0.06, -0.02);
    leftFoot.add(pumpMesh, heelPost);
    meshParts.push(pumpMesh, heelPost);
  } else {
    // Oxford dress shoes & flats
    const footGeo = new THREE.BoxGeometry(0.09, 0.07, 0.22);
    footGeo.translate(0, -0.035, 0.06);
    const leftFootMesh = new THREE.Mesh(footGeo, shoeMat);
    leftFootMesh.castShadow = true;
    leftFoot.add(leftFootMesh);
    meshParts.push(leftFootMesh);
  }

  // Right Leg
  const rightUpperLeg = new THREE.Group();
  rightUpperLeg.name = 'rightUpperLeg';
  rightUpperLeg.position.set(-0.1, -0.05, 0);
  hips.add(rightUpperLeg);

  const rightUpperLegMesh = new THREE.Mesh(legGeo, legMat);
  rightUpperLegMesh.castShadow = true;
  rightUpperLeg.add(rightUpperLegMesh);
  meshParts.push(rightUpperLegMesh);

  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.name = 'rightLowerLeg';
  rightLowerLeg.position.set(0, -0.44, 0);
  rightUpperLeg.add(rightLowerLeg);

  const rightLowerLegMesh = new THREE.Mesh(lowerLegGeo, legMat);
  rightLowerLegMesh.castShadow = true;
  rightLowerLeg.add(rightLowerLegMesh);
  meshParts.push(rightLowerLegMesh);

  const rightFoot = new THREE.Group();
  rightFoot.name = 'rightFoot';
  rightFoot.position.set(0, -0.42, 0);
  rightLowerLeg.add(rightFoot);

  if (config.visual.shoeType === 'sneakers') {
    const sneakerGeo = new THREE.BoxGeometry(0.095, 0.06, 0.22);
    sneakerGeo.translate(0, -0.03, 0.06);
    const sneakerMesh = new THREE.Mesh(sneakerGeo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    sneakerMesh.castShadow = true;
    const soleGeo = new THREE.BoxGeometry(0.1, 0.02, 0.23);
    soleGeo.translate(0, -0.06, 0.06);
    const soleMesh = new THREE.Mesh(soleGeo, new THREE.MeshStandardMaterial({ color: 0xc89d7c, roughness: 0.7 }));
    rightFoot.add(sneakerMesh, soleMesh);
    meshParts.push(sneakerMesh, soleMesh);
  } else if (config.visual.shoeType === 'heels') {
    const pumpGeo = new THREE.BoxGeometry(0.08, 0.05, 0.18);
    pumpGeo.translate(0, -0.025, 0.05);
    const pumpMesh = new THREE.Mesh(pumpGeo, shoeMat);
    const heelPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.07, 8),
      shoeMat
    );
    heelPost.position.set(0, -0.06, -0.02);
    rightFoot.add(pumpMesh, heelPost);
    meshParts.push(pumpMesh, heelPost);
  } else {
    const footGeo = new THREE.BoxGeometry(0.09, 0.07, 0.22);
    footGeo.translate(0, -0.035, 0.06);
    const rightFootMesh = new THREE.Mesh(footGeo, shoeMat);
    rightFootMesh.castShadow = true;
    rightFoot.add(rightFootMesh);
    meshParts.push(rightFootMesh);
  }

  // Status Floor LED Ring Aura
  const auraGeo = new THREE.RingGeometry(0.45, 0.52, 32);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const statusAura = new THREE.Mesh(auraGeo, auraMat);
  statusAura.rotation.x = -Math.PI / 2;
  statusAura.position.y = 0.02; // flush on ground without z-fighting
  root.add(statusAura);

  // Hovering Holographic Status Badge Sprite
  const badgeTexture = createStatusBadgeTexture(config.name, config.role, config.status);
  const badgeSpriteMat = new THREE.SpriteMaterial({
    map: badgeTexture,
    transparent: true,
    depthTest: false
  });
  const statusBadge = new THREE.Sprite(badgeSpriteMat);
  statusBadge.scale.set(0.7, 0.22, 1);
  statusBadge.position.set(0, 1.95, 0);
  root.add(statusBadge);

  const bones: HumanoidBones = {
    hips,
    spine,
    chest,
    neck,
    head,
    leftEye,
    rightEye,
    leftEyelid,
    rightEyelid,
    leftShoulder,
    rightShoulder,
    leftUpperArm,
    rightUpperArm,
    leftLowerArm,
    rightLowerArm,
    leftHand,
    rightHand,
    leftFingers,
    rightFingers,
    leftUpperLeg,
    rightUpperLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftFoot,
    rightFoot
  };

  const dispose = () => {
    suitTexture.dispose();
    badgeTexture.dispose();
    skinMat.dispose();
    suitMat.dispose();
    pantsMat.dispose();
    hairMat.dispose();
    shoeMat.dispose();
    auraMat.dispose();
    badgeSpriteMat.dispose();
  };

  return {
    id: config.id,
    group: root,
    bones,
    statusAura,
    statusBadge,
    currentPoseName: 'idle_seated',
    config,
    meshParts,
    dispose
  };
}

export function updateStatusAura(instance: HumanoidCharacterInstance, status: AgentStatus) {
  let col = 0x38bdf8;
  if (status === 'thinking') col = 0xa855f7;
  else if (status === 'working') col = 0x3b82f6;
  else if (status === 'success') col = 0x10b981;
  else if (status === 'failure') col = 0xef4444;
  else if (status === 'waiting_approval') col = 0xf59e0b;

  (instance.statusAura.material as THREE.MeshBasicMaterial).color.setHex(col);

  // Re-render sprite texture
  const newTexture = createStatusBadgeTexture(instance.config.name, instance.config.role, status);
  const oldTexture = (instance.statusBadge.material as THREE.SpriteMaterial).map;
  if (oldTexture) oldTexture.dispose();
  (instance.statusBadge.material as THREE.SpriteMaterial).map = newTexture;
  (instance.statusBadge.material as THREE.SpriteMaterial).needsUpdate = true;
}
