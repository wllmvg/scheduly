import re
import io
from datetime import datetime, timedelta, date
import pdfplumber

DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
DIA_NUM = {d: i for i, d in enumerate(DIAS)}


# ---------------------------------------------------------------------------
# 0. REPARACIÓN DE PALABRAS CORTADAS POR EL WRAP DEL PDF
# ---------------------------------------------------------------------------
# El PDF de UDES envuelve el texto de cada celda en líneas de ancho fijo.
# Cuando una palabra es más larga que ese ancho, la corta a la fuerza sin
# guion (ej. "DESARROLLO" -> "DESARROLL" + "O" en la línea siguiente).
# Al unir esas líneas con espacios, el corte queda indistinguible de un
# espacio real. Estas reglas reparan los casos más comunes.

# Pares de fragmentos completos conocidos (agrega aquí los que detectes en
# nuevos horarios). Las claves van en mayúsculas, tal como salen del PDF.
FRAGMENTOS_UNIDOS = {
    ("MULTIPLATA", "FORMA"): "MULTIPLATAFORMA",
    ("COMPUTACI", "ÓN"): "COMPUTACIÓN",
    ("PROGRAMACI", "ÓN"): "PROGRAMACIÓN",
    ("ADMINISTRACI", "ÓN"): "ADMINISTRACIÓN",
    ("INVESTIGACI", "ÓN"): "INVESTIGACIÓN",
    ("ORGANIZACI", "ÓN"): "ORGANIZACIÓN",
    ("COMUNICACI", "ÓN"): "COMUNICACIÓN",
    ("EDUCACI", "ÓN"): "EDUCACIÓN",
    ("GESTI", "ÓN"): "GESTIÓN",
    ("FORMACI", "ÓN"): "FORMACIÓN",
}

# Palabras conectoras cortas del español que NUNCA deben pegarse a la
# palabra anterior, aunque coincidan con el patrón de "fragmento corto".
_CONECTORES = {
    "DE", "Y", "EN", "EL", "LA", "LOS", "LAS", "DEL", "AL",
    "SU", "SUS", "UN", "UNA", "UNOS", "UNAS", "CON", "SIN", "POR",
    "PARA", "QUE", "SE", "SI", "NO", "LE", "LES",
}

# Palabra larga (4+) + espacio + fragmento corto (1-7), ambos en mayúsculas.
_PATRON_CORTE = re.compile(
    r"\b([A-ZÁÉÍÓÚÜÑ]{4,})\s+([A-ZÁÉÍÓÚÜÑ]{1,7})\b"
)


def _reparar_palabras_cortadas(texto: str) -> str:
    """
    Repara espacios incorrectos introducidos por pdfplumber cuando una palabra
    queda partida dentro de la misma línea.

    Ejemplos:
        INFORMÁTIC A  -> INFORMÁTICA
        INCIDENT ES   -> INCIDENTES
        PROGRAMACIÓ N -> PROGRAMACIÓN
        COMPUTACI ÓN  -> COMPUTACIÓN
    """

    texto = re.sub(r"\s+", " ", texto).strip()

    # 1. Fragmentos conocidos exactos (máxima prioridad, cero riesgo de
    #    falso positivo). Agrega aquí los que detectes en nuevos horarios.
    for (a, b), unido in FRAGMENTOS_UNIDOS.items():
        texto = re.sub(
            rf"\b{re.escape(a)}\s+{re.escape(b)}\b",
            unido,
            texto,
            flags=re.IGNORECASE,
        )

    # 2. Heurística general: una palabra "larga" (4+ letras) seguida de un
    #    fragmento corto (1-7 letras) que NO es una palabra conectora real
    #    en español se asume como la cola de una palabra cortada por el
    #    wrap del PDF, y se pega. No usamos lookbehind de ancho variable
    #    porque no es portable entre versiones del motor `re`.
    def _merge(match):
        primero, segundo = match.group(1), match.group(2)
        if segundo.upper() in _CONECTORES:
            return match.group(0)
        return primero + segundo

    texto = _PATRON_CORTE.sub(_merge, texto)

    return texto

# ---------------------------------------------------------------------------
# 1. EXTRACCIÓN DE LA GRILLA DE HORARIO
# ---------------------------------------------------------------------------
def extraer_eventos(pdf_path):
    """Recorre todas las páginas y extrae bloques de clase de la tabla principal."""
    eventos = []
    header_actual = None
    franjas_orden = []  # lista de (inicio_raw, fin_raw) en orden de aparición

    # --- Primero: recolectar todas las filas en orden, para construir el mapa de franjas ---
    filas_totales = []  # (hora_raw, fila, header)

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tablas = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
            })
            for tabla in tablas:
                if not tabla or not tabla[0]:
                    continue
                header = [_clean(c) for c in tabla[0]]

                if any(d in header for d in DIAS):
                    header_actual = header
                    filas = tabla[1:]
                elif header_actual and _parsear_hora(_clean(tabla[0][0])):
                    header = header_actual
                    filas = tabla
                else:
                    continue

                for row in filas:
                    hora_raw = _clean(row[0])
                    horas = _parsear_hora(hora_raw)
                    if not horas:
                        continue
                    if horas not in franjas_orden:
                        franjas_orden.append(horas)
                    filas_totales.append((horas, row, header))

    # --- Construir mapa franja_raw -> (inicio_24h, fin_24h) detectando el salto AM->PM ---
    mapa_horas = _construir_mapa_horas(franjas_orden)

    # --- Ahora generar eventos con horas ya convertidas a 24h ---
    for horas, row, header in filas_totales:
        col_dia = {i: h for i, h in enumerate(header) if h in DIA_NUM}
        inicio, fin = mapa_horas[horas]

        for col, dia in col_dia.items():
            if col >= len(row):
                continue
            celda = _clean(row[col])
            if not celda:
                continue
            for bloque in _parsear_celda(celda):
                bloque.update({"dia": dia, "inicio": inicio, "fin": fin})
                eventos.append(bloque)

    eventos = _fusionar_bloques_consecutivos(eventos)

    return eventos


def _construir_mapa_horas(franjas_orden):
    """
    Recibe la lista de franjas en el orden en que aparecen en el documento,
    p.ej. [('06:00','06:50'), ('06:50','07:40'), ..., ('11:50','12:40'),
           ('12:40','01:30'), ('01:30','02:20'), ..., ('09:20','10:05')]

    Convierte cada hora a formato 24h, detectando el cruce AM->PM:
    - Empieza asumiendo AM.
    - Si la hora de una franja es numéricamente MENOR que la hora de la
      franja anterior (p.ej. de 12:40 a 01:30), se activa PM para esa y
      las siguientes franjas, hasta que se detecte otro salto hacia atrás
      (cruce a la madrugada del día siguiente), que normalmente no aplica
      en horarios universitarios de un solo día.
    """
    mapa = {}
    es_pm = False
    anterior_h, anterior_m = None, None

    for (ini_raw, fin_raw) in franjas_orden:
        h_ini, m_ini = map(int, ini_raw.split(":"))
        h_fin, m_fin = map(int, fin_raw.split(":"))

        if anterior_h is not None:
            # comparar inicio de esta franja vs inicio de la anterior (en 12h)
            actual_val = h_ini * 60 + m_ini
            anterior_val = anterior_h * 60 + anterior_m
            if actual_val < anterior_val:
                es_pm = True

        anterior_h, anterior_m = h_ini, m_ini

        ini_24 = _to_24h(h_ini, m_ini, es_pm)
        fin_24 = _to_24h(h_fin, m_fin, es_pm)

        # si el fin "cruza" hacia el siguiente bloque PM (p.ej. 12:40 -> 01:30,
        # el fin 01:30 ya cae en PM aunque "es_pm" se active recién en esta franja)
        if not es_pm and fin_24 < ini_24:
            fin_24 = _to_24h(h_fin, m_fin, True)

        mapa[(ini_raw, fin_raw)] = (
            f"{ini_24[0]:02d}:{ini_24[1]:02d}",
            f"{fin_24[0]:02d}:{fin_24[1]:02d}",
        )

    return mapa


def _to_24h(h, m, es_pm):
    """Convierte hora en formato 12h (sin AM/PM explícito) a 24h."""
    if h == 12:
        h = 0  # 12:xx en notación de este PDF se trata como mediodía -> 12:xx PM
        es_pm = True
    if es_pm and h < 12:
        h += 12
    return (h, m)


def _fusionar_bloques_consecutivos(eventos, franjas_24h_orden=None):
    """
    Fusiona eventos consecutivos que son la MISMA clase (mismo día, código,
    asignatura y aula) en franjas horarias contiguas (fin de uno == inicio
    del siguiente), en un solo evento que abarca desde el inicio del primero
    hasta el fin del último. Itera hasta que no haya más fusiones posibles.
    """
    def _min(hhmm):
        h, m = map(int, hhmm.split(":"))
        return h * 60 + m

    por_dia = {}
    for ev in eventos:
        por_dia.setdefault(ev["dia"], []).append(ev)

    resultado = []
    for dia, evs in por_dia.items():
        evs_ordenados = sorted(evs, key=lambda e: _min(e["inicio"]))

        actual = None
        for ev in evs_ordenados:
            if actual is None:
                actual = dict(ev)
                continue

            mismo_bloque = (
                actual["codigo"] == ev["codigo"]
                and actual["asignatura"] == ev["asignatura"]
                and actual["aula"] == ev["aula"]
                and actual["fin"] == ev["inicio"]
            )

            if mismo_bloque:
                actual["fin"] = ev["fin"]
            else:
                resultado.append(actual)
                actual = dict(ev)

        if actual is not None:
            resultado.append(actual)

    return resultado


def _clean(text):
    if text is None:
        return ""

    return re.sub(r"\s+", " ", text).strip()


def _parsear_hora(hora_raw):
    """'06:00 - 06:50' -> ('06:00','06:50'). None si no aplica."""
    m = re.match(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", hora_raw)
    if not m:
        return None
    return m.group(1), m.group(2)


def _parsear_celda(texto):
    """
    Una celda puede tener MÁS DE UNA clase apiladas verticalmente.
    Patrón típico: '372905-B: ANTEPROYECTO Aula: 4-301'
    Puede repetirse varias veces dentro de la misma celda.
    """
    bloques = []
    # separar por cada ocurrencia de un código tipo "123456-X:" o "1234-X:"
    partes = re.split(r"(?=(?:^|(?<=\s))\d{3,6}-?[A-Z]:)", texto)
    for parte in partes:
        parte = parte.strip()
        if not parte:
            continue
        m = re.match(r"(\d{3,6}-?[A-Z]):\s*(.*?)\s*Aula:\s*(.*)", parte)
        if m:
            codigo, asignatura, aula = m.groups()
        else:
            # sin "Aula:" -> todo es asignatura
            m2 = re.match(r"(\d{3,6}-?[A-Z]):\s*(.*)", parte)
            if m2:
                codigo, asignatura, aula = m2.group(1), m2.group(2), ""
            else:
                codigo, asignatura, aula = "", parte, ""

        asignatura = _reparar_palabras_cortadas(_clean(asignatura.strip()))
        aula = _reparar_palabras_cortadas(_clean(aula.strip()))

        bloques.append({
            "codigo": codigo.replace(" ", ""),
            "asignatura": asignatura,
            "aula": aula,
        })
    return bloques


# ---------------------------------------------------------------------------
# 2. EXTRACCIÓN DE FECHAS POR ASIGNATURA (tabla docentes / fechas)
# ---------------------------------------------------------------------------
def extraer_fechas_por_codigo(pdf_path):
    """
    Recorre la tabla inferior 'Grupo / Asignatura / Docente / Fecha' (que en el
    PDF aparece en DOS columnas, izquierda y derecha) y construye un mapa:

        codigo_sin_guion -> (fecha_inicio, fecha_fin)

    Cada "fila visual" de esa tabla ocupa dos líneas de texto extraído:
      - La línea superior contiene las fechas de INICIO, en formato
        'YYYY-MM-DD a' (una para la columna izquierda y otra para la
        columna derecha).
      - La línea inferior contiene los códigos de Grupo (p.ej. '212501A',
        '9316I') y las fechas de FIN 'YYYY-MM-DD' (sin 'a' después).

    Esto permite que asignaturas que inician después del inicio oficial del
    semestre (p.ej. INGLES VI: 2026-02-09 a 2026-05-24) o que terminan antes
    del fin oficial (p.ej. EXCEL APLICADO AL ÁREA DE LA SALUD: 2026-02-02 a
    2026-03-29) usen su propio rango de fechas en lugar del rango general.

    Además calcula '__default__' como el rango más amplio observado
    (fecha mínima de inicio y fecha máxima de fin), para usarlo como
    respaldo si alguna asignatura no aparece en esta tabla.
    """
    rangos_por_codigo = {}

    re_ini = re.compile(r"(\d{4}-\d{2}-\d{2})\s*a\b")
    re_codigo = re.compile(r"\b(\d{4,6}[A-Z])\b")
    re_fin = re.compile(r"(\d{4}-\d{2}-\d{2})(?!\s*a\b)")

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if "Grupo" not in text or "Fecha" not in text:
                continue

            lines = text.split("\n")
            for i in range(len(lines) - 1):
                linea_arriba = lines[i]
                linea_abajo = lines[i + 1]

                inis = re_ini.findall(linea_arriba)
                codigos = re_codigo.findall(linea_abajo)
                fins = re_fin.findall(linea_abajo)

                if not inis or not codigos or not fins:
                    continue

                for codigo, ini_str, fin_str in zip(codigos, inis, fins):
                    try:
                        f_ini = datetime.strptime(ini_str, "%Y-%m-%d").date()
                        f_fin = datetime.strptime(fin_str, "%Y-%m-%d").date()
                    except ValueError:
                        continue
                    rangos_por_codigo[codigo] = (f_ini, f_fin)

    if rangos_por_codigo:
        f_ini_global = min(v[0] for v in rangos_por_codigo.values())
        f_fin_global = max(v[1] for v in rangos_por_codigo.values())
        rangos_por_codigo["__default__"] = (f_ini_global, f_fin_global)

    return rangos_por_codigo


# ---------------------------------------------------------------------------
# 3. GENERACIÓN DEL .ICS
# ---------------------------------------------------------------------------
DEFAULT_INICIO = date(2026, 2, 2)
DEFAULT_FIN = date(2026, 5, 31)


def _primera_fecha(dia_semana, fecha_inicio):
    delta = (DIA_NUM[dia_semana] - fecha_inicio.weekday()) % 7
    return fecha_inicio + timedelta(days=delta)


def _fold_line(line, limit=73):
    """RFC5545: las líneas largas se pliegan con salto + espacio."""
    if len(line) <= limit:
        return line
    out = line[:limit]
    rest = line[limit:]
    while rest:
        out += "\r\n " + rest[:limit - 1]
        rest = rest[limit - 1:]
    return out


def generar_ics(eventos, fechas_por_codigo):
    lines = []
    lines.append("BEGIN:VCALENDAR")
    lines.append("VERSION:2.0")
    lines.append("PRODID:-//Scheduly//ES")
    lines.append("CALSCALE:GREGORIAN")

    now_stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    for idx, ev in enumerate(eventos):
        codigo_key = ev["codigo"].replace("-", "")
        f_ini, f_fin = fechas_por_codigo.get(
            codigo_key, fechas_por_codigo.get("__default__", (DEFAULT_INICIO, DEFAULT_FIN))
        )

        fecha_evento = _primera_fecha(ev["dia"], f_ini)

        h_ini = datetime.strptime(ev["inicio"], "%H:%M").time()
        h_fin = datetime.strptime(ev["fin"], "%H:%M").time()

        dtstart = datetime.combine(fecha_evento, h_ini)
        dtend = datetime.combine(fecha_evento, h_fin)

        until = datetime.combine(f_fin, h_fin).strftime("%Y%m%dT%H%M%S")

        aula = _clean(ev["aula"])
        asignatura = _clean(ev["asignatura"])

        # Blindaje: por si el código de grupo quedó pegado al nombre de la
        # asignatura (código al inicio o en cualquier parte del texto).
        asignatura = re.sub(
            r'^\d{3,6}-?[A-Z]\s*:\s*',
            '',
            asignatura,
            flags=re.IGNORECASE
        ).strip()
        asignatura = re.sub(
            r'\b\d{3,6}-?[A-Z]:\s*',
            '',
            asignatura,
            flags=re.IGNORECASE
        ).strip()

        summary = f"{aula}: {asignatura}" if aula else asignatura
        descripcion = ev["codigo"]

        lines.append("BEGIN:VEVENT")
        lines.append(f"UID:scheduly-{idx}-{dtstart.strftime('%Y%m%dT%H%M%S')}@scheduly")
        lines.append(f"DTSTAMP:{now_stamp}")
        lines.append(f"DTSTART:{dtstart.strftime('%Y%m%dT%H%M%S')}")
        lines.append(f"DTEND:{dtend.strftime('%Y%m%dT%H%M%S')}")
        lines.append(f"RRULE:FREQ=WEEKLY;UNTIL={until}")
        lines.append(_fold_line(f"SUMMARY:{summary}"))
        if aula:
            lines.append(_fold_line(f"LOCATION:{aula}"))

        lines.append("BEGIN:VALARM")
        lines.append("ACTION:DISPLAY")
        lines.append(_fold_line(f"DESCRIPTION:{descripcion}"))
        lines.append("TRIGGER:-PT30M")
        lines.append("END:VALARM")

        lines.append("END:VEVENT")

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


# ---------------------------------------------------------------------------
# 4. PIPELINE COMPLETO
# ---------------------------------------------------------------------------
def procesar_pdf(pdf_path):
    eventos = extraer_eventos(pdf_path)
    fechas = extraer_fechas_por_codigo(pdf_path)
    return generar_ics(eventos, fechas)