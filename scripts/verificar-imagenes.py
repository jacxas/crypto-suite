#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Inventario y verificacion de imagenes para crypto-suite.

Para que no vuelvas a perder imagenes sin enterarte: este script recorre todas
las imagenes del proyecto, guarda su tamano y su hash, y en cada ejecucion
posterior te dice que se ha perdido, que ha cambiado y que es nuevo.

Uso:
    python scripts/verificar-imagenes.py            # crea o verifica el inventario
    python scripts/verificar-imagenes.py --regen    # vuelve a fijar el estado actual

El inventario queda en INVENTARIO-IMAGENES.txt, en la raiz del proyecto.
Copia ese fichero junto al repo: sirve para comprobar, tras cada push, que
GitHub tiene exactamente las mismas imagenes.
"""

import hashlib
import os
import sys

RAIZ = r"H:\Users\JACXAS\Desktop\proyectos\Nueva carpeta\crypto-suite"
INVENTARIO = os.path.join(RAIZ, "INVENTARIO-IMAGENES.txt")

EXCLUIR_DIR = ("node_modules", ".git", "dist", "build", "cache", "artifacts", ".deps")
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico", ".avif")


def ruta_relativa(ruta):
    return os.path.relpath(ruta, RAIZ).replace(os.sep, "/")


def recorrer():
    encontrados = {}
    for dirpath, dirnames, filenames in os.walk(RAIZ):
        dirnames[:] = [d for d in dirnames if d not in EXCLUIR_DIR]
        for nombre in filenames:
            if nombre.lower().endswith(EXTENSIONES):
                ruta = os.path.join(dirpath, nombre)
                try:
                    datos = open(ruta, "rb").read()
                except OSError:
                    continue
                encontrados[ruta_relativa(ruta)] = (
                    len(datos),
                    hashlib.sha256(datos).hexdigest()[:16],
                )
    return encontrados


def leer_inventario():
    if not os.path.exists(INVENTARIO):
        return None
    previos = {}
    with open(INVENTARIO, "r", encoding="utf-8") as fh:
        for linea in fh:
            partes = linea.rstrip("\n").split("  ")
            if len(partes) >= 3 and partes[0].isdigit():
                previos[partes[2]] = (int(partes[0]), partes[1])
    return previos


def escribir_inventario(actuales):
    lineas = [
        "INVENTARIO DE IMAGENES - crypto-suite",
        "=" * 78,
        "Comprueba que GitHub tiene lo mismo: descarga el repo aparte y compara.",
        "",
        "        bytes  hash(16)          ruta",
        "-" * 78,
    ]
    total = 0
    for ruta in sorted(actuales):
        tam, h = actuales[ruta]
        total += tam
        lineas.append("%13d  %s  %s" % (tam, h, ruta))
    lineas.append("-" * 78)
    lineas.append("TOTAL: %d imagenes, %.2f MB" % (len(actuales), total / 1048576))
    with open(INVENTARIO, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lineas) + "\n")


def main():
    actuales = recorrer()
    print("Imagenes encontradas en el proyecto: %d" % len(actuales))

    # Las dos carpetas que importan, con su recuento.
    for etiqueta, sub in (
        ("assets/tokens        (imagenes NFT)", "assets/tokens"),
        ("frontend/public/tokens (suite A-Suite)", "frontend/public/tokens"),
    ):
        cuantas = sum(1 for r in actuales if r.startswith(sub + "/"))
        print("   %-40s %d" % (etiqueta, cuantas))

    regenerar = "--regen" in sys.argv
    previos = leer_inventario()

    if previos is None:
        escribir_inventario(actuales)
        print("\nInventario creado: %s" % INVENTARIO)
        return

    if regenerar:
        escribir_inventario(actuales)
        print("\nInventario regenerado con el estado actual.")
        return

    perdidos = sorted(set(previos) - set(actuales))
    nuevos = sorted(set(actuales) - set(previos))
    cambiados = sorted(
        r for r in set(previos) & set(actuales) if previos[r][1] != actuales[r][1]
    )

    print("\n--- Resultado de la verificacion ---")
    print("PERDIDOS : %d" % len(perdidos))
    for r in perdidos[:30]:
        print("    - %s" % r)
    print("CAMBIADOS: %d" % len(cambiados))
    for r in cambiados[:30]:
        print("    ~ %s" % r)
    print("NUEVOS   : %d" % len(nuevos))
    for r in nuevos[:30]:
        print("    + %s" % r)

    if not (perdidos or cambiados or nuevos):
        print("\nOK: las imagenes estan exactamente como en el inventario.")


if __name__ == "__main__":
    main()
