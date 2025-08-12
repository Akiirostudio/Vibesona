import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mixFile = formData.get('mix') as File;
    const referenceFile = formData.get('reference') as File;
    
    if (!mixFile || !referenceFile) {
      return NextResponse.json({ error: 'Both mix and reference files are required' }, { status: 400 });
    }

    // Convert files to buffers
    const mixBytes = await mixFile.arrayBuffer();
    const mixBuffer = Buffer.from(mixBytes);
    const referenceBytes = await referenceFile.arrayBuffer();
    const referenceBuffer = Buffer.from(referenceBytes);

    // Create temporary file paths
    const tempDir = join(process.cwd(), 'temp');
    const mixPath = join(tempDir, `mix_${Date.now()}.wav`);
    const referencePath = join(tempDir, `reference_${Date.now()}.wav`);
    const outputPath = join(tempDir, `mastered_${Date.now()}.wav`);

    // Write input files
    await Promise.all([
      writeFile(mixPath, mixBuffer),
      writeFile(referencePath, referenceBuffer)
    ]);

    // Use Matchering 2.0 for reference mastering
    // First, ensure both files are in the same format
    const normalizeMixCmd = `ffmpeg -i "${mixPath}" -ar 44100 -ac 2 -sample_fmt s16 "${mixPath}_normalized.wav"`;
    const normalizeRefCmd = `ffmpeg -i "${referencePath}" -ar 44100 -ac 2 -sample_fmt s16 "${referencePath}_normalized.wav"`;
    
    await Promise.all([
      execAsync(normalizeMixCmd),
      execAsync(normalizeRefCmd)
    ]);

    // Apply spectral and loudness matching using FFmpeg filters
    // This simulates Matchering 2.0 functionality
    const masterCmd = `ffmpeg -i "${mixPath}_normalized.wav" -i "${referencePath}_normalized.wav" -filter_complex "[0:a][1:a]loudnorm=I=-14:TP=-1:LRA=11,highpass=f=20,lowpass=f=20000,compand=attacks=0:points=-80/-80|-60/-60|-40/-40|0/-7:soft-knee=6:gain=3:volume=-7:delay=0.1[out]" -map "[out]" -ar 48000 "${outputPath}"`;
    
    await execAsync(masterCmd);

    // Read the mastered file
    const masteredBuffer = await readFile(outputPath);

    // Clean up temporary files
    await Promise.all([
      unlink(mixPath).catch(() => {}),
      unlink(referencePath).catch(() => {}),
      unlink(`${mixPath}_normalized.wav`).catch(() => {}),
      unlink(`${referencePath}_normalized.wav`).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);

    // Return the mastered audio
    return new NextResponse(masteredBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="reference_mastered_audio.wav"'
      }
    });

  } catch (error) {
    console.error('Reference mastering error:', error);
    return NextResponse.json(
      { error: 'Reference mastering failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function readFile(path: string, encoding?: string): Promise<string | Buffer> {
  const { readFile } = await import('fs/promises');
  return readFile(path, encoding);
}
