// Export two independently reproducible ScreenLab display designs for Arduino CLI.
// Usage: node scripts/export_screenlab_pilot.mjs [output-directory]
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createProject, addWidget } from '../frontend/screenlab-core.js';
import { generateArduinoSketch } from '../frontend/screenlab-sketch.js';

const root = path.resolve(process.argv[2] || 'work/screenlab-pilot');
for (const profile of ['ideaspark', 'cyd']) {
  const name = profile === 'ideaspark' ? 'ScreenLabIdeaSpark' : 'ScreenLabCYD';
  const folder = path.join(root, name);
  await mkdir(folder, { recursive: true });
  const design = addWidget(createProject(profile), 'bar');
  const source = generateArduinoSketch(design);
  await writeFile(path.join(folder, name + '.ino'), source, 'utf8');
  await writeFile(path.join(folder, name + '.screenlab.json'), JSON.stringify(design, null, 2) + '\n');
  process.stdout.write(name + ': exported ' + source.length + ' chars\n');
}
