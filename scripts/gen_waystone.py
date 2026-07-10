"""Generate the CN Waystone data file (frontend/public/generated/).

Thin wrapper over lib.crosswalk_gen — waystone map mods translate 1:1 via the
trade-stat-id crosswalk. See that module for the schema/algorithm.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import crosswalk_gen  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "reference" / "generated"


def main():
    items, report = crosswalk_gen.generate(
        ref_path=REF / "Generated.Waystone.min.json",
        trade_ids_path=REF / "trade" / "WaystoneTradeStatIds.json",
        out_path=ROOT / "frontend" / "public" / "generated" / "Generated.Waystone.CN.json",
        report_path=ROOT / "reports" / "waystone_report.json",
    )
    print(f"waystone tokens: {len(items)}")
    print(f"translated {report['translated_pct']}%  regex-distinguishing {report['regex_ok_pct']}%")
    if report["translation_misses"]:
        print("misses:", [m["en"][:40] for m in report["translation_misses"]])
    if report["regex_collisions"]:
        print("collisions:", [c["zh"][:30] for c in report["regex_collisions"]])
    for it in items[:12]:
        print(f"  {it['en'][:44]:44} | {it['zhText'][:26]:26} | {it['regex']}")


if __name__ == "__main__":
    main()
