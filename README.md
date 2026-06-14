# ![Mɪɴᴅɜʀ](./frontend/public/mind3r.webp) Mɪɴᴅɜʀ

### Reminders <!-- markdownlint-disable-line MD001 -->

---

![CodeQL](https://github.com/chump29/mind3r/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![License](https://img.shields.io/github/license/chump29/mind3r?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3")

---

### 🐳 Docker

#### Compose Flow:

```mermaid
flowchart LR
frontend@{shape: rounded, label: "mind3r-frontend:80"}
frontendPort@{shape: rounded, label: "http://localhost:94"}
backend@{shape: rounded, label: "mind3r-backend:5557"}
backendPort@{shape: rounded, label: "http://localhost:5559"}
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
