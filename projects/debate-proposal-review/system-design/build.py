"""Build self-contained architecture figures from the project's local visual tokens."""
\nfrom pathlib import Path
\nfrom html import escape
\nfrom textwrap import wrap
\n
\nROOT = Path(__file__).resolve().parent
\nLIGHT = dict(paper="#f7f3ed", panel="#fffdf9", ink="#2d2824", muted="#62574f", rule="#d0bfb2", accent="#914024", tint="#f3e0d5")
\n
\ndef node(x, y, title, lines, p, focal=False, tag="CODE", w=264, h=112):
\n    color = p['accent'] if focal else p['muted']
\n    fill = p['tint'] if focal else p['panel']
\n    text = ''.join(f'<text x="{x+20}" y="{y+76+i*20}" class="sub">{escape(line)}</text>' for i, line in enumerate(lines))
\n    return f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{color}"/><text x="{x+20}" y="{y+24}" class="tag" fill="{color}">{tag}</text><text x="{x+20}" y="{y+52}" class="name">{escape(title)}</text>{text}</g>'
\n
\ndef edge(d, p, label=None, lx=0, ly=0, dashed=False):
\n    dash = ' stroke-dasharray="5 4"' if dashed else ''
\n    path = f'<path d="{d}" fill="none" stroke="{p["muted"]}" stroke-width="1.5" marker-end="url(#arrow)"{dash}/>'
\n    if label:
\n        width = len(label)*8+16
\n        path += f'<rect x="{lx-width/2}" y="{ly-16}" width="{width}" height="24" fill="{p["paper"]}"/><text x="{lx}" y="{ly}" class="label" text-anchor="middle">{escape(label)}</text>'
\n    return path
\n
\ndef overview(p):
\n    points=[(48,112),(352,112),(656,112),(960,112),(960,360),(656,360),(352,360),(48,360)]
\n    names=[
\n        ('Chat + consent',['Discuss proposal','Authorize external AI'],'BROWSER'),
\n        ('Source intake',['Text / TXT / MD','Digital PDF / DOCX'],'LOCAL CODE'),
\n        ('Edit summary',['Options and unknowns','Reviewer can revise'],'BROWSER'),
\n        ('Generate review',['Explicit reviewer action'],'BROWSER'),
\n        ('Stages + Groq',['Claims, pro / con','Evidence, synthesis'],'SERVER / AI'),
\n        ('Validate + save',['Scope and citations','Atomic local JSON'],'LOCAL CODE'),
\n        ('Inspect review',['Arguments, passages','Verdicts, questions'],'BROWSER'),
\n        ('Decide + manage',['Human decision','History and deletion'],'HUMAN'),
\n    ]
\n    paths=''
\n    for i in range(3):
\n        x,y=points[i]; paths+=edge(f'M {x+248} {y+56} H {points[i+1][0]}',p)
\n    paths+=edge('M 1084 224 V 360',p)
\n    for left,right in ((904,960),(600,656),(296,352)):
\n        paths+=edge(f'M {right} 416 H {left}',p)
\n    nodes=''.join(node(x,y,name,lines,p,i in (0,5),tag=tag,w=248) for i,((x,y),(name,lines,tag)) in enumerate(zip(points,names)))
\n    return paths+nodes, 'The reviewer consents, supplies a proposal and permitted sources, edits a summary, starts a bounded Groq-backed review, inspects validated local results, and owns the final decision.', 'No sources: Evidence and Synthesis finish locally. Provider error: last saved stage stays available for retry. The model never selects the decision.'
\n
\ndef lifecycle(p):
\n    points=[(48,112),(352,112),(656,112),(960,112),(960,360),(656,360),(352,360),(48,360)]
\n    names=[('Draft',['Consent + summary'],'HUMAN'),('Claims',['Proposal statements'],'MODEL'),('Supporting',['Reasons in favor'],'MODEL'),('Opposing',['Reasons against'],'MODEL'),('Evidence',['Claim verdicts'],'CODE / MODEL'),('Synthesis',['Limits + questions'],'CODE / MODEL'),('Complete',['Analysis ready'],'CODE'),('Human decision',['Approve / reject / defer'],'HUMAN')]
\n    paths=''
\n    for i in range(3):
\n        x,y=points[i];paths+=edge(f'M {x+248} {y+56} H {points[i+1][0]}',p)
\n    paths+=edge('M 1084 224 V 360',p)
\n    paths+=edge('M 960 416 H 904',p)
\n    paths+=edge('M 656 416 H 600',p)
\n    paths+=edge('M 352 416 H 296',p)
\n    nodes=''.join(node(x,y,name,lines,p,i in (0,6),tag=tag,w=248) for i,((x,y),(name,lines,tag)) in enumerate(zip(points,names)))
\n    return paths+nodes, 'A review advances through seven persisted analysis states, then a separate human decision.', 'With no sources, Evidence and Synthesis finish in code. A failed call keeps the last saved stage.'
\n
\ndef evidence(p):
\n    paths=edge('M 328 168 H 464',p,'OWNS',396,150)
\n    paths+=edge('M 728 168 H 864',p,'CONTAINS',796,150)
\n    paths+=edge('M 196 224 V 352',p,'PROPOSAL',246,296)
\n    paths+=edge('M 996 224 V 352',p,'CANDIDATES',1060,296)
\n    paths+=edge('M 728 408 H 864',p,'FACTUAL',796,390)
\n    paths+=edge('M 328 408 H 464',p,'CLAIMS',396,390)
\n    nodes=node(64,112,'Review scope',['Proposal + source set'],p,True)
\n    nodes+=node(464,112,'Authorized sources',['Review-owned material'],p,tag='INPUT')
\n    nodes+=node(864,112,'Source passages',['ID + source + locator'],p,tag='EVIDENCE')
\n    nodes+=node(64,352,'Proposal + arguments',['Generated text is not evidence'],p,tag='INPUT / MODEL')
\n    nodes+=node(464,352,'Atomic claim ledger',['Factual or value judgment'],p)
\n    nodes+=node(864,352,'Evidence verdict',['Cited or insufficient'],p,True,tag='MODEL / CODE')
\n    return paths+nodes, 'Claims link arguments to review-owned candidate passages and factual verdicts while retaining source provenance.', 'Passage IDs prove scope, not support. Value judgments get no factual verdict.'
\n
\ndef privacy_flow(p):
\n    paths=edge('M 328 198 H 464',p)
\n    paths+=edge('M 728 198 H 864',p,'AFTER CONSENT',796,180)
\n    paths+=edge('M 996 254 V 330 H 660 V 254',p,'JSON REPLY',796,318,dashed=True)
\n    paths+=edge('M 196 254 V 372',p)
\n    paths+=edge('M 596 254 V 372',p)
\n    paths+=edge('M 328 428 H 464',p)
\n    paths+=f'<path d="M 800 112 V 520" fill="none" stroke="{p["muted"]}" stroke-width="1.5" stroke-dasharray="5 4"/>'
\n    paths+='<text x="64" y="126" class="tag">ON THIS DEVICE</text><text x="864" y="126" class="tag">EXTERNAL</text>'
\n    nodes=node(64,142,'Reviewer',['Proposal, files, chat','Consent and decision'],p,tag='BROWSER')
\n    nodes+=node(464,142,'Local service',['Checks consent and scope','Validates model output'],p,True)
\n    nodes+=node(864,142,'Groq',['Proposal + recent chat','Bounded source excerpts'],p,tag='PROVIDER')
\n    nodes+=node(64,372,'Digital intake',['Extract text; discard bytes'],p,tag='LOCAL CODE')
\n    nodes+=node(464,372,'Review JSON',['Sources, stages, decision','Delete on request'],p,True,tag='LOCAL DISK')
\n    return paths+nodes, 'Explicit consent gates text sent from the local review service to Groq. Original uploaded bytes and human decisions stay on the device.', 'Bounded text crosses to Groq after consent. No-source Evidence and Synthesis finish locally.'
\n
\nFIGURES=[('overview','How the review system works',overview),('review','From conversation to human decision',lifecycle),('evidence','Claims, evidence and review scope',evidence),('privacy','Consent gates external processing',privacy_flow)]
\n
\ndef render(slug,title,draw):
\n    p=LIGHT
\n    body,desc,note=draw(p)
\n    filename=slug
\n    marker=f'{filename}-arrow'
\n    body=body.replace('url(#arrow)',f'url(#{marker})')
\n    height=720
\n    style=f'''<style>
\n#{filename}-root text {{ fill:{p['ink']}; font-family:Arial,system-ui,sans-serif; }}
\n#{filename}-root .name {{ font-size:22px; font-weight:600; }}
\n#{filename}-root .sub {{ font-size:17px; fill:{p['muted']}; }}
\n#{filename}-root .tag, #{filename}-root .label {{ font-size:14px; letter-spacing:.05em; fill:{p['muted']}; }}
\n</style>'''
\n    note_lines=''.join(f'<text x="48" y="{669+i*24}" class="sub">{escape(line)}</text>' for i,line in enumerate(wrap(note,110)))
\n    svg=f'''<?xml version="1.0" encoding="UTF-8"?>
\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 {height}" width="1280" height="{height}" role="img" font-family="Arial, system-ui, sans-serif" aria-labelledby="{filename}-title {filename}-desc" id="{filename}-root">
\n<title id="{filename}-title">{escape(title)}</title><desc id="{filename}-desc">{escape(desc)} {escape(note)}</desc>
\n<defs>{style}<marker id="{marker}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="{p['muted']}"/></marker></defs>
\n<rect width="1280" height="{height}" fill="{p['paper']}"/><text x="48" y="72" class="name">{escape(title)}</text>{body}
\n<line x1="48" y1="640" x2="1232" y2="640" stroke="{p['rule']}"/>
\n{note_lines}
\n</svg>'''
\n    return svg.replace('<text ', '<text font-size="16" ')
\n
\nfor slug,title,draw in FIGURES:
\n    for stale in (ROOT/f'{slug}-dark.svg',):
\n        stale.unlink(missing_ok=True)
\n    (ROOT/f'{slug}.svg').write_text(render(slug,title,draw),encoding='utf-8')
\nfor stale in ('architecture-full.svg','review-lifecycle-full.svg','evidence-boundary-full.svg','privacy-flow-full.svg'):
\n    (ROOT/stale).unlink(missing_ok=True)
\nprint(f'Built {len(FIGURES)} self-contained SVG diagrams.')
\n
