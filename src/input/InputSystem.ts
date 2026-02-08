export const defaultKeyMap = {
  'ArrowUp': 'UP',
  'ArrowDown': 'DOWN',
  'ArrowLeft': 'LEFT',
  'ArrowRight': 'RIGHT',
  'KeyZ': 'LIGHT_PUNCH',
  'KeyX': 'HEAVY_PUNCH',
  'KeyC': 'BLOCK',
  'Space': 'ULTIMATE'
};

export function getAction(keyCode: string) {
  return (defaultKeyMap as any)[keyCode] || null;
}

export class InputSystem {
  currentInputs: Set<string>;
  buffer: any[];
  bufferSize: number;
  comboDefinitions: any[];

  constructor() {
    this.currentInputs = new Set();
    this.buffer = [];
    this.bufferSize = 60;
    this.comboDefinitions = [];
    
    this.initListeners();
  }

  initListeners() {
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
        const action = getAction(e.code);
        if (action) {
            this.currentInputs.add(action);
        }
        });

        window.addEventListener('keyup', (e) => {
        const action = getAction(e.code);
        if (action) {
            this.currentInputs.delete(action);
        }
        });
    }
  }

  registerCombo(name: string, sequence: string[], priority = 1) {
    this.comboDefinitions.push({ name, sequence, priority });
  }

  update(frameCount?: number) {
    const activeActions = Array.from(this.currentInputs);
    
    this.buffer.push({ frame: frameCount || Date.now(), actions: activeActions });
    if (this.buffer.length > this.bufferSize) this.buffer.shift();

    const combo = this.checkCombos();
    
    if (combo) return { type: 'COMBO', name: combo };
    if (activeActions.includes('BLOCK')) return { type: 'BLOCK' };
    if (activeActions.includes('LIGHT_PUNCH')) return { type: 'ATTACK', variant: 'light' };
    
    const movement = {
      x: activeActions.includes('RIGHT') ? 1 : (activeActions.includes('LEFT') ? -1 : 0),
      y: activeActions.includes('UP') ? 1 : (activeActions.includes('DOWN') ? -1 : 0)
    };
    
    return { type: 'MOVEMENT', vector: movement };
  }

  checkCombos() {
    for (const combo of this.comboDefinitions) {
      if (this.matchSequence(combo.sequence)) {
        this.buffer = [];
        return combo.name;
      }
    }
    return null;
  }

  matchSequence(sequence: string[]) {
    let seqIndex = sequence.length - 1;
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const frameActions = this.buffer[i].actions;
      const requiredAction = sequence[seqIndex];

      if (frameActions.includes(requiredAction)) {
        seqIndex--;
        if (seqIndex < 0) return true;
      }
      if (this.buffer.length - 1 - i > 20) return false; 
    }
    return false;
  }
}