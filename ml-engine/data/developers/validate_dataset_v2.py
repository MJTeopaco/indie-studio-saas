import csv
import os

path = os.path.join(os.path.dirname(__file__), 'developer_node_features_v2.csv')

rows = []
skill_cols = []
with open(path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    skill_cols = [c for c in fieldnames if c.startswith('skill_')]
    for row in reader:
        rows.append(row)

n_skills = len(skill_cols)
print(f"Rows: {len(rows)} | Skill cols: {n_skills} | Total cols: {len(fieldnames)}")
print(f"Max allowed non-zero: {int(n_skills * 0.30)} (30% of {n_skills})")

# 1. Capacity logic
cap_errors = []
for r in rows:
    eid = r['employee_id']
    status = r['availability_status']
    days = int(r['days_until_free'])
    concurrent = int(r['concurrent_tasks_count'])
    if status == 'Busy' and (days == 0 or concurrent == 0):
        cap_errors.append(f"  ID {eid}: Busy but days={days} concurrent={concurrent}")
    if status == 'Available' and days != 0:
        cap_errors.append(f"  ID {eid}: Available but days={days}")
    if status == 'Out of Office' and concurrent != 0:
        cap_errors.append(f"  ID {eid}: Out of Office but concurrent={concurrent}")
print(f"Capacity violations: {len(cap_errors)}")
for e in cap_errors: print(e)

# 2. Sparsity
max_nz = int(n_skills * 0.30)
sparse_errors = []
for r in rows:
    eid = r['employee_id']
    nz = sum(1 for c in skill_cols if int(r[c]) > 0)
    if nz > max_nz:
        sparse_errors.append(f"  ID {eid}: {nz}/{n_skills} non-zero ({nz/n_skills:.0%})")
print(f"Sparsity violations (>{max_nz} non-zero): {len(sparse_errors)}")
for e in sparse_errors: print(e)

# 3. Skill range 0-5
range_errors = []
for r in rows:
    eid = r['employee_id']
    for c in skill_cols:
        v = int(r[c])
        if v < 0 or v > 5:
            range_errors.append(f"  ID {eid} {c}={v}")
print(f"Range violations (outside 0-5): {len(range_errors)}")

# 4. experience_years 0-15
exp_errors = [r['employee_id'] for r in rows if not (0 <= int(r['experience_years']) <= 15)]
print(f"Experience range violations: {len(exp_errors)}")

# 5. Founders check
for i, (eid, pos) in enumerate([(1,'Technical Product Manager'),(2,'Business Analyst'),(3,'Solutions Architect'),(4,'Data Scientist')], 1):
    r = next(rr for rr in rows if rr['employee_id'] == str(eid))
    match = r['position'] == pos
    print(f"Founder {eid} ({pos}): {'OK' if match else 'MISMATCH → ' + r['position']}")

# 6. Position distribution
from collections import Counter
pos_dist = Counter(r['position'] for r in rows)
print(f"\nDistinct positions: {len(pos_dist)}")
for p, cnt in sorted(pos_dist.items()):
    print(f"  {p}: {cnt}")

# 7. Out of Office
ooo = [r for r in rows if r['availability_status'] == 'Out of Office']
print(f"\nOut of Office: {len(ooo)}")
for r in ooo:
    print(f"  ID {r['employee_id']}: days={r['days_until_free']} concurrent={r['concurrent_tasks_count']}")

print('\n--- ALL CHECKS COMPLETE ---')
