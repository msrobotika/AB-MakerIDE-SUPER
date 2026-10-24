"""Generate/verify the SHA-256 manifest of this local source package."""
import argparse
import hashlib
from pathlib import Path
import subprocess
import sys

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--write',action='store_true')
args=parser.parse_args()
manifest=root/'MANIFEST_SHA256.txt'
if args.write:
    files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
    lines=['AB MakerIDE SUPER '+(root/'VERSION').read_text().strip()+' / SHA-256 manifest',
           'Format: HASH  PATH (relative to package root; manifest excludes itself)', '']
    for name in sorted(set(files)):
        path=root/name
        if not name or name=='MANIFEST_SHA256.txt' or not path.is_file():continue
        lines.append(hashlib.sha256(path.read_bytes()).hexdigest()+'  '+name)
    manifest.write_text('\n'.join(lines)+'\n',encoding='utf-8')
failed=[];count=0
for line in manifest.read_text('utf-8').splitlines()[3:]:
    expected,name=line.split('  ',1);path=root/name;count+=1
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:failed.append(name)
print(f'{count} files verified; {len(failed)} mismatches')
for name in failed:print(name)
sys.exit(bool(failed))
