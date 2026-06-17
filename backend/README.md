# ![Mɪɴᴅɜʀ (Backend)](../frontend/public/mind3r.webp) Mɪɴᴅɜʀ (Backend)

### Reminders <!-- markdownlint-disable-line MD001 -->

---

![Backend](https://img.shields.io/badge/Backend-1.0.0-chocolate?style=plastic&logo=docker "Backend")

![Behave](https://img.shields.io/badge/Behave->=1.3.3-informational?style=plastic "Behave") &nbsp;
![FastAPI](https://img.shields.io/badge/FastAPI->=0.137.1-informational?style=plastic&logo=fastapi "FastAPI") &nbsp;
![Peewee](https://img.shields.io/badge/Peewee->=4.1.0-informational?style=plastic "Peewee") &nbsp; <!-- markdownlint-disable-line MD013 -->
![Pydantic](https://img.shields.io/badge/Pydantic->=2.13.4-informational?style=plastic&logo=pydantic "Pydantic") &nbsp;
![SQLite](https://img.shields.io/badge/SQLite-3.49.2-informational?style=plastic&logo=sqlite "SQLite") &nbsp;
![uv](https://img.shields.io/badge/uv->=0.11-informational?style=plastic&logo=uv "uv")

![Coverage](https://img.shields.io/badge/Coverage-91.50%25-success?style=plastic "Coverage")

---

### 🏗️ Architecture

#### API Structure:

```mermaid
flowchart TD
api@{shape: rect, label: "/api"}
add_reminder[["`/add`"]]
delete_reminder[["`/delete/*[pk]*`"]]
get_all_reminders[["`/get`"]]
get_cache_stats[["`/cache`"]]
update_reminder[["`/update/*[pk]*`"]]
get_version[["`/version`"]]
api-->add_reminder
api-->delete_reminder
api-->get_all_reminders
api-->get_cache_stats
api-->get_version
api-->update_reminder
port@{shape: brace, label: "&nbsp; FastAPI exposes port 5559"}
```

---

### 🛠️ Environment Management

#### Python ([uv](https://github.com/astral-sh/uv "uv") manager):

|        📋 Task         |           🔧 Command            |
|:----------------------:|:-------------------------------:|
|         Update         |        `uv self update`         |
|        Install         |  `uv python install [version]`  |
|       Uninstall        | `uv python uninstall [version]` |
|          Pin           |    `uv python pin [version]`    |
| Create/Update Lockfile |            `uv lock`            |
|   Create/Update venv   |            `uv sync`            |
| Create/Update env venv |     `uv sync --extra [env]`     |
|   Installed Versions   |        `uv python list`         |

### 📦 Dependency Management

#### Installation & Removal:

|        📋 Task        |               🔧 Command               |
|:---------------------:|:--------------------------------------:|
|    Add Dependency     |           `uv add [package]`           |
|  Add env Dependency   |  `uv add --optional [env] [package]`   |
|   Remove Dependency   |         `uv remove [package]`          |
| Remove env Dependency | `uv remove --optional [env] [package]` |

#### Maintenance & Quality:

|     📋 Task      |               🔧 Command               |
|:----------------:|:--------------------------------------:|
|  Check Updates   |        `uv pip list --outdated`        |
|   Upgrade All    |          `uv lock --upgrade`           |
|       List       |             `uv pip list`              |
|    List Tree     |               `uv tree`                |
|    Hierarchy     |     `uv tree --package [package]`      |
| Hierarchy Parent | `uv tree --package [package] --invert` |
|   Clean Cache    |            `uv cache clean`            |

### 🧪 Development

#### Scripts:

 | 📋 Task / 📜 Script |      🔧 Command (Full)      | 🔧 Command (Short) |
 |:-------------------:|:---------------------------:|:------------------:|
 |        Lint         | `uv run pylint --verbose .` |    `./lint.sh`     |
 |        Test         |   `uv run behave --stop`    |    `./test.sh`     |

#### API Deployment:

| 📋 Task / 📜 Script | 🔧 Command (Full) | 🔧 Command (Short) |
|:-------------------:|:-----------------:|:------------------:|
<!-- markdownlint-disable-next-line MD060 -->
|         DEV         | `uv run fastapi dev api.py --port ` |     `./api.py`     |
|        PROD         | `uv run fastapi run api.py --port ` |      &mdash;       |

#### API Documentation:

|  📄 UI  |    🌐 URL    |
|:-------:|:------------:|
| Swagger | `/api/docs`  |
|  Redoc  | `/api/redoc` |

#### Docker Deployment:

| 📜 Script  |   🔧 Command   |
|:----------:|:--------------:|
|    Full    |  `./build.sh`  |
| Image Only | `./Dockerfile` |

#### Virtual Environment:

|     📋 Task     |         🔧 Command          |
|:---------------:|:---------------------------:|
|     Create      |          `uv venv`          |
| Create Specific |   `uv venv -p [version]`    |
|    Activate     | `source .venv/bin/activate` |
|   Deactivate    |        `deactivate`         |
