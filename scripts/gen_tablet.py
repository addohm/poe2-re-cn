"""Generate the CN Tablet data file (frontend/public/generated/).

Tablet precursor-tablet affixes translate 1:1 via the trade-stat-id crosswalk,
same as waystone. Thin wrapper over lib.crosswalk_gen.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import crosswalk_gen  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "reference" / "generated"


def main():
    items, report = crosswalk_gen.generate(
        ref_path=REF / "Generated.Tablet.min.json",
        trade_ids_path=REF / "trade" / "TabletTradeStatIds.json",
        out_path=ROOT / "frontend" / "public" / "generated" / "Generated.Tablet.CN.json",
        report_path=ROOT / "reports" / "tablet_report.json",
    )
    print(f"tablet tokens: {len(items)}")
    print(f"translated {report['translated_pct']}%  regex-distinguishing {report['regex_ok_pct']}%")
    if report["translation_misses"]:
        print("misses:", [m["en"][:40] for m in report["translation_misses"]])
    if report["regex_collisions"]:
        print("collisions:", [c["zh"][:30] for c in report["regex_collisions"]])
    for it in items[:12]:
        print(f"  {it['en'][:44]:44} | {it['zhText'][:26]:26} | {it['regex']}")


if __name__ == "__main__":
    main()
