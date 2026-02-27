from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import defaultdict
import math

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

# Catalog import
from ..vuln_catalog import CATALOG, requires_manual_remediation

# 한국 시간대 (UTC+9)
KST = timezone(timedelta(hours=9))


# ================================
# Catalog → dict 매핑
# ================================
# - 키는 모두 대문자 코드로 통일 (예: u-01, U-01, u01 모두 U-01로 매핑)
CATALOG_MAP = {
    c.code.upper(): c for c in CATALOG
}


# ================================
# Jinja2 Template 환경 설정
# ================================
REPORTS_DIR = Path(__file__).parent
TEMPLATE_DIR = REPORTS_DIR / "templates"
FONTS_DIR = REPORTS_DIR / "fonts"

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=True
)


# ================================
# Path 기반 파이 차트 (중심 정렬·빈틈 없음, PDF 렌더링 안정)
# ================================
def _pie_slices_from_ratios(values: list[int], total: int) -> list[dict]:
    """비율 리스트로 path d 문자열 생성. 12시 방향 시작, 시계방향. 중심 (100,100) r=50."""
    if not total or not values:
        return []
    cx, cy, r = 100, 100, 50

    def point(deg: float) -> tuple[float, float]:
        rad = math.radians(deg)
        return (cx + r * math.sin(rad), cy - r * math.cos(rad))

    slices = []
    start = 0.0
    for i, v in enumerate(values):
        ratio = v / total
        angle_deg = ratio * 360.0
        x1, y1 = point(start)
        # 마지막 슬라이스: 360°에 정확히 맞춰 빈틈 제거
        if i == len(values) - 1:
            x2, y2 = point(360.0)
        else:
            end = start + angle_deg
            x2, y2 = point(end)
        # 180° 초과 호는 large-arc-flag=1 필요 (그렇지 않으면 반대편 작은 호가 그려져 빈틈 발생)
        large = 1 if angle_deg > 180 else 0
        d = f"M{cx} {cy} L{x1:.4f} {y1:.4f} A{r} {r} 0 {large} 1 {x2:.4f} {y2:.4f} Z"
        slices.append({"path_d": d})
        start = start + angle_deg
    return slices


def _pie_data(items: list[tuple[int, str, str]]) -> list[dict]:
    """(value, color, label) 리스트 → path + color + label. value>0인 항목만."""
    filtered = [(v, c, l) for v, c, l in items if v > 0]
    if not filtered:
        return []
    total = sum(v for v, _, _ in filtered)
    values = [v for v, _, _ in filtered]
    path_slices = _pie_slices_from_ratios(values, total)
    return [
        {"path_d": s["path_d"], "color": c, "label": l, "value": v}
        for (v, c, l), s in zip(filtered, path_slices)
    ]


# ================================
# PDF 생성 함수 (로컬 폰트 경로 해석을 위해 base_url 설정)
# ================================
def make_pdf(html_string: str, output_path: str):
    html_obj = HTML(string=html_string, base_url=str(REPORTS_DIR))
    html_obj.write_pdf(output_path)
    return output_path


# ================================
# 취약점 Catalog 매핑 (진단용)
# ================================
def enrich_vulnerabilities(vulns: list[dict]):

    enriched = []
    status_debug = defaultdict(int)  # 디버깅용

    for v in vulns:

        # 코드 정규화: 공백 제거 + 대문자 통일
        raw_code = v.get("check_id") or v.get("code")
        code = (raw_code or "").strip().upper()
        catalog = CATALOG_MAP.get(code)

        # status 정규화: 소문자로 변환하고 빈 값은 "unknown"으로 처리
        raw_status = v.get("status", "")
        status = str(raw_status).strip().lower() if raw_status else "unknown"

        # 수동조치 필요 여부 (플래그만 별도, 상태값은 result.json 그대로 유지)
        manual_flag = bool(v.get("requires_manual_remediation")) or requires_manual_remediation(code) or status == "manual"

        status_debug[status] += 1  # 디버깅용

        # 카탈로그 정보가 없더라도 항목은 유지 (기타 항목으로 처리)
        if catalog:
            category = catalog.category
            name = catalog.name
            severity = str(catalog.severity).lower()
            compliance = catalog.compliance
        else:
            # 진단 엔진에서 온 필드가 있으면 우선 사용, 없으면 기본값
            category = v.get("category") or "기타"
            name = v.get("description") or v.get("name") or code
            severity = str(v.get("severity") or "low").lower()
            compliance = v.get("compliance") or []

        enriched.append({
            "check_id": code,
            "category": category,
            "description": name,
            "severity": severity,
            "isms": ", ".join(compliance),

            "hostname": v.get("hostname", "-"),
            "status": status,
            "regression": v.get("regression", False),
            "current_value": v.get("current_value"),
            "expected_value": v.get("expected_value"),
            "details": v.get("details", []),
            "requires_manual_remediation": manual_flag,
        })

    # 디버깅: status 분포 출력
    print(f"[DEBUG] Status distribution: {dict(status_debug)}")

    return enriched


# ================================
# 조치 결과 Catalog 매핑
# ================================
def enrich_remediation(vulns: list[dict]):
    enriched = []
    for v in vulns:
        check_id = (v.get("check_id") or "").strip().upper()
        catalog = CATALOG_MAP.get(check_id)
        if catalog:
            category = catalog.category
            description = catalog.name
            severity = str(catalog.severity).upper()
        else:
            category = v.get("category") or "기타"
            description = v.get("description") or check_id
            severity = (v.get("severity") or "LOW").upper()

        enriched.append({
            "check_id": check_id,
            "category": category,
            "description": description,
            "severity": severity,
            "hostname": v.get("hostname", "-"),
            "before_status": v.get("before_status"),
            "after_status": v.get("after_status"),
            "regression": v.get("regression", False),
            "current_value": v.get("current_value") or "",
            "expected_value": v.get("expected_value") or v.get("after_value") or "",
            "details": v.get("details") if isinstance(v.get("details"), list) else ([v.get("details")] if v.get("details") else []),
            "before_evidence": v.get("before_evidence") or [],
            "after_evidence": v.get("after_evidence") or [],
            "has_remediation_detail": v.get("has_remediation_detail", False),
        })
    return enriched


# ================================
# 그룹핑 + 통계 생성
# ================================
def build_analysis_statistics(vulnerabilities):

    severity_count = defaultdict(int)
    category_map = defaultdict(list)

    # 취약(vulnerable) + 기타(manual) 항목만 위험도 분포에 포함 (result.json status 그대로 사용)
    for v in vulnerabilities:
        status = v.get("status", "").lower()

        # 위험도 분포: 취약 + MANUAL status 만 사용
        if status in ["vulnerable", "manual"]:
            # severity는 소문자(high/medium/low)로 정규화
            sev = str(v.get("severity") or "").lower()
            if not sev:
                sev = "low"
            severity_count[sev] += 1
        category_map[v["category"]].append(v)

    return severity_count, category_map


# ================================
# 1. 전체 서버 진단 보고서
# ================================
def generate_analysis_global_pdf(data: dict):

    vulnerabilities = enrich_vulnerabilities(
        data["vulnerabilities"]
    )

    severity_count, category_map = \
        build_analysis_statistics(vulnerabilities)

    # 화이트보드 리스트: 서버별 osver, IP, hostname (data에 있으면 사용, 없으면 취약점에서 추출)
    server_list = data.get("server_list")
    if not server_list:
        seen = set()
        server_list = []
        for v in vulnerabilities:
            h = v.get("hostname", "-")
            if h not in seen:
                seen.add(h)
                server_list.append({"hostname": h, "ip": "-", "osver": "-", "os": "-"})
        if not server_list:
            server_list = [{"hostname": "-", "ip": "-", "osver": "-", "os": "-"}]

    # 카테고리별 취약/기타(수동조치 포함) 항목 개수 계산 (status 기준)
    category_labels = []
    category_data = []
    for cat, vulns in category_map.items():
        category_labels.append(cat)
        # 취약 + MANUAL status 항목 카운트
        vulnerable_like_count = sum(
            1
            for v in vulns
            if v.get("status", "").lower() in ["vulnerable", "manual"]
        )
        category_data.append(vulnerable_like_count)

    # 1. 위험도별 파이 차트 (path 기반, 중심 정렬·빈틈 없음)
    high = severity_count.get("high", 0) or 0
    medium = severity_count.get("medium", 0) or 0
    low = severity_count.get("low", 0) or 0
    severity_pie = _pie_data([(high, "#cf222e", "High"), (medium, "#fb8500", "Medium"), (low, "#1a7f37", "Low")])

    # 2. 카테고리별 파이 차트 (path 기반)
    category_pie = []
    category_total = sum(category_data) if category_data else 0
    pie_colors = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"]
    if category_total > 0:
        cat_items = [
            (category_data[i], pie_colors[i % len(pie_colors)], category_labels[i])
            for i in range(len(category_labels))
            if category_data[i] > 0
        ]
        category_pie = _pie_data(cat_items)

    # 서버별 상세 요약 생성 (status 기준)
    server_details = data.get("server_details", [])
    if not server_details:
        # server_list에서 서버별로 통계 생성
        server_details = []
        for server in server_list:
            hostname = server.get("hostname")
            ip = server.get("ip", "-")

            # 해당 서버의 취약점 필터링
            server_vulns = [v for v in vulnerabilities if v.get("hostname") == hostname]

            total_items = len(server_vulns)
            safe = sum(1 for v in server_vulns if v.get("status", "").lower() == "safe")
            vulnerable = sum(1 for v in server_vulns if v.get("status", "").lower() == "vulnerable")
            manual = sum(1 for v in server_vulns if v.get("status", "").lower() == "manual")

            server_details.append({
                "hostname": hostname,
                "ip": ip,
                "total_items": total_items,
                "safe": safe,
                "vulnerable": vulnerable,
                "manual": manual
            })

    # ===== 요약 수치도 여기서 일관되게 재계산 (result.json status 그대로) =====
    safe_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "safe")
    vulnerable_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "vulnerable")
    manual_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "manual")
    target_count = len(server_list)
    total_items = len(CATALOG) * target_count if target_count > 0 else len(vulnerabilities)

    # 3. 결과 요약 파이 차트 (path 기반)
    result_pie = _pie_data([(safe_total, "#1a7f37", "양호"), (vulnerable_total, "#cf222e", "취약"), (manual_total, "#9a6700", "기타")])

    # 기존 summary 가 있으면 기본값으로 사용하되, 핵심 수치는 덮어씀
    summary = dict(data.get("summary") or {})
    summary.update(
        total_targets=target_count,
        total_items=total_items,
        safe=safe_total,
        vulnerable=vulnerable_total,
        manual=manual_total,
        action_required=vulnerable_total + manual_total,
    )

    template = env.get_template("analysis_global.html")

    html = template.render(
        meta={
            "generated_at": datetime.now(KST).strftime("%Y-%m-%d %H:%M"),
            "target_count": target_count,
        },
        summary=summary,
        vulnerabilities=vulnerabilities,
        severity_count=severity_count,
        severity_pie=severity_pie,
        result_pie=result_pie,
        category_map=category_map,
        category_labels=category_labels,
        category_data=category_data,
        category_pie=category_pie,
        server_list=server_list,
        server_details=server_details,
    )

    output_path = "analysis_global_report.pdf"

    return make_pdf(html, output_path)


# ================================
# 2. 특정 서버 진단 보고서
# ================================
def generate_analysis_server_pdf(data: dict):

    vulnerabilities = enrich_vulnerabilities(
        data["vulnerabilities"]
    )

    severity_count, category_map = \
        build_analysis_statistics(vulnerabilities)

    # 단일 서버 요약도 result.json status 기준으로 재계산 (회귀는 별도 집계)
    regression_total = sum(1 for v in vulnerabilities if v.get("regression"))
    safe_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "safe")
    vulnerable_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "vulnerable" and not v.get("regression"))
    manual_total = sum(1 for v in vulnerabilities if v.get("status", "").lower() == "manual" and not v.get("regression"))
    total_items = len(CATALOG)

    summary = dict(data.get("summary") or {})
    summary.update(
        total_items=total_items,
        regression=regression_total,
        safe=safe_total,
        vulnerable=vulnerable_total,
        manual=manual_total,
        action_required=regression_total + vulnerable_total + manual_total,
    )

    server_meta = data.get("server_meta") or {}
    hostname = data.get("hostname", "-")

    # 회귀/취약/수동조치/양호별로 그룹화 (회귀는 취약·수동조치에서 분리, 카테고리→코드 순 정렬)
    def _sort_key(v):
        c = (v.get("check_id") or "").strip().upper()
        num = 999
        if c.startswith("U-") and len(c) >= 4:
            try:
                num = int(c[2:].split()[0])
            except ValueError:
                pass
        return (v.get("category", "기타"), num)

    regression_items = sorted(
        [v for v in vulnerabilities if v.get("regression")],
        key=_sort_key
    )
    safe_items = sorted(
        [v for v in vulnerabilities if v.get("status", "").lower() == "safe"],
        key=_sort_key
    )
    vuln_items = sorted(
        [v for v in vulnerabilities if v.get("status", "").lower() == "vulnerable" and not v.get("regression")],
        key=_sort_key
    )
    manual_items = sorted(
        [v for v in vulnerabilities if v.get("status", "").lower() == "manual" and not v.get("regression")],
        key=_sort_key
    )

    template = env.get_template("analysis_server.html")

    html = template.render(
        meta={
            "generated_at": datetime.now(KST).strftime("%Y.%m.%d %H:%M (한국시간)"),
            "hostname": hostname,
        },
        server_meta=server_meta,
        summary=summary,
        vulnerabilities=vulnerabilities,
        severity_count=severity_count,
        category_map=category_map,
        regression_items=regression_items,
        safe_items=safe_items,
        vuln_items=vuln_items,
        manual_items=manual_items,
    )

    output_path = f"analysis_{data['hostname']}.pdf"

    return make_pdf(html, output_path)


# ================================
# 3. 전체 서버 조치 보고서
# ================================
def generate_remediation_global_pdf(data: dict):

    vulnerabilities = enrich_remediation(
        data["vulnerabilities"]
    )

    # 서버 리스트: data에 있으면 그대로 사용, 없으면 취약점의 hostname 기준으로 구성
    server_list = data.get("server_list")
    if not server_list:
        seen = set()
        server_list = []
        for v in vulnerabilities:
            h = v.get("hostname", "-")
            if h in seen:
                continue
            seen.add(h)
            server_list.append({
                "hostname": h,
                "os": "-",
                "osver": "-",
                "ip": "-",
            })

    # 조치 결과 요약: 서버별 그룹, 카테고리별 → 항목코드(U-) 순차 정렬
    by_hostname = defaultdict(list)
    for v in vulnerabilities:
        by_hostname[v.get("hostname", "-")].append(v)

    def _remediation_code_sort_key(item):
        """U-01, U-02, ... 순으로 정렬."""
        c = (item.get("check_id") or "").strip().upper()
        if c.startswith("U-") and len(c) >= 4:
            try:
                return int(c[2:].split()[0])
            except ValueError:
                return 999
        return 999

    # 서버 순서는 server_list 순서 유지, 각 서버 내에서는 카테고리 → 항목코드 순
    server_order = [s.get("hostname") for s in server_list]
    vulnerabilities_by_server = []
    for hostname in server_order:
        items = by_hostname.get(hostname, [])
        # 카테고리별로 묶은 뒤, 카테고리 내에서 항목코드(U-) 순 정렬
        by_cat = defaultdict(list)
        for v in items:
            by_cat[v.get("category", "기타")].append(v)
        for cat in by_cat:
            by_cat[cat].sort(key=_remediation_code_sort_key)
        # 카테고리별로 그룹화된 리스트 (템플릿에서 카테고리 먼저, 그다음 U- 코드 표시용)
        entries_by_category = []
        for cat in sorted(by_cat.keys()):
            entries_by_category.append({"category": cat, "entries": by_cat[cat]})
        sorted_items = []
        for g in entries_by_category:
            sorted_items.extend(g["entries"])
        vulnerabilities_by_server.append({
            "hostname": hostname,
            "entries": sorted_items,
            "entries_by_category": entries_by_category,
        })

    template = env.get_template("remediation_global.html")

    html = template.render(
        meta={
            "generated_at":
                datetime.now(KST).strftime("%Y-%m-%d %H:%M"),
            "target_count":
                data["summary"]["total_targets"]
        },
        summary=data["summary"],
        vulnerabilities=vulnerabilities,
        server_list=server_list,
        vulnerabilities_by_server=vulnerabilities_by_server,
    )

    output_path = "remediation_global_report.pdf"

    return make_pdf(html, output_path)


# ================================
# 4. 특정 서버 조치 보고서
# ================================
def generate_remediation_server_pdf(data: dict):
    vulnerabilities = enrich_remediation(data["vulnerabilities"])
    server_meta = data.get("server_meta") or {}
    hostname = data.get("hostname") or "-"

    # 카테고리별로 그룹화 후, 카테고리 내에서 코드(U-xx) 순차 정렬
    by_category = defaultdict(list)
    for v in vulnerabilities:
        by_category[v["category"]].append(v)

    def _code_sort_key(item):
        """U-01, U-02, ... U-51 순으로 정렬하기 위한 키."""
        c = (item.get("check_id") or "").strip().upper()
        if c.startswith("U-") and len(c) >= 4:
            try:
                return int(c[2:].split()[0])
            except ValueError:
                return 999
        return 999

    for cat in by_category:
        by_category[cat].sort(key=_code_sort_key)

    template = env.get_template("remediation_server.html")
    html = template.render(
        meta={
            "generated_at": datetime.now(KST).strftime("%Y-%m-%d %H:%M (한국기준)"),
            "hostname": hostname,
            "os_type": server_meta.get("os", "-"),
            "os_version": server_meta.get("osver", "-"),
            "ip": server_meta.get("ip", "-"),
        },
        summary=data["summary"],
        vulnerabilities=vulnerabilities,
        by_category=dict(by_category),
    )
    output_path = f"remediation_{hostname}.pdf"
    return make_pdf(html, output_path)