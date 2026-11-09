#!/usr/bin/env python3
"""Writes tests/vectors.json from a separate Python implementation of each formula.

The JavaScript is tested against these values, so a typing error in one language
is caught by the other. Both come from the same published coefficients, so this
does not replace pharmacist review of those coefficients.
"""
import json
import math
import pathlib


def ckd_cr(age, scr, sex):
    k, a, s = (0.7, -0.241, 1.012) if sex == "F" else (0.9, -0.302, 1.0)
    r = scr / k
    return 142 * min(r, 1) ** a * max(r, 1) ** -1.2 * 0.9938 ** age * s


def ckd_cys(age, cys, sex):
    r = cys / 0.8
    return 133 * min(r, 1) ** -0.499 * max(r, 1) ** -1.328 * 0.996 ** age * (0.932 if sex == "F" else 1)


def ckd_both(age, scr, cys, sex):
    k, a, s = (0.7, -0.219, 0.963) if sex == "F" else (0.9, -0.144, 1.0)
    r, c = scr / k, cys / 0.8
    return 135 * min(r, 1) ** a * max(r, 1) ** -0.544 * min(c, 1) ** -0.323 * max(c, 1) ** -0.778 * 0.9961 ** age * s


def ekfc(ratio, age):
    return 107.3 * ratio ** (-0.322 if ratio < 1 else -1.132) * (1 if age <= 40 else 0.99 ** (age - 40))


def ekfc_q(age, sex):
    if age > 25:
        return 62 if sex == "F" else 80
    if sex == "F":
        return math.exp(3.08 + 0.177 * age - 0.223 * math.log(age) - 0.00596 * age ** 2 + 0.0000686 * age ** 3)
    return math.exp(3.2 + 0.259 * age - 0.543 * math.log(age) - 0.00763 * age ** 2 + 0.000079 * age ** 3)


def ekfc_cr(age, scr, sex):
    return ekfc(scr * 88.4 / ekfc_q(age, sex), age)


def ekfc_cys(age, cys):
    return ekfc(cys / (0.83 if age <= 50 else 0.83 + 0.005 * (age - 50)), age)


def u25_cr_k(age, sex):
    if age < 12:
        return (36.1 if sex == "F" else 39.0) * 1.008 ** (age - 12)
    if age < 18:
        return 36.1 * 1.023 ** (age - 12) if sex == "F" else 39.0 * 1.045 ** (age - 12)
    return 41.4 if sex == "F" else 50.8


def u25_cys_k(age, sex):
    if sex == "F":
        if age < 12:
            return 79.9 * 1.004 ** (age - 12)
        return 79.9 * 0.974 ** (age - 12) if age < 18 else 68.3
    if age < 15:
        return 87.2 * 1.011 ** (age - 15)
    return 87.2 * 0.96 ** (age - 15) if age < 18 else 77.1


def jelliffe(age, weight, earlier, latest, days, sex):
    production = weight * (25.3 - 0.175 * age) if sex == "F" else weight * (29.3 - 0.203 * age)
    used = latest if latest > earlier else (earlier + latest) / 2
    return (production - 0.6 * weight * 10 * (latest - earlier) / days) * 100 / (used * 1440)


def salazar(age, kg, cm, scr, sex):
    m = cm / 100
    if sex == "F":
        return (146 - age) * (0.287 * kg + 9.74 * m ** 2) / (60 * scr)
    return (137 - age) * (0.285 * kg + 12.1 * m ** 2) / (51 * scr)


rows = []
for sex in ("M", "F"):
    for age in (18, 40, 41, 50, 51, 65, 90):
        for scr in (0.4, 0.7, 0.9, 1.0, 2.5, 8.0):
            rows.append({"fn": "ckdEpiCr2021", "args": [age, scr, sex], "expected": ckd_cr(age, scr, sex)})
            rows.append({"fn": "ekfcCr", "args": [age, scr, sex], "expected": ekfc_cr(age, scr, sex)})
            for cys in (0.5, 0.8, 1.6, 4.0):
                rows.append({"fn": "ckdEpiCrCys2021", "args": [age, scr, cys, sex], "expected": ckd_both(age, scr, cys, sex)})
        for cys in (0.5, 0.8, 1.6, 4.0):
            rows.append({"fn": "ckdEpiCys2012", "args": [age, cys, sex], "expected": ckd_cys(age, cys, sex)})
            rows.append({"fn": "ekfcCys", "args": [age, cys], "expected": ekfc_cys(age, cys)})
    for age in (1, 5, 11.9, 12, 14.9, 15, 17.9, 18, 25):
        rows.append({"fn": "u25CrK", "args": [age, sex], "expected": u25_cr_k(age, sex)})
        rows.append({"fn": "u25CysK", "args": [age, sex], "expected": u25_cys_k(age, sex)})
    for age in (2, 10, 25):
        rows.append({"fn": "ekfcCr", "args": [age, 0.6, sex], "expected": ekfc_cr(age, 0.6, sex)})
    for earlier, latest, days in ((1.0, 1.0, 1), (1.0, 1.8, 2), (3.0, 2.0, 1)):
        rows.append({"fn": "jelliffe", "args": [60, 70, earlier, latest, days, sex], "expected": jelliffe(60, 70, earlier, latest, days, sex)})
    rows.append({"fn": "salazarCorcoran", "args": [45, 130, 170, 1.1, sex], "expected": salazar(45, 130, 170, 1.1, sex)})

out = pathlib.Path(__file__).with_name("vectors.json")
out.write_text(json.dumps(rows, indent=0) + "\n")
print(f"{len(rows)} vectors written")
