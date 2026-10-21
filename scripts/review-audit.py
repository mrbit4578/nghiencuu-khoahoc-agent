"""Triage static candidates without changing upstream bytes."""
import collections, json, re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'vendor/scientific-agent-skills'
findings=json.loads((root/'audit/findings.json').read_text(encoding='utf8'))
review=[]
for finding in findings:
    text=(source/finding['path']).read_text(encoding='utf8')
    item=dict(finding)
    if finding['rule']=='dynamic-execution':
        line=finding['line']
        item['context']='\n'.join(text.splitlines()[max(0,line-3):line+2])
        item['assessment']='Test code executes documented snippets; not executed by the web application. Not a safety certification of running the tests.'
    else:
        prose=re.sub(r'```[\s\S]*?```|~~~[\s\S]*?~~~','',text)
        prose=re.sub(r'`[^`]*`','',prose)
        item['assessment']='Pattern candidate remains in prose; review illustrative placeholders or link intent.' if ']('+finding['detail']+')' in prose else 'Regex candidate from code/example syntax, not a live Markdown link in prose.'
    review.append(item)
scanner=json.loads((source/'docs/security-report.json').read_text(encoding='utf8'))
report={'reviewedCandidates':len(review),'findings':review,'upstreamScanner':{'generated':scanner['generated'],'totals':scanner['totals'],'crossSkillFindings':len(scanner.get('cross_skill_findings',[])),'triageDocumentDate':'2026-09-13','assessment':'Upstream triage predates the 2026-10-19 scanner report. High/critical results are not globally cleared. Web app never executes upstream scripts.'}}
(root/'audit/triage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'reviewed':len(review),'upstream':report['upstreamScanner'],'proseCandidates':[r for r in review if r['assessment'].startswith('Pattern candidate')],'assessments':dict(collections.Counter(r['assessment'] for r in review))},ensure_ascii=False,indent=2))
