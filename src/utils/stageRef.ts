import type Konva from 'konva';

/**
 * Global reference to the Konva stage, set by InfiniteCanvas.
 * Used by export functions to capture the canvas.
 */
let _stageRef: Konva.Stage | null = null;

export function setGlobalStageRef(stage: Konva.Stage | null) {
  _stageRef = stage;
}

export function getGlobalStageRef(): Konva.Stage | null {
  return _stageRef;
}
