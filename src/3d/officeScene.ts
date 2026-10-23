import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AgentCharacter, AgentPose, AgentStatus, CameraPreset, OfficeTelemetry } from '../types/office';
import { createHumanoidCharacter, HumanoidCharacterInstance, updateStatusAura } from './character/humanoidRig';
import { CharacterAnimationController } from './character/animationEngine';

export interface OfficeSceneOptions {
  container: HTMLDivElement;
  agents: AgentCharacter[];
  onSelectAgent: (agentId: string) => void;
  onTelemetryUpdate: (telemetry: OfficeTelemetry) => void;
}

// Pre-allocated vectors for smooth camera transition
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export class OfficeScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number = 0;
  private isDisposed: boolean = false;
  private clock: THREE.Clock;

  private characters: Map<string, HumanoidCharacterInstance> = new Map();
  private animControllers: Map<string, CharacterAnimationController> = new Map();

  private isSoftwareGl: boolean = false;
  private gpuRendererName: string = 'Unknown';
  private onSelectAgent: (agentId: string) => void;
  private onTelemetryUpdate: (telemetry: OfficeTelemetry) => void;

  // Camera transition state
  private isTransitioningCamera: boolean = false;
  private cameraTransitionProgress: number = 1.0;
  private cameraStartPos = new THREE.Vector3();
  private cameraStartTarget = new THREE.Vector3();
  private currentCameraTarget = new THREE.Vector3(0, 0.8, 0);

  // Performance telemetry
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;
  private currentFrameTime: number = 16.6;

  // Interactive raycasting
  private hoveredAgentId: string | null = null;
  private screenPresentationCanvasTexture: THREE.CanvasTexture | null = null;

  constructor(options: OfficeSceneOptions) {
    this.container = options.container;
    this.onSelectAgent = options.onSelectAgent;
    this.onTelemetryUpdate = options.onTelemetryUpdate;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL / GPU probe following Three.js guidelines
    this.detectGPUCapabilities();

    // 2. Initialize Three.js scene & renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.045);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    this.camera.position.set(0, 6.5, 9.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below floor
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 24.0;
    this.controls.target.set(0, 0.8, 0);

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Build Environment & Architecture
    this.setupLighting();
    this.buildOfficeArchitecture();

    // 6. Spawn Characters
    this.spawnCharacters(options.agents);

    // 7. Event listeners
    this.bindEvents();

    // 8. Start Render Loop
    this.lastFpsTime = performance.now();
    this.animate();
  }

  private detectGPUCapabilities() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        this.isSoftwareGl = true;
        this.gpuRendererName = 'WebGL Fallback';
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      this.gpuRendererName = String(gl.getParameter(param) || 'Standard GPU');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(this.gpuRendererName);
    } catch {
      this.isSoftwareGl = true;
      this.gpuRendererName = 'Software Emulated';
    }
  }

  private setupLighting() {
    // Cool/warm Hemisphere Light fill
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    // Key Directional Sunlight with soft shadows
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Soft Cyan/Blue Rim Light from stage side
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-8, 5, -6);
    this.scene.add(rimLight);

    // Presentation Stage Spotlight
    const stageSpot = new THREE.SpotLight(0x60a5fa, 2.0, 14, Math.PI / 4, 0.5, 1);
    stageSpot.position.set(0, 6, 2.5);
    stageSpot.target.position.set(0, 1.2, -3.2);
    this.scene.add(stageSpot);
    this.scene.add(stageSpot.target);
  }

  private buildOfficeArchitecture() {
    // 1. Acoustic Floor
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#111827'; // slate 900
    fctx.fillRect(0, 0, 256, 256);
    fctx.fillStyle = '#1f2937';
    for (let x = 0; x < 256; x += 32) {
      fctx.fillRect(x, 0, 1, 256);
    }
    for (let y = 0; y < 256; y += 32) {
      fctx.fillRect(0, y, 256, 1);
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const floorGeo = new THREE.PlaneGeometry(30, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !this.isSoftwareGl;
    this.scene.add(floor);

    // 2. Stage Wood Inset Floor
    const stageGeo = new THREE.BoxGeometry(6.4, 0.08, 4.2);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.2
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.04, -3.4);
    stage.receiveShadow = !this.isSoftwareGl;
    this.scene.add(stage);

    // 3. Stage 16:9 Presentation Board
    this.buildPresentationBoard();

    // 4. Back Wall with acoustic wood slats
    const wallGeo = new THREE.BoxGeometry(28, 7, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.05
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3.5, -6.5);
    backWall.receiveShadow = !this.isSoftwareGl;
    this.scene.add(backWall);

    // Glass side partitions
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5
    });
    const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 12), glassMat);
    leftGlass.position.set(-9.5, 2.25, 0);
    this.scene.add(leftGlass);

    const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 12), glassMat);
    rightGlass.position.set(9.5, 2.25, 0);
    this.scene.add(rightGlass);

    // 5. Workstations Desks & Chairs for all 9 characters
    // Team Cluster Left
    this.createWorkstation(-5.2, 0.8, 'code');   // Alexander (Data Analyst)
    this.createWorkstation(-5.2, 3.8, 'design'); // Olivia (Product Researcher)
    this.createWorkstation(-1.8, 0.8, 'infra');  // Ethan (Marketing Strategist)
    this.createWorkstation(-1.8, 3.8, 'design'); // Sophia (Content Creator)

    // Team Cluster Right
    this.createWorkstation(1.8, 0.8, 'code');    // Daniel (SEO Specialist)
    this.createWorkstation(1.8, 3.8, 'design');  // Isabella (Graphic Designer)
    this.createWorkstation(5.2, 0.8, 'infra');   // Lucas (Automation Engineer)
    this.createWorkstation(5.2, 3.8, 'qa');      // Charlotte (Quality Controller)

    // 6. Director Executive Desk (William Bigboss)
    this.createWorkstation(0, -3.2, 'infra');

    // Podium for Director Presentations
    const podiumGeo = new THREE.CylinderGeometry(0.28, 0.35, 1.05, 16);
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.5 });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(-2.4, 0.525, -2.8);
    podium.castShadow = !this.isSoftwareGl;
    this.scene.add(podium);

    // 7. Indoor Plants & Modern Office Aesthetics
    this.createPottedPlant(-8.2, -4.8);
    this.createPottedPlant(8.2, -4.8);
    this.createPottedPlant(-8.2, 4.8);
    this.createPottedPlant(8.2, 4.8);
  }

  private buildPresentationBoard() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d')!;

    const drawSlide = () => {
      // Dark slate modern slide
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1024, 576);

      // Gradient banner
      const grad = ctx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 12);

      // Header
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('OfficeMe 3D Architecture & Agent Workflow', 48, 68);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('LIVE CLOUDFLARE EDGE MESH & 3D HUMANOID RIG', 48, 104);

      // Real OfficeMe 9 AI Characters Workflow presentation
      const steps = [
        { title: 'William (Director)', desc: 'Executive Orchestration', color: '#f59e0b', status: 'APPROVAL GATE' },
        { title: 'Alexander (Analyst)', desc: 'Edge Metrics & Conversion', color: '#3b82f6', status: 'WORKING' },
        { title: 'Olivia (Researcher)', desc: 'User Synthesis & Product', color: '#a855f7', status: 'THINKING' },
        { title: 'Ethan (Marketing)', desc: 'Campaigns & ROI Growth', color: '#06b6d4', status: 'WORKING' },
        { title: 'Sophia (Content)', desc: 'Multichannel Content Gen', color: '#ec4899', status: 'WORKING' },
        { title: 'Daniel (SEO)', desc: 'Keyword Audit & Backlinks', color: '#10b981', status: 'WORKING' },
        { title: 'Isabella (Design)', desc: 'UI/UX Visual Architecture', color: '#8b5cf6', status: 'THINKING' },
        { title: 'Lucas (Automation)', desc: 'CI/CD & Edge Workers', color: '#38bdf8', status: 'WORKING' },
        { title: 'Charlotte (QA)', desc: 'Release Gate & Security', color: '#10b981', status: 'SUCCESS' }
      ];

      steps.forEach((s, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 36 + col * 320;
        const y = 135 + row * 135;
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(x, y, 305, 122, 10);
        ctx.fill();

        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(s.title, x + 16, y + 32);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(s.desc, x + 16, y + 62);

        // Status pill
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 80, 160, 26, 6);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(s.status, x + 24, y + 97);
      });
    };

    drawSlide();
    this.screenPresentationCanvasTexture = new THREE.CanvasTexture(canvas);
    this.screenPresentationCanvasTexture.colorSpace = THREE.SRGBColorSpace;

    // Board Frame
    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 2.7, -5.2);

    const frameGeo = new THREE.BoxGeometry(5.2, 3.0, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    boardGroup.add(frame);

    const screenGeo = new THREE.PlaneGeometry(5.0, 2.8);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.screenPresentationCanvasTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.07;
    boardGroup.add(screen);

    // Subtle edge glow
    const glowGeo = new THREE.BoxGeometry(5.24, 3.04, 0.02);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 0.05;
    boardGroup.add(glow);

    this.scene.add(boardGroup);
  }

  private createWorkstation(x: number, z: number, theme: 'code' | 'design' | 'infra' | 'qa') {
    const wsGroup = new THREE.Group();
    wsGroup.position.set(x, 0, z);

    // 1. Desk Surface
    const topGeo = new THREE.BoxGeometry(2.0, 0.05, 1.1);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 });
    const deskTop = new THREE.Mesh(topGeo, topMat);
    deskTop.position.set(0, 0.72, 0);
    deskTop.castShadow = !this.isSoftwareGl;
    deskTop.receiveShadow = !this.isSoftwareGl;
    wsGroup.add(deskTop);

    // Desk Legs
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const offsets = [
      [-0.92, 0.45],
      [0.92, 0.45],
      [-0.92, -0.45],
      [0.92, -0.45]
    ];
    offsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.36, lz);
      leg.castShadow = !this.isSoftwareGl;
      wsGroup.add(leg);
    });

    // 2. Dual Ultrawide Monitors with glowing screens
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.75, -0.25);

    // Procedural monitor texture
    const mCanvas = document.createElement('canvas');
    mCanvas.width = 256;
    mCanvas.height = 144;
    const mctx = mCanvas.getContext('2d')!;
    mctx.fillStyle = '#0a0e17';
    mctx.fillRect(0, 0, 256, 144);

    if (theme === 'code') {
      mctx.fillStyle = '#38bdf8';
      mctx.font = '10px "JetBrains Mono", monospace';
      mctx.fillText('const rig = createHumanoidRig();', 12, 24);
      mctx.fillStyle = '#a855f7';
      mctx.fillText('quaternion.slerp(target, delta);', 12, 44);
      mctx.fillStyle = '#10b981';
      mctx.fillText('// 60 FPS FK matrix pass', 12, 64);
    } else if (theme === 'design') {
      mctx.fillStyle = '#ec4899';
      mctx.fillRect(16, 20, 80, 50);
      mctx.fillStyle = '#6366f1';
      mctx.fillRect(110, 20, 120, 80);
    } else if (theme === 'infra') {
      mctx.fillStyle = '#06b6d4';
      mctx.font = '10px "JetBrains Mono", monospace';
      mctx.fillText('CF Worker: sin01 POP [OK]', 12, 24);
      mctx.fillText('D1 Database: Synced (4ms)', 12, 44);
      mctx.fillText('KV Cache: 99.4% Hit Rate', 12, 64);
    } else {
      mctx.fillStyle = '#10b981';
      mctx.font = '10px "JetBrains Mono", monospace';
      mctx.fillText('PASS: 142/142 Unit Tests', 12, 24);
      mctx.fillText('Coverage: 98.6% Statements', 12, 44);
    }

    const mTexture = new THREE.CanvasTexture(mCanvas);
    mTexture.colorSpace = THREE.SRGBColorSpace;

    const screenMat = new THREE.MeshBasicMaterial({ map: mTexture });
    const screenGeo = new THREE.PlaneGeometry(0.85, 0.45);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.32, 0);

    const mFrameGeo = new THREE.BoxGeometry(0.9, 0.5, 0.03);
    const mFrame = new THREE.Mesh(mFrameGeo, legMat);
    mFrame.position.set(0, 0.32, -0.015);

    const standGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const stand = new THREE.Mesh(standGeo, legMat);
    stand.position.set(0, 0.12, 0);

    monitorGroup.add(mFrame, screenMesh, stand);
    wsGroup.add(monitorGroup);

    // 3. Ergonomic Office Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.42);

    const seatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.1 });
    const seat = new THREE.Mesh(seatGeo, chairMat);
    seat.position.set(0, 0.48, 0);
    seat.castShadow = !this.isSoftwareGl;
    chairGroup.add(seat);

    const backGeo = new THREE.BoxGeometry(0.42, 0.46, 0.06);
    const back = new THREE.Mesh(backGeo, chairMat);
    back.position.set(0, 0.76, 0.2);
    back.rotation.x = -0.1;
    back.castShadow = !this.isSoftwareGl;
    chairGroup.add(back);

    const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 8), legMat);
    chairPole.position.set(0, 0.24, 0);
    chairGroup.add(chairPole);

    // Contact shadow plane under desk & chair
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.015, 0.1);
    wsGroup.add(shadow);

    wsGroup.add(chairGroup);
    this.scene.add(wsGroup);
  }

  private createPottedPlant(x: number, z: number) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, 0, z);

    // Ceramic pot
    const potGeo = new THREE.CylinderGeometry(0.28, 0.2, 0.55, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.1 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.275;
    pot.castShadow = !this.isSoftwareGl;
    plantGroup.add(pot);

    // Leaves
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, metalness: 0.05 });
    const leafGeo = new THREE.SphereGeometry(0.18, 8, 8);
    leafGeo.scale(1, 0.2, 1.8);

    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0, 0.58, 0);
      const angle = (i / 7) * Math.PI * 2;
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.35 + (i % 2) * 0.15;
      leaf.castShadow = !this.isSoftwareGl;
      plantGroup.add(leaf);
    }

    this.scene.add(plantGroup);
  }

  private spawnCharacters(agents: AgentCharacter[]) {
    agents.forEach((agent, index) => {
      const instance = createHumanoidCharacter(agent);
      const animCtrl = new CharacterAnimationController(
        instance,
        agent.location === 'director_office' ? 'standing_presenting' : 'sitting_typing',
        index
      );

      // Position character at their dedicated workstation
      if (agent.location === 'director_office' || agent.id === 'william-bigboss') {
        instance.group.position.set(0, 0, -2.8);
        instance.group.rotation.y = Math.PI * 0.95;
        animCtrl.setPose('standing_presenting');
      } else if (agent.location === 'workstation_alexander' || agent.id === 'alexander-data-analyst') {
        instance.group.position.set(-5.2, 0, 1.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_typing');
      } else if (agent.location === 'workstation_olivia' || agent.id === 'olivia-product-researcher') {
        instance.group.position.set(-5.2, 0, 4.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_thinking');
      } else if (agent.location === 'workstation_ethan' || agent.id === 'ethan-marketing-strategist') {
        instance.group.position.set(-1.8, 0, 1.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_typing');
      } else if (agent.location === 'workstation_sophia' || agent.id === 'sophia-content-creator') {
        instance.group.position.set(-1.8, 0, 4.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_typing');
      } else if (agent.location === 'workstation_daniel' || agent.id === 'daniel-seo-specialist') {
        instance.group.position.set(1.8, 0, 1.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_typing');
      } else if (agent.location === 'workstation_isabella' || agent.id === 'isabella-graphic-designer') {
        instance.group.position.set(1.8, 0, 4.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_thinking');
      } else if (agent.location === 'workstation_lucas' || agent.id === 'lucas-automation-engineer') {
        instance.group.position.set(5.2, 0, 1.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('sitting_typing');
      } else if (agent.location === 'workstation_charlotte' || agent.id === 'charlotte-quality-controller') {
        instance.group.position.set(5.2, 0, 4.2);
        instance.group.rotation.y = Math.PI;
        animCtrl.setPose('celebrating_success');
      }

      this.scene.add(instance.group);
      this.characters.set(agent.id, instance);
      this.animControllers.set(agent.id, animCtrl);
    });
  }

  public updateAgentStatus(agentId: string, status: AgentStatus) {
    const char = this.characters.get(agentId);
    const ctrl = this.animControllers.get(agentId);
    if (!char || !ctrl) return;

    updateStatusAura(char, status);
    ctrl.setStatus(status);
  }

  public setAgentPose(agentId: string, pose: AgentPose) {
    const ctrl = this.animControllers.get(agentId);
    if (ctrl) {
      ctrl.setPose(pose);
    }
  }

  public focusCamera(preset: CameraPreset) {
    this.isTransitioningCamera = true;
    this.cameraTransitionProgress = 0;
    this.cameraStartPos.copy(this.camera.position);
    this.cameraStartTarget.copy(this.controls.target);

    _camPosTarget.set(preset.position[0], preset.position[1], preset.position[2]);
    _camLookTarget.set(preset.target[0], preset.target[1], preset.target[2]);
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost, false);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    console.warn('[OfficeMe 3D] WebGL context lost. Gracefully releasing loop.');
    cancelAnimationFrame(this.animationFrameId);
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.animationFrameId);
    } else if (!this.isDisposed) {
      this.clock.start();
      this.animate();
    }
  };

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, this.camera);

    const hitObjects: THREE.Object3D[] = [];
    this.characters.forEach((char) => {
      hitObjects.push(...char.meshParts);
    });

    const intersects = _raycaster.intersectObjects(hitObjects, true);
    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      let foundId: string | null = null;
      while (current && current.parent) {
        if (current.name.startsWith('character_')) {
          foundId = current.name.replace('character_', '');
          break;
        }
        current = current.parent;
      }
      if (foundId) {
        this.hoveredAgentId = foundId;
        this.renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    this.hoveredAgentId = null;
    this.renderer.domElement.style.cursor = 'default';
  };

  private onPointerDown = () => {
    if (this.hoveredAgentId) {
      this.onSelectAgent(this.hoveredAgentId);
    }
  };

  private animate = () => {
    if (this.isDisposed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1); // cap delta to prevent tunneling
    const totalTime = this.clock.getElapsedTime();

    // 1. Advance camera transitions smoothly using exponential damping
    if (this.isTransitioningCamera) {
      this.cameraTransitionProgress += delta * 2.2;
      const t = Math.min(1.0, this.cameraTransitionProgress);
      // Smooth step
      const smoothT = t * t * (3 - 2 * t);

      this.camera.position.lerpVectors(this.cameraStartPos, _camPosTarget, smoothT);
      this.controls.target.lerpVectors(this.cameraStartTarget, _camLookTarget, smoothT);

      if (t >= 1.0) {
        this.isTransitioningCamera = false;
      }
    }

    this.controls.update();

    // 2. Update character skeletons & animation controllers
    this.animControllers.forEach((ctrl) => {
      ctrl.update(delta, totalTime);
    });

    // 3. Render frame
    const startRender = performance.now();
    this.renderer.render(this.scene, this.camera);
    const endRender = performance.now();
    this.currentFrameTime = endRender - startRender;

    // 4. Calculate FPS & Telemetry
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;

      const info = this.renderer.info;
      this.onTelemetryUpdate({
        fps: this.currentFps,
        frameTime: parseFloat(this.currentFrameTime.toFixed(1)),
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        isSoftwareGl: this.isSoftwareGl,
        gpuRenderer: this.gpuRendererName,
        memoryEstimateMb: Math.round(180 + info.render.calls * 1.8),
        targetFramerate: 60
      });
    }
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);

    this.characters.forEach((char) => {
      char.dispose();
      this.scene.remove(char.group);
    });

    if (this.screenPresentationCanvasTexture) {
      this.screenPresentationCanvasTexture.dispose();
    }

    this.controls.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
