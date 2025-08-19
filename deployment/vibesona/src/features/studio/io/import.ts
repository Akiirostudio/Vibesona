export async function decodeFileToBuffer(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await ctx.decodeAudioData(arrayBuffer as ArrayBuffer);
}


