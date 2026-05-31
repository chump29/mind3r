# ![Mɪɴᴅɜʀ](./frontend/public/mind3r.webp) Mɪɴᴅɜʀ

### Reminders <!-- markdownlint-disable-line MD001 -->

---

![CodeQL](https://github.com/$_user/$_repo/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![License](https://img.shields.io/github/license/$_user/$_repo?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3")

---

<!-- ! TODO
### 📷 Screenshot

![Screenshot](./images/screenshot.png)

---
-->

### 🐳 Docker

#### Compose Flow:

```mermaid
flowchart LR
frontend@{shape: rounded, label: "mind3r-frontend:80"}
frontendPort@{shape: rounded, label: "http://localhost:$_frontendPort"}
backend@{shape: rounded, label: "mind3r-backend:5557"}
backendPort@{shape: rounded, label: "http://localhost:$_backendPort"}
frontend-->frontendPort
backend-->backendPort
```

#### Building Images:

```bash
./build.sh
```

---

### 📄 Documentation

#### Building:

```bash
./docs.sh
```

#### Links:

- [Frontend](./frontend/README.md "Frontend")
- [Backend](./backend/README.md "Backend")
