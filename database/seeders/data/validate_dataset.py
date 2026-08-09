import csv

path = r'e:\PROGRAMMING\Thesis\Project\indie-studio-saas\database\seeders\data\developer_node_features.csv'

skill_cols = []
rows = []
with open(path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    skill_cols = [c for c in reader.fieldnames if c.startswith('skill_')]
    for row in reader:
        rows.append(row)

print(f'Rows: {len(rows)} | Skill cols: {len(skill_cols)}')

# 1. Capacity logic
cap_errors = []
for r in rows:
    eid = r['employee_id']
    status = r['availability_status']
    days = int(r['days_until_free'])
    concurrent = int(r['concurrent_tasks_count'])
    if status == 'Busy' and (days == 0 or concurrent == 0):
        cap_errors.append(f'  ID {eid}: Busy but days={days} or concurrent={concurrent}')
    if status == 'Available' and days != 0:
        cap_errors.append(f'  ID {eid}: Available but days={days}')
print(f'Capacity violations: {len(cap_errors)}')
for e in cap_errors:
    print(e)

# 2. Sparsity (at least 70% zeros = at most 30% non-zero)
sparse_errors = []
for r in rows:
    eid = r['employee_id']
    nz = sum(1 for c in skill_cols if int(r[c]) > 0)
    pct = nz / 75
    if pct > 0.30:
        sparse_errors.append(f'  ID {eid}: {nz}/75 non-zero ({pct:.0%})')
print(f'Sparsity violations (>30% non-zero): {len(sparse_errors)}')
for e in sparse_errors:
    print(e)

# 3. Skill range (0-5)
range_errors = []
for r in rows:
    eid = r['employee_id']
    for c in skill_cols:
        v = int(r[c])
        if v < 0 or v > 5:
            range_errors.append(f'  ID {eid} {c}={v}')
print(f'Range violations (outside 0-5): {len(range_errors)}')
for e in range_errors:
    print(e)

# 4. experience_years 0-15
exp_errors = [r['employee_id'] for r in rows if not (0 <= int(r['experience_years']) <= 15)]
print(f'Experience range violations: {len(exp_errors)}')

# 5. Out of Office check
ooo = [r for r in rows if r['availability_status'] == 'Out of Office']
print(f'Out of Office rows: {len(ooo)} (IDs: {[r["employee_id"] for r in ooo]})')
for r in ooo:
    print(f'  ID {r["employee_id"]}: days={r["days_until_free"]} concurrent={r["concurrent_tasks_count"]}')

# 6. Distinct positions check
positions = set(r['position'] for r in rows)
print(f'Distinct positions used: {len(positions)}')
for p in sorted(positions):
    count = sum(1 for r in rows if r['position'] == p)
    print(f'  {p}: {count}')

print('--- ALL CHECKS COMPLETE ---')
