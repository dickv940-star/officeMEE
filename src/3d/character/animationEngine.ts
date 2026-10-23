import * as THREE from 'three';
import { HumanoidBones, HumanoidCharacterInstance } from './humanoidRig';
import { AgentPose, AgentStatus } from '../../types/office';
import { audio } from '../../services/audioService';

// Module-level pre-allocated math objects to guarantee ZERO GC in animation loop
const _euler = new THREE.Euler();
const _quatCurrent = new THREE.Quaternion();
const _quatTarget = new THREE.Quaternion();
const _vecCurrent = new THREE.Vector3();
const _vecTarget = new THREE.Vector3();

// Joint target interface
interface BoneRotationMap {
  [boneName: string]: [number, number, number]; // [x, y, z] in radians
}

interface PoseDefinition {
  hipHeight: number;
  hipZOffset: number;
  rotations: BoneRotationMap;
}

// Canonical Keyframe Poses for Modern Office AI Staff
const POSES: Record<AgentPose, PoseDefinition> = {
  sitting_typing: {
    hipHeight: 0.52,
    hipZOffset: -0.05,
    rotations: {
      hips: [0, 0, 0],
      spine: [0.12, 0, 0],
      chest: [0.08, 0, 0],
      neck: [0.05, 0, 0],
      head: [0.08, 0, 0],
      leftUpperLeg: [-1.52, 0.05, -0.06],
      rightUpperLeg: [-1.52, -0.05, 0.06],
      leftLowerLeg: [1.55, 0, 0],
      rightLowerLeg: [1.55, 0, 0],
      leftFoot: [-0.05, 0, 0],
      rightFoot: [-0.05, 0, 0],
      leftShoulder: [0, 0, 0.05],
      rightShoulder: [0, 0, -0.05],
      leftUpperArm: [-0.55, 0.15, 0.25],
      rightUpperArm: [-0.55, -0.15, -0.25],
      leftLowerArm: [-1.15, 0.1, 0.25],
      rightLowerArm: [-1.15, -0.1, -0.25],
      leftHand: [0.2, 0, 0.1],
      rightHand: [0.2, 0, -0.1]
    }
  },
  sitting_thinking: {
    hipHeight: 0.52,
    hipZOffset: -0.08,
    rotations: {
      hips: [0, 0, 0],
      spine: [-0.05, 0, 0.03],
      chest: [-0.04, 0.05, 0],
      neck: [-0.08, 0.18, 0.05],
      head: [-0.06, 0.22, 0.12], // tilted contemplative head
      leftUpperLeg: [-1.48, 0.1, -0.08],
      rightUpperLeg: [-1.52, -0.08, 0.06],
      leftLowerLeg: [1.5, 0, 0],
      rightLowerLeg: [1.56, 0, 0],
      leftFoot: [-0.02, 0, 0],
      rightFoot: [-0.04, 0, 0],
      leftShoulder: [0, 0, 0],
      rightShoulder: [0.06, 0, -0.06],
      leftUpperArm: [-0.4, 0.1, 0.3], // arm on chair rest
      rightUpperArm: [-1.15, -0.3, -0.55], // arm up near chin
      leftLowerArm: [-1.0, 0.1, 0.2],
      rightLowerArm: [-1.85, -0.2, 0.35],
      leftHand: [0.1, 0, 0],
      rightHand: [0.35, -0.2, 0.15] // hand near chin/temple
    }
  },
  standing_presenting: {
    hipHeight: 0.95,
    hipZOffset: 0,
    rotations: {
      hips: [0, 0.1, 0.02],
      spine: [0.02, -0.05, 0],
      chest: [0.04, -0.08, 0],
      neck: [0.02, 0.1, 0],
      head: [0.03, 0.15, 0],
      leftUpperLeg: [0.02, 0, -0.08],
      rightUpperLeg: [-0.04, 0, 0.09],
      leftLowerLeg: [0.03, 0, 0],
      rightLowerLeg: [0.06, 0, 0],
      leftFoot: [-0.05, 0, 0],
      rightFoot: [-0.02, 0, 0],
      leftShoulder: [0, 0, 0.04],
      rightShoulder: [0.08, 0, -0.06],
      leftUpperArm: [0.2, 0.1, 0.22], // open welcoming hand
      rightUpperArm: [-0.95, 0.45, -0.65], // raised pointing at screen
      leftLowerArm: [-0.45, 0.1, 0.1],
      rightLowerArm: [-0.65, 0.25, -0.1],
      leftHand: [0.1, 0.2, 0],
      rightHand: [0.15, 0.3, 0]
    }
  },
  waiting_approval: {
    hipHeight: 0.95,
    hipZOffset: 0,
    rotations: {
      hips: [0, 0, 0],
      spine: [0.02, 0, 0],
      chest: [0.03, 0, 0],
      neck: [0.01, 0, 0],
      head: [0.02, 0, 0],
      leftUpperLeg: [0, 0, -0.05],
      rightUpperLeg: [0, 0, 0.05],
      leftLowerLeg: [0.02, 0, 0],
      rightLowerLeg: [0.02, 0, 0],
      leftFoot: [-0.02, 0, 0],
      rightFoot: [-0.02, 0, 0],
      leftShoulder: [0, 0, 0.02],
      rightShoulder: [0.1, 0, -0.08],
      leftUpperArm: [0.15, 0, 0.18],
      rightUpperArm: [-1.35, 0.1, -0.35], // hand raised politely waving
      leftLowerArm: [-0.3, 0, 0.1],
      rightLowerArm: [-1.15, 0.2, -0.1],
      leftHand: [0, 0, 0],
      rightHand: [0.2, 0.3, 0.1]
    }
  },
  celebrating_success: {
    hipHeight: 0.96,
    hipZOffset: 0,
    rotations: {
      hips: [0, 0, 0],
      spine: [-0.08, 0, 0],
      chest: [-0.06, 0, 0],
      neck: [-0.12, 0, 0],
      head: [-0.15, 0, 0], // looking up proudly
      leftUpperLeg: [-0.05, 0, -0.08],
      rightUpperLeg: [-0.05, 0, 0.08],
      leftLowerLeg: [0.06, 0, 0],
      rightLowerLeg: [0.06, 0, 0],
      leftFoot: [-0.01, 0, 0],
      rightFoot: [-0.01, 0, 0],
      leftShoulder: [0.12, 0, 0.15],
      rightShoulder: [0.12, 0, -0.15],
      leftUpperArm: [-2.1, 0.35, 0.45], // arms raised high
      rightUpperArm: [-2.1, -0.35, -0.45],
      leftLowerArm: [-0.75, 0, 0.2],
      rightLowerArm: [-0.75, 0, -0.2],
      leftHand: [0.2, 0, 0.2],
      rightHand: [0.2, 0, -0.2]
    }
  },
  frustrated_failure: {
    hipHeight: 0.52,
    hipZOffset: -0.04,
    rotations: {
      hips: [0, 0, 0],
      spine: [0.22, 0, 0], // slumped forward
      chest: [0.18, 0, 0],
      neck: [0.15, 0, 0],
      head: [0.18, 0, 0], // head down
      leftUpperLeg: [-1.52, 0.06, -0.06],
      rightUpperLeg: [-1.52, -0.06, 0.06],
      leftLowerLeg: [1.55, 0, 0],
      rightLowerLeg: [1.55, 0, 0],
      leftFoot: [-0.03, 0, 0],
      rightFoot: [-0.03, 0, 0],
      leftShoulder: [-0.08, 0, 0.02],
      rightShoulder: [-0.08, 0, -0.02],
      leftUpperArm: [-0.55, 0.2, 0.3],
      rightUpperArm: [-0.95, -0.2, -0.4], // hand resting on face/forehead
      leftLowerArm: [-1.2, 0.1, 0.2],
      rightLowerArm: [-1.9, -0.15, 0.3],
      leftHand: [0.1, 0, 0],
      rightHand: [0.4, -0.1, 0.2]
    }
  },
  idle_seated: {
    hipHeight: 0.52,
    hipZOffset: -0.06,
    rotations: {
      hips: [0, 0, 0],
      spine: [0.04, 0, 0],
      chest: [0.03, 0, 0],
      neck: [0.02, 0, 0],
      head: [0.02, 0, 0],
      leftUpperLeg: [-1.5, 0.05, -0.05],
      rightUpperLeg: [-1.5, -0.05, 0.05],
      leftLowerLeg: [1.52, 0, 0],
      rightLowerLeg: [1.52, 0, 0],
      leftFoot: [-0.02, 0, 0],
      rightFoot: [-0.02, 0, 0],
      leftShoulder: [0, 0, 0.02],
      rightShoulder: [0, 0, -0.02],
      leftUpperArm: [-0.35, 0.1, 0.22],
      rightUpperArm: [-0.35, -0.1, -0.22],
      leftLowerArm: [-0.95, 0.08, 0.18],
      rightLowerArm: [-0.95, -0.08, -0.18],
      leftHand: [0.12, 0, 0.05],
      rightHand: [0.12, 0, -0.05]
    }
  },
  idle_standing: {
    hipHeight: 0.95,
    hipZOffset: 0,
    rotations: {
      hips: [0, 0, 0.02],
      spine: [0.02, 0, 0],
      chest: [0.02, 0, 0],
      neck: [0.01, 0, 0],
      head: [0.02, 0, 0],
      leftUpperLeg: [0.02, 0, -0.06],
      rightUpperLeg: [-0.02, 0, 0.06],
      leftLowerLeg: [0.02, 0, 0],
      rightLowerLeg: [0.02, 0, 0],
      leftFoot: [-0.02, 0, 0],
      rightFoot: [-0.02, 0, 0],
      leftShoulder: [0, 0, 0.02],
      rightShoulder: [0, 0, -0.02],
      leftUpperArm: [0.1, 0, 0.15],
      rightUpperArm: [0.1, 0, -0.15],
      leftLowerArm: [-0.25, 0, 0.08],
      rightLowerArm: [-0.25, 0, -0.08],
      leftHand: [0, 0, 0],
      rightHand: [0, 0, 0]
    }
  },
  walking: {
    hipHeight: 0.95,
    hipZOffset: 0,
    rotations: {
      hips: [0, 0, 0],
      spine: [0.04, 0, 0],
      chest: [0.03, 0, 0],
      neck: [0.02, 0, 0],
      head: [0.02, 0, 0],
      leftUpperLeg: [0.4, 0, -0.04],
      rightUpperLeg: [-0.4, 0, 0.04],
      leftLowerLeg: [0.2, 0, 0],
      rightLowerLeg: [0.5, 0, 0],
      leftFoot: [-0.1, 0, 0],
      rightFoot: [0.1, 0, 0],
      leftShoulder: [0, 0, 0.02],
      rightShoulder: [0, 0, -0.02],
      leftUpperArm: [-0.35, 0, 0.15],
      rightUpperArm: [0.35, 0, -0.15],
      leftLowerArm: [-0.3, 0, 0.08],
      rightLowerArm: [-0.2, 0, -0.08],
      leftHand: [0, 0, 0],
      rightHand: [0, 0, 0]
    }
  }
};

export class CharacterAnimationController {
  private character: HumanoidCharacterInstance;
  private currentPose: AgentPose;
  private targetPose: AgentPose;
  private blendFactor: number = 1.0;
  private blendSpeed: number = 3.2; // Smooth crossfade over ~0.8s
  private timeOffset: number;
  private breathingRate: number = 0.28; // ~17 breaths/min
  private nextBlinkTime: number = 2.0;
  private blinkProgress: number = 0;
  private isBlinking: boolean = false;
  private typingBurstTimer: number = 0;
  private typingIsActive: boolean = true;
  private gazeOffset: THREE.Vector2 = new THREE.Vector2();
  private targetGazeOffset: THREE.Vector2 = new THREE.Vector2();
  private gazeTimer: number = 0;

  private prefersReducedMotion: boolean = false;

  constructor(character: HumanoidCharacterInstance, initialPose: AgentPose = 'idle_seated', seed: number = 0) {
    this.character = character;
    this.currentPose = initialPose;
    this.targetPose = initialPose;
    this.timeOffset = seed * 1.83; // Stagger breathing & gaze so agents don't sync
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  public setPose(newPose: AgentPose) {
    if (this.targetPose === newPose) return;
    this.targetPose = newPose;
    this.blendFactor = 0; // begin crossfade
  }

  public setStatus(status: AgentStatus) {
    // Map status directly to appropriate default pose if not overridden
    if (status === 'working') {
      this.setPose(this.character.config.location === 'presentation_stage' ? 'standing_presenting' : 'sitting_typing');
    } else if (status === 'thinking') {
      this.setPose('sitting_thinking');
    } else if (status === 'success') {
      this.setPose('celebrating_success');
    } else if (status === 'failure') {
      this.setPose('frustrated_failure');
    } else if (status === 'waiting_approval') {
      this.setPose('waiting_approval');
    } else {
      this.setPose(this.character.config.location === 'presentation_stage' ? 'idle_standing' : 'idle_seated');
    }
  }

  public update(delta: number, totalTime: number) {
    const time = totalTime + this.timeOffset;
    const bones = this.character.bones;
    const motionScale = this.prefersReducedMotion ? 0.2 : 1.0;

    // 1. Advance pose crossfade with exponential damping
    if (this.blendFactor < 1.0) {
      this.blendFactor = Math.min(1.0, this.blendFactor + delta * this.blendSpeed);
      if (this.blendFactor >= 1.0) {
        this.currentPose = this.targetPose;
      }
    }

    const curDef = POSES[this.currentPose] || POSES.idle_seated;
    const tgtDef = POSES[this.targetPose] || POSES.idle_seated;
    const t = this.blendFactor;

    // Smooth hip position interpolation
    const hipHeight = THREE.MathUtils.lerp(curDef.hipHeight, tgtDef.hipHeight, t);
    const hipZ = THREE.MathUtils.lerp(curDef.hipZOffset, tgtDef.hipZOffset, t);

    // 2. Procedural Organic Breathing Layer (0.28 Hz Harmonic wave)
    const breathPhase = Math.sin(time * Math.PI * 2 * this.breathingRate);
    const chestExpansion = breathPhase * 0.022;
    const shoulderBreath = breathPhase * 0.015;

    // Subtle hip bobbing during breathing or walking
    let walkBob = 0;
    if (this.targetPose === 'walking') {
      walkBob = Math.abs(Math.sin(time * 6.5)) * 0.04;
    }
    bones.hips.position.y = hipHeight + breathPhase * 0.006 - walkBob;
    bones.hips.position.z = hipZ;

    // 3. Natural Eye Blinking Layer
    this.nextBlinkTime -= delta;
    if (this.nextBlinkTime <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.nextBlinkTime = 3.0 + Math.random() * 3.5; // Next blink in 3-6.5 seconds
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 9.0; // blink duration ~0.22s
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
    }
    // Eyelid rotation: -PI/2 is open, 0 is fully closed
    const blinkAmount = this.isBlinking ? Math.sin(this.blinkProgress) : 0;
    const eyelidAngle = -Math.PI * 0.5 + blinkAmount * Math.PI * 0.5;
    bones.leftEyelid.rotation.x = eyelidAngle;
    bones.rightEyelid.rotation.x = eyelidAngle;

    // 4. Micro-Saccadic Eye Movement & Natural Gaze Darting
    this.gazeTimer -= delta;
    if (this.gazeTimer <= 0) {
      this.gazeTimer = 1.8 + Math.random() * 2.2;
      // Glance horizontally across dual monitors or look slightly around
      this.targetGazeOffset.set(
        (Math.random() - 0.5) * 0.18,
        (Math.random() - 0.5) * 0.1
      );
    }
    this.gazeOffset.lerp(this.targetGazeOffset, delta * 4.0);

    // 5. Interpolate all bone rotations between current and target poses
    const allBoneNames = Object.keys(curDef.rotations);
    for (const bName of allBoneNames) {
      const boneGroup = (bones as unknown as Record<string, THREE.Object3D>)[bName];
      if (!boneGroup) continue;

      const rotCur = curDef.rotations[bName] || [0, 0, 0];
      const rotTgt = tgtDef.rotations[bName] || rotCur;

      // Slerp rotations via temporary quaternions
      _euler.set(rotCur[0], rotCur[1], rotCur[2]);
      _quatCurrent.setFromEuler(_euler);

      _euler.set(rotTgt[0], rotTgt[1], rotTgt[2]);
      _quatTarget.setFromEuler(_euler);

      _quatCurrent.slerp(_quatTarget, t);
      boneGroup.quaternion.copy(_quatCurrent);
    }

    // 6. Apply Dynamic Procedural Behaviors on Top of Base Pose scaled by user motion preferences

    // A. Breathing & Torso motion
    bones.chest.rotation.x += chestExpansion * motionScale;
    bones.leftShoulder.position.y += shoulderBreath * motionScale;
    bones.rightShoulder.position.y += shoulderBreath * motionScale;

    // B. Natural Gaze on Head & Eyes
    bones.head.rotation.y += this.gazeOffset.x * motionScale;
    bones.head.rotation.x += this.gazeOffset.y * motionScale;
    bones.leftEye.rotation.y = this.gazeOffset.x * 0.4 * motionScale;
    bones.rightEye.rotation.y = this.gazeOffset.x * 0.4 * motionScale;

    // C. Non-repetitive Natural Keyboard Typing (Bursts of 4-8 taps with organic pauses)
    if (this.targetPose === 'sitting_typing') {
      this.typingBurstTimer -= delta;
      if (this.typingBurstTimer <= 0) {
        this.typingIsActive = Math.random() > 0.22; // ~78% active typing, ~22% thinking pause
        this.typingBurstTimer = this.typingIsActive ? 0.9 + Math.random() * 1.6 : 0.5 + Math.random() * 0.9;
      }

      if (this.typingIsActive && motionScale > 0.1) {
        const typeRate = 18.0;
        const leftTap = Math.sin(time * typeRate) * 0.07 * motionScale;
        const rightTap = Math.cos(time * typeRate * 1.1) * 0.07 * motionScale;

        bones.leftLowerArm.rotation.x += leftTap;
        bones.rightLowerArm.rotation.x += rightTap;
        bones.leftHand.rotation.x += leftTap * 1.2;
        bones.rightHand.rotation.x += rightTap * 1.2;

        // Micro finger movements
        bones.leftFingers.rotation.x = Math.sin(time * typeRate * 2.0) * 0.14 * motionScale;
        bones.rightFingers.rotation.x = Math.cos(time * typeRate * 2.2) * 0.14 * motionScale;
      }

      // Special Tablet interaction for Olivia & Lucas: Hold tablet steady with left, tap screen with right
      if (this.character.config.visual.holdingTablet) {
        bones.leftLowerArm.rotation.x = -1.25;
        bones.leftLowerArm.rotation.y = 0.35;
        bones.leftHand.rotation.x = 0.4;
        if (this.typingIsActive && motionScale > 0.1) {
          bones.rightHand.rotation.x += Math.sin(time * 6.0) * 0.08 * motionScale;
        }
      }

      // Special Stylus interaction for Isabella: Gentle sketch strokes
      if (this.character.config.id === 'isabella-graphic-designer') {
        bones.rightHand.rotation.z += Math.sin(time * 8.0) * 0.05 * motionScale;
        bones.rightHand.rotation.x += Math.cos(time * 10.0) * 0.04 * motionScale;
      }
    }

    // D. Presenting Gesture sweeps (Natural presentation arm movement)
    if (this.targetPose === 'standing_presenting') {
      const sweep = Math.sin(time * 1.4) * 0.12 * motionScale;
      const pitch = Math.cos(time * 0.9) * 0.08 * motionScale;
      bones.rightUpperArm.rotation.z += sweep;
      bones.rightUpperArm.rotation.x += pitch;
      bones.rightHand.rotation.y += Math.sin(time * 1.4) * 0.15 * motionScale;

      // Occasional authoritative head nod toward audience
      bones.head.rotation.x += Math.sin(time * 1.8) * 0.04 * motionScale;
    }

    // E. Waiting Approval: Friendly hand wave
    if (this.targetPose === 'waiting_approval') {
      const wave = Math.sin(time * 5.5) * 0.22 * motionScale;
      bones.rightHand.rotation.z = wave;
      bones.rightLowerArm.rotation.z = wave * 0.4;
    }

    // F. Thinking: slow head tilt and subtle chin tap
    if (this.targetPose === 'sitting_thinking') {
      const thinkSway = Math.sin(time * 0.7) * 0.04 * motionScale;
      bones.head.rotation.z += thinkSway;
      bones.rightHand.rotation.x += Math.sin(time * 1.2) * 0.03 * motionScale;
    }

    // G. Walking gait cycle
    if (this.targetPose === 'walking') {
      const walkCycle = Math.sin(time * 6.5);
      const legSweep = walkCycle * 0.55 * motionScale;
      const armSweep = walkCycle * 0.45 * motionScale;

      bones.leftUpperLeg.rotation.x = legSweep;
      bones.rightUpperLeg.rotation.x = -legSweep;
      bones.leftLowerLeg.rotation.x = Math.max(0, -legSweep * 1.1);
      bones.rightLowerLeg.rotation.x = Math.max(0, legSweep * 1.1);

      bones.leftUpperArm.rotation.x = -armSweep;
      bones.rightUpperArm.rotation.x = armSweep;
      bones.hips.rotation.y = Math.sin(time * 6.5) * 0.08 * motionScale;
    }

    // Subtle floating animation on the holographic status badge
    this.character.statusBadge.position.y = 1.95 + Math.sin(time * 2.0) * 0.025;
    this.character.statusAura.rotation.z = time * 0.4; // slowly rotating floor LED ring
  }
}
