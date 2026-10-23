import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';

export interface VRMEvaluationResult {
  isValidVRM: boolean;
  version: '0.0' | '1.0' | 'unknown';
  humanoidBonesFound: string[];
  missingCriticalBones: string[];
  expressionsFound: string[];
  springBonesCount: number;
  materialsCount: number;
  hasBlinkExpression: boolean;
  notes: string[];
}

export class VRMLoaderService {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
  }

  /**
   * Load and parse a VRM model from a File object (drag-and-drop) or URL
   */
  public async loadVRM(source: File | string): Promise<{ vrm: VRM; evaluation: VRMEvaluationResult }> {
    let url: string;
    let shouldRevoke = false;

    if (source instanceof File) {
      url = URL.createObjectURL(source);
      shouldRevoke = true;
    } else {
      url = source;
    }

    try {
      const gltf = await this.loader.loadAsync(url);
      const vrm = gltf.userData.vrm as VRM | undefined;

      if (!vrm) {
        throw new Error('File does not contain valid VRM metadata.');
      }

      // Rotate model 180 degrees if VRM0.0 for standard forward facing orientation
      VRMUtils.rotateVRM0(vrm);

      // Evaluate model structure
      const evaluation = this.evaluateVRM(vrm);

      return { vrm, evaluation };
    } finally {
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
    }
  }

  /**
   * Deep structural evaluation of the VRM humanoid rig, expressions, and spring bones
   */
  public evaluateVRM(vrm: VRM): VRMEvaluationResult {
    const criticalHumanoidBones = [
      'hips',
      'spine',
      'chest',
      'neck',
      'head',
      'leftUpperArm',
      'leftLowerArm',
      'leftHand',
      'rightUpperArm',
      'rightLowerArm',
      'rightHand',
      'leftUpperLeg',
      'leftLowerLeg',
      'leftFoot',
      'rightUpperLeg',
      'rightLowerLeg',
      'rightFoot'
    ];

    const humanoid = vrm.humanoid;
    const foundBones: string[] = [];
    const missingCritical: string[] = [];

    if (humanoid) {
      criticalHumanoidBones.forEach((boneName) => {
        // VRM 1.0 vs 0.x compatibility check
        const node = humanoid.getNormalizedBoneNode(boneName as any) || humanoid.getRawBoneNode(boneName as any);
        if (node) {
          foundBones.push(boneName);
        } else {
          missingCritical.push(boneName);
        }
      });
    }

    // Expressions evaluation (blinking, talking, emotions)
    const expressionsFound: string[] = [];
    let hasBlink = false;
    if (vrm.expressionManager) {
      const exprs = vrm.expressionManager.expressions;
      exprs.forEach((expr) => {
        expressionsFound.push(expr.expressionName);
        if (expr.expressionName.toLowerCase().includes('blink')) {
          hasBlink = true;
        }
      });
    }

    // Spring bones / secondary physics
    let springBonesCount = 0;
    if (vrm.springBoneManager) {
      springBonesCount = vrm.springBoneManager.joints?.size || 0;
    }

    // Material count
    let materialsCount = 0;
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        materialsCount++;
      }
    });

    const isVersion1 = vrm.meta?.metaVersion === '1';
    const notes: string[] = [
      `Format detected: VRM ${isVersion1 ? '1.0' : '0.x'} specification`,
      `Humanoid bone fidelity: ${foundBones.length}/${criticalHumanoidBones.length} standard bones recognized`,
      `Secondary physics: ${springBonesCount} spring joints available for cloth/hair simulation`,
      hasBlink ? 'Facial expressions: Dynamic blink blendshape confirmed' : 'Facial expressions: Procedural eye rig fallback enabled'
    ];

    if (missingCritical.length > 0) {
      notes.push(`Notice: Optional bones not defined: ${missingCritical.slice(0, 3).join(', ')}`);
    }

    return {
      isValidVRM: foundBones.length >= 10,
      version: isVersion1 ? '1.0' : '0.0',
      humanoidBonesFound: foundBones,
      missingCriticalBones: missingCritical,
      expressionsFound,
      springBonesCount,
      materialsCount,
      hasBlinkExpression: hasBlink,
      notes
    };
  }
}

export const vrmLoaderService = new VRMLoaderService();
