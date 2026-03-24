from app import create_app

app = create_app()
print("=== All Routes Registered ===")
for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
    methods = ",".join(sorted(m for m in rule.methods if m not in ("HEAD", "OPTIONS")))
    print(f"  [{methods}] {rule.rule}")
print("=== APP STARTUP OK ===")
