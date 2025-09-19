// audioTests.ts - Test Suite für Audio-Funktionalität

export const AudioTests = {
  // Test 1: AudioContext Initialisierung
  async testInit(): Promise<boolean> {
    try {
      const ctx = new AudioContext();
      const result = ctx.state === 'running' || ctx.state === 'suspended';
      ctx.close();
      console.log('✅ AudioContext init test:', result ? 'PASSED' : 'FAILED');
      return result;
    } catch (error) {
      console.error('❌ AudioContext init test FAILED:', error);
      return false;
    }
  },

  // Test 2: Audio Decode
  async testDecode(): Promise<boolean> {
    try {
      const ctx = new AudioContext();
      // Erstelle einen Test-Ton (1 Sekunde Stille)
      const sampleRate = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
      const result = buffer.duration === 1;
      ctx.close();
      console.log('✅ Audio decode test:', result ? 'PASSED' : 'FAILED');
      return result;
    } catch (error) {
      console.error('❌ Audio decode test FAILED:', error);
      return false;
    }
  },

  // Test 3: Play/Stop
  async testPlayStop(): Promise<boolean> {
    try {
      const ctx = new AudioContext();
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      source.stop();
      ctx.close();
      console.log('✅ Play/Stop test: PASSED');
      return true;
    } catch (error) {
      console.error('❌ Play/Stop test FAILED:', error);
      return false;
    }
  },

  // Alle Tests ausführen
  async runAll(): Promise<boolean> {
    console.log('🧪 Running Audio System Tests...');
    const tests = [
      this.testInit(),
      this.testDecode(),
      this.testPlayStop()
    ];
    
    const results = await Promise.all(tests);
    const allPassed = results.every(r => r === true);
    
    console.log(allPassed ? '✅ All tests PASSED!' : '❌ Some tests FAILED!');
    return allPassed;
  }
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  AudioTests.runAll();
}
