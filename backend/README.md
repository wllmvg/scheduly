# Scheduly Backend

Converts UDES schedule PDFs into ICS calendar files.

## Install

```bash
pip install -r requirements.txt
```

## Run

```bash
python api/process.py
```

## Endpoint

POST

```http
/api/process
```

FormData:

```text
file -> horario.pdf
```