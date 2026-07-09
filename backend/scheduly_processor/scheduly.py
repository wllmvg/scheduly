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
    ("INFORMÁTIC", "A"): "INFORMÁTICA",
    ("INCIDENT", "ES"): "INCIDENTES",
    ("COG", "NOSCITIVA"): "COGNOSCITIVA",
    ("CUALITA", "TIVA"): "CUALITATIVA",
    ("INTE", "RVENCIÓN"): "INTERVENCIÓN",
}


def _reparar_palabras_cortadas(texto: str) -> str:
    """
    Repara espacios incorrectos introducidos por pdfplumber cuando una palabra
    queda partida dentro de la misma línea, usando ÚNICAMENTE un diccionario
    de fragmentos conocidos (FRAGMENTOS_UNIDOS).

    Deliberadamente NO se usa una heurística genérica tipo "palabra larga +
    fragmento corto = unir", porque eso produce falsos positivos: pega
    palabras que en realidad son distintas y van separadas (ej. "PSICOLOGÍA"
    + "SOCIAL" -> "PSICOLOGÍASOCIAL", cuando debían quedar separadas), o
    falla cuando el primer fragmento es corto (ej. "COG" + "NOSCITIVA").

    Cuando aparezca un nuevo caso de palabra cortada en un horario nuevo,
    agrégalo como tupla a FRAGMENTOS_UNIDOS.

    Ejemplos ya cubiertos:
        INFORMÁTIC A  -> INFORMÁTICA
        INCIDENT ES   -> INCIDENTES
        PROGRAMACIÓ N -> PROGRAMACIÓN
        COMPUTACI ÓN  -> COMPUTACIÓN
        COG NOSCITIVA -> COGNOSCITIVA
        CUALITA TIVA  -> CUALITATIVA
        INTE RVENCIÓN -> INTERVENCIÓN
    """

    texto = re.sub(r"\s+", " ", texto).strip()

    for (a, b), unido in FRAGMENTOS_UNIDOS.items():
        texto = re.sub(
            rf"\b{re.escape(a)}\s+{re.escape(b)}\b",
            unido,
            texto,
            flags=re.IGNORECASE,
        )

    return texto


# ---------------------------------------------------------------------------
# 0.1 REPARACIÓN DE NÚMEROS ROMANOS PEGADOS ("INGLESVII" -> "INGLES VII")
# ---------------------------------------------------------------------------
# Este es el problema inverso al del wrap: aquí el PDF entrega el texto SIN
# ningún espacio en absoluto entre el nombre de la asignatura y su nivel en
# números romanos. Solo se aplica sobre "asignatura", nunca sobre "aula".

# Ordenados de más largo a más corto para que el regex intente primero el
# numeral más largo y no corte "VIII" quedándose solo con "V".
_ROMANOS_ORDENADOS = sorted(
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"],
    key=len, reverse=True,
)

# Palabra (4+ letras) pegada directamente a un numeral romano al final del
# token, sin espacio entre medio. El prefijo es no-goloso para que el motor
# vaya alargándolo hasta encontrar el sufijo romano correcto.
_PATRON_ROMANO_PEGADO = re.compile(
    r"\b([A-ZÁÉÍÓÚÜÑ]{4,}?)(" + "|".join(_ROMANOS_ORDENADOS) + r")\b"
)


def _separar_romanos_pegados(texto: str) -> str:
    """'INGLESVII' -> 'INGLES VII'. Solo debe aplicarse a asignatura."""
    def _sep(m):
        return f"{m.group(1)} {m.group(2)}"
    return _PATRON_ROMANO_PEGADO.sub(_sep, texto)


# ---------------------------------------------------------------------------
# 0.2 NORMALIZACIÓN DE AULAS VIRTUALES ("AULAV-111" -> "VIRTUAL")
# ---------------------------------------------------------------------------
def _normalizar_aula(aula: str) -> str:
    """
    Repara el espacio faltante entre 'AULA' y el código de salón
    ('AULAV-111' -> 'AULA V-111'), y si el código de salón empieza con 'V'
    (aula virtual), reemplaza el valor completo por 'VIRTUAL'.
    """
    aula = aula.strip()
    if not aula:
        return aula

    # separar "AULA" pegado al código, si aplica
    aula_reparada = re.sub(r"^AULA(?=[A-Z0-9])", "AULA ", aula, flags=re.IGNORECASE)

    # aislar el código de salón (quitando el prefijo "AULA " si está presente)
    codigo = re.sub(r"^AULA\s+", "", aula_reparada, flags=re.IGNORECASE).strip()

    if codigo and codigo[0].upper() == "V":
        return "VIRTUAL"

    return aula_reparada


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
    # separar por cada ocurrencia de un código tipo "123456-X:", "1234-X:"
    # o con sufijo de varias letras, ej. "9317-MVI:" (modalidad virtual)
    partes = re.split(r"(?=(?:^|(?<=\s))\d{3,6}-?[A-Z]{1,4}:)", texto)
    for parte in partes:
        parte = parte.strip()
        if not parte:
            continue
        m = re.match(r"(\d{3,6}-?[A-Z]{1,4}):\s*(.*?)\s*Aula:\s*(.*)", parte)
        if m:
            codigo, asignatura, aula = m.groups()
        else:
            # sin "Aula:" -> todo es asignatura
            m2 = re.match(r"(\d{3,6}-?[A-Z]{1,4}):\s*(.*)", parte)
            if m2:
                codigo, asignatura, aula = m2.group(1), m2.group(2), ""
            else:
                codigo, asignatura, aula = "", parte, ""

        asignatura = _reparar_palabras_cortadas(_clean(asignatura.strip()))
        asignatura = _separar_romanos_pegados(asignatura)

        aula = _reparar_palabras_cortadas(_clean(aula.strip()))
        aula = _normalizar_aula(aula)

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
            r'^\d{3,6}-?[A-Z]{1,4}\s*:\s*',
            '',
            asignatura,
            flags=re.IGNORECASE
        ).strip()
        asignatura = re.sub(
            r'\b\d{3,6}-?[A-Z]{1,4}:\s*',
            '',
            asignatura,
            flags=re.IGNORECASE
        ).strip()

        es_virtual = aula.upper() == "VIRTUAL"

        if es_virtual:
            summary = f"VIRTUAL - {asignatura}"
        elif aula:
            summary = f"{aula}: {asignatura}"
        else:
            summary = asignatura

        descripcion = ev["codigo"]

        lines.append("BEGIN:VEVENT")
        lines.append(f"UID:scheduly-{idx}-{dtstart.strftime('%Y%m%dT%H%M%S')}@scheduly")
        lines.append(f"DTSTAMP:{now_stamp}")
        lines.append(f"DTSTART:{dtstart.strftime('%Y%m%dT%H%M%S')}")
        lines.append(f"DTEND:{dtend.strftime('%Y%m%dT%H%M%S')}")
        lines.append(f"RRULE:FREQ=WEEKLY;UNTIL={until}")
        lines.append(_fold_line(f"SUMMARY:{summary}"))
        if aula and not es_virtual:
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