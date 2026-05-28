#!/usr/bin/env python3
import json, sys, re

data = json.load(sys.stdin)
tool = data.get('tool_name', '')
inp = data.get('tool_input', {})

content = ''
if tool == 'Write':
    content = inp.get('content', '')
elif tool == 'Edit':
    content = inp.get('new_string', '')
elif tool == 'MultiEdit':
    edits = inp.get('edits', [])
    content = ' '.join(e.get('new_string', '') for e in edits)

patterns = [
    (r'eval\s*\(', 'Unsafe eval()'),
    (r'innerHTML\s*=', 'XSS via innerHTML'),
    (r'document\.write\s*\(', 'XSS via document.write'),
    (r'dangerouslySetInnerHTML', 'XSS via dangerouslySetInnerHTML'),
    (r'(?i)(password|secret|api[_-]?key|token)\s*=\s*["\x27][^"\x27\s]{8,}', 'Possible hardcoded secret'),
    (r'(?i)SELECT\s.+FROM\s.+\+', 'Possible SQL injection'),
    (r'os\.system\s*\(', 'Command injection via os.system'),
    (r'subprocess\.call.*shell\s*=\s*True', 'Shell injection risk'),
    (r'pickle\.loads?\s*\(', 'Unsafe deserialization (pickle)'),
    (r'yaml\.load\s*\((?!.*Loader)', 'Unsafe yaml.load (use safe_load)'),
    (r'verify\s*=\s*False', 'SSL verification disabled'),
    (r'hashlib\.md5\b|hashlib\.sha1\b', 'Weak hashing algorithm'),
]

warnings = [msg for pattern, msg in patterns if re.search(pattern, content)]

if warnings:
    print(json.dumps({'systemMessage': 'Security check: ' + ' | '.join(warnings)}))
