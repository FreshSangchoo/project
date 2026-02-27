from __future__ import annotations

import configparser
import logging
import os
from pathlib import Path
from typing import Any

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

logger = logging.getLogger(__name__)


class InventoryParser:
    """Ansible inventory 파일 파서 (YAML/INI 형식 지원)"""

    def __init__(self, inventory_path: str | None = None):
        """
        Args:
            inventory_path: inventory 파일 경로 (None이면 환경변수 또는 기본 경로 사용)
        """
        if inventory_path:
            self.inventory_path = Path(inventory_path)
        else:
            # 환경변수에서 경로 가져오기
            env_path = os.getenv("ANSIBLE_INVENTORY_PATH")
            if env_path:
                self.inventory_path = Path(env_path)
            else:
                # 기본 경로: 프로젝트 루트/ansible/inventory.yaml 또는 inventory.ini
                base = Path(__file__).parent.parent.parent
                yaml_path = base / "ansible" / "inventory.yaml"
                ini_path = base / "ansible" / "inventory.ini"
                
                if yaml_path.exists():
                    self.inventory_path = yaml_path
                elif ini_path.exists():
                    self.inventory_path = ini_path
                else:
                    # 둘 다 없으면 기본값으로 yaml 경로 사용
                    self.inventory_path = yaml_path

    def parse(self) -> dict[str, dict[str, Any]]:
        """
        Inventory 파일 파싱
        
        Returns:
            {hostname: {ansible_host, ansible_port, ansible_user, ansible_password, ...}}
        """
        if not self.inventory_path.exists():
            logger.warning(f"Inventory 파일이 없습니다: {self.inventory_path}")
            return {}

        suffix = self.inventory_path.suffix.lower()
        
        if suffix in [".yaml", ".yml"]:
            return self._parse_yaml()
        elif suffix == ".ini":
            return self._parse_ini()
        else:
            # 확장자가 없거나 알 수 없는 경우, 내용을 보고 판단
            try:
                return self._parse_yaml()
            except Exception:
                return self._parse_ini()

    def _parse_yaml(self) -> dict[str, dict[str, Any]]:
        """YAML 형식 inventory 파싱"""
        if not HAS_YAML:
            raise ImportError("PyYAML이 설치되지 않았습니다. pip install pyyaml")
        
        with open(self.inventory_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        
        if not data:
            return {}
        
        result = {}
        
        # YAML 형식 1: all.hosts 형식
        if "all" in data and "hosts" in data["all"]:
            hosts = data["all"]["hosts"]
            if isinstance(hosts, dict):
                # hosts가 딕셔너리인 경우
                for hostname, vars_dict in hosts.items():
                    if isinstance(vars_dict, dict):
                        result[hostname] = vars_dict
                    else:
                        # 변수가 없는 경우
                        result[hostname] = {}
            elif isinstance(hosts, list):
                # hosts가 리스트인 경우
                for hostname in hosts:
                    result[hostname] = {}
            
            # all.vars에서 공통 변수 가져오기
            if "vars" in data["all"]:
                common_vars = data["all"]["vars"]
                for hostname in result:
                    for key, value in common_vars.items():
                        if key not in result[hostname]:
                            result[hostname][key] = value
        
        # YAML 형식 2: 그룹별 정의
        elif isinstance(data, dict):
            for group_name, group_data in data.items():
                if isinstance(group_data, dict) and "hosts" in group_data:
                    hosts = group_data["hosts"]
                    if isinstance(hosts, dict):
                        for hostname, vars_dict in hosts.items():
                            if isinstance(vars_dict, dict):
                                result[hostname] = vars_dict
                            else:
                                result[hostname] = {}
                    elif isinstance(hosts, list):
                        for hostname in hosts:
                            result[hostname] = {}
                    
                    # 그룹 변수
                    if "vars" in group_data:
                        common_vars = group_data["vars"]
                        for hostname in result:
                            for key, value in common_vars.items():
                                if key not in result[hostname]:
                                    result[hostname][key] = value
        
        # YAML 형식 3: 단순 리스트
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    # 각 항목이 호스트 정보를 담고 있는 경우
                    hostname = item.get("name") or item.get("host") or item.get("hostname")
                    if hostname:
                        result[hostname] = {k: v for k, v in item.items() if k not in ["name", "host", "hostname"]}
        
        return result

    def _parse_ini(self) -> dict[str, dict[str, Any]]:
        """INI 형식 inventory 파싱"""
        config = configparser.ConfigParser(allow_no_value=True)
        config.read(self.inventory_path, encoding="utf-8")
        
        result = {}
        
        for section_name in config.sections():
            # [group:children] 형식은 무시
            if ":children" in section_name:
                continue
            
            # 섹션의 각 호스트 처리
            for hostname in config[section_name]:
                # 호스트명이 변수 정의인 경우 (key=value 형식)
                if "=" in hostname:
                    continue
                
                # 호스트 변수 파싱
                host_vars = {}
                
                # 호스트명 뒤에 변수가 있는 경우: hostname ansible_host=1.2.3.4
                host_line = config[section_name][hostname]
                if host_line:
                    parts = host_line.split()
                    for part in parts:
                        if "=" in part:
                            key, value = part.split("=", 1)
                            host_vars[key.strip()] = value.strip()
                
                # 섹션 변수도 가져오기
                for key, value in config[section_name].items():
                    if "=" in key:
                        var_key, var_value = key.split("=", 1)
                        host_vars[var_key.strip()] = var_value.strip()
                
                result[hostname] = host_vars
        
        return result

    def get_servers(self) -> list[dict[str, Any]]:
        """
        파싱된 inventory에서 서버 목록 추출
        
        Returns:
            [{ip, hostname, port, username, password, key_file, ...}]
        """
        inventory = self.parse()
        servers = []
        
        for hostname, vars_dict in inventory.items():
            # ansible_host 또는 hostname에서 IP 가져오기
            ip = vars_dict.get("ansible_host") or vars_dict.get("ansible_hostname") or hostname
            
            # 포트 (기본값: 22)
            port = int(vars_dict.get("ansible_port", 22))
            
            # 사용자명 (기본값: root)
            username = vars_dict.get("ansible_user") or vars_dict.get("ansible_ssh_user") or "root"
            
            # 패스워드
            password = vars_dict.get("ansible_password") or vars_dict.get("ansible_ssh_pass")
            
            # SSH 키 파일
            key_file = vars_dict.get("ansible_ssh_private_key_file") or vars_dict.get("ansible_private_key_file")
            
            server_info = {
                "hostname": hostname,
                "ip": ip,
                "port": port,
                "username": username,
            }
            
            if password:
                server_info["password"] = password
            if key_file:
                server_info["key_file"] = key_file
            
            # 추가 변수들도 포함
            for key, value in vars_dict.items():
                if key not in ["ansible_host", "ansible_port", "ansible_user", "ansible_password", 
                              "ansible_ssh_private_key_file", "ansible_private_key_file",
                              "ansible_hostname", "ansible_ssh_user", "ansible_ssh_pass"]:
                    server_info[key] = value
            
            servers.append(server_info)
        
        return servers

    def _other_inventory_path(self) -> Path | None:
        """현재 사용 중인 파일이 아닌 다른 inventory 파일 경로 반환 (둘 다 쓰기 위해)."""
        base = self.inventory_path.parent
        yaml_path = base / "inventory.yaml"
        ini_path = base / "inventory.ini"
        if self.inventory_path == yaml_path and ini_path.exists():
            return ini_path
        if self.inventory_path == ini_path and yaml_path.exists():
            return yaml_path
        return None

    def _add_host_yaml(
        self,
        yaml_path: Path,
        hostname: str,
        ansible_host: str,
        ansible_port: int,
        ansible_user: str,
        ansible_ssh_private_key_file: str,
    ) -> None:
        """지정한 YAML inventory 파일에 호스트 한 개 추가 (동기화용)."""
        data: dict[str, Any] = {}
        if yaml_path.exists():
            with open(yaml_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
        if "all" not in data:
            data["all"] = {}
        if "hosts" not in data["all"]:
            data["all"]["hosts"] = {}
        hosts = data["all"]["hosts"]
        if not isinstance(hosts, dict):
            data["all"]["hosts"] = {}
            hosts = data["all"]["hosts"]
        if hostname not in hosts:
            hosts[hostname] = {
                "ansible_host": ansible_host,
                "ansible_port": ansible_port,
                "ansible_user": ansible_user,
                "ansible_ssh_private_key_file": ansible_ssh_private_key_file,
            }
            with open(yaml_path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            logger.info(f"Inventory(YAML)에 호스트 추가됨: {hostname} ({ansible_host}:{ansible_port})")

    def _add_host_ini(
        self,
        ini_path: Path,
        hostname: str,
        ansible_host: str,
        ansible_port: int,
        ansible_user: str,
        ansible_ssh_private_key_file: str,
    ) -> None:
        """INI 형식 inventory에 호스트 한 줄 추가. [all] 섹션에 삽입하며 [all:vars] 앞을 유지합니다."""
        content = ini_path.read_text(encoding="utf-8")
        in_all = False
        for ln in content.splitlines():
            s = ln.strip()
            if s == "[all]":
                in_all = True
                continue
            if in_all and s and not s.startswith("#"):
                if s.startswith("[") and "]" in s:
                    break
                if s.split(None, 1)[0] == hostname:
                    return
        line = (
            f"{hostname} ansible_host={ansible_host} ansible_port={ansible_port} "
            f"ansible_user={ansible_user} ansible_ssh_private_key_file={ansible_ssh_private_key_file}\n"
        )
        lines = content.splitlines(keepends=True)
        insert_idx = None
        in_all = False
        for i, ln in enumerate(lines):
            stripped = ln.strip()
            if stripped == "[all]":
                in_all = True
                continue
            if in_all:
                if stripped.startswith("[") and "]" in stripped:
                    insert_idx = i
                    break
                if stripped and not stripped.startswith("#"):
                    insert_idx = i + 1
        if insert_idx is None and in_all:
            insert_idx = len(lines)
        if insert_idx is None:
            lines.append("\n[all]\n")
            lines.append(line if line.endswith("\n") else line + "\n")
        else:
            lines.insert(insert_idx, line if line.endswith("\n") else line + "\n")
        ini_path.write_text("".join(lines), encoding="utf-8")
        logger.info(f"Inventory(INI)에 호스트 추가됨: {hostname} ({ansible_host}:{ansible_port})")

    def add_host(
        self,
        hostname: str,
        ansible_host: str,
        ansible_port: int = 22,
        ansible_user: str = "root",
        ansible_ssh_private_key_file: str = "/home/main/.ssh/id_rsa",
    ) -> None:
        """
        YAML inventory에 호스트 한 개 추가. INI 파일이 있으면 동일 호스트를 INI에도 추가합니다.
        all.hosts 형식만 지원하며, 기존 all.vars는 유지합니다.
        """
        if not HAS_YAML:
            raise ImportError("PyYAML이 설치되지 않았습니다. pip install pyyaml")

        self.inventory_path.parent.mkdir(parents=True, exist_ok=True)

        data: dict[str, Any] = {}
        if self.inventory_path.exists():
            with open(self.inventory_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}

        if "all" not in data:
            data["all"] = {}
        if "hosts" not in data["all"]:
            data["all"]["hosts"] = {}
        hosts = data["all"]["hosts"]
        if not isinstance(hosts, dict):
            data["all"]["hosts"] = {}
            hosts = data["all"]["hosts"]

        if hostname in hosts:
            raise ValueError(f"호스트 '{hostname}'가 이미 존재합니다.")

        hosts[hostname] = {
            "ansible_host": ansible_host,
            "ansible_port": ansible_port,
            "ansible_user": ansible_user,
            "ansible_ssh_private_key_file": ansible_ssh_private_key_file,
        }

        with open(self.inventory_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        logger.info(f"Inventory에 호스트 추가됨: {hostname} ({ansible_host}:{ansible_port})")

        other_path = self._other_inventory_path()
        if other_path is not None:
            if other_path.suffix.lower() in [".yaml", ".yml"]:
                self._add_host_yaml(other_path, hostname, ansible_host, ansible_port, ansible_user, ansible_ssh_private_key_file)
            else:
                self._add_host_ini(other_path, hostname, ansible_host, ansible_port, ansible_user, ansible_ssh_private_key_file)

    def _remove_host_yaml(self, yaml_path: Path, hostname: str) -> bool:
        """YAML inventory에서 호스트 한 개 제거. 제거했으면 True, 없었으면 False."""
        if not yaml_path.exists():
            return False
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        if "all" not in data or "hosts" not in data["all"] or not isinstance(data["all"]["hosts"], dict):
            return False
        hosts = data["all"]["hosts"]
        if hostname not in hosts:
            return False
        del hosts[hostname]
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        logger.info(f"Inventory(YAML)에서 호스트 제거됨: {hostname}")
        return True

    def _remove_host_ini(self, ini_path: Path, hostname: str) -> bool:
        """INI inventory에서 해당 호스트 한 줄 제거. 제거했으면 True, 없었으면 False."""
        if not ini_path.exists():
            return False
        content = ini_path.read_text(encoding="utf-8")
        lines = content.splitlines(keepends=True)
        new_lines: list[str] = []
        in_all = False
        removed = False
        for ln in lines:
            stripped = ln.strip()
            if stripped == "[all]":
                in_all = True
                new_lines.append(ln)
                continue
            if in_all and stripped and not stripped.startswith("#"):
                if stripped.startswith("[") and "]" in stripped:
                    in_all = False
                    new_lines.append(ln)
                    continue
                if stripped.split(None, 1)[0] == hostname:
                    removed = True
                    continue
            new_lines.append(ln)
        if removed:
            ini_path.write_text("".join(new_lines), encoding="utf-8")
            logger.info(f"Inventory(INI)에서 호스트 제거됨: {hostname}")
        return removed

    def remove_host(self, hostname: str) -> bool:
        """
        Inventory에서 호스트 한 개 제거. YAML/INI 둘 다 있으면 둘 다에서 제거합니다.
        제거했으면 True, 해당 호스트가 없었으면 False.
        """
        suffix = self.inventory_path.suffix.lower()
        removed_primary = False
        if suffix in [".yaml", ".yml"]:
            removed_primary = self._remove_host_yaml(self.inventory_path, hostname)
        elif suffix == ".ini":
            removed_primary = self._remove_host_ini(self.inventory_path, hostname)
        else:
            try:
                removed_primary = self._remove_host_yaml(self.inventory_path, hostname)
            except Exception:
                removed_primary = self._remove_host_ini(self.inventory_path, hostname)
        other_path = self._other_inventory_path()
        if other_path is not None:
            if other_path.suffix.lower() in [".yaml", ".yml"]:
                self._remove_host_yaml(other_path, hostname)
            else:
                self._remove_host_ini(other_path, hostname)
        return removed_primary
