import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file paths
    const tempDir = join(process.cwd(), 'temp');
    const inputPath = join(tempDir, `input_${Date.now()}.wav`);
    const outputPath = join(tempDir, `output_${Date.now()}.wav`);
    const analysisPath = join(tempDir, `analysis_${Date.now()}.json`);

    // Write input file
    await writeFile(inputPath, buffer);

    // Pass 1: Analyze loudness
    const analyzeCmd = `ffmpeg -i "${inputPath}" -af loudnorm=print_format=json -f null - 2> "${analysisPath}"`;
    await execAsync(analyzeCmd);

    // Read analysis results
    const analysisData = await readFile(analysisPath, 'utf-8');
    const analysis = JSON.parse(analysisData as string);

    // Extract loudness values
    const inputI = analysis.input_i;
    const inputLRA = analysis.input_lra;
    const inputTP = analysis.input_tp;
    const inputThreshold = analysis.input_thresh;

    // Pass 2: Apply loudness normalization with measured values
    const masterCmd = `ffmpeg -i "${inputPath}" -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=${inputI}:measured_LRA=${inputLRA}:measured_TP=${inputTP}:measured_thresh=${inputThreshold}:offset=0:linear=true:print_format=summary" -ar 48000 "${outputPath}"`;
    await execAsync(masterCmd);

    // Read the mastered file
    const masteredBuffer = await readFile(outputPath) as Buffer;

    // Clean up temporary files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
      unlink(analysisPath).catch(() => {})
    ]);

    // Return the mastered audio
    return new NextResponse(new Uint8Array(masteredBuffer), {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="mastered_audio.wav"'
      }
    });

  } catch (error) {
    console.error('Mastering error:', error);
    return NextResponse.json(
      { error: 'Mastering failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer> {
  const { readFile } = await import('fs/promises');
  return readFile(path, encoding);
}
