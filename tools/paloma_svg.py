"""Genera el SVG de la paloma de la entrada (vista lateral, alas arriba; el CSS hace el aleteo)."""


def ala(clase, relleno, borde, extra=''):
    # Plumas primarias en abanico desde la punta del ala, secundarias más cortas y cobertoras redondeadas.
    primarias = ''.join(
        f'<ellipse cx="0" cy="-{l}" rx="{w}" ry="{l}" transform="translate(84 42) rotate({a})"/>'
        for a, l, w in [(-78, 34, 6.5), (-62, 40, 7), (-46, 44, 7.5), (-30, 44, 7.5), (-15, 40, 7.5), (0, 34, 7.5)])
    secundarias = ''.join(
        f'<ellipse cx="0" cy="-{l}" rx="7.5" ry="{l}" transform="translate({x} {y}) rotate({a})"/>'
        for x, y, a, l in [(96, 50, 6, 26), (104, 56, 14, 22), (110, 62, 22, 17)])
    cobertoras = '<path d="M118 74 C108 58 96 46 80 40 C78 30 92 26 104 34 C116 42 124 56 124 70 Z"/>'
    return (f'<g class="ala {clase}"{extra}><g fill="{relleno}" stroke="{borde}" stroke-width="1">'
            f'{primarias}{secundarias}</g><g fill="{relleno}">{cobertoras}</g></g>')


def paloma(sufijo=''):
    s = sufijo
    return f'''<svg class="paloma" viewBox="0 -20 210 140" aria-hidden="true">
        <defs>
          <linearGradient id="pl{s}-cuerpo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3f7fa"/><stop offset="1" stop-color="#c9d7e3"/></linearGradient>
          <linearGradient id="pl{s}-ala" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f4f8fb"/><stop offset="1" stop-color="#d3e0ea"/></linearGradient>
          <radialGradient id="pl{s}-brillo" cx=".65" cy=".3" r=".6"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        </defs>
        <g transform="translate(-12 -6)">{ala('ala-lejos', '#d7e2eb', '#b9cad8')}</g>
        <g fill="url(#pl{s}-cuerpo)" stroke="#c4d3df" stroke-width="1">
          <ellipse cx="0" cy="0" rx="26" ry="7" transform="translate(40 86) rotate(-14)"/>
          <ellipse cx="0" cy="0" rx="28" ry="7.5" transform="translate(38 88) rotate(0)"/>
          <ellipse cx="0" cy="0" rx="26" ry="7" transform="translate(40 90) rotate(13)"/>
        </g>
        <path d="M34 86 C48 70 76 60 110 60 C138 60 160 66 170 78 C158 94 126 100 94 100 C66 100 46 96 34 86 Z" fill="url(#pl{s}-cuerpo)"/>
        <ellipse cx="128" cy="76" rx="34" ry="18" fill="url(#pl{s}-brillo)"/>
        <ellipse cx="154" cy="74" rx="17" ry="12" fill="#fbfdfe"/>
        <circle cx="167" cy="68" r="13" fill="#ffffff"/>
        <path d="M178 65.5 C184 66 189 68.5 191 71 C187 72.5 182 73.5 178 73 Z" fill="#e7b48a"/>
        <path d="M178 66 C180 67.5 180 71 178 72.5" stroke="#cf9a72" stroke-width=".8" fill="none"/>
        <circle cx="171" cy="65.5" r="2.1" fill="#232d35"/>
        <circle cx="171.7" cy="64.9" r=".6" fill="#ffffff"/>
        <path d="M70 96 C92 94 120 90 140 84" stroke="#c9d7e3" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        {ala('ala-cerca', f'url(#pl{s}-ala)', '#c3d3e0')}
      </svg>'''


if __name__ == '__main__':
    print(paloma())
