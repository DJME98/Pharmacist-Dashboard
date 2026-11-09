#!/usr/bin/env python3
"""Writes tests/vanco_vectors.json with a separate solver (needs numpy and scipy).

The app uses an exact formula and its own optimizer. This script integrates the
differential equations numerically and optimizes with SciPy, so a mistake in the
app's mathematics shows up as a disagreement.
"""
import json
import math
import pathlib

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import minimize

OM = [math.log(1 + c * c) for c in (0.398, 0.816, 0.571)]
ADD, PROP = 3.4, 0.227


def typical(crcl, kg):
    return dict(CL=4.5 * (crcl / 120) ** 0.8, V1=58.4 * kg / 70, V2=38.4 * kg / 70, Q=6.5)


def conc(p, doses, t_obs):
    k10, k12, k21 = p["CL"] / p["V1"], p["Q"] / p["V1"], p["Q"] / p["V2"]
    edges = sorted({0.0, t_obs} | {d[0] for d in doses if d[0] < t_obs} | {d[0] + d[2] for d in doses if d[0] + d[2] < t_obs})
    y = np.zeros(2)
    for a, b in zip(edges, edges[1:]):
        mid = (a + b) / 2
        rate = sum(d[1] / d[2] for d in doses if d[0] < mid < d[0] + d[2])
        fn = lambda _t, s: [rate - (k10 + k12) * s[0] + k21 * s[1], k12 * s[0] - k21 * s[1]]
        y = solve_ivp(fn, (a, b), y, method="LSODA", rtol=1e-10, atol=1e-10).y[:, -1]
    return float(y[0] / p["V1"])


def indiv(tv, eta):
    return dict(CL=tv["CL"] * math.exp(eta[0]), V1=tv["V1"] * math.exp(eta[1]), V2=tv["V2"] * math.exp(eta[2]), Q=tv["Q"])


def history(load, dose, tau, hours, count, after):
    doses = [(i * tau, load if i == 0 and load else dose, hours) for i in range(count)]
    return doses, (count - 1) * tau + after


def fit(tv, doses, t_obs, level):
    def obj(eta):
        pred = conc(indiv(tv, eta), doses, t_obs)
        var = ADD ** 2 + (PROP * pred) ** 2
        return sum(e * e / o for e, o in zip(eta, OM)) + (level - pred) ** 2 / var + math.log(var)

    best = None
    for start in ([0, 0, 0], [-0.5, 0.2, 0], [0.5, -0.2, 0]):
        r = minimize(obj, start, method="L-BFGS-B", options=dict(ftol=1e-12, gtol=1e-7))
        r = minimize(obj, r.x, method="Nelder-Mead", options=dict(xatol=1e-6, fatol=1e-10, maxiter=4000))
        if best is None or r.fun < best.fun:
            best = r
    return best


CASES = [
    dict(crcl=80, kg=80, load=None, dose=1000, tau=12, hours=1, count=4, after=11.5, level=14.0),
    dict(crcl=80, kg=80, load=2000, dose=1250, tau=12, hours=1.5, count=3, after=11, level=18.5),
    dict(crcl=45, kg=95, load=None, dose=1000, tau=24, hours=1, count=2, after=23, level=22.0),
    dict(crcl=120, kg=70, load=None, dose=1000, tau=8, hours=1, count=5, after=7.5, level=9.0),
    dict(crcl=25, kg=60, load=1500, dose=750, tau=24, hours=1, count=2, after=12, level=30.0),
    dict(crcl=100, kg=150, load=None, dose=2000, tau=12, hours=2, count=1, after=6, level=20.0),
]

rows = []
for c in CASES:
    tv = typical(c["crcl"], c["kg"])
    doses, t_obs = history(c["load"], c["dose"], c["tau"], c["hours"], c["count"], c["after"])
    r = fit(tv, doses, t_obs, c["level"])
    m = indiv(tv, r.x)
    rows.append({**c, "popPred": conc(tv, doses, t_obs), "objective": r.fun, "eta": list(map(float, r.x)),
                 "cl": m["CL"], "fitPred": conc(m, doses, t_obs)})

out = pathlib.Path(__file__).with_name("vanco_vectors.json")
out.write_text(json.dumps(rows, indent=1) + "\n")
print(json.dumps([{k: round(v, 4) if isinstance(v, float) else v for k, v in r.items() if k in ("cl", "fitPred", "popPred", "objective")} for r in rows]))
