# AUTOISMS Ansible

Ansible 인벤토리와 플레이북 설정. 다중 서버 진단·조치 시 사용합니다.

---

## 목차

- [구조](#구조)
- [인벤토리](#인벤토리)
- [백엔드 연동](#백엔드-연동)

---

## 구조

```
ansible/
├── inventory.yaml       # YAML 형식 인벤토리 (권장)
├── inventory.ini        # INI 형식 인벤토리
├── ansible.cfg          # Ansible 설정
├── playbooks/
│   └── diagnostic.yml   # 진단 플레이북
└── README.md
```

---

## 인벤토리

### inventory.yaml 예시

```yaml
all:
  hosts:
    target1:
      ansible_host: 192.168.1.10
      ansible_port: 22
      ansible_user: root
      ansible_ssh_private_key_file: /path/to/id_rsa
      # 또는 ansible_password: "your_password"
    target2:
      ansible_host: 192.168.1.11
      ansible_port: 22
      ansible_user: ubuntu
      ansible_ssh_private_key_file: /path/to/id_rsa
  vars:
    ansible_connection: ssh
    ansible_ssh_common_args: -o StrictHostKeyChecking=no
    ansible_become_password: ''
    ansible_become_flags: -n
```

### 변수 설명

| 변수 | 설명 |
|------|------|
| ansible_host | 실제 IP 또는 호스트명 |
| ansible_port | SSH 포트 (기본 22) |
| ansible_user | SSH 사용자 |
| ansible_ssh_private_key_file | SSH 개인키 경로 |
| ansible_password | 비밀번호 인증 시 사용 |

---

## 백엔드 연동

1. **인벤토리 경로**: `ANSIBLE_INVENTORY_PATH` 환경 변수 또는 `ansible/inventory.yaml` 기본 경로
2. **프론트엔드**: "Ansible Inventory 확인" 버튼 클릭 시 `GET /api/inventory/load` 호출
3. **서버 등록**: 인벤토리에서 불러온 서버를 `POST /api/inventory/register-servers`로 일괄 등록
4. **진단 실행**: `POST /api/analysis/run-bulk` 호출 시 `use_ansible=true`로 Ansible 플레이북 사용 가능
