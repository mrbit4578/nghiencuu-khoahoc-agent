"""Read every archive member, preserve bytes, and produce reproducible audit evidence.
Does not execute any upstream code. Run from repository root with Python 3.11+.
"""
from pathlib import Path, PurePosixPath
import ast, collections, csv, gzip, hashlib, io, json, re, sys, zipfile

ROOT = Path(__file__).resolve().parents[1]
archive = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'scientific-agent-skills-main.zip'
destination = ROOT / 'vendor' / 'scientific-agent-skills'
reports = ROOT / 'audit'
reports.mkdir(exist_ok=True)
records, findings, summaries = [], [], []
with zipfile.ZipFile(archive) as z:
    for item in z.infolist():
        if item.is_dir():
            continue
        p = PurePosixPath(item.filename)
        relative = PurePosixPath(*p.parts[1:])
        if p.is_absolute() or '..' in p.parts or not relative.parts:
            raise ValueError('Unsafe archive path: ' + item.filename)
        data = z.read(item)  # all bytes; zipfile verifies CRC on read
        target = destination.joinpath(*relative.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        if sys.platform != 'win32':
            target.chmod((item.external_attr >> 16) & 0o777 or 0o644)
        record = {'path': str(relative), 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'crc32': format(item.CRC, '08x'), 'kind': 'binary', 'checks': ['full-byte-read', 'crc-verified', 'preserved']}
        ext = relative.suffix.lower()
        try:
            text = data.decode('utf-8-sig')
            if '\x00' in text:
                raise UnicodeError('binary null')
            record['kind'] = 'text'
            record['lines'] = len(text.splitlines())
            record['checks'].append('utf8-decoded')
            summaries.append({'path': str(relative), 'lines': record['lines'], 'heading': next((s[:240] for s in text.splitlines() if s.startswith('# ')), ''), 'preview': text[:300]})
            if ext == '.py':
                try:
                    tree = ast.parse(text, filename=str(relative))
                    record['checks'].append('python-ast-parsed')
                    record['imports'] = sorted({n.names[0].name.split('.')[0] if isinstance(n, ast.Import) else (n.module or '').split('.')[0] for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))})
                    for n in ast.walk(tree):
                        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in {'eval', 'exec'}:
                            findings.append({'severity':'review', 'path':str(relative), 'line':n.lineno, 'rule':'dynamic-execution', 'detail': n.func.id})
                except SyntaxError as e:
                    findings.append({'severity':'error','path':str(relative),'line':e.lineno,'rule':'python-syntax','detail':e.msg})
            elif ext == '.json':
                try:
                    json.loads(text)
                    record['checks'].append('json-parsed')
                except ValueError as e:
                    findings.append({'severity':'error','path':str(relative),'rule':'json-syntax','detail':str(e)})
            elif ext == '.md':
                record['checks'].append('markdown-scanned')
                for link in re.findall(r'\]\(([^)\s]+)(?:\s+[^)]*)?\)', text):
                    if link.startswith(('http:', 'https:', '#', 'mailto:', 'data:')) or '<' in link or '{' in link:
                        continue
                    # Resolution happens after all members have been extracted.
                    record.setdefault('localLinks', []).append(link.split('#')[0])
        except UnicodeError:
            if ext in {'.png', '.gif'}:
                try:
                    from PIL import Image
                    with Image.open(io.BytesIO(data)) as im:
                        record['dimensions'] = list(im.size)
                        im.verify()
                    record['checks'].append('image-structure-verified')
                except ImportError:
                    record['checks'].append('image-header-only')
                except Exception as e:
                    findings.append({'severity':'error','path':str(relative),'rule':'image-decode','detail':str(e)})
            elif ext == '.gz':
                try:
                    unpacked = gzip.decompress(data)
                    record['decompressedSize'] = len(unpacked)
                    record['checks'].append('gzip-integrity-verified')
                except Exception as e:
                    findings.append({'severity':'error','path':str(relative),'rule':'gzip-integrity','detail':str(e)})
        records.append(record)

for record in records:
    for link in record.pop('localLinks', []):
        target = destination / Path(record['path']).parent / link
        if link and not target.exists():
            findings.append({'severity':'review','path':record['path'],'rule':'local-link','detail':link})

skills = sorted(destination.glob('skills/*/SKILL.md'))
summary = {'archive':archive.name, 'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(), 'files':len(records), 'bytes':sum(r['size'] for r in records), 'textFiles':sum(r['kind']=='text' for r in records), 'binaryFiles':sum(r['kind']=='binary' for r in records), 'skills':len(skills), 'pythonFiles':sum(r['path'].endswith('.py') for r in records), 'findings':len(findings), 'rules':dict(collections.Counter(f['rule'] for f in findings)), 'scope':'Every entry read in full and CRC/hash checked. Text parsed/scanned programmatically; binary structures checked where supported. This is not a claim of human line-by-line review, scientific validation, runtime testing of every library, or a malware certification.'}
for name, value in [('manifest.json', records), ('findings.json', findings), ('text-index.json',summaries), ('summary.json',summary)]:
    (reports/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf8')
with (reports/'manifest.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.DictWriter(f,fieldnames=['path','size','sha256','kind'])
    writer.writeheader()
    writer.writerows({k:r[k] for k in writer.fieldnames} for r in records)
print(json.dumps(summary,indent=2))
