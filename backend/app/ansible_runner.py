from __future__ import annotations

import json
import logging
import os
import platform
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class AnsibleRunner:
    """Ansible playbook 실행을 위한 래퍼 클래스"""

    def __init__(self, ansible_path: str | None = None):
        if ansible_path:
            self.ansible_path = ansible_path
        else:
            import shutil
            if platform.system() == "Windows":
                found_path = shutil.which("ansible-playbook")
                self.ansible_path = found_path or "ansible-playbook"
            else:
                self.ansible_path = "ansible-playbook"

    def run_playbook(
        self,
        playbook_path: str,
        inventory_path: str,
        limit: str | None = None,
        extra_vars: dict[str, Any] | None = None,
        become: bool = True,
        become_user: str = "root",
        become_password: str | None = None,
        config_file: str | None = None,
    ) -> dict[str, Any]:
        cmd = [
            self.ansible_path, "-i", inventory_path,
        ]
        if limit:
            cmd.extend(["--limit", limit])
        if become:
            cmd.append("--become")
        if become_user != "root":
            cmd.extend(["--become-user", become_user])
        if extra_vars:
            cmd.extend(["--extra-vars", json.dumps(extra_vars)])
        cmd.extend([playbook_path, "-v"])

        logger.info("Running ansible-playbook: %s", " ".join(cmd))
        print(f"[ANSIBLE] ansible-playbook 실행 중: limit={limit}, playbook={playbook_path}")
        env = os.environ.copy()
        # NOPASSWD 전제: sudo -n 사용, 비밀번호 프롬프트 없음
        env["ANSIBLE_BECOME_ASK_PASS"] = "False"
        env["ANSIBLE_BECOME_PASSWORD"] = become_password if become_password else ""
        env["ANSIBLE_BECOME_FLAGS"] = "-n"
        if config_file:
            env["ANSIBLE_CONFIG"] = config_file
        if platform.system() == "Windows":
            env["ANSIBLE_FORCE_COLOR"] = "0"
            env["ANSIBLE_NOCOLOR"] = "1"

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                env=env,
            )
            output_lines = []
            for line in process.stdout:
                output_lines.append(line)
            returncode = process.wait(timeout=300)
            output = "".join(output_lines)
            success = returncode == 0
            result_data = {}
            try:
                if output:
                    result_data = json.loads(output)
            except json.JSONDecodeError:
                result_data = {"output": output}
            return {
                "success": success,
                "output": output,
                "result": result_data,
                "returncode": returncode,
            }
        except subprocess.TimeoutExpired:
            logger.error("Ansible playbook execution timeout")
            return {"success": False, "output": "Execution timeout (5 minutes)", "result": {}, "returncode": -1}
        except Exception as e:
            logger.error("Ansible execution failed: %s", e)
            return {"success": False, "output": str(e), "result": {}, "returncode": -1}

    def run_script_via_ansible(
        self,
        script_path: str,
        inventory_path: str,
        limit: str,
        become: bool = True,
        results_dest_base: str | None = None,
        result_run_id: str | None = None,
        become_password: str | None = None,
    ) -> dict[str, Any]:
        """script.sh 실행 후 result.json을 메인 서버의 analysis_results/<host>/<result_run_id>/ 에 저장."""
        runner_dir = Path(__file__).resolve().parent  # backend/app
        project_root = runner_dir.parent.parent      # backend -> Autoisms
        playbook_path = project_root / "ansible" / "playbooks" / "diagnostic.yml"
        if not playbook_path.exists():
            raise FileNotFoundError(f"Playbook 없음: {playbook_path}")

        extra_vars: dict[str, Any] = {
            "script_path": script_path,
            # NOPASSWD: Ansible이 become 비밀번호를 요구하지 않도록 명시
            "ansible_become_password": "",
            "ansible_become_flags": "-n",
        }
        if results_dest_base:
            extra_vars["results_dest_base"] = results_dest_base
        if result_run_id:
            extra_vars["result_run_id"] = result_run_id

        ansible_cfg = project_root / "ansible" / "ansible.cfg"
        return self.run_playbook(
            playbook_path=str(playbook_path),
            inventory_path=inventory_path,
            limit=limit,
            become=become,
            extra_vars=extra_vars,
            become_password=become_password,
            config_file=str(ansible_cfg) if ansible_cfg.exists() else None,
        )