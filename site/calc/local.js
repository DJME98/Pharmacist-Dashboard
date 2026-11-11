// Local anesthetic maximum doses and cumulative fraction of maximum.
// The labels and the ASRA advisory state that local anesthetic toxicity is additive.

// Lean body weight (Janmahasatian 2005).
export function leanBodyWeight(kg, cm, sex) {
  const bmi = kg / (cm / 100) ** 2;
  return sex === 'F' ? (9270 * kg) / (8780 + 244 * bmi) : (9270 * kg) / (6680 + 216 * bmi);
}

// Maximum single dose in mg for one agent. Returns null when the label gives no usable limit for this patient.
export function maxDose(agent, kg, ageY) {
  const child = ageY !== null && ageY !== undefined && ageY < 18;
  if (agent.minAge && ageY !== null && ageY !== undefined && ageY < agent.minAge) return { mg: null, basis: 'not for this age' };
  const perKg = child && agent.pedsPerKg ? agent.pedsPerKg : agent.perKg;
  if (agent.capAboveKg) {
    if (kg >= agent.capAboveKg) return { mg: agent.cap, basis: `${agent.cap} mg cap at ${agent.capAboveKg} kg or more` };
    return { mg: perKg * kg, basis: `${perKg} mg/kg` };
  }
  if (perKg && agent.cap) {
    const byKg = perKg * kg;
    return byKg <= agent.cap ? { mg: byKg, basis: `${perKg} mg/kg` } : { mg: agent.cap, basis: `${agent.cap} mg cap` };
  }
  if (perKg) return { mg: perKg * kg, basis: `${perKg} mg/kg` };
  return { mg: agent.cap, basis: `${agent.cap} mg label maximum (no mg/kg limit)` };
}

export const mgFrom = (pct, mL) => pct * 10 * mL;

// doses: [{ agent, mg }]. Returns each dose's fraction of its own maximum and the total.
export function cumulative(doses, kg, ageY) {
  const rows = doses.map((d) => {
    const max = maxDose(d.agent, kg, ageY);
    return { ...d, max, fraction: max.mg ? d.mg / max.mg : null };
  });
  const total = rows.reduce((s, r) => s + (r.fraction ?? 0), 0);
  return { rows, total, remaining: Math.max(0, 1 - total) };
}
