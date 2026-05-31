# ![Mɪɴᴅɜʀ (Backend)](../frontend/public/mind3r.webp) Mɪɴᴅɜʀ (Backend)

### Reminders <!-- markdownlint-disable-line MD001 -->

---

![Backend](https://img.shields.io/badge/Backend-$_version-chocolate?style=plastic&logo=docker "Backend")

![Behave](https://img.shields.io/badge/Behave-$_behave-informational?style=plastic "Behave") &nbsp;
![FastAPI](https://img.shields.io/badge/FastAPI-$_fastapi-informational?style=plastic&logo=fastapi "FastAPI") &nbsp;
![Peewee](https://img.shields.io/badge/Peewee-$_peewee-informational?style=plastic "Peewee") &nbsp; <!-- markdownlint-disable-line MD013 -->
![Pydantic](https://img.shields.io/badge/Pydantic-$_pydantic-informational?style=plastic&logo=pydantic "Pydantic") &nbsp;
![uv](https://img.shields.io/badge/uv-$_uv-informational?style=plastic&logo=uv "uv")

![Coverage](https://img.shields.io/badge/Coverage-$_coverage%25-success?style=plastic "Coverage")

---

### 🏗️ Architecture

#### API Structure:

```mermaid
flowchart TD
api@{shape: rect, label: "/api"}
add_reminder[["`/add`"]]
get_cache_stats[["`/cache`"]]
delete_reminder[["`/delete/*[pk]*`"]]
get_all_reminders[["`/get`"]]
get_one_reminder[["`/get/*[pk]*`"]]
update_reminder[["`/update/*[pk]*`"]]
get_version[["`/version`"]]
api-->add_reminder
api-->get_cache_stats
api-->delete_reminder
api-->get_all_reminders
api-->get_one_reminder
api-->update_reminder
api-->get_version
port@{shape: brace, label: "&nbsp; FastAPI exposes port $_backendPort"}
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
|         DEV         | `uv run fastapi dev api.py --port $_port` |     `./api.py`     |
|        PROD         | `uv run fastapi run api.py --port $_port` |      &mdash;       |

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
